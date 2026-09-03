#!/usr/bin/env node
"use strict";

/*
  Corrige APENAS memórias novas marcadas com:
    "corrigirOrtografia": true

  O script preserva o restante de memorias.js sem reformatar o arquivo.
  Palavras ou trechos entre {chaves} não são corrigidos; as chaves são
  removidas ao terminar para que não apareçam no site.
*/

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const argumentsList = process.argv.slice(2);
const argumentValue = (name) => {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : "";
};
const hasArgument = (name) => argumentsList.includes(name);

const root = path.resolve(argumentValue("--root") || path.join(__dirname, ".."));
const baseRef = argumentValue("--base");
const endpoint = argumentValue("--url") || "http://127.0.0.1:8081/v2/check";
const dryRun = hasArgument("--dry-run");
const memoriesFile = path.join(root, "memorias.js");
// "picky" habilita regras extras do LanguageTool para gramática e pontuação.
const languageToolLevel = "picky";
const maxReviewPasses = 3;
const markerName = "corrigirOrtografia";
const allowedIssueTypes = new Set([
  "misspelling",
  "grammar",
  "typographical",
  "duplication",
  "punctuation"
]);

// Evita que um palpite raro do corretor troque uma palavra por outra de
// significado diferente. Estes pares foram conferidos manualmente.
const trustedSpellingReplacements = new Map([
  ["defitivamente", "definitivamente"]
]);

const fail = (message) => {
  throw new Error(message);
};

const normalizeSpelling = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR");

const preserveReplacementCase = (original, replacement) => {
  if (!original) return replacement;

  const upper = original.toLocaleUpperCase("pt-BR");
  const lower = original.toLocaleLowerCase("pt-BR");
  if (original !== lower && original === upper) {
    return replacement.toLocaleUpperCase("pt-BR");
  }

  const first = original[0];
  if (
    first !== first.toLocaleLowerCase("pt-BR") &&
    first === first.toLocaleUpperCase("pt-BR")
  ) {
    return replacement[0].toLocaleUpperCase("pt-BR") + replacement.slice(1);
  }

  return replacement;
};

const safeReplacement = (match, original, issueType) => {
  const replacements = Array.isArray(match?.replacements)
    ? match.replacements
      .map((candidate) => candidate?.value)
      .filter((candidate) => typeof candidate === "string" && candidate)
    : [];

  if (issueType !== "misspelling") return replacements[0] || "";

  const trusted = trustedSpellingReplacements.get(
    original.toLocaleLowerCase("pt-BR")
  );
  if (trusted) return preserveReplacementCase(original, trusted);

  // Para ortografia, só aplicamos automaticamente trocas de acento ou caixa.
  // Outras sugestões podem ser palavras válidas, porém inadequadas ao contexto.
  const accentOnly = replacements.find(
    (candidate) => normalizeSpelling(candidate) === normalizeSpelling(original)
  );
  return accentOnly ? preserveReplacementCase(original, accentOnly) : "";
};

const isIdentifierStart = (character) => /[A-Za-z_$]/.test(character || "");
const isIdentifierPart = (character) => /[A-Za-z0-9_$]/.test(character || "");

const skipString = (source, start) => {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index + 1;
    index += 1;
  }

  fail("Uma string não foi fechada em memorias.js.");
};

const skipTrivia = (source, initialIndex, limit) => {
  let index = initialIndex;

  while (index < limit) {
    if (/\s/.test(source[index])) {
      index += 1;
      continue;
    }

    if (source[index] === "/" && source[index + 1] === "/") {
      const lineEnd = source.indexOf("\n", index + 2);
      index = lineEnd < 0 ? limit : lineEnd + 1;
      continue;
    }

    if (source[index] === "/" && source[index + 1] === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd < 0) fail("Um comentário não foi fechado em memorias.js.");
      index = commentEnd + 2;
      continue;
    }

    break;
  }

  return index;
};

const findMatching = (source, start, open, close, limit = source.length) => {
  if (source[start] !== open) {
    fail("Estrutura interna inválida em memorias.js.");
  }

  let depth = 1;
  let index = start + 1;

  while (index < limit) {
    const character = source[index];

    if (character === '"' || character === "'" || character === "`") {
      index = skipString(source, index);
      continue;
    }

    if (character === "/" && source[index + 1] === "/") {
      const lineEnd = source.indexOf("\n", index + 2);
      index = lineEnd < 0 ? limit : lineEnd + 1;
      continue;
    }

    if (character === "/" && source[index + 1] === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd < 0) fail("Um comentário não foi fechado em memorias.js.");
      index = commentEnd + 2;
      continue;
    }

    if (character === open) depth += 1;
    if (character === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }

    index += 1;
  }

  fail("Uma estrutura iniciada por " + open + " não foi fechada em memorias.js.");
};

const parseStringToken = (source, start) => {
  if (source[start] !== '"') {
    fail("Para a correção automática, titulo e texto devem usar aspas duplas.");
  }

  const end = skipString(source, start);
  const raw = source.slice(start, end);
  let value = "";

  try {
    value = JSON.parse(raw);
  } catch {
    fail("Existe uma string inválida em memorias.js.");
  }

  return { start, end, raw, value };
};

const parseValue = (source, start, limit) => {
  const valueStart = skipTrivia(source, start, limit);
  const character = source[valueStart];

  if (character === '"') {
    const stringToken = parseStringToken(source, valueStart);
    return {
      kind: "string",
      start: stringToken.start,
      end: stringToken.end,
      value: stringToken.value
    };
  }

  if (character === "{") {
    return {
      kind: "object",
      start: valueStart,
      end: findMatching(source, valueStart, "{", "}", limit)
    };
  }

  if (character === "[") {
    return {
      kind: "array",
      start: valueStart,
      end: findMatching(source, valueStart, "[", "]", limit)
    };
  }

  let end = valueStart;
  while (end < limit && source[end] !== "," && source[end] !== "}") {
    if (source[end] === '"' || source[end] === "'" || source[end] === "`") {
      end = skipString(source, end);
    } else {
      end += 1;
    }
  }

  const raw = source.slice(valueStart, end).trim();
  return {
    kind: raw === "true" || raw === "false" ? "boolean" : "other",
    start: valueStart,
    end,
    value: raw === "true" ? true : raw === "false" ? false : raw,
    raw
  };
};

const parseObjectProperties = (source, range) => {
  if (source[range.start] !== "{") {
    fail("Estrutura de memória inválida em memorias.js.");
  }

  const properties = new Map();
  let index = range.start + 1;

  while (index < range.end - 1) {
    index = skipTrivia(source, index, range.end - 1);
    if (source[index] === ",") {
      index += 1;
      continue;
    }
    if (index >= range.end - 1) break;

    let key = "";
    if (source[index] === '"') {
      const token = parseStringToken(source, index);
      key = token.value;
      index = token.end;
    } else if (isIdentifierStart(source[index])) {
      const keyStart = index;
      index += 1;
      while (isIdentifierPart(source[index])) index += 1;
      key = source.slice(keyStart, index);
    } else {
      fail("Não foi possível ler uma propriedade de uma memória em memorias.js.");
    }

    index = skipTrivia(source, index, range.end - 1);
    if (source[index] !== ":") {
      fail("Faltou ':' depois da propriedade " + JSON.stringify(key) + ".");
    }

    const value = parseValue(source, index + 1, range.end - 1);
    if (properties.has(key)) {
      fail("A propriedade " + JSON.stringify(key) + " está repetida em uma memória.");
    }
    properties.set(key, value);
    index = value.end;
  }

  return properties;
};

const findMemoryArray = (source) => {
  const declaration = /(?:const|let|var)\s+MEMORIAS\s*=\s*/.exec(source);
  if (!declaration) {
    fail("Não encontrei const MEMORIAS = [ ... ] em memorias.js.");
  }

  const arrayStart = skipTrivia(source, declaration.index + declaration[0].length, source.length);
  if (source[arrayStart] !== "[") {
    fail("MEMORIAS precisa ser uma lista entre colchetes.");
  }

  return { start: arrayStart, end: findMatching(source, arrayStart, "[", "]") };
};

const parseMemories = (source) => {
  const array = findMemoryArray(source);
  const memories = [];
  let index = array.start + 1;

  while (index < array.end - 1) {
    index = skipTrivia(source, index, array.end - 1);
    if (source[index] === ",") {
      index += 1;
      continue;
    }
    if (index >= array.end - 1) break;
    if (source[index] !== "{") {
      fail("Cada item de MEMORIAS precisa ser um objeto entre chaves.");
    }

    const range = { start: index, end: findMatching(source, index, "{", "}", array.end) };
    const properties = parseObjectProperties(source, range);
    memories.push({ range, properties });
    index = range.end;
  }

  return memories;
};

const propertyString = (properties, name) => {
  const property = properties.get(name);
  return property && property.kind === "string" ? property.value : "";
};

const nestedProperties = (source, property) => {
  return property && property.kind === "object"
    ? parseObjectProperties(source, property)
    : new Map();
};

const stableKey = (source, memory) => {
  const id = memory.properties.get("id");
  if (id && (id.kind === "string" || id.kind === "other") && String(id.value).trim()) {
    return "id:" + String(id.value).trim();
  }

  const media = nestedProperties(source, memory.properties.get("midia"));
  const audio = nestedProperties(source, memory.properties.get("audio"));
  const mediaType = propertyString(media, "tipo");
  const mediaFile = propertyString(media, "arquivo");
  const mediaMime = propertyString(media, "mime");
  const audioFile = propertyString(audio, "arquivo");
  const audioMime = propertyString(audio, "mime");

  if (!mediaType || !mediaFile) return "";

  return [
    "media",
    mediaType.trim(),
    mediaFile.trim().toLocaleLowerCase("pt-BR"),
    mediaMime.trim().toLocaleLowerCase("pt-BR"),
    audioFile.trim().toLocaleLowerCase("pt-BR"),
    audioMime.trim().toLocaleLowerCase("pt-BR")
  ].join("\u0001");
};

const protectedRanges = (text, fieldDescription) => {
  const ranges = [];
  let opening = -1;

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "{") {
      if (opening >= 0) {
        fail(fieldDescription + " possui chaves aninhadas. Use apenas um par {trecho} por vez.");
      }
      opening = index;
    } else if (text[index] === "}") {
      if (opening < 0) {
        fail(fieldDescription + " possui uma chave } sem a abertura { correspondente.");
      }
      if (opening === index - 1) {
        fail(fieldDescription + " possui um trecho protegido vazio: {}.");
      }
      ranges.push({ start: opening, end: index + 1 });
      opening = -1;
    }
  }

  if (opening >= 0) {
    fail(fieldDescription + " possui uma chave { sem o fechamento } correspondente.");
  }

  return ranges;
};

const textForCheck = (text, ranges) => {
  // O LanguageTool usa offsets UTF-16, como String.slice no JavaScript.
  // split("") preserva esse mesmo índice mesmo quando o texto tem emoji.
  const characters = text.split("");
  ranges.forEach((range) => {
    characters[range.start] = " ";
    characters[range.end - 1] = " ";
  });
  return characters.join("");
};

const intersectsProtectedRange = (offset, length, ranges) => {
  return ranges.some((range) => {
    if (length === 0) {
      return offset >= range.start && offset < range.end;
    }
    return offset < range.end && offset + length > range.start;
  });
};

const overlaps = (left, right) => {
  const leftEnd = left.offset + left.length;
  const rightEnd = right.offset + right.length;

  if (left.length === 0 && right.length === 0) {
    return left.offset === right.offset;
  }
  if (left.length === 0) {
    return left.offset > right.offset && left.offset < rightEnd;
  }
  if (right.length === 0) {
    return right.offset > left.offset && right.offset < leftEnd;
  }
  return left.offset < rightEnd && right.offset < leftEnd;
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const requestCheck = async (text) => {
  const payload = new URLSearchParams({
    text,
    language: "pt-BR",
    level: languageToolLevel
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
        signal: controller.signal
      });
      const responseText = await response.text();

      if (!response.ok) {
        if ([429, 500, 503].includes(response.status) && attempt < 2) {
          await sleep((attempt + 1) * 1000);
          continue;
        }
        fail(
          "O corretor local respondeu " + response.status + ": " +
            responseText.slice(0, 500)
        );
      }

      try {
        const parsed = JSON.parse(responseText);
        return Array.isArray(parsed.matches) ? parsed.matches : [];
      } catch {
        fail("O corretor local retornou uma resposta inválida.");
      }
    } catch (error) {
      if (error.name === "AbortError" && attempt < 2) {
        await sleep((attempt + 1) * 1000);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return [];
};

const suggestedChanges = async (text, ranges) => {
  const matches = await requestCheck(textForCheck(text, ranges));
  const candidates = [];

  matches.forEach((match) => {
    const offset = Number(match.offset);
    const length = Number(match.length);
    const issueType = String(match?.rule?.issueType || "").toLocaleLowerCase("en-US");

    if (!Number.isInteger(offset) || !Number.isInteger(length)) return;
    if (offset < 0 || length < 0 || offset + length > text.length) return;
    if (!allowedIssueTypes.has(issueType)) return;

    const original = text.slice(offset, offset + length);
    const replacement = safeReplacement(match, original, issueType);

    if (typeof replacement !== "string" || !replacement) return;
    if (replacement === original) return;
    if (intersectsProtectedRange(offset, length, ranges)) return;

    candidates.push({ offset, length, replacement });
  });

  candidates.sort((left, right) =>
    left.offset - right.offset || right.length - left.length
  );

  const selected = [];
  candidates.forEach((candidate) => {
    if (!selected.some((previous) => overlaps(candidate, previous))) {
      selected.push(candidate);
    }
  });

  return selected.sort((left, right) => right.offset - left.offset);
};

const applyChanges = (text, changes) => {
  let result = text;
  changes.forEach((change) => {
    result =
      result.slice(0, change.offset) +
      change.replacement +
      result.slice(change.offset + change.length);
  });
  return result;
};

// Algumas sugestões de pontuação e concordância só aparecem depois de uma
// primeira correção. Reavaliamos poucas vezes e sempre recalculamos as
// proteções para que trechos entre {chaves} permaneçam intocados.
const reviewField = async (text, description) => {
  let reviewed = text;
  let corrections = 0;
  let protectedSegments = 0;

  for (let pass = 0; pass < maxReviewPasses; pass += 1) {
    const ranges = protectedRanges(reviewed, description);
    protectedSegments = Math.max(protectedSegments, ranges.length);

    const changes = await suggestedChanges(reviewed, ranges);
    if (!changes.length) break;

    reviewed = applyChanges(reviewed, changes);
    corrections += changes.length;
  }

  return { text: reviewed, corrections, protectedSegments };
};

const removeProtectionDelimiters = (text) => text.replace(/[{}]/g, "");

const applySourceReplacements = (source, replacements) => {
  const sorted = [...replacements].sort((left, right) => right.start - left.start);
  let result = source;
  let previousStart = source.length + 1;

  sorted.forEach((replacement) => {
    if (replacement.end > previousStart || replacement.start > replacement.end) {
      fail("As correções internas se sobrepõem; nenhum arquivo foi alterado.");
    }
    result =
      result.slice(0, replacement.start) +
      replacement.text +
      result.slice(replacement.end);
    previousStart = replacement.start;
  });

  return result;
};

const gitText = (argumentsForGit, failureMessage) => {
  try {
    return execFileSync("git", argumentsForGit, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch {
    fail(failureMessage || "Não foi possível consultar o histórico do Git.");
  }
};

const sourceFromGitCache = new Map();

const sourceFromGit = (ref) => {
  if (!/^(?:[0-9a-f]{7,64}|HEAD(?:[~^][0-9]*)?)$/i.test(ref)) {
    fail("A referência base do Git é inválida.");
  }

  if (sourceFromGitCache.has(ref)) return sourceFromGitCache.get(ref);

  const source = gitText(
    ["show", ref + ":memorias.js"],
    "Não foi possível ler memorias.js no commit base. Nenhuma memória foi corrigida."
  );
  sourceFromGitCache.set(ref, source);
  return source;
};

const requireAncestor = (ref) => {
  if (!/^(?:[0-9a-f]{7,64}|HEAD(?:[~^][0-9]*)?)$/i.test(ref || "")) {
    fail("A referência base do Git é inválida.");
  }

  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ref, "HEAD"], {
      cwd: root,
      stdio: "ignore"
    });
  } catch {
    fail(
      "O commit base não pertence ao histórico atual. " +
        "A correção foi cancelada para proteger as memórias antigas."
    );
  }
};

const lineAt = (source, offset) => {
  const safeOffset = Math.max(0, Math.min(Number(offset) || 0, source.length));
  let line = 1;
  for (let index = 0; index < safeOffset; index += 1) {
    if (source[index] === "\n") line += 1;
  }
  return line;
};

const linesForRange = (source, range) => {
  const start = lineAt(source, range.start);
  const end = lineAt(source, Math.max(range.start, range.end - 1));
  const lines = [];
  for (let line = start; line <= end; line += 1) lines.push(line);
  return lines;
};

const criticalProperties = (source, memory, includeMarker) => {
  const media = nestedProperties(source, memory.properties.get("midia"));
  const properties = [
    memory.properties.get("titulo"),
    memory.properties.get("texto"),
    media.get("tipo"),
    media.get("arquivo")
  ];

  if (includeMarker) properties.push(memory.properties.get(markerName));

  if (properties.some((property) => !property)) {
    fail("A memória marcada não possui todos os campos obrigatórios para uma correção segura.");
  }

  return properties;
};

const parseDiffHunks = (before, after) => {
  const diff = gitText(
    ["diff", "--unified=0", "--no-ext-diff", before, after, "--", "memorias.js"],
    "Não foi possível conferir as mudanças de memorias.js no histórico do Git."
  );
  const hunks = [];
  let hunk = null;
  let oldLine = 0;
  let newLine = 0;
  const hunkPattern = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

  diff.split(/\r?\n/).forEach((line) => {
    const header = hunkPattern.exec(line);
    if (header) {
      hunk = {
        oldStart: Number(header[1]),
        oldCount: Number(header[2] || 1),
        newStart: Number(header[3]),
        newCount: Number(header[4] || 1),
        additions: new Set(),
        deletions: new Set()
      };
      hunks.push(hunk);
      oldLine = hunk.oldStart;
      newLine = hunk.newStart;
      return;
    }
    if (!hunk || line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
      return;
    }
    if (line.startsWith("+")) {
      hunk.additions.add(newLine);
      newLine += 1;
      return;
    }
    if (line.startsWith("-")) {
      hunk.deletions.add(oldLine);
      oldLine += 1;
      return;
    }
    if (line.startsWith(" ") || line === "") {
      oldLine += 1;
      newLine += 1;
    }
  });

  return hunks;
};

let memoryHistory = null;
const parsedHistoryCache = new Map();

const memoryHistoryCommits = () => {
  if (memoryHistory) return memoryHistory;
  memoryHistory = gitText(
    ["rev-list", "--reverse", "HEAD", "--", "memorias.js"],
    "Não foi possível ler o histórico de memorias.js."
  ).trim().split(/\s+/).filter(Boolean);
  return memoryHistory;
};

const historicalMemoryRecord = (commit) => {
  if (parsedHistoryCache.has(commit)) return parsedHistoryCache.get(commit);
  const source = sourceFromGit(commit);
  const record = { source, memories: parseMemories(source) };
  parsedHistoryCache.set(commit, record);
  return record;
};

const firstIntroduction = (key) => {
  const commits = memoryHistoryCommits();

  for (let index = 0; index < commits.length; index += 1) {
    const commit = commits[index];
    const record = historicalMemoryRecord(commit);
    const memory = record.memories.find(
      (candidate) => stableKey(record.source, candidate) === key
    );
    if (!memory) continue;

    let parent = "";
    try {
      parent = execFileSync("git", ["rev-parse", commit + "^"], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      }).trim();
    } catch {
      // O marcador será verificado antes de exigir um commit pai.
    }
    const seenAsFinished = commits.slice(index + 1).some((laterCommit) => {
      const laterRecord = historicalMemoryRecord(laterCommit);
      const later = laterRecord.memories.find(
        (candidate) => stableKey(laterRecord.source, candidate) === key
      );
      return later?.properties.get(markerName)?.value === false;
    });

    return { commit, parent, source: record.source, memory, seenAsFinished };
  }

  return null;
};

const verifyNewMemoryIntroduction = (introduction, number, currentSource, currentMemory) => {
  const reference =
    "A memória " + number + " (linha " + lineAt(currentSource, currentMemory.range.start) + ")";
  const marker = introduction.memory.properties.get(markerName);
  if (!marker || marker.value !== true) {
    fail(
      reference +
        " já existia antes de receber o marcador de correção. " +
        "Por segurança, apenas memórias criadas com \"corrigirOrtografia\": true podem ser corrigidas."
    );
  }

  if (introduction.seenAsFinished) {
    fail(
      reference +
        " já passou pela correção automática antes. " +
        "Por segurança, não ative corrigirOrtografia novamente nessa memória."
    );
  }

  if (!introduction.parent) {
    fail(
      reference +
        " está no primeiro commit do repositório. " +
        "Por segurança, adicione-a em um novo commit antes de usar a correção automática."
    );
  }

  const parentSource = sourceFromGit(introduction.parent);
  const parentMemories = parseMemories(parentSource);
  const changedHunks = parseDiffHunks(introduction.parent, introduction.commit);
  const newLines = new Map();
  changedHunks.forEach((hunk) => {
    hunk.additions.forEach((line) => newLines.set(line, hunk));
  });

  const requiredLines = criticalProperties(
    introduction.source,
    introduction.memory,
    true
  ).flatMap((property) => linesForRange(introduction.source, property));
  const candidateHunks = new Set();

  requiredLines.forEach((line) => {
    const hunk = newLines.get(line);
    if (!hunk) {
      fail(
        reference +
          " não foi adicionada como um novo bloco no Git. " +
          "A correção foi cancelada para não modificar uma memória antiga."
      );
    }
    candidateHunks.add(hunk);
  });

  const protectedBaseLines = new Set();
  parentMemories.forEach((memory) => {
    criticalProperties(parentSource, memory, false).forEach((property) => {
      linesForRange(parentSource, property).forEach((line) => protectedBaseLines.add(line));
    });
  });

  for (const hunk of candidateHunks) {
    if ([...hunk.deletions].some((line) => protectedBaseLines.has(line))) {
      fail(
        reference +
          " foi adicionada junto com a alteração de campos de uma memória existente. " +
          "Separe essa mudança em outro commit e tente novamente."
      );
    }
  }
};

const appendSummary = (lines) => {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, lines.join("\n") + "\n", "utf8");
  }
};

const main = async () => {
  if (!fs.existsSync(memoriesFile)) {
    fail("memorias.js não existe no projeto.");
  }

  // Preserve the original line endings so the automatic commit contains only
  // the corrected fields, never a whole-file CRLF/LF formatting rewrite.
  const source = fs.readFileSync(memoriesFile, "utf8");
  const currentMemories = parseMemories(source);
  const markedMemories = currentMemories
    .map((memory, index) => ({ memory, index }))
    .filter(({ memory }) => memory.properties.get(markerName)?.value === true);

  if (!markedMemories.length) {
    console.log("Nenhuma memória nova marcada para correção ortográfica.");
    appendSummary([
      "## Correção ortográfica",
      "Nenhuma memória marcada com `corrigirOrtografia: true` foi encontrada."
    ]);
    return;
  }

  if (!baseRef) {
    fail("Informe --base com o commit anterior para proteger as memórias antigas.");
  }
  requireAncestor(baseRef);

  const replacements = [];
  const resultLines = ["## Correção ortográfica", ""];

  for (const { memory, index } of markedMemories) {
    const number = index + 1;
    const marker = memory.properties.get(markerName);
    const key = stableKey(source, memory);

    if (!key) {
      fail(
        "A memória " + number + " (linha " + lineAt(source, memory.range.start) + ")" +
          " marcada para correção não possui uma mídia identificável. " +
          "Preencha midia.tipo e midia.arquivo antes de enviar."
      );
    }
    const introduction = firstIntroduction(key);
    if (!introduction) {
      fail(
        "A memória " + number + " (linha " + lineAt(source, memory.range.start) + ")" +
          " não foi encontrada no histórico do Git. " +
          "Envie a memória em um commit antes de executar a correção automática."
      );
    }
    verifyNewMemoryIntroduction(introduction, number, source, memory);

    const title = memory.properties.get("titulo");
    const text = memory.properties.get("texto");
    if (!title || title.kind !== "string" || !text || text.kind !== "string") {
      fail(
        "A memória " + number + " (linha " + lineAt(source, memory.range.start) + ")" +
          " precisa ter titulo e texto entre aspas duplas para usar a correção automática."
      );
    }

    const fields = [
      { label: "título", property: title },
      { label: "texto", property: text }
    ];
    let corrections = 0;
    let protectedSegments = 0;

    for (const field of fields) {
      const description =
        "O " + field.label + " da memória " + number +
        " (linha " + lineAt(source, field.property.start) + ")";
      const review = await reviewField(field.property.value, description);
      const corrected = removeProtectionDelimiters(review.text);

      corrections += review.corrections;
      protectedSegments += review.protectedSegments;
      if (corrected !== field.property.value) {
        replacements.push({
          start: field.property.start,
          end: field.property.end,
          text: JSON.stringify(corrected)
        });
      }
    }

    replacements.push({ start: marker.start, end: marker.end, text: "false" });
    resultLines.push(
      "- Memória " + number + ": " + corrections +
        " correção(ões) aplicada(s)" +
        (protectedSegments ? "; " + protectedSegments + " trecho(s) protegido(s) preservado(s)." : ".")
    );
  }

  const correctedSource = applySourceReplacements(source, replacements);
  new vm.Script(correctedSource, { filename: "memorias.js" });

  if (!dryRun) {
    fs.writeFileSync(memoriesFile, correctedSource, "utf8");
  }

  console.log(
    dryRun
      ? "Teste concluído: nenhuma alteração foi gravada."
      : "Correção ortográfica concluída para " + markedMemories.length + " memória(s) nova(s)."
  );
  resultLines.push("", dryRun ? "Nenhuma alteração foi gravada (teste)." : "Alterações gravadas em `memorias.js`.");
  appendSummary(resultLines);
};

main().catch((error) => {
  console.error("Falha na correção ortográfica: " + error.message);
  process.exit(1);
});


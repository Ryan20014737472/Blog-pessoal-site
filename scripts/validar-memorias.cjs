#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const argumentsList = process.argv.slice(2);
const argumentValue = (name) => {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : "";
};

const root = path.resolve(argumentValue("--root") || path.join(__dirname, ".."));
const jsonReportFile = argumentValue("--json");
const errors = [];
const warnings = [];
const reportedIssues = new Set();
const sourceCache = new Map();

const rules = {
  imagem: {
    label: "imagem",
    folder: "assets/images/",
    extensions: new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"])
  },
  video: {
    label: "vídeo",
    folder: "assets/videos/",
    extensions: new Set([".mp4", ".webm", ".ogg"])
  },
  audio: {
    label: "áudio",
    folder: "assets/audio/",
    extensions: new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"])
  }
};

const normalizeNewlines = (value) =>
  String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const normalizeFile = (file) => String(file || "").replace(/\\/g, "/");

const absoluteFile = (file) => path.join(root, ...normalizeFile(file).split("/"));

const getSource = (file) => {
  const normalized = normalizeFile(file);
  if (sourceCache.has(normalized)) return sourceCache.get(normalized);

  const absolute = absoluteFile(normalized);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    sourceCache.set(normalized, null);
    return null;
  }

  const source = normalizeNewlines(fs.readFileSync(absolute, "utf8"));
  sourceCache.set(normalized, source);
  return source;
};

const positionAt = (source, rawOffset) => {
  const offset = Math.max(0, Math.min(Number(rawOffset) || 0, source.length));
  const before = source.slice(0, offset);
  const lastBreak = before.lastIndexOf("\n");
  return {
    line: (before.match(/\n/g) || []).length + 1,
    column: offset - lastBreak
  };
};

const cropLine = (line, column, limit = 170) => {
  if (line.length <= limit) return { text: line, column };

  const safeColumn = Math.max(1, column || 1);
  let start = Math.max(0, safeColumn - 65);
  start = Math.min(start, Math.max(0, line.length - limit));
  const end = Math.min(line.length, start + limit);
  const hasPrefix = start > 0;
  const hasSuffix = end < line.length;

  return {
    text: (hasPrefix ? "…" : "") + line.slice(start, end) + (hasSuffix ? "…" : ""),
    column: safeColumn - start + (hasPrefix ? 1 : 0)
  };
};

const makeSnippet = (file, line, column) => {
  const source = getSource(file);
  if (!source || !line) return "";

  const lines = source.split("\n");
  if (line < 1 || line > lines.length) return "";

  const start = Math.max(1, line - 1);
  const end = Math.min(lines.length, line + 1);
  const numberWidth = String(end).length;
  const output = [];

  for (let number = start; number <= end; number += 1) {
    const target = number === line;
    const cropped = cropLine(lines[number - 1], target ? column : 1);
    output.push(
      (target ? "> " : "  ") +
        String(number).padStart(numberWidth, " ") +
        " | " +
        cropped.text
    );

    if (target && column) {
      output.push(
        "  " + " ".repeat(numberWidth) + " | " +
          " ".repeat(Math.max(0, cropped.column - 1)) + "^"
      );
    }
  }

  return output.join("\n");
};

const addDiagnostic = (severity, details) => {
  const diagnostic = {
    severity,
    code: details.code || "VALIDATION_ERROR",
    title: details.title || "Problema encontrado",
    file: details.file ? normalizeFile(details.file) : "",
    line: Number(details.line) || null,
    column: Number(details.column) || null,
    memory: Number(details.memory) || null,
    message: String(details.message || ""),
    solution: String(details.solution || ""),
    snippet: String(details.snippet || "")
  };

  if (details.offset !== undefined && diagnostic.file) {
    const source = getSource(diagnostic.file);
    if (source) {
      const location = positionAt(source, details.offset);
      diagnostic.line = location.line;
      diagnostic.column = location.column;
    }
  }

  if (!diagnostic.snippet && diagnostic.file && diagnostic.line) {
    diagnostic.snippet = makeSnippet(
      diagnostic.file,
      diagnostic.line,
      diagnostic.column
    );
  }

  const key = [
    diagnostic.severity,
    diagnostic.code,
    diagnostic.file,
    diagnostic.line,
    diagnostic.column,
    diagnostic.message
  ].join("::");

  if (reportedIssues.has(key)) return;
  reportedIssues.add(key);
  (severity === "warning" ? warnings : errors).push(diagnostic);
};

const addError = (details) => addDiagnostic("error", details);
const addWarning = (details) => addDiagnostic("warning", details);

const normalizeReference = (reference) => {
  const withoutQuery = reference.split(/[?#]/, 1)[0].trim();
  try {
    return decodeURIComponent(withoutQuery).replace(/\\/g, "/");
  } catch {
    return withoutQuery.replace(/\\/g, "/");
  }
};

const findCaseInsensitivePath = (normalized) => {
  const parts = normalized.split("/").filter(Boolean);
  let directory = root;
  const actualParts = [];

  for (const part of parts) {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
      return "";
    }

    const match = fs
      .readdirSync(directory)
      .find((entry) => entry.toLocaleLowerCase("pt-BR") === part.toLocaleLowerCase("pt-BR"));
    if (!match) return "";
    actualParts.push(match);
    directory = path.join(directory, match);
  }

  return actualParts.join("/");
};

const validateLocalReference = (reference, context = {}) => {
  if (
    typeof reference !== "string" ||
    !reference.trim() ||
    reference.startsWith("#") ||
    /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(reference)
  ) {
    return;
  }

  const normalized = normalizeReference(reference);
  if (!normalized) return;

  const absolute = path.resolve(root, normalized);
  const location = {
    file: context.file,
    offset: context.offset,
    line: context.line,
    column: context.column,
    memory: context.memory
  };

  if (!absolute.startsWith(root + path.sep)) {
    addError({
      ...location,
      code: "PATH_OUTSIDE_PROJECT",
      title: "Caminho fora do projeto",
      message: "O caminho " + JSON.stringify(normalized) + " aponta para fora do repositório.",
      solution: "Use um caminho relativo que permaneça dentro do projeto, por exemplo assets/images/arquivo.jpg."
    });
    return;
  }

  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return;

  const actualPath = findCaseInsensitivePath(normalized);
  const mediaLabel = context.mediaType && rules[context.mediaType]
    ? rules[context.mediaType].label
    : "arquivo";
  const title = context.mediaType
    ? "Arquivo de " + mediaLabel + " não encontrado"
    : "Arquivo referenciado não encontrado";
  const owner = context.memory ? "A memória " + context.memory : (context.context || "O código");
  const solution = actualPath && actualPath !== normalized
    ? "Troque o caminho para " + JSON.stringify(actualPath) +
      ". No GitHub, letras maiúsculas e minúsculas fazem diferença."
    : "Envie o arquivo para " + JSON.stringify(normalized) +
      " ou altere esta referência para o nome exato de um arquivo existente. " +
      "Confira também letras maiúsculas e minúsculas.";

  addError({
    ...location,
    code: actualPath ? "FILE_CASE_MISMATCH" : "FILE_NOT_FOUND",
    title,
    message: owner + " aponta para " + JSON.stringify(normalized) + ", mas esse arquivo não existe nesse caminho.",
    solution
  });
};

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const syntaxLocation = (error, filename) => {
  const stack = normalizeNewlines(error && error.stack);
  const lines = stack.split("\n");
  const headerPattern = new RegExp("(?:^|[/\\\\])" + escapeRegExp(filename) + ":(\\d+)(?::(\\d+))?$");
  let headerIndex = -1;
  let line = null;
  let column = null;

  lines.forEach((stackLine, index) => {
    if (headerIndex >= 0) return;
    const match = stackLine.trim().match(headerPattern);
    if (!match) return;
    headerIndex = index;
    line = Number(match[1]) || null;
    column = Number(match[2]) || null;
  });

  if (!column && headerIndex >= 0 && lines[headerIndex + 2]) {
    const caret = lines[headerIndex + 2].indexOf("^");
    if (caret >= 0) column = caret + 1;
  }

  if (!line && Number(error && error.lineNumber)) {
    line = Number(error.lineNumber);
  }
  if (!column && Number(error && error.columnNumber)) {
    column = Number(error.columnNumber);
  }

  return { line, column };
};

const previousContentLine = (source, line) => {
  const lines = source.split("\n");
  for (let number = Math.min(line - 1, lines.length); number >= 1; number -= 1) {
    if (lines[number - 1].trim()) {
      return { number, text: lines[number - 1] };
    }
  }
  return null;
};

const syntaxSolution = (message, source, line) => {
  const previous = line ? previousContentLine(source, line) : null;

  if (
    /Unexpected token ['"]?\{/.test(message) &&
    previous &&
    /\}\s*$/.test(previous.text) &&
    !/\},\s*$/.test(previous.text)
  ) {
    return "Provavelmente falta uma vírgula no final da linha " + previous.number +
      ". Troque a chave final por \"},\" antes de iniciar a próxima memória."
  }

  if (/Unexpected end of input|Unexpected end of file/i.test(message)) {
    return "O arquivo terminou antes de fechar alguma estrutura. Confira as últimas linhas e feche as aspas, chaves, colchetes ou parênteses que ficaram abertos."
  }

  if (/Invalid or unexpected token|Unterminated/i.test(message)) {
    return "Confira as aspas e caracteres desta linha. Feche a string corretamente e remova qualquer caractere colado fora das aspas."
  }

  return "Confira a pontuação desta linha e da linha anterior. Verifique principalmente vírgulas entre blocos, aspas e chaves de abertura e fechamento."
};

const compileJavaScript = (file) => {
  const source = getSource(file);

  if (source === null) {
    addError({
      code: "CODE_FILE_NOT_FOUND",
      title: "Arquivo de código não encontrado",
      file,
      message: "O arquivo obrigatório " + JSON.stringify(file) + " não existe.",
      solution: "Restaure o arquivo no caminho indicado ou ajuste o site para deixar de depender dele."
    });
    return false;
  }

  try {
    new vm.Script(source, { filename: file });
    return true;
  } catch (error) {
    const location = syntaxLocation(error, file);
    const message = String(error.message || error);
    addError({
      code: "JS_SYNTAX_ERROR",
      title: "Código JavaScript inválido",
      file,
      ...location,
      message,
      solution: syntaxSolution(message, source, location.line)
    });
    return false;
  }
};

const findMemoryRanges = (source) => {
  const declaration = /(?:const|let|var)\s+MEMORIAS\s*=\s*\[/.exec(source);
  if (!declaration) return [];

  const arrayStart = declaration.index + declaration[0].lastIndexOf("[");
  const ranges = [];
  let squareDepth = 1;
  let curlyDepth = 0;
  let objectStart = -1;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = arrayStart + 1; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = "";
      }
      continue;
    }

    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "[") {
      squareDepth += 1;
      continue;
    }
    if (character === "]") {
      squareDepth -= 1;
      if (squareDepth === 0) break;
      continue;
    }
    if (character === "{") {
      if (squareDepth === 1 && curlyDepth === 0) objectStart = index;
      curlyDepth += 1;
      continue;
    }
    if (character === "}" && curlyDepth > 0) {
      curlyDepth -= 1;
      if (curlyDepth === 0 && objectStart >= 0) {
        ranges.push({ start: objectStart, end: index + 1 });
        objectStart = -1;
      }
    }
  }

  return ranges;
};

const findPropertyKeyOffset = (source, range, property) => {
  if (!range) return -1;
  const fragment = source.slice(range.start, range.end);
  const pattern = new RegExp("(?:[\\\"']" + escapeRegExp(property) + "[\\\"']|\\b" + escapeRegExp(property) + "\\b)\\s*:");
  const match = pattern.exec(fragment);
  return match ? range.start + match.index : -1;
};

const findPropertyValueOffset = (source, range, property) => {
  const keyOffset = findPropertyKeyOffset(source, range, property);
  if (keyOffset < 0) return -1;

  const colon = source.indexOf(":", keyOffset);
  let offset = colon + 1;
  while (offset < range.end && /\s/.test(source[offset])) offset += 1;
  if (source[offset] === '"' || source[offset] === "'") offset += 1;
  return offset;
};

const balancedObjectRange = (source, start, limit) => {
  const objectStart = source.indexOf("{", start);
  if (objectStart < 0 || objectStart >= limit) return null;

  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = objectStart; index < limit; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return { start: objectStart, end: index + 1 };
    }
  }

  return null;
};

const nestedRange = (source, parentRange, property) => {
  const keyOffset = findPropertyKeyOffset(source, parentRange, property);
  return keyOffset < 0
    ? null
    : balancedObjectRange(source, keyOffset, parentRange.end);
};

const memoryLocation = (source, ranges, number, section, property) => {
  const memoryRange = ranges[number - 1];
  if (!memoryRange) return { file: "memorias.js" };

  let range = memoryRange;
  if (section) {
    const sectionRange = nestedRange(source, memoryRange, section);
    if (!sectionRange) {
      const sectionOffset = findPropertyValueOffset(source, memoryRange, section);
      return {
        file: "memorias.js",
        offset: sectionOffset >= 0 ? sectionOffset : memoryRange.start
      };
    }
    range = sectionRange;
  }

  const offset = property
    ? findPropertyValueOffset(source, range, property)
    : range.start;
  return {
    file: "memorias.js",
    offset: offset >= 0 ? offset : range.start
  };
};

const protectedTextIssue = (value) => {
  let opening = -1;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "{") {
      if (opening >= 0) return { type: "nested", offset: index };
      opening = index;
      continue;
    }

    if (value[index] === "}") {
      if (opening < 0) return { type: "closing", offset: index };
      if (opening === index - 1) return { type: "empty", offset: opening };
      opening = -1;
    }
  }

  return opening >= 0 ? { type: "opening", offset: opening } : null;
};

const protectedTextIssueMessage = (issue) => {
  if (issue.type === "nested") return "Há uma chave { dentro de outro trecho protegido.";
  if (issue.type === "closing") return "Há uma chave } sem uma abertura { correspondente.";
  if (issue.type === "empty") return "Há um trecho protegido vazio: {}.";
  return "Há uma chave { sem o fechamento } correspondente.";
};

const validateMemoryFile = (number, file, type, location) => {
  const rule = rules[type];

  if (typeof file !== "string" || !file.trim()) {
    addError({
      ...location,
      memory: number,
      code: "MEDIA_PATH_MISSING",
      title: "Arquivo de " + rule.label + " não informado",
      message: "A memória " + number + " não possui um caminho válido na propriedade \"arquivo\".",
      solution: "Preencha \"arquivo\" com um caminho dentro de " + rule.folder + "."
    });
    return;
  }

  const normalized = normalizeReference(file);

  if (!normalized.startsWith(rule.folder)) {
    addError({
      ...location,
      memory: number,
      code: "MEDIA_WRONG_FOLDER",
      title: "Arquivo de " + rule.label + " na pasta errada",
      message: "O caminho " + JSON.stringify(file) + " não começa com " + JSON.stringify(rule.folder) + ".",
      solution: "Mova o arquivo para " + rule.folder + " ou corrija a propriedade \"arquivo\" para apontar para essa pasta."
    });
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!rule.extensions.has(extension)) {
    addError({
      ...location,
      memory: number,
      code: "MEDIA_INVALID_EXTENSION",
      title: "Extensão de " + rule.label + " inválida",
      message: "A extensão " + JSON.stringify(extension || "(sem extensão)") + " não é aceita para " + rule.label + ".",
      solution: "Use uma destas extensões: " + Array.from(rule.extensions).join(", ") + "."
    });
  }

  validateLocalReference(normalized, {
    ...location,
    memory: number,
    mediaType: type
  });
};

const formatLocation = (diagnostic) => {
  const output = [];
  if (diagnostic.file) output.push("Arquivo: " + diagnostic.file);
  if (diagnostic.line) output.push("Linha: " + diagnostic.line);
  if (diagnostic.column) output.push("Coluna: " + diagnostic.column);
  if (diagnostic.memory) output.push("Memória: " + diagnostic.memory);
  return output;
};

const formatDiagnostic = (diagnostic, index) => {
  const label = diagnostic.severity === "warning" ? "AVISO" : "ERRO";
  return [
    "[" + label + " " + (index + 1) + "] " + diagnostic.title,
    ...formatLocation(diagnostic),
    "Problema: " + diagnostic.message,
    diagnostic.snippet ? "Trecho:\n" + diagnostic.snippet : "",
    "Como resolver: " + diagnostic.solution
  ].filter(Boolean).join("\n");
};

const memoryCodeIsValid = compileJavaScript("memorias.js");
compileJavaScript("script.js");
compileJavaScript("scripts/enviar-alerta-validacao.cjs");
compileJavaScript("scripts/gerar-print-validacao.cjs");

let memories = null;
const memorySource = getSource("memorias.js");
const memoryRanges = memorySource ? findMemoryRanges(memorySource) : [];

if (memoryCodeIsValid && memorySource) {
  try {
    const moduleRecord = { exports: {} };
    const script = new vm.Script(memorySource, { filename: "memorias.js" });
    script.runInNewContext({ module: moduleRecord, exports: moduleRecord.exports });
    memories = moduleRecord.exports;
  } catch (error) {
    const location = syntaxLocation(error, "memorias.js");
    addError({
      code: "MEMORY_LOAD_ERROR",
      title: "Não foi possível carregar as memórias",
      file: "memorias.js",
      ...location,
      message: String(error.message || error),
      solution: "Corrija o erro indicado em memorias.js. A validação das memórias continuará depois que o arquivo puder ser carregado."
    });
  }
}

if (memoryCodeIsValid && memories !== null) {
  if (!Array.isArray(memories) || memories.length === 0) {
    const declaration = memorySource.search(/(?:const|let|var)\s+MEMORIAS\s*=/);
    addError({
      code: "MEMORY_LIST_EMPTY",
      title: "Lista de memórias vazia ou inválida",
      file: "memorias.js",
      offset: declaration >= 0 ? declaration : 0,
      message: "memorias.js precisa exportar uma lista com pelo menos uma memória.",
      solution: "Mantenha as memórias dentro de const MEMORIAS = [ ... ] e exporte essa lista no final do arquivo."
    });
  } else {
    memories.forEach((memory, index) => {
      const number = index + 1;
      const objectLocation = memoryLocation(memorySource, memoryRanges, number);

      if (!memory || typeof memory !== "object") {
        addError({
          ...objectLocation,
          memory: number,
          code: "MEMORY_INVALID",
          title: "Cadastro de memória inválido",
          message: "O item " + number + " da lista não é um objeto de memória válido.",
          solution: "Substitua este item por um objeto com titulo, texto e midia."
        });
        return;
      }

      if (typeof memory.titulo !== "string" || !memory.titulo.trim()) {
        addError({
          ...memoryLocation(memorySource, memoryRanges, number, "", "titulo"),
          memory: number,
          code: "MEMORY_TITLE_MISSING",
          title: "Título da memória não informado",
          message: "A memória " + number + " está sem um título válido.",
          solution: "Adicione ou preencha a propriedade \"titulo\" nesta memória."
        });
      }

      if (typeof memory.texto !== "string" || !memory.texto.trim()) {
        addError({
          ...memoryLocation(memorySource, memoryRanges, number, "", "texto"),
          memory: number,
          code: "MEMORY_TEXT_MISSING",
          title: "Descrição da memória não informada",
          message: "A memória " + number + " está sem texto.",
          solution: "Adicione ou preencha a propriedade \"texto\" nesta memória."
        });
      }

      const hasOrthographyFlag = Object.prototype.hasOwnProperty.call(
        memory,
        "corrigirOrtografia"
      );
      if (hasOrthographyFlag && typeof memory.corrigirOrtografia !== "boolean") {
        addError({
          ...memoryLocation(memorySource, memoryRanges, number, "", "corrigirOrtografia"),
          memory: number,
          code: "ORTHOGRAPHY_FLAG_INVALID",
          title: "Marcador de correção ortográfica inválido",
          message: "A propriedade corrigirOrtografia da memória " + number + " deve ser true ou false.",
          solution: "Para corrigir somente uma memória nova, use exatamente \"corrigirOrtografia\": true. Depois da correção, o GitHub trocará para false."
        });
      }

      if (memory.corrigirOrtografia === true) {
        [
          ["titulo", memory.titulo, "título"],
          ["texto", memory.texto, "texto"]
        ].forEach(([property, value, label]) => {
          if (typeof value !== "string") return;

          const issue = protectedTextIssue(value);
          if (!issue) return;

          const location = memoryLocation(
            memorySource,
            memoryRanges,
            number,
            "",
            property
          );
          addError({
            ...location,
            offset: typeof location.offset === "number"
              ? location.offset + issue.offset
              : undefined,
            memory: number,
            code: "ORTHOGRAPHY_PROTECTED_TEXT_INVALID",
            title: "Chaves de proteção inválidas",
            message: "No " + label + " da memória " + number + ", " + protectedTextIssueMessage(issue),
            solution: "Use pares simples como {TBR} ou {nome artístico}. Não use chaves vazias, aninhadas ou soltas."
          });
        });
      }

      if (!memory.midia || !rules[memory.midia.tipo] || memory.midia.tipo === "audio") {
        addError({
          ...memoryLocation(memorySource, memoryRanges, number, "midia", "tipo"),
          memory: number,
          code: "MEMORY_MEDIA_TYPE_INVALID",
          title: "Tipo de mídia inválido",
          message: "A propriedade midia.tipo da memória " + number + " deve ser \"imagem\" ou \"video\".",
          solution: "Use exatamente \"tipo\": \"imagem\" para fotos ou \"tipo\": \"video\" para vídeos."
        });
      } else {
        validateMemoryFile(
          number,
          memory.midia.arquivo,
          memory.midia.tipo,
          memoryLocation(memorySource, memoryRanges, number, "midia", "arquivo")
        );

        if (
          memory.midia.tipo === "imagem" &&
          (typeof memory.midia.alt !== "string" || !memory.midia.alt.trim())
        ) {
          addError({
            ...memoryLocation(memorySource, memoryRanges, number, "midia", "alt"),
            memory: number,
            code: "IMAGE_ALT_MISSING",
            title: "Descrição da imagem não informada",
            message: "A imagem da memória " + number + " está sem a descrição alt.",
            solution: "Adicione \"alt\": \"uma descrição curta da foto\" dentro de midia."
          });
        }
      }

      if (memory.audio) {
        validateMemoryFile(
          number,
          memory.audio.arquivo,
          "audio",
          memoryLocation(memorySource, memoryRanges, number, "audio", "arquivo")
        );
      }
    });

    const titles = new Map();
    memories.forEach((memory, index) => {
      if (typeof memory?.titulo !== "string") return;
      const key = memory.titulo.trim().toLocaleLowerCase("pt-BR");
      if (!key) return;

      if (titles.has(key)) {
        const firstNumber = titles.get(key);
        addWarning({
          ...memoryLocation(memorySource, memoryRanges, index + 1, "", "titulo"),
          memory: index + 1,
          code: "DUPLICATE_TITLE",
          title: "Título de memória repetido",
          message: "As memórias " + firstNumber + " e " + (index + 1) + " usam o título " + JSON.stringify(memory.titulo) + ".",
          solution: "Se forem momentos diferentes, dê um título único a uma delas para melhorar a pesquisa."
        });
      } else {
        titles.set(key, index + 1);
      }
    });
  }
}

const htmlFiles = fs
  .readdirSync(root)
  .filter((file) => file === "index.html" || /^pagina\d+\.html$/.test(file))
  .sort();

const requirePage = (page) => {
  if (htmlFiles.includes(page)) return;
  addError({
    code: "REQUIRED_PAGE_MISSING",
    title: "Página obrigatória não encontrada",
    file: page,
    message: "A página " + page + " não existe no repositório.",
    solution: "Restaure ou crie " + page + " na raiz do projeto."
  });
};

requirePage("index.html");
requirePage("pagina2.html");
requirePage("pagina3.html");

const htmlReferencePattern = /\b(?:src|href)=["']([^"']+)["']/gi;
const cssReferencePattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

htmlFiles.forEach((file) => {
  const source = getSource(file);
  if (source === null) return;
  const insertionOffset = Math.max(0, source.search(/<body\b/i));

  if (!/<main\b[^>]*id=["']memorias["']/i.test(source)) {
    addError({
      code: "MEMORY_CONTAINER_MISSING",
      title: "Área de memórias não encontrada",
      file,
      offset: insertionOffset,
      message: "O elemento <main id=\"memorias\"> não existe nesta página.",
      solution: "Adicione <main id=\"memorias\"></main> dentro do body para o script inserir as memórias."
    });
  }

  ["style.css", "memorias.js", "script.js"].forEach((required) => {
    if (source.includes(required)) return;
    addError({
      code: "REQUIRED_REFERENCE_MISSING",
      title: "Referência obrigatória ausente",
      file,
      offset: insertionOffset,
      message: file + " não referencia " + required + ".",
      solution: "Adicione a referência para " + required + " no head ou no final do body, seguindo as outras páginas."
    });
  });

  for (const match of source.matchAll(htmlReferencePattern)) {
    const relativeOffset = match[0].indexOf(match[1]);
    validateLocalReference(match[1], {
      file,
      offset: match.index + Math.max(0, relativeOffset),
      context: file
    });
  }

  for (const match of source.matchAll(cssReferencePattern)) {
    const relativeOffset = match[0].indexOf(match[2]);
    validateLocalReference(match[2], {
      file,
      offset: match.index + Math.max(0, relativeOffset),
      context: file + " (estilo interno)"
    });
  }

  const inlineScriptPattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(inlineScriptPattern)) {
    if (!match[1].trim()) continue;
    const contentOffset = match.index + match[0].indexOf(match[1]);
    const filename = file + " (script interno)";
    try {
      new vm.Script(match[1], { filename });
    } catch (error) {
      const local = syntaxLocation(error, filename);
      const start = positionAt(source, contentOffset);
      const line = local.line ? start.line + local.line - 1 : start.line;
      const column = local.line === 1 && local.column
        ? start.column + local.column - 1
        : local.column;
      const message = String(error.message || error);
      addError({
        code: "INLINE_JS_SYNTAX_ERROR",
        title: "Código JavaScript interno inválido",
        file,
        line,
        column,
        message,
        solution: syntaxSolution(message, source, line)
      });
    }
  }
});

const validateCssBraces = (file, source) => {
  const openings = [];
  let quote = "";
  let escaped = false;
  let comment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (comment) {
      if (character === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") openings.push(index);
    if (character === "}") {
      if (openings.length) {
        openings.pop();
      } else {
        addError({
          code: "CSS_EXTRA_CLOSING_BRACE",
          title: "Chave extra no CSS",
          file,
          offset: index,
          message: "Existe uma chave de fechamento } sem uma abertura correspondente.",
          solution: "Remova esta chave } ou adicione a abertura { que deveria vir antes dela."
        });
      }
    }
  }

  if (openings.length) {
    const offset = openings[openings.length - 1];
    addError({
      code: "CSS_UNCLOSED_BLOCK",
      title: "Bloco CSS não foi fechado",
      file,
      offset,
      message: "O bloco iniciado nesta linha não possui uma chave } de fechamento.",
      solution: "Adicione a chave } ao final das propriedades deste bloco CSS."
    });
  }
};

const cssSource = getSource("style.css");
if (cssSource === null) {
  addError({
    code: "CSS_FILE_MISSING",
    title: "Arquivo de estilos não encontrado",
    file: "style.css",
    message: "O arquivo obrigatório style.css não existe.",
    solution: "Restaure ou crie style.css na raiz do projeto."
  });
} else {
  for (const match of cssSource.matchAll(cssReferencePattern)) {
    const relativeOffset = match[0].indexOf(match[2]);
    validateLocalReference(match[2], {
      file: "style.css",
      offset: match.index + Math.max(0, relativeOffset),
      context: "style.css"
    });
  }
  validateCssBraces("style.css", cssSource);
}

const workflowFile = ".github/workflows/validar-memorias.yml";
if (!fs.existsSync(absoluteFile(workflowFile))) {
  addError({
    code: "WORKFLOW_MISSING",
    title: "Workflow de validação não encontrado",
    file: workflowFile,
    message: "O arquivo que executa a validação automática não existe.",
    solution: "Restaure " + workflowFile + " para continuar recebendo alertas."
  });
}

const alertTestFile = "scripts/testar-alerta.flag";
if (fs.existsSync(absoluteFile(alertTestFile))) {
  addError({
    code: "CONTROLLED_TEST",
    title: "Erro simulado de teste",
    file: alertTestFile,
    line: 1,
    column: 1,
    message: "O assistente detectou o arquivo usado para simular uma falha. Nenhum arquivo do site foi danificado.",
    solution: "Remova scripts/testar-alerta.flag para encerrar o teste controlado."
  });
}

const allDiagnostics = [...errors, ...warnings];
const reportText = errors.length
  ? "Foram encontrados " + errors.length + " problema(s).\n\n" +
    errors.map(formatDiagnostic).join("\n\n")
  : "Tudo certo: " + (Array.isArray(memories) ? memories.length : 0) +
    " memórias, " + htmlFiles.length +
    " páginas, código válido e caminhos conferidos.";

if (jsonReportFile) {
  const output = path.resolve(process.cwd(), jsonReportFile);
  fs.writeFileSync(
    output,
    JSON.stringify(
      {
        version: 2,
        ok: errors.length === 0,
        summary: {
          errors: errors.length,
          warnings: warnings.length,
          memories: Array.isArray(memories) ? memories.length : 0,
          pages: htmlFiles.length
        },
        issues: allDiagnostics,
        text: reportText
      },
      null,
      2
    ) + "\n"
  );
}

warnings.forEach((warning, index) => {
  console.warn(formatDiagnostic(warning, index));
  console.warn("");
});

if (errors.length) {
  console.error("\n" + reportText);
  process.exitCode = 1;
} else {
  console.log(reportText);
}


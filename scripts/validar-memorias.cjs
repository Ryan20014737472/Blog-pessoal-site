#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];
const reportedPaths = new Set();

const rules = {
  imagem: {
    folder: "assets/images/",
    extensions: new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"])
  },
  video: {
    folder: "assets/videos/",
    extensions: new Set([".mp4", ".webm", ".ogg"])
  },
  audio: {
    folder: "assets/audio/",
    extensions: new Set([".mp3", ".m4a", ".aac", ".ogg", ".wav"])
  }
};

const addMemoryError = (number, message) => {
  errors.push("Memória " + number + ": " + message);
};

const normalizeReference = (reference) => {
  const withoutQuery = reference.split(/[?#]/, 1)[0].trim();
  try {
    return decodeURIComponent(withoutQuery).replace(/\\/g, "/");
  } catch {
    return withoutQuery.replace(/\\/g, "/");
  }
};

const validateLocalReference = (reference, context) => {
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
  const key = context + "::" + normalized;

  if (!absolute.startsWith(root + path.sep)) {
    if (!reportedPaths.has(key)) {
      errors.push(context + ": caminho fora do projeto: " + normalized);
      reportedPaths.add(key);
    }
    return;
  }

  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    if (!reportedPaths.has(key)) {
      errors.push(context + ": arquivo não encontrado: " + normalized);
      reportedPaths.add(key);
    }
  }
};

const compileJavaScript = (file) => {
  const absolute = path.join(root, file);

  if (!fs.existsSync(absolute)) {
    errors.push("Código: arquivo não encontrado: " + file);
    return false;
  }

  try {
    new vm.Script(fs.readFileSync(absolute, "utf8"), { filename: file });
    return true;
  } catch (error) {
    errors.push(
      "Código inválido em " + file + ": " +
        String(error.message || error)
    );
    return false;
  }
};

const validateMemoryFile = (number, file, type) => {
  const rule = rules[type];

  if (typeof file !== "string" || !file.trim()) {
    addMemoryError(number, "arquivo de " + type + " não informado.");
    return;
  }

  const normalized = normalizeReference(file);

  if (!normalized.startsWith(rule.folder)) {
    addMemoryError(
      number,
      "o arquivo " + JSON.stringify(file) + " deve ficar em " + rule.folder
    );
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!rule.extensions.has(extension)) {
    addMemoryError(
      number,
      "extensão " + JSON.stringify(extension || "(sem extensão)") +
        " não é válida para " + type + "."
    );
  }

  validateLocalReference(normalized, "Memória " + number);
};

const memoryCodeIsValid = compileJavaScript("memorias.js");
compileJavaScript("script.js");
compileJavaScript("scripts/enviar-alerta-validacao.cjs");

let memories = [];
if (memoryCodeIsValid) {
  try {
    memories = require("../memorias.js");
  } catch (error) {
    errors.push(
      "Não foi possível carregar memorias.js: " +
        String(error.message || error)
    );
  }
}

if (!Array.isArray(memories) || memories.length === 0) {
  errors.push("memorias.js precisa exportar uma lista com pelo menos uma memória.");
} else {
  memories.forEach((memory, index) => {
    const number = index + 1;

    if (!memory || typeof memory !== "object") {
      addMemoryError(number, "cadastro inválido.");
      return;
    }

    if (typeof memory.titulo !== "string" || !memory.titulo.trim()) {
      addMemoryError(number, "título não informado.");
    }

    if (typeof memory.texto !== "string" || !memory.texto.trim()) {
      addMemoryError(number, "texto não informado.");
    }

    if (!memory.midia || !rules[memory.midia.tipo]) {
      addMemoryError(number, 'midia.tipo deve ser "imagem" ou "video".');
    } else {
      validateMemoryFile(number, memory.midia.arquivo, memory.midia.tipo);

      if (
        memory.midia.tipo === "imagem" &&
        (typeof memory.midia.alt !== "string" || !memory.midia.alt.trim())
      ) {
        addMemoryError(number, "a descrição alt da imagem não foi informada.");
      }
    }

    if (memory.audio) {
      validateMemoryFile(number, memory.audio.arquivo, "audio");
    }
  });

  const titles = new Map();
  memories.forEach((memory, index) => {
    if (typeof memory?.titulo !== "string") return;
    const key = memory.titulo.trim().toLocaleLowerCase("pt-BR");
    if (!key) return;

    if (titles.has(key)) {
      warnings.push(
        "Títulos repetidos nas memórias " + titles.get(key) +
          " e " + (index + 1) + ": " + memory.titulo
      );
    } else {
      titles.set(key, index + 1);
    }
  });
}

const htmlFiles = fs
  .readdirSync(root)
  .filter((file) => file === "index.html" || /^pagina\d+\.html$/.test(file))
  .sort();

if (!htmlFiles.includes("index.html")) {
  errors.push("Página obrigatória não encontrada: index.html");
}

["pagina2.html", "pagina3.html"].forEach((page) => {
  if (!htmlFiles.includes(page)) {
    errors.push("Página obrigatória não encontrada: " + page);
  }
});

const htmlReferencePattern = /\b(?:src|href)=["']([^"']+)["']/gi;
const cssReferencePattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

htmlFiles.forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");

  if (!/<main\b[^>]*id=["']memorias["']/i.test(source)) {
    errors.push(file + ': elemento <main id="memorias"> não encontrado.');
  }

  ["style.css", "memorias.js", "script.js"].forEach((required) => {
    if (!source.includes(required)) {
      errors.push(file + ": referência obrigatória ausente: " + required);
    }
  });

  for (const match of source.matchAll(htmlReferencePattern)) {
    validateLocalReference(match[1], file);
  }

  for (const match of source.matchAll(cssReferencePattern)) {
    validateLocalReference(match[2], file + " (estilo interno)");
  }

  const inlineScriptPattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of source.matchAll(inlineScriptPattern)) {
    if (!match[1].trim()) continue;
    try {
      new vm.Script(match[1], { filename: file + " (script interno)" });
    } catch (error) {
      errors.push(
        "Código inválido em " + file + ": " +
          String(error.message || error)
      );
    }
  }
});

const cssFile = path.join(root, "style.css");
if (!fs.existsSync(cssFile)) {
  errors.push("Arquivo obrigatório não encontrado: style.css");
} else {
  const css = fs.readFileSync(cssFile, "utf8");
  for (const match of css.matchAll(cssReferencePattern)) {
    validateLocalReference(match[2], "style.css");
  }

  const opens = (css.match(/\{/g) || []).length;
  const closes = (css.match(/\}/g) || []).length;
  if (opens !== closes) {
    errors.push(
      "style.css possui chaves desequilibradas: " +
        opens + " aberturas e " + closes + " fechamentos."
    );
  }
}

const workflow = path.join(
  root,
  ".github",
  "workflows",
  "validar-memorias.yml"
);
if (!fs.existsSync(workflow)) {
  errors.push("Workflow de validação não encontrado.");
}

warnings.forEach((warning) => console.warn("AVISO: " + warning));

if (errors.length) {
  console.error("\nForam encontrados " + errors.length + " problema(s):\n");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(
  "Tudo certo: " + memories.length + " memórias, " +
    htmlFiles.length + " páginas, código válido e caminhos conferidos."
);

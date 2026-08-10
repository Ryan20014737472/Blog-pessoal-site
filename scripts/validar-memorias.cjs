#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const memories = require("../memorias.js");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

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

const addError = (number, message) => {
  errors.push("Memória " + number + ": " + message);
};

const validateFile = (number, file, type) => {
  const rule = rules[type];

  if (typeof file !== "string" || !file.trim()) {
    addError(number, "arquivo de " + type + " não informado.");
    return;
  }

  const normalized = file.replace(/\\/g, "/");

  if (!normalized.startsWith(rule.folder)) {
    addError(
      number,
      "o arquivo " + JSON.stringify(file) + " deve ficar em " + rule.folder
    );
  }

  const extension = path.extname(normalized).toLowerCase();
  if (!rule.extensions.has(extension)) {
    addError(
      number,
      "extensão " + JSON.stringify(extension || "(sem extensão)") +
        " não é válida para " + type + "."
    );
  }

  const absolute = path.resolve(root, normalized);
  if (!absolute.startsWith(root + path.sep)) {
    addError(number, "o caminho do arquivo sai da pasta do projeto.");
    return;
  }

  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    addError(number, "arquivo não encontrado: " + normalized);
  }
};

if (!Array.isArray(memories) || memories.length === 0) {
  errors.push("memorias.js precisa exportar uma lista com pelo menos uma memória.");
} else {
  memories.forEach((memory, index) => {
    const number = index + 1;

    if (!memory || typeof memory !== "object") {
      addError(number, "cadastro inválido.");
      return;
    }

    if (typeof memory.titulo !== "string" || !memory.titulo.trim()) {
      addError(number, "título não informado.");
    }

    if (typeof memory.texto !== "string" || !memory.texto.trim()) {
      addError(number, "texto não informado.");
    }

    if (!memory.midia || !rules[memory.midia.tipo]) {
      addError(number, 'midia.tipo deve ser "imagem" ou "video".');
    } else {
      validateFile(number, memory.midia.arquivo, memory.midia.tipo);

      if (
        memory.midia.tipo === "imagem" &&
        (typeof memory.midia.alt !== "string" || !memory.midia.alt.trim())
      ) {
        addError(number, "a descrição alt da imagem não foi informada.");
      }
    }

    if (memory.audio) {
      validateFile(number, memory.audio.arquivo, "audio");
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

warnings.forEach((warning) => console.warn("AVISO: " + warning));

if (errors.length) {
  console.error("\nForam encontrados " + errors.length + " problema(s):\n");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log(
  "Tudo certo: " + memories.length +
    " memórias e todos os arquivos referenciados foram validados."
);

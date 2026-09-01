#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const zlib = require("node:zlib");

const GLYPHS = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  ";": ["00000", "00110", "00110", "00000", "00110", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "\\": ["10000", "01000", "01000", "00100", "00010", "00010", "00001"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "[": ["01110", "01000", "01000", "01000", "01000", "01000", "01110"],
  "]": ["01110", "00010", "00010", "00010", "00010", "00010", "01110"],
  "{": ["00011", "00100", "00100", "01000", "00100", "00100", "00011"],
  "}": ["11000", "00100", "00100", "00010", "00100", "00100", "11000"],
  "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  "\"": ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "=": ["00000", "11111", "00000", "11111", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  "@": ["01110", "10001", "10111", "10101", "10111", "10000", "01110"],
  "%": ["11001", "11010", "00100", "01000", "10110", "00110", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00001", "00001", "00001", "00001", "10001", "10001", "01110"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"]
};

const COLORS = {
  background: [11, 15, 24, 255],
  card: [22, 27, 39, 255],
  border: [51, 65, 85, 255],
  title: [248, 250, 252, 255],
  text: [226, 232, 240, 255],
  muted: [148, 163, 184, 255],
  accent: [239, 68, 68, 255],
  test: [34, 197, 94, 255]
};

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "?")
    .toUpperCase();

const wrapLine = (line, limit) => {
  if (!line) return [""];
  const words = line.trim().split(/\s+/);
  const lines = [];
  let current = "";

  for (let word of words) {
    while (word.length > limit) {
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(word.slice(0, limit));
      word = word.slice(limit);
    }

    const candidate = current ? current + " " + word : word;
    if (candidate.length > limit) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
};

const wrapText = (text, limit) =>
  normalize(text)
    .split("\n")
    .flatMap((line) => wrapLine(line, limit));

const crcTable = Array.from({ length: 256 }, (_, number) => {
  let value = number;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
};

const drawRect = (pixels, width, height, x, y, rectWidth, rectHeight, color) => {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(width, Math.ceil(x + rectWidth));
  const endY = Math.min(height, Math.ceil(y + rectHeight));

  for (let py = startY; py < endY; py += 1) {
    for (let px = startX; px < endX; px += 1) {
      const offset = (py * width + px) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }
};

const drawText = (pixels, width, height, text, x, y, scale, color) => {
  let cursorX = x;

  for (const character of normalize(text).replace(/\n/g, " ")) {
    const glyph = GLYPHS[character] || GLYPHS["?"];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel !== "1") return;
        drawRect(
          pixels,
          width,
          height,
          cursorX + columnIndex * scale,
          y + rowIndex * scale,
          scale,
          scale,
          color
        );
      });
    });
    cursorX += 6 * scale;
  }
};

const encodePng = (pixels, width, height) => {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (width * 4 + 1);
    raw[target] = 0;
    pixels.copy(raw, target + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
};

const generateValidationImage = ({
  report,
  repository,
  shortSha,
  actor,
  isTest = false
}) => {
  const width = 1200;
  const padding = 64;
  const cardX = padding;
  const cardWidth = width - padding * 2;
  const allReportLines = wrapText(report, 57);
  const reportLines = allReportLines.slice(0, 42);
  const reportWasReduced = allReportLines.length > reportLines.length;
  if (reportWasReduced) reportLines.push("[RELATORIO REDUZIDO - VEJA O E-MAIL COMPLETO]");

  const metaLines = [
    ...wrapText("REPOSITORIO: " + repository, 57),
    "COMMIT: " + shortSha,
    ...wrapText("ALTERADO POR: " + actor, 57)
  ];

  const lineHeight = 34;
  const reportHeight = Math.max(5, reportLines.length) * lineHeight;
  const height = Math.max(760, Math.min(2200, 560 + reportHeight));
  const pixels = Buffer.alloc(width * height * 4);
  drawRect(pixels, width, height, 0, 0, width, height, COLORS.background);
  drawRect(pixels, width, height, cardX, 48, cardWidth, height - 96, COLORS.card);
  drawRect(pixels, width, height, cardX, 48, 10, height - 96, isTest ? COLORS.test : COLORS.accent);
  drawRect(pixels, width, height, cardX, 48, cardWidth, 2, COLORS.border);
  drawRect(pixels, width, height, cardX, height - 50, cardWidth, 2, COLORS.border);

  drawText(
    pixels,
    width,
    height,
    "ASSISTENTE DO BLOG PESSOAL",
    cardX + 46,
    88,
    4,
    COLORS.title
  );
  drawText(
    pixels,
    width,
    height,
    isTest ? "TESTE DE ALERTA" : "ERRO ENCONTRADO",
    cardX + 46,
    142,
    3,
    isTest ? COLORS.test : COLORS.accent
  );

  let y = 212;
  metaLines.forEach((line) => {
    drawText(pixels, width, height, line, cardX + 46, y, 3, COLORS.muted);
    y += lineHeight;
  });

  y += 24;
  drawRect(pixels, width, height, cardX + 42, y - 15, cardWidth - 84, 2, COLORS.border);
  drawText(
    pixels,
    width,
    height,
    isTest ? "DIAGNOSTICO SIMULADO" : "O QUE ESTA ERRADO",
    cardX + 46,
    y + 12,
    3,
    isTest ? COLORS.test : COLORS.accent
  );
  y += 64;

  reportLines.forEach((line) => {
    if (y + 24 >= height - 90) return;
    const isProblem = /^(?:\[ERRO|ARQUIVO:|LINHA:|PROBLEMA:|COMO RESOLVER:|[-*])/.test(
      line.trim()
    );
    if (isProblem) {
      drawRect(
        pixels,
        width,
        height,
        cardX + 43,
        y - 5,
        5,
        27,
        isTest ? COLORS.test : COLORS.accent
      );
    }
    drawText(
      pixels,
      width,
      height,
      line,
      cardX + 62,
      y,
      3,
      COLORS.text
    );
    y += lineHeight;
  });

  drawText(
    pixels,
    width,
    height,
    "GERADO AUTOMATICAMENTE PELO GITHUB ACTIONS",
    cardX + 46,
    height - 87,
    2,
    COLORS.muted
  );

  return encodePng(pixels, width, height);
};

module.exports = { generateValidationImage };

if (require.main === module) {
  const reportFile = process.argv[2];
  const outputFile = process.argv[3] || "print-validacao-teste.png";
  const report = reportFile && fs.existsSync(reportFile)
    ? fs.readFileSync(reportFile, "utf8")
    : [
        "Foram encontrados 2 problema(s).",
        "",
        "[ERRO 1] Codigo JavaScript invalido",
        "Arquivo: memorias.js",
        "Linha: 653",
        "Coluna: 3",
        "Problema: Unexpected token '{'",
        "Trecho:",
        "  652 |   }",
        "> 653 |   {",
        "      |   ^",
        "Como resolver: adicione uma virgula no final da linha 652.",
        "",
        "[ERRO 2] Arquivo de audio nao encontrado",
        "Arquivo: memorias.js",
        "Linha: 684",
        "Como resolver: envie o audio ou corrija o caminho."
      ].join("\n");

  const image = generateValidationImage({
    report,
    repository: process.env.GITHUB_REPOSITORY || "Ryan/Blog-pessoal-site",
    shortSha: (process.env.GITHUB_SHA || "46e9de6").slice(0, 7),
    actor: process.env.GITHUB_ACTOR || "Ryan",
    isTest: process.env.ALERT_TEST === "true"
  });

  fs.writeFileSync(outputFile, image);
  console.log("Imagem criada: " + outputFile);
}


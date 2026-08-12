#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const removeAnsi = (text) =>
  text.replace(/\u001b\[[0-9;]*m/g, "").trim();

const normalizeText = (text) =>
  text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const main = async () => {
  const isTest = process.env.ALERT_TEST === "true";
  const required = ["RESEND_API_KEY", "ALERT_EMAIL"];
  const missing = required.filter((name) => !process.env[name]?.trim());

  if (missing.length) {
    console.warn(
      "Alerta por e-mail não enviado: configure os Secrets " +
        missing.join(", ") +
        " no GitHub."
    );
    return;
  }

  const reportFile = process.argv[2] || "resultado-validacao.txt";
  let report = "A validação falhou, mas o relatório não foi encontrado.";

  if (fs.existsSync(reportFile)) {
    report = removeAnsi(fs.readFileSync(reportFile, "utf8"));
  }

  const maxReportLength = 12000;
  if (report.length > maxReportLength) {
    report =
      report.slice(0, maxReportLength) +
      "\n\n[Relatório reduzido. Abra a execução do GitHub para ver o restante.]";
  }

  const repository =
    process.env.GITHUB_REPOSITORY || "repositório desconhecido";
  const sha = process.env.GITHUB_SHA || "";
  const shortSha = sha ? sha.slice(0, 7) : "sem commit";
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  const runId = process.env.GITHUB_RUN_ID || "";
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT || "1";
  const actor = process.env.GITHUB_ACTOR || "usuário desconhecido";
  const commitUrl = sha
    ? server + "/" + repository + "/commit/" + sha
    : "";
  const runUrl = runId
    ? server + "/" + repository + "/actions/runs/" + runId
    : "";

  const lines = [
    isTest
      ? "TESTE: o assistente de alertas do Blog Pessoal está funcionando."
      : "O assistente do Blog Pessoal encontrou um erro na validação.",
    "",
    "Repositório: " + repository,
    "Commit: " + shortSha,
    "Alterado por: " + actor,
    commitUrl ? "Ver commit: " + commitUrl : "",
    runUrl ? "Ver execução completa: " + runUrl : "",
    "",
    isTest ? "Diagnóstico simulado:" : "O que está errado:",
    normalizeText(report),
    "",
    isTest
      ? "Este foi apenas um teste. Nenhum erro foi inserido no site."
      : "Corrija os problemas acima e envie um novo commit. " +
        "A validação será executada novamente automaticamente."
  ].filter(Boolean);

  const from =
    process.env.ALERT_FROM?.trim() ||
    "Blog Pessoal <onboarding@resend.dev>";
  const recipients = process.env.ALERT_EMAIL
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!recipients.length) {
    console.warn(
      "Alerta por e-mail não enviado: ALERT_EMAIL não contém um destinatário válido."
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "blog-pessoal-validacao/1.0",
      "Idempotency-Key":
        (
          "blog-validacao-" +
          repository +
          "-" +
          sha +
          "-" +
          runId +
          "-" +
          runAttempt
        )
          .replace(/[^A-Za-z0-9_.-]/g, "-")
          .slice(0, 256)
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: isTest
        ? "TESTE — Assistente do Blog Pessoal"
        : "Erro no Blog Pessoal — commit " + shortSha,
      text: lines.join("\n")
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    let detail = responseText;
    try {
      const parsed = JSON.parse(responseText);
      detail = parsed.message || parsed.name || responseText;
    } catch {
      // Mantém a resposta original quando ela não for JSON.
    }

    throw new Error(
      "O Resend recusou o alerta (" + response.status + "): " + detail
    );
  }

  console.log(
    (isTest ? "E-mail de teste" : "Alerta de validação") +
      " enviado para " +
      recipients.length +
      " destinatário(s)."
  );
};

main().catch((error) => {
  console.error("Falha ao enviar o alerta por e-mail: " + error.message);
  process.exit(1);
});

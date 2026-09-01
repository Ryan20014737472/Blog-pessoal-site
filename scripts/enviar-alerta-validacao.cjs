#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const {
  generateValidationImage
} = require("./gerar-print-validacao.cjs");

const removeAnsi = (text) =>
  text.replace(/\u001b\[[0-9;]*m/g, "").trim();

const normalizeText = (text) =>
  text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
  const jsonReportFile = process.argv[3] || "resultado-validacao.json";
  let report = "A validação falhou, mas o relatório não foi encontrado.";
  let structuredReport = null;

  if (fs.existsSync(reportFile)) {
    report = removeAnsi(fs.readFileSync(reportFile, "utf8"));
  }

  if (fs.existsSync(jsonReportFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonReportFile, "utf8"));
      if (parsed && Array.isArray(parsed.issues)) structuredReport = parsed;
    } catch (error) {
      console.warn(
        "O relatório JSON não pôde ser lido; o e-mail usará o texto: " +
          error.message
      );
    }
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
    commitUrl ? "Ver commit: " + commitUrl : null,
    runUrl ? "Ver execução completa: " + runUrl : null,
    "",
    isTest ? "Diagnóstico simulado:" : "O que está errado:",
    normalizeText(report),
    "",
    isTest
      ? "Este foi apenas um teste. Nenhum erro foi inserido no site."
      : "Corrija os problemas acima e envie um novo commit. " +
        "A validação será executada novamente automaticamente."
  ].filter((line) => line !== null);

  const validationImage = generateValidationImage({
    report,
    repository,
    shortSha,
    actor,
    isTest
  });
  const heading = isTest
    ? "Teste do assistente de alertas"
    : "O assistente encontrou um erro";
  const issueHtml = structuredReport?.issues?.length
    ? structuredReport.issues.slice(0, 40).map((issue, index) => {
        const severity = issue.severity === "warning" ? "Aviso" : "Erro";
        const color = issue.severity === "warning" ? "#d97706" : "#dc2626";
        const location = [
          issue.file ? "Arquivo: " + issue.file : "",
          issue.line ? "Linha: " + issue.line : "",
          issue.column ? "Coluna: " + issue.column : "",
          issue.memory ? "Memória: " + issue.memory : ""
        ].filter(Boolean).join(" &nbsp;•&nbsp; ");
        const encodedFile = String(issue.file || "")
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        const lineUrl = sha && issue.file && issue.line
          ? server + "/" + repository + "/blob/" + sha + "/" +
            encodedFile + "#L" + issue.line
          : "";
        const snippet = issue.snippet
          ? '<pre style="margin:14px 0 0;padding:14px;background:#0f172a;color:#e2e8f0;border-radius:10px;white-space:pre-wrap;word-break:break-word;font:13px/1.55 Consolas,\'Courier New\',monospace">' +
            escapeHtml(issue.snippet) + "</pre>"
          : "";
        const openLine = lineUrl
          ? '<p style="margin:14px 0 0"><a href="' +
            escapeHtml(lineUrl) +
            '" style="display:inline-block;padding:9px 13px;border-radius:8px;background:#e2e8f0;color:#0f172a;text-decoration:none;font-weight:bold">Abrir exatamente nesta linha</a></p>'
          : "";

        return [
          '<div style="margin:0 0 18px;padding:18px;border:1px solid #e2e8f0;border-left:5px solid ' +
            color + ';border-radius:12px;background:#ffffff">',
          '<h2 style="margin:0 0 9px;font-size:18px;color:' + color + '">' +
            escapeHtml(severity + " " + (index + 1) + " — " + (issue.title || "Problema encontrado")) +
            "</h2>",
          location
            ? '<p style="margin:0 0 12px;color:#475569;font-size:13px">' +
              location + "</p>"
            : "",
          '<p style="margin:0 0 10px;line-height:1.6"><strong>O que aconteceu:</strong><br>' +
            escapeHtml(issue.message || "Problema não detalhado.") + "</p>",
          snippet,
          '<p style="margin:14px 0 0;line-height:1.6"><strong>Como resolver:</strong><br>' +
            escapeHtml(issue.solution || "Abra a execução completa para conferir o diagnóstico.")
              .replace(/\n/g, "<br>") + "</p>",
          openLine,
          "</div>"
        ].join("");
      }).join("")
    : '<pre style="margin:0;padding:18px;background:#0f172a;color:#e2e8f0;border-radius:12px;white-space:pre-wrap;word-break:break-word;font:14px/1.55 Consolas,\'Courier New\',monospace">' +
      escapeHtml(normalizeText(report)) + "</pre>";
  const hiddenIssueNotice = structuredReport?.issues?.length > 40
    ? '<p style="color:#475569">O relatório possui mais problemas. Abra a execução completa para ver todos.</p>'
    : "";
  const actionLinks = [
    commitUrl
      ? '<a href="' + escapeHtml(commitUrl) + '">Ver commit</a>'
      : "",
    runUrl
      ? '<a href="' + escapeHtml(runUrl) + '">Ver execução completa</a>'
      : ""
  ].filter(Boolean).join(" &nbsp;|&nbsp; ");
  const html = [
    '<div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">',
    '<div style="max-width:900px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">',
    '<h1 style="margin:0 0 12px;font-size:24px;color:' +
      (isTest ? "#16a34a" : "#dc2626") +
      '">' +
      escapeHtml(heading) +
      "</h1>",
    '<p style="line-height:1.6">Repositório: <strong>' +
      escapeHtml(repository) +
      "</strong><br>Commit: <strong>" +
      escapeHtml(shortSha) +
      "</strong><br>Alterado por: <strong>" +
      escapeHtml(actor) +
      "</strong></p>",
    actionLinks ? "<p>" + actionLinks + "</p>" : "",
    '<h2 style="margin:24px 0 12px;font-size:19px">Diagnóstico detalhado</h2>',
    issueHtml,
    hiddenIssueNotice,
    '<h2 style="margin:24px 0 12px;font-size:19px">Imagem do diagnóstico</h2>',
    '<img src="cid:validacao-print" alt="Imagem com o diagnóstico da validação" ' +
      'style="display:block;width:100%;height:auto;margin:24px 0;border-radius:12px">',
    '<p style="margin:0;color:#475569">A imagem também está anexada como arquivo PNG.</p>',
    "</div></div>"
  ].join("");

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
      text: lines.join("\n"),
      html,
      attachments: [
        {
          content: validationImage.toString("base64"),
          filename: isTest
            ? "teste-assistente.png"
            : "erro-validacao-" + shortSha + ".png",
          content_id: "validacao-print",
          content_type: "image/png"
        }
      ]
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


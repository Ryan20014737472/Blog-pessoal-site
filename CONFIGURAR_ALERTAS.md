# Configurar alertas por e-mail

O workflow `Validar memórias` envia um diagnóstico quando encontra código inválido, caminhos quebrados ou arquivos ausentes.

## 1. Preparar o Resend

1. Crie uma conta em https://resend.com.
2. Em **API Keys**, crie uma chave.
3. Copie a chave apenas uma vez e não a coloque em nenhum arquivo do repositório.

Sem um domínio próprio, use o remetente de testes `Blog Pessoal <onboarding@resend.dev>`. Nesse modo, o Resend permite enviar somente para o e-mail cadastrado na própria conta.

## 2. Criar os Secrets no GitHub

No repositório, acesse:

**Settings → Secrets and variables → Actions → New repository secret**

Crie estes Secrets:

| Nome | Valor |
| --- | --- |
| `RESEND_API_KEY` | A chave que começa com `re_` |
| `ALERT_EMAIL` | O endereço que receberá os avisos |
| `ALERT_FROM` | `Blog Pessoal <onboarding@resend.dev>` ou um remetente de domínio verificado |

Nunca cole a chave da API em `memorias.js`, no workflow, em issues ou em mensagens públicas.

## 3. Como funciona

Quando uma alteração é enviada para a branch `main`:

1. o site inteiro é validado;
2. a saída é salva em `resultado-validacao.txt`;
3. se houver erro, o assistente envia o relatório pelo Resend;
4. a execução continua vermelha para indicar que o problema ainda precisa ser corrigido.

O e-mail inclui:

- a mensagem exata do validador;
- o número da memória, quando disponível;
- o caminho do arquivo ausente;
- o commit responsável;
- um link para a execução completa no GitHub Actions.
- uma imagem PNG com aparência de captura de tela, exibida no corpo do e-mail e anexada.

Alertas não são enviados em pull requests externos, porque os Secrets não ficam disponíveis nesse contexto.

## 4. Testar sem quebrar o site

1. Abra **Actions → Validar memórias → Run workflow**.
2. Marque **Enviar um e-mail de teste sem alterar o site**.
3. Clique em **Run workflow**.

O e-mail terá o assunto **TESTE — Assistente do Blog Pessoal** e deixará claro que nenhum erro foi inserido. Se o site estiver válido, a execução continuará verde.

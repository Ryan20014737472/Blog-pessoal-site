# Painel de memórias

O formulário já está preparado em `/admin/`. O blog público continua no GitHub Pages; o painel precisa de uma cópia do mesmo repositório no Netlify para que o login do GitHub funcione. Essa cópia serve só como endereço de edição: cada publicação feita nela cria um commit no mesmo repositório, que atualiza o GitHub Pages.

## Configuração única do login

1. No Netlify, importe o repositório `Ryan20014737472/Blog-pessoal-site` como novo projeto. Ele é um site estático: não há comando de build, e a pasta de publicação é a raiz do repositório (`.`).
2. Anote o endereço `https://SEU-SITE.netlify.app`.
3. No GitHub, abra **Settings > Developer settings > OAuth Apps > New OAuth App**. Use o endereço do passo 2 como **Homepage URL** e `https://api.netlify.com/auth/done` como **Authorization callback URL**.
4. Copie o **Client ID** e gere um **Client Secret**. No Netlify, abra **Project configuration > Security > OAuth > Install provider > GitHub** e cole os dois valores. Nunca coloque o secret no repositório nem envie em uma conversa.
5. Abra `https://SEU-SITE.netlify.app/admin/` e entre com a conta GitHub que tem permissão de escrita neste repositório. O painel aberto no endereço `github.io` não usará esse login; use o endereço do Netlify.

## Adicionar uma memória

1. No painel, abra **Blog pessoal > Memórias** e clique em **Editar**.
2. Clique em **Adicionar memória**. Preencha título, descrição e escolha **Foto** ou **Vídeo**. Envie apenas o campo de mídia correspondente; o áudio é opcional.
3. Use os controles de ordem da lista para posicionar a nova memória. A posição define o número; as páginas continuam com até 30 memórias.
4. Deixe **Corrigir português desta memória nova** ligado somente para uma memória nova. Para proteger nomes ou expressões, use `{chaves}`. Não reative essa opção em memórias antigas.
5. Clique em **Publicar**. Aguarde o commit e a validação no GitHub Actions antes de conferir o GitHub Pages.

As fotos vão para `assets/images/`, os vídeos para `assets/videos/` e os áudios para `assets/audio/`. Arquivos individuais no GitHub precisam ficar abaixo de 100 MB; vídeos maiores exigem outra solução de armazenamento. As memórias existentes permanecem em `memorias.js` e não precisam ser migradas.

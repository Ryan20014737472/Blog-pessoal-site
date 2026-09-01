# Correção automática de ortografia

As memórias já existentes não são alteradas. A automação só aceita uma memória criada com o marcador de correção já definido como `true`.

## Como adicionar uma nova memória

Copie um modelo abaixo para `memorias.js` e mantenha a linha `"corrigirOrtografia": true`.

```js
{
  "titulo": "Titulo da nova memoria",
  "texto": "Eu e a {Leninha} fomos para o habibs depois da vitoria.",
  "corrigirOrtografia": true,
  "midia": {
    "tipo": "imagem",
    "arquivo": "assets/images/nova-foto.jpg",
    "alt": "Descrição curta da foto"
  }
},
```

Para vídeo, troque `"tipo"` para `"video"`, use `assets/videos/` e inclua o `mime`:

```js
"midia": {
  "tipo": "video",
  "arquivo": "assets/videos/novo-video.mp4",
  "mime": "video/mp4"
}
```

## O que a automação faz

Depois que você envia a memória para a branch `main`, ela:

1. confere no histórico do Git se a memória realmente nasceu como uma nova memória;
2. corrige ortografia, gramática e pontuação no `titulo` e no `texto`;
3. preserva qualquer trecho protegido;
4. muda `"corrigirOrtografia": true` para `false`, para que ela nunca seja corrigida novamente;
5. valida o site antes de salvar a alteração.

Ela não mexe em caminhos de imagem, vídeo ou áudio, nem no `alt` da imagem. Ela também bloqueia uma tentativa de marcar uma memória antiga para impedir correções acidentais.

## Proteger uma palavra ou expressão

Use chaves somente no título ou no texto:

```js
"texto": "Foi muito bom ganhar a {TBR} com a {Acrux}."
```

No resultado do site ficará:

```text
Foi muito bom ganhar a TBR com a Acrux.
```

`TBR` e `Acrux` permanecem exatamente como você escreveu. Não deixe uma chave aberta; sempre use pares como `{palavra}`.

## Reutilizar a mesma foto ou vídeo

Se duas memórias usarem exatamente o mesmo arquivo de mídia, coloque também um `id` único na nova memória, por exemplo:

```js
"id": "habibs-pos-tbr-2026",
```

Esse `id` não aparece no site. Ele só ajuda a automação a identificar corretamente cada memória e não deve ser alterado depois.

## Importante

- Use `"corrigirOrtografia": true` somente em uma memória que acabou de criar.
- A primeira versão enviada dessa memória já precisa conter esse `true`; não acrescente o marcador depois em uma memória antiga.
- Quando a automação trocar o valor para `false`, não mude de volta para `true`: a memória já foi finalizada e será bloqueada por segurança.
- Se uma palavra for um nome, apelido, sigla ou gíria, proteja-a com `{chaves}`.
- A correção é feita pelo LanguageTool rodando localmente no GitHub Actions; o texto não é enviado à API pública do LanguageTool.


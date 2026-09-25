(function () {
  "use strict";

  const sitePrefix = window.location.hostname.endsWith("github.io")
    ? "/Blog-pessoal-site/"
    : "/";

  function publicPath(path) {
    if (!path) return "";
    const value = String(path).trim();
    return value.startsWith("assets/") ? sitePrefix + value : value;
  }

  function repositoryPath(path, folder, label) {
    const value = String(path || "").trim();
    const relative = value.startsWith(sitePrefix)
      ? value.slice(sitePrefix.length)
      : value.replace(/^\/+/, "");

    if (
      !relative.startsWith("assets/" + folder + "/") ||
      relative.includes("..") ||
      relative.includes("\\") ||
      /[?#]/.test(relative)
    ) {
      throw new Error(
        label + ": selecione um arquivo da pasta assets/" + folder + "/."
      );
    }
    return relative;
  }

  function readMemories(text) {
    const marker = /(?:const|let|var)\s+MEMORIAS\s*=\s*/.exec(text);
    if (!marker) throw new Error("Não encontrei a lista MEMORIAS em memorias.js.");

    const start = marker.index + marker[0].length;
    if (text[start] !== "[") throw new Error("MEMORIAS precisa ser uma lista.");
    let depth = 0;
    let quoted = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') {
        quoted = true;
      } else if (char === "[") {
        depth += 1;
      } else if (char === "]") {
        depth -= 1;
        if (depth === 0) return JSON.parse(text.slice(start, i + 1));
      }
    }
    throw new Error("A lista MEMORIAS não foi fechada.");
  }

  function toEditor(memory) {
    const media = memory.midia || {};
    const audio = memory.audio || {};
    return {
      titulo: memory.titulo || "",
      texto: memory.texto || "",
      tipo: media.tipo || "imagem",
      imagem: media.tipo === "imagem" ? publicPath(media.arquivo) : "",
      video: media.tipo === "video" ? publicPath(media.arquivo) : "",
      alt: media.alt || "",
      videoMime: media.mime || "",
      audio: publicPath(audio.arquivo),
      audioMime: audio.mime || "",
      corrigirOrtografia: memory.corrigirOrtografia === true,
      tinhaCorrecao: Object.prototype.hasOwnProperty.call(
        memory, "corrigirOrtografia"
      )
    };
  }

  function audioMime(path) {
    const extension = path.split(".").pop().toLowerCase();
    return {
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      ogg: "audio/ogg",
      wav: "audio/wav"
    }[extension] || "audio/mpeg";
  }

  function toMemory(entry, index) {
    const number = index + 1;
    const title = String(entry.titulo || "").trim();
    const text = String(entry.texto || "").trim();
    const type = entry.tipo;

    if (!title || !text) {
      throw new Error("Memória " + number + ": preencha título e descrição.");
    }
    if (type !== "imagem" && type !== "video") {
      throw new Error("Memória " + number + ": escolha foto ou vídeo.");
    }

    const media = type === "imagem"
      ? {
          tipo: "imagem",
          arquivo: repositoryPath(entry.imagem, "images", "Memória " + number),
          alt: String(entry.alt || "").trim() || title
        }
      : {
          tipo: "video",
          arquivo: repositoryPath(entry.video, "videos", "Memória " + number)
        };

    if (type === "video" && entry.videoMime) {
      media.mime = String(entry.videoMime);
    }
    if (type === "video" && entry.alt) {
      media.alt = String(entry.alt).trim();
    }

    const memory = { titulo: title, texto: text, midia: media };
    if (entry.corrigirOrtografia === true || entry.tinhaCorrecao === true) {
      memory.corrigirOrtografia = entry.corrigirOrtografia === true;
    }
    if (entry.audio) {
      const file = repositoryPath(entry.audio, "audio", "Áudio da memória " + number);
      memory.audio = {
        arquivo: file,
        mime: entry.audioMime ? String(entry.audioMime) : audioMime(file)
      };
    }
    return memory;
  }

  window.CMS.registerCustomFormat("memorias-js", "js", {
    fromFile: function (text) {
      return { memorias: readMemories(text).map(toEditor) };
    },
    toFile: function (value) {
      if (!value || !Array.isArray(value.memorias) || !value.memorias.length) {
        throw new Error("Adicione pelo menos uma memória antes de publicar.");
      }
      const memories = value.memorias.map(toMemory);
      return [
        "// Memórias em ordem de exibição. Edite pelo painel /admin/.",
        "const MEMORIAS = " + JSON.stringify(memories, null, 2) + ";",
        "",
        "if (typeof window !== \"undefined\") {",
        "  window.BLOG_MEMORIES = MEMORIAS;",
        "}",
        "",
        "if (typeof module !== \"undefined\" && module.exports) {",
        "  module.exports = MEMORIAS;",
        "}",
        ""
      ].join("\n");
    }
  });

  window.CMS.init();
}());
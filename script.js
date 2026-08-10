// Renderização, paginação automática e interações do blog
document.documentElement.classList.add("js");

const MEMORIES_PER_PAGE = 30;
const MINIMUM_PAGES = 3;
const memories = Array.isArray(window.BLOG_MEMORIES)
  ? window.BLOG_MEMORIES
  : [];

const pageUrl = (page) => {
  if (page <= 1) return "index.html";
  if (page === 2) return "pagina2.html";
  if (page === 3) return "pagina3.html";
  return "pagina3.html?pagina=" + page;
};

const createPaginationLink = (label, page, relation) => {
  const link = document.createElement("a");
  link.className = "pagination__link";
  link.href = pageUrl(page) + "#memorias";
  link.rel = relation;
  link.textContent = label;
  return link;
};

const createMedia = (memory, memoryNumber, audioId) => {
  const media = memory.midia;

  if (media.tipo === "video") {
    const video = document.createElement("video");
    video.className = "midia";
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("playsinline", "");

    const source = document.createElement("source");
    source.src = media.arquivo;
    source.type = media.mime || "video/mp4";
    video.append(source);

    const fallback = document.createElement("p");
    fallback.textContent = "Não foi possível reproduzir o vídeo.";
    video.append(fallback);
    return video;
  }

  const image = document.createElement("img");
  image.src = media.arquivo;
  image.alt = media.alt || memory.titulo || "Memória " + memoryNumber;
  image.loading = "lazy";
  image.decoding = "async";

  if (audioId) {
    image.classList.add("play-musica");
    image.dataset.audio = audioId;
  }

  return image;
};

const createMemoryArticle = (memory, index) => {
  const memoryNumber = index + 1;
  const article = document.createElement("article");
  article.className = "post";
  article.id = "memoria-" + memoryNumber;
  article.dataset.memoryNumber = String(memoryNumber);

  const audioId = memory.audio ? "audio-memoria-" + memoryNumber : "";
  article.append(createMedia(memory, memoryNumber, audioId));

  const text = document.createElement("div");
  text.className = "texto";

  const title = document.createElement("h2");
  title.textContent = memory.titulo;

  const paragraph = document.createElement("p");
  paragraph.textContent = memory.texto;

  text.append(title, paragraph);
  article.append(text);

  if (memory.audio) {
    const audio = document.createElement("audio");
    audio.id = audioId;
    audio.preload = "none";

    const source = document.createElement("source");
    source.src = memory.audio.arquivo;
    source.type = memory.audio.mime || "audio/mpeg";
    audio.append(source);
    article.append(audio);
  }

  return article;
};

const renderMemories = () => {
  const main = document.getElementById("memorias");
  if (!main) return [];

  const defaultPage = document.body.classList.contains("pagina-tres")
    ? 3
    : document.body.classList.contains("pagina-dois")
      ? 2
      : 1;
  const requestedPage = Number.parseInt(
    new URLSearchParams(window.location.search).get("pagina"),
    10
  );
  const totalPages = Math.max(
    MINIMUM_PAGES,
    Math.ceil(memories.length / MEMORIES_PER_PAGE)
  );

  let currentPage = defaultPage === 1
    ? 1
    : Math.max(
        defaultPage,
        Number.isFinite(requestedPage) ? requestedPage : defaultPage
      );
  currentPage = Math.min(currentPage, totalPages);

  const firstMemoryIndex = (currentPage - 1) * MEMORIES_PER_PAGE;
  const visibleMemories = memories.slice(
    firstMemoryIndex,
    firstMemoryIndex + MEMORIES_PER_PAGE
  );

  main.querySelectorAll(".post, hr, .empty-memories, [data-memory-loading]").forEach(
    (element) => element.remove()
  );

  const pagination = main.querySelector(".pagination");
  const fragment = document.createDocumentFragment();

  if (!visibleMemories.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-memories";

    const emptyTitle = document.createElement("h2");
    emptyTitle.textContent = "A próxima memória começa aqui";

    const emptyText = document.createElement("p");
    emptyText.textContent =
      "Quando a memória " + (firstMemoryIndex + 1) +
      " for adicionada em memorias.js, ela aparecerá nesta página automaticamente.";

    emptyState.append(emptyTitle, emptyText);
    fragment.append(emptyState);
  }

  visibleMemories.forEach((memory, offset) => {
    fragment.append(createMemoryArticle(memory, firstMemoryIndex + offset));
    if (offset < visibleMemories.length - 1) {
      fragment.append(document.createElement("hr"));
    }
  });

  main.insertBefore(fragment, pagination || null);
  main.style.counterReset = "memoria " + firstMemoryIndex;

  const memoryRange = document.querySelector("[data-memory-range]");
  if (memoryRange) {
    const first = firstMemoryIndex + 1;
    const last = firstMemoryIndex + visibleMemories.length;
    memoryRange.dataset.memoryStart = String(first);
    memoryRange.textContent = visibleMemories.length
      ? "Memórias " + first + " a " + last
      : "Próximas memórias a partir da " + first;
  }

  if (pagination) {
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;

    if (currentPage > 1) {
      pagination.append(
        createPaginationLink("← Página anterior", currentPage - 1, "prev")
      );
    }

    const status = document.createElement("span");
    status.className = "pagination__status";
    status.textContent = "Página " + currentPage + " de " + totalPages;
    pagination.append(status);

    if (currentPage < totalPages) {
      pagination.append(
        createPaginationLink("Próxima página →", currentPage + 1, "next")
      );
    }
  }

  if (currentPage > 2) {
    document.title = "👑BLOG BATISTEL👑 — Página " + currentPage;
  }

  return Array.from(main.querySelectorAll(".post"));
};

const showMediaFallback = (media, message) => {
  if (!media.isConnected || media.dataset.mediaFallback === "true") return;

  media.dataset.mediaFallback = "true";

  const fallback = document.createElement("div");
  fallback.className = "media-fallback";
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", message);
  fallback.textContent = message;

  media.replaceWith(fallback);
};

const initializeMedia = (posts) => {
  posts.forEach((post, index) => {
    post.dataset.reveal = "";
    post.style.setProperty(
      "--reveal-delay",
      Math.min(index * 45, 320) + "ms"
    );

    post.querySelectorAll("img").forEach((image) => {
      const showImageFallback = () => {
        showMediaFallback(image, "Esta imagem não pôde ser carregada.");
      };

      image.addEventListener("error", showImageFallback, { once: true });

      if (image.complete && image.naturalWidth === 0) {
        showImageFallback();
      }
    });

    post.querySelectorAll("video").forEach((video) => {
      const showVideoFallback = () => {
        showMediaFallback(video, "Este vídeo não pôde ser carregado.");
      };

      video.addEventListener("error", showVideoFallback, { once: true });
      video.querySelectorAll("source").forEach((source) => {
        source.addEventListener("error", showVideoFallback, { once: true });
      });

      if (video.error) {
        showVideoFallback();
      }
    });
  });
};

const initializeReadingUi = () => {
  const progress = document.createElement("div");
  progress.id = "reading-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.type = "button";
  backToTop.setAttribute("aria-label", "Voltar ao início");
  backToTop.textContent = "↑";
  document.body.append(backToTop);

  const updateReadingUi = () => {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = maximum > 0
      ? Math.min(window.scrollY / maximum, 1)
      : 0;

    progress.style.transform = "scaleX(" + percentage + ")";
    backToTop.classList.toggle("is-visible", window.scrollY > 520);
  };

  window.addEventListener("scroll", updateReadingUi, { passive: true });
  window.addEventListener("resize", updateReadingUi);
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  updateReadingUi();
};

const initializeReveal = (posts) => {
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    posts.forEach((post) => revealObserver.observe(post));
  } else {
    posts.forEach((post) => post.classList.add("is-visible"));
  }
};

const initializeAudio = () => {
  let currentAudio = null;

  const stopAudio = (audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.closest(".post")?.classList.remove("is-playing");
    document
      .querySelector('[data-audio="' + audio.id + '"]')
      ?.setAttribute("aria-pressed", "false");
  };

  document.querySelectorAll(".play-musica").forEach((trigger) => {
    const audioId = trigger.dataset.audio;
    const audio = document.getElementById(audioId);
    const title = trigger.closest(".post")?.querySelector("h2")
      ?.textContent?.trim();

    if (!audio) return;

    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-pressed", "false");
    trigger.setAttribute(
      "aria-label",
      "Tocar música de " + (title || "esta memória")
    );

    const toggleAudio = async () => {
      if (currentAudio && currentAudio !== audio) {
        stopAudio(currentAudio);
      }

      if (audio.paused) {
        try {
          await audio.play();
          currentAudio = audio;
          trigger.setAttribute("aria-pressed", "true");
          trigger.closest(".post")?.classList.add("is-playing");
        } catch {
          trigger.setAttribute("aria-pressed", "false");
        }
      } else {
        stopAudio(audio);
        currentAudio = null;
      }
    };

    trigger.addEventListener("click", toggleAudio);
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleAudio();
    });

    audio.addEventListener("ended", () => {
      trigger.setAttribute("aria-pressed", "false");
      trigger.closest(".post")?.classList.remove("is-playing");
      currentAudio = null;
    });
  });
};

const posts = renderMemories();
initializeMedia(posts);
initializeReadingUi();
initializeReveal(posts);
initializeAudio();

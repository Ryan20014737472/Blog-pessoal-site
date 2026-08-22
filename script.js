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
  link.dataset.page = String(page);
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
    video.preload = "none";
    video.dataset.videoLoaded = "false";
    video.setAttribute("playsinline", "");
    video.setAttribute(
      "aria-label",
      "Vídeo da memória " + memoryNumber + ": " + memory.titulo
    );

    const source = document.createElement("source");
    source.dataset.src = media.arquivo;
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
  const isRequestedMemory =
    window.location.hash === "#memoria-" + memoryNumber;
  image.loading = isRequestedMemory ? "eager" : "lazy";
  image.decoding = "async";
  if (isRequestedMemory) image.fetchPriority = "high";

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

  let audioButton = null;

  if (memory.audio) {
    audioButton = document.createElement("button");
    audioButton.className = "play-musica audio-player-button";
    audioButton.type = "button";
    audioButton.dataset.audio = audioId;
    audioButton.setAttribute("aria-pressed", "false");

    const audioIcon = document.createElement("span");
    audioIcon.className = "audio-player-button__icon";
    audioIcon.setAttribute("aria-hidden", "true");

    const playIcon = document.createElement("span");
    playIcon.className = "audio-player-button__play";
    playIcon.textContent = "▶";

    const visualizer = document.createElement("span");
    visualizer.className = "audio-player-button__visualizer";

    for (let barIndex = 0; barIndex < 4; barIndex += 1) {
      const bar = document.createElement("span");
      bar.className = "audio-player-button__bar";
      visualizer.append(bar);
    }

    audioIcon.append(playIcon, visualizer);

    const audioLabel = document.createElement("span");
    audioLabel.className = "audio-player-button__label";
    audioLabel.textContent = "Tocar áudio";

    audioButton.append(audioIcon, audioLabel);
  }

  const text = document.createElement("div");
  text.className = "texto";

  const title = document.createElement("h2");
  title.textContent = memory.titulo;

  const paragraph = document.createElement("p");
  paragraph.textContent = memory.texto;

  const shareButton = document.createElement("button");
  shareButton.className = "memory-share-button";
  shareButton.type = "button";
  shareButton.dataset.memoryNumber = String(memoryNumber);
  shareButton.setAttribute(
    "aria-label",
    "Copiar link da memória " + memoryNumber + ": " + memory.titulo
  );

  const shareIcon = document.createElement("span");
  shareIcon.className = "memory-share-button__icon";
  shareIcon.setAttribute("aria-hidden", "true");
  shareIcon.textContent = "🔗";

  const shareLabel = document.createElement("span");
  shareLabel.className = "memory-share-button__label";
  shareLabel.textContent = "Copiar link";

  shareButton.append(shareIcon, shareLabel);

  const memoryActions = document.createElement("div");
  memoryActions.className = "memory-card-actions";
  if (audioButton) memoryActions.append(audioButton);
  memoryActions.append(shareButton);

  text.append(title, paragraph, memoryActions);
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


const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

const memoryPage = (memoryIndex) =>
  Math.floor(memoryIndex / MEMORIES_PER_PAGE) + 1;

const initializeMemorySearch = () => {
  const main = document.getElementById("memorias");
  if (!main || !memories.length) return null;

  const tools = document.createElement("section");
  tools.className = "memory-tools";
  tools.setAttribute("aria-labelledby", "memory-search-title");

  const heading = document.createElement("h2");
  heading.id = "memory-search-title";
  heading.className = "memory-tools__title";
  heading.textContent = "Encontre uma memória";

  const description = document.createElement("p");
  description.className = "memory-tools__description";
  description.textContent =
    "Digite o número ou uma palavra do título para ir direto à lembrança.";

  const form = document.createElement("form");
  form.className = "memory-search";
  form.setAttribute("role", "search");

  const label = document.createElement("label");
  label.className = "sr-only";
  label.htmlFor = "memory-search-input";
  label.textContent = "Número ou título da memória";

  const input = document.createElement("input");
  input.id = "memory-search-input";
  input.className = "memory-search__input";
  input.type = "search";
  input.inputMode = "search";
  input.autocomplete = "off";
  input.placeholder = "Ex.: 31 ou Pequeno Ryan";

  const submit = document.createElement("button");
  submit.className = "memory-search__submit";
  submit.type = "submit";
  submit.textContent = "Buscar";

  const status = document.createElement("p");
  status.className = "memory-search__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = memories.length + " memórias disponíveis.";

  const results = document.createElement("ul");
  results.className = "memory-search__results";
  results.hidden = true;

  form.append(label, input, submit);
  tools.append(heading, description, form, status, results);
  main.prepend(tools);

  let matches = [];

  const openMemory = (match) => {
    if (!match) return;
    window.location.assign(
      pageUrl(memoryPage(match.index)) + "#memoria-" + (match.index + 1)
    );
  };

  const renderResults = (query) => {
    const normalizedQuery = normalizeSearchText(query);
    results.replaceChildren();

    if (!normalizedQuery) {
      matches = [];
      results.hidden = true;
      status.textContent = memories.length + " memórias disponíveis.";
      return;
    }

    const requestedNumber = /^\d+$/.test(normalizedQuery)
      ? Number.parseInt(normalizedQuery, 10)
      : null;

    matches = memories
      .map((memory, index) => ({
        memory,
        index,
        title: normalizeSearchText(memory.titulo)
      }))
      .filter((entry) => {
        if (requestedNumber !== null) {
          return entry.index + 1 === requestedNumber;
        }
        return entry.title.includes(normalizedQuery);
      });

    if (!matches.length) {
      results.hidden = true;
      status.textContent =
        "Nenhuma memória encontrada para “" + query.trim() + "”.";
      return;
    }

    const visibleMatches = matches.slice(0, 8);
    visibleMatches.forEach((entry) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const number = entry.index + 1;
      const page = memoryPage(entry.index);

      link.className = "memory-search__result";
      link.href = pageUrl(page) + "#memoria-" + number;

      const resultNumber = document.createElement("span");
      resultNumber.className = "memory-search__result-number";
      resultNumber.textContent = "Memória " + number;

      const resultTitle = document.createElement("strong");
      resultTitle.textContent = entry.memory.titulo;

      const resultPage = document.createElement("span");
      resultPage.className = "memory-search__result-page";
      resultPage.textContent = "Página " + page;

      link.append(resultNumber, resultTitle, resultPage);
      item.append(link);
      results.append(item);
    });

    results.hidden = false;
    status.textContent =
      matches.length === 1
        ? "1 memória encontrada."
        : matches.length + " memórias encontradas.";
  };

  input.addEventListener("input", () => renderResults(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    input.value = "";
    renderResults("");
    input.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderResults(input.value);
    openMemory(matches[0]);
  });

  document.addEventListener("click", (event) => {
    if (tools.contains(event.target)) return;
    results.hidden = true;
  });

  return input;
};


const memoryPermalink = (memoryNumber) => {
  const targetPage = memoryPage(memoryNumber - 1);
  const url = new URL(pageUrl(targetPage), window.location.href);
  url.search = "";
  url.hash = "memoria-" + memoryNumber;
  return url.href;
};

const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporary = document.createElement("textarea");
  temporary.value = value;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.opacity = "0";
  document.body.append(temporary);
  temporary.select();

  const copied = document.execCommand("copy");
  temporary.remove();

  if (!copied) {
    throw new Error("Não foi possível copiar o link.");
  }
};

const initializeMemorySharing = () => {
  document.querySelectorAll(".memory-share-button").forEach((button) => {
    const memoryNumber = Number.parseInt(button.dataset.memoryNumber, 10);
    const label = button.querySelector(".memory-share-button__label");
    let resetTimer = null;

    if (!Number.isFinite(memoryNumber)) return;

    button.addEventListener("click", async () => {
      window.clearTimeout(resetTimer);
      button.disabled = true;
      button.classList.remove("has-error");

      try {
        await copyText(memoryPermalink(memoryNumber));
        button.classList.add("is-copied");
        if (label) label.textContent = "Link copiado!";
      } catch {
        button.classList.add("has-error");
        if (label) label.textContent = "Não foi possível copiar";
      }

      resetTimer = window.setTimeout(() => {
        button.disabled = false;
        button.classList.remove("is-copied", "has-error");
        if (label) label.textContent = "Copiar link";
      }, 2200);
    });
  });
};

const initializeFloatingPageNavigation = () => {
  if (!memories.length) return;

  const totalPages = Math.max(
    MINIMUM_PAGES,
    Math.ceil(memories.length / MEMORIES_PER_PAGE)
  );
  const firstRenderedMemory = Number.parseInt(
    document.querySelector(".post")?.dataset.memoryNumber,
    10
  );
  const currentPage = Number.isFinite(firstRenderedMemory)
    ? memoryPage(firstRenderedMemory - 1)
    : document.body.classList.contains("pagina-tres")
      ? 3
      : document.body.classList.contains("pagina-dois")
        ? 2
        : 1;

  const navigation = document.createElement("nav");
  navigation.className = "page-dock";
  navigation.setAttribute("aria-label", "Acesso rápido às páginas");

  const label = document.createElement("span");
  label.className = "page-dock__label";
  label.textContent = "Páginas";
  navigation.append(label);

  const pageList = document.createElement("div");
  pageList.className = "page-dock__pages";

  const visiblePages = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (
      totalPages <= 5 ||
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
    ) {
      visiblePages.push(page);
    }
  }

  visiblePages.forEach((page, index) => {
    if (index > 0 && page - visiblePages[index - 1] > 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-dock__ellipsis";
      ellipsis.textContent = "…";
      ellipsis.setAttribute("aria-hidden", "true");
      pageList.append(ellipsis);
    }

    const link = document.createElement("a");
    link.className = "page-dock__link";
    link.href = pageUrl(page) + "#memorias";
    link.dataset.page = String(page);
    link.textContent = String(page);
    link.setAttribute("aria-label", "Abrir página " + page);

    if (page === currentPage) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }

    pageList.append(link);
  });

  navigation.append(pageList);
  document.body.append(navigation);
};


const PAGE_THEME_ASSETS = {
  1: "assets/images/gengar.gif?v=2",
  2: "assets/images/charizard.gif?v=4",
  3: "assets/images/miranha.gif?v=1"
};

const initializePagePrefetch = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const slowConnection =
    connection?.saveData ||
    /(^|-)2g$/.test(connection?.effectiveType || "");

  if (slowConnection) return;

  const totalPages = Math.max(
    MINIMUM_PAGES,
    Math.ceil(memories.length / MEMORIES_PER_PAGE)
  );
  const firstRenderedMemory = Number.parseInt(
    document.querySelector(".post")?.dataset.memoryNumber,
    10
  );
  const currentPage = Number.isFinite(firstRenderedMemory)
    ? memoryPage(firstRenderedMemory - 1)
    : document.body.classList.contains("pagina-tres")
      ? 3
      : document.body.classList.contains("pagina-dois")
        ? 2
        : 1;
  const prefetched = new Set();

  const prefetchResource = (resource, type) => {
    if (!resource) return;

    const href = new URL(resource, window.location.href).href;
    if (prefetched.has(href)) return;
    prefetched.add(href);

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.fetchPriority = "low";
    if (type) link.as = type;
    document.head.append(link);
  };

  const warmPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    prefetchResource(pageUrl(page));
    prefetchResource(PAGE_THEME_ASSETS[page], "image");
  };

  document.querySelectorAll("[data-page]").forEach((link) => {
    const page = Number.parseInt(link.dataset.page, 10);
    if (!Number.isFinite(page)) return;

    const warmLinkedPage = () => warmPage(page);
    link.addEventListener("pointerenter", warmLinkedPage, { once: true });
    link.addEventListener("focus", warmLinkedPage, { once: true });
    link.addEventListener("touchstart", warmLinkedPage, {
      once: true,
      passive: true
    });
  });

  const warmAdjacentPages = () => {
    warmPage(currentPage - 1);
    warmPage(currentPage + 1);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmAdjacentPages, { timeout: 1800 });
  } else {
    window.setTimeout(warmAdjacentPages, 800);
  }
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
        if (video.dataset.videoLoaded !== "true") return;
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


const initializeLazyVideos = (posts) => {
  const videos = posts.flatMap((post) =>
    Array.from(post.querySelectorAll("video[data-video-loaded=\"false\"]"))
  );

  const loadVideo = (video) => {
    if (video.dataset.videoLoaded === "true") return;

    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      delete source.dataset.src;
    });

    video.dataset.videoLoaded = "true";
    video.preload = "metadata";
    video.load();
  };

  if (!("IntersectionObserver" in window)) {
    videos.forEach(loadVideo);
    return;
  }

  const videoObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadVideo(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "900px 0px",
      threshold: 0.01
    }
  );

  videos.forEach((video) => videoObserver.observe(video));
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
  let audioContext = null;
  const visualizers = new WeakMap();
  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const resetVisualizer = (audio) => {
    const visualizer = visualizers.get(audio);
    if (!visualizer) return;

    if (visualizer.frameId) {
      cancelAnimationFrame(visualizer.frameId);
      visualizer.frameId = null;
    }

    visualizer.bars.forEach((bar) => {
      bar.style.removeProperty("--audio-level");
    });
  };

  const prepareVisualizer = (audio, trigger) => {
    if (!AudioContextConstructor || prefersReducedMotion) return null;

    try {
      if (!audioContext) {
        audioContext = new AudioContextConstructor();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }

      let visualizer = visualizers.get(audio);

      if (!visualizer) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.78;

        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        visualizer = {
          analyser,
          bars: Array.from(
            trigger.querySelectorAll(".audio-player-button__bar")
          ),
          data: new Uint8Array(analyser.frequencyBinCount),
          frameId: null
        };

        visualizers.set(audio, visualizer);
        trigger.classList.add("has-live-visualizer");
      }

      return visualizer;
    } catch {
      return null;
    }
  };

  const startVisualizer = (audio, visualizer) => {
    if (!visualizer || visualizer.frameId) return;

    const draw = () => {
      if (audio.paused || audio.ended) {
        visualizer.frameId = null;
        return;
      }

      visualizer.analyser.getByteFrequencyData(visualizer.data);
      const usefulLength = Math.max(
        visualizer.bars.length,
        Math.floor(visualizer.data.length * 0.72)
      );

      visualizer.bars.forEach((bar, index) => {
        const start = Math.floor(
          (index * usefulLength) / visualizer.bars.length
        );
        const end = Math.max(
          start + 1,
          Math.floor(
            ((index + 1) * usefulLength) / visualizer.bars.length
          )
        );
        let total = 0;

        for (let frequency = start; frequency < end; frequency += 1) {
          total += visualizer.data[frequency] || 0;
        }

        const average = total / (end - start);
        const level = Math.min(1, Math.max(0.2, 0.2 + average / 245));
        bar.style.setProperty("--audio-level", level.toFixed(3));
      });

      visualizer.frameId = requestAnimationFrame(draw);
    };

    draw();
  };

  const setTriggerState = (audio, playing) => {
    const trigger = document.querySelector(
      '[data-audio="' + audio.id + '"]'
    );
    if (!trigger) return;

    const title = trigger.closest(".post")?.querySelector("h2")
      ?.textContent?.trim() || "esta memória";
    const label = trigger.querySelector(".audio-player-button__label");

    trigger.setAttribute("aria-pressed", String(playing));
    trigger.setAttribute(
      "aria-label",
      (playing ? "Pausar áudio de " : "Tocar áudio de ") + title
    );
    if (label) label.textContent = playing ? "Pausar áudio" : "Tocar áudio";
    trigger.closest(".post")?.classList.toggle("is-playing", playing);
  };

  const stopAudio = (audio) => {
    audio.pause();
    audio.currentTime = 0;
    resetVisualizer(audio);
    setTriggerState(audio, false);
  };

  document.querySelectorAll(".play-musica").forEach((trigger) => {
    const audioId = trigger.dataset.audio;
    const audio = document.getElementById(audioId);

    if (!audio) return;

    setTriggerState(audio, false);

    const toggleAudio = async () => {
      if (currentAudio && currentAudio !== audio) {
        stopAudio(currentAudio);
        currentAudio = null;
      }

      if (audio.paused) {
        try {
          const visualizer = prepareVisualizer(audio, trigger);
          await audio.play();
          currentAudio = audio;
          setTriggerState(audio, true);
          startVisualizer(audio, visualizer);
        } catch {
          resetVisualizer(audio);
          setTriggerState(audio, false);
          currentAudio = null;
        }
      } else {
        stopAudio(audio);
        currentAudio = null;
      }
    };

    trigger.addEventListener("click", toggleAudio);

    audio.addEventListener("ended", () => {
      resetVisualizer(audio);
      setTriggerState(audio, false);
      currentAudio = null;
    });

    audio.addEventListener("error", () => {
      resetVisualizer(audio);
      setTriggerState(audio, false);
      trigger.disabled = true;
      trigger.setAttribute("aria-label", "Áudio indisponível");
      const label = trigger.querySelector(".audio-player-button__label");
      if (label) label.textContent = "Áudio indisponível";
    });
  });
};

const initializeRandomMemoryButton = () => {
  const primaryAction = document.querySelector(".hero__cta");
  if (!primaryAction || !memories.length) return;

  const actions = document.createElement("div");
  actions.className = "hero__actions";
  primaryAction.before(actions);
  actions.append(primaryAction);

  const randomButton = document.createElement("button");
  randomButton.className =
    "hero__cta hero__cta--secondary memory-random-button";
  randomButton.type = "button";
  randomButton.textContent = "🎲 Memória aleatória";
  randomButton.setAttribute(
    "aria-label",
    "Abrir uma memória escolhida aleatoriamente"
  );

  randomButton.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * memories.length);
    const memoryNumber = randomIndex + 1;
    const targetPage =
      Math.floor(randomIndex / MEMORIES_PER_PAGE) + 1;

    window.location.assign(
      pageUrl(targetPage) + "#memoria-" + memoryNumber
    );
  });

  actions.append(randomButton);
};

const nextAnimationFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

const waitForTargetMedia = async (target) => {
  const media = target.querySelector("img, video");
  if (!media) return;

  const isVideo = media.tagName === "VIDEO";

  if (isVideo && media.dataset.videoLoaded === "false") {
    media.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      delete source.dataset.src;
    });

    media.dataset.videoLoaded = "true";
    media.preload = "metadata";
    media.load();
  }

  const isReady = () =>
    isVideo ? media.readyState >= 1 : media.complete;

  if (!isReady()) {
    await new Promise((resolve) => {
      const readyEvent = isVideo ? "loadedmetadata" : "load";
      let timeoutId;

      const finish = () => {
        window.clearTimeout(timeoutId);
        media.removeEventListener(readyEvent, finish);
        media.removeEventListener("error", finish);
        resolve();
      };

      media.addEventListener(readyEvent, finish, { once: true });
      media.addEventListener("error", finish, { once: true });
      timeoutId = window.setTimeout(finish, 2500);
    });
  }

  if (!isVideo && media.complete && media.naturalWidth > 0 && media.decode) {
    await Promise.race([
      media.decode().catch(() => {}),
      new Promise((resolve) => window.setTimeout(resolve, 500))
    ]);
  }
};

const targetScrollMargin = (target) =>
  Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;

const alignRequestedMemory = (target, behavior) => {
  const top = Math.max(
    0,
    window.scrollY +
      target.getBoundingClientRect().top -
      targetScrollMargin(target)
  );

  window.scrollTo({ top, behavior });
};

let requestedMemoryScrollId = 0;
let stopRequestedMemoryAlignment = () => {};

const maintainRequestedMemoryAlignment = (
  target,
  reducedMotion,
  scrollRequestId
) => {
  let isActive = true;
  let observer;
  let intervalId;
  let startTimeoutId;
  let finishTimeoutId;

  const correctPosition = () => {
    if (!isActive || scrollRequestId !== requestedMemoryScrollId) return;

    const difference =
      target.getBoundingClientRect().top - targetScrollMargin(target);

    if (Math.abs(difference) > 2) {
      window.scrollBy({ top: difference, behavior: "auto" });
    }
  };

  const stopForUser = () => stopRequestedMemoryAlignment();

  const cleanup = () => {
    if (!isActive) return;
    isActive = false;
    observer?.disconnect();
    window.clearInterval(intervalId);
    window.clearTimeout(startTimeoutId);
    window.clearTimeout(finishTimeoutId);
    window.removeEventListener("wheel", stopForUser);
    window.removeEventListener("touchstart", stopForUser);
    window.removeEventListener("keydown", stopForUser);

    if (stopRequestedMemoryAlignment === cleanup) {
      stopRequestedMemoryAlignment = () => {};
    }
  };

  stopRequestedMemoryAlignment = cleanup;

  window.addEventListener("wheel", stopForUser, { passive: true });
  window.addEventListener("touchstart", stopForUser, { passive: true });
  window.addEventListener("keydown", stopForUser);

  startTimeoutId = window.setTimeout(() => {
    if (!isActive) return;

    correctPosition();

    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(() => {
        requestAnimationFrame(correctPosition);
      });
      observer.observe(document.getElementById("memorias") || document.body);
    }

    // Também confere a posição quando o navegador não informa uma mudança
    // de altura causada por conteúdo com content-visibility.
    intervalId = window.setInterval(correctPosition, 150);

    finishTimeoutId = window.setTimeout(cleanup, 12000);
  }, reducedMotion ? 80 : 700);
};

const scrollToRequestedMemory = async () => {
  const scrollRequestId = ++requestedMemoryScrollId;
  stopRequestedMemoryAlignment();

  const hash = decodeURIComponent(window.location.hash);
  if (!/^#memoria-\d+$/.test(hash)) return;

  const target = document.getElementById(hash.slice(1));
  if (!target) return;

  target.classList.add("is-scroll-target", "is-visible");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  await nextAnimationFrame();

  // Coloca a memória na tela para ativar o carregamento preguiçoso.
  alignRequestedMemory(target, "auto");
  await waitForTargetMedia(target);
  if (scrollRequestId !== requestedMemoryScrollId) return;

  await nextAnimationFrame();
  await nextAnimationFrame();
  if (scrollRequestId !== requestedMemoryScrollId) return;

  // Recalcula a posição depois que a mídia definiu seu tamanho real.
  alignRequestedMemory(target, reducedMotion ? "auto" : "smooth");

  maintainRequestedMemoryAlignment(target, reducedMotion, scrollRequestId);
};

const posts = renderMemories();
initializeMemorySearch();
initializeFloatingPageNavigation();
initializePagePrefetch();
initializeMemorySharing();
initializeRandomMemoryButton();
initializeMedia(posts);
initializeLazyVideos(posts);
initializeReadingUi();
initializeReveal(posts);
initializeAudio();
scrollToRequestedMemory();
window.addEventListener("hashchange", scrollToRequestedMemory);

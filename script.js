// Interações, paginação automática e aprimoramentos visuais do blog
document.documentElement.classList.add("js");

const MEMORIES_PER_PAGE = 30;

const pageUrl = (page) => {
  if (page <= 1) return "index.html";
  if (page === 2) return "pagina2.html";
  return "pagina2.html?pagina=" + page;
};

const createPaginationLink = (label, page, relation) => {
  const link = document.createElement("a");
  link.className = "pagination__link";
  link.href = pageUrl(page) + "#memorias";
  link.rel = relation;
  link.textContent = label;
  return link;
};

const prepareAutomaticPagination = async () => {
  const main = document.getElementById("memorias");
  if (!main) return;

  const isArchivePage = document.body.classList.contains("pagina-dois");
  const requestedPage = Number.parseInt(
    new URLSearchParams(window.location.search).get("pagina"),
    10
  );
  let currentPage = isArchivePage
    ? Math.max(2, Number.isFinite(requestedPage) ? requestedPage : 2)
    : 1;

  try {
    const sourceUrl = new URL(
      isArchivePage ? "index.html" : "pagina2.html",
      window.location.href
    );
    sourceUrl.searchParams.set("_memorias", Date.now().toString());

    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Página de origem indisponível: " + response.status);
    }

    const sourceDocument = new DOMParser().parseFromString(
      await response.text(),
      "text/html"
    );
    const localPosts = Array.from(main.querySelectorAll(".post"));
    const remotePosts = Array.from(
      sourceDocument.querySelectorAll("#memorias .post")
    );
    const allPosts = isArchivePage
      ? remotePosts.concat(localPosts)
      : localPosts.concat(remotePosts);

    const totalPages = Math.max(
      1,
      Math.ceil(allPosts.length / MEMORIES_PER_PAGE)
    );
    currentPage = Math.min(currentPage, totalPages);

    const firstMemoryIndex = (currentPage - 1) * MEMORIES_PER_PAGE;
    const visiblePosts = allPosts.slice(
      firstMemoryIndex,
      firstMemoryIndex + MEMORIES_PER_PAGE
    );

    main.querySelectorAll(".post, hr").forEach((element) => element.remove());

    const fragment = document.createDocumentFragment();
    visiblePosts.forEach((post, index) => {
      fragment.append(document.importNode(post, true));
      if (index < visiblePosts.length - 1) {
        fragment.append(document.createElement("hr"));
      }
    });

    const insertionPoint = Array.from(main.children).find((element) =>
      element.matches(".pagination, script")
    );
    main.insertBefore(fragment, insertionPoint || null);
    main.style.counterReset = "memoria " + firstMemoryIndex;

    const memoryRange = document.querySelector("[data-memory-range]");
    if (memoryRange) {
      memoryRange.dataset.memoryStart = String(firstMemoryIndex + 1);
    }

    let pagination = document.querySelector(".pagination");
    if (!pagination) {
      pagination = document.createElement("nav");
      pagination.className = "pagination";
      pagination.setAttribute("aria-label", "Navegação entre páginas");
      main.insertAdjacentElement("afterend", pagination);
    }

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

    if (currentPage > 2) {
      document.title = "👑BLOG BATISTEL👑 — Página " + currentPage;
    }
  } catch (error) {
    console.warn("A paginação automática não pôde ser atualizada.", error);
  }
};

const initializeBlog = () => {
  const posts = Array.from(document.querySelectorAll(".post"));
  
  const memoryRange = document.querySelector("[data-memory-range]");
  if (memoryRange) {
    const start = Number(memoryRange.dataset.memoryStart) || 1;
    const end = start + posts.length - 1;
    memoryRange.textContent = "Memórias " + start + " a " + end;
  }
  
  const showMediaFallback = (media, message) => {
    if (media.dataset.mediaFallback === "true") return;
  
    media.dataset.mediaFallback = "true";
  
    const fallback = document.createElement("div");
    fallback.className = "media-fallback";
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", message);
    fallback.textContent = message;
  
    media.replaceWith(fallback);
  };
  
  posts.forEach((post, index) => {
    post.dataset.reveal = "";
    post.style.setProperty("--reveal-delay", Math.min(index * 45, 320) + "ms");
  
    post.querySelectorAll("img").forEach((image) => {
      image.loading = "lazy";
      image.decoding = "async";
  
      const showImageFallback = () => {
        showMediaFallback(image, "Esta imagem não pôde ser carregada.");
      };
  
      image.addEventListener("error", showImageFallback, { once: true });
  
      if (image.complete && image.naturalWidth === 0) {
        showImageFallback();
      }
    });
  
    post.querySelectorAll("video").forEach((video) => {
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("playsinline", "");
  
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
    const percentage = maximum > 0 ? Math.min(window.scrollY / maximum, 1) : 0;
  
    progress.style.transform = "scaleX(" + percentage + ")";
    backToTop.classList.toggle("is-visible", window.scrollY > 520);
  };
  
  window.addEventListener("scroll", updateReadingUi, { passive: true });
  window.addEventListener("resize", updateReadingUi);
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  updateReadingUi();
  
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
  
  let audioAtual = null;
  
  const stopAudio = (audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.closest(".post")?.classList.remove("is-playing");
    document.querySelector('[data-audio="' + audio.id + '"]')?.setAttribute("aria-pressed", "false");
  };
  
  document.querySelectorAll(".play-musica").forEach((trigger) => {
    const audioId = trigger.getAttribute("data-audio");
    const audio = document.getElementById(audioId);
    const title = trigger.closest(".post")?.querySelector("h2")?.textContent?.trim();
  
    if (!audio) return;
  
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-pressed", "false");
    trigger.setAttribute("aria-label", "Tocar música de " + (title || "esta memória"));
  
    const toggleAudio = () => {
      if (audioAtual && audioAtual !== audio) {
        stopAudio(audioAtual);
      }
  
      if (audio.paused) {
        audio.play();
        audioAtual = audio;
        trigger.setAttribute("aria-pressed", "true");
        trigger.closest(".post")?.classList.add("is-playing");
      } else {
        stopAudio(audio);
        audioAtual = null;
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
      audioAtual = null;
    });
  });
};

prepareAutomaticPagination().finally(initializeBlog);

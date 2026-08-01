// Interações e aprimoramentos visuais do blog
document.documentElement.classList.add("js");

const posts = Array.from(document.querySelectorAll(".post"));

posts.forEach((post, index) => {
  post.dataset.reveal = "";
  post.style.setProperty("--reveal-delay", Math.min(index * 45, 320) + "ms");

  post.querySelectorAll("img").forEach((image) => {
    image.loading = "lazy";
    image.decoding = "async";
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

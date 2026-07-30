// Interações do blog
let audioAtual = null;

document.querySelectorAll('.play-musica').forEach(img => {
  img.addEventListener('click', () => {

    const audioId = img.getAttribute('data-audio');
    const audio = document.getElementById(audioId);

    // se já tem um tocando, para ele
    if (audioAtual && audioAtual !== audio) {
      audioAtual.pause();
      audioAtual.currentTime = 0;
    }

    // toggle play/pause
    if (audio.paused) {
      audio.play();
      audioAtual = audio;
    } else {
      audio.pause();
      audioAtual = null;
    }

  });
});

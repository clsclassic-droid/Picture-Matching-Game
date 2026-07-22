// Maps Drive photo base filename (no extension) → animation mp4 path.
// Add one entry per photo that has a recorded animation.
const ANIME_MAP = {
  "1c04f205b7b5a7fedd251a27772ea799": "assets/anime/1.mp4",
};

const CardAnime = (() => {
  function getAnimeUrl(driveFilename) {
    if (!driveFilename) return null;
    const base = driveFilename.replace(/\.[^.]+$/, "");
    return ANIME_MAP[base] || null;
  }

  function attachToCard(cardEl, animeUrl) {
    if (!animeUrl) return;

    let videoEl = null;

    function showAnime() {
      if (!cardEl.classList.contains("matched")) return;
      if (videoEl) return;
      const front = cardEl.querySelector(".card-front");
      if (!front) return;
      videoEl = document.createElement("video");
      videoEl.src = animeUrl;
      videoEl.className = "card-anime";
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      front.appendChild(videoEl);
      videoEl.play().catch(() => {});
    }

    function hideAnime() {
      if (!videoEl) return;
      videoEl.pause();
      videoEl.remove();
      videoEl = null;
    }

    cardEl.addEventListener("mouseenter", showAnime);
    cardEl.addEventListener("mouseleave", hideAnime);
    // Click on a matched card toggles the animation
    cardEl.addEventListener("click", () => {
      if (!cardEl.classList.contains("matched")) return;
      if (videoEl) hideAnime();
      else showAnime();
    });
  }

  return { getAnimeUrl, attachToCard };
})();

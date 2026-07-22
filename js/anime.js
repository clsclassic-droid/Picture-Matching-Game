// Maps Drive photo base filename (no extension) → animation mp4 path.
// Add one entry per photo that has a recorded animation.
const ANIME_MAP = {
  "1c04f205b7b5a7fedd251a27772ea799": "assets/anime/1.mp4",
};

// Maps Drive photo base filename → CSS animation class (for cards without an mp4).
const CSS_ANIME_MAP = {
  "2f07d37342dab89ef953ff0b4073011b": "card-anim-bob",
};

const CardAnime = (() => {
  // Returns { type: "mp4", url } | { type: "css", cls } | null
  function getAnimeInfo(driveFilename) {
    if (!driveFilename) return null;
    const base = driveFilename.replace(/\.[^.]+$/, "");
    if (ANIME_MAP[base]) return { type: "mp4", url: ANIME_MAP[base] };
    if (CSS_ANIME_MAP[base]) return { type: "css", cls: CSS_ANIME_MAP[base] };
    return null;
  }

  function attachToCard(cardEl, animeInfo) {
    if (!animeInfo) return;

    if (animeInfo.type === "mp4") {
      let videoEl = null;

      function showAnime() {
        if (!cardEl.classList.contains("matched")) return;
        if (videoEl) return;
        const front = cardEl.querySelector(".card-front");
        if (!front) return;
        videoEl = document.createElement("video");
        videoEl.src = animeInfo.url;
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
      cardEl.addEventListener("click", () => {
        if (!cardEl.classList.contains("matched")) return;
        if (videoEl) hideAnime(); else showAnime();
      });

    } else if (animeInfo.type === "css") {
      const cls = animeInfo.cls;

      function showAnime() {
        if (!cardEl.classList.contains("matched")) return;
        const img = cardEl.querySelector("img");
        if (img) img.classList.add(cls);
      }

      function hideAnime() {
        const img = cardEl.querySelector("img");
        if (img) img.classList.remove(cls);
      }

      cardEl.addEventListener("mouseenter", showAnime);
      cardEl.addEventListener("mouseleave", hideAnime);
      cardEl.addEventListener("click", () => {
        if (!cardEl.classList.contains("matched")) return;
        const img = cardEl.querySelector("img");
        if (!img) return;
        if (img.classList.contains(cls)) hideAnime(); else showAnime();
      });
    }
  }

  return { getAnimeInfo, attachToCard };
})();

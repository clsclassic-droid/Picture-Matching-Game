// Maps Drive photo base filename (no extension) → animation mp4 path.
const ANIME_MAP = {
  "1c04f205b7b5a7fedd251a27772ea799": "assets/anime/1.mp4",
};

// Maps Drive photo base filename → specific CSS animation class.
// Falls back to "card-anim-bob" for any Drive photo not listed here.
const CSS_ANIME_MAP = {};

const CardAnime = (() => {
  // Returns { type: "mp4", url } | { type: "css", cls } for any Drive photo.
  // All Drive photos get at least the default bob animation.
  function getAnimeInfo(driveFilename) {
    if (!driveFilename) return null;
    const base = driveFilename.replace(/\.[^.]+$/, "");
    if (ANIME_MAP[base]) return { type: "mp4", url: ANIME_MAP[base] };
    return { type: "css", cls: CSS_ANIME_MAP[base] || "card-anim-bob" };
  }

  function attachToCard(cardEl, animeInfo) {
    if (!animeInfo) return;

    if (animeInfo.type === "mp4") {
      let videoEl = null;
      let pinned = false;

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
      cardEl.addEventListener("mouseleave", () => { if (!pinned) hideAnime(); });
      cardEl.addEventListener("click", () => {
        if (!cardEl.classList.contains("matched")) return;
        pinned = !pinned;
        if (pinned) showAnime(); else hideAnime();
      });

    } else if (animeInfo.type === "css") {
      const cls = animeInfo.cls;
      let pinned = false;

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
      cardEl.addEventListener("mouseleave", () => { if (!pinned) hideAnime(); });
      cardEl.addEventListener("click", () => {
        if (!cardEl.classList.contains("matched")) return;
        pinned = !pinned;
        if (pinned) showAnime(); else hideAnime();
      });
    }
  }

  return { getAnimeInfo, attachToCard };
})();

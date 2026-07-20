// Emoji card art, pre-rendered to raster images via <canvas>.
//
// Emoji drawn as *live text* inside a card corrupt on some Chrome/Windows
// builds, because the card faces use backface-visibility:hidden under a
// 3D flip transform, and color-emoji glyph compositing breaks in that
// specific situation (see icons.js). Canvas text rendering isn't subject
// to that bug, so each emoji is stamped onto a small canvas once and used
// as a plain <img> from then on — the same rendering path already used
// for Google Drive photos, which never had this problem.

const Emoji = (() => {
  const POOL = [
    "🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁",
    "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦉",
    "🦄", "🐴", "🐝", "🦋", "🐢", "🐙", "🐬", "🐳",
    "🍎", "🍌", "🍇", "🍉", "🍓", "🍒", "🍕", "🍔",
    "🍩", "🍪", "🎂", "🍭", "⚽", "🏀", "🎸", "🎨",
    "🚀", "🚗", "⭐", "🌈", "🌙", "☀️", "🔥", "❄️",
  ];

  const cache = new Map();

  function toDataURL(emoji, size = 160) {
    if (cache.has(emoji)) return cache.get(emoji);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.font = `${Math.floor(size * 0.72)}px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
    const url = canvas.toDataURL("image/png");
    cache.set(emoji, url);
    return url;
  }

  return { POOL, toDataURL };
})();

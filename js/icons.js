// Built-in card art: simple colored vector shapes, drawn as inline SVG.
// Deliberately NOT emoji/text glyphs — some browsers (notably Chrome on
// Windows) corrupt color-emoji glyphs when they sit inside an element
// using a 3D flip transform with backface-visibility: hidden, which is
// exactly how the cards are built here. Plain SVG shapes render correctly
// in that same situation, so they're used instead of a font-based icon set.

const Icons = (() => {
  const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  ];

  function regularPolygonPoints(cx, cy, r, sides, rotationDeg = -90) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const angle = ((rotationDeg + (i * 360) / sides) * Math.PI) / 180;
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  function starPoints(cx, cy, outerR, innerR, points = 5, rotationDeg = -90) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = ((rotationDeg + (i * 180) / points) * Math.PI) / 180;
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  const SHAPES = {
    circle: (c) => `<circle cx="50" cy="50" r="36" fill="${c}"/>`,
    square: (c) => `<rect x="16" y="16" width="68" height="68" rx="14" fill="${c}"/>`,
    triangle: (c) => `<polygon points="${regularPolygonPoints(50, 55, 40, 3)}" fill="${c}"/>`,
    diamond: (c) => `<polygon points="${regularPolygonPoints(50, 50, 40, 4)}" fill="${c}"/>`,
    pentagon: (c) => `<polygon points="${regularPolygonPoints(50, 53, 38, 5)}" fill="${c}"/>`,
    hexagon: (c) => `<polygon points="${regularPolygonPoints(50, 50, 38, 6, 0)}" fill="${c}"/>`,
    star: (c) => `<polygon points="${starPoints(50, 53, 40, 17, 5)}" fill="${c}"/>`,
    heart: (c) =>
      `<path d="M50,85 C15,58 8,32 25,18 C38,7 50,18 50,28 C50,18 62,7 75,18 C92,32 85,58 50,85 Z" fill="${c}"/>`,
  };

  const shapeNames = Object.keys(SHAPES);

  function allCombos() {
    const combos = [];
    shapeNames.forEach((shape) => {
      COLORS.forEach((color) => combos.push({ shape, color }));
    });
    return combos;
  }

  function svgMarkup(shape, color) {
    return `<svg viewBox="0 0 100 100" width="100%" height="100%">${SHAPES[shape](color)}</svg>`;
  }

  return { allCombos, svgMarkup };
})();

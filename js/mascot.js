// Celebration mascot shown when a pair is matched. The source image has a
// plain white background (typical for a sticker), so it's cut out to
// transparent once via canvas and cached as a data URL.

const Mascot = (() => {
  const SRC = "assets/mascot-star.jpg";
  let cutoutPromise = null;

  function getCutoutUrl() {
    if (!cutoutPromise) {
      cutoutPromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const px = frame.data;
          for (let i = 0; i < px.length; i += 4) {
            if (px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235) {
              px[i + 3] = 0;
            }
          }
          ctx.putImageData(frame, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(SRC);
        img.src = SRC;
      });
    }
    return cutoutPromise;
  }

  return { getCutoutUrl };
})();

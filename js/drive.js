// Google Drive integration for the "My Photos" card source.
//
// Reads a publicly-shared Drive folder using an API key — no per-visitor
// Google sign-in required, so anyone with the game link can play this mode.
// This only works because the folder is shared as "Anyone with the link"
// -> Viewer; the API key can only ever read what's already public, it
// can't access private files or make any changes.

const Drive = (() => {
  function isConfigured() {
    return Boolean(APP_CONFIG.DRIVE_API_KEY);
  }

  async function listImages(folderId) {
    const q = encodeURIComponent(
      `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=200&key=${APP_CONFIG.DRIVE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Drive API error (${res.status}). Make sure the folder is shared as "Anyone with the link".`
      );
    }
    const data = await res.json();
    return data.files || [];
  }

  // Returns a URL usable directly as <img src> without any fetch() call.
  // Using fetch()+alt=media causes CORS failures on GitHub Pages because
  // Drive redirects to its CDN which doesn't include CORS headers for
  // cross-origin JS requests. <img> tags bypass CORS entirely.
  function getImageUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return { isConfigured, listImages, getImageUrl };
})();

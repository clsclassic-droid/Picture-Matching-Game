// Google Drive integration for the "My Photos" card source.
// Uses Google Identity Services (token client) so this works from a static
// site with no backend. The user signs in with their own Google account and
// grants read-only access; only files inside APP_CONFIG.DRIVE_FOLDER_ID are used.

const Drive = (() => {
  let tokenClient = null;
  let accessToken = null;

  function isConfigured() {
    return Boolean(APP_CONFIG.GOOGLE_CLIENT_ID);
  }

  function ensureTokenClient() {
    if (tokenClient) return tokenClient;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
      scope: APP_CONFIG.DRIVE_SCOPE,
      callback: () => {}, // overridden per-call below
    });
    return tokenClient;
  }

  function signIn() {
    return new Promise((resolve, reject) => {
      const client = ensureTokenClient();
      client.callback = (resp) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        accessToken = resp.access_token;
        resolve(accessToken);
      };
      client.requestAccessToken({ prompt: accessToken ? "" : "consent" });
    });
  }

  async function listImages(folderId) {
    const q = encodeURIComponent(
      `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=200`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Drive API error (${res.status})`);
    const data = await res.json();
    return data.files || [];
  }

  async function fetchImageObjectUrl(fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch image ${fileId}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  return { isConfigured, signIn, listImages, fetchImageObjectUrl };
})();

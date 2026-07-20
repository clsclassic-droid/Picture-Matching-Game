# Picture Matching Game

A memory-matching (pairs) game you can play in the browser. Choose 8, 16, or
32 pairs, then match cards showing emoji — or your own photos pulled live
from a Google Drive folder.

Play it live once GitHub Pages is enabled (see below), or just open
`index.html` locally / serve the folder with any static file server.

## Features

- Pick 8, 16, or 32 pairs
- Emoji card set built in — works immediately, no setup
- Optional "My Photos" mode: reads images straight from your own
  **Picture Matching Game/Picture** folder in Google Drive
- Move counter, timer, responsive layout for mobile

## Deploying to GitHub Pages

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
3. GitHub gives you a URL like `https://<username>.github.io/Picture-Matching-Game/`.

## Google Drive photo mode setup

The "My Photos" mode reads images directly from your Drive folder
`Picture Matching Game/Picture` using your own Google account — no server,
no secrets committed to the repo. To enable it:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a new project (or reuse one).
2. **APIs & Services → Library** → enable the **Google Drive API**.
3. **APIs & Services → OAuth consent screen**: choose **External**, fill in
   the required fields, and under **Test users** add your own Google account
   email. (The app stays in "Testing" mode — that's fine, only you need to
   sign in.)
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: add the GitHub Pages URL from above
     (e.g. `https://<username>.github.io`), and `http://localhost:8080` if
     you want to test locally.
   - Create it, then copy the **Client ID**.
5. Open [js/config.js](js/config.js) and paste it in:
   ```js
   GOOGLE_CLIENT_ID: "YOUR_CLIENT_ID.apps.googleusercontent.com",
   ```
6. Commit and push. Upload photos into the Drive folder
   `Picture Matching Game/Picture`, then pick "My Photos" in the game —
   you'll be asked to sign in and grant read-only Drive access the first time.

You need at least as many photos in that folder as pairs you want to play
(8 / 16 / 32).

## Project structure

```
index.html        game markup
css/style.css      styling, card flip animation, responsive grid
js/config.js       Google Drive Client ID + folder ID
js/drive.js        Google sign-in + Drive file listing/fetching
js/game.js         game logic (deck, flips, matching, timer, scoring)
```

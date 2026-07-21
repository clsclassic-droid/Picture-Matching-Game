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

The "My Photos" mode reads images straight from a **publicly-shared** Drive
folder using an API key — nobody needs to sign in, so anyone with the game
link can play this mode. That only works because the folder itself is
shared as "Anyone with the link → Viewer"; treat anything you put in it as
public.

1. **Share the folder**: open the
   [Picture folder](https://drive.google.com/drive/folders/1wP1_vOXLTFM6vdnjs3yYnmK6e_YAC7iE)
   in Drive → **Share** → under "General access" choose **Anyone with the
   link**, and make sure the role is **Viewer** (not Editor) → **Done**.
2. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a project (or reuse one you own).
3. **APIs & Services → Library** → enable the **Google Drive API**.
4. **APIs & Services → Credentials → Create Credentials → API key**.
   - Once created, click the key to restrict it:
     - **API restrictions**: restrict to **Google Drive API** only.
     - **Application restrictions → Websites**: add your GitHub Pages URL
       (e.g. `https://<username>.github.io/*`) so the key only works from
       your site.
   - Copy the API key.
5. Open [js/config.js](js/config.js) and paste it in:
   ```js
   DRIVE_API_KEY: "YOUR_API_KEY",
   ```
6. Commit and push. Upload photos into the shared Drive folder, then pick
   "My Photos" in the game — no sign-in prompt, it just loads.

You need at least as many photos in that folder as pairs you want to play
(8 / 16 / 32).

## Project structure

```
index.html        game markup
css/style.css      comic-book styling, card flip/match animations, responsive grid
js/config.js       Drive API key + folder ID
js/drive.js        public Drive file listing/fetching via API key
js/game.js         game logic (deck, flips, matching, timer, scoring, 2-player turns)
```

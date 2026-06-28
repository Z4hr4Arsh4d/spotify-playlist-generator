# 🎧 PlaylistAI

> A pixel-themed Spotify playlist generator. Pick a singer, some genres, and a mood — get a real playlist saved straight to your Spotify account, complete with a hand-made pixel cover. ♡

PlaylistAI is a full-stack web app that talks to the **Spotify Web API** over OAuth 2.0. Choose your vibe, hit one button, and it builds a playlist and pushes it to your library. It comes with a pastel pixel-art UI, a light/dark theme, an artist search, 32 genres, 24 moods, and 8 selectable pixel covers.
---
<img width="1892" height="917" alt="image" src="https://github.com/user-attachments/assets/26c66c53-2908-4728-a36f-a07492008b2e" />
---
<img width="1887" height="911" alt="image" src="https://github.com/user-attachments/assets/f6f5c394-adde-4c05-91c3-695fa9832434" />

---

## ✨ Features

- **Spotify login** via OAuth 2.0 (authorization code flow)
- **Pick a singer** — type an artist and the playlist fills with their real songs (top tracks + album catalogue), then rounds out with your genres and moods
- **32 genres and 24 moods** to mix and match
- **Adjustable length** — 5 to 100 songs
- **8 pixel-art covers** to choose from, set as the real Spotify playlist cover
- **Saves to your Spotify account** automatically
- **Favorites, 30-second previews, and a remove button** for fine-tuning
- **Light and dark mode** (cotton-candy by day, midnight-plum by night) — your choice is remembered

---

## 🛠️ Tech Stack

**Frontend:** React, Vite, self-contained CSS (pixel theme, no UI library)
**Backend:** Node.js, Express, Axios, dotenv
**API:** Spotify Web API (OAuth 2.0, search, playlists, artist catalogue, cover upload)

---

## 📁 Project Structure

```
AI-Playlist/
├── spotify-backend/                 # Node + Express API
│   ├── backend.js                   # all routes (auth, generate, save, covers)
│   ├── covers.js                    # 8 pixel covers as base64 JPEGs
│   ├── package.json
│   └── .env                         # your secrets (NOT committed)
│
└── my-playlist-app/                 # React + Vite frontend
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── components/
    │       └── SpotifyPlaylistGenerator.jsx
    ├── vite.config.js
    ├── package.json
    └── .env                         # backend URL (NOT committed)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or newer
- A free [Spotify Developer](https://developer.spotify.com/dashboard) account

### 1. Create your Spotify app

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. In the app's **Settings**, add this exact **Redirect URI**:
   ```
   http://127.0.0.1:3001/callback
   ```
   > Spotify no longer allows `http://localhost` — you must use the loopback IP `127.0.0.1`.
3. Copy your **Client ID** and **Client Secret**.

### 2. Backend setup

```bash
cd spotify-backend
npm install
```

Create a file named `.env` in `spotify-backend/`:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://127.0.0.1:3001/callback
FRONTEND_URL=http://127.0.0.1:5173
PORT=3001
```

Start it:

```bash
node backend.js
```

You should see `✅ Server: http://127.0.0.1:3001` and `covers loaded: 8`.

### 3. Frontend setup

In a second terminal:

```bash
cd my-playlist-app
npm install
```

Create a file named `.env` in `my-playlist-app/`:

```
VITE_BACKEND_URL=http://127.0.0.1:3001
```

Start it:

```bash
npm run dev
```

### 4. Open the app

Go to **http://127.0.0.1:5173** (use `127.0.0.1`, not `localhost`), log in with Spotify, press **Agree**, and start making playlists. 🎀

---

## 🎯 How It Works

1. The frontend sends you to the backend's `/login`, which redirects to Spotify's authorize page.
2. After you approve, Spotify calls back to `/callback`; the backend exchanges the code for an access token and hands it to the frontend.
3. When you generate, the backend:
   - resolves the artist (if given) and pulls their top tracks and album catalogue,
   - fills any remaining slots with genre/mood searches,
   - creates a private playlist on your account and adds the tracks,
   - uploads your chosen pixel cover.

### API routes

| Method | Route                       | Purpose                                  |
|--------|-----------------------------|------------------------------------------|
| GET    | `/login`                    | Start Spotify OAuth                       |
| GET    | `/callback`                 | Exchange code for token                   |
| GET    | `/me`                       | Current user profile                      |
| GET    | `/covers`                   | List the selectable pixel covers          |
| POST   | `/generate-smart-playlist`  | Build + save a playlist                    |
| POST   | `/save-playlist`            | Save an edited track list                  |

---

## 🧗 Engineering Notes

A few real-world hurdles this project worked through, in case they're useful to anyone building on Spotify in 2026:

- **Loopback redirect URIs.** Spotify deprecated `http://localhost` redirect URIs; the explicit loopback address `http://127.0.0.1:PORT` is required instead. This removed the need for any tunneling tool.
- **February 2026 Web API migration.** The older `POST /users/{user_id}/playlists` and `POST /playlists/{id}/tracks` endpoints now return `403 Forbidden` for Development-Mode apps. PlaylistAI uses the current replacements: `POST /me/playlists` and `POST /playlists/{id}/items`.
- **Reliable artist results.** Rather than loose text matching, the backend resolves the artist's ID and pulls their actual top tracks and album catalogue, so a typed singer returns songs genuinely by that artist.

---

## ⚠️ Known Limitations

- The Spotify app runs in **Development Mode**, so only accounts added to the app's allowlist (in the dashboard's *User Management*) can log in. Letting the public log in requires Spotify's Extended Quota approval.
- **Custom cover upload** (`PUT /playlists/{id}/images`) is restricted for some Development-Mode apps. If Spotify rejects it, the playlist is still created and saved — the app just shows a gentle note and keeps the cover inside the UI.

---

## 📦 What's Not in This Repo

`.env` files and `node_modules/` are intentionally excluded (see `.gitignore`). Copy the `.env` examples above and run `npm install` in each folder to set up locally.

---

## 📝 License

Free to use and learn from.

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
let COVERS = [];
try { COVERS = require('./covers'); }
catch (e) { console.warn('⚠️  covers.js NOT found next to backend.js — cover picker will be hidden. Move covers.js into the spotify-backend folder.'); }

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = (process.env.REDIRECT_URI || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://127.0.0.1:5173').trim();

const SPOTIFY_AUTH = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

console.log('🎵 Backend starting...');
console.log('   REDIRECT_URI =', JSON.stringify(REDIRECT_URI));
console.log('   FRONTEND_URL =', JSON.stringify(FRONTEND_URL));
console.log('   covers loaded:', COVERS.length);

app.get('/', (req, res) => res.json({ status: 'OK' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// list cute covers for the picker (id, label, data-uri thumbnail)
app.get('/covers', (req, res) => {
  res.json(COVERS.map((c) => ({ id: c.id, label: c.label, image: `data:image/jpeg;base64,${c.b64}` })));
});

// ---------- LOGIN ----------
app.get('/login', (req, res) => {
  const scopes = [
    'user-read-email',
    'user-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'ugc-image-upload', // needed to set a custom playlist cover
  ].join(' ');

  const authUrl =
    `${SPOTIFY_AUTH}/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&show_dialog=true`;
  res.redirect(authUrl);
});

// ---------- CALLBACK ----------
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (req.query.error) return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(req.query.error)}`);
  if (!code) return res.redirect(`${FRONTEND_URL}?error=no_code`);
  try {
    const tokenRes = await axios.post(
      `${SPOTIFY_AUTH}/api/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('✅ Token received. Granted scopes:', tokenRes.data.scope);
    res.redirect(`${FRONTEND_URL}?access_token=${tokenRes.data.access_token}`);
  } catch (err) {
    console.error('❌ Token exchange failed:', err.response?.data || err.message);
    res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
  }
});

// ---------- USER INFO ----------
app.get('/me', async (req, res) => {
  try {
    const r = await axios.get(`${SPOTIFY_API}/me`, { headers: { Authorization: `Bearer ${req.query.access_token}` } });
    res.json(r.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'Failed to get user' });
  }
});

// find the artist's canonical name + id from a typed name
async function resolveArtist(name, token) {
  try {
    const r = await axios.get(`${SPOTIFY_API}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: name, type: 'artist' },
    });
    const a = r.data.artists?.items?.[0];
    return a ? { id: a.id, name: a.name } : null;
  } catch {
    return null;
  }
}

// the artist's actual top tracks (guaranteed real songs by them)
async function artistTopTracks(id, market, token) {
  try {
    const r = await axios.get(`${SPOTIFY_API}/artists/${id}/top-tracks`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { market: market || 'US' },
    });
    return r.data.tracks || [];
  } catch (e) {
    console.warn('   top-tracks failed:', e.response?.status || e.message);
    return [];
  }
}

// pull lots of real songs by the artist: top tracks + their album/single catalog
async function artistCatalog(id, market, token, target) {
  const out = [];
  const seen = new Set();
  const push = (t) => { if (t && t.uri && !seen.has(t.uri)) { seen.add(t.uri); out.push(t); } };

  (await artistTopTracks(id, market, token)).forEach(push);

  try {
    const albRes = await axios.get(`${SPOTIFY_API}/artists/${id}/albums`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { include_groups: 'album,single', limit: 50, market },
    });
    const albumIds = [...new Set((albRes.data.items || []).map((a) => a.id))].slice(0, 20);

    for (let i = 0; i < albumIds.length && out.length < target + 25; i += 20) {
      const ids = albumIds.slice(i, i + 20).join(',');
      const r = await axios.get(`${SPOTIFY_API}/albums`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ids, market },
      });
      for (const alb of r.data.albums || []) {
        for (const t of alb.tracks?.items || []) {
          if ((t.artists || []).some((a) => a.id === id)) {
            t.album = { images: alb.images, name: alb.name }; // attach cover art for the UI
            push(t);
          }
        }
      }
    }
  } catch (e) {
    console.warn('   album catalog failed:', e.response?.status || e.message);
  }
  return out;
}

function buildQueries(genres, moods, artist) {
  const g = genres && genres.length ? genres : ['pop'];
  const m = moods && moods.length ? moods : ['energetic'];
  const a = (artist || '').trim();
  const boosters = ['', 'hits', 'top', 'best', 'mix', 'songs', 'popular', 'new', 'dance', 'classic'];
  const q = [];

  // Lead with the artist (quoted so multi-word names match the artist field).
  if (a) {
    q.push(`artist:"${a}"`);
    for (const mood of m) q.push(`artist:"${a}" ${mood}`);
    for (const genre of g) q.push(`artist:"${a}" ${genre}`);
    for (const b of ['love', 'night', 'baby', 'time', 'heart', 'dream', 'good', 'feel', 'best', 'hits'])
      q.push(`artist:"${a}" ${b}`);
    q.push(a);
  }

  for (const genre of g) {
    for (const mood of m) q.push(`${genre} ${mood}`);
    q.push(genre);
    for (const b of boosters) q.push(`${genre} ${b}`.trim());
  }
  for (const mood of m) q.push(mood);
  return [...new Set(q.map((s) => s.trim()).filter(Boolean))];
}

// collect unique tracks. when an artist is given, fill with their songs first.
async function collectTracks({ genres, moods, artist, target, token, market }) {
  const found = [];
  const seen = new Set();
  const add = (t) => {
    if (t && t.uri && !seen.has(t.uri) && found.length < target) {
      seen.add(t.uri);
      found.push(t);
    }
  };

  let canonical = (artist || '').trim();
  if (canonical) {
    const resolved = await resolveArtist(canonical, token);
    if (resolved) {
      canonical = resolved.name;
      console.log(`   🎤 artist matched: "${canonical}" (${resolved.id})`);
      (await artistCatalog(resolved.id, market, token, target)).forEach(add);
      console.log(`   🎤 got ${found.length} songs by ${canonical}`);
    } else {
      console.log(`   🎤 could not match artist "${canonical}", using text search`);
    }
  }

  // fill any remaining slots with genre/mood (and artist text as a backup)
  if (found.length < target) {
    for (const q of buildQueries(genres, moods, canonical)) {
      if (found.length >= target) break;
      try {
        const r = await axios.get(`${SPOTIFY_API}/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q, type: 'track' },
        });
        (r.data.tracks?.items || []).forEach(add);
      } catch (e) {
        console.warn(`   (search "${q}" failed: ${e.response?.status || e.message})`);
      }
    }
  }
  return found.slice(0, target);
}

// best-effort: set a custom cover on the playlist
async function uploadCover(playlistId, coverId, token) {
  const cover = COVERS.find((c) => c.id === coverId);
  if (!cover) return false;
  try {
    await axios.put(`${SPOTIFY_API}/playlists/${playlistId}/images`, cover.b64, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' },
    });
    console.log(`   🖼️  cover set: ${coverId}`);
    return true;
  } catch (e) {
    console.warn('   cover upload failed:', e.response?.status, e.response?.data?.error?.message || e.message);
    return false;
  }
}

// ---------- GENERATE PLAYLIST ----------
app.post('/generate-smart-playlist', async (req, res) => {
  try {
    const { numberOfSongs, genres, moods, artist, coverId, access_token } = req.body;
    if (!access_token) return res.status(401).json({ error: 'Not logged in. Please log in again.' });

    const target = Math.min(Math.max(parseInt(numberOfSongs) || 20, 1), 100);
    const genre = (genres && genres[0]) || 'pop';
    const mood = (moods && moods[0]) || 'happy';
    const artistName = (artist || '').trim();

    // validate token + get market for accurate artist results
    let market = 'US';
    try {
      const me = await axios.get(`${SPOTIFY_API}/me`, { headers: { Authorization: `Bearer ${access_token}` } });
      market = me.data.country || 'US';
    } catch (e) {
      if (e.response?.status === 401) return res.status(401).json({ error: 'Session expired. Log out and log in again.' });
    }

    console.log(`\n🔍 Generating ${target} songs | artist="${artistName}" genres=[${genres}] moods=[${moods}] cover=${coverId || '-'}`);
    const tracks = await collectTracks({ genres, moods, artist: artistName, target, token: access_token, market });
    console.log(`   → collected ${tracks.length} unique tracks`);

    if (tracks.length === 0) return res.status(404).json({ error: 'No tracks found. Try a different combo.' });

    let playlist;
    try {
      const pl = await axios.post(
        `${SPOTIFY_API}/me/playlists`,
        {
          name: `${artistName ? artistName + ' ' : ''}${mood} ${genre} • PlaylistAI`,
          description: `${tracks.length} songs generated by PlaylistAI`,
          public: false,
        },
        { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
      );
      playlist = pl.data;
      console.log(`   ✅ playlist created: ${playlist.id}`);
    } catch (e) {
      const status = e.response?.status;
      console.error('   ❌ create playlist failed:', status, e.response?.data);
      if (status === 403) return res.status(403).json({ error: 'Spotify refused playlist creation. Log out, log in again, press AGREE.' });
      if (status === 401) return res.status(401).json({ error: 'Session expired. Log out and log in again.' });
      throw e;
    }

    const uris = tracks.map((t) => t.uri);
    for (let i = 0; i < uris.length; i += 100) {
      await axios.post(
        `${SPOTIFY_API}/playlists/${playlist.id}/items`,
        { uris: uris.slice(i, i + 100) },
        { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`   ✅ added ${uris.length} tracks`);

    const coverSet = coverId ? await uploadCover(playlist.id, coverId, access_token) : false;

    res.json({
      success: true,
      playlistId: playlist.id,
      playlistName: playlist.name,
      playlistUrl: playlist.external_urls?.spotify,
      coverSet,
      tracks,
    });
  } catch (err) {
    console.error('❌ generate failed:', err.response?.status, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.error?.message || err.message || 'Failed to generate playlist',
    });
  }
});

// ---------- SAVE PLAYLIST ----------
app.post('/save-playlist', async (req, res) => {
  try {
    const { access_token, name, trackUris, coverId } = req.body;
    if (!access_token || !trackUris?.length) return res.status(400).json({ error: 'Missing token or tracks' });

    const pl = await axios.post(
      `${SPOTIFY_API}/me/playlists`,
      { name: name || 'PlaylistAI Mix', public: false },
      { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
    );
    for (let i = 0; i < trackUris.length; i += 100) {
      await axios.post(
        `${SPOTIFY_API}/playlists/${pl.data.id}/items`,
        { uris: trackUris.slice(i, i + 100) },
        { headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
      );
    }
    const coverSet = coverId ? await uploadCover(pl.data.id, coverId, access_token) : false;
    res.json({ success: true, coverSet, playlistUrl: pl.data.external_urls?.spotify });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server: http://127.0.0.1:${PORT}\n`));
import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001';

const GENRES = [
  { id: 'pop', label: 'pop', emoji: '🎀' }, { id: 'bollywood', label: 'bollywood', emoji: '🎬' },
  { id: 'punjabi', label: 'punjabi', emoji: '🥁' }, { id: 'hindi', label: 'hindi', emoji: '🌸' },
  { id: 'tamil', label: 'tamil', emoji: '🎭' }, { id: 'telugu', label: 'telugu', emoji: '🪷' },
  { id: 'k-pop', label: 'k-pop', emoji: '💗' }, { id: 'j-pop', label: 'j-pop', emoji: '🌺' },
  { id: 'anime', label: 'anime', emoji: '⭐' }, { id: 'r&b', label: 'r&b', emoji: '🫧' },
  { id: 'soul', label: 'soul', emoji: '💞' }, { id: 'lo-fi', label: 'lo-fi', emoji: '🌙' },
  { id: 'hip-hop', label: 'hip-hop', emoji: '🎙️' }, { id: 'rap', label: 'rap', emoji: '🔥' },
  { id: 'rock', label: 'rock', emoji: '🎸' }, { id: 'indie', label: 'indie', emoji: '🍓' },
  { id: 'electronic', label: 'electronic', emoji: '⚡' }, { id: 'edm', label: 'edm', emoji: '🪩' },
  { id: 'house', label: 'house', emoji: '🏠' }, { id: 'disco', label: 'disco', emoji: '✨' },
  { id: 'funk', label: 'funk', emoji: '🕺' }, { id: 'jazz', label: 'jazz', emoji: '🎷' },
  { id: 'classical', label: 'classical', emoji: '🎻' }, { id: 'country', label: 'country', emoji: '🤠' },
  { id: 'latin', label: 'latin', emoji: '🌶️' }, { id: 'reggaeton', label: 'reggaeton', emoji: '🌴' },
  { id: 'afrobeats', label: 'afrobeats', emoji: '🥥' }, { id: 'amapiano', label: 'amapiano', emoji: '🪘' },
  { id: 'arabic', label: 'arabic', emoji: '🪄' }, { id: 'turkish', label: 'turkish', emoji: '🧿' },
  { id: 'phonk', label: 'phonk', emoji: '😼' }, { id: 'metal', label: 'metal', emoji: '🤘' },
];

const MOODS = [
  { id: 'happy', label: 'happy', emoji: '😄' }, { id: 'energetic', label: 'energetic', emoji: '⚡' },
  { id: 'chill', label: 'chill', emoji: '😎' }, { id: 'party', label: 'party', emoji: '🎉' },
  { id: 'dreamy', label: 'dreamy', emoji: '☁️' }, { id: 'cozy', label: 'cozy', emoji: '🧸' },
  { id: 'romantic', label: 'romantic', emoji: '💕' }, { id: 'sad', label: 'sad', emoji: '💧' },
  { id: 'heartbreak', label: 'heartbreak', emoji: '💔' }, { id: 'nostalgic', label: 'nostalgic', emoji: '📼' },
  { id: 'fun', label: 'fun', emoji: '🍭' }, { id: 'funky', label: 'funky', emoji: '🪩' },
  { id: 'confident', label: 'confident', emoji: '💅' }, { id: 'hype', label: 'hype', emoji: '🚀' },
  { id: 'workout', label: 'workout', emoji: '💪' }, { id: 'focus', label: 'focus', emoji: '🎯' },
  { id: 'study', label: 'study', emoji: '📚' }, { id: 'sleepy', label: 'sleepy', emoji: '🌙' },
  { id: 'rainy', label: 'rainy', emoji: '🌧️' }, { id: 'sunny', label: 'sunny', emoji: '🌞' },
  { id: 'summer', label: 'summer', emoji: '🍉' }, { id: 'midnight', label: 'midnight', emoji: '🌌' },
  { id: 'ethereal', label: 'ethereal', emoji: '🪽' }, { id: 'soft', label: 'soft', emoji: '🌷' },
];

export default function SpotifyPlaylistGenerator() {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [numberOfSongs, setNumberOfSongs] = useState(20);
  const [artist, setArtist] = useState('');
  const [selectedGenres, setSelectedGenres] = useState(['pop']);
  const [selectedMoods, setSelectedMoods] = useState(['happy']);
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlistName, setPlaylistName] = useState('my cute mix');
  const [activeTab, setActiveTab] = useState('generator');
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState(false);
  const [covers, setCovers] = useState([]);
  const [selectedCover, setSelectedCover] = useState('heart');
  const [coverNote, setCoverNote] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('pixp_theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('pixp_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`${BACKEND_URL}/covers`).then((r) => r.json()).then(setCovers).catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    if (token) {
      setAccessToken(token);
      localStorage.setItem('spotify_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchUserInfo(token);
    } else {
      const savedToken = localStorage.getItem('spotify_token');
      if (savedToken) { setAccessToken(savedToken); fetchUserInfo(savedToken); }
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const r = await fetch(`${BACKEND_URL}/me?access_token=${token}`);
      if (!r.ok) throw new Error('bad token');
      setUser(await r.json());
    } catch (err) { console.error(err); handleLogout(); }
  };

  const handleLogin = () => { window.location.href = `${BACKEND_URL}/login`; };
  const handleLogout = () => {
    setAccessToken(null); setUser(null);
    localStorage.removeItem('spotify_token');
    setPlaylist([]); setFavorites([]);
  };

  const toggleIn = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const generatePlaylist = async () => {
    if (!accessToken) { handleLogin(); return; }
    setLoading(true); setError(null); setSaved(false);
    try {
      const response = await fetch(`${BACKEND_URL}/generate-smart-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfSongs,
          artist: artist.trim(),
          genres: selectedGenres,
          moods: selectedMoods,
          coverId: selectedCover,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not make the playlist');
      const tracks = (data.tracks || []).map((item, idx) => ({
        id: item.id || `song-${idx}-${Math.random()}`,
        title: item.name || 'Unknown Title',
        artist: item.artists?.[0]?.name || 'Unknown Artist',
        image: item.album?.images?.[0]?.url || null,
        preview_url: item.preview_url || null,
        uri: item.uri || '',
      }));
      setPlaylist(tracks);
      setPlaylistName(data.playlistName || 'my cute mix');
      setCoverNote(!!selectedCover && data.coverSet === false);
      setActiveTab('playlist');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not make the playlist');
    } finally { setLoading(false); }
  };

  const toggleFavorite = (id) =>
    setFavorites(favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]);
  const deleteSong = (id) => setPlaylist(playlist.filter((s) => s.id !== id));

  const savePlaylist = async () => {
    if (playlist.length === 0 || !accessToken) return;
    try {
      const r = await fetch(`${BACKEND_URL}/save-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, name: playlistName, trackUris: playlist.map((s) => s.uri), coverId: selectedCover }),
      });
      if (!r.ok) throw new Error('save failed');
      setSaved(true);
    } catch (err) { console.error(err); setError('Could not save to Spotify — try again ♡'); }
  };

  const playPreview = (url) => { if (url) new Audio(url).play().catch((e) => console.error(e)); };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Quicksand:wght@500;600;700&display=swap');
    .pixp * { box-sizing:border-box; }
    .pixp {
      --pink:#ff8fc7; --pink-deep:#ff5fa8; --lav:#b79cff; --mint:#7fe9c3; --butter:#ffe39a;
      --line:#2b1a3d;            /* fixed dark ink for light pastel surfaces (buttons/chips/tabs) */
      --ol:#2b1a3d;              /* outlines + headings (flips light in dark mode) */
      --cream:#fffdf9; --chip:#ffffff; --field:#ffffff;
      --ink:#6b4a82; --ink-soft:#8a6aa3;
      min-height:100vh; width:100%; color:var(--ink);
      font-family:'Quicksand',system-ui,sans-serif; padding:18px;
      background:
        radial-gradient(circle at 12% 18%, #fff2fb 0, transparent 42%),
        radial-gradient(circle at 88% 12%, #eee6ff 0, transparent 40%),
        radial-gradient(circle at 75% 88%, #def9ef 0, transparent 45%),
        linear-gradient(160deg,#f4e7ff 0%,#ffe6f5 48%,#e3fff5 100%);
    }
    .pixp.dark {
      --ol:#ffb3e0; --cream:#271d3d; --chip:#352a52; --field:#1f1836;
      --ink:#f1e6ff; --ink-soft:#c4b0df;
      background:
        radial-gradient(circle at 12% 16%, #3a1f52 0, transparent 44%),
        radial-gradient(circle at 86% 12%, #20284f 0, transparent 42%),
        radial-gradient(circle at 78% 90%, #133a3a 0, transparent 46%),
        linear-gradient(160deg,#1a1230 0%,#241638 50%,#10222a 100%);
    }
    .pixp-pixel { font-family:'Press Start 2P',monospace; line-height:1.55; }
    .pixp-box { background:var(--cream); border:3px solid var(--ol); box-shadow:6px 6px 0 var(--ol); border-radius:14px; }
    .pixp-header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:16px 18px; margin-bottom:18px;
      background:linear-gradient(100deg,#ffd6ee,#e7dcff 55%,#cdf7e7); }
    .pixp.dark .pixp-header { background:linear-gradient(100deg,#3a2350,#2a2348 55%,#173a39); }
    .pixp-logo { display:flex; align-items:center; gap:12px; }
    .pixp-logo .gem { width:42px;height:42px;display:grid;place-items:center;font-size:20px;background:var(--pink);
      border:3px solid var(--ol); box-shadow:3px 3px 0 var(--ol); border-radius:10px; animation:bob 2.4s ease-in-out infinite; }
    .pixp-title { font-size:15px; color:var(--ol); margin:0; }
    .pixp-sub { font-size:9px; color:var(--ink-soft); margin-top:7px; font-family:'Press Start 2P'; }
    .pixp-head-tools { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .pixp-btn { font-family:'Press Start 2P',monospace; cursor:pointer; color:var(--line);
      border:3px solid var(--ol); border-radius:10px; box-shadow:4px 4px 0 var(--ol); transition:transform .06s, box-shadow .06s; user-select:none; }
    .pixp-btn:hover { transform:translate(-1px,-1px); box-shadow:5px 5px 0 var(--ol); }
    .pixp-btn:active { transform:translate(4px,4px); box-shadow:0 0 0 var(--ol); }
    .pixp-btn:disabled { opacity:.55; cursor:not-allowed; box-shadow:4px 4px 0 var(--ol); transform:none; }
    .pixp-logout { background:#ffd0e2; font-size:9px; padding:9px 12px; }
    .pixp-theme { background:var(--butter); font-size:11px; padding:9px 11px; }
    .pixp-grid { display:grid; grid-template-columns:340px 1fr; gap:18px; align-items:start; }
    @media (max-width:860px){ .pixp-grid{ grid-template-columns:1fr; } }
    .pixp-panel { padding:18px; }
    .pixp-label { font-family:'Press Start 2P',monospace; font-size:10px; color:var(--ol); display:block; margin:2px 0 12px; }
    .pixp-songcount { font-family:'Press Start 2P',monospace; font-size:18px; color:var(--pink-deep); }
    .pixp-range { width:100%; accent-color:var(--pink-deep); height:6px; cursor:pointer; }
    .pixp-input { width:100%; font-family:'Quicksand'; font-weight:700; font-size:14px; color:var(--ink);
      background:var(--field); border:3px solid var(--ol); border-radius:10px; box-shadow:3px 3px 0 var(--ol);
      padding:11px 13px; outline:none; }
    .pixp-input::placeholder { color:var(--ink-soft); font-weight:600; }
    .pixp-hint { font-size:11px; font-weight:600; color:var(--ink-soft); margin:7px 2px 0; }
    .pixp-chips { display:flex; flex-wrap:wrap; gap:8px; max-height:188px; overflow-y:auto; padding:4px 2px 8px; }
    .pixp-chip { font-family:'Quicksand'; font-weight:700; font-size:13px; cursor:pointer; padding:8px 11px;
      border:2px solid var(--ol); border-radius:999px; background:var(--chip); color:var(--ink); box-shadow:2px 2px 0 var(--ol);
      transition:transform .05s, box-shadow .05s; white-space:nowrap; }
    .pixp-chip:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 var(--ol); }
    .pixp-chip.on { background:var(--pink); color:#2b1a3d; }
    .pixp-chip.on.mood { background:var(--lav); }
    .pixp-make { width:100%; padding:16px; font-size:11px; margin-top:6px; background:linear-gradient(180deg,#ff9ed0,#ff6fb4); color:#fff; text-shadow:1px 1px 0 var(--line); }
    .pixp-err { margin-top:14px; padding:12px; font-family:'Quicksand'; font-weight:700; font-size:13px; background:#fff0f4; color:#b03a6e; border:2px solid #b03a6e; border-radius:10px; box-shadow:3px 3px 0 #b03a6e; }
    .pixp.dark .pixp-err { background:#3a1b2b; color:#ffb3d4; border-color:#ffb3d4; box-shadow:3px 3px 0 #ffb3d4; }
    .pixp-empty { min-height:360px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:30px; gap:14px; }
    .pixp-empty .big { font-size:54px; animation:bob 2.4s ease-in-out infinite; }
    .pixp-empty h3 { font-family:'Press Start 2P'; font-size:13px; color:var(--ol); margin:0; }
    .pixp-empty p { font-weight:600; color:var(--ink-soft); margin:0; }
    .pixp-list { display:flex; flex-direction:column; gap:10px; max-height:560px; overflow-y:auto; padding:4px; margin:14px 0; }
    .pixp-song { display:flex; align-items:center; gap:12px; padding:10px; background:var(--cream); border:2px solid var(--ol); border-radius:12px; box-shadow:3px 3px 0 var(--ol); }
    .pixp.dark .pixp-song { background:#2f2450; }
    .pixp-song .num { font-family:'Press Start 2P'; font-size:9px; color:var(--pink-deep); width:26px; text-align:center; flex:none; }
    .pixp-art { width:48px; height:48px; flex:none; border:2px solid var(--ol); border-radius:8px; object-fit:cover; image-rendering:pixelated; }
    .pixp-art.ph { display:grid; place-items:center; background:var(--butter); font-size:20px; }
    .pixp-meta { flex:1; min-width:0; }
    .pixp-meta .t { font-weight:700; font-size:14px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pixp-meta .a { font-weight:600; font-size:12px; color:var(--ink-soft); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pixp-ico { cursor:pointer; font-size:18px; background:none; border:none; padding:4px; line-height:1; transition:transform .08s; }
    .pixp-ico:hover { transform:scale(1.25) rotate(-6deg); }
    .pixp-tabs { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
    .pixp-tab { font-size:9px; padding:10px 13px; background:#fff; }
    .pixp-tab.on { background:var(--mint); }
    .pixp-save { width:100%; padding:14px; font-size:10px; background:linear-gradient(180deg,#9ef0cf,#6fe0b4); color:var(--line); }
    .pixp-save.done { background:linear-gradient(180deg,#d6c4ff,#b79cff); color:#fff; text-shadow:1px 1px 0 var(--line); }
    .pixp-login-wrap { min-height:88vh; display:grid; place-items:center; position:relative; }
    .pixp-login { text-align:center; padding:40px 30px; max-width:430px; }
    .pixp-login .gem { width:78px;height:78px;font-size:38px;margin:0 auto 22px;display:grid;place-items:center;background:var(--pink);border:3px solid var(--ol);box-shadow:5px 5px 0 var(--ol);border-radius:16px;animation:bob 2.4s ease-in-out infinite; }
    .pixp-login h1 { font-family:'Press Start 2P'; font-size:20px; color:var(--ol); margin:0 0 16px; }
    .pixp-login p { font-weight:600; color:var(--ink-soft); margin:0 0 26px; }
    .pixp-login button { padding:16px 22px; font-size:11px; background:linear-gradient(180deg,#ff9ed0,#ff6fb4); color:#fff; text-shadow:1px 1px 0 var(--line); }
    .pixp-corner { position:absolute; top:14px; right:14px; }
    .pixp-spark { display:inline-block; animation:tw 1.4s steps(2) infinite; }
    .pixp-covers { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .pixp-cover { padding:0; background:none; border:3px solid var(--ol); border-radius:10px; box-shadow:2px 2px 0 var(--ol); cursor:pointer; overflow:hidden; aspect-ratio:1/1; transition:transform .06s, box-shadow .06s; }
    .pixp-cover:hover { transform:translate(-1px,-1px); box-shadow:3px 3px 0 var(--ol); }
    .pixp-cover img { width:100%; height:100%; display:block; image-rendering:pixelated; }
    .pixp-cover.on { outline:3px solid var(--pink-deep); outline-offset:1px; box-shadow:4px 4px 0 var(--ol); }
    .pixp-plcover { width:54px; height:54px; flex:none; border:3px solid var(--ol); border-radius:10px; box-shadow:3px 3px 0 var(--ol); image-rendering:pixelated; }
    @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes tw { 0%,100%{opacity:1} 50%{opacity:.25} }
    .pixp-chips::-webkit-scrollbar,.pixp-list::-webkit-scrollbar{width:10px}
    .pixp-chips::-webkit-scrollbar-thumb,.pixp-list::-webkit-scrollbar-thumb{background:var(--pink);border:2px solid var(--ol);border-radius:6px}
    @media (prefers-reduced-motion: reduce){ .pixp *{animation:none!important} }
  `;

  const ThemeBtn = () => (
    <button className="pixp-btn pixp-theme" title="toggle theme" onClick={() => setDark((d) => !d)}>
      {dark ? '☀️' : '🌙'}
    </button>
  );

  if (!accessToken) {
    return (
      <div className={`pixp ${dark ? 'dark' : ''}`}>
        <style>{styles}</style>
        <div className="pixp-login-wrap">
          <div className="pixp-corner"><ThemeBtn /></div>
          <div className="pixp-box pixp-login">
            <div className="gem">🎧</div>
            <h1>PlaylistAI</h1>
            <p>your little pastel music machine ♡<br />pick your vibes, get a playlist, save it to Spotify</p>
            <button className="pixp-btn" onClick={handleLogin}>♡ login with spotify ♡</button>
          </div>
        </div>
      </div>
    );
  }

  const favSongs = playlist.filter((s) => favorites.includes(s.id));
  const coverImage = covers.find((c) => c.id === selectedCover)?.image || null;

  const SongRow = ({ song, idx, showTools }) => (
    <div className="pixp-song">
      {idx != null && <span className="num">{idx + 1}</span>}
      {song.image ? <img className="pixp-art" src={song.image} alt="" /> : <div className="pixp-art ph">🎵</div>}
      <div className="pixp-meta">
        <div className="t">{song.title}</div>
        <div className="a">{song.artist}</div>
      </div>
      {song.preview_url && <button className="pixp-ico" title="preview" onClick={() => playPreview(song.preview_url)}>▶️</button>}
      {showTools && (
        <>
          <button className="pixp-ico" title="favorite" onClick={() => toggleFavorite(song.id)}>{favorites.includes(song.id) ? '💖' : '🤍'}</button>
          <button className="pixp-ico" title="remove" onClick={() => deleteSong(song.id)}>🗑️</button>
        </>
      )}
    </div>
  );

  return (
    <div className={`pixp ${dark ? 'dark' : ''}`}>
      <style>{styles}</style>

      <header className="pixp-box pixp-header">
        <div className="pixp-logo">
          <div className="gem">🎧</div>
          <div>
            <h1 className="pixp-title pixp-pixel">PlaylistAI <span className="pixp-spark">✨</span></h1>
            {user && <div className="pixp-sub">hi {user.display_name || 'cutie'} ♡</div>}
          </div>
        </div>
        <div className="pixp-head-tools">
          <ThemeBtn />
          <button className="pixp-btn pixp-logout" onClick={handleLogout}>logout</button>
        </div>
      </header>

      <div className="pixp-tabs">
        <button className={`pixp-btn pixp-tab ${activeTab === 'generator' ? 'on' : ''}`} onClick={() => setActiveTab('generator')}>✨ make</button>
        <button className={`pixp-btn pixp-tab ${activeTab === 'playlist' ? 'on' : ''}`} onClick={() => setActiveTab('playlist')}>🎀 mix ({playlist.length})</button>
        <button className={`pixp-btn pixp-tab ${activeTab === 'favorites' ? 'on' : ''}`} onClick={() => setActiveTab('favorites')}>💖 faves ({favorites.length})</button>
      </div>

      {activeTab === 'generator' && (
        <div className="pixp-grid">
          <div className="pixp-box pixp-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="pixp-label" style={{ margin: 0 }}>how many?</span>
              <span className="pixp-songcount">{numberOfSongs}</span>
            </div>
            <input className="pixp-range" type="range" min="5" max="100" step="5" value={numberOfSongs}
              onChange={(e) => setNumberOfSongs(parseInt(e.target.value))} />

            <span className="pixp-label" style={{ marginTop: 22 }}>🎤 singer</span>
            <input className="pixp-input" type="text" value={artist} placeholder="optional — e.g. Taylor Swift"
              onChange={(e) => setArtist(e.target.value)} />
            <div className="pixp-hint">leave empty for a genre + mood mix ♡</div>

            <span className="pixp-label" style={{ marginTop: 22 }}>🎀 genres</span>
            <div className="pixp-chips">
              {GENRES.map((g) => (
                <button key={g.id} className={`pixp-chip ${selectedGenres.includes(g.id) ? 'on' : ''}`}
                  onClick={() => toggleIn(selectedGenres, setSelectedGenres, g.id)}>{g.emoji} {g.label}</button>
              ))}
            </div>

            <span className="pixp-label" style={{ marginTop: 22 }}>💗 moods</span>
            <div className="pixp-chips">
              {MOODS.map((m) => (
                <button key={m.id} className={`pixp-chip mood ${selectedMoods.includes(m.id) ? 'on' : ''}`}
                  onClick={() => toggleIn(selectedMoods, setSelectedMoods, m.id)}>{m.emoji} {m.label}</button>
              ))}
            </div>

            {covers.length > 0 && (
              <>
                <span className="pixp-label" style={{ marginTop: 22 }}>🖼️ cover</span>
                <div className="pixp-covers">
                  {covers.map((c) => (
                    <button key={c.id} className={`pixp-cover ${selectedCover === c.id ? 'on' : ''}`}
                      title={c.label} onClick={() => setSelectedCover(c.id)}>
                      <img src={c.image} alt={c.label} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <button className="pixp-btn pixp-make" style={{ marginTop: 22 }} onClick={generatePlaylist}
              disabled={loading || selectedGenres.length === 0 || selectedMoods.length === 0}>
              {loading ? '◌ making your mix...' : '✨ make my playlist ✨'}
            </button>
            {error && <div className="pixp-err">{error}</div>}
          </div>

          <div className="pixp-box pixp-panel">
            <div className="pixp-empty">
              <div className="big">🌸</div>
              <h3>no mix yet!</h3>
              <p>add a singer if you like, pick genres + moods,<br />then hit make my playlist ♡</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'playlist' && (
        <div className="pixp-box pixp-panel">
          {playlist.length === 0 ? (
            <div className="pixp-empty"><div className="big">🎀</div><h3>nothing here yet</h3><p>go to make and create your first mix ♡</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {coverImage && <img className="pixp-plcover" src={coverImage} alt="cover" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 className="pixp-pixel" style={{ fontSize: 13, color: 'var(--ol)', margin: 0 }}>{playlistName}</h2>
                  <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>{playlist.length} songs ♡</span>
                </div>
              </div>
              {coverNote && <div className="pixp-hint">couldn't set the cover (Spotify dev-mode limit) — your playlist is still saved ♡</div>}
              <div className="pixp-list">{playlist.map((song, idx) => <SongRow key={song.id} song={song} idx={idx} showTools />)}</div>
              <button className={`pixp-btn pixp-save ${saved ? 'done' : ''}`} onClick={savePlaylist}>
                {saved ? '✓ saved to spotify ♡' : '💾 save to spotify'}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="pixp-box pixp-panel">
          {favSongs.length === 0 ? (
            <div className="pixp-empty"><div className="big">💖</div><h3>no faves yet</h3><p>tap the 🤍 on any song to save it here ♡</p></div>
          ) : (
            <div className="pixp-list">{favSongs.map((song) => <SongRow key={song.id} song={song} idx={null} showTools={false} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}
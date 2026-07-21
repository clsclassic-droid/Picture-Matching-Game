// Sound effects: synthesized with the Web Audio API (no assets needed).
// Background music: real licensed tracks played via <audio> (see Music/).

const GameAudio = (() => {
  let ctx = null;
  let sfxGain;
  let sfxMuted = false;
  let musicMuted = false;
  let musicVolume = 0.5;
  let musicEl = null;
  let playingTrackId = null;

  const SFX_BASE_GAIN = 0.35;

  const MUSIC_TRACKS = {
    "cotton-toys": {
      label: "Cotton Toys",
      src: "Music/cotton-toys-soundroll-main-version-16753-01-17.mp3",
    },
    "pixel-drift": {
      label: "Pixel Drift",
      src: "Music/pixel-drift-pecan-pie-main-version-41106-02-09.mp3",
    },
  };
  let currentTrackId = "cotton-toys";

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      sfxGain = ctx.createGain();
      sfxGain.gain.value = sfxMuted ? 0 : SFX_BASE_GAIN;
      sfxGain.connect(ctx.destination);
    }
    // Browsers sometimes create/leave the context suspended (autoplay
    // policy) even when called from a click handler; resume defensively.
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freq, start, duration, type = "sine", gain = 1, dest = sfxGain, glideTo = null }) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + duration);

    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(gain, start + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(env);
    env.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function playMenuClick() {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    tone({ freq: 660, start: t, duration: 0.07, type: "sine", gain: 0.35 });
  }

  function playFlip() {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    tone({ freq: 520, start: t, duration: 0.09, type: "triangle", gain: 0.5 });
  }

  function playMatch() {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    tone({ freq: 523.25, start: t, duration: 0.16, type: "triangle", gain: 0.55 });
    tone({ freq: 783.99, start: t + 0.1, duration: 0.22, type: "triangle", gain: 0.55 });
  }

  function playMismatch() {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    tone({ freq: 220, start: t, duration: 0.28, type: "sawtooth", gain: 0.3, glideTo: 130 });
  }

  function playWin() {
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone({ freq, start: t + i * 0.14, duration: 0.3, type: "triangle", gain: 0.55 });
    });
  }

  function startMusic(trackId) {
    if (trackId && MUSIC_TRACKS[trackId]) currentTrackId = trackId;
    const track = MUSIC_TRACKS[currentTrackId];

    if (!musicEl) {
      musicEl = new Audio();
      musicEl.loop = true;
    }
    musicEl.volume = musicMuted ? 0 : musicVolume;

    // Already playing this exact track — don't restart it from the top.
    if (playingTrackId === currentTrackId && !musicEl.paused) return;

    playingTrackId = currentTrackId;
    musicEl.pause();
    musicEl.src = track.src;
    musicEl.currentTime = 0;
    musicEl.play().catch(() => {
      // Autoplay is blocked until the visitor interacts with the page at
      // all; the next click/keydown anywhere retries via the same call.
    });
  }

  function stopMusic() {
    if (musicEl) musicEl.pause();
  }

  function setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(1, volume));
    if (musicEl && !musicMuted) musicEl.volume = musicVolume;
  }

  function toggleSfxMute() {
    sfxMuted = !sfxMuted;
    if (ctx) sfxGain.gain.setTargetAtTime(sfxMuted ? 0 : SFX_BASE_GAIN, ctx.currentTime, 0.05);
    return sfxMuted;
  }

  function toggleMusicMute() {
    musicMuted = !musicMuted;
    if (musicEl) musicEl.volume = musicMuted ? 0 : musicVolume;
    return musicMuted;
  }

  function isSfxMuted() {
    return sfxMuted;
  }

  function isMusicMuted() {
    return musicMuted;
  }

  return {
    ensureContext,
    playMenuClick,
    playFlip,
    playMatch,
    playMismatch,
    playWin,
    startMusic,
    stopMusic,
    setMusicVolume,
    toggleSfxMute,
    toggleMusicMute,
    isSfxMuted,
    isMusicMuted,
  };
})();

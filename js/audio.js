// Lightweight sound effects + background music, synthesized with the Web
// Audio API so the game needs zero downloaded audio assets.

const GameAudio = (() => {
  let ctx = null;
  let masterGain, sfxGain, musicGain;
  let muted = false;
  let musicTimer = null;
  let musicOn = false;

  const MUSIC_TRACKS = {
    playful: {
      notes: [261.63, 329.63, 392.0, 493.88, 440.0, 392.0, 329.63, 293.66],
      noteDuration: 0.38,
      type: "sine",
      gain: 0.6,
    },
    chill: {
      notes: [220.0, 261.63, 329.63, 392.0, 329.63, 261.63],
      noteDuration: 0.58,
      type: "sine",
      gain: 0.5,
    },
    retro: {
      notes: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 261.63, 329.63],
      noteDuration: 0.2,
      type: "square",
      gain: 0.25,
    },
    epic: {
      notes: [261.63, 293.66, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66],
      noteDuration: 0.28,
      type: "triangle",
      gain: 0.6,
    },
  };
  let currentTrackId = "playful";

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(ctx.destination);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.35;
      sfxGain.connect(masterGain);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.05;
      musicGain.connect(masterGain);
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

  function scheduleMusicLoop() {
    if (!musicOn) return;
    const track = MUSIC_TRACKS[currentTrackId] || MUSIC_TRACKS.playful;
    const startTime = ctx.currentTime + 0.05;
    track.notes.forEach((freq, i) => {
      tone({
        freq,
        start: startTime + i * track.noteDuration,
        duration: track.noteDuration * 0.9,
        type: track.type,
        gain: track.gain,
        dest: musicGain,
      });
    });
    musicTimer = setTimeout(scheduleMusicLoop, track.notes.length * track.noteDuration * 1000);
  }

  function startMusic(trackId) {
    ensureContext();
    if (trackId && MUSIC_TRACKS[trackId]) currentTrackId = trackId;
    if (musicOn) return;
    musicOn = true;
    scheduleMusicLoop();
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
  }

  function toggleMute() {
    muted = !muted;
    if (ctx) masterGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    ensureContext,
    playFlip,
    playMatch,
    playMismatch,
    playWin,
    startMusic,
    stopMusic,
    toggleMute,
    isMuted,
  };
})();

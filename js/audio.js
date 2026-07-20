// Lightweight sound effects + background music, synthesized with the Web
// Audio API so the game needs zero downloaded audio assets.

const GameAudio = (() => {
  let ctx = null;
  let masterGain, sfxGain, musicGain;
  let muted = false;
  let musicTimer = null;
  let musicOn = false;

  const MUSIC_NOTES = [261.63, 329.63, 392.0, 493.88, 440.0, 392.0, 329.63, 293.66];
  const NOTE_DURATION = 0.38;

  function ensureContext() {
    if (ctx) return ctx;
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
    const t = ctx.currentTime;
    tone({ freq: 520, start: t, duration: 0.09, type: "triangle", gain: 0.5 });
  }

  function playMatch() {
    if (!ctx) return;
    const t = ctx.currentTime;
    tone({ freq: 523.25, start: t, duration: 0.16, type: "triangle", gain: 0.55 });
    tone({ freq: 783.99, start: t + 0.1, duration: 0.22, type: "triangle", gain: 0.55 });
  }

  function playMismatch() {
    if (!ctx) return;
    const t = ctx.currentTime;
    tone({ freq: 220, start: t, duration: 0.28, type: "sawtooth", gain: 0.3, glideTo: 130 });
  }

  function playWin() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone({ freq, start: t + i * 0.14, duration: 0.3, type: "triangle", gain: 0.55 });
    });
  }

  function scheduleMusicLoop() {
    if (!musicOn) return;
    const startTime = ctx.currentTime + 0.05;
    MUSIC_NOTES.forEach((freq, i) => {
      tone({
        freq,
        start: startTime + i * NOTE_DURATION,
        duration: NOTE_DURATION * 0.9,
        type: "sine",
        gain: 0.6,
        dest: musicGain,
      });
    });
    musicTimer = setTimeout(scheduleMusicLoop, MUSIC_NOTES.length * NOTE_DURATION * 1000);
  }

  function startMusic() {
    ensureContext();
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

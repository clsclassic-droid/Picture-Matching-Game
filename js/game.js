// Picture Matching (memory) game — supports 8 / 16 / 32 pair difficulties,
// 1 or 2 players, and three card sources: built-in vector shapes
// (icons.js), built-in emoji rendered to images (emoji.js), or the user's
// own photos in Google Drive (see drive.js).

const MATCH_WORDS = ["MATCH!", "NICE!", "POW!", "ZAP!", "BOOM!", "COOL!", "EXCELLENT!"];


const state = {
  difficulty: 8,
  source: "shapes",
  musicTrack: "cotton-toys",
  playerCount: 1,
  players: [{ score: 0 }],
  currentPlayer: 0,
  deck: [],
  flipped: [],
  matchedCount: 0,
  moves: 0,
  timerId: null,
  seconds: 0,
  lock: false,
};

const el = {
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  board: document.getElementById("board"),
  moves: document.getElementById("moves"),
  timer: document.getElementById("timer"),
  pairsLeft: document.getElementById("pairs-left"),
  winOverlay: document.getElementById("win-overlay"),
  winTitle: document.getElementById("win-title"),
  winStats: document.getElementById("win-stats"),
  driveStatus: document.getElementById("drive-status"),
  restartBtn: document.getElementById("restart-btn"),
  changeSettingsBtn: document.getElementById("change-settings-btn"),
  playAgainBtn: document.getElementById("play-again-btn"),
  backToMenuBtn: document.getElementById("back-to-menu-btn"),
  musicMuteBtn: document.getElementById("music-mute-btn"),
  musicMuteBtnStart: document.getElementById("music-mute-btn-start"),
  sfxMuteBtn: document.getElementById("sfx-mute-btn"),
  sfxMuteBtnStart: document.getElementById("sfx-mute-btn-start"),
  musicVolume: document.getElementById("music-volume"),
  scoreboard: document.getElementById("scoreboard"),
  playerCards: [document.getElementById("player-card-0"), document.getElementById("player-card-1")],
  playerScores: [document.getElementById("player-score-0"), document.getElementById("player-score-1")],
  turnFlags: [document.getElementById("turn-flag-0"), document.getElementById("turn-flag-1")],
};

function setMusicMuteIcon(muted) {
  const icon = muted ? "🚫" : "🎵";
  el.musicMuteBtn.textContent = icon;
  el.musicMuteBtnStart.textContent = icon;
}

function setSfxMuteIcon(muted) {
  const icon = muted ? "🔇" : "🔊";
  el.sfxMuteBtn.textContent = icon;
  el.sfxMuteBtnStart.textContent = icon;
}

function handleMusicMuteClick() {
  GameAudio.ensureContext();
  setMusicMuteIcon(GameAudio.toggleMusicMute());
}

function handleSfxMuteClick() {
  GameAudio.ensureContext();
  setSfxMuteIcon(GameAudio.toggleSfxMute());
}

el.musicMuteBtn.addEventListener("click", handleMusicMuteClick);
el.musicMuteBtnStart.addEventListener("click", handleMusicMuteClick);
el.sfxMuteBtn.addEventListener("click", handleSfxMuteClick);
el.sfxMuteBtnStart.addEventListener("click", handleSfxMuteClick);

el.musicVolume.addEventListener("input", () => {
  GameAudio.setMusicVolume(Number(el.musicVolume.value) / 100);
});

document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.difficulty = Number(btn.dataset.pairs);
    GameAudio.ensureContext();
    GameAudio.playMenuClick();
  });
});

document.querySelectorAll(".player-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".player-toggle").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.playerCount = Number(btn.dataset.players);
    GameAudio.ensureContext();
    GameAudio.playMenuClick();
  });
});

document.querySelectorAll(".music-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".music-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.musicTrack = btn.dataset.music;
    GameAudio.ensureContext();
    GameAudio.playMenuClick();
    GameAudio.startMusic(state.musicTrack);
  });
});

document.querySelectorAll(".source-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".source-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.source = btn.dataset.source;
    el.driveStatus.textContent = "";
    GameAudio.ensureContext();
    GameAudio.playMenuClick();
  });
});

document.getElementById("start-btn").addEventListener("click", startGame);
el.restartBtn.addEventListener("click", () => startGame());
el.changeSettingsBtn.addEventListener("click", showStartScreen);
el.playAgainBtn.addEventListener("click", () => startGame());
el.backToMenuBtn.addEventListener("click", showStartScreen);

function showStartScreen() {
  stopTimer();
  GameAudio.startMusic(state.musicTrack);
  el.gameScreen.classList.add("hidden");
  el.winOverlay.classList.add("hidden");
  el.startScreen.classList.remove("hidden");
}

async function startGame() {
  GameAudio.ensureContext();
  const pairs = state.difficulty;

  let faces;
  if (state.source === "drive") {
    try {
      faces = await buildDriveFaces(pairs);
    } catch (err) {
      el.driveStatus.textContent = `❌ ${err.message}`;
      return;
    }
  } else if (state.source === "emoji") {
    faces = shuffle(Emoji.POOL.slice())
      .slice(0, pairs)
      .map((e) => ({ type: "image", value: Emoji.toDataURL(e) }));
  } else {
    faces = shuffle(Icons.allCombos())
      .slice(0, pairs)
      .map((c) => ({ type: "icon", shape: c.shape, color: c.color }));
  }

  state.deck = shuffle(
    faces.flatMap((face, i) => [
      { ...face, pairId: i, uid: `${i}-a` },
      { ...face, pairId: i, uid: `${i}-b` },
    ])
  );
  state.flipped = [];
  state.matchedCount = 0;
  state.moves = 0;
  state.seconds = 0;
  state.lock = false;
  state.players = Array.from({ length: state.playerCount }, () => ({ score: 0 }));
  state.currentPlayer = 0;

  el.startScreen.classList.add("hidden");
  el.winOverlay.classList.add("hidden");
  el.gameScreen.classList.remove("hidden");

  renderBoard();
  updateStats();
  renderScoreboard();
  startTimer();
  GameAudio.startMusic(state.musicTrack);
}

async function buildDriveFaces(pairs) {
  if (!Drive.isConfigured()) {
    throw new Error("Google Drive mode isn't set up yet. See README.md.");
  }
  el.driveStatus.textContent = "📂 Loading photos...";
  const files = await Drive.listImages(APP_CONFIG.DRIVE_FOLDER_ID);

  if (files.length < pairs) {
    throw new Error(
      `You only have ${files.length} photo(s) in the Drive folder, but ${pairs} are needed. Upload more or pick a lower difficulty.`
    );
  }

  const chosen = shuffle(files.slice()).slice(0, pairs);
  const faces = chosen.map((file) => ({
    type: "image",
    value: Drive.getImageUrl(file.id),
    animeInfo: CardAnime.getAnimeInfo(file.name),
  }));
  el.driveStatus.textContent = "";
  return faces;
}

function renderBoard() {
  const totalCards = state.deck.length;
  const isMobile = window.matchMedia("(max-width: 600px)").matches;
  const colsMap = {
    8: isMobile ? 4 : 4,
    16: isMobile ? 4 : 8,
    32: isMobile ? 6 : 8,
  };
  const cols = colsMap[state.difficulty] || Math.ceil(Math.sqrt(totalCards));

  el.board.style.setProperty("--cols", cols);
  el.board.innerHTML = "";

  state.deck.forEach((card) => {
    const cardEl = document.createElement("button");
    cardEl.className = "card";
    cardEl.dataset.uid = card.uid;
    cardEl.setAttribute("aria-label", "Hidden card");

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.textContent = "?";

    const front = document.createElement("div");
    front.className = "card-face card-front";
    if (card.type === "icon") {
      front.innerHTML = Icons.svgMarkup(card.shape, card.color);
    } else {
      const img = document.createElement("img");
      img.src = card.value;
      img.alt = "Card photo";
      front.appendChild(img);
    }

    inner.appendChild(back);
    inner.appendChild(front);
    cardEl.appendChild(inner);
    cardEl.addEventListener("click", () => onCardClick(card, cardEl));
    if (card.animeInfo) CardAnime.attachToCard(cardEl, card.animeInfo);
    el.board.appendChild(cardEl);
  });
}

function onCardClick(card, cardEl) {
  if (state.lock) return;
  if (cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;
  if (state.flipped.length === 2) return;

  cardEl.classList.add("flipped");
  state.flipped.push({ card, cardEl });
  GameAudio.playFlip();

  if (state.flipped.length === 2) {
    state.moves += 1;
    updateStats();
    checkMatch();
  }
}

function checkMatch() {
  const [first, second] = state.flipped;
  const isMatch = first.card.pairId === second.card.pairId;

  if (isMatch) {
    first.cardEl.classList.add("matched");
    second.cardEl.classList.add("matched");
    state.matchedCount += 1;
    state.flipped = [];
    state.players[state.currentPlayer].score += 1;
    updateStats();
    renderScoreboard();
    spawnMatchBurst(first.cardEl, second.cardEl);
    if (state.matchedCount === state.difficulty) {
      finishGame();
    } else {
      GameAudio.playMatch();
    }
    return;
  }

  GameAudio.playMismatch();
  state.lock = true;
  setTimeout(() => {
    first.cardEl.classList.remove("flipped");
    second.cardEl.classList.remove("flipped");
    state.flipped = [];
    state.lock = false;
    if (state.playerCount === 2) {
      state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
      renderScoreboard();
    }
  }, 800);
}

function renderScoreboard() {
  const twoPlayer = state.playerCount === 2;
  el.scoreboard.classList.toggle("hidden", !twoPlayer);
  if (!twoPlayer) return;

  for (let i = 0; i < 2; i++) {
    el.playerScores[i].textContent = state.players[i].score;
    const isActive = state.currentPlayer === i;
    el.playerCards[i].classList.toggle("active", isActive);
    el.turnFlags[i].classList.toggle("hidden", !isActive);
  }
}

function spawnMatchBurst(cardElA, cardElB) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const boardRect = el.board.getBoundingClientRect();
  const rectA = cardElA.getBoundingClientRect();
  const rectB = cardElB.getBoundingClientRect();
  const midX = ((rectA.left + rectA.right) / 2 + (rectB.left + rectB.right) / 2) / 2 - boardRect.left;
  const midY = ((rectA.top + rectA.bottom) / 2 + (rectB.top + rectB.bottom) / 2) / 2 - boardRect.top;

  const burst = document.createElement("div");
  burst.className = "match-burst";
  burst.style.left = `${midX}px`;
  burst.style.top = `${midY}px`;
  burst.textContent = MATCH_WORDS[Math.floor(Math.random() * MATCH_WORDS.length)];
  burst.addEventListener("animationend", () => burst.remove());
  el.board.appendChild(burst);
}

function updateStats() {
  el.moves.textContent = state.moves;
  el.pairsLeft.textContent = state.difficulty - state.matchedCount;
}

function startTimer() {
  stopTimer();
  el.timer.textContent = "0:00";
  state.timerId = setInterval(() => {
    state.seconds += 1;
    const m = Math.floor(state.seconds / 60);
    const s = String(state.seconds % 60).padStart(2, "0");
    el.timer.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function finishGame() {
  stopTimer();
  GameAudio.stopMusic();
  GameAudio.playWin();

  if (state.playerCount === 2) {
    const [p1, p2] = state.players;
    let result;
    if (p1.score > p2.score) result = `Player 1 wins, ${p1.score}–${p2.score}!`;
    else if (p2.score > p1.score) result = `Player 2 wins, ${p2.score}–${p1.score}!`;
    else result = `It's a tie, ${p1.score}–${p2.score}!`;
    el.winTitle.textContent = "🎉 Game Over!";
    el.winStats.textContent = `${result} (${state.moves} moves, ${el.timer.textContent})`;
  } else {
    el.winTitle.textContent = "🎉 You matched them all!";
    el.winStats.textContent = `${state.difficulty} pairs matched in ${state.moves} moves, ${el.timer.textContent}.`;
  }

  el.winOverlay.classList.remove("hidden");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Try to start music the moment the page loads. Browsers block audio
// autoplay until the visitor has interacted with the page at all, so if
// this attempt is silently blocked, the very first click/tap/keypress
// anywhere retries it (GameAudio.startMusic is a no-op if it's already
// playing, so this never causes a double-start).
GameAudio.startMusic(state.musicTrack);
function unlockMusicOnFirstInteraction() {
  GameAudio.ensureContext();
  GameAudio.startMusic(state.musicTrack);
}
document.addEventListener("pointerdown", unlockMusicOnFirstInteraction, { once: true });
document.addEventListener("keydown", unlockMusicOnFirstInteraction, { once: true });

// Picture Matching (memory) game — supports 8 / 16 / 32 pair difficulties
// and three card sources: built-in vector shapes (icons.js), built-in
// emoji rendered to images (emoji.js), or the user's own photos in
// Google Drive (see drive.js).

const state = {
  difficulty: 8,
  source: "shapes",
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
  winStats: document.getElementById("win-stats"),
  driveStatus: document.getElementById("drive-status"),
  restartBtn: document.getElementById("restart-btn"),
  changeSettingsBtn: document.getElementById("change-settings-btn"),
  playAgainBtn: document.getElementById("play-again-btn"),
  backToMenuBtn: document.getElementById("back-to-menu-btn"),
  muteBtn: document.getElementById("mute-btn"),
  muteBtnStart: document.getElementById("mute-btn-start"),
};

function setMuteIcon(muted) {
  const icon = muted ? "🔇" : "🔊";
  el.muteBtn.textContent = icon;
  el.muteBtnStart.textContent = icon;
}

function handleMuteClick() {
  GameAudio.ensureContext();
  setMuteIcon(GameAudio.toggleMute());
}

el.muteBtn.addEventListener("click", handleMuteClick);
el.muteBtnStart.addEventListener("click", handleMuteClick);

document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".difficulty-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.difficulty = Number(btn.dataset.pairs);
  });
});

document.querySelectorAll(".source-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".source-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.source = btn.dataset.source;
    el.driveStatus.textContent = "";
  });
});

document.getElementById("start-btn").addEventListener("click", startGame);
el.restartBtn.addEventListener("click", () => startGame());
el.changeSettingsBtn.addEventListener("click", showStartScreen);
el.playAgainBtn.addEventListener("click", () => startGame());
el.backToMenuBtn.addEventListener("click", showStartScreen);

function showStartScreen() {
  stopTimer();
  GameAudio.stopMusic();
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

  el.startScreen.classList.add("hidden");
  el.winOverlay.classList.add("hidden");
  el.gameScreen.classList.remove("hidden");

  renderBoard();
  updateStats();
  startTimer();
  GameAudio.startMusic();
}

async function buildDriveFaces(pairs) {
  if (!Drive.isConfigured()) {
    throw new Error("Google Drive mode isn't set up yet. See README.md.");
  }
  el.driveStatus.textContent = "🔐 Signing in to Google...";
  await Drive.signIn();

  el.driveStatus.textContent = "📂 Loading your photos...";
  const files = await Drive.listImages(APP_CONFIG.DRIVE_FOLDER_ID);

  if (files.length < pairs) {
    throw new Error(
      `You only have ${files.length} photo(s) in the Drive folder, but ${pairs} are needed. Upload more or pick a lower difficulty.`
    );
  }

  const chosen = shuffle(files.slice()).slice(0, pairs);
  el.driveStatus.textContent = `⬇️ Downloading ${chosen.length} photos...`;
  const faces = [];
  for (const file of chosen) {
    const src = await Drive.fetchImageObjectUrl(file.id);
    faces.push({ type: "image", value: src });
  }
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
    updateStats();
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
  }, 800);
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
  el.winStats.textContent = `${state.difficulty} pairs matched in ${state.moves} moves, ${el.timer.textContent}.`;
  el.winOverlay.classList.remove("hidden");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

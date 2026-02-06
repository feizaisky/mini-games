import { towerTypes } from "./maps.js";
import { Game, attachDebugHooks } from "./game.js";
import { AudioManager } from "./audio.js";
import { loadProgress, saveProgress } from "./storage.js";
import { setupUI } from "./ui.js";

const canvas = document.getElementById("game-canvas");
const audio = new AudioManager();
const game = new Game(canvas, audio);
attachDebugHooks(game);

const progress = loadProgress();

const elements = {
  goldEl: document.getElementById("gold"),
  hpEl: document.getElementById("hp"),
  waveEl: document.getElementById("wave"),
  pauseBtn: document.getElementById("pause-btn"),
  speedBtn: document.getElementById("speed-btn"),
  soundBtn: document.getElementById("sound-btn"),
  menuBtn: document.getElementById("menu-btn"),
  startWaveBtn: document.getElementById("start-wave"),
  upgradeBtn: document.getElementById("upgrade-btn"),
  sellBtn: document.getElementById("sell-btn"),
  towerActions: document.getElementById("tower-actions"),
  buildCards: Array.from(document.querySelectorAll(".build-card")),
  canvas,
  menuScreen: document.getElementById("menu-screen"),
  mapList: document.getElementById("map-list"),
  closeMenuBtn: document.getElementById("close-menu"),
  toast: document.getElementById("toast"),
  towerDetailCard: document.getElementById("tower-detail-card"),
  towerDetailName: document.getElementById("tower-detail-name"),
  towerDetailBody: document.getElementById("tower-detail-body"),
  towerDetailClose: document.getElementById("tower-detail-close")
};

const ui = setupUI({
  game,
  audio,
  elements,
  progress,
  saveProgress
});

for (const [type, data] of Object.entries(towerTypes)) {
  const costEl = document.querySelector(`[data-cost="${type}"]`);
  if (costEl) {
    costEl.textContent = `${data.cost} 金币`;
  }
  const effectTextEl = document.querySelector(`[data-effect-text="${type}"]`);
  if (effectTextEl) {
    const effectText = data.slowFactor
      ? "效果：减速"
      : data.splashRadius
        ? "效果：溅射"
        : data.chainCount
          ? "效果：连锁"
          : data.poisonDamage
            ? "效果：中毒"
            : "效果：单体";
    effectTextEl.textContent = effectText;
  }
  const effectEl = document.querySelector(`[data-effect="${type}"]`);
  if (effectEl) {
    const icon = data.slowFactor
      ? "❄"
      : data.splashRadius
        ? "💥"
        : data.chainCount
          ? "⚡"
          : data.poisonDamage
            ? "☠"
            : "🎯";
    effectEl.textContent = icon;
    effectEl.title = data.desc;
  }
}

const onResize = () => {
  game.resize();
};

window.addEventListener("resize", onResize);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

document.addEventListener("keydown", (event) => {
  if (event.key === "f" || event.key === "F") {
    toggleFullscreen();
  }
  if (event.key === "Escape" && document.fullscreenElement) {
    document.exitFullscreen?.();
  }
});

const loopUI = () => {
  ui.updateUI();
  requestAnimationFrame(loopUI);
};

game.start(0);
game.run();
loopUI();

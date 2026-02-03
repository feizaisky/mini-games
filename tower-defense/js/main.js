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
  toast: document.getElementById("toast")
};

const ui = setupUI({
  game,
  audio,
  elements,
  progress,
  saveProgress
});

const formatRate = (rate) => (1 / rate).toFixed(1);

for (const [type, data] of Object.entries(towerTypes)) {
  const infoEl = document.querySelector(`[data-info="${type}"]`);
  if (infoEl) {
    const effect = data.slowFactor ? "减速" : data.splashRadius ? "溅射" : "无";
    infoEl.textContent = `花费：${data.cost}，攻击力：${data.damage}，攻速：${formatRate(data.fireRate)}，效果：${effect}`;
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

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("selectstart", (event) => {
  event.preventDefault();
});

const loopUI = () => {
  ui.updateUI();
  requestAnimationFrame(loopUI);
};

game.start(0);
game.run();
loopUI();

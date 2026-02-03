import { towerTypes, waves, maps } from "./maps.js";

export function setupUI({
  game,
  audio,
  elements,
  progress,
  saveProgress
}) {
  const {
    goldEl,
    hpEl,
    waveEl,
    pauseBtn,
    speedBtn,
    soundBtn,
    menuBtn,
    startWaveBtn,
    upgradeBtn,
    sellBtn,
    towerActions,
    buildCards,
    canvas,
    menuScreen,
    mapList,
    closeMenuBtn,
    toast
  } = elements;

  let dragging = null;
  let dragGhost = null;

  const showToast = (message, duration = 1600) => {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
      toast.hidden = true;
    }, duration);
  };

  const updateMapList = () => {
    mapList.innerHTML = "";
    maps.forEach((map, index) => {
      const card = document.createElement("div");
      const unlocked = index + 1 <= progress.unlocked;
      card.className = `map-card${unlocked ? "" : " locked"}`;
      card.innerHTML = `
        <h3>${map.name}</h3>
        <p>${map.description}</p>
        <p>最高波次：${progress.bestWaves[index] || 0}/${waves.length}</p>
        ${unlocked ? "" : "<p>未解锁</p>"}
      `;
      if (unlocked) {
        card.addEventListener("click", () => {
          game.start(index);
          game.run();
          menuScreen.hidden = true;
        });
      }
      mapList.appendChild(card);
    });
  };

  const updateBuildCardSelection = () => {
    const state = game.getUIState();
    buildCards.forEach((card) => {
      const type = card.dataset.tower;
      card.classList.toggle("selected", state.buildMode === type);
    });
  };

  const clearDrag = () => {
    dragging = null;
    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }
    game.setHoverTile(null);
  };

  const startDrag = (event, type) => {
    const rect = canvas.getBoundingClientRect();
    dragging = {
      type,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    dragGhost = document.createElement("div");
    dragGhost.className = "drag-ghost";
    dragGhost.textContent = towerTypes[type].name;
    document.body.appendChild(dragGhost);
    updateGhostPosition(event.clientX, event.clientY);
    game.setBuildMode(type);
    updateBuildCardSelection();
    audio.unlock();

    const onMove = (moveEvent) => {
      if (!dragging || moveEvent.pointerId !== dragging.pointerId) return;
      const dx = moveEvent.clientX - dragging.startX;
      const dy = moveEvent.clientY - dragging.startY;
      if (!dragging.moved && Math.hypot(dx, dy) > 8) {
        dragging.moved = true;
      }
      updateGhostPosition(moveEvent.clientX, moveEvent.clientY);
      const tile = game.getTileFromScreen(moveEvent.clientX, moveEvent.clientY);
      game.setHoverTile(tile);
    };

    const onUp = (upEvent) => {
      if (!dragging || upEvent.pointerId !== dragging.pointerId) return;
      const tile = game.getTileFromScreen(upEvent.clientX, upEvent.clientY);
      if (dragging.moved) {
        const result = game.placeTower(tile, dragging.type);
        if (!result.ok) showToast(result.reason);
        else showToast("防御塔已建造！");
        game.clearBuildMode();
      } else {
        showToast("点选格子即可放置。");
      }
      updateBuildCardSelection();
      clearDrag();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const updateGhostPosition = (x, y) => {
    if (!dragGhost) return;
    dragGhost.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
  };

  buildCards.forEach((card) => {
    card.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      startDrag(event, card.dataset.tower);
    });
  });

  canvas.addEventListener("pointermove", (event) => {
    if (dragging) return;
    if (!game.getUIState().buildMode) return;
    const tile = game.getTileFromScreen(event.clientX, event.clientY);
    game.setHoverTile(tile);
  });

  canvas.addEventListener("pointerleave", () => {
    if (!dragging) game.setHoverTile(null);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (dragging && dragging.moved) return;
    const tile = game.getTileFromScreen(event.clientX, event.clientY);
    const state = game.getUIState();
    const towerAt = game.getTowerAt(tile);
    if (towerAt) {
      game.clearBuildMode();
      updateBuildCardSelection();
      game.selectTowerAt(tile);
      showToast("已选择防御塔。");
      return;
    }
    if (state.buildMode) {
      const result = game.placeTower(tile);
      if (!result.ok) showToast(result.reason);
      else showToast("防御塔已建造！");
      game.clearBuildMode();
      updateBuildCardSelection();
      return;
    }
    game.selectTowerAt(null);
  });


  startWaveBtn.addEventListener("click", () => {
    audio.unlock();
    if (!game.startWave()) {
      showToast("当前无法开始。");
      return;
    }
    showToast("开始！");
  });

  pauseBtn.addEventListener("click", () => {
    const paused = game.togglePause();
    pauseBtn.textContent = paused ? "继续" : "暂停";
  });

  speedBtn.addEventListener("click", () => {
    const next = game.getUIState().speed === 1 ? 2 : 1;
    game.setSpeed(next);
    speedBtn.textContent = `${next}x`;
  });

  soundBtn.addEventListener("click", () => {
    const enabled = audio.toggle();
    game.state.soundOn = enabled;
    soundBtn.textContent = enabled ? "音效:开" : "音效:关";
  });

  menuBtn.addEventListener("click", () => {
    updateMapList();
    menuScreen.hidden = false;
  });

  closeMenuBtn.addEventListener("click", () => {
    menuScreen.hidden = true;
  });

  upgradeBtn.addEventListener("click", () => {
    const result = game.upgradeSelected();
    if (!result.ok) showToast(result.reason);
    else showToast("已升级！");
  });

  sellBtn.addEventListener("click", () => {
    const result = game.sellSelected();
    if (!result.ok) showToast(result.reason);
    else showToast("已出售。");
  });

  document.addEventListener("pointerdown", () => {
    audio.unlock();
  }, { once: true });

  const updateUI = () => {
    const state = game.getUIState();
    goldEl.textContent = state.gold;
    hpEl.textContent = Math.max(0, state.baseHp);
    const waveDisplay = state.activeWave || Math.min(state.nextWave, waves.length);
    waveEl.textContent = waveDisplay;

    const autoSeconds = Math.ceil(state.autoWaveTimer || 0);
    startWaveBtn.disabled = state.waveInProgress || state.mode !== "playing";
    if (state.waveInProgress) {
      startWaveBtn.textContent = "进行中";
    } else if (autoSeconds > 0) {
      startWaveBtn.textContent = `倒计时 ${autoSeconds}s`;
    } else {
      startWaveBtn.textContent = "开始";
    }

    pauseBtn.textContent = state.paused ? "继续" : "暂停";
    speedBtn.textContent = `${state.speed}x`;
    soundBtn.textContent = audio.enabled ? "音效:开" : "音效:关";

    const selectedTower = game.getSelectedTower();
    if (selectedTower) {
      towerActions.hidden = false;
      const upgradeCost = game.getUpgradeCost(selectedTower);
      upgradeBtn.textContent = `升级（${upgradeCost}）`;
      upgradeBtn.disabled = state.gold < upgradeCost;
      sellBtn.textContent = `出售（${game.getSellValue(selectedTower)}）`;

      const canvasRect = canvas.getBoundingClientRect();
      const wrapRect = canvas.parentElement.getBoundingClientRect();
      const offsetX = canvasRect.left - wrapRect.left;
      const offsetY = canvasRect.top - wrapRect.top;
      const overlayWidth = towerActions.offsetWidth;
      const overlayHeight = towerActions.offsetHeight;
      const padding = 10;
      const minSpace = overlayHeight + 24;
      let anchorX = offsetX + selectedTower.x;
      let anchorY = offsetY + selectedTower.y;
      const halfWidth = overlayWidth / 2;
      anchorX = Math.min(
        wrapRect.width - padding - halfWidth,
        Math.max(padding + halfWidth, anchorX)
      );
      const spaceAbove = anchorY - padding;
      const spaceBelow = wrapRect.height - anchorY - padding;
      const placeBelow = spaceAbove < minSpace && spaceBelow >= spaceAbove;
      towerActions.classList.toggle("below", placeBelow);
      towerActions.style.left = `${anchorX}px`;
      towerActions.style.top = `${anchorY}px`;
    } else {
      towerActions.hidden = true;
      towerActions.classList.remove("below");
    }

    updateBuildCardSelection();
  };

  const handleWaveComplete = (completedWave) => {
    progress.bestWaves[game.state.mapIndex] = Math.max(
      progress.bestWaves[game.state.mapIndex],
      completedWave
    );
    if (completedWave >= waves.length && progress.unlocked < maps.length) {
      progress.unlocked = Math.min(maps.length, progress.unlocked + 1);
    }
    saveProgress(progress);
    showToast(`第 ${completedWave} 波已清除！`);
  };

  const handleGameOver = () => {
    showToast("战败！再试一次。");
  };

  const handleVictory = () => {
    showToast("胜利！新地图已解锁。");
  };

  game.setCallbacks({
    onWaveComplete: handleWaveComplete,
    onGameOver: handleGameOver,
    onVictory: handleVictory
  });

  updateMapList();
  updateUI();

  return {
    updateUI,
    showMenu: () => {
      updateMapList();
      menuScreen.hidden = false;
    }
  };
}

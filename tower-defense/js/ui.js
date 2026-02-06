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
    toast,
    towerDetailCard,
    towerDetailName,
    towerDetailBody,
    towerDetailClose
  } = elements;

  const LONG_PRESS_MS = 420;
  let cardPress = null;
  let lastTouchAt = 0;

  const getEffectLabel = (tower) => {
    if (tower.slowFactor) return "减速";
    if (tower.splashRadius) return "溅射";
    if (tower.chainCount) return "连锁";
    if (tower.poisonDamage) return "中毒";
    return "单体";
  };

  const getEffectDetail = (tower) => {
    if (tower.slowFactor) return `减速至 ${(tower.slowFactor * 100).toFixed(0)}%，持续 ${tower.slowDuration}s`;
    if (tower.splashRadius) return `溅射半径 ${tower.splashRadius}`;
    if (tower.chainCount) return `连锁 ${tower.chainCount} 目标，链距 ${tower.chainRange}`;
    if (tower.poisonDamage) return `每秒 ${tower.poisonDamage} 点，持续 ${tower.poisonDuration}s`;
    return "无特殊效果";
  };

  const formatRate = (rate) => (1 / rate).toFixed(1);

  const showToast = (message, duration = 1600) => {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
      toast.hidden = true;
    }, duration);
  };

  const bindTap = (element, handler) => {
    if (!element) return;
    element.addEventListener("touchend", (event) => {
      if (event.changedTouches && event.changedTouches.length !== 1) return;
      event.preventDefault();
      lastTouchAt = Date.now();
      handler(event);
    }, { passive: false });
    element.addEventListener("click", (event) => {
      if (Date.now() - lastTouchAt < 450) {
        event.preventDefault();
        return;
      }
      handler(event);
    });
  };

  const updateMapList = () => {
    mapList.innerHTML = "";
    maps.forEach((map, index) => {
      const card = document.createElement("div");
      const unlocked = index + 1 <= progress.unlocked;
      card.className = `map-card${unlocked ? "" : " locked"}`;
      card.dataset.mapIndex = String(index);
      card.dataset.unlocked = unlocked ? "1" : "0";
      card.innerHTML = `
        <h3>${map.name}</h3>
        <p>${map.description}</p>
        <p>最高波次：${progress.bestWaves[index] || 0}/${waves.length}</p>
        ${unlocked ? "<button class=\"map-start-btn\" type=\"button\">开始游戏</button>" : "<p>未解锁</p>"}
      `;
      if (unlocked) {
        let started = false;
        const startSelectedMap = () => {
          if (started) return;
          started = true;
          game.start(index);
          game.run();
          menuScreen.hidden = true;
        };
        const startBtn = card.querySelector(".map-start-btn");
        bindTap(startBtn, startSelectedMap);
        bindTap(card, startSelectedMap);
      } else {
        const handleLocked = () => {
          showToast("该地图未解锁。");
        };
        bindTap(card, handleLocked);
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

  const showTowerDetail = (type) => {
    const tower = towerTypes[type];
    if (!tower) return;
    towerDetailName.textContent = tower.name;
    towerDetailBody.innerHTML = `
      费用：${tower.cost}<br>
      攻击力：${tower.damage}<br>
      攻速：${formatRate(tower.fireRate)} 次/秒<br>
      射程：${tower.range}<br>
      效果：${getEffectLabel(tower)}（${getEffectDetail(tower)}）<br>
      说明：${tower.desc}
    `;
    towerDetailCard.hidden = false;
  };

  const hideTowerDetail = () => {
    towerDetailCard.hidden = true;
  };

  const clearCardPress = () => {
    if (!cardPress) return;
    if (cardPress.timerId) clearTimeout(cardPress.timerId);
    cardPress = null;
  };

  buildCards.forEach((card) => {
    const beginPress = (clientX, clientY, pointerId, type) => {
      audio.unlock();
      cardPress = {
        type,
        pointerId,
        startX: clientX,
        startY: clientY,
        longPressed: false,
        timerId: setTimeout(() => {
          if (!cardPress || cardPress.pointerId !== pointerId) return;
          cardPress.longPressed = true;
          showTowerDetail(type);
          showToast("已显示详细属性。");
        }, LONG_PRESS_MS)
      };
    };

    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      beginPress(event.clientX, event.clientY, event.pointerId, card.dataset.tower);
    });

    card.addEventListener("touchstart", (event) => {
      if (!event.changedTouches || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      beginPress(touch.clientX, touch.clientY, "touch", card.dataset.tower);
    }, { passive: true });

    const movePress = (clientX, clientY, pointerId) => {
      if (!cardPress || cardPress.pointerId !== pointerId || cardPress.longPressed) return;
      if (Math.hypot(clientX - cardPress.startX, clientY - cardPress.startY) > 8) {
        clearCardPress();
      }
    };

    card.addEventListener("pointermove", (event) => {
      movePress(event.clientX, event.clientY, event.pointerId);
    });

    card.addEventListener("touchmove", (event) => {
      if (!event.changedTouches || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      movePress(touch.clientX, touch.clientY, "touch");
    }, { passive: true });

    const endPress = (pointerId) => {
      if (!cardPress || cardPress.pointerId !== pointerId) return;
      const { type, longPressed } = cardPress;
      clearCardPress();
      if (longPressed) return;

      const current = game.getUIState().buildMode;
      if (current === type) {
        game.clearBuildMode();
        showToast("已取消建造选择。");
      } else {
        game.setBuildMode(type);
        showToast(`已选择${towerTypes[type].name}，点击格子建造。`);
      }
      hideTowerDetail();
      updateBuildCardSelection();
    });

    card.addEventListener("pointerup", (event) => {
      endPress(event.pointerId);
    });
    card.addEventListener("touchend", () => endPress("touch"), { passive: true });

    card.addEventListener("pointercancel", clearCardPress);
    card.addEventListener("touchcancel", clearCardPress);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const type = card.dataset.tower;
      const current = game.getUIState().buildMode;
      if (current === type) {
        game.clearBuildMode();
      } else {
        game.setBuildMode(type);
      }
      updateBuildCardSelection();
    });
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!game.getUIState().buildMode) return;
    const tile = game.getTileFromScreen(event.clientX, event.clientY);
    game.setHoverTile(tile);
  });

  canvas.addEventListener("pointerleave", () => {
    game.setHoverTile(null);
  });

  canvas.addEventListener("pointerup", (event) => {
    const handleCanvasRelease = (clientX, clientY) => {
      const tile = game.getTileFromScreen(clientX, clientY);
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
    };

    handleCanvasRelease(event.clientX, event.clientY);
  });

  canvas.addEventListener("touchend", (event) => {
    if (!event.changedTouches || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    event.preventDefault();
    const tile = game.getTileFromScreen(touch.clientX, touch.clientY);
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
  }, { passive: false });

  bindTap(towerDetailClose, hideTowerDetail);

  bindTap(startWaveBtn, () => {
    audio.unlock();
    if (!game.startWave()) {
      showToast("当前无法开始。");
      return;
    }
    showToast("开始！");
  });

  bindTap(pauseBtn, () => {
    const paused = game.togglePause();
    pauseBtn.textContent = paused ? "继续" : "暂停";
  });

  bindTap(speedBtn, () => {
    const next = game.getUIState().speed === 1 ? 2 : 1;
    game.setSpeed(next);
    speedBtn.textContent = `${next}x`;
  });

  bindTap(soundBtn, () => {
    const enabled = audio.toggle();
    game.state.soundOn = enabled;
    soundBtn.textContent = enabled ? "音效:开" : "音效:关";
  });

  bindTap(menuBtn, () => {
    updateMapList();
    menuScreen.hidden = false;
  });

  bindTap(closeMenuBtn, () => {
    menuScreen.hidden = true;
  });

  bindTap(upgradeBtn, () => {
    const result = game.upgradeSelected();
    if (!result.ok) showToast(result.reason);
    else showToast("已升级！");
  });

  bindTap(sellBtn, () => {
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

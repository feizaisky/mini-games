import { maps, towerTypes, waves, expandPath } from "./maps.js";

export class Game {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.audio = audio;
    this.callbacks = {};
    this.state = {
      mode: "menu",
      mapIndex: 0,
      gold: 0,
      baseHp: 0,
      nextWave: 1,
      activeWave: null,
      waveInProgress: false,
      spawnTimer: 0,
      spawnedCount: 0,
      enemies: [],
      towers: [],
      projectiles: [],
      effects: [],
      buildMode: null,
      hoverTile: null,
      selectedTowerId: null,
      autoWaveTimer: 0,
      paused: false,
      speed: 1,
      soundOn: true
    };
    this.dimensions = {
      viewWidth: canvas.width,
      viewHeight: canvas.height,
      tileSize: 60,
      origin: { x: 0, y: 0 }
    };
    this.lastTime = 0;
    this.running = false;
    this.enemyId = 0;
    this.towerId = 0;
    this.projectileId = 0;
    this.pathTiles = [];
    this.pathTileSet = new Set();
    this.blockedSet = new Set();
    this.pathPixels = [];
    this.basePixel = { x: 0, y: 0 };
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  start(mapIndex) {
    this.state.mode = "playing";
    this.state.mapIndex = mapIndex;
    this.state.gold = 180;
    this.state.baseHp = 20;
    this.state.nextWave = 1;
    this.state.activeWave = null;
    this.state.waveInProgress = false;
    this.state.spawnTimer = 0;
    this.state.spawnedCount = 0;
    this.state.enemies = [];
    this.state.towers = [];
    this.state.projectiles = [];
    this.state.effects = [];
    this.state.buildMode = "gun";
    this.state.hoverTile = null;
    this.state.selectedTowerId = null;
    this.state.autoWaveTimer = 0;
    this.state.paused = false;
    this.state.speed = 1;
    this.enemyId = 0;
    this.towerId = 0;
    this.projectileId = 0;
    this.loadMap(mapIndex);
    this.resize();
  }

  loadMap(index) {
    const map = maps[index];
    this.map = map;
    this.pathTiles = expandPath(map.path);
    this.pathTileSet = new Set(this.pathTiles.map((tile) => `${tile.x},${tile.y}`));
    this.blockedSet = new Set(
      (map.decor || []).map((tile) => `${tile.x},${tile.y}`)
    );
  }

  resize() {
    if (!this.map) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dimensions.viewWidth = rect.width;
    this.dimensions.viewHeight = rect.height;
    const { cols, rows } = this.map.grid;
    const tileSize = Math.min(
      rect.width / cols,
      rect.height / rows
    );
    const boardWidth = tileSize * cols;
    const boardHeight = tileSize * rows;
    this.dimensions.tileSize = tileSize;
    this.dimensions.origin = {
      x: (rect.width - boardWidth) / 2,
      y: (rect.height - boardHeight) / 2
    };
    this.pathPixels = this.map.path.map((point) => this.gridToWorld(point));
    this.basePixel = this.gridToWorld(
      this.map.path[this.map.path.length - 1]
    );
  }

  gridToWorld(tile) {
    const { tileSize, origin } = this.dimensions;
    return {
      x: origin.x + (tile.x + 0.5) * tileSize,
      y: origin.y + (tile.y + 0.5) * tileSize
    };
  }

  worldToTile(point) {
    const { tileSize, origin } = this.dimensions;
    const x = Math.floor((point.x - origin.x) / tileSize);
    const y = Math.floor((point.y - origin.y) / tileSize);
    if (x < 0 || y < 0 || x >= this.map.grid.cols || y >= this.map.grid.rows) {
      return null;
    }
    return { x, y };
  }

  getTileFromScreen(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const point = {
      x: screenX - rect.left,
      y: screenY - rect.top
    };
    return this.worldToTile(point);
  }

  setBuildMode(type) {
    this.state.buildMode = type;
    this.state.selectedTowerId = null;
  }

  clearBuildMode() {
    this.state.buildMode = null;
    this.state.hoverTile = null;
  }

  setHoverTile(tile) {
    this.state.hoverTile = tile;
  }

  setPaused(value) {
    this.state.paused = value;
  }

  togglePause() {
    this.state.paused = !this.state.paused;
    return this.state.paused;
  }

  setSpeed(value) {
    this.state.speed = value;
  }

  selectTowerAt(tile) {
    if (!tile) {
      this.state.selectedTowerId = null;
      return null;
    }
    const tower = this.state.towers.find(
      (item) => item.tile.x === tile.x && item.tile.y === tile.y
    );
    this.state.selectedTowerId = tower ? tower.id : null;
    return tower || null;
  }

  getTowerAt(tile) {
    if (!tile) return null;
    return this.state.towers.find(
      (item) => item.tile.x === tile.x && item.tile.y === tile.y
    ) || null;
  }

  getSelectedTower() {
    return this.state.towers.find((tower) => tower.id === this.state.selectedTowerId);
  }

  canPlaceTower(tile) {
    if (!tile) return false;
    const key = `${tile.x},${tile.y}`;
    if (this.pathTileSet.has(key)) return false;
    if (this.blockedSet.has(key)) return false;
    return !this.state.towers.some(
      (tower) => tower.tile.x === tile.x && tower.tile.y === tile.y
    );
  }

  placeTower(tile, type) {
    if (!this.state.buildMode && !type) return { ok: false, reason: "请先选择防御塔。" };
    const towerType = type || this.state.buildMode;
    const stats = towerTypes[towerType];
    if (!stats) return { ok: false, reason: "未知防御塔。" };
    if (!this.canPlaceTower(tile)) return { ok: false, reason: "此处无法建造。" };
    if (this.state.gold < stats.cost) return { ok: false, reason: "金币不足。" };

    const pos = this.gridToWorld(tile);
    const tower = {
      id: this.towerId += 1,
      type: towerType,
      level: 1,
      tile: { ...tile },
      x: pos.x,
      y: pos.y,
      cooldown: 0,
      costSpent: stats.cost
    };
    this.state.towers.push(tower);
    this.state.gold -= stats.cost;
    this.audio.beep({ frequency: 520, duration: 0.08 });
    if (this.callbacks.onGoldChange) this.callbacks.onGoldChange(this.state.gold);
    return { ok: true, tower };
  }

  getUpgradeCost(tower) {
    const base = towerTypes[tower.type].cost;
    return Math.round(base * (0.9 + tower.level * 0.8));
  }

  getSellValue(tower) {
    return Math.round(tower.costSpent * 0.7);
  }

  upgradeSelected() {
    const tower = this.getSelectedTower();
    if (!tower) return { ok: false, reason: "未选择防御塔。" };
    const cost = this.getUpgradeCost(tower);
    if (this.state.gold < cost) return { ok: false, reason: "金币不足。" };
    tower.level += 1;
    tower.costSpent += cost;
    this.state.gold -= cost;
    this.audio.beep({ frequency: 680, duration: 0.1 });
    return { ok: true };
  }

  sellSelected() {
    const tower = this.getSelectedTower();
    if (!tower) return { ok: false, reason: "未选择防御塔。" };
    const value = this.getSellValue(tower);
    this.state.gold += value;
    this.state.towers = this.state.towers.filter((item) => item.id !== tower.id);
    this.state.selectedTowerId = null;
    this.audio.beep({ frequency: 300, duration: 0.1 });
    return { ok: true };
  }

  startWave() {
    if (this.state.waveInProgress || this.state.mode !== "playing") return false;
    if (this.state.nextWave > waves.length) {
      this.state.mode = "victory";
      return false;
    }
    this.state.waveInProgress = true;
    this.state.activeWave = this.state.nextWave;
    this.state.spawnTimer = 0;
    this.state.spawnedCount = 0;
    this.state.autoWaveTimer = 0;
    this.audio.beep({ frequency: 240, duration: 0.12 });
    return true;
  }

  spawnEnemy() {
    const wave = waves[this.state.activeWave - 1];
    const start = this.pathPixels[0];
    this.state.enemies.push({
      id: this.enemyId += 1,
      x: start.x,
      y: start.y,
      pathIndex: 0,
      hp: wave.hp,
      maxHp: wave.hp,
      speed: wave.speed * this.dimensions.tileSize,
      reward: wave.reward,
      slowTimer: 0,
      slowFactor: 1,
      damage: 1
    });
  }

  updateEnemy(enemy, dt) {
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
      if (enemy.slowTimer <= 0) {
        enemy.slowTimer = 0;
        enemy.slowFactor = 1;
      }
    }
    // 中毒持续伤害
    if (enemy.poisonTimer > 0) {
      enemy.poisonTimer -= dt;
      enemy.hp -= (enemy.poisonDamage || 0) * dt;
      if (enemy.poisonTimer <= 0) {
        enemy.poisonTimer = 0;
        enemy.poisonDamage = 0;
      }
    }
    let speed = enemy.speed * enemy.slowFactor;
    let remaining = speed * dt;
    while (remaining > 0) {
      const nextPoint = this.pathPixels[enemy.pathIndex + 1];
      if (!nextPoint) {
        this.state.baseHp -= enemy.damage;
        return "reached";
      }
      const dx = nextPoint.x - enemy.x;
      const dy = nextPoint.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        enemy.x = nextPoint.x;
        enemy.y = nextPoint.y;
        enemy.pathIndex += 1;
        remaining -= dist;
      } else {
        enemy.x += (dx / dist) * remaining;
        enemy.y += (dy / dist) * remaining;
        remaining = 0;
      }
    }
    return null;
  }

  getTowerStats(tower) {
    const base = towerTypes[tower.type];
    const levelBonus = 1 + (tower.level - 1) * 0.25;
    return {
      range: (base.range + (tower.level - 1) * 0.15) * this.dimensions.tileSize,
      fireRate: Math.max(0.4, base.fireRate - (tower.level - 1) * 0.08),
      damage: Math.round(base.damage * levelBonus),
      projectileSpeed: base.projectileSpeed * this.dimensions.tileSize,
      slowFactor: base.slowFactor,
      slowDuration: base.slowDuration,
      splashRadius: base.splashRadius ? base.splashRadius * this.dimensions.tileSize : 0,
      chainCount: base.chainCount ? base.chainCount + Math.floor((tower.level - 1) / 2) : 0,
      chainRange: base.chainRange,
      poisonDamage: base.poisonDamage ? Math.round(base.poisonDamage * levelBonus) : 0,
      poisonDuration: base.poisonDuration || 0
    };
  }

  updateTowers(dt) {
    for (const tower of this.state.towers) {
      tower.cooldown = Math.max(0, tower.cooldown - dt);
      if (tower.cooldown > 0) continue;
      const stats = this.getTowerStats(tower);
      const target = this.findNearestEnemy(tower, stats.range);
      if (!target) continue;
      tower.cooldown = stats.fireRate;
      this.fireProjectile(tower, target, stats);
    }
  }

  findNearestEnemy(tower, range) {
    let nearest = null;
    let bestDist = Infinity;
    for (const enemy of this.state.enemies) {
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= range && dist < bestDist) {
        bestDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  fireProjectile(tower, enemy, stats) {
    this.state.projectiles.push({
      id: this.projectileId += 1,
      x: tower.x,
      y: tower.y,
      targetId: enemy.id,
      speed: stats.projectileSpeed,
      damage: stats.damage,
      slowFactor: stats.slowFactor,
      slowDuration: stats.slowDuration,
      splashRadius: stats.splashRadius,
      chainCount: stats.chainCount,
      chainRange: stats.chainRange,
      poisonDamage: stats.poisonDamage,
      poisonDuration: stats.poisonDuration,
      type: tower.type
    });
    this.audio.beep({ frequency: 780, duration: 0.05, gain: 0.04 });
  }

  updateProjectiles(dt) {
    const remaining = [];
    for (const proj of this.state.projectiles) {
      const target = this.state.enemies.find((enemy) => enemy.id === proj.targetId);
      if (!target) continue;
      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.hypot(dx, dy);
      const step = proj.speed * dt;
      if (dist <= step) {
        this.applyProjectileHit(proj, target);
        continue;
      }
      proj.x += (dx / dist) * step;
      proj.y += (dy / dist) * step;
      remaining.push(proj);
    }
    this.state.projectiles = remaining;
  }

  applyProjectileHit(proj, target) {
    const splashRadius = proj.splashRadius || 0;

    // 闪电链击
    if (proj.type === 'lightning' && proj.chainCount) {
      this.damageEnemy(target, proj);
      this.state.effects.push({ x: target.x, y: target.y, radius: this.dimensions.tileSize * 0.2, ttl: 0.3, type: 'lightning' });

      const chainRange = (proj.chainRange || 1.5) * this.dimensions.tileSize;
      let lastEnemy = target;
      let chainedIds = new Set([target.id]);
      for (let c = 0; c < proj.chainCount; c++) {
        let nearest = null;
        let bestDist = Infinity;
        for (const enemy of this.state.enemies) {
          if (chainedIds.has(enemy.id) || enemy.hp <= 0) continue;
          const dist = Math.hypot(enemy.x - lastEnemy.x, enemy.y - lastEnemy.y);
          if (dist <= chainRange && dist < bestDist) {
            bestDist = dist;
            nearest = enemy;
          }
        }
        if (!nearest) break;
        chainedIds.add(nearest.id);
        const chainDmg = Math.round(proj.damage * 0.7);
        nearest.hp -= chainDmg;
        this.state.effects.push({
          x: nearest.x, y: nearest.y, radius: this.dimensions.tileSize * 0.15, ttl: 0.2, type: 'lightning',
          lineFrom: { x: lastEnemy.x, y: lastEnemy.y }
        });
        lastEnemy = nearest;
      }
    } else if (splashRadius > 0) {
      for (const enemy of this.state.enemies) {
        const dist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
        if (dist <= splashRadius) {
          this.damageEnemy(enemy, proj);
        }
      }
      this.state.effects.push({ x: target.x, y: target.y, radius: splashRadius, ttl: 0.25 });
    } else {
      this.damageEnemy(target, proj);
      this.state.effects.push({ x: target.x, y: target.y, radius: this.dimensions.tileSize * 0.15, ttl: 0.25 });
    }
  }

  damageEnemy(enemy, proj) {
    enemy.hp -= proj.damage;
    if (proj.slowFactor && proj.slowDuration) {
      enemy.slowFactor = Math.min(enemy.slowFactor, proj.slowFactor);
      enemy.slowTimer = Math.max(enemy.slowTimer, proj.slowDuration);
    }
    // 中毒效果
    if (proj.poisonDamage && proj.poisonDuration) {
      enemy.poisonDamage = proj.poisonDamage;
      enemy.poisonTimer = proj.poisonDuration;
    }
  }

  updateEffects(dt) {
    this.state.effects = this.state.effects
      .map((effect) => ({ ...effect, ttl: effect.ttl - dt }))
      .filter((effect) => effect.ttl > 0);
  }

  updateWave(dt) {
    if (!this.state.waveInProgress) return;
    const wave = waves[this.state.activeWave - 1];
    this.state.spawnTimer += dt;
    while (
      this.state.spawnedCount < wave.count &&
      this.state.spawnTimer >= wave.spawnInterval
    ) {
      this.spawnEnemy();
      this.state.spawnedCount += 1;
      this.state.spawnTimer -= wave.spawnInterval;
    }
    if (this.state.spawnedCount >= wave.count && this.state.enemies.length === 0) {
      this.state.waveInProgress = false;
      this.state.activeWave = null;
      this.state.nextWave += 1;
      if (this.callbacks.onWaveComplete) {
        this.callbacks.onWaveComplete(this.state.nextWave - 1);
      }
      if (this.state.nextWave > waves.length) {
        this.state.mode = "victory";
        if (this.callbacks.onVictory) this.callbacks.onVictory();
      } else {
        this.state.autoWaveTimer = 3;
      }
    }
  }

  update(dt) {
    if (this.state.mode !== "playing") return;
    if (this.state.paused) return;
    const scaledDt = dt * this.state.speed;

    this.updateWave(scaledDt);

    if (!this.state.waveInProgress && this.state.autoWaveTimer > 0) {
      this.state.autoWaveTimer = Math.max(0, this.state.autoWaveTimer - dt);
      if (this.state.autoWaveTimer === 0) {
        this.startWave();
      }
    }

    const enemiesRemaining = [];
    for (const enemy of this.state.enemies) {
      const status = this.updateEnemy(enemy, scaledDt);
      if (status === "reached") {
        continue;
      }
      if (enemy.hp <= 0) {
        this.state.gold += enemy.reward;
        this.audio.beep({ frequency: 360, duration: 0.06, gain: 0.03 });
        continue;
      }
      enemiesRemaining.push(enemy);
    }
    this.state.enemies = enemiesRemaining;

    this.updateTowers(scaledDt);
    this.updateProjectiles(scaledDt);
    this.updateEffects(scaledDt);

    if (this.state.baseHp <= 0 && this.state.mode === "playing") {
      this.state.mode = "gameover";
      this.state.waveInProgress = false;
      if (this.callbacks.onGameOver) this.callbacks.onGameOver();
    }
  }

  renderBackground() {
    const { ctx } = this;
    const { viewWidth, viewHeight } = this.dimensions;
    ctx.fillStyle = "#5a8c45";
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 120; i += 1) {
      const x = (i * 73) % viewWidth;
      const y = (i * 41) % viewHeight;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  renderPath() {
    const { ctx } = this;
    const { tileSize, origin } = this.dimensions;
    ctx.fillStyle = "#d6bb8a";
    for (const tile of this.pathTiles) {
      const x = origin.x + tile.x * tileSize;
      const y = origin.y + tile.y * tileSize;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
    ctx.strokeStyle = "#b48a5a";
    ctx.lineWidth = 2;
    for (const tile of this.pathTiles) {
      const x = origin.x + tile.x * tileSize;
      const y = origin.y + tile.y * tileSize;
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  renderDecor() {
    const { ctx } = this;
    const { tileSize, origin } = this.dimensions;
    for (const decor of this.map.decor) {
      const x = origin.x + decor.x * tileSize + tileSize * 0.5;
      const y = origin.y + decor.y * tileSize + tileSize * 0.5;
      if (decor.type === "tree") {
        ctx.fillStyle = "#2c5a2f";
        ctx.beginPath();
        ctx.arc(x, y - 6, tileSize * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3c2a1a";
        ctx.fillRect(x - 4, y + 6, 8, 12);
      } else {
        ctx.fillStyle = "#8b7b6a";
        ctx.beginPath();
        ctx.moveTo(x - 14, y + 6);
        ctx.lineTo(x - 4, y - 10);
        ctx.lineTo(x + 16, y - 2);
        ctx.lineTo(x + 10, y + 12);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  renderBase() {
    const { ctx } = this;
    const base = this.basePixel;
    ctx.fillStyle = "#b38552";
    ctx.fillRect(base.x - 20, base.y - 18, 40, 28);
    ctx.fillStyle = "#7a4b2b";
    ctx.fillRect(base.x - 22, base.y - 24, 44, 10);
    ctx.fillStyle = "#d1c7b2";
    ctx.fillRect(base.x - 8, base.y - 8, 16, 18);
  }

  renderTowers() {
    const { ctx } = this;
    for (const tower of this.state.towers) {
      const base = towerTypes[tower.type];
      const size = this.dimensions.tileSize;
      if (tower.type === "gun") {
        ctx.fillStyle = base.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, size * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3b2a1a";
        ctx.fillRect(tower.x - 6, tower.y - 18, 12, 18);
        ctx.fillStyle = "#efddb3";
        ctx.fillRect(tower.x - 10, tower.y - 24, 20, 8);
      } else if (tower.type === "slow") {
        ctx.fillStyle = "#3a5f73";
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, size * 0.26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = base.color;
        ctx.beginPath();
        ctx.moveTo(tower.x, tower.y - size * 0.32);
        ctx.lineTo(tower.x + size * 0.2, tower.y + size * 0.18);
        ctx.lineTo(tower.x - size * 0.2, tower.y + size * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#d9f4ff";
        ctx.beginPath();
        ctx.arc(tower.x, tower.y - size * 0.05, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (tower.type === "blast") {
        ctx.fillStyle = "#5f3b24";
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = base.color;
        ctx.fillRect(tower.x - size * 0.16, tower.y - size * 0.24, size * 0.32, size * 0.18);
        ctx.fillStyle = "#2b1c12";
        ctx.fillRect(tower.x + size * 0.08, tower.y - size * 0.18, size * 0.18, size * 0.08);
      }

      if (tower.id === this.state.selectedTowerId) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, this.dimensions.tileSize * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = "#2b1d0f";
      for (let i = 0; i < tower.level; i += 1) {
        ctx.fillRect(tower.x - 10 + i * 6, tower.y + 16, 4, 6);
      }
    }
  }

  renderEnemies() {
    const { ctx } = this;
    for (const enemy of this.state.enemies) {
      const healthRatio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = "#7a2f2f";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, this.dimensions.tileSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#3b1a12";
      ctx.fillRect(enemy.x - 16, enemy.y - 18, 32, 4);
      ctx.fillStyle = "#5fd06a";
      ctx.fillRect(enemy.x - 16, enemy.y - 18, 32 * healthRatio, 4);
      if (enemy.slowFactor < 1) {
        ctx.strokeStyle = "rgba(140, 210, 240, 0.8)";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, this.dimensions.tileSize * 0.24, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  renderProjectiles() {
    const { ctx } = this;
    for (const proj of this.state.projectiles) {
      ctx.fillStyle = proj.type === "slow" ? "#b8e0ef" : "#fff0a8";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, this.dimensions.tileSize * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderEffects() {
    const { ctx } = this;
    for (const effect of this.state.effects) {
      const alpha = effect.ttl / 0.25;
      ctx.strokeStyle = `rgba(255, 240, 180, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 + (1 - alpha) * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderHover() {
    const { ctx } = this;
    if (!this.state.buildMode || !this.state.hoverTile) return;
    const tile = this.state.hoverTile;
    const { tileSize, origin } = this.dimensions;
    const x = origin.x + tile.x * tileSize;
    const y = origin.y + tile.y * tileSize;
    const canPlace = this.canPlaceTower(tile);
    ctx.fillStyle = canPlace ? "rgba(114, 190, 108, 0.35)" : "rgba(200, 80, 80, 0.35)";
    ctx.fillRect(x, y, tileSize, tileSize);
    const towerStats = towerTypes[this.state.buildMode];
    if (towerStats) {
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        x + tileSize / 2,
        y + tileSize / 2,
        (towerStats.range + 0.05) * tileSize,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  }

  renderSelectedRange() {
    const tower = this.getSelectedTower();
    if (!tower) return;
    const stats = this.getTowerStats(tower);
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  render() {
    this.renderBackground();
    this.renderPath();
    this.renderDecor();
    this.renderBase();
    this.renderHover();
    this.renderSelectedRange();
    this.renderProjectiles();
    this.renderEnemies();
    this.renderTowers();
    this.renderEffects();
  }

  loop(timestamp) {
    if (!this.running) return;
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.update(delta);
    this.render();
    requestAnimationFrame((time) => this.loop(time));
  }

  run() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame((time) => this.loop(time));
  }

  stop() {
    this.running = false;
  }

  getUIState() {
    return {
      mode: this.state.mode,
      mapIndex: this.state.mapIndex,
      gold: this.state.gold,
      baseHp: this.state.baseHp,
      nextWave: this.state.nextWave,
      activeWave: this.state.activeWave,
      waveInProgress: this.state.waveInProgress,
      buildMode: this.state.buildMode,
      selectedTowerId: this.state.selectedTowerId,
      autoWaveTimer: this.state.autoWaveTimer,
      paused: this.state.paused,
      speed: this.state.speed,
      soundOn: this.state.soundOn,
      towerTypes,
      towers: this.state.towers.map((tower) => ({
        id: tower.id,
        type: tower.type,
        level: tower.level,
        tile: tower.tile
      }))
    };
  }
}

export function attachDebugHooks(game) {
  window.render_game_to_text = () => {
    const state = game.state;
    const payload = {
      mode: state.mode,
      map: maps[state.mapIndex].id,
      gold: state.gold,
      baseHp: state.baseHp,
      nextWave: state.nextWave,
      activeWave: state.activeWave,
      waveInProgress: state.waveInProgress,
      speed: state.speed,
      paused: state.paused,
      buildMode: state.buildMode,
      autoWaveTimer: state.autoWaveTimer,
      selectedTowerId: state.selectedTowerId,
      coordSystem: "Origin at canvas top-left, x right, y down. Tiles in grid coordinates.",
      board: {
        cols: game.map.grid.cols,
        rows: game.map.grid.rows,
        tileSize: game.dimensions.tileSize,
        origin: game.dimensions.origin
      },
      towers: state.towers.map((tower) => ({
        id: tower.id,
        type: tower.type,
        level: tower.level,
        tile: tower.tile
      })),
      enemies: state.enemies.map((enemy) => ({
        id: enemy.id,
        x: Math.round(enemy.x),
        y: Math.round(enemy.y),
        hp: Math.round(enemy.hp)
      })),
      projectiles: state.projectiles.map((proj) => ({
        id: proj.id,
        x: Math.round(proj.x),
        y: Math.round(proj.y)
      }))
    };
    return JSON.stringify(payload);
  };

  window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) {
      game.update(1 / 60);
    }
    game.render();
  };
}

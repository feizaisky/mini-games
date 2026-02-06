const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('bestScore');
const healthEl = document.getElementById('health');
const stageEl = document.getElementById('stage');
const modeDetailEl = document.getElementById('modeDetail');
const objectiveEl = document.getElementById('objectiveText');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const GAME_ID = 'airplane-shooter';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`
};

const FORMATIONS = ['v', 'line', 'pincer'];
const state = {
    mode: 'idle',
    score: 0,
    best: parseInt(localStorage.getItem(STORAGE_KEYS.best) || '0', 10),
    health: 5,
    stage: 1,
    elapsed: 0,
    player: {
        x: canvas.width / 2,
        y: canvas.height - 80,
        width: 42,
        height: 46,
        speed: 320,
        invincible: 0
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    powerups: [],
    particles: [],
    floatTexts: [],
    shake: 0,
    flash: 0,
    bossBanner: 0,
    combo: 0,
    comboTimer: 0,
    lastSpawn: 0,
    lastShot: 0,
    difficultyTimer: 0,
    formationCooldown: 0,
    lastTs: 0,
    leftPressed: false,
    rightPressed: false,
    bossCooldown: 20,
    isBossWave: false,
    shieldTimer: 0,
    missions: {
        formationClears: 0,
        powerupsCollected: 0,
        phase2Reached: false
    }
};

bestEl.textContent = String(state.best);

function saveBest() {
    if (state.score > state.best) {
        state.best = state.score;
        localStorage.setItem(STORAGE_KEYS.best, String(state.best));
        bestEl.textContent = String(state.best);
    }
}

function resetGame() {
    state.mode = 'idle';
    state.score = 0;
    state.health = 5;
    state.stage = 1;
    state.elapsed = 0;
    state.player.x = canvas.width / 2;
    state.player.invincible = 0;
    state.bullets = [];
    state.enemies = [];
    state.enemyBullets = [];
    state.powerups = [];
    state.particles = [];
    state.floatTexts = [];
    state.shake = 0;
    state.flash = 0;
    state.bossBanner = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.lastSpawn = 0;
    state.lastShot = 0;
    state.difficultyTimer = 0;
    state.formationCooldown = 0;
    state.bossCooldown = 20;
    state.isBossWave = false;
    state.shieldTimer = 0;
    state.missions.formationClears = 0;
    state.missions.powerupsCollected = 0;
    state.missions.phase2Reached = false;
    updateHud();
    render();
}

function startGame() {
    if (state.mode === 'playing') return;
    if (state.mode === 'gameover') resetGame();
    state.mode = 'playing';
    state.lastTs = performance.now();
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ mode: state.mode, updatedAt: Date.now() }));
}

function getBossPhase() {
    const boss = state.enemies.find((e) => e.type === 'boss');
    return boss ? `phase${boss.phase}` : 'none';
}

function updateHud() {
    scoreEl.textContent = String(state.score);
    healthEl.textContent = String(state.health);
    stageEl.textContent = String(state.stage);
    const phase = getBossPhase();
    modeDetailEl.textContent = phase === 'none' ? (state.shieldTimer > 0 ? '护盾中' : '常规波次') : `Boss ${phase}`;
    objectiveEl.textContent = `编队:${state.missions.formationClears}/3 补给:${state.missions.powerupsCollected}/2 P2:${state.missions.phase2Reached ? '完成' : '未达成'}`;
}

function spawnSingleEnemy(isElite) {
    state.enemies.push({
        type: isElite ? 'elite' : 'normal',
        x: 30 + Math.random() * (canvas.width - 60),
        y: -40,
        width: isElite ? 38 : 30,
        height: isElite ? 38 : 30,
        hp: isElite ? 4 + Math.floor(state.stage / 2) : 1,
        speed: (isElite ? 78 : 96) + state.stage * 10,
        fireTimer: Math.random() * 1.3,
        formationId: null
    });
}

function spawnFormation() {
    const formation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
    const fid = Date.now() + '-' + Math.floor(Math.random() * 1000);
    const baseY = -40;
    const centerX = 70 + Math.random() * (canvas.width - 140);
    const points = [];

    if (formation === 'line') {
        for (let i = -2; i <= 2; i++) points.push({ x: centerX + i * 40, y: baseY - Math.abs(i) * 6 });
    } else if (formation === 'v') {
        points.push({ x: centerX, y: baseY - 20 });
        points.push({ x: centerX - 34, y: baseY + 5 });
        points.push({ x: centerX + 34, y: baseY + 5 });
        points.push({ x: centerX - 68, y: baseY + 25 });
        points.push({ x: centerX + 68, y: baseY + 25 });
    } else {
        points.push({ x: centerX - 120, y: baseY + 10 });
        points.push({ x: centerX + 120, y: baseY + 10 });
        points.push({ x: centerX - 70, y: baseY - 14 });
        points.push({ x: centerX + 70, y: baseY - 14 });
        points.push({ x: centerX, y: baseY - 28 });
    }

    points.forEach((p, idx) => {
        state.enemies.push({
            type: idx === 0 ? 'elite' : 'normal',
            x: Math.max(24, Math.min(canvas.width - 24, p.x)),
            y: p.y,
            width: idx === 0 ? 36 : 30,
            height: idx === 0 ? 36 : 30,
            hp: idx === 0 ? 4 + Math.floor(state.stage / 2) : 1,
            speed: 80 + state.stage * 8,
            fireTimer: Math.random() * 1.2,
            formationId: fid
        });
    });
    createFloatText('编队来袭', centerX - 38, 86, '#d6ecff');
}

function spawnBoss() {
    const maxHp = 52 + state.stage * 10;
    state.isBossWave = true;
    state.bossBanner = 2.2;
    state.enemies.push({
        type: 'boss',
        x: canvas.width / 2,
        y: -82,
        width: 122,
        height: 70,
        hp: maxHp,
        maxHp,
        speed: 40 + state.stage * 4,
        fireTimer: 0,
        phase: 1,
        lateralDir: 1,
        formationId: null
    });
    if (typeof GameAudio !== 'undefined') GameAudio.play('powerup');
}

function spawnEnemy(dt) {
    const spawnInterval = Math.max(0.42, 1.15 - (state.stage - 1) * 0.09);
    state.lastSpawn += dt;
    if (state.lastSpawn < spawnInterval) return;
    state.lastSpawn = 0;

    if (state.bossCooldown <= 0 && !state.isBossWave) {
        spawnBoss();
        return;
    }

    state.formationCooldown -= 1;
    if (state.formationCooldown <= 0 && Math.random() < 0.36) {
        spawnFormation();
        state.formationCooldown = 4;
    } else {
        const isElite = Math.random() < Math.min(0.28, 0.09 + state.stage * 0.03);
        spawnSingleEnemy(isElite);
    }

    state.bossCooldown -= 1;
}

function shootPlayerBullet(dt) {
    const interval = Math.max(0.11, 0.19 - state.stage * 0.008);
    state.lastShot += dt;
    if (state.lastShot < interval) return;
    state.lastShot = 0;
    state.bullets.push({ x: state.player.x, y: state.player.y - 26, radius: 4, vy: -560 });
}

function createExplosion(x, y, color, amount) {
    for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 220;
        state.particles.push({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: 0.45 + Math.random() * 0.35,
            color,
            size: 1.5 + Math.random() * 2.6
        });
    }
}

function createFloatText(text, x, y, color) {
    state.floatTexts.push({ text, x, y, vy: -26, life: 0.8, color });
}

function maybeDropPowerup(enemy) {
    if (enemy.type !== 'elite') return;
    if (Math.random() > 0.35) return;
    const type = Math.random() < 0.5 ? 'heal' : 'shield';
    state.powerups.push({ x: enemy.x, y: enemy.y, vy: 130, r: 10, type, life: 8 });
}

function checkFormationClear(formationId) {
    if (!formationId) return;
    const alive = state.enemies.some((e) => e.formationId === formationId);
    if (!alive) {
        state.score += 40;
        state.missions.formationClears += 1;
        createFloatText('编队歼灭 +40', 156, 104, '#ffe29a');
    }
}

function hitEnemy(enemy, bulletIndex) {
    enemy.hp -= 1;
    state.bullets.splice(bulletIndex, 1);
    state.shake = Math.max(state.shake, enemy.type === 'boss' ? 5 : 2.2);
    createExplosion(enemy.x, enemy.y, enemy.type === 'boss' ? '#ff7a88' : '#8dc8ff', enemy.type === 'boss' ? 12 : 6);

    if (enemy.type === 'boss' && enemy.phase === 1 && enemy.hp <= enemy.maxHp * 0.45) {
        enemy.phase = 2;
        enemy.speed += 42;
        enemy.fireTimer = 0;
        state.flash = 0.24;
        state.missions.phase2Reached = true;
        createFloatText('Boss Phase 2!', enemy.x - 40, enemy.y - 26, '#ffd1dc');
    }

    if (enemy.hp > 0) return false;

    let add = 10;
    if (enemy.type === 'elite') add = 50;
    if (enemy.type === 'boss') {
        add = enemy.phase === 2 ? 360 : 300;
        state.isBossWave = false;
        state.bossCooldown = Math.max(12, 20 - state.stage);
        state.bossBanner = 1.5;
        createFloatText('Boss 击破', enemy.x - 34, enemy.y - 10, '#ffe6ee');
    }

    maybeDropPowerup(enemy);
    state.score += add;
    state.combo += 1;
    state.comboTimer = 2.5;
    createFloatText(`+${add}`, enemy.x, enemy.y, '#ffe36d');
    if (state.combo >= 3) {
        createFloatText(`${state.combo}连杀`, enemy.x + 12, enemy.y - 20, '#fff7a5');
    }

    checkFormationClear(enemy.formationId);

    if (typeof GameAudio !== 'undefined') GameAudio.play('hit');
    return true;
}

function takeDamage() {
    if (state.player.invincible > 0 || state.mode !== 'playing') return;
    if (state.shieldTimer > 0) {
        state.shieldTimer = Math.max(0, state.shieldTimer - 1.2);
        state.flash = 0.12;
        state.shake = 3;
        createFloatText('护盾吸收', state.player.x - 20, state.player.y - 32, '#9de5ff');
        return;
    }

    state.health -= 1;
    state.flash = 0.25;
    state.shake = 5;
    state.combo = 0;
    state.comboTimer = 0;
    state.player.invincible = 1.0;
    createExplosion(state.player.x, state.player.y, '#ffd4da', 16);
    if (typeof GameAudio !== 'undefined') GameAudio.play('fail');
    if (state.health <= 0) {
        state.mode = 'gameover';
        saveBest();
        if (typeof Celebration !== 'undefined' && state.score >= state.best && state.best > 0) {
            Celebration.fire();
        }
    }
}

function updatePowerups(dt) {
    for (let i = state.powerups.length - 1; i >= 0; i--) {
        const p = state.powerups[i];
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0 || p.y > canvas.height + 30) {
            state.powerups.splice(i, 1);
            continue;
        }

        const dx = Math.abs(p.x - state.player.x);
        const dy = Math.abs(p.y - state.player.y);
        if (dx < state.player.width * 0.5 && dy < state.player.height * 0.55) {
            state.missions.powerupsCollected += 1;
            if (p.type === 'heal') {
                state.health = Math.min(8, state.health + 1);
                createFloatText('+1 生命', p.x - 18, p.y - 8, '#9dffb0');
            } else {
                state.shieldTimer = Math.min(8, state.shieldTimer + 4);
                createFloatText('护盾启动', p.x - 20, p.y - 8, '#97e6ff');
            }
            state.score += 20;
            createExplosion(p.x, p.y, '#baf8ff', 10);
            state.powerups.splice(i, 1);
            if (typeof GameAudio !== 'undefined') GameAudio.play('powerup');
        }
    }
}

function updateBossMovement(enemy, dt) {
    if (enemy.type !== 'boss') return;
    const sideRange = 130;
    const targetX = canvas.width / 2 + sideRange * Math.sin(state.elapsed * (enemy.phase === 2 ? 1.8 : 1.1));
    enemy.x += (targetX - enemy.x) * Math.min(1, dt * (enemy.phase === 2 ? 5 : 3));
}

function update(dt) {
    if (state.mode !== 'playing') return;

    state.elapsed += dt;
    state.difficultyTimer += dt;
    if (state.difficultyTimer >= 30) {
        state.difficultyTimer = 0;
        state.stage += 1;
        createFloatText(`难度 ${state.stage}`, canvas.width / 2 - 30, 120, '#9dd7ff');
    }

    const move = (state.rightPressed ? 1 : 0) - (state.leftPressed ? 1 : 0);
    state.player.x += move * state.player.speed * dt;
    state.player.x = Math.max(state.player.width / 2 + 12, Math.min(canvas.width - state.player.width / 2 - 12, state.player.x));
    state.player.invincible = Math.max(0, state.player.invincible - dt);
    state.shieldTimer = Math.max(0, state.shieldTimer - dt);

    shootPlayerBullet(dt);
    spawnEnemy(dt);

    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.y += b.vy * dt;
        if (b.y < -20) state.bullets.splice(i, 1);
    }

    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
        const b = state.enemyBullets[i];
        b.y += b.vy * dt;
        if (b.y > canvas.height + 20) {
            state.enemyBullets.splice(i, 1);
            continue;
        }
        const dx = Math.abs(b.x - state.player.x);
        const dy = Math.abs(b.y - state.player.y);
        if (dx < state.player.width * 0.45 && dy < state.player.height * 0.45) {
            state.enemyBullets.splice(i, 1);
            takeDamage();
        }
    }

    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        e.y += e.speed * dt;
        e.fireTimer += dt;
        updateBossMovement(e, dt);

        const fireInterval = e.type === 'boss' ? (e.phase === 2 ? 0.22 : 0.42) : (e.type === 'elite' ? 1.05 : 2.2);
        if (e.fireTimer >= fireInterval) {
            e.fireTimer = 0;
            const spread = e.type === 'boss' ? (e.phase === 2 ? 64 : 36) : 8;
            const bulletCount = e.type === 'boss' && e.phase === 2 ? 2 : 1;
            for (let s = 0; s < bulletCount; s++) {
                state.enemyBullets.push({
                    x: e.x + (Math.random() - 0.5) * spread,
                    y: e.y + e.height * 0.45,
                    vy: (e.type === 'boss' ? 250 : 220) + state.stage * 15
                });
            }
        }

        if (e.y > canvas.height + 44) {
            const fid = e.formationId;
            state.enemies.splice(i, 1);
            if (e.type === 'boss') {
                state.isBossWave = false;
                state.bossCooldown = Math.max(10, 16 - state.stage);
            }
            checkFormationClear(fid);
            continue;
        }

        if (Math.abs(e.x - state.player.x) < (e.width + state.player.width) * 0.35 && Math.abs(e.y - state.player.y) < (e.height + state.player.height) * 0.35) {
            const fid = e.formationId;
            state.enemies.splice(i, 1);
            checkFormationClear(fid);
            takeDamage();
            continue;
        }

        for (let j = state.bullets.length - 1; j >= 0; j--) {
            const b = state.bullets[j];
            if (Math.abs(e.x - b.x) < e.width * 0.55 && Math.abs(e.y - b.y) < e.height * 0.55) {
                const fid = e.formationId;
                const dead = hitEnemy(e, j);
                if (dead) {
                    state.enemies.splice(i, 1);
                    checkFormationClear(fid);
                }
                break;
            }
        }
    }

    updatePowerups(dt);

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 240 * dt;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.floatTexts.length - 1; i >= 0; i--) {
        const t = state.floatTexts[i];
        t.life -= dt;
        t.y += t.vy * dt;
        if (t.life <= 0) state.floatTexts.splice(i, 1);
    }

    if (state.comboTimer > 0) state.comboTimer -= dt;
    else state.combo = 0;

    state.shake = Math.max(0, state.shake - dt * 8);
    state.flash = Math.max(0, state.flash - dt);
    state.bossBanner = Math.max(0, state.bossBanner - dt);

    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
        score: state.score,
        health: state.health,
        stage: state.stage,
        mode: state.mode,
        shieldTimer: Number(state.shieldTimer.toFixed(2)),
        updatedAt: Date.now()
    }));

    updateHud();
}

function drawPlayer() {
    const p = state.player;
    const inv = state.player.invincible > 0 ? (Math.floor(state.player.invincible * 14) % 2 === 0 ? 0.6 : 1) : 1;
    ctx.save();
    ctx.globalAlpha = inv;
    if (state.shieldTimer > 0) {
        ctx.fillStyle = 'rgba(138, 232, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#8fd0ff';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 22);
    ctx.lineTo(p.x - 18, p.y + 20);
    ctx.lineTo(p.x + 18, p.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a7fd8';
    ctx.fillRect(p.x - 5, p.y - 12, 10, 30);
    ctx.fillStyle = '#ffd16f';
    ctx.fillRect(p.x - 4, p.y + 19, 8, 9);
    ctx.restore();
}

function drawEnemy(e) {
    if (e.type === 'boss') {
        ctx.fillStyle = e.phase === 2 ? '#b41d45' : '#8f2038';
        ctx.fillRect(e.x - e.width / 2, e.y - e.height / 2, e.width, e.height);
        ctx.fillStyle = e.phase === 2 ? '#ff89a4' : '#ff6987';
        ctx.fillRect(e.x - e.width / 2 + 8, e.y - e.height / 2 + 8, e.width - 16, 16);
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x - 44, e.y - 9, 88, 9);
        ctx.fillStyle = '#ff8a9f';
        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillRect(e.x - 44, e.y - 9, 88 * hpRatio, 9);
        return;
    }

    ctx.fillStyle = e.type === 'elite' ? '#ffb347' : '#f16f7a';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + e.height / 2);
    ctx.lineTo(e.x - e.width / 2, e.y - e.height / 2);
    ctx.lineTo(e.x + e.width / 2, e.y - e.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffdce0';
    ctx.fillRect(e.x - 3, e.y - 4, 6, 12);
}

function drawPowerup(p) {
    ctx.fillStyle = p.type === 'heal' ? '#9dffb2' : '#9ce5ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#113149';
    ctx.font = 'bold 10px Trebuchet MS';
    ctx.fillText(p.type === 'heal' ? 'HP' : 'SD', p.x - 10, p.y + 3);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;
    const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;
    ctx.save();
    ctx.translate(sx, sy);

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#11284c');
    grad.addColorStop(1, '#081126');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 45; i++) {
        const t = (i * 37 + state.elapsed * 28) % canvas.height;
        const x = (i * 83) % canvas.width;
        ctx.fillStyle = 'rgba(166, 206, 255, 0.22)';
        ctx.fillRect(x, t, 2, 2);
    }

    state.bullets.forEach((b) => {
        ctx.fillStyle = '#83d9ff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    state.enemyBullets.forEach((b) => {
        ctx.fillStyle = '#ff8ea0';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
    });

    state.enemies.forEach(drawEnemy);
    state.powerups.forEach(drawPowerup);
    drawPlayer();

    state.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life * 1.4);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    });

    state.floatTexts.forEach((t) => {
        ctx.globalAlpha = Math.max(0, t.life / 0.8);
        ctx.fillStyle = t.color;
        ctx.font = 'bold 16px Trebuchet MS';
        ctx.fillText(t.text, t.x, t.y);
        ctx.globalAlpha = 1;
    });

    if (state.combo >= 3 && state.mode === 'playing') {
        ctx.fillStyle = 'rgba(255, 240, 150, 0.95)';
        ctx.font = 'bold 20px Trebuchet MS';
        ctx.fillText(`${state.combo} 连杀`, canvas.width - 120, 38);
    }

    if (state.bossBanner > 0 && state.isBossWave) {
        ctx.fillStyle = `rgba(255, 90, 120, ${Math.min(0.85, state.bossBanner)})`;
        ctx.fillRect(0, 82, canvas.width, 38);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Trebuchet MS';
        ctx.fillText('Boss Incoming', 150, 108);
    }

    if (state.mode === 'idle') drawCenterText('点击开始游戏', '#cbe6ff');
    else if (state.mode === 'gameover') drawCenterText(`游戏结束  得分 ${state.score}`, '#ffd7de');

    if (state.flash > 0) {
        ctx.fillStyle = `rgba(255, 240, 245, ${state.flash * 0.65})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
}

function drawCenterText(text, color) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fillRect(95, canvas.height / 2 - 36, canvas.width - 190, 72);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(95, canvas.height / 2 - 36, canvas.width - 190, 72);
    ctx.fillStyle = color;
    ctx.font = 'bold 24px Trebuchet MS';
    ctx.fillText(text, 125, canvas.height / 2 + 10);
}

function loop(ts) {
    const dt = Math.min(0.04, (ts - state.lastTs) / 1000 || 0.016);
    state.lastTs = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.leftPressed = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.rightPressed = true;
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.leftPressed = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.rightPressed = false;
}

function bindTouchMove(btn, key) {
    const on = (ev) => {
        ev.preventDefault();
        if (key === 'left') state.leftPressed = true;
        if (key === 'right') state.rightPressed = true;
    };
    const off = (ev) => {
        ev.preventDefault();
        if (key === 'left') state.leftPressed = false;
        if (key === 'right') state.rightPressed = false;
    };
    btn.addEventListener('touchstart', on, { passive: false });
    btn.addEventListener('touchend', off, { passive: false });
    btn.addEventListener('touchcancel', off, { passive: false });
    btn.addEventListener('mousedown', on);
    btn.addEventListener('mouseup', off);
    btn.addEventListener('mouseleave', off);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
}

window.render_game_to_text = () => {
    const boss = state.enemies.find((e) => e.type === 'boss');
    return JSON.stringify({
        mode: state.mode,
        modeDetail: boss ? `boss-phase-${boss.phase}` : (state.shieldTimer > 0 ? 'shield-active' : 'wave-clear'),
        coordSystem: 'origin=(0,0) at top-left; +x right; +y down; unit=canvas pixel',
        score: state.score,
        best: state.best,
        health: state.health,
        stage: state.stage,
        player: {
            x: Math.round(state.player.x),
            y: Math.round(state.player.y),
            invincible: Number(state.player.invincible.toFixed(2)),
            shieldTimer: Number(state.shieldTimer.toFixed(2))
        },
        entities: {
            enemies: state.enemies.slice(0, 14).map((e) => ({ type: e.type, x: Math.round(e.x), y: Math.round(e.y), hp: e.hp, phase: e.phase || 0 })),
            bullets: state.bullets.slice(0, 14).map((b) => ({ x: Math.round(b.x), y: Math.round(b.y) })),
            enemyBullets: state.enemyBullets.slice(0, 14).map((b) => ({ x: Math.round(b.x), y: Math.round(b.y) }))
        },
        specialEntities: {
            powerups: state.powerups.map((p) => ({ type: p.type, x: Math.round(p.x), y: Math.round(p.y), life: Number(p.life.toFixed(2)) }))
        },
        objectives: {
            formationClears: state.missions.formationClears,
            powerupsCollected: state.missions.powerupsCollected,
            phase2Reached: state.missions.phase2Reached
        },
        timers: {
            elapsed: Number(state.elapsed.toFixed(2)),
            difficultyTimer: Number(state.difficultyTimer.toFixed(2)),
            comboTimer: Number(state.comboTimer.toFixed(2))
        },
        effects: { shake: Number(state.shake.toFixed(2)), flash: Number(state.flash.toFixed(2)), bossBanner: Number(state.bossBanner.toFixed(2)) }
    });
};

window.advanceTime = (ms) => {
    const step = 1000 / 60;
    const loops = Math.max(1, Math.round(ms / step));
    const dt = step / 1000;
    for (let i = 0; i < loops; i++) update(dt);
    render();
};

window.get_game_meta = () => JSON.stringify({
    id: GAME_ID,
    name: '飞机大战',
    version: '1.1.0',
    storageKeyBest: STORAGE_KEYS.best,
    supports: { touch: true, keyboard: true, fullscreen: true },
    contentPack: 'expansion-round-1',
    layoutPolicy: 'single-screen-enforced'
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
});
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
bindTouchMove(document.getElementById('leftBtn'), 'left');
bindTouchMove(document.getElementById('rightBtn'), 'right');

document.addEventListener('fullscreenchange', render);
window.addEventListener('beforeunload', saveBest);
window.GameLayoutFit?.bindCanvasMaxHeight({
    canvas,
    containerSelector: '.game-wrap',
    minHeight: 240,
    bottomGap: 6
});

resetGame();
requestAnimationFrame((ts) => {
    state.lastTs = ts;
    loop(ts);
});

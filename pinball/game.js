const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('bestScore');
const ballsLeftEl = document.getElementById('ballsLeft');
const multiplierEl = document.getElementById('multiplier');
const modeDetailEl = document.getElementById('modeDetail');
const objectiveEl = document.getElementById('objectiveText');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const GAME_ID = 'pinball';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`
};

const state = {
    mode: 'idle',
    score: 0,
    best: parseInt(localStorage.getItem(STORAGE_KEYS.best) || '0', 10),
    ballsLeft: 3,
    multiplier: 1,
    comboTimer: 0,
    charge: 0,
    launching: false,
    lastTs: 0,
    leftFlip: false,
    rightFlip: false,
    flash: 0,
    shake: 0,
    lightsPhase: 0,
    particles: [],
    bonusModeTimer: 0,
    bonusScoreTick: 0,
    objectives: {
        bumperStreak: 0,
        railsHitLeft: false,
        railsHitRight: false,
        missionsDone: 0
    },
    missions: [
        { id: 'bumper_chain', label: '连续命中 3 次 Bumper', target: 3, progress: 0, done: false },
        { id: 'dual_rails', label: '左右轨道各命中 1 次', target: 2, progress: 0, done: false },
        { id: 'score_rush', label: '单局达到 1200 分', target: 1200, progress: 0, done: false }
    ],
    bumpers: [
        { x: 140, y: 188, r: 22, value: 80, glow: 0 },
        { x: 260, y: 152, r: 24, value: 100, glow: 0 },
        { x: 380, y: 204, r: 22, value: 80, glow: 0 },
        { x: 260, y: 286, r: 26, value: 140, glow: 0 }
    ],
    rails: [
        { id: 'left', x: 72, y: 108, w: 28, h: 260, value: 150 },
        { id: 'right', x: 420, y: 108, w: 28, h: 260, value: 150 }
    ],
    bonusZones: [
        { x: 170, y: 330, w: 80, h: 55 },
        { x: 270, y: 330, w: 80, h: 55 }
    ],
    leftFlipper: { x: 194, y: 640, length: 96, width: 16, angle: -0.45, rest: -0.45, active: 0.48 },
    rightFlipper: { x: 326, y: 640, length: 96, width: 16, angle: Math.PI + 0.45, rest: Math.PI + 0.45, active: Math.PI - 0.48 },
    ball: { x: 468, y: 620, r: 9, vx: 0, vy: 0, live: false }
};

bestEl.textContent = String(state.best);

function saveBest() {
    if (state.score > state.best) {
        state.best = state.score;
        localStorage.setItem(STORAGE_KEYS.best, String(state.best));
        bestEl.textContent = String(state.best);
    }
}

function resetMissions() {
    state.objectives.bumperStreak = 0;
    state.objectives.railsHitLeft = false;
    state.objectives.railsHitRight = false;
    state.objectives.missionsDone = 0;
    state.missions.forEach((m) => {
        m.progress = 0;
        m.done = false;
    });
}

function resetBallToLauncher() {
    state.ball.x = 468;
    state.ball.y = 620;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.live = false;
    state.charge = 0;
    state.launching = false;
}

function resetGame() {
    state.mode = 'idle';
    state.score = 0;
    state.ballsLeft = 3;
    state.multiplier = 1;
    state.comboTimer = 0;
    state.flash = 0;
    state.shake = 0;
    state.particles = [];
    state.bonusModeTimer = 0;
    state.bonusScoreTick = 0;
    state.bumpers.forEach((b) => { b.glow = 0; });
    state.leftFlipper.angle = state.leftFlipper.rest;
    state.rightFlipper.angle = state.rightFlipper.rest;
    resetMissions();
    resetBallToLauncher();
    updateHud();
    render();
}

function startGame() {
    if (state.mode === 'gameover') resetGame();
    state.mode = 'playing';
}

function getMissionText() {
    const pending = state.missions.find((m) => !m.done);
    if (!pending) return '全部任务完成，奖励回合已激活';
    if (pending.id === 'score_rush') return `${pending.label} (${state.score}/${pending.target})`;
    return `${pending.label} (${pending.progress}/${pending.target})`;
}

function updateHud() {
    scoreEl.textContent = String(state.score);
    ballsLeftEl.textContent = String(state.ballsLeft);
    multiplierEl.textContent = `x${state.multiplier.toFixed(1)}`;
    modeDetailEl.textContent = state.bonusModeTimer > 0 ? `奖励回合 ${state.bonusModeTimer.toFixed(1)}s` : '常规模式';
    objectiveEl.textContent = getMissionText();
}

function markMission(id, value) {
    const mission = state.missions.find((m) => m.id === id);
    if (!mission || mission.done) return;
    mission.progress = Math.min(mission.target, value);
    if (mission.progress >= mission.target) {
        mission.done = true;
        state.objectives.missionsDone += 1;
        state.score += 180;
        state.flash = 0.2;
        state.shake = 4;
        addParticles(state.ball.x, state.ball.y, '#c5ffe9', 15);
        if (typeof GameAudio !== 'undefined') GameAudio.play('powerup');
    }

    if (state.missions.every((m) => m.done) && state.bonusModeTimer <= 0) {
        state.bonusModeTimer = 10;
        state.multiplier = Math.max(state.multiplier, 2.5);
        state.flash = 0.28;
        addParticles(canvas.width / 2, 250, '#95ffe1', 26);
    }
}

function addScore(base, x, y, color = '#98ffe7', eventType = 'generic') {
    const bonusFactor = state.bonusModeTimer > 0 ? 1.35 : 1;
    const gain = Math.round(base * state.multiplier * bonusFactor);
    state.score += gain;
    state.comboTimer = 3;
    state.multiplier = Math.min(4.4, state.multiplier + 0.1);
    addParticles(x, y, color, 10);
    state.shake = Math.max(state.shake, 2.8);

    if (eventType === 'bumper') {
        state.objectives.bumperStreak += 1;
        markMission('bumper_chain', state.objectives.bumperStreak);
    } else {
        state.objectives.bumperStreak = 0;
    }

    markMission('score_rush', state.score);

    if (typeof GameAudio !== 'undefined') GameAudio.play('hit');
}

function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 190;
        state.particles.push({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: 0.35 + Math.random() * 0.45,
            color,
            size: 1.5 + Math.random() * 2.8
        });
    }
}

function updateFlippers(dt) {
    const speed = 8;
    const lfTarget = state.leftFlip ? state.leftFlipper.active : state.leftFlipper.rest;
    const rfTarget = state.rightFlip ? state.rightFlipper.active : state.rightFlipper.rest;
    state.leftFlipper.angle += (lfTarget - state.leftFlipper.angle) * Math.min(1, dt * speed);
    state.rightFlipper.angle += (rfTarget - state.rightFlipper.angle) * Math.min(1, dt * speed);
}

function linePointDistance(x1, y1, x2, y2, px, py) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const len = C * C + D * D;
    const t = Math.max(0, Math.min(1, len ? dot / len : 0));
    const lx = x1 + C * t;
    const ly = y1 + D * t;
    const dx = px - lx;
    const dy = py - ly;
    return { dist: Math.hypot(dx, dy), nx: dx || 0.001, ny: dy || -1, px: lx, py: ly };
}

function reflectBall(nx, ny, boost = 0) {
    const len = Math.hypot(nx, ny) || 1;
    const nxx = nx / len;
    const nyy = ny / len;
    const dot = state.ball.vx * nxx + state.ball.vy * nyy;
    state.ball.vx -= 2 * dot * nxx;
    state.ball.vy -= 2 * dot * nyy;
    const speed = Math.hypot(state.ball.vx, state.ball.vy) + boost;
    const clamp = Math.max(180, Math.min(560, speed));
    const dirLen = Math.hypot(state.ball.vx, state.ball.vy) || 1;
    state.ball.vx = (state.ball.vx / dirLen) * clamp;
    state.ball.vy = (state.ball.vy / dirLen) * clamp;
}

function collideFlipper(flip, activeBoost) {
    const ex = flip.x + Math.cos(flip.angle) * flip.length;
    const ey = flip.y + Math.sin(flip.angle) * flip.length;
    const hit = linePointDistance(flip.x, flip.y, ex, ey, state.ball.x, state.ball.y);
    if (hit.dist <= state.ball.r + flip.width / 2 && state.ball.vy > -520) {
        state.ball.x = hit.px + (hit.nx / (Math.hypot(hit.nx, hit.ny) || 1)) * (state.ball.r + flip.width / 2 + 0.5);
        state.ball.y = hit.py + (hit.ny / (Math.hypot(hit.nx, hit.ny) || 1)) * (state.ball.r + flip.width / 2 + 0.5);
        reflectBall(hit.nx, hit.ny, activeBoost);
        addScore(35, state.ball.x, state.ball.y, '#b8fff0', 'flipper');
    }
}

function updateBonusZones(dt) {
    if (state.bonusModeTimer <= 0 || !state.ball.live) return;
    state.bonusScoreTick += dt;
    if (state.bonusScoreTick < 0.2) return;
    state.bonusScoreTick = 0;
    for (const z of state.bonusZones) {
        if (state.ball.x > z.x && state.ball.x < z.x + z.w && state.ball.y > z.y && state.ball.y < z.y + z.h) {
            state.score += 12;
            addParticles(state.ball.x, state.ball.y, '#9fffe4', 3);
            break;
        }
    }
}

function updateBall(dt) {
    if (!state.ball.live) return;

    state.ball.vy += 420 * dt;
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;

    if (state.ball.x <= state.ball.r + 12 || state.ball.x >= canvas.width - state.ball.r - 12) {
        state.ball.x = Math.max(state.ball.r + 12, Math.min(canvas.width - state.ball.r - 12, state.ball.x));
        reflectBall(state.ball.x < canvas.width / 2 ? 1 : -1, 0.08, 5);
    }
    if (state.ball.y <= state.ball.r + 12) {
        state.ball.y = state.ball.r + 12;
        reflectBall(0, 1, 4);
    }

    state.bumpers.forEach((b) => {
        const dx = state.ball.x - b.x;
        const dy = state.ball.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < state.ball.r + b.r) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            state.ball.x = b.x + nx * (state.ball.r + b.r + 0.5);
            state.ball.y = b.y + ny * (state.ball.r + b.r + 0.5);
            reflectBall(nx, ny, 35);
            b.glow = 1;
            addScore(b.value, b.x, b.y, '#7fffe0', 'bumper');
        }
        b.glow = Math.max(0, b.glow - dt * 3.4);
    });

    state.rails.forEach((r) => {
        if (state.ball.x > r.x && state.ball.x < r.x + r.w && state.ball.y > r.y && state.ball.y < r.y + r.h) {
            addScore(r.value, state.ball.x, state.ball.y, '#b7ffec', 'rail');
            state.ball.vy = -Math.abs(state.ball.vy) - 45;
            state.ball.vx += r.x < canvas.width / 2 ? 70 : -70;
            state.flash = 0.14;

            if (r.id === 'left') state.objectives.railsHitLeft = true;
            if (r.id === 'right') state.objectives.railsHitRight = true;
            const railCount = (state.objectives.railsHitLeft ? 1 : 0) + (state.objectives.railsHitRight ? 1 : 0);
            markMission('dual_rails', railCount);
        }
    });

    collideFlipper(state.leftFlipper, state.leftFlip ? 45 : 8);
    collideFlipper(state.rightFlipper, state.rightFlip ? 45 : 8);
    updateBonusZones(dt);

    if (state.ball.y > canvas.height + 30) {
        state.ballsLeft -= 1;
        state.multiplier = 1;
        state.comboTimer = 0;
        state.flash = 0.24;
        state.objectives.bumperStreak = 0;
        if (typeof GameAudio !== 'undefined') GameAudio.play('fail');
        if (state.ballsLeft <= 0) {
            state.mode = 'gameover';
            saveBest();
            if (typeof Celebration !== 'undefined') Celebration.fire();
        }
        resetBallToLauncher();
    }
}

function update(dt) {
    state.lightsPhase += dt * 2;
    if (state.mode === 'playing' && state.launching && !state.ball.live) {
        state.charge = Math.min(1, state.charge + dt * 0.85);
    }

    updateFlippers(dt);

    if (state.mode === 'playing') {
        updateBall(dt);
        if (state.comboTimer > 0) {
            state.comboTimer -= dt;
        } else {
            state.multiplier = Math.max(1, state.multiplier - dt * 0.8);
        }

        if (state.bonusModeTimer > 0) {
            state.bonusModeTimer -= dt;
            state.multiplier = Math.max(2.5, state.multiplier);
        }

        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
            score: state.score,
            ballsLeft: state.ballsLeft,
            multiplier: state.multiplier,
            bonusModeTimer: Number(state.bonusModeTimer.toFixed(2)),
            mode: state.mode,
            updatedAt: Date.now()
        }));
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    state.flash = Math.max(0, state.flash - dt);
    state.shake = Math.max(0, state.shake - dt * 7.5);
    updateHud();
}

function drawPinballTable() {
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#0f3d36');
    bg.addColorStop(1, '#0a231f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#65ddbf';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    const lights = 20;
    for (let i = 0; i < lights; i++) {
        const t = i / lights;
        const glow = 0.25 + 0.75 * Math.max(0, Math.sin(state.lightsPhase + i * 0.45));
        ctx.fillStyle = `rgba(138,255,228,${glow})`;
        ctx.beginPath();
        ctx.arc(26 + t * (canvas.width - 52), 24, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(26 + t * (canvas.width - 52), canvas.height - 24, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    state.bonusZones.forEach((z) => {
        if (state.bonusModeTimer <= 0) return;
        ctx.fillStyle = 'rgba(158, 255, 228, 0.12)';
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeStyle = 'rgba(158, 255, 228, 0.6)';
        ctx.strokeRect(z.x + 0.5, z.y + 0.5, z.w - 1, z.h - 1);
    });

    state.rails.forEach((r) => {
        const railGlow = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
        railGlow.addColorStop(0, '#266a5f');
        railGlow.addColorStop(1, '#52c6ad');
        ctx.fillStyle = railGlow;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#7af2d3';
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    });

    state.bumpers.forEach((b) => {
        const glowR = b.r + 14;
        ctx.fillStyle = `rgba(135,255,223,${b.glow * 0.6})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        const g = ctx.createRadialGradient(b.x - 5, b.y - 6, 4, b.x, b.y, b.r);
        g.addColorStop(0, '#ebfff9');
        g.addColorStop(1, '#3dc9a5');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
    });

    drawFlipper(state.leftFlipper, '#8df0d5');
    drawFlipper(state.rightFlipper, '#8df0d5');

    ctx.fillStyle = '#275f55';
    ctx.fillRect(448, 72, 44, 600);
    ctx.strokeStyle = '#79e6cb';
    ctx.strokeRect(448.5, 72.5, 43, 599);

    const chargeH = 130 * state.charge;
    ctx.fillStyle = 'rgba(167,255,235,.78)';
    ctx.fillRect(454, 666 - chargeH, 32, chargeH);
}

function drawFlipper(flip, color) {
    const ex = flip.x + Math.cos(flip.angle) * flip.length;
    const ey = flip.y + Math.sin(flip.angle) * flip.length;
    ctx.strokeStyle = color;
    ctx.lineWidth = flip.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(flip.x, flip.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.lineWidth = 1;
}

function drawBall() {
    if (!state.ball.live && state.mode !== 'playing') return;
    if (!state.ball.live && state.mode === 'playing' && !state.launching) {
        ctx.fillStyle = '#ddfff4';
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    const g = ctx.createRadialGradient(state.ball.x - 3, state.ball.y - 3, 2, state.ball.x, state.ball.y, state.ball.r + 2);
    g.addColorStop(0, '#f8fffd');
    g.addColorStop(1, '#7de9ce');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;
    const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;

    ctx.save();
    ctx.translate(sx, sy);
    drawPinballTable();
    drawBall();

    state.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life * 1.4);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    });

    if (state.mode === 'idle') drawCenterLabel('按发射或空格蓄力发球');
    if (state.mode === 'gameover') drawCenterLabel(`游戏结束  得分 ${state.score}`);

    if (state.flash > 0) {
        ctx.fillStyle = `rgba(220,255,246,${state.flash * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
}

function drawCenterLabel(text) {
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.fillRect(80, canvas.height / 2 - 36, canvas.width - 160, 72);
    ctx.strokeStyle = '#b8ffe9';
    ctx.strokeRect(80, canvas.height / 2 - 36, canvas.width - 160, 72);
    ctx.fillStyle = '#d9fff2';
    ctx.font = 'bold 22px Trebuchet MS';
    ctx.fillText(text, 96, canvas.height / 2 + 10);
}

function launchBall() {
    if (state.mode !== 'playing' || state.ball.live) return;
    const power = 260 + state.charge * 360;
    state.ball.live = true;
    state.ball.vx = -70 + Math.random() * 55;
    state.ball.vy = -power;
    state.charge = 0;
    state.launching = false;
    if (typeof GameAudio !== 'undefined') GameAudio.play('powerup');
}

function onKeyDown(e) {
    if (e.key === 'z' || e.key === 'Z') state.leftFlip = true;
    if (e.key === '/' || e.key === '?') state.rightFlip = true;
    if (e.key === ' ') {
        if (state.mode !== 'playing') startGame();
        if (!state.ball.live) state.launching = true;
    }
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
}

function onKeyUp(e) {
    if (e.key === 'z' || e.key === 'Z') state.leftFlip = false;
    if (e.key === '/' || e.key === '?') state.rightFlip = false;
    if (e.key === ' ') {
        if (state.launching) launchBall();
    }
}

function bindPressHold(el, onStart, onEnd) {
    const down = (ev) => { ev.preventDefault(); onStart(); };
    const up = (ev) => { ev.preventDefault(); onEnd(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
}

function loop(ts) {
    const dt = Math.min(0.04, (ts - state.lastTs) / 1000 || 0.016);
    state.lastTs = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

window.render_game_to_text = () => JSON.stringify({
    mode: state.mode,
    modeDetail: state.bonusModeTimer > 0 ? 'bonus-mode' : 'normal-mode',
    coordSystem: 'origin=(0,0) at top-left; +x right; +y down; unit=canvas pixel',
    score: state.score,
    best: state.best,
    ballsLeft: state.ballsLeft,
    multiplier: Number(state.multiplier.toFixed(2)),
    player: {
        flippers: {
            left: Number(state.leftFlipper.angle.toFixed(2)),
            right: Number(state.rightFlipper.angle.toFixed(2))
        },
        launcherCharge: Number(state.charge.toFixed(2))
    },
    ball: {
        x: Math.round(state.ball.x),
        y: Math.round(state.ball.y),
        vx: Math.round(state.ball.vx),
        vy: Math.round(state.ball.vy),
        live: state.ball.live
    },
    entities: {
        bumpers: state.bumpers.map((b) => ({ x: b.x, y: b.y, r: b.r, glow: Number(b.glow.toFixed(2)) })),
        rails: state.rails
    },
    specialEntities: {
        bonusZones: state.bonusZones,
        activeMission: getMissionText()
    },
    objectives: {
        bumperStreak: state.objectives.bumperStreak,
        railsHitLeft: state.objectives.railsHitLeft,
        railsHitRight: state.objectives.railsHitRight,
        missionsDone: state.objectives.missionsDone
    },
    timers: { comboTimer: Number(state.comboTimer.toFixed(2)), bonusModeTimer: Number(state.bonusModeTimer.toFixed(2)) }
});

window.advanceTime = (ms) => {
    const step = 1000 / 60;
    const loops = Math.max(1, Math.round(ms / step));
    const dt = step / 1000;
    for (let i = 0; i < loops; i++) update(dt);
    render();
};

window.get_game_meta = () => JSON.stringify({
    id: GAME_ID,
    name: '弹球台',
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

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

bindPressHold(document.getElementById('leftFlipBtn'), () => { state.leftFlip = true; }, () => { state.leftFlip = false; });
bindPressHold(document.getElementById('rightFlipBtn'), () => { state.rightFlip = true; }, () => { state.rightFlip = false; });
bindPressHold(document.getElementById('launchBtn'), () => {
    if (state.mode !== 'playing') startGame();
    if (!state.ball.live) state.launching = true;
}, () => {
    if (state.launching) launchBall();
});

window.addEventListener('beforeunload', saveBest);
window.GameLayoutFit?.bindCanvasMaxHeight({
    canvas,
    containerSelector: '.game-wrap',
    minHeight: 250,
    bottomGap: 6
});

resetGame();
requestAnimationFrame((ts) => {
    state.lastTs = ts;
    loop(ts);
});

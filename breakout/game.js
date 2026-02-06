const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('bestScore');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const modeDetailEl = document.getElementById('modeDetail');
const objectiveEl = document.getElementById('objectiveText');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const GAME_ID = 'breakout';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`
};

const levelTemplates = [
    ['0111111110', '1111111111', '1111111111', '1111111111'],
    ['1011111101', '1122222211', '1111111111', '0111111110'],
    ['3333333333', '1111111111', '0011111100', '1111111111'],
    ['1144444411', '1222222221', '1111111111', '0011111000'],
    ['2223333222', '1114444111', '0111111110', '0011111000'],
    ['3312121333', '1411111141', '1111111111', '3311111333'],
    ['4444444444', '3333333333', '2222222222', '1111111111'],
    ['2323232323', '4141414141', '1111111111', '3333333333', '2222222222']
];

const state = {
    mode: 'idle',
    score: 0,
    best: parseInt(localStorage.getItem(STORAGE_KEYS.best) || '0', 10),
    lives: 3,
    level: 0,
    combo: 0,
    comboTimer: 0,
    slowMo: 0,
    flash: 0,
    shake: 0,
    chapterTimer: 0,
    chapterText: '',
    lastTs: 0,
    leftPressed: false,
    rightPressed: false,
    paddle: { x: canvas.width / 2, y: canvas.height - 38, width: 105, height: 15, speed: 410 },
    balls: [],
    bricks: [],
    particles: [],
    objectives: {
        movingHits: 0,
        bonusTriggered: 0,
        chapterReached: 1
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

function makeBall(isMain, stick = false) {
    return {
        x: state.paddle.x,
        y: state.paddle.y - 18,
        r: 8,
        vx: (Math.random() * 100 + 180) * (Math.random() > 0.5 ? 1 : -1),
        vy: -(250 + state.level * 18),
        isMain,
        stuck: stick,
        life: isMain ? Infinity : 16
    };
}

function createBricks(levelIndex) {
    const map = levelTemplates[levelIndex];
    const cols = map[0].length;
    const width = (canvas.width - 40) / cols;
    const height = 22;
    const bricks = [];
    map.forEach((row, r) => {
        row.split('').forEach((cell, c) => {
            if (cell === '0') return;
            const hp = cell === '2' ? 2 : 1;
            const type = cell === '3' ? 'moving' : (cell === '4' ? 'bonus' : 'normal');
            bricks.push({
                x: 20 + c * width + width / 2,
                y: 84 + r * (height + 7),
                baseX: 20 + c * width + width / 2,
                width: width - 6,
                height,
                hp,
                maxHp: hp,
                type,
                moveDir: Math.random() > 0.5 ? 1 : -1,
                moveRange: 16 + Math.random() * 22,
                moveSpeed: 32 + Math.random() * 34,
                hitFlash: 0
            });
        });
    });
    state.bricks = bricks;
}

function resetBalls(stickMain = true) {
    state.balls = [makeBall(true, stickMain)];
}

function resetGame() {
    state.mode = 'idle';
    state.score = 0;
    state.lives = 3;
    state.level = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.slowMo = 0;
    state.flash = 0;
    state.shake = 0;
    state.chapterTimer = 0;
    state.chapterText = '';
    state.paddle.x = canvas.width / 2;
    createBricks(state.level);
    resetBalls(true);
    state.particles = [];
    state.objectives.movingHits = 0;
    state.objectives.bonusTriggered = 0;
    state.objectives.chapterReached = 1;
    updateHud();
    render();
}

function startGame() {
    if (state.mode === 'gameover') resetGame();
    if (state.mode !== 'playing') state.mode = 'playing';
    const main = state.balls.find((b) => b.isMain);
    if (main) main.stuck = false;
}

function enterChapterSummary() {
    const chapter = Math.floor(state.level / 2) + 1;
    state.chapterText = `章节 ${chapter} 完成`; 
    state.chapterTimer = 1.5;
    state.slowMo = 0.6;
    state.flash = 0.18;
    state.objectives.chapterReached = Math.max(state.objectives.chapterReached, chapter + 1);
}

function nextLevel() {
    state.level += 1;
    if (state.level >= levelTemplates.length) {
        state.mode = 'gameover';
        saveBest();
        if (typeof Celebration !== 'undefined') Celebration.fire();
        return;
    }

    if (state.level % 2 === 0) {
        enterChapterSummary();
    }

    createBricks(state.level);
    resetBalls(true);
    state.combo = 0;
    state.comboTimer = 0;
    if (typeof GameAudio !== 'undefined') GameAudio.play('powerup');
}

function updateHud() {
    scoreEl.textContent = String(state.score);
    livesEl.textContent = String(state.lives);
    levelEl.textContent = `${state.level + 1}/${levelTemplates.length}`;
    comboEl.textContent = `x${(1 + Math.min(2.5, state.combo * 0.1)).toFixed(1)}`;
    modeDetailEl.textContent = state.chapterTimer > 0 ? state.chapterText : `第${Math.floor(state.level / 2) + 1}章节`; 
    objectiveEl.textContent = `移动砖:${state.objectives.movingHits} 奖励砖:${state.objectives.bonusTriggered} 章节:${state.objectives.chapterReached}/4`;
}

function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 170;
        state.particles.push({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: 0.4 + Math.random() * 0.4,
            color,
            size: 1.5 + Math.random() * 2.5
        });
    }
}

function addBonusBall() {
    const bonus = makeBall(false, false);
    bonus.x = state.paddle.x + (Math.random() > 0.5 ? -16 : 16);
    bonus.y = state.paddle.y - 18;
    bonus.vx = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 90);
    bonus.vy = -(240 + Math.random() * 80);
    bonus.life = 12;
    state.balls.push(bonus);
}

function updateBricks(dt) {
    state.bricks.forEach((b) => {
        b.hitFlash = Math.max(0, b.hitFlash - dt * 5);
        if (b.type === 'moving') {
            b.x += b.moveDir * b.moveSpeed * dt;
            if (Math.abs(b.x - b.baseX) > b.moveRange) {
                b.moveDir *= -1;
                b.x = b.baseX + b.moveDir * b.moveRange;
            }
        }
    });
}

function resolveBallWall(ball) {
    if (ball.x <= ball.r || ball.x >= canvas.width - ball.r) {
        ball.vx *= -1;
        ball.x = Math.max(ball.r, Math.min(canvas.width - ball.r, ball.x));
        state.shake = 2;
        addParticles(ball.x, ball.y, '#ffc799', 4);
    }
    if (ball.y <= ball.r) {
        ball.vy = Math.abs(ball.vy);
        state.shake = 2;
        addParticles(ball.x, ball.y, '#ffd698', 5);
    }
}

function resolvePaddle(ball) {
    const pdx = ball.x - state.paddle.x;
    const pdy = Math.abs(ball.y - state.paddle.y);
    if (pdy < ball.r + state.paddle.height / 2 && Math.abs(pdx) < state.paddle.width / 2 + ball.r && ball.vy > 0) {
        const ratio = pdx / (state.paddle.width / 2);
        ball.vx = 320 * ratio;
        ball.vy = -Math.max(220, Math.abs(ball.vy));
        state.combo += 1;
        state.comboTimer = 2.2;
        state.shake = 3;
        addParticles(ball.x, ball.y, '#ffd68d', 8);
        if (typeof GameAudio !== 'undefined') GameAudio.play('hit');
    }
}

function resolveBrickCollision(ball) {
    for (let i = state.bricks.length - 1; i >= 0; i--) {
        const b = state.bricks[i];
        if (Math.abs(ball.x - b.x) < b.width / 2 + ball.r && Math.abs(ball.y - b.y) < b.height / 2 + ball.r) {
            const overlapX = (b.width / 2 + ball.r) - Math.abs(ball.x - b.x);
            const overlapY = (b.height / 2 + ball.r) - Math.abs(ball.y - b.y);
            if (overlapX < overlapY) ball.vx *= -1;
            else ball.vy *= -1;

            b.hp -= 1;
            b.hitFlash = 1;
            state.shake = Math.max(state.shake, 2.8);
            if (b.type === 'moving') state.objectives.movingHits += 1;

            if (b.hp <= 0) {
                const isHard = b.maxHp > 1;
                const base = b.type === 'bonus' ? 35 : (isHard ? 20 : 5);
                const multi = 1 + Math.min(2.5, state.combo * 0.1);
                const add = Math.round(base * multi);
                state.score += add;

                if (b.type === 'bonus') {
                    state.objectives.bonusTriggered += 1;
                    addBonusBall();
                    addParticles(b.x, b.y, '#f7ff9a', 18);
                } else {
                    addParticles(b.x, b.y, isHard ? '#ff8d66' : '#ffd088', isHard ? 14 : 8);
                }

                state.bricks.splice(i, 1);
                if (typeof GameAudio !== 'undefined') GameAudio.play('clear');
            } else {
                addParticles(b.x, b.y, '#ffbf8a', 7);
                if (typeof GameAudio !== 'undefined') GameAudio.play('click');
            }
            return;
        }
    }
}

function updateBalls(dt) {
    for (let i = state.balls.length - 1; i >= 0; i--) {
        const ball = state.balls[i];

        if (ball.stuck) {
            ball.x = state.paddle.x;
            ball.y = state.paddle.y - 18;
            continue;
        }

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        resolveBallWall(ball);
        resolvePaddle(ball);
        resolveBrickCollision(ball);

        if (!ball.isMain) {
            ball.life -= dt;
            if (ball.life <= 0 || ball.y > canvas.height + 20) {
                state.balls.splice(i, 1);
            }
            continue;
        }

        if (ball.y > canvas.height + 20) {
            state.lives -= 1;
            state.combo = 0;
            state.comboTimer = 0;
            state.flash = 0.2;
            if (typeof GameAudio !== 'undefined') GameAudio.play('fail');
            if (state.lives <= 0) {
                state.mode = 'gameover';
                saveBest();
            } else {
                resetBalls(true);
            }
            return;
        }
    }
}

function update(dtRaw) {
    const dt = state.slowMo > 0 ? dtRaw * 0.45 : dtRaw;

    const move = (state.rightPressed ? 1 : 0) - (state.leftPressed ? 1 : 0);
    state.paddle.x += move * state.paddle.speed * dt;
    state.paddle.x = Math.max(state.paddle.width / 2 + 8, Math.min(canvas.width - state.paddle.width / 2 - 8, state.paddle.x));

    if (state.mode !== 'playing') {
        updateParticles(dtRaw);
        updateFx(dtRaw);
        return;
    }

    updateBricks(dt);
    updateBalls(dt);

    if (state.bricks.length === 0) {
        nextLevel();
    }

    if (state.comboTimer > 0) state.comboTimer -= dt;
    else state.combo = 0;

    updateParticles(dt);
    updateFx(dtRaw);

    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
        score: state.score,
        lives: state.lives,
        level: state.level,
        combo: state.combo,
        balls: state.balls.length,
        mode: state.mode,
        updatedAt: Date.now()
    }));

    updateHud();
}

function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 190 * dt;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}

function updateFx(dt) {
    state.flash = Math.max(0, state.flash - dt);
    state.shake = Math.max(0, state.shake - dt * 8);
    state.slowMo = Math.max(0, state.slowMo - dt);
    state.chapterTimer = Math.max(0, state.chapterTimer - dt);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;
    const sy = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 2 : 0;

    ctx.save();
    ctx.translate(sx, sy);

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#281935');
    bg.addColorStop(1, '#140d1c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawEdgeGlow();

    state.bricks.forEach((b) => {
        const hard = b.maxHp > 1;
        let c1 = hard ? '#ff8557' : '#ffd16f';
        let c2 = hard ? '#ffb088' : '#ffeab2';
        if (b.type === 'moving') { c1 = '#79dcff'; c2 = '#b9f0ff'; }
        if (b.type === 'bonus') { c1 = '#f4e165'; c2 = '#fff6b4'; }
        const x = b.x - b.width / 2;
        const y = b.y - b.height / 2;
        const g = ctx.createLinearGradient(x, y, x, y + b.height);
        g.addColorStop(0, c2);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.fillRect(x, y, b.width, b.height);
        if (b.hitFlash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${b.hitFlash * 0.65})`;
            ctx.fillRect(x, y, b.width, b.height);
        }
        ctx.strokeStyle = b.type === 'moving' ? '#54bfe7' : (hard ? '#ff5e2f' : '#ffcb6a');
        ctx.strokeRect(x + 0.5, y + 0.5, b.width - 1, b.height - 1);
    });

    ctx.fillStyle = '#7fd9ff';
    ctx.fillRect(state.paddle.x - state.paddle.width / 2, state.paddle.y - state.paddle.height / 2, state.paddle.width, state.paddle.height);

    state.balls.forEach((ball) => {
        const ballGlow = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, ball.r + 7);
        ballGlow.addColorStop(0, ball.isMain ? '#fff9ca' : '#daf7ff');
        ballGlow.addColorStop(1, 'rgba(255,249,202,0)');
        ctx.fillStyle = ballGlow;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r + 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ball.isMain ? '#fff5b2' : '#c8f3ff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
    });

    state.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life * 1.4);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    });

    drawComboBar();

    if (state.mode === 'idle') drawCenterLabel('按开始发射小球');
    if (state.mode === 'gameover') drawCenterLabel(`游戏结束  得分 ${state.score}`);
    if (state.chapterTimer > 0) {
        ctx.fillStyle = `rgba(255,226,153,${Math.min(1, state.chapterTimer)})`;
        ctx.font = 'bold 28px Trebuchet MS';
        ctx.fillText(state.chapterText, 152, canvas.height / 2);
    }

    if (state.flash > 0) {
        ctx.fillStyle = `rgba(255, 245, 230, ${state.flash * 0.65})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
}

function drawEdgeGlow() {
    const side = ctx.createLinearGradient(0, 0, canvas.width, 0);
    side.addColorStop(0, 'rgba(255,180,110,.2)');
    side.addColorStop(0.5, 'rgba(255,180,110,0)');
    side.addColorStop(1, 'rgba(255,180,110,.2)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawComboBar() {
    if (state.combo <= 1) return;
    const ratio = Math.min(1, state.comboTimer / 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(14, 18, 170, 10);
    ctx.fillStyle = '#ffd37d';
    ctx.fillRect(14, 18, 170 * ratio, 10);
    ctx.fillStyle = '#fff3cf';
    ctx.font = 'bold 12px Trebuchet MS';
    ctx.fillText(`连击 x${(1 + Math.min(2.5, state.combo * 0.1)).toFixed(1)}`, 16, 14);
}

function drawCenterLabel(text) {
    ctx.fillStyle = 'rgba(0,0,0,.33)';
    ctx.fillRect(95, canvas.height / 2 - 36, canvas.width - 190, 72);
    ctx.strokeStyle = '#ffd6a6';
    ctx.strokeRect(95, canvas.height / 2 - 36, canvas.width - 190, 72);
    ctx.fillStyle = '#ffe5c5';
    ctx.font = 'bold 24px Trebuchet MS';
    ctx.fillText(text, 128, canvas.height / 2 + 10);
}

function loop(ts) {
    const dt = Math.min(0.04, (ts - state.lastTs) / 1000 || 0.016);
    state.lastTs = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.leftPressed = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.rightPressed = true;
    if (e.key === ' ' && state.mode !== 'playing') startGame();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
}

function onKeyUp(e) {
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

window.render_game_to_text = () => JSON.stringify({
    mode: state.mode,
    modeDetail: state.chapterTimer > 0 ? 'chapter-summary' : `chapter-${Math.floor(state.level / 2) + 1}`,
    coordSystem: 'origin=(0,0) at top-left; +x right; +y down; unit=canvas pixel',
    score: state.score,
    best: state.best,
    lives: state.lives,
    level: state.level + 1,
    combo: Number((1 + Math.min(2.5, state.combo * 0.1)).toFixed(1)),
    player: { paddleX: Math.round(state.paddle.x), paddleY: Math.round(state.paddle.y), paddleWidth: state.paddle.width },
    ball: state.balls.map((b) => ({ x: Math.round(b.x), y: Math.round(b.y), vx: Math.round(b.vx), vy: Math.round(b.vy), main: b.isMain, stuck: b.stuck })),
    entities: {
        bricks: state.bricks.slice(0, 24).map((b) => ({ x: Math.round(b.x), y: Math.round(b.y), hp: b.hp, type: b.type })),
        extraBallCount: state.balls.filter((b) => !b.isMain).length
    },
    specialEntities: {
        movingBricks: state.bricks.filter((b) => b.type === 'moving').slice(0, 8).map((b) => ({ x: Math.round(b.x), y: Math.round(b.y) })),
        bonusBricks: state.bricks.filter((b) => b.type === 'bonus').length
    },
    objectives: {
        movingHits: state.objectives.movingHits,
        bonusTriggered: state.objectives.bonusTriggered,
        chapterReached: state.objectives.chapterReached
    },
    timers: { comboTimer: Number(state.comboTimer.toFixed(2)), slowMo: Number(state.slowMo.toFixed(2)), chapterTimer: Number(state.chapterTimer.toFixed(2)) }
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
    name: '打砖块',
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
bindTouchMove(document.getElementById('leftBtn'), 'left');
bindTouchMove(document.getElementById('rightBtn'), 'right');
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

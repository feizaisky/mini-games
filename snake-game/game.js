const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const GAME_ID = 'snake-game';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`,
    progress: `${STORAGE_PREFIX}.progress`
};

// 难度配置
const difficultyConfig = {
    easy: { speed: 800, name: '简单' },
    medium: { speed: 480, name: '中等' },
    hard: { speed: 320, name: '困难' }
};

let currentDifficulty = 'easy';

// 响应式画布大小
function resizeCanvas() {
    if (window.innerWidth <= 768) {
        const containerWidth = document.querySelector('.game-container').clientWidth - 30;
        if (containerWidth < 360) {
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = containerWidth + 'px';
        }
    } else {
        canvas.style.width = '360px';
        canvas.style.height = '360px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x: 9, y: 9}];
let food = {x: 15, y: 15};
let dx = 0;
let dy = 0;
let score = 0;
let gameRunning = false;
let gameStarted = false;
let gamePaused = false;
let baseSpeed = difficultyConfig.easy.speed;
let gameSpeed = difficultyConfig.easy.speed;
let gameLoopId = null;
let highScore = 0;
let isBoosting = false;
const boostFactor = 0.5;
let mapMode = 'classic';
let obstacles = [];
const obstacleMaps = {
    classic: [],
    canyon: Array.from({ length: 12 }, (_, i) => ({ x: 4, y: i + 3 }))
        .concat(Array.from({ length: 12 }, (_, i) => ({ x: 13, y: i + 3 }))),
    cross: Array.from({ length: 20 }, (_, i) => ({ x: i, y: 10 }))
        .concat(Array.from({ length: 20 }, (_, i) => ({ x: 10, y: i })))
        .filter(p => !(p.x === 9 && p.y === 9))
};

// 道具系统
let powerUp = null;       // 当前地图上的道具
let activePowerUp = null;  // 当前激活的道具效果
let powerUpTimer = 0;      // 道具持续时间计时
const POWERUP_DURATION = 50; // 道具效果持续步数
const POWERUP_SPAWN_CHANCE = 0.15; // 吃到食物后生成道具的概率

const powerUpTypes = {
    speed: { color: '#f39c12', symbol: '⚡', name: '加速', effect: 0.6 },
    slow: { color: '#3498db', symbol: '❄', name: '减速', effect: 1.5 },
    double: { color: '#e74c3c', symbol: '×2', name: '双倍', effect: 2 }
};

// 死亡动画
let deathParticles = [];
let deathAnimating = false;
let deathAnimFrame = null;

// 从 localStorage 读取最高分
const savedHighScore = localStorage.getItem('snakeHighScore');
if (savedHighScore) {
    highScore = parseInt(savedHighScore);
}
highScoreElement.textContent = highScore;

// 难度选择
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        if (gameRunning) return;

        difficultyBtns.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');

        currentDifficulty = this.dataset.difficulty;
        baseSpeed = difficultyConfig[currentDifficulty].speed;
        applySpeed();

        if (typeof GameAudio !== 'undefined') GameAudio.play('click');
        resetGame();
    });
});

function setMapMode(mode) {
    mapMode = mode;
    obstacles = (obstacleMaps[mode] || []).slice();
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({
        difficulty: currentDifficulty,
        mapMode,
        updatedAt: Date.now()
    }));
    if (gameRunning) {
        resetGame();
    } else {
        draw();
    }
}

function ensureMapButtons() {
    if (document.getElementById('map-classic')) return;
    const wrap = document.querySelector('.difficulty-selector') || document.querySelector('.controls') || document.body;
    const modes = [
        { id: 'classic', label: '经典图' },
        { id: 'canyon', label: '峡谷图' },
        { id: 'cross', label: '十字图' }
    ];
    modes.forEach(item => {
        const btn = document.createElement('button');
        btn.id = `map-${item.id}`;
        btn.className = 'difficulty-btn';
        btn.textContent = item.label;
        btn.addEventListener('click', () => setMapMode(item.id));
        wrap.appendChild(btn);
    });
}

document.addEventListener('keydown', changeDirection);
restartBtn.addEventListener('click', resetGame);
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// 暂停功能
function togglePause() {
    if (!gameRunning || !gameStarted) return;

    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '继续' : '暂停';

    if (typeof GameAudio !== 'undefined') {
        GameAudio.play(gamePaused ? 'pause' : 'resume');
    }

    if (!gamePaused) {
        gameLoop();
    } else if (gameLoopId) {
        clearTimeout(gameLoopId);
        gameLoopId = null;
        // 暂停时绘制半透明遮罩
        drawPauseOverlay();
    }
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('暂停中', canvas.width / 2, canvas.height / 2);
    ctx.font = '14px Arial';
    ctx.fillText('点击继续按钮恢复', canvas.width / 2, canvas.height / 2 + 30);
}

// ESC键暂停
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameRunning && gameStarted) {
            togglePause();
        }
    }
});

// 触摸支持
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30;

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: false});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, {passive: false});

document.addEventListener('touchstart', function(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') ||
        e.target.tagName === 'A' || e.target.closest('a')) {
        return;
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    setBoosting(true);
}, {passive: false});

document.addEventListener('touchmove', function(e) {
    if (e.target.tagName === 'CANVAS' || e.target.tagName === 'BUTTON' || e.target.closest('button') ||
        e.target.tagName === 'A' || e.target.closest('a')) {
        return;
    }
    e.preventDefault();
}, {passive: false});

document.addEventListener('touchend', function(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') ||
        e.target.tagName === 'A' || e.target.closest('a')) {
        return;
    }
    e.preventDefault();
    setBoosting(false);
    if (!gameRunning || gamePaused) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) < minSwipeDistance && Math.abs(diffY) < minSwipeDistance) {
        return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && dx !== -1) { dx = 1; dy = 0; }
        else if (diffX < 0 && dx !== 1) { dx = -1; dy = 0; }
    } else {
        if (diffY > 0 && dy !== -1) { dx = 0; dy = 1; }
        else if (diffY < 0 && dy !== 1) { dx = 0; dy = -1; }
    }
}, {passive: false});

canvas.addEventListener('click', function(e) {
    if (!gameStarted) {
        startGame();
        return;
    }
    if (gamePaused) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    const snakeHead = snake[0];

    const headX = snakeHead.x * gridSize + gridSize/2;
    const headY = snakeHead.y * gridSize + gridSize/2;

    const cDiffX = clickX - headX;
    const cDiffY = clickY - headY;

    if (Math.abs(cDiffX) > Math.abs(cDiffY)) {
        if (cDiffX > 0 && dx !== -1) { dx = 1; dy = 0; }
        else if (cDiffX < 0 && dx !== 1) { dx = -1; dy = 0; }
    } else {
        if (cDiffY > 0 && dy !== -1) { dx = 0; dy = 1; }
        else if (cDiffY < 0 && dy !== 1) { dx = 0; dy = -1; }
    }
});

canvas.addEventListener('mousedown', function() { setBoosting(true); });
document.addEventListener('mouseup', function() { setBoosting(false); });
document.addEventListener('mouseleave', function() { setBoosting(false); });

function startGame() {
    gameStarted = true;
    gameRunning = true;
    gamePaused = false;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    pauseBtn.textContent = '暂停';
    dx = 1;
    dy = 0;
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    gameLoop();
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;

    stepGame();

    gameLoopId = setTimeout(gameLoop, gameSpeed);
}

function stepGame() {
    update();
    draw();
}

function update() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }
    for (let i = 0; i < obstacles.length; i++) {
        if (head.x === obstacles[i].x && head.y === obstacles[i].y) {
            endGame();
            return;
        }
    }

    snake.unshift(head);

    // 检查吃到食物
    if (head.x === food.x && head.y === food.y) {
        let points = 10;
        if (activePowerUp === 'double') points = 20;
        score += points;
        scoreElement.textContent = score;

        if (typeof GameAudio !== 'undefined') GameAudio.play('score');

        let isNewRecord = false;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
            localStorage.setItem(STORAGE_KEYS.best, String(highScore));
            isNewRecord = true;
        }

        generateFood();

        // 概率生成道具
        if (!powerUp && Math.random() < POWERUP_SPAWN_CHANCE) {
            spawnPowerUp();
        }

        // 新纪录庆祝（首次超越时）
        if (isNewRecord && score === points) {
            // 第一次得分就是新纪录就不庆祝
        } else if (isNewRecord && score === highScore) {
            if (typeof GameAudio !== 'undefined') GameAudio.play('record');
        }
    } else {
        snake.pop();
    }

    // 检查吃到道具
    if (powerUp && head.x === powerUp.x && head.y === powerUp.y) {
        activatePowerUp(powerUp.type);
        powerUp = null;
        if (typeof GameAudio !== 'undefined') GameAudio.play('upgrade');
    }

    // 更新道具计时
    if (activePowerUp) {
        powerUpTimer--;
        if (powerUpTimer <= 0) {
            deactivatePowerUp();
        }
    }
}

// 道具系统
function spawnPowerUp() {
    const types = Object.keys(powerUpTypes);
    const type = types[Math.floor(Math.random() * types.length)];
    let x, y;
    do {
        x = Math.floor(Math.random() * tileCount);
        y = Math.floor(Math.random() * tileCount);
    } while (
        snake.some(s => s.x === x && s.y === y) ||
        (food.x === x && food.y === y) ||
        obstacles.some(o => o.x === x && o.y === y)
    );
    powerUp = { x, y, type };
}

function activatePowerUp(type) {
    activePowerUp = type;
    powerUpTimer = POWERUP_DURATION;

    if (type === 'speed') {
        baseSpeed = difficultyConfig[currentDifficulty].speed * powerUpTypes.speed.effect;
    } else if (type === 'slow') {
        baseSpeed = difficultyConfig[currentDifficulty].speed * powerUpTypes.slow.effect;
    }
    applySpeed();
}

function deactivatePowerUp() {
    activePowerUp = null;
    powerUpTimer = 0;
    baseSpeed = difficultyConfig[currentDifficulty].speed;
    applySpeed();
}

function draw() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (obstacles.length > 0) {
        ctx.fillStyle = '#7f8c8d';
        obstacles.forEach((o) => {
            ctx.fillRect(o.x * gridSize + 2, o.y * gridSize + 2, gridSize - 4, gridSize - 4);
        });
    }

    // 绘制蛇
    snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
            segment.x * gridSize + gridSize/2,
            segment.y * gridSize + gridSize/2,
            0,
            segment.x * gridSize + gridSize/2,
            segment.y * gridSize + gridSize/2,
            gridSize/2
        );

        if (index === 0) {
            // 根据当前道具效果改变蛇头颜色
            if (activePowerUp === 'speed') {
                gradient.addColorStop(0, '#f39c12');
                gradient.addColorStop(1, '#d68910');
            } else if (activePowerUp === 'slow') {
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(1, '#2980b9');
            } else if (activePowerUp === 'double') {
                gradient.addColorStop(0, '#e74c3c');
                gradient.addColorStop(1, '#c0392b');
            } else {
                gradient.addColorStop(0, '#27ae60');
                gradient.addColorStop(1, '#1e8449');
            }
        } else {
            const alpha = 1 - (index / snake.length) * 0.5;
            if (activePowerUp === 'speed') {
                gradient.addColorStop(0, `rgba(243, 156, 18, ${alpha})`);
                gradient.addColorStop(1, `rgba(214, 137, 16, ${alpha})`);
            } else if (activePowerUp === 'slow') {
                gradient.addColorStop(0, `rgba(52, 152, 219, ${alpha})`);
                gradient.addColorStop(1, `rgba(41, 128, 185, ${alpha})`);
            } else if (activePowerUp === 'double') {
                gradient.addColorStop(0, `rgba(231, 76, 60, ${alpha})`);
                gradient.addColorStop(1, `rgba(192, 57, 43, ${alpha})`);
            } else {
                gradient.addColorStop(0, `rgba(46, 204, 113, ${alpha})`);
                gradient.addColorStop(1, `rgba(39, 174, 96, ${alpha})`);
            }
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(
                segment.x * gridSize + 1,
                segment.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2,
                5
            );
        } else {
            ctx.fillRect(
                segment.x * gridSize + 1,
                segment.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2
            );
        }
        ctx.fill();

        // 蛇头眼睛
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + gridSize/3, segment.y * gridSize + gridSize/3, 3, 0, Math.PI * 2);
            ctx.arc(segment.x * gridSize + gridSize*2/3, segment.y * gridSize + gridSize/3, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(segment.x * gridSize + gridSize/3, segment.y * gridSize + gridSize/3, 1.5, 0, Math.PI * 2);
            ctx.arc(segment.x * gridSize + gridSize*2/3, segment.y * gridSize + gridSize/3, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 绘制食物
    const foodGradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, 0,
        food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2
    );
    foodGradient.addColorStop(0, '#e74c3c');
    foodGradient.addColorStop(1, '#c0392b');

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2 - 3, food.y * gridSize + gridSize/2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // 绘制道具
    if (powerUp) {
        const pt = powerUpTypes[powerUp.type];
        const px = powerUp.x * gridSize + gridSize / 2;
        const py = powerUp.y * gridSize + gridSize / 2;

        // 发光效果
        const glow = ctx.createRadialGradient(px, py, 0, px, py, gridSize);
        glow.addColorStop(0, pt.color + '60');
        glow.addColorStop(1, pt.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(powerUp.x * gridSize - 4, powerUp.y * gridSize - 4, gridSize + 8, gridSize + 8);

        // 道具背景
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(px, py, gridSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();

        // 道具图标
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.symbol, px, py);
    }

    // 绘制道具效果指示器
    if (activePowerUp) {
        const pt = powerUpTypes[activePowerUp];
        const barWidth = (powerUpTimer / POWERUP_DURATION) * 80;
        ctx.fillStyle = pt.color + '80';
        ctx.fillRect(canvas.width / 2 - 40, 4, barWidth, 6);
        ctx.strokeStyle = pt.color;
        ctx.strokeRect(canvas.width / 2 - 40, 4, 80, 6);

        ctx.fillStyle = pt.color;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pt.name, canvas.width / 2, 22);
    }
}

function applySpeed() {
    if (isBoosting) {
        gameSpeed = Math.max(40, Math.round(baseSpeed * boostFactor));
    } else {
        gameSpeed = baseSpeed;
    }
}

function setBoosting(active) {
    if (!gameRunning || gamePaused) {
        isBoosting = false;
        return;
    }
    if (isBoosting === active) return;
    isBoosting = active;
    applySpeed();
}

// 死亡动画
function DeathParticle(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = 3 + Math.random() * 4;
    var angle = Math.random() * Math.PI * 2;
    var speed = 1 + Math.random() * 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.opacity = 1;
    this.gravity = 0.05;
}

function startDeathAnimation() {
    deathAnimating = true;
    deathParticles = [];

    // 为蛇的每个段创建粒子
    snake.forEach(function(segment, index) {
        var cx = segment.x * gridSize + gridSize / 2;
        var cy = segment.y * gridSize + gridSize / 2;
        var count = index === 0 ? 12 : 6;
        for (var i = 0; i < count; i++) {
            var hue = 120 + (index / snake.length) * 30;
            var color = 'hsl(' + hue + ', 70%, ' + (40 + Math.random() * 20) + '%)';
            deathParticles.push(new DeathParticle(cx, cy, color));
        }
    });

    animateDeathParticles();
}

function animateDeathParticles() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制食物（保持可见）
    const foodGradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, 0,
        food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2
    );
    foodGradient.addColorStop(0, '#e74c3c');
    foodGradient.addColorStop(1, '#c0392b');
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    var alive = false;
    for (var i = 0; i < deathParticles.length; i++) {
        var p = deathParticles[i];
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.02;
        p.size *= 0.98;
        if (p.opacity > 0) {
            alive = true;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    if (alive) {
        deathAnimFrame = requestAnimationFrame(animateDeathParticles);
    } else {
        deathAnimating = false;
        deathParticles = [];
        showGameOver();
    }
}

function showGameOver() {
    gameOverElement.style.display = 'block';
    restartBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
}

function renderGameToText() {
    const payload = {
        mode: gameRunning ? (gamePaused ? 'paused' : 'playing') : (gameOverElement.style.display === 'block' ? 'game_over' : 'idle'),
        grid: {
            cols: tileCount,
            rows: tileCount,
            cellSize: gridSize,
            coordinateSystem: 'origin top-left, x right, y down'
        },
        snake: snake.map(segment => ({ x: segment.x, y: segment.y })),
        direction: { dx, dy },
        food: { x: food.x, y: food.y },
        powerUp: powerUp,
        activePowerUp: activePowerUp,
        score,
        highScore,
        speed: gameSpeed,
        boosting: isBoosting,
        mapMode,
        obstacles: obstacles.map(o => ({ x: o.x, y: o.y }))
    };
    return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;

window.advanceTime = (ms) => {
    if (!gameRunning || gamePaused) return;
    const stepMs = Math.max(1, gameSpeed);
    const steps = Math.max(1, Math.round(ms / stepMs));
    for (let i = 0; i < steps; i++) {
        if (!gameRunning) break;
        stepGame();
    }
};

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    for (let segment of snake) {
        if (segment.x === food.x && food.y === segment.y) {
            generateFood();
            return;
        }
    }
    if (obstacles.some(o => o.x === food.x && o.y === food.y)) {
        generateFood();
    }
}

function changeDirection(event) {
    if (!gameRunning || gamePaused) return;

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) { dx = -1; dy = 0; }
    if (keyPressed === UP_KEY && !goingDown) { dx = 0; dy = -1; }
    if (keyPressed === RIGHT_KEY && !goingLeft) { dx = 1; dy = 0; }
    if (keyPressed === DOWN_KEY && !goingUp) { dx = 0; dy = 1; }
}

function endGame() {
    gameRunning = false;
    gameStarted = false;
    isBoosting = false;
    applySpeed();

    if (gameLoopId) {
        clearTimeout(gameLoopId);
        gameLoopId = null;
    }

    if (typeof GameAudio !== 'undefined') GameAudio.play('lose');

    // 启动死亡动画
    startDeathAnimation();
}

function resetGame() {
    // 取消任何正在进行的死亡动画
    if (deathAnimFrame) {
        cancelAnimationFrame(deathAnimFrame);
        deathAnimFrame = null;
    }
    deathAnimating = false;
    deathParticles = [];

    snake = [{x: 9, y: 9}];
    food = {x: 15, y: 15};
    dx = 0;
    dy = 0;
    score = 0;
    powerUp = null;
    activePowerUp = null;
    powerUpTimer = 0;
    baseSpeed = difficultyConfig[currentDifficulty].speed;
    isBoosting = false;
    obstacles = (obstacleMaps[mapMode] || []).slice();
    gamePaused = false;
    applySpeed();
    scoreElement.textContent = score;
    gameRunning = true;
    gameStarted = true;
    gameOverElement.style.display = 'none';
    restartBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    pauseBtn.textContent = '暂停';

    dx = 1;
    dy = 0;

    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
        score,
        highScore,
        difficulty: currentDifficulty,
        mapMode,
        updatedAt: Date.now()
    }));
    gameLoop();
}

window.get_game_meta = () => JSON.stringify({
    gameId: GAME_ID,
    version: 'v1',
    mode: mapMode
});

ensureMapButtons();
draw();

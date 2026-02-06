const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const GAME_ID = 'tetris';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`,
    progress: `${STORAGE_PREFIX}.progress`
};

const COLS = 10;
const ROWS = 20;
let BLOCK_SIZE = 20;
let NEXT_BLOCK_SIZE = 15;
let persistStatsTimer = null;

function persistStatsAsync() {
    if (persistStatsTimer) return;
    persistStatsTimer = setTimeout(() => {
        persistStatsTimer = null;
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
            score,
            lines,
            level,
            combo,
            backToBack,
            updatedAt: Date.now()
        }));
    }, 80);
}

// 响应式画布大小
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth;
    const isMobile = window.innerWidth <= 768;
    const sidePanelWidth = isMobile ? 66 : 74;

    const availableWidth = containerWidth - sidePanelWidth - (isMobile ? 6 : 20);

    const headerHeight = 40;
    const controlsHeight = isMobile ? 62 : 70;
    const hintHeight = isMobile ? 34 : 40;
    const sidePanelHeight = 0;
    const padding = isMobile ? 20 : 35;
    const availableHeight = window.innerHeight - headerHeight - controlsHeight - hintHeight - sidePanelHeight - padding;

    const maxBlockWidth = Math.floor(availableWidth / COLS);
    const maxBlockHeight = Math.floor(availableHeight / ROWS);
    BLOCK_SIZE = Math.min(maxBlockWidth, maxBlockHeight, 35);
    BLOCK_SIZE = Math.max(BLOCK_SIZE, 15);

    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    NEXT_BLOCK_SIZE = Math.floor(BLOCK_SIZE * (isMobile ? 0.48 : 0.75));
    nextCanvas.width = 4 * NEXT_BLOCK_SIZE;
    nextCanvas.height = 4 * NEXT_BLOCK_SIZE;
    holdCanvas.width = 4 * NEXT_BLOCK_SIZE;
    holdCanvas.height = 4 * NEXT_BLOCK_SIZE;

    if (board.length > 0) {
        drawBoard();
        drawNextPiece();
        drawHoldPiece();
    }
}

// 游戏状态变量
let board = [];
let currentPiece = null;
let nextPiece = null;
let heldPiece = null;
let canHold = true;
let score = 0;
let highScore = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gameLoopId = null;
let lastFrameTs = 0;
let dropAccumulator = 0;
let dropInterval = 1000;

// 锁定延迟系统：方块触底后独立计时，不等 dropInterval
const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;
let lockTimer = 0;
let lockMoves = 0;
let pieceGrounded = false;

// 连击系统
let combo = 0;
let backToBack = 0;

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 方块形状
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const COLORS = [
    '#00f0f0', '#f0f000', '#a000f0', '#f0a000',
    '#0000f0', '#00f000', '#f00000'
];

const savedHighScore = localStorage.getItem('tetrisHighScore');
if (savedHighScore) {
    highScore = parseInt(savedHighScore);
    highScoreElement.textContent = highScore;
}

function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[shapeIndex].map(r => r.slice()),
        color: COLORS[shapeIndex],
        shapeIndex: shapeIndex,
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
        y: 0
    };
}

function drawBlock(context, x, y, color, blockSize) {
    const padding = 1;
    context.fillStyle = color;
    context.fillRect(x * blockSize + padding, y * blockSize + padding, blockSize - padding * 2, blockSize - padding * 2);

    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(x * blockSize + padding, y * blockSize + padding, blockSize - padding * 2, 4);
    context.fillRect(x * blockSize + padding, y * blockSize + padding, 4, blockSize - padding * 2);
}

function drawBoard() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    // 已固定方块
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col], BLOCK_SIZE);
            }
        }
    }

    // 影子
    if (currentPiece) {
        let shadowY = currentPiece.y;
        while (!collision(currentPiece.shape, currentPiece.x, shadowY + 1)) {
            shadowY++;
        }
        drawPiece(ctx, currentPiece.shape, currentPiece.x, shadowY, currentPiece.color, BLOCK_SIZE, true);
    }

    // 当前方块
    if (currentPiece) {
        drawPiece(ctx, currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.color, BLOCK_SIZE, false);
    }
}

function drawPiece(context, shape, pieceX, pieceY, color, blockSize, isShadow) {
    shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                if (isShadow) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.18)';
                    context.fillRect(
                        (pieceX + dx) * blockSize + 1,
                        (pieceY + dy) * blockSize + 1,
                        blockSize - 2, blockSize - 2
                    );
                    // 虚线边框增强可见度
                    context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                    context.lineWidth = 1;
                    context.setLineDash([3, 2]);
                    context.strokeRect(
                        (pieceX + dx) * blockSize + 1.5,
                        (pieceY + dy) * blockSize + 1.5,
                        blockSize - 3, blockSize - 3
                    );
                    context.setLineDash([]);
                } else {
                    drawBlock(context, pieceX + dx, pieceY + dy, color, blockSize);
                }
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * NEXT_BLOCK_SIZE) / 2 / NEXT_BLOCK_SIZE;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * NEXT_BLOCK_SIZE) / 2 / NEXT_BLOCK_SIZE;
        drawPiece(nextCtx, nextPiece.shape, offsetX, offsetY, nextPiece.color, NEXT_BLOCK_SIZE, false);
    }
}

function drawHoldPiece() {
    holdCtx.fillStyle = '#111';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (heldPiece) {
        var shape = SHAPES[heldPiece.shapeIndex];
        var color = COLORS[heldPiece.shapeIndex];
        var offsetX = (holdCanvas.width - shape[0].length * NEXT_BLOCK_SIZE) / 2 / NEXT_BLOCK_SIZE;
        var offsetY = (holdCanvas.height - shape.length * NEXT_BLOCK_SIZE) / 2 / NEXT_BLOCK_SIZE;
        drawPiece(holdCtx, shape, offsetX, offsetY, canHold ? color : '#555', NEXT_BLOCK_SIZE, false);
    }
}

function collision(shape, pieceX, pieceY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = pieceX + x;
                const newY = pieceY + y;
                if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if (newY >= 0 && board[newY][newX]) return true;
            }
        }
    }
    return false;
}

function lockPiece() {
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                const y = currentPiece.y + dy;
                const x = currentPiece.x + dx;
                if (y >= 0) board[y][x] = currentPiece.color;
            }
        });
    });

    if (typeof GameAudio !== 'undefined') GameAudio.play('drop');
    canHold = true;
    clearLines();
    // 注意：spawnPiece 在 clearLines 内部调用（消行回调完成后）
    // 如果没有需要消除的行，clearLines 会直接调用 spawnPiece
}

function clearLines() {
    var rowsToClear = [];

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            rowsToClear.push(row);
        }
    }

    if (rowsToClear.length > 0) {
        combo++;

        // 播放消行音效
        if (typeof GameAudio !== 'undefined') {
            if (rowsToClear.length >= 4) {
                GameAudio.play('clear');
            } else {
                GameAudio.play('merge');
            }
        }

        // 显示连击提示
        if (combo >= 2) {
            showComboToast(combo, rowsToClear.length);
            if (typeof GameAudio !== 'undefined') GameAudio.play('combo');
        }

        // 先计分（立即更新，不等动画）
        var linesCleared = rowsToClear.length;
        var points = [0, 100, 300, 500, 1200];
        if (linesCleared >= 4) {
            backToBack += 1;
        } else {
            backToBack = 0;
        }
        var comboBonus = combo > 1 ? combo * 50 : 0;
        var b2bBonus = backToBack >= 2 ? 200 * (backToBack - 1) : 0;
        score += points[linesCleared] * level + comboBonus + b2bBonus;
        lines += linesCleared;

        var newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            if (typeof GameAudio !== 'undefined') GameAudio.play('upgrade');
        }

        scoreElement.textContent = score;
        levelElement.textContent = level;

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('tetrisHighScore', highScore);
            localStorage.setItem(STORAGE_KEYS.best, String(highScore));
        }
        persistStatsAsync();

        // 同步清行：不做异步动画，避免连击时调度抖动
        rowsToClear.sort((a, b) => b - a);
        for (var i = 0; i < rowsToClear.length; i++) {
            board.splice(rowsToClear[i], 1);
            board.unshift(Array(COLS).fill(0));
        }
        spawnPiece();
    } else {
        combo = 0;
        // 没有消行时直接生成新方块
        spawnPiece();
    }
}

function showComboToast(comboCount, linesCleared) {
    var label = '';
    if (linesCleared >= 4) label = 'TETRIS! ';
    label += comboCount + ' 连击!';

    var toast = document.createElement('div');
    toast.className = 'combo-toast';
    toast.textContent = label;
    document.body.appendChild(toast);
    setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 1100);
}

function spawnPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    lockTimer = 0;
    lockMoves = 0;
    drawNextPiece();

    if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        gameOverHandler();
    }
}

// Hold 功能
function holdPieceFn() {
    if (!gameRunning || !currentPiece || !canHold) return;

    if (typeof GameAudio !== 'undefined') GameAudio.play('select');

    if (heldPiece) {
        // 交换当前和暂存
        var temp = { shapeIndex: currentPiece.shapeIndex };
        currentPiece = {
            shape: SHAPES[heldPiece.shapeIndex].map(r => r.slice()),
            color: COLORS[heldPiece.shapeIndex],
            shapeIndex: heldPiece.shapeIndex,
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[heldPiece.shapeIndex][0].length / 2),
            y: 0
        };
        heldPiece = temp;
    } else {
        heldPiece = { shapeIndex: currentPiece.shapeIndex };
        spawnPiece();
    }
    canHold = false;
    drawHoldPiece();
    drawBoard();
}

// 移动/旋转时重置锁定计时器（允许玩家在触底后调整位置）
function resetLockIfGrounded() {
    if (currentPiece && collision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        if (lockMoves < MAX_LOCK_RESETS) {
            lockTimer = 0;
            lockMoves++;
        }
    }
}

function moveLeftFn() {
    if (!gameRunning || !currentPiece) return;
    if (!collision(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
        if (typeof GameAudio !== 'undefined') GameAudio.play('move');
        resetLockIfGrounded();
        drawBoard();
    }
}

function moveRightFn() {
    if (!gameRunning || !currentPiece) return;
    if (!collision(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
        if (typeof GameAudio !== 'undefined') GameAudio.play('move');
        resetLockIfGrounded();
        drawBoard();
    }
}

function moveDownFn(isManual) {
    if (!gameRunning || !currentPiece) return;
    if (!collision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        // 软降（玩家主动按下）每格 +1 分
        if (isManual) {
            score += 1;
            scoreElement.textContent = score;
        }
        drawBoard();
    } else {
        lockPiece();
        drawBoard();
    }
}

function hardDropFn() {
    if (!gameRunning || !currentPiece) return;
    while (!collision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        score += 2;
    }
    scoreElement.textContent = score;
    lockPiece();
    drawBoard();
}

function rotateFn() {
    if (!gameRunning || !currentPiece) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );

    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
        if (!collision(rotated, currentPiece.x + kick, currentPiece.y)) {
            currentPiece.shape = rotated;
            currentPiece.x += kick;
            if (typeof GameAudio !== 'undefined') GameAudio.play('click');
            resetLockIfGrounded();
            drawBoard();
            return;
        }
    }
}

function gameOverHandler() {
    gameRunning = false;
    startBtn.style.display = 'inline-block';
    gameOverElement.style.display = 'block';
    gameOverElement.className = 'game-over show';
    gameOverElement.textContent = '游戏结束！得分: ' + score;
    if (typeof GameAudio !== 'undefined') GameAudio.play('lose');
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    if (!lastFrameTs) lastFrameTs = timestamp;
    const frameDelta = Math.min(50, timestamp - lastFrameTs);
    lastFrameTs = timestamp;
    dropAccumulator += frameDelta;

    // 检测方块是否触底
    var grounded = currentPiece && collision(currentPiece.shape, currentPiece.x, currentPiece.y + 1);

    if (grounded) {
        // 方块触底：使用独立的锁定计时器（比 dropInterval 更短）
        lockTimer += frameDelta;
        if (lockTimer >= Math.min(dropInterval, LOCK_DELAY)) {
            moveDownFn(false); // 触发 lockPiece
            dropAccumulator = 0;
            lockTimer = 0;
            if (!gameRunning) return;
        }
    } else {
        lockTimer = 0;
        // 正常重力下落
        while (dropAccumulator >= dropInterval) {
            moveDownFn(false);
            dropAccumulator -= dropInterval;
            if (!gameRunning) return;
        }
    }

    gameLoopId = requestAnimationFrame(gameLoop);
}

function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    combo = 0;
    backToBack = 0;
    heldPiece = null;
    canHold = true;
    dropInterval = 1000;
    lockTimer = 0;
    lockMoves = 0;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameOverElement.style.display = 'none';
    gameOverElement.className = 'game-over';
    startBtn.style.display = 'none';

    spawnPiece();
    drawBoard();
    drawNextPiece();
    drawHoldPiece();

    gameRunning = true;
    lastFrameTs = 0;
    dropAccumulator = 0;
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({
        mode: 'playing',
        updatedAt: Date.now()
    }));
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch (e.keyCode) {
        case 37: e.preventDefault(); moveLeftFn(); break;
        case 39: e.preventDefault(); moveRightFn(); break;
        case 40: e.preventDefault(); moveDownFn(true); break;
        case 38: e.preventDefault(); rotateFn(); break;
        case 32: e.preventDefault(); hardDropFn(); break;
        case 67: // C - hold
        case 16: // Shift - hold
            e.preventDefault(); holdPieceFn(); break;
    }
});

// 触摸控制
let touchStartX = 0;
let touchStartY = 0;
let lastMoveX = 0;
let moveThrottle = null;
let moveDirection = null;
const MOVE_THRESHOLD = 20;
const THROTTLE_MS = 50;

document.querySelectorAll('.controls button, #startBtn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => { e.stopPropagation(); }, {capture: true});
    btn.addEventListener('touchend', (e) => { e.stopPropagation(); }, {capture: true});
    btn.addEventListener('touchmove', (e) => { e.stopPropagation(); }, {capture: true});
});

document.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    lastMoveX = touchStartX;
    moveDirection = null;
}, {passive: true});

document.addEventListener('touchmove', (e) => {
    if (e.target.closest('button')) return;
    if (!gameRunning || !currentPiece) return;

    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        const newDirection = diffX > 0 ? 'right' : 'left';
        if (moveDirection !== newDirection) {
            moveDirection = newDirection;
            lastMoveX = currentX;
        }
        const moveDistance = Math.abs(currentX - lastMoveX);
        if (moveDistance >= MOVE_THRESHOLD) {
            if (!moveThrottle) {
                if (moveDirection === 'right') moveRightFn();
                else moveLeftFn();
                lastMoveX = currentX;
                moveThrottle = setTimeout(() => { moveThrottle = null; }, THROTTLE_MS);
            }
        }
    }
}, {passive: false});

document.addEventListener('touchend', (e) => {
    if (e.target.closest('button')) return;
    if (!gameRunning || !currentPiece) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const minSwipe = 30;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipe) {
        if (diffY > 0) hardDropFn();
        else rotateFn();
    }

    moveDirection = null;
    moveThrottle = null;
}, {passive: false});

canvas.addEventListener('click', () => {
    if (!gameRunning && !currentPiece) startGame();
});

startBtn.addEventListener('click', startGame);
startBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    startGame();
}, {passive: false});

// 导出对象供移动端按钮使用
const tetris = {
    moveLeft: moveLeftFn,
    moveRight: moveRightFn,
    moveDown: function() { moveDownFn(true); },
    rotate: rotateFn,
    holdPiece: holdPieceFn
};

window.render_game_to_text = () => JSON.stringify({
    coordinateSystem: 'board[row][col], origin top-left',
    mode: gameRunning ? 'playing' : 'idle',
    score,
    highScore,
    level,
    lines,
    combo,
    backToBack,
    currentPiece: currentPiece ? { x: currentPiece.x, y: currentPiece.y, shapeIndex: currentPiece.shapeIndex } : null
});

window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.floor(ms / Math.max(100, dropInterval)));
    for (let i = 0; i < steps; i++) {
        if (gameRunning) {
            moveDownFn(false);
        }
    }
};

window.get_game_meta = () => JSON.stringify({
    gameId: GAME_ID,
    version: 'v1',
    mode: 'classic'
});

initBoard();
drawBoard();
drawNextPiece();
drawHoldPiece();

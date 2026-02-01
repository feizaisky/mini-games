const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');

// 响应式画布大小
function resizeCanvas() {
    const containerWidth = document.querySelector('.game-container').clientWidth - 60;
    if (window.innerWidth <= 768 && containerWidth < 150) {
        const scale = containerWidth / 150;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = (300 * scale) + 'px';
    } else {
        canvas.style.width = '150px';
        canvas.style.height = '300px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 15;
const NEXT_BLOCK_SIZE = 12;

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

// 方块颜色
const COLORS = [
    '#00f0f0', // I - 青色
    '#f0f000', // O - 黄色
    '#a000f0', // T - 紫色
    '#f0a000', // L - 橙色
    '#0000f0', // J - 蓝色
    '#00f000', // S - 绿色
    '#f00000'  // Z - 红色
];

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let highScore = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gameLoopId = null;
let dropInterval = 1000;

// 从 localStorage 读取最高分
const savedHighScore = localStorage.getItem('tetrisHighScore');
if (savedHighScore) {
    highScore = parseInt(savedHighScore);
    highScoreElement.textContent = highScore;
}

// 初始化游戏板
function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

// 创建新方块
function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[shapeIndex],
        color: COLORS[shapeIndex],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
        y: 0
    };
}

// 绘制方块
function drawBlock(ctx, x, y, color, blockSize) {
    const padding = 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, blockSize - padding * 2, blockSize - padding * 2);

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, blockSize - padding * 2, 4);
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, 4, blockSize - padding * 2);
}

// 绘制游戏板
function drawBoard() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
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

    // 绘制已固定的方块
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col], BLOCK_SIZE);
            }
        }
    }

    // 绘制当前方块的影子
    if (currentPiece) {
        let shadowY = currentPiece.y;
        while (!collision(currentPiece.shape, currentPiece.x, shadowY + 1)) {
            shadowY++;
        }
        drawPiece(ctx, currentPiece.shape, currentPiece.x, shadowY, currentPiece.color, BLOCK_SIZE, true);
    }

    // 绘制当前方块
    if (currentPiece) {
        drawPiece(ctx, currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.color, BLOCK_SIZE, false);
    }
}

// 绘制方块
function drawPiece(context, shape, pieceX, pieceY, color, blockSize, isShadow) {
    shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                if (isShadow) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    context.fillRect(
                        (pieceX + dx) * blockSize + 1,
                        (pieceY + dy) * blockSize + 1,
                        blockSize - 2,
                        blockSize - 2
                    );
                } else {
                    drawBlock(context, pieceX + dx, pieceY + dy, color, blockSize);
                }
            }
        });
    });
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * NEXT_BLOCK_SIZE) / 2 / NEXT_BLOCK_SIZE;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * NEXT_BLOCK_SIZE) / 2 / NEXT_BLOCK_SIZE;
        drawPiece(nextCtx, nextPiece.shape, offsetX, offsetY, nextPiece.color, NEXT_BLOCK_SIZE, false);
    }
}

// 碰撞检测
function collision(shape, pieceX, pieceY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = pieceX + x;
                const newY = pieceY + y;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 固定方块到游戏板
function lockPiece() {
    currentPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                const y = currentPiece.y + dy;
                const x = currentPiece.x + dx;
                if (y >= 0) {
                    board[y][x] = currentPiece.color;
                }
            }
        });
    });

    clearLines();
    spawnPiece();
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }

    if (linesCleared > 0) {
        // 计分
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;
        lines += linesCleared;

        // 升级
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }

        scoreElement.textContent = score;
        levelElement.textContent = level;

        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('tetrisHighScore', highScore);
        }
    }
}

// 生成新方块
function spawnPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    drawNextPiece();

    if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        gameOver();
    }
}

// 移动方块
function moveLeft() {
    if (!gameRunning || !currentPiece) return;
    if (!collision(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
        drawBoard();
    }
}

function moveRight() {
    if (!gameRunning || !currentPiece) return;
    if (!collision(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
        drawBoard();
    }
}

function moveDown() {
    if (!gameRunning || !currentPiece) return;
    if (!collision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        drawBoard();
    } else {
        lockPiece();
        drawBoard();
    }
}

function hardDrop() {
    if (!gameRunning || !currentPiece) return;
    while (!collision(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        score += 2;
    }
    scoreElement.textContent = score;
    lockPiece();
    drawBoard();
}

// 旋转方块
function rotate() {
    if (!gameRunning || !currentPiece) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );

    // 墙踢 - 尝试调整位置以适应旋转
    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
        if (!collision(rotated, currentPiece.x + kick, currentPiece.y)) {
            currentPiece.shape = rotated;
            currentPiece.x += kick;
            drawBoard();
            return;
        }
    }
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    startBtn.style.display = 'inline-block';
    gameOverElement.style.display = 'block';
    if (gameLoopId) {
        clearTimeout(gameLoopId);
    }
}

// 游戏循环
function gameLoop() {
    if (!gameRunning) return;

    moveDown();
    gameLoopId = setTimeout(gameLoop, dropInterval);
}

// 开始游戏
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameOverElement.style.display = 'none';
    startBtn.style.display = 'none';

    spawnPiece();
    drawBoard();
    drawNextPiece();

    gameRunning = true;
    gameLoop();
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch (e.keyCode) {
        case 37: // Left
            e.preventDefault();
            moveLeft();
            break;
        case 39: // Right
            e.preventDefault();
            moveRight();
            break;
        case 40: // Down
            e.preventDefault();
            moveDown();
            break;
        case 38: // Up - Rotate
            e.preventDefault();
            rotate();
            break;
        case 32: // Space - Hard drop
            e.preventDefault();
            hardDrop();
            break;
    }
});

// 触摸控制 - 全屏滑动
let touchStartX = 0;
let touchStartY = 0;

// 阻止按钮上的触摸事件传播到滑动控制
document.querySelectorAll('.controls button, #startBtn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, {capture: true});
    btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
    }, {capture: true});
    btn.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, {capture: true});
});

// 全屏触摸控制
document.addEventListener('touchstart', (e) => {
    // 如果点击的是按钮，不处理
    if (e.target.closest('button')) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: true});

document.addEventListener('touchend', (e) => {
    // 如果点击的是按钮，不处理
    if (e.target.closest('button')) return;

    if (!gameRunning || !currentPiece) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    const minSwipe = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipe) {
            if (diffX > 0) {
                moveRight();
            } else {
                moveLeft();
            }
        }
    } else {
        if (Math.abs(diffY) > minSwipe) {
            if (diffY > 0) {
                hardDrop();
            } else {
                rotate();
            }
        }
    }
}, {passive: false});

// 点击画布开始游戏
canvas.addEventListener('click', () => {
    if (!gameRunning && !currentPiece) {
        startGame();
    }
});

startBtn.addEventListener('click', startGame);

// 导出 tetris 对象供移动端控制使用
const tetris = {
    moveLeft,
    moveRight,
    moveDown,
    rotate
};

// 初始画面
initBoard();
drawBoard();
drawNextPiece();

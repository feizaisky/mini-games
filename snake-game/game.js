const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');

// 响应式画布大小
function resizeCanvas() {
    if (window.innerWidth <= 768) {
        const containerWidth = document.querySelector('.game-container').clientWidth - 30;
        if (containerWidth < 400) {
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = containerWidth + 'px';
        }
    } else {
        canvas.style.width = '400px';
        canvas.style.height = '400px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};
let dx = 0;
let dy = 0;
let score = 0;
let gameRunning = false;
let gameStarted = false;
let gameSpeed = 100;
let gameLoopId = null;
let highScore = 0;

// 从 localStorage 读取最高分
const savedHighScore = localStorage.getItem('snakeHighScore');
if (savedHighScore) {
    highScore = parseInt(savedHighScore);
}
highScoreElement.textContent = highScore;

document.addEventListener('keydown', changeDirection);
restartBtn.addEventListener('click', resetGame);
startBtn.addEventListener('click', startGame);

// 触摸支持 - 优化微信环境
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // 最小滑动距离

// 防止微信长按弹出菜单 - 但不影响画布和按钮
document.addEventListener('contextmenu', function(e) {
    // 允许画布和按钮的默认行为
    if (e.target.tagName === 'CANVAS' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
    }
    e.preventDefault();
    return false;
});

// 防止双击缩放 - 但不影响按钮点击
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    // 如果点击的是按钮，不阻止默认行为
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
    }
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: false});

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault(); // 防止滑动时页面滚动
}, {passive: false});

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (!gameRunning) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // 只有滑动距离超过阈值才响应
    if (Math.abs(diffX) < minSwipeDistance && Math.abs(diffY) < minSwipeDistance) {
        return;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // 水平滑动
        if (diffX > 0 && dx !== -1) {
            dx = 1; dy = 0;
        } else if (diffX < 0 && dx !== 1) {
            dx = -1; dy = 0;
        }
    } else {
        // 垂直滑动
        if (diffY > 0 && dy !== -1) {
            dx = 0; dy = 1;
        } else if (diffY < 0 && dy !== 1) {
            dx = 0; dy = -1;
        }
    }
}, {passive: false});

// 鼠标点击支持
canvas.addEventListener('click', function(e) {
    if (!gameStarted) {
        startGame();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const snakeHead = snake[0];

    const headX = snakeHead.x * gridSize + gridSize/2;
    const headY = snakeHead.y * gridSize + gridSize/2;

    const diffX = clickX - headX;
    const diffY = clickY - headY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && dx !== -1) {
            dx = 1; dy = 0;
        } else if (diffX < 0 && dx !== 1) {
            dx = -1; dy = 0;
        }
    } else {
        if (diffY > 0 && dy !== -1) {
            dx = 0; dy = 1;
        } else if (diffY < 0 && dy !== 1) {
            dx = 0; dy = -1;
        }
    }
});

function startGame() {
    gameStarted = true;
    gameRunning = true;
    startBtn.style.display = 'none';
    // 设置初始移动方向
    dx = 1;
    dy = 0;
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    gameLoopId = setTimeout(gameLoop, gameSpeed);
}

function update() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // 检查撞墙
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    // 检查撞自己
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }

    snake.unshift(head);

    // 检查吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        generateFood();
        // 加速
        if (gameSpeed > 50) {
            gameSpeed -= 2;
        }
    } else {
        snake.pop();
    }
}

function draw() {
    // 清空画布
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画蛇
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
            // 蛇头
            gradient.addColorStop(0, '#27ae60');
            gradient.addColorStop(1, '#1e8449');
        } else {
            // 蛇身
            const alpha = 1 - (index / snake.length) * 0.5;
            gradient.addColorStop(0, `rgba(46, 204, 113, ${alpha})`);
            gradient.addColorStop(1, `rgba(39, 174, 96, ${alpha})`);
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

        // 画眼睛
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize/3,
                segment.y * gridSize + gridSize/3,
                3, 0, Math.PI * 2
            );
            ctx.arc(
                segment.x * gridSize + gridSize*2/3,
                segment.y * gridSize + gridSize/3,
                3, 0, Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(
                segment.x * gridSize + gridSize/3,
                segment.y * gridSize + gridSize/3,
                1.5, 0, Math.PI * 2
            );
            ctx.arc(
                segment.x * gridSize + gridSize*2/3,
                segment.y * gridSize + gridSize/3,
                1.5, 0, Math.PI * 2
            );
            ctx.fill();
        }
    });

    // 画食物
    const foodGradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        0,
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2
    );
    foodGradient.addColorStop(0, '#e74c3c');
    foodGradient.addColorStop(1, '#c0392b');

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0, Math.PI * 2
    );
    ctx.fill();

    // 食物高光
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2 - 3,
        food.y * gridSize + gridSize/2 - 3,
        3,
        0, Math.PI * 2
    );
    ctx.fill();
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    // 确保食物不在蛇身上
    for (let segment of snake) {
        if (segment.x === food.x && food.y === segment.y) {
            generateFood();
            return;
        }
    }
}

function changeDirection(event) {
    if (!gameRunning) return;

    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }

    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }

    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }

    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
}

function endGame() {
    gameRunning = false;
    gameStarted = false;
    gameOverElement.style.display = 'block';
    restartBtn.style.display = 'inline-block';
    if (gameLoopId) {
        clearTimeout(gameLoopId);
    }
}

function resetGame() {
    snake = [{x: 10, y: 10}];
    food = {x: 15, y: 15};
    dx = 0;
    dy = 0;
    score = 0;
    gameSpeed = 100;
    scoreElement.textContent = score;
    gameRunning = true;
    gameStarted = true;
    gameOverElement.style.display = 'none';
    restartBtn.style.display = 'none';

    // 自动开始移动
    dx = 1;
    dy = 0;

    gameLoop();
}

// 初始画面
draw();

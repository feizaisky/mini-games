const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('bestScore');
const gameOverElement = document.getElementById('gameOver');
const gameWonElement = document.getElementById('gameWon');
const newGameBtn = document.getElementById('newGameBtn');
const normalBtn = document.getElementById('normalBtn');
const advancedBtn = document.getElementById('advancedBtn');

const SIZE = 4;
let grid = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore2048') || 0;
let gameOver = false;
let gameWon = false;
let continueAfterWin = false;
let gameMode = localStorage.getItem('gameMode2048') || 'normal'; // 'normal' or 'advanced'

bestScoreElement.textContent = bestScore;

newGameBtn.addEventListener('click', newGame);

// 设置游戏模式
function setGameMode(mode) {
    gameMode = mode;
    localStorage.setItem('gameMode2048', mode);

    // 更新按钮状态
    if (mode === 'normal') {
        normalBtn.classList.add('selected');
        advancedBtn.classList.remove('selected');
    } else {
        normalBtn.classList.remove('selected');
        advancedBtn.classList.add('selected');
    }

    newGame();
}

// 初始化模式按钮状态
function initModeButtons() {
    if (gameMode === 'advanced') {
        normalBtn.classList.remove('selected');
        advancedBtn.classList.add('selected');
    }
}

// 初始化游戏
function init() {
    gridElement.innerHTML = '';
    for (let i = 0; i < SIZE * SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        gridElement.appendChild(cell);
    }
    initModeButtons();
    newGame();
}

function newGame() {
    grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
    score = 0;
    gameOver = false;
    gameWon = false;
    continueAfterWin = false;
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    gameWonElement.style.display = 'none';
    newGameBtn.textContent = '新游戏';

    addRandomTile();
    addRandomTile();
    updateDisplay();
}

function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) {
                emptyCells.push({r, c});
            }
        }
    }
    if (emptyCells.length > 0) {
        const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];

        if (gameMode === 'normal') {
            // 普通模式：90%概率生成2，10%概率生成4
            grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        } else {
            // 高级模式：可以生成2、4或8
            const rand = Math.random();
            if (rand < 0.6) {
                grid[r][c] = 2;      // 60%概率生成2
            } else if (rand < 0.9) {
                grid[r][c] = 4;      // 30%概率生成4
            } else {
                grid[r][c] = 8;      // 10%概率生成8
            }
        }
    }
}

function updateDisplay() {
    const cells = gridElement.children;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const value = grid[r][c];
            const cell = cells[r * SIZE + c];
            cell.textContent = value || '';
            cell.className = 'grid-cell';
            if (value) {
                if (value <= 2048) {
                    cell.classList.add(`tile-${value}`);
                } else {
                    cell.classList.add('tile-super');
                }
            }
        }
    }
}

// 滑动一行到左边
function slideLeft(row) {
    // 移除零
    let arr = row.filter(val => val !== 0);

    // 合并
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            scoreElement.textContent = score;
            arr.splice(i + 1, 1);

            if (arr[i] === 2048 && !gameWon && !continueAfterWin) {
                gameWon = true;
                gameWonElement.style.display = 'block';
                newGameBtn.textContent = '继续游戏';
            }
        }
    }

    // 补齐零
    while (arr.length < SIZE) {
        arr.push(0);
    }

    return arr;
}

function moveLeft() {
    for (let r = 0; r < SIZE; r++) {
        grid[r] = slideLeft(grid[r]);
    }
}

function moveRight() {
    for (let r = 0; r < SIZE; r++) {
        grid[r] = slideLeft(grid[r].reverse()).reverse();
    }
}

function moveUp() {
    for (let c = 0; c < SIZE; c++) {
        // 提取列
        let col = [];
        for (let r = 0; r < SIZE; r++) {
            col.push(grid[r][c]);
        }
        // 滑动
        col = slideLeft(col);
        // 放回列
        for (let r = 0; r < SIZE; r++) {
            grid[r][c] = col[r];
        }
    }
}

function moveDown() {
    for (let c = 0; c < SIZE; c++) {
        // 提取列并反转
        let col = [];
        for (let r = 0; r < SIZE; r++) {
            col.push(grid[r][c]);
        }
        // 反转、滑动、再反转
        col = slideLeft(col.reverse()).reverse();
        // 放回列
        for (let r = 0; r < SIZE; r++) {
            grid[r][c] = col[r];
        }
    }
}

function move(direction) {
    if (gameOver) return;

    // 如果赢了但选择不继续
    if (gameWon && !continueAfterWin) {
        continueAfterWin = true;
        gameWonElement.style.display = 'none';
        newGameBtn.textContent = '新游戏';
    }

    let oldGrid = JSON.stringify(grid);

    if (direction === 'left') {
        moveLeft();
    } else if (direction === 'right') {
        moveRight();
    } else if (direction === 'up') {
        moveUp();
    } else if (direction === 'down') {
        moveDown();
    }

    if (JSON.stringify(grid) !== oldGrid) {
        addRandomTile();
        updateDisplay();

        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('bestScore2048', bestScore);
        }

        if (isGameOver()) {
            gameOver = true;
            gameOverElement.style.display = 'block';
        }
    }
}

function isGameOver() {
    // 检查是否有空格
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) return false;
        }
    }

    // 检查是否可以合并
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
            if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
        }
    }

    return true;
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    const keyMap = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    if (keyMap[e.keyCode]) {
        e.preventDefault();
        move(keyMap[e.keyCode]);
    }
});

// 触摸控制
let touchStartX = 0;
let touchStartY = 0;

const gameContainer = document.querySelector('.game-container');

gameContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: true});

gameContainer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    const minSwipe = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipe) {
            move(diffX > 0 ? 'right' : 'left');
        }
    } else {
        if (Math.abs(diffY) > minSwipe) {
            move(diffY > 0 ? 'down' : 'up');
        }
    }
}, {passive: true});

// 启动游戏
init();

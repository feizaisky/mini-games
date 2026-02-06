const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('bestScore');
const gameOverElement = document.getElementById('gameOver');
const gameWonElement = document.getElementById('gameWon');
const newGameBtn = document.getElementById('newGameBtn');
const normalBtn = document.getElementById('normalBtn');
const advancedBtn = document.getElementById('advancedBtn');
const undoBtn = document.getElementById('undoBtn');
const undoCountElement = document.getElementById('undoCount');

const SIZE = 4;
let grid = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore2048') || 0;
let gameOver = false;
let gameWon = false;
let continueAfterWin = false;
let gameMode = localStorage.getItem('gameMode2048') || 'normal';

// 撤销系统
const MAX_UNDOS = 3;
let undosLeft = MAX_UNDOS;
let history = []; // 存放 {grid, score} 快照
let mergedCells = []; // 本次操作中合并的格子
let newTilePos = null; // 本次新增方块的位置
let recordShown = false; // 是否已显示过新纪录提示

bestScoreElement.textContent = bestScore;

newGameBtn.addEventListener('click', function() {
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    newGame();
});

undoBtn.addEventListener('click', function() {
    if (typeof GameAudio !== 'undefined') GameAudio.play('undo');
    undoMove();
});

// 设置游戏模式
function setGameMode(mode) {
    gameMode = mode;
    localStorage.setItem('gameMode2048', mode);

    if (mode === 'normal') {
        normalBtn.classList.add('selected');
        advancedBtn.classList.remove('selected');
    } else {
        normalBtn.classList.remove('selected');
        advancedBtn.classList.add('selected');
    }
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    newGame();
}

// 暴露到全局供 HTML onclick 使用
window.setGameMode = setGameMode;

function initModeButtons() {
    if (gameMode === 'advanced') {
        normalBtn.classList.remove('selected');
        advancedBtn.classList.add('selected');
    }
}

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
    undosLeft = MAX_UNDOS;
    history = [];
    recordShown = false;
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    gameWonElement.style.display = 'none';
    newGameBtn.textContent = '新游戏';
    updateUndoBtn();

    addRandomTile();
    addRandomTile();
    updateDisplay();
}

function saveState() {
    history.push({
        grid: grid.map(row => row.slice()),
        score: score
    });
    // 只保留最近 10 步
    if (history.length > 10) history.shift();
}

function undoMove() {
    if (undosLeft <= 0 || history.length === 0 || gameOver) return;

    const state = history.pop();
    grid = state.grid;
    score = state.score;
    scoreElement.textContent = score;
    gameOver = false;
    gameOverElement.style.display = 'none';
    undosLeft--;
    updateUndoBtn();
    updateDisplay();
}

function updateUndoBtn() {
    undoCountElement.textContent = undosLeft;
    undoBtn.disabled = undosLeft <= 0 || history.length === 0;
    undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
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
            grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        } else {
            const rand = Math.random();
            if (rand < 0.6) grid[r][c] = 2;
            else if (rand < 0.9) grid[r][c] = 4;
            else grid[r][c] = 8;
        }
        newTilePos = { r, c };
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
                    cell.classList.add('tile-' + value);
                } else {
                    cell.classList.add('tile-super');
                }
            }
            // 合并动画
            if (mergedCells.some(m => m.r === r && m.c === c)) {
                cell.classList.add('tile-merged');
            }
            // 新方块动画
            if (newTilePos && newTilePos.r === r && newTilePos.c === c) {
                cell.classList.add('tile-new');
            }
        }
    }
    mergedCells = [];
    newTilePos = null;
}

function slideLeft(row, rowIndex) {
    let arr = row.filter(val => val !== 0);

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            scoreElement.textContent = score;
            arr.splice(i + 1, 1);

            // 记录合并位置
            if (rowIndex !== undefined) {
                mergedCells.push({ r: rowIndex, c: i });
            }

            if (arr[i] === 2048 && !gameWon && !continueAfterWin) {
                gameWon = true;
                gameWonElement.style.display = 'block';
                newGameBtn.textContent = '继续游戏';
                if (typeof GameAudio !== 'undefined') GameAudio.play('win');
                if (typeof GameCelebration !== 'undefined') GameCelebration.show();
            }
        }
    }

    while (arr.length < SIZE) arr.push(0);
    return arr;
}

function moveLeft() {
    for (let r = 0; r < SIZE; r++) {
        grid[r] = slideLeft(grid[r], r);
    }
}

function moveRight() {
    for (let r = 0; r < SIZE; r++) {
        const reversed = grid[r].slice().reverse();
        const slid = slideLeft(reversed, r);
        grid[r] = slid.reverse();
        // 修正合并位置 (反转后列索引需要镜像)
        mergedCells = mergedCells.map(m => {
            if (m.r === r) {
                return { r: m.r, c: SIZE - 1 - m.c };
            }
            return m;
        });
    }
}

function moveUp() {
    for (let c = 0; c < SIZE; c++) {
        let col = [];
        for (let r = 0; r < SIZE; r++) col.push(grid[r][c]);
        col = slideLeft(col, -1); // -1 临时标记
        // 替换合并位置中的 -1 行号为实际行号
        mergedCells = mergedCells.map(m => {
            if (m.r === -1) {
                return { r: m.c, c: c };
            }
            return m;
        });
        for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
    }
}

function moveDown() {
    for (let c = 0; c < SIZE; c++) {
        let col = [];
        for (let r = 0; r < SIZE; r++) col.push(grid[r][c]);
        col.reverse();
        col = slideLeft(col, -2);
        col.reverse();
        mergedCells = mergedCells.map(m => {
            if (m.r === -2) {
                return { r: SIZE - 1 - m.c, c: c };
            }
            return m;
        });
        for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
    }
}

function showNewRecordToast() {
    if (recordShown) return;
    recordShown = true;
    const toast = document.createElement('div');
    toast.className = 'new-record-toast';
    toast.textContent = '新纪录！';
    document.body.appendChild(toast);
    if (typeof GameAudio !== 'undefined') GameAudio.play('record');
    setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 1600);
}

function move(direction) {
    if (gameOver) return;

    if (gameWon && !continueAfterWin) {
        continueAfterWin = true;
        gameWonElement.style.display = 'none';
        newGameBtn.textContent = '新游戏';
    }

    // 保存状态用于撤销
    saveState();

    let oldGrid = JSON.stringify(grid);
    mergedCells = [];

    if (direction === 'left') moveLeft();
    else if (direction === 'right') moveRight();
    else if (direction === 'up') moveUp();
    else if (direction === 'down') moveDown();

    if (JSON.stringify(grid) !== oldGrid) {
        // 有合并则播放合并音效
        if (mergedCells.length > 0) {
            if (typeof GameAudio !== 'undefined') GameAudio.play('merge');
        } else {
            if (typeof GameAudio !== 'undefined') GameAudio.play('move');
        }

        addRandomTile();
        updateDisplay();
        updateUndoBtn();

        let prevBest = bestScore;
        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('bestScore2048', bestScore);

            // 新纪录提示（仅第一次超越时）
            if (prevBest > 0 && score > prevBest) {
                showNewRecordToast();
            }
        }

        if (isGameOver()) {
            gameOver = true;
            gameOverElement.style.display = 'block';
            if (typeof GameAudio !== 'undefined') GameAudio.play('lose');
        }
    } else {
        // 没有变化，移除刚保存的状态
        history.pop();
    }
}

function isGameOver() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) return false;
        }
    }
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
        37: 'left', 38: 'up', 39: 'right', 40: 'down'
    };
    if (keyMap[e.keyCode]) {
        e.preventDefault();
        move(keyMap[e.keyCode]);
    }
    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoMove();
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

init();

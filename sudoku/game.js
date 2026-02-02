// 游戏状态
let board = [];
let solution = [];
let initialNumbers = []; // 标记初始数字（不可编辑）
let selectedCell = null;
let gameStarted = false;
let gameTimer = null;
let seconds = 0;
let currentDifficulty = 'easy';

// 难度配置（移除的数字数量）
const difficultyConfig = {
    easy: 35,
    medium: 45,
    hard: 55
};

// 初始化游戏
function initGame() {
    createBoard();
    updateBestScore();
    updateGamesWon();
    setupDifficultyButtons();
    newGame();
}

// 创建棋盘
function createBoard() {
    const sudokuBoard = document.getElementById('sudokuBoard');
    sudokuBoard.innerHTML = '';

    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => selectCell(i));
        sudokuBoard.appendChild(cell);
    }
}

// 难度按钮设置
function setupDifficultyButtons() {
    const buttons = document.querySelectorAll('.difficulty-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            currentDifficulty = this.dataset.difficulty;
            newGame();
        });
    });
}

// 新游戏
function newGame() {
    // 生成完整的数独
    solution = generateSolvedBoard();

    // 复制并挖空
    board = solution.map(row => [...row]);
    const removeCount = difficultyConfig[currentDifficulty];
    removeNumbers(board, removeCount);

    // 标记哪些是初始数字（非挖空的）
    initialNumbers = Array(9).fill(null).map(() => Array(9).fill(false));
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] !== 0) {
                initialNumbers[i][j] = true;
            }
        }
    }

    // 重置状态
    selectedCell = null;
    seconds = 0;
    gameStarted = false;

    // 停止计时器
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    renderBoard();
    updateTimer();
}

// 生成已解开的数独
function generateSolvedBoard() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    fillBoard(board);
    return board;
}

// 填充棋盘
function fillBoard(board) {
    const emptyCell = findEmpty(board);
    if (!emptyCell) return true;

    const [row, col] = emptyCell;
    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (let num of numbers) {
        if (isValidMove(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
        }
    }

    return false;
}

// 查找空格
function findEmpty(board) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) return [i, j];
        }
    }
    return null;
}

// 验证移动
function isValidMove(board, row, col, num) {
    // 检查行
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
    }

    // 检查列
    for (let i = 0; i < 9; i++) {
        if (board[i][col] === num) return false;
    }

    // 检查3x3宫格
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[boxRow + i][boxCol + j] === num) return false;
        }
    }

    return true;
}

// 移除数字（按九宫格轮流随机选格，保证初始数字均匀分布在全盘）
function removeNumbers(board, count) {
    // 9 个 3x3 宫格的格子坐标
    const blocks = [];
    for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
            const cellList = [];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    cellList.push([br * 3 + i, bc * 3 + j]);
                }
            }
            blocks.push(cellList);
        }
    }
    // 每个宫格内打乱顺序
    for (let i = 0; i < blocks.length; i++) {
        blocks[i] = shuffle(blocks[i]);
    }

    // 轮流从各宫格取一格移除，保证上下左右都有被挖的格
    let removed = 0;
    let blockIndex = 0;
    const indices = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 每个宫格已取到第几个
    while (removed < count) {
        const block = blocks[blockIndex];
        const pos = indices[blockIndex];
        if (pos < block.length) {
            const [row, col] = block[pos];
            board[row][col] = 0;
            removed++;
            indices[blockIndex]++;
        }
        blockIndex = (blockIndex + 1) % 9;
    }
}

// 打乱数组
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 渲染棋盘
function renderBoard() {
    const cells = document.querySelectorAll('.cell');

    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const value = board[row][col];
        const cell = cells[i];

        cell.textContent = value || '';
        cell.classList.remove('fixed', 'selected', 'error', 'same-number');

        // 只标记初始数字为 fixed
        if (value && initialNumbers[row] && initialNumbers[row][col]) {
            cell.classList.add('fixed');
        }
    }
}

// 选择单元格
function selectCell(index) {
    const row = Math.floor(index / 9);
    const col = index % 9;

    // 如果是初始固定数字，不能选择
    if (initialNumbers[row] && initialNumbers[row][col]) {
        return;
    }

    // 开始计时
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    // 清除之前的选择
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('selected', 'same-number');
    });

    selectedCell = { row, col, index };
    const cells = document.querySelectorAll('.cell');
    cells[index].classList.add('selected');
}

// 输入数字
function inputNumber(num) {
    if (!selectedCell) return;

    const { row, col, index } = selectedCell;
    const cells = document.querySelectorAll('.cell');

    if (num === 0) {
        // 清除
        board[row][col] = 0;
        cells[index].textContent = '';
        cells[index].classList.remove('error', 'same-number');
    } else {
        // 检查是否有效
        const tempBoard = board.map(r => [...r]);
        tempBoard[row][col] = num;

        if (isValidMove(tempBoard, row, col, num)) {
            board[row][col] = num;
            cells[index].textContent = num;
            cells[index].classList.remove('error');
            highlightSameNumber(num);
        } else {
            cells[index].textContent = num;
            cells[index].classList.add('error');
        }
    }

    // 检查是否完成
    if (isBoardFull()) {
        if (checkWin()) {
            gameWon();
        }
    }
}

// 高亮相同数字
function highlightSameNumber(num) {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        if (board[row][col] === num) {
            cells[i].classList.add('same-number');
        }
    }
}

// 检查棋盘是否填满
function isBoardFull() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) return false;
        }
    }
    return true;
}

// 检查胜利
function checkWin() {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] !== solution[i][j]) return false;
        }
    }
    return true;
}

// 开始计时
function startTimer() {
    gameTimer = setInterval(() => {
        seconds++;
        updateTimer();
    }, 1000);
}

// 更新计时器显示
function updateTimer() {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer').textContent =
        `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 更新最佳时间显示
function updateBestScore() {
    const bestTime = localStorage.getItem('sudokuBestTime');
    const bestScoreElement = document.getElementById('bestScore');

    if (bestTime) {
        const minutes = Math.floor(parseInt(bestTime) / 60);
        const secs = parseInt(bestTime) % 60;
        bestScoreElement.textContent = `🏆 最佳时间: ${minutes}:${secs.toString().padStart(2, '0')}`;
    } else {
        bestScoreElement.textContent = '';
    }
}

// 更新胜利次数
function updateGamesWon() {
    const gamesWon = localStorage.getItem('sudokuGamesWon') || 0;
    document.getElementById('gamesWon').textContent = gamesWon;
}

// 游戏获胜
function gameWon() {
    clearInterval(gameTimer);
    gameStarted = false;

    // 保存最佳时间
    const bestTime = localStorage.getItem('sudokuBestTime');
    if (!bestTime || seconds < parseInt(bestTime)) {
        localStorage.setItem('sudokuBestTime', seconds);
        updateBestScore();
    }

    // 更新胜利次数
    let gamesWon = parseInt(localStorage.getItem('sudokuGamesWon') || 0);
    gamesWon++;
    localStorage.setItem('sudokuGamesWon', gamesWon);
    updateGamesWon();

    // 显示模态框
    const modal = document.getElementById('winModal');
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('finalScore').textContent =
        `用时 ${minutes}:${secs.toString().padStart(2, '0')}`;
    modal.classList.add('show');
}

// 关闭模态框
function closeModal() {
    document.getElementById('winModal').classList.remove('show');
}

// 页面加载时初始化
initGame();

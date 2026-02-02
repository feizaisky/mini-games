// 游戏状态
let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameMode = 'ai'; // 'ai' or 'pvp'
let aiDifficulty = 'easy';
let gameActive = true;
let moveHistory = [];

// 统计
let wins = 0;
let losses = 0;
let draws = 0;

// 胜利组合
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 行
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 列
    [0, 4, 8], [2, 4, 6] // 对角线
];

// 初始化游戏
function initGame() {
    createBoard();
    loadStats();
    setupButtons();
    newGame();
}

// 创建棋盘
function createBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        gameBoard.appendChild(cell);
    }
}

// 设置按钮事件
function setupButtons() {
    // 模式选择
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            gameMode = this.dataset.mode;

            // 显示/隐藏难度选择
            const difficultySelector = document.getElementById('difficultySelector');
            difficultySelector.style.display = gameMode === 'ai' ? 'flex' : 'none';

            newGame();
        });
    });

    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            aiDifficulty = this.dataset.difficulty;
            newGame();
        });
    });
}

// 新游戏
function newGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    moveHistory = [];

    renderBoard();
    updateStatus();
    updateUndoButton();
}

// 渲染棋盘
function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = board[index] || '';
        cell.className = 'cell';
        if (board[index]) {
            cell.classList.add('taken', board[index].toLowerCase());
        }
    });
}

// 处理单元格点击
function handleCellClick(index) {
    if (!gameActive || board[index]) return;

    // 在 AI 模式下，如果是 O 的回合则不允许点击
    if (gameMode === 'ai' && currentPlayer === 'O') return;

    makeMove(index);
}

// 落子
function makeMove(index) {
    board[index] = currentPlayer;
    moveHistory.push({ index, player: currentPlayer });

    renderBoard();

    // 检查胜负
    const winner = checkWinner();
    if (winner) {
        gameActive = false;
        highlightWinningCells(winner.pattern);
        announceWinner(winner.player);
        updateUndoButton();
        return;
    }

    // 检查平局
    if (board.every(cell => cell)) {
        gameActive = false;
        announceDraw();
        updateUndoButton();
        return;
    }

    // 切换玩家
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
    updateUndoButton();

    // AI 回合
    if (gameMode === 'ai' && currentPlayer === 'O' && gameActive) {
        setTimeout(aiMove, 300);
    }
}

// 检查胜负
function checkWinner() {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { player: board[a], pattern };
        }
    }
    return null;
}

// 高亮获胜格子
function highlightWinningCells(pattern) {
    const cells = document.querySelectorAll('.cell');
    pattern.forEach(index => {
        cells[index].classList.add('winning');
    });
}

// 宣布胜者
function announceWinner(winner) {
    const statusText = document.getElementById('statusText');

    if (winner === 'X') {
        statusText.textContent = '🎉 X 获胜！';
        wins++;
        if (gameMode === 'ai') {
            localStorage.setItem('tictactoeWins', wins);
        }
    } else {
        statusText.textContent = gameMode === 'ai' ? '😢 AI 获胜！' : '🎉 O 获胜！';
        if (gameMode === 'ai') {
            losses++;
            localStorage.setItem('tictactoeLosses', losses);
        }
    }

    updateStats();
}

// 宣布平局
function announceDraw() {
    document.getElementById('statusText').textContent = '🤝 平局！';
    draws++;
    if (gameMode === 'ai') {
        localStorage.setItem('tictactoeDraws', draws);
    }
    updateStats();
}

// 更新状态
function updateStatus() {
    const statusText = document.getElementById('statusText');
    if (gameMode === 'ai') {
        statusText.textContent = currentPlayer === 'X' ? '轮到 X (你)' : 'AI 思考中...';
    } else {
        statusText.textContent = `轮到 ${currentPlayer}`;
    }
}

// 更新统计显示
function updateStats() {
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
}

// 更新悔棋按钮
function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    if (gameMode === 'ai') {
        undoBtn.disabled = moveHistory.length < 2 || !gameActive;
    } else {
        undoBtn.disabled = moveHistory.length < 1 || !gameActive;
    }
}

// 悔棋
function undo() {
    if (!gameActive) return;

    if (gameMode === 'ai') {
        // 撤销 AI 和玩家的各一步
        if (moveHistory.length >= 2) {
            const aiMove = moveHistory.pop();
            const playerMove = moveHistory.pop();
            board[aiMove.index] = null;
            board[playerMove.index] = null;
            currentPlayer = 'X';
            renderBoard();
            updateStatus();
            updateUndoButton();
        }
    } else {
        // 撤销一步
        if (moveHistory.length >= 1) {
            const move = moveHistory.pop();
            board[move.index] = null;
            currentPlayer = move.player;
            renderBoard();
            updateStatus();
            updateUndoButton();
        }
    }
}

// AI 落子
function aiMove() {
    if (!gameActive) return;

    let move;

    switch (aiDifficulty) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            move = getMediumMove();
            break;
        case 'hard':
            move = getBestMove();
            break;
    }

    if (move !== null) {
        makeMove(move);
    }
}

// 随机落子（简单）
function getRandomMove() {
    const available = board.map((cell, index) => cell === null ? index : null).filter(x => x !== null);
    return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

// 中等难度（有一定智能）
function getMediumMove() {
    // 30% 概率随机
    if (Math.random() < 0.3) {
        return getRandomMove();
    }
    return getBestMove();
}

// 最佳落子（使用 Minimax）
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            const score = minimax(board, 0, false);
            board[i] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

// Minimax 算法
function minimax(board, depth, isMaximizing) {
    const winner = checkWinner();
    if (winner) {
        return winner.player === 'O' ? 10 - depth : depth - 10;
    }
    if (board.every(cell => cell)) {
        return 0;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// 加载统计
function loadStats() {
    wins = parseInt(localStorage.getItem('tictactoeWins') || 0);
    losses = parseInt(localStorage.getItem('tictactoeLosses') || 0);
    draws = parseInt(localStorage.getItem('tictactoeDraws') || 0);
    updateStats();
}

// 页面加载时初始化
initGame();

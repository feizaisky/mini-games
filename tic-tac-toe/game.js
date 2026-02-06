// 游戏状态
let boardSize = 3; // 3, 4, or 5
let winLength = 3; // 3 or 4
let board = [];
let currentPlayer = 'X';
let gameMode = 'ai'; // 'ai' or 'pvp'
let aiDifficulty = 'easy';
let gameActive = true;
let moveHistory = [];
const GAME_ID = 'tic-tac-toe';
const STORAGE_PREFIX = `miniGames.v1.${GAME_ID}`;
const STORAGE_KEYS = {
    best: `${STORAGE_PREFIX}.best`,
    stats: `${STORAGE_PREFIX}.stats`,
    progress: `${STORAGE_PREFIX}.progress`
};

// 统计
let wins = 0;
let losses = 0;
let draws = 0;

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
    gameBoard.className = `game-board size-${boardSize}`;

    const totalCells = boardSize * boardSize;
    for (let i = 0; i < totalCells; i++) {
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

    // 棋盘大小选择
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            boardSize = parseInt(this.dataset.size);
            // 3x3 和 4x4 连3胜，5x5 连4胜
            winLength = boardSize >= 5 ? 4 : 3;
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
    const totalCells = boardSize * boardSize;
    board = Array(totalCells).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    moveHistory = [];

    createBoard(); // 重新创建棋盘以适应新大小
    renderBoard();
    updateStatus();
    updateUndoButton();
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({
        boardSize,
        winLength,
        gameMode,
        aiDifficulty,
        updatedAt: Date.now()
    }));
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

    if (typeof GameAudio !== 'undefined') GameAudio.play('move');

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
        const aiDelay = 300 + Math.floor(Math.random() * 200);
        setTimeout(aiMove, aiDelay);
    }
}

// 检查胜负
function checkWinner() {
    const size = boardSize;
    const winLen = winLength;

    // 检查所有可能的获胜组合
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const idx = row * size + col;
            const player = board[idx];
            if (!player) continue;

            // 检查水平方向
            if (col + winLen <= size) {
                let pattern = [idx];
                let win = true;
                for (let k = 1; k < winLen; k++) {
                    const nextIdx = row * size + (col + k);
                    if (board[nextIdx] !== player) {
                        win = false;
                        break;
                    }
                    pattern.push(nextIdx);
                }
                if (win) return { player, pattern };
            }

            // 检查垂直方向
            if (row + winLen <= size) {
                let pattern = [idx];
                let win = true;
                for (let k = 1; k < winLen; k++) {
                    const nextIdx = (row + k) * size + col;
                    if (board[nextIdx] !== player) {
                        win = false;
                        break;
                    }
                    pattern.push(nextIdx);
                }
                if (win) return { player, pattern };
            }

            // 检查主对角线方向（左上到右下）
            if (row + winLen <= size && col + winLen <= size) {
                let pattern = [idx];
                let win = true;
                for (let k = 1; k < winLen; k++) {
                    const nextIdx = (row + k) * size + (col + k);
                    if (board[nextIdx] !== player) {
                        win = false;
                        break;
                    }
                    pattern.push(nextIdx);
                }
                if (win) return { player, pattern };
            }

            // 检查副对角线方向（右上到左下）
            if (row + winLen <= size && col - winLen + 1 >= 0) {
                let pattern = [idx];
                let win = true;
                for (let k = 1; k < winLen; k++) {
                    const nextIdx = (row + k) * size + (col - k);
                    if (board[nextIdx] !== player) {
                        win = false;
                        break;
                    }
                    pattern.push(nextIdx);
                }
                if (win) return { player, pattern };
            }
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
        if (typeof GameAudio !== 'undefined') GameAudio.play('win');
        if (typeof GameCelebration !== 'undefined') GameCelebration.show();
        wins++;
        if (gameMode === 'ai') {
            localStorage.setItem('tictactoeWins', wins);
        }
    } else {
        statusText.textContent = gameMode === 'ai' ? '😢 AI 获胜！' : '🎉 O 获胜！';
        if (gameMode === 'ai') {
            if (typeof GameAudio !== 'undefined') GameAudio.play('lose');
            losses++;
            localStorage.setItem('tictactoeLosses', losses);
        } else {
            if (typeof GameAudio !== 'undefined') GameAudio.play('win');
            if (typeof GameCelebration !== 'undefined') GameCelebration.show();
        }
    }

    updateStats();
}

// 宣布平局
function announceDraw() {
    document.getElementById('statusText').textContent = '🤝 平局！';
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
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
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
        wins,
        losses,
        draws,
        boardSize,
        winLength,
        updatedAt: Date.now()
    }));
    localStorage.setItem(STORAGE_KEYS.best, JSON.stringify({
        wins,
        losses,
        draws
    }));
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

    if (typeof GameAudio !== 'undefined') GameAudio.play('undo');

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
    const totalCells = boardSize * boardSize;
    const available = [];
    for (let i = 0; i < totalCells; i++) {
        if (board[i] === null) available.push(i);
    }
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

// 最佳落子（使用 Minimax + Alpha-Beta 剪枝）
function getBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    const totalCells = boardSize * boardSize;

    // 优先检查：能赢就赢，能堵就堵
    const immediateMove = getImmediateMove();
    if (immediateMove !== null) return immediateMove;

    for (let i = 0; i < totalCells; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            const score = minimax(board, 0, false, -Infinity, Infinity);
            board[i] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove !== null ? bestMove : getRandomMove();
}

// 快速检查：AI 能否立即获胜，或需要堵住玩家
function getImmediateMove() {
    const totalCells = boardSize * boardSize;
    // 1. AI 能赢就赢
    for (let i = 0; i < totalCells; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            if (checkWinner()) { board[i] = null; return i; }
            board[i] = null;
        }
    }
    // 2. 堵住玩家
    for (let i = 0; i < totalCells; i++) {
        if (board[i] === null) {
            board[i] = 'X';
            if (checkWinner()) { board[i] = null; return i; }
            board[i] = null;
        }
    }
    return null;
}

// Minimax + Alpha-Beta 剪枝
function minimax(board, depth, isMaximizing, alpha, beta) {
    const winner = checkWinner();
    if (winner) {
        return winner.player === 'O' ? 100 - depth : depth - 100;
    }
    if (board.every(cell => cell)) {
        return 0;
    }

    // 深度限制：3×3 不限制，4×4 限 6 层，5×5 限 4 层
    const maxDepth = boardSize <= 3 ? 20 : (boardSize <= 4 ? 6 : 4);
    if (depth >= maxDepth) {
        return evaluateBoard();
    }

    const totalCells = boardSize * boardSize;
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < totalCells; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false, alpha, beta);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // 剪枝
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < totalCells; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true, alpha, beta);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // 剪枝
            }
        }
        return bestScore;
    }
}

// 启发式评估函数（深度截断时使用）
function evaluateBoard() {
    const size = boardSize;
    const winLen = winLength;
    let score = 0;

    // 遍历所有可能的连线
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            // 四个方向：水平、垂直、主对角线、副对角线
            const directions = [];
            if (col + winLen <= size) directions.push([0, 1]);
            if (row + winLen <= size) directions.push([1, 0]);
            if (row + winLen <= size && col + winLen <= size) directions.push([1, 1]);
            if (row + winLen <= size && col - winLen + 1 >= 0) directions.push([1, -1]);

            for (const [dr, dc] of directions) {
                let oCount = 0, xCount = 0;
                for (let k = 0; k < winLen; k++) {
                    const idx = (row + k * dr) * size + (col + k * dc);
                    if (board[idx] === 'O') oCount++;
                    else if (board[idx] === 'X') xCount++;
                }
                // 只有一方占据的线才有价值
                if (oCount > 0 && xCount === 0) {
                    score += oCount * oCount; // O 的线越满分越高
                } else if (xCount > 0 && oCount === 0) {
                    score -= xCount * xCount; // X 的线扣分
                }
            }
        }
    }
    return score;
}

// 加载统计
function loadStats() {
    wins = parseInt(localStorage.getItem('tictactoeWins') || 0);
    losses = parseInt(localStorage.getItem('tictactoeLosses') || 0);
    draws = parseInt(localStorage.getItem('tictactoeDraws') || 0);
    updateStats();
}

// 页面加载时初始化
window.render_game_to_text = () => JSON.stringify({
    coordinateSystem: '1d board index; row=i/boardSize, col=i%boardSize',
    mode: gameMode,
    boardSize,
    winLength,
    currentPlayer,
    gameActive,
    aiDifficulty,
    board,
    moveCount: moveHistory.length
});

window.advanceTime = (ms) => {
    if (gameMode === 'ai' && currentPlayer === 'O' && gameActive && ms >= 200) {
        aiMove();
    }
};

window.get_game_meta = () => JSON.stringify({
    gameId: GAME_ID,
    version: 'v1',
    mode: gameMode
});

initGame();

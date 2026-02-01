const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusElement = document.getElementById('currentPlayer');
const gameOverElement = document.getElementById('gameOver');
const undoBtn = document.getElementById('undoBtn');
const restartBtn = document.getElementById('restartBtn');

// 游戏配置
const BOARD_SIZE = 13;
const CELL_SIZE = 26;
const PADDING = 13;

// 游戏状态
let board = [];
let currentPlayer = 1; // 1: 黑棋(玩家), 2: 白棋(电脑)
let gameOver = false;
let moveHistory = [];
let currentDifficulty = 'easy';

// 难度配置
const difficultyConfig = {
    easy: { searchDepth: 1, randomness: 0.3 },
    medium: { searchDepth: 2, randomness: 0.1 },
    hard: { searchDepth: 3, randomness: 0 }
};

// 初始化棋盘
function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = 0;
        }
    }
}

// 绘制棋盘
function drawBoard() {
    // 棋盘底色 - 更柔和的木色
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1.5;

    // 画网格线
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 横线
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        ctx.lineTo(canvas.width - PADDING, PADDING + i * CELL_SIZE);
        ctx.stroke();

        // 竖线
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, canvas.height - PADDING);
        ctx.stroke();
    }

    // 画天元和星位
    const center = Math.floor(BOARD_SIZE / 2);
    const stars = BOARD_SIZE === 13 ? [3, 6, 9] : [3, 7, 11];
    ctx.fillStyle = '#CD853F';
    for (let i of stars) {
        for (let j of stars) {
            ctx.beginPath();
            ctx.arc(PADDING + i * CELL_SIZE, PADDING + j * CELL_SIZE, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 画棋子
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) {
                drawPiece(i, j, board[i][j]);
            }
        }
    }

    // 标记最后一步 - 更明显的标记
    if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(
            PADDING + lastMove.x * CELL_SIZE,
            PADDING + lastMove.y * CELL_SIZE,
            4, 0, Math.PI * 2
        );
        ctx.fill();
    }
}

// 画棋子
function drawPiece(x, y, player) {
    const centerX = PADDING + x * CELL_SIZE;
    const centerY = PADDING + y * CELL_SIZE;
    const radius = 8.5;

    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    if (player === 1) {
        // 黑棋 - 更有光泽
        const gradient = ctx.createRadialGradient(centerX - 3, centerY - 3, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(0.3, '#444');
        gradient.addColorStop(1, '#111');
        ctx.fillStyle = gradient;
    } else {
        // 白棋 - 更纯净
        const gradient = ctx.createRadialGradient(centerX - 3, centerY - 3, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.7, '#f0f0f0');
        gradient.addColorStop(1, '#ddd');
        ctx.fillStyle = gradient;
    }

    ctx.fill();

    // 边框
    ctx.strokeStyle = player === 1 ? '#222' : '#bbb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 高光
    if (player === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(centerX - 2.5, centerY - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX - 2.5, centerY - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 点击事件
canvas.addEventListener('click', function(e) {
    if (gameOver || currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 转换为棋盘坐标
    const boardX = Math.round((x - PADDING) / CELL_SIZE);
    const boardY = Math.round((y - PADDING) / CELL_SIZE);

    if (boardX >= 0 && boardX < BOARD_SIZE && boardY >= 0 && boardY < BOARD_SIZE) {
        if (board[boardX][boardY] === 0) {
            makeMove(boardX, boardY, 1);
        }
    }
});

// 下棋
function makeMove(x, y, player) {
    board[x][y] = player;
    moveHistory.push({x, y, player});
    drawBoard();

    // 检查胜负
    const winner = checkWin(x, y, player);
    if (winner) {
        gameOver = true;
        if (player === 1) {
            gameOverElement.textContent = '🎉 你赢了！';
            gameOverElement.className = 'game-over win';
        } else {
            gameOverElement.textContent = '😢 电脑赢了！';
            gameOverElement.className = 'game-over lose';
        }
        gameOverElement.style.display = 'block';
        return;
    }

    // 检查平局
    if (moveHistory.length === BOARD_SIZE * BOARD_SIZE) {
        gameOver = true;
        gameOverElement.textContent = '🤝 平局！';
        gameOverElement.className = 'game-over draw';
        gameOverElement.style.display = 'block';
        return;
    }

    // 切换玩家
    currentPlayer = player === 1 ? 2 : 1;
    updateStatus();

    // 如果是电脑的回合
    if (currentPlayer === 2 && !gameOver) {
        setTimeout(computerMove, 300);
    }
}

// 更新状态显示
function updateStatus() {
    if (currentPlayer === 1) {
        statusElement.textContent = '黑棋（你）';
        statusElement.className = 'black-turn';
    } else {
        statusElement.textContent = '白棋（电脑）';
        statusElement.className = 'white-turn';
    }
}

// 检查胜负
function checkWin(x, y, player) {
    const directions = [
        [1, 0],   // 水平
        [0, 1],   // 垂直
        [1, 1],   // 对角线
        [1, -1]   // 反对角线
    ];

    for (let [dx, dy] of directions) {
        let count = 1;

        // 正方向
        for (let i = 1; i < 5; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === player) {
                count++;
            } else {
                break;
            }
        }

        // 反方向
        for (let i = 1; i < 5; i++) {
            const nx = x - dx * i;
            const ny = y - dy * i;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === player) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 5) return true;
    }

    return false;
}

// 电脑下棋
function computerMove() {
    const config = difficultyConfig[currentDifficulty];
    const move = findBestMove(config);
    makeMove(move.x, move.y, 2);
}

// 寻找最佳落子位置
function findBestMove(config) {
    let bestScore = -Infinity;
    let bestMoves = [];

    // 获取所有候选位置
    const candidates = getCandidateMoves();

    // 添加随机性
    if (Math.random() < config.randomness && candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // 评估每个候选位置
    for (let move of candidates) {
        const score = evaluateMove(move.x, move.y, config);
        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }

    // 返回最佳位置（如果有多个，随机选择）
    return bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : candidates[0];
}

// 获取候选位置（有邻居的空位）
function getCandidateMoves() {
    const candidates = [];
    const checked = new Set();

    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) {
                // 检查周围的空位
                for (let di = -2; di <= 2; di++) {
                    for (let dj = -2; dj <= 2; dj++) {
                        const ni = i + di;
                        const nj = j + dj;
                        const key = `${ni},${nj}`;
                        if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj] === 0 && !checked.has(key)) {
                            candidates.push({x: ni, y: nj});
                            checked.add(key);
                        }
                    }
                }
            }
        }
    }

    // 如果棋盘为空，返回中心位置
    if (candidates.length === 0) {
        const center = Math.floor(BOARD_SIZE / 2);
        return [{x: center, y: center}];
    }

    return candidates;
}

// 评估落子位置
function evaluateMove(x, y, config) {
    let score = 0;

    // 进攻分数（电脑）
    score += evaluatePosition(x, y, 2) * 1.1;

    // 防守分数（玩家）
    score += evaluatePosition(x, y, 1) * 1.0;

    // 位置加分（越靠近中心越好）
    const center = Math.floor(BOARD_SIZE / 2);
    const centerBonus = (center - Math.abs(x - center)) + (center - Math.abs(y - center));
    score += centerBonus * 0.15;

    return score;
}

// 评估某个位置的分数
function evaluatePosition(x, y, player) {
    let totalScore = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (let [dx, dy] of directions) {
        const lineScore = evaluateLine(x, y, dx, dy, player);
        totalScore += lineScore;
    }

    return totalScore;
}

// 评估某个方向的分数
function evaluateLine(x, y, dx, dy, player) {
    let count = 0;
    let blocked = 0;
    let spaces = 0;

    // 正方向
    for (let i = 1; i <= 4; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
            blocked++;
            break;
        }
        if (board[nx][ny] === player) {
            count++;
        } else if (board[nx][ny] === 0) {
            spaces++;
            break;
        } else {
            blocked++;
            break;
        }
    }

    // 反方向
    for (let i = 1; i <= 4; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
            blocked++;
            break;
        }
        if (board[nx][ny] === player) {
            count++;
        } else if (board[nx][ny] === 0) {
            spaces++;
            break;
        } else {
            blocked++;
            break;
        }
    }

    // 评分
    if (count >= 4) return 10000; // 成五
    if (count === 3 && blocked === 0) return 5000; // 活四
    if (count === 3 && blocked === 1) return 1000; // 冲四
    if (count === 2 && blocked === 0 && spaces >= 2) return 500; // 活三
    if (count === 2 && blocked === 1) return 100; // 眠三
    if (count === 1 && blocked === 0 && spaces >= 3) return 50; // 活二
    if (count === 1 && blocked === 1) return 10; // 眠二

    return count;
}

// 悔棋
function undo() {
    if (moveHistory.length < 2 || gameOver) return;

    // 撤销电脑和玩家的各一步
    for (let i = 0; i < 2 && moveHistory.length > 0; i++) {
        const move = moveHistory.pop();
        board[move.x][move.y] = 0;
    }

    currentPlayer = 1;
    gameOver = false;
    gameOverElement.style.display = 'none';
    updateStatus();
    drawBoard();
}

// 重新开始
function restart() {
    initBoard();
    currentPlayer = 1;
    gameOver = false;
    moveHistory = [];
    gameOverElement.style.display = 'none';
    updateStatus();
    drawBoard();
}

// 难度选择
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        difficultyBtns.forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        currentDifficulty = this.dataset.difficulty;
        restart();
    });
});

// 按钮事件
undoBtn.addEventListener('click', undo);
restartBtn.addEventListener('click', restart);

// 触摸支持（让整个屏幕都可以点击）
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
}, {passive: false});

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (gameOver || currentPlayer !== 1) return;

    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const boardX = Math.round((x - PADDING) / CELL_SIZE);
    const boardY = Math.round((y - PADDING) / CELL_SIZE);

    if (boardX >= 0 && boardX < BOARD_SIZE && boardY >= 0 && boardY < BOARD_SIZE) {
        if (board[boardX][boardY] === 0) {
            makeMove(boardX, boardY, 1);
        }
    }
}, {passive: false});

// 初始化
initBoard();
updateStatus();
drawBoard();

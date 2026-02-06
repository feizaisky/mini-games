const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const modeBtns = document.getElementById('modeBtns');
const difficultyBtns = document.getElementById('difficultyBtns');

const COLS = 9;
const ROWS = 10;
const CELL_SIZE = 70;
const PADDING = 30;
const PIECE_RADIUS = Math.round(CELL_SIZE * 0.4);
const SELECT_RADIUS = PIECE_RADIUS + 5;
const MOVE_DOT_RADIUS = Math.max(7, Math.round(CELL_SIZE * 0.13));

const COLORS = {
    red: '#d44b3f',
    black: '#1f1c1c'
};

const PIECE_SYMBOLS = {
    red: { G: '帅', A: '仕', E: '相', H: '马', R: '车', C: '炮', S: '兵' },
    black: { G: '将', A: '士', E: '象', H: '马', R: '车', C: '炮', S: '卒' }
};

const PIECE_VALUES = {
    G: 10000,
    R: 520,
    H: 320,
    C: 350,
    E: 200,
    A: 200,
    S: 100
};

const difficultyDepth = {
    easy: 1,
    medium: 2,
    hard: 3
};

let board = [];
let currentPlayer = 'red';
let selected = null;
let legalMoves = [];
let gameRunning = false;
let gameOver = false;
let winner = null;
let aiThinking = false;
let gameMode = 'ai';
let difficulty = 'easy';
const humanColor = 'red';
const aiColor = 'black';
let moveHistory = [];
let aiTimeoutId = null;

// 走子动画
let animating = false;
let animPiece = null;
let animFromX = 0, animFromY = 0, animToX = 0, animToY = 0;
let animProgress = 0;
const ANIM_SPEED = 0.08;

// 棋谱面板
const notationBtn = document.getElementById('notationBtn');
const notationPanel = document.getElementById('notationPanel');
const notationContent = document.getElementById('notationContent');
const copyNotationBtn = document.getElementById('copyNotationBtn');

if (notationBtn) {
    notationBtn.addEventListener('click', function() {
        if (notationPanel.style.display === 'none') {
            notationPanel.style.display = 'block';
            updateNotation();
        } else {
            notationPanel.style.display = 'none';
        }
        if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    });
}

if (copyNotationBtn) {
    copyNotationBtn.addEventListener('click', function() {
        var text = notationContent.textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
        copyNotationBtn.textContent = '已复制';
        setTimeout(function() { copyNotationBtn.textContent = '复制'; }, 1500);
    });
}

// 棋谱格式化
const COL_NAMES_RED = ['九','八','七','六','五','四','三','二','一'];
const COL_NAMES_BLACK = ['1','2','3','4','5','6','7','8','9'];

function formatMoveNotation(move, piece) {
    var colNames = piece.color === 'red' ? COL_NAMES_RED : COL_NAMES_BLACK;
    var pName = PIECE_SYMBOLS[piece.color][piece.type];
    var fromCol = colNames[move.fromX];
    var toCol = colNames[move.toX];
    var dy = move.toY - move.fromY;
    var forward = piece.color === 'red' ? -1 : 1;
    var action = '';

    if (dy === 0) {
        action = pName + fromCol + '平' + toCol;
    } else if (dy * forward > 0) {
        // 进
        if (move.fromX === move.toX) {
            action = pName + fromCol + '进' + Math.abs(dy);
        } else {
            action = pName + fromCol + '进' + toCol;
        }
    } else {
        // 退
        if (move.fromX === move.toX) {
            action = pName + fromCol + '退' + Math.abs(dy);
        } else {
            action = pName + fromCol + '退' + toCol;
        }
    }
    return action;
}

function updateNotation() {
    if (!notationContent) return;
    var lines = [];
    for (var i = 0; i < moveHistory.length; i++) {
        var m = moveHistory[i];
        var notation = m.notation || '';
        var turnNum = Math.floor(i / 2) + 1;
        if (i % 2 === 0) {
            lines.push(turnNum + '. ' + notation);
        } else {
            lines[lines.length - 1] += '  ' + notation;
        }
    }
    notationContent.textContent = lines.join('\n') || '暂无棋谱记录';
}

function initBoard() {
    const emptyRow = () => Array.from({ length: COLS }, () => null);
    const newBoard = Array.from({ length: ROWS }, () => emptyRow());

    const backRow = ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'];
    backRow.forEach((type, x) => {
        newBoard[0][x] = { type, color: 'black' };
        newBoard[9][x] = { type, color: 'red' };
    });

    newBoard[2][1] = { type: 'C', color: 'black' };
    newBoard[2][7] = { type: 'C', color: 'black' };
    newBoard[7][1] = { type: 'C', color: 'red' };
    newBoard[7][7] = { type: 'C', color: 'red' };

    [0, 2, 4, 6, 8].forEach(x => {
        newBoard[3][x] = { type: 'S', color: 'black' };
        newBoard[6][x] = { type: 'S', color: 'red' };
    });

    return newBoard;
}

function resetGame(keepMode = true) {
    board = initBoard();
    currentPlayer = 'red';
    selected = null;
    legalMoves = [];
    gameOver = false;
    winner = null;
    aiThinking = false;
    moveHistory = [];
    if (gameMode === 'ai' && currentPlayer === aiColor) {
        aiThinking = true;
    }
    if (!keepMode) {
        gameMode = 'ai';
        difficulty = 'easy';
    }
    gameRunning = true;
    updateStatus();
    draw();
    if (gameMode === 'ai' && currentPlayer === aiColor) {
        triggerAIMove();
    }
}

function updateStatus(extra = '') {
    if (!gameRunning) {
        statusEl.textContent = '点击开始新局';
        return;
    }
    if (gameOver) {
        statusEl.textContent = winner === 'red' ? '红方胜！' : '黑方胜！';
        return;
    }
    if (aiThinking) {
        statusEl.textContent = 'AI 思考中...';
        return;
    }
    const turnLabel = currentPlayer === 'red' ? '红方回合' : '黑方回合';
    statusEl.textContent = `${turnLabel}${extra}`;
}

function setMode(mode) {
    gameMode = mode;
    document.querySelectorAll('#modeBtns .pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    difficultyBtns.querySelectorAll('.pill-btn').forEach(btn => {
        btn.disabled = mode !== 'ai';
        btn.style.opacity = mode === 'ai' ? '1' : '0.4';
    });
    selected = null;
    legalMoves = [];
    updateStatus();
    draw();
}

function setDifficulty(level) {
    difficulty = level;
    document.querySelectorAll('#difficultyBtns .pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f7efd8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#7a5e3f';
    ctx.lineWidth = 2;

    for (let y = 0; y < ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + y * CELL_SIZE);
        ctx.lineTo(PADDING + (COLS - 1) * CELL_SIZE, PADDING + y * CELL_SIZE);
        ctx.stroke();
    }

    for (let x = 0; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(PADDING + x * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + x * CELL_SIZE, PADDING + 4 * CELL_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(PADDING + x * CELL_SIZE, PADDING + 5 * CELL_SIZE);
        ctx.lineTo(PADDING + x * CELL_SIZE, PADDING + 9 * CELL_SIZE);
        ctx.stroke();
    }

    ctx.font = '20px "KaiTi", "STKaiti", serif';
    ctx.fillStyle = '#7a5e3f';
    ctx.textAlign = 'center';
    ctx.fillText('楚河', PADDING + 2 * CELL_SIZE, PADDING + 4.7 * CELL_SIZE);
    ctx.fillText('汉界', PADDING + 6 * CELL_SIZE, PADDING + 4.7 * CELL_SIZE);

    drawPalace();
    drawPieces();
    drawSelection();
}

function drawPalace() {
    ctx.strokeStyle = '#7a5e3f';
    ctx.lineWidth = 2;

    const palaceLines = [
        { from: [3, 0], to: [5, 2] },
        { from: [5, 0], to: [3, 2] },
        { from: [3, 7], to: [5, 9] },
        { from: [5, 7], to: [3, 9] }
    ];

    palaceLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(PADDING + line.from[0] * CELL_SIZE, PADDING + line.from[1] * CELL_SIZE);
        ctx.lineTo(PADDING + line.to[0] * CELL_SIZE, PADDING + line.to[1] * CELL_SIZE);
        ctx.stroke();
    });
}

function drawPieces() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const piece = board[y][x];
            if (!piece) continue;

            const cx = PADDING + x * CELL_SIZE;
            const cy = PADDING + y * CELL_SIZE;

            ctx.beginPath();
            ctx.fillStyle = '#fffaf0';
            ctx.strokeStyle = piece.color === 'red' ? COLORS.red : COLORS.black;
            ctx.lineWidth = 3;
            ctx.arc(cx, cy, PIECE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = piece.color === 'red' ? COLORS.red : COLORS.black;
            ctx.font = `${Math.round(CELL_SIZE * 0.36)}px "KaiTi", "STKaiti", serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(PIECE_SYMBOLS[piece.color][piece.type], cx, cy + 1);
        }
    }
}

function drawSelection() {
    if (!selected) return;

    const { x, y } = selected;
    const cx = PADDING + x * CELL_SIZE;
    const cy = PADDING + y * CELL_SIZE;

    ctx.strokeStyle = '#f7b731';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, SELECT_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    legalMoves.forEach(move => {
        const mx = PADDING + move.x * CELL_SIZE;
        const my = PADDING + move.y * CELL_SIZE;
        ctx.fillStyle = 'rgba(90, 153, 122, 0.6)';
        ctx.beginPath();
        ctx.arc(mx, my, MOVE_DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });
}

function withinBoard(x, y) {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

function getPiece(x, y) {
    if (!withinBoard(x, y)) return null;
    return board[y][x];
}

function inPalace(color, x, y) {
    if (x < 3 || x > 5) return false;
    if (color === 'red') {
        return y >= 7 && y <= 9;
    }
    return y >= 0 && y <= 2;
}

function hasCrossedRiver(color, y) {
    return color === 'red' ? y <= 4 : y >= 5;
}

function findGeneral(color) {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const piece = board[y][x];
            if (piece && piece.color === color && piece.type === 'G') {
                return { x, y };
            }
        }
    }
    return null;
}

function countPiecesBetween(fromX, fromY, toX, toY) {
    let count = 0;
    if (fromX === toX) {
        const step = toY > fromY ? 1 : -1;
        for (let y = fromY + step; y !== toY; y += step) {
            if (board[y][fromX]) count++;
        }
    } else if (fromY === toY) {
        const step = toX > fromX ? 1 : -1;
        for (let x = fromX + step; x !== toX; x += step) {
            if (board[fromY][x]) count++;
        }
    }
    return count;
}

function canPieceAttack(piece, fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;

    switch (piece.type) {
        case 'G': {
            if (fromX === toX && fromY !== toY) {
                const between = countPiecesBetween(fromX, fromY, toX, toY);
                if (between === 0) return true;
            }
            if (!inPalace(piece.color, toX, toY)) return false;
            return Math.abs(dx) + Math.abs(dy) === 1;
        }
        case 'A':
            if (!inPalace(piece.color, toX, toY)) return false;
            return Math.abs(dx) === 1 && Math.abs(dy) === 1;
        case 'E': {
            if (Math.abs(dx) !== 2 || Math.abs(dy) !== 2) return false;
            const eyeX = fromX + dx / 2;
            const eyeY = fromY + dy / 2;
            if (getPiece(eyeX, eyeY)) return false;
            if (piece.color === 'red' && toY < 5) return false;
            if (piece.color === 'black' && toY > 4) return false;
            return true;
        }
        case 'H': {
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);
            if (!((adx === 2 && ady === 1) || (adx === 1 && ady === 2))) return false;
            if (adx === 2) {
                const legX = fromX + dx / 2;
                if (getPiece(legX, fromY)) return false;
            } else {
                const legY = fromY + dy / 2;
                if (getPiece(fromX, legY)) return false;
            }
            return true;
        }
        case 'R':
            if (fromX !== toX && fromY !== toY) return false;
            return countPiecesBetween(fromX, fromY, toX, toY) === 0;
        case 'C': {
            if (fromX !== toX && fromY !== toY) return false;
            const between = countPiecesBetween(fromX, fromY, toX, toY);
            return between === 1;
        }
        case 'S': {
            const forward = piece.color === 'red' ? -1 : 1;
            if (!hasCrossedRiver(piece.color, fromY)) {
                return dx === 0 && dy === forward;
            }
            return (dx === 0 && dy === forward) || (Math.abs(dx) === 1 && dy === 0);
        }
        default:
            return false;
    }
}

function isSquareAttacked(x, y, byColor) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const piece = board[row][col];
            if (!piece || piece.color !== byColor) continue;
            if (canPieceAttack(piece, col, row, x, y)) {
                if (piece.type === 'C') {
                    if (board[y][x]) return true;
                } else {
                    return true;
                }
            }
        }
    }
    return false;
}

function isInCheck(color) {
    const general = findGeneral(color);
    if (!general) return true;
    const opponent = color === 'red' ? 'black' : 'red';
    return isSquareAttacked(general.x, general.y, opponent);
}

function wouldLeaveGeneralInCheck(fromX, fromY, toX, toY, color) {
    const moving = board[fromY][fromX];
    const captured = board[toY][toX];
    board[toY][toX] = moving;
    board[fromY][fromX] = null;

    const inCheck = isInCheck(color);

    board[fromY][fromX] = moving;
    board[toY][toX] = captured;

    return inCheck;
}

function getLegalMovesForPiece(x, y) {
    const piece = board[y][x];
    if (!piece) return [];
    const moves = [];

    const pushMove = (tx, ty) => {
        if (!withinBoard(tx, ty)) return;
        const target = board[ty][tx];
        if (target && target.color === piece.color) return;
        if (wouldLeaveGeneralInCheck(x, y, tx, ty, piece.color)) return;
        moves.push({ x: tx, y: ty });
    };

    switch (piece.type) {
        case 'G':
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
                const tx = x + dx;
                const ty = y + dy;
                if (!inPalace(piece.color, tx, ty)) return;
                pushMove(tx, ty);
            });
            const opponentColor = piece.color === 'red' ? 'black' : 'red';
            const opponentGeneral = findGeneral(opponentColor);
            if (opponentGeneral && opponentGeneral.x === x) {
                const between = countPiecesBetween(x, y, opponentGeneral.x, opponentGeneral.y);
                if (between === 0) {
                    pushMove(opponentGeneral.x, opponentGeneral.y);
                }
            }
            break;
        case 'A':
            [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
                const tx = x + dx;
                const ty = y + dy;
                if (!inPalace(piece.color, tx, ty)) return;
                pushMove(tx, ty);
            });
            break;
        case 'E':
            [[2,2],[2,-2],[-2,2],[-2,-2]].forEach(([dx, dy]) => {
                const tx = x + dx;
                const ty = y + dy;
                if (piece.color === 'red' && ty < 5) return;
                if (piece.color === 'black' && ty > 4) return;
                const eyeX = x + dx / 2;
                const eyeY = y + dy / 2;
                if (getPiece(eyeX, eyeY)) return;
                pushMove(tx, ty);
            });
            break;
        case 'H':
            [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dx, dy]) => {
                const tx = x + dx;
                const ty = y + dy;
                const adx = Math.abs(dx);
                const legX = adx === 2 ? x + dx / 2 : x;
                const legY = adx === 2 ? y : y + dy / 2;
                if (getPiece(legX, legY)) return;
                pushMove(tx, ty);
            });
            break;
        case 'R':
        case 'C': {
            const directions = [[1,0],[-1,0],[0,1],[0,-1]];
            directions.forEach(([dx, dy]) => {
                let tx = x + dx;
                let ty = y + dy;
                let screenFound = false;
                while (withinBoard(tx, ty)) {
                    const target = board[ty][tx];
                    if (piece.type === 'C') {
                        if (!screenFound) {
                            if (!target) {
                                pushMove(tx, ty);
                            } else {
                                screenFound = true;
                            }
                        } else if (target) {
                            if (target.color !== piece.color) {
                                pushMove(tx, ty);
                            }
                            break;
                        }
                    } else {
                        if (target) {
                            if (target.color !== piece.color) pushMove(tx, ty);
                            break;
                        }
                        pushMove(tx, ty);
                    }
                    tx += dx;
                    ty += dy;
                }
            });
            break;
        }
        case 'S': {
            const forward = piece.color === 'red' ? -1 : 1;
            pushMove(x, y + forward);
            if (hasCrossedRiver(piece.color, y)) {
                pushMove(x + 1, y);
                pushMove(x - 1, y);
            }
            break;
        }
        default:
            break;
    }

    return moves;
}

function getAllLegalMoves(color) {
    const moves = [];
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const piece = board[y][x];
            if (!piece || piece.color !== color) continue;
            const pieceMoves = getLegalMovesForPiece(x, y);
            pieceMoves.forEach(move => {
                moves.push({ fromX: x, fromY: y, toX: move.x, toY: move.y });
            });
        }
    }
    return moves;
}

function getWinnerFromBoard() {
    const redGeneral = findGeneral('red');
    const blackGeneral = findGeneral('black');
    if (!redGeneral) return 'black';
    if (!blackGeneral) return 'red';
    return null;
}

function evaluateBoard() {
    let score = 0;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const piece = board[y][x];
            if (!piece) continue;
            let value = PIECE_VALUES[piece.type] || 0;
            if (piece.type === 'S') {
                const advance = piece.color === 'red' ? (6 - y) : (y - 3);
                value += Math.max(0, advance) * 6;
            }
            score += piece.color === 'red' ? value : -value;
        }
    }
    return score;
}

function makeMove(fromX, fromY, toX, toY) {
    const moving = board[fromY][fromX];
    const captured = board[toY][toX];
    board[toY][toX] = moving;
    board[fromY][fromX] = null;
    return captured;
}

function undoMove(fromX, fromY, toX, toY, captured) {
    board[fromY][fromX] = board[toY][toX];
    board[toY][toX] = captured;
}

function minimax(depth, alpha, beta, maximizingRed) {
    const winnerCheck = getWinnerFromBoard();
    if (winnerCheck) {
        return winnerCheck === 'red' ? 999999 : -999999;
    }
    if (depth === 0) {
        return evaluateBoard();
    }

    const color = maximizingRed ? 'red' : 'black';
    const moves = getAllLegalMoves(color);
    if (moves.length === 0) {
        return evaluateBoard();
    }

    if (maximizingRed) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const captured = makeMove(move.fromX, move.fromY, move.toX, move.toY);
            const evalScore = minimax(depth - 1, alpha, beta, false);
            undoMove(move.fromX, move.fromY, move.toX, move.toY, captured);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    }

    let minEval = Infinity;
    for (const move of moves) {
        const captured = makeMove(move.fromX, move.fromY, move.toX, move.toY);
        const evalScore = minimax(depth - 1, alpha, beta, true);
        undoMove(move.fromX, move.fromY, move.toX, move.toY, captured);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
    }
    return minEval;
}

function chooseAIMove() {
    const depth = difficultyDepth[difficulty] || 1;
    const moves = getAllLegalMoves(aiColor);
    if (moves.length === 0) return null;

    let bestScore = Infinity;
    let bestMoves = [];

    moves.forEach(move => {
        const captured = makeMove(move.fromX, move.fromY, move.toX, move.toY);
        const score = minimax(depth - 1, -Infinity, Infinity, true);
        undoMove(move.fromX, move.fromY, move.toX, move.toY, captured);

        if (score < bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    });

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function handleMove(fromX, fromY, toX, toY) {
    const prevPlayer = currentPlayer;
    const movingPiece = board[fromY][fromX];

    // 生成棋谱
    var notation = formatMoveNotation({ fromX, fromY, toX, toY }, movingPiece);

    // 播放音效
    var target = board[toY][toX];
    if (typeof GameAudio !== 'undefined') {
        if (target) {
            GameAudio.play('hit');
        } else {
            GameAudio.play('move');
        }
    }

    // 执行走子动画
    animatePieceMove(fromX, fromY, toX, toY, function() {
        var capturedPiece = makeMove(fromX, fromY, toX, toY);
        moveHistory.push({
            fromX,
            fromY,
            toX,
            toY,
            captured: capturedPiece,
            prevPlayer,
            notation: notation
        });

        if (capturedPiece && capturedPiece.type === 'G') {
            gameOver = true;
            winner = prevPlayer;
        }

        currentPlayer = prevPlayer === 'red' ? 'black' : 'red';
        selected = null;
        legalMoves = [];

        if (!gameOver) {
            const opponentCheck = isInCheck(currentPlayer);
            const opponentMoves = getAllLegalMoves(currentPlayer);
            if (opponentMoves.length === 0) {
                gameOver = true;
                winner = currentPlayer === 'red' ? 'black' : 'red';
                updateStatus();
            } else {
                updateStatus(opponentCheck ? '（被将军）' : '');
                if (opponentCheck && typeof GameAudio !== 'undefined') {
                    GameAudio.play('error');
                }
            }
        } else {
            updateStatus();
            // 胜利庆祝
            if (winner === humanColor || gameMode === 'pvp') {
                if (typeof GameAudio !== 'undefined') GameAudio.play('win');
                if (typeof GameCelebration !== 'undefined') GameCelebration.show();
            } else {
                if (typeof GameAudio !== 'undefined') GameAudio.play('lose');
            }
        }

        updateNotation();
        draw();

        if (!gameOver && gameMode === 'ai' && currentPlayer === aiColor) {
            triggerAIMove();
        }
    });
}

function animatePieceMove(fromX, fromY, toX, toY, callback) {
    animating = true;
    animPiece = board[fromY][fromX];
    animFromX = fromX;
    animFromY = fromY;
    animToX = toX;
    animToY = toY;
    animProgress = 0;

    // 临时从棋盘移除以便动画
    board[fromY][fromX] = null;

    function step() {
        animProgress += ANIM_SPEED;
        if (animProgress >= 1) {
            animProgress = 1;
            animating = false;
            board[fromY][fromX] = animPiece; // 恢复以便 makeMove 正常工作
            animPiece = null;
            callback();
            return;
        }
        drawWithAnimation();
        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function drawWithAnimation() {
    // 重绘棋盘
    draw();

    if (!animPiece) return;

    // 绘制动画中的棋子
    var t = animProgress;
    // ease-out
    t = 1 - (1 - t) * (1 - t);
    var cx = PADDING + (animFromX + (animToX - animFromX) * t) * CELL_SIZE;
    var cy = PADDING + (animFromY + (animToY - animFromY) * t) * CELL_SIZE;

    ctx.beginPath();
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = animPiece.color === 'red' ? COLORS.red : COLORS.black;
    ctx.lineWidth = 3;
    ctx.arc(cx, cy, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = animPiece.color === 'red' ? COLORS.red : COLORS.black;
    ctx.font = Math.round(CELL_SIZE * 0.36) + 'px "KaiTi", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PIECE_SYMBOLS[animPiece.color][animPiece.type], cx, cy + 1);
}

function triggerAIMove() {
    aiThinking = true;
    updateStatus();
    if (aiTimeoutId) {
        clearTimeout(aiTimeoutId);
    }
    aiTimeoutId = setTimeout(() => {
        const move = chooseAIMove();
        aiThinking = false;
        aiTimeoutId = null;
        if (!move) {
            gameOver = true;
            winner = humanColor;
            updateStatus();
            draw();
            return;
        }
        handleMove(move.fromX, move.fromY, move.toX, move.toY);
    }, 200);
}

function undoSingleHistoryMove() {
    const last = moveHistory.pop();
    if (!last) return false;
    const moving = board[last.toY][last.toX];
    board[last.fromY][last.fromX] = moving;
    board[last.toY][last.toX] = last.captured || null;
    currentPlayer = last.prevPlayer;
    return true;
}

function undoLastAction() {
    if (!gameRunning || moveHistory.length === 0 || animating) return;
    if (typeof GameAudio !== 'undefined') GameAudio.play('undo');
    if (aiTimeoutId) {
        clearTimeout(aiTimeoutId);
        aiTimeoutId = null;
    }
    aiThinking = false;

    let steps = 1;
    if (gameMode === 'ai' && currentPlayer === humanColor && moveHistory.length >= 2) {
        steps = 2;
    }

    for (let i = 0; i < steps; i++) {
        if (!undoSingleHistoryMove()) break;
    }

    gameOver = false;
    winner = null;
    selected = null;
    legalMoves = [];
    const check = isInCheck(currentPlayer);
    updateStatus(check ? '（被将军）' : '');
    updateNotation();
    draw();
}

function handleBoardClick(evt) {
    if (!gameRunning || gameOver || aiThinking || animating) return;
    if (gameMode === 'ai' && currentPlayer !== humanColor) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (evt.clientX - rect.left) * scaleX;
    const clickY = (evt.clientY - rect.top) * scaleY;

    const boardX = Math.round((clickX - PADDING) / CELL_SIZE);
    const boardY = Math.round((clickY - PADDING) / CELL_SIZE);

    if (!withinBoard(boardX, boardY)) return;

    const clickedPiece = board[boardY][boardX];
    if (selected) {
        const isLegal = legalMoves.some(move => move.x === boardX && move.y === boardY);
        if (isLegal) {
            handleMove(selected.x, selected.y, boardX, boardY);
            return;
        }
    }

    if (clickedPiece && clickedPiece.color === currentPlayer) {
        selected = { x: boardX, y: boardY };
        legalMoves = getLegalMovesForPiece(boardX, boardY);
        draw();
        return;
    }

    selected = null;
    legalMoves = [];
    draw();
}

canvas.addEventListener('click', handleBoardClick);
canvas.addEventListener('touchstart', evt => {
    evt.preventDefault();
    handleBoardClick(evt.touches[0]);
}, { passive: false });

startBtn.addEventListener('click', () => {
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    resetGame();
});

resetBtn.addEventListener('click', () => {
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    resetGame();
});

undoBtn.addEventListener('click', () => {
    undoLastAction();
});

modeBtns.addEventListener('click', evt => {
    const btn = evt.target.closest('.pill-btn');
    if (!btn) return;
    setMode(btn.dataset.mode);
    resetGame();
});

difficultyBtns.addEventListener('click', evt => {
    const btn = evt.target.closest('.pill-btn');
    if (!btn || btn.disabled) return;
    setDifficulty(btn.dataset.level);
    resetGame();
});

['copy', 'cut', 'paste'].forEach(eventName => {
    document.addEventListener(eventName, evt => evt.preventDefault());
});

document.addEventListener('wheel', evt => {
    if (evt.ctrlKey) evt.preventDefault();
}, { passive: false });

document.addEventListener('keydown', evt => {
    if (!evt.ctrlKey) return;
    if (evt.key === '+' || evt.key === '-' || evt.key === '=' || evt.key === '0') {
        evt.preventDefault();
    }
});

['gesturestart', 'gesturechange', 'gestureend'].forEach(eventName => {
    document.addEventListener(eventName, evt => evt.preventDefault());
});

window.render_game_to_text = () => {
    const pieces = [];
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const piece = board[y][x];
            if (piece) {
                pieces.push({ x, y, type: piece.type, color: piece.color });
            }
        }
    }
    return JSON.stringify({
        mode: gameMode,
        difficulty,
        currentPlayer,
        gameOver,
        winner,
        selected,
        legalMoves,
        pieces,
        coordinateSystem: 'origin top-left, x right, y down'
    });
};

window.advanceTime = () => {
    draw();
};

resetGame();

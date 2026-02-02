// 游戏状态
let gridSize = 3;
let pieces = [];
let selectedPiece = null;
let moves = 0;
let seconds = 0;
let gameStarted = false;
let gameTimer = null;
let imageData = null;

// 初始化游戏
function initGame() {
    setupSizeButtons();
    generateImage();
    updateBestScore();
}

// 设置尺寸按钮
function setupSizeButtons() {
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            gridSize = parseInt(this.dataset.size);
            newGame();
        });
    });
}

// 生成图片（使用 Canvas 生成彩色图案）
function generateImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, getRandomColor());
    gradient.addColorStop(0.5, getRandomColor());
    gradient.addColorStop(1, getRandomColor());
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // 添加随机形状
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = getRandomColor();
        ctx.globalAlpha = 0.6;
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 添加数字标记
    ctx.globalAlpha = 1;
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧩', size / 2, size / 2);

    imageData = canvas.toDataURL();
}

// 获取随机颜色
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B500', '#FF6F61', '#6B5B95', '#88B04B'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 新游戏
function newGame() {
    // 停止计时器
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    moves = 0;
    seconds = 0;
    gameStarted = false;
    selectedPiece = null;

    generateImage();
    createPieces();
    shufflePieces();
    updateDisplay();
    updateBestScore();
}

// 创建拼图块
function createPieces() {
    pieces = [];
    const totalPieces = gridSize * gridSize;

    for (let i = 0; i < totalPieces; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        pieces.push({
            id: i,
            currentPos: i,
            correctPos: i,
            row: row,
            col: col
        });
    }
}

// 打乱拼图
function shufflePieces() {
    // 重置状态
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    moves = 0;
    seconds = 0;
    gameStarted = false;
    selectedPiece = null;

    // Fisher-Yates 洗牌算法
    const positions = pieces.map(p => p.currentPos);
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // 确保打乱后不是已完成状态
    let isSolved = true;
    for (let i = 0; i < pieces.length; i++) {
        if (positions[i] !== i) {
            isSolved = false;
            break;
        }
    }

    if (isSolved && pieces.length > 1) {
        // 如果刚好完成，交换前两块
        [positions[0], positions[1]] = [positions[1], positions[0]];
    }

    // 应用新位置
    pieces.forEach((piece, index) => {
        piece.currentPos = positions[index];
    });

    updateDisplay();
    renderBoard();
}

// 渲染棋盘
function renderBoard() {
    const board = document.getElementById('puzzleBoard');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    const pieceSize = 300 / gridSize;

    // 按 currentPos 排序以正确显示
    const sortedPieces = [...pieces].sort((a, b) => a.currentPos - b.currentPos);

    sortedPieces.forEach(piece => {
        const div = document.createElement('div');
        div.className = 'puzzle-piece';
        div.dataset.id = piece.id;

        // 计算背景位置
        const correctRow = Math.floor(piece.correctPos / gridSize);
        const correctCol = piece.correctPos % gridSize;
        const bgX = -(correctCol * pieceSize);
        const bgY = -(correctRow * pieceSize);

        div.style.backgroundImage = `url(${imageData})`;
        div.style.backgroundPosition = `${bgX}px ${bgY}px`;
        div.style.backgroundSize = `${gridSize * 100}%`;

        // 显示数字帮助（可选）
        div.textContent = piece.correctPos + 1;

        // 检查是否在正确位置
        if (piece.currentPos === piece.correctPos) {
            div.classList.add('correct');
        }

        div.addEventListener('click', () => selectPiece(piece.id));
        board.appendChild(div);
    });
}

// 选择拼图块
function selectPiece(id) {
    const piece = pieces.find(p => p.id === id);

    if (selectedPiece === null) {
        // 第一次选择
        selectedPiece = id;
        document.querySelector(`[data-id="${id}"]`).classList.add('selected');
    } else if (selectedPiece === id) {
        // 取消选择
        document.querySelector(`[data-id="${id}"]`).classList.remove('selected');
        selectedPiece = null;
    } else {
        // 交换
        swapPieces(selectedPiece, id);
        document.querySelector(`[data-id="${selectedPiece}"]`).classList.remove('selected');
        selectedPiece = null;
    }
}

// 交换拼图块
function swapPieces(id1, id2) {
    const piece1 = pieces.find(p => p.id === id1);
    const piece2 = pieces.find(p => p.id === id2);

    const tempPos = piece1.currentPos;
    piece1.currentPos = piece2.currentPos;
    piece2.currentPos = tempPos;

    moves++;

    // 开始计时
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    updateDisplay();
    renderBoard();

    // 检查是否完成
    if (checkSolved()) {
        gameWon();
    }
}

// 检查是否完成
function checkSolved() {
    return pieces.every(piece => piece.currentPos === piece.correctPos);
}

// 开始计时
function startTimer() {
    gameTimer = setInterval(() => {
        seconds++;
        updateDisplay();
    }, 1000);
}

// 更新显示
function updateDisplay() {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer').textContent =
        `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('moves').textContent = moves;
}

// 更新最佳成绩显示
function updateBestScore() {
    const bestMoves = localStorage.getItem(`puzzleBestMoves_${gridSize}x${gridSize}`);
    const bestTime = localStorage.getItem(`puzzleBestTime_${gridSize}x${gridSize}`);
    const bestScoreElement = document.getElementById('bestScore');

    if (bestMoves && bestTime) {
        const minutes = Math.floor(parseInt(bestTime) / 60);
        const secs = parseInt(bestTime) % 60;
        bestScoreElement.textContent = `🏆 最佳: ${bestMoves}步 / ${minutes}:${secs.toString().padStart(2, '0')}`;
    } else {
        bestScoreElement.textContent = '';
    }
}

// 游戏获胜
function gameWon() {
    clearInterval(gameTimer);
    gameStarted = false;

    // 保存最佳成绩
    const bestMoves = localStorage.getItem(`puzzleBestMoves_${gridSize}x${gridSize}`);
    const bestTime = localStorage.getItem(`puzzleBestTime_${gridSize}x${gridSize}`);

    if (!bestMoves || moves < parseInt(bestMoves)) {
        localStorage.setItem(`puzzleBestMoves_${gridSize}x${gridSize}`, moves);
    }

    if (!bestTime || seconds < parseInt(bestTime)) {
        localStorage.setItem(`puzzleBestTime_${gridSize}x${gridSize}`, seconds);
    }

    updateBestScore();

    // 显示模态框
    const modal = document.getElementById('winModal');
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('finalScore').textContent =
        `用时 ${minutes}:${secs.toString().padStart(2, '0')}，用了 ${moves} 步`;
    modal.classList.add('show');
}

// 显示预览
function showPreview() {
    const modal = document.getElementById('previewModal');
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 300;
    canvas.height = 300;

    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;

    modal.classList.add('show');
}

// 关闭预览模态框
function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('show');
}

// 关闭模态框
function closeModal() {
    document.getElementById('winModal').classList.remove('show');
}

// 页面加载时初始化
initGame();

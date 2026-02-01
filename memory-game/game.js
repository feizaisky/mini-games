// 游戏卡片图标
const cardEmojis = ['🐶', '🐱', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙'];

// 游戏状态
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let gameTimer = null;
let seconds = 0;
let isProcessing = false;
let gameStarted = false;

// 初始化游戏
function initGame() {
    // 创建配对的卡片
    const cardPairs = [...cardEmojis, ...cardEmojis];
    // 洗牌
    for (let i = cardPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    // 创建卡片对象
    cards = cardPairs.map((emoji, index) => ({
        id: index,
        emoji: emoji,
        isFlipped: false,
        isMatched: false
    }));

    // 重置状态
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    isProcessing = false;
    gameStarted = false;

    // 停止计时器
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    // 更新显示
    updateDisplay();
    updateBestScore();
    renderBoard();
}

// 渲染游戏面板
function renderBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';

    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;

        // 卡片背面（问号）
        const back = document.createElement('div');
        back.className = 'card-back';
        back.textContent = '❓';

        // 卡片正面（emoji）
        const front = document.createElement('div');
        front.className = 'card-front';
        front.textContent = card.emoji;

        cardElement.appendChild(back);
        cardElement.appendChild(front);

        cardElement.addEventListener('click', () => flipCard(card.id));
        board.appendChild(cardElement);
    });
}

// 翻牌
function flipCard(cardId) {
    if (isProcessing) return;

    const card = cards[cardId];

    // 如果卡片已翻开或已配对，则忽略
    if (card.isFlipped || card.isMatched) return;

    // 如果已经翻了两张牌，忽略
    if (flippedCards.length >= 2) return;

    // 开始计时
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    // 翻转卡片
    card.isFlipped = true;
    flippedCards.push(card);

    // 更新卡片显示
    const cardElement = document.querySelector(`[data-id="${cardId}"]`);
    cardElement.classList.add('flipped');

    // 如果翻了两张牌，检查是否匹配
    if (flippedCards.length === 2) {
        moves++;
        updateDisplay();
        checkMatch();
    }
}

// 检查匹配
function checkMatch() {
    isProcessing = true;

    const [card1, card2] = flippedCards;

    if (card1.emoji === card2.emoji) {
        // 匹配成功
        setTimeout(() => {
            card1.isMatched = true;
            card2.isMatched = true;
            matchedPairs++;

            const element1 = document.querySelector(`[data-id="${card1.id}"]`);
            const element2 = document.querySelector(`[data-id="${card2.id}"]`);
            element1.classList.add('matched');
            element2.classList.add('matched');

            flippedCards = [];
            isProcessing = false;
            updateDisplay();

            // 检查是否获胜
            if (matchedPairs === cardEmojis.length) {
                gameWon();
            }
        }, 300);
    } else {
        // 不匹配，翻回去
        setTimeout(() => {
            card1.isFlipped = false;
            card2.isFlipped = false;

            const element1 = document.querySelector(`[data-id="${card1.id}"]`);
            const element2 = document.querySelector(`[data-id="${card2.id}"]`);
            element1.classList.remove('flipped');
            element2.classList.remove('flipped');

            flippedCards = [];
            isProcessing = false;
        }, 1000);
    }
}

// 更新显示
function updateDisplay() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('matches').textContent = matchedPairs;
}

// 更新最高分显示
function updateBestScore() {
    const bestMoves = localStorage.getItem('memoryBestMoves');
    const bestTime = localStorage.getItem('memoryBestTime');
    const bestScoreElement = document.getElementById('bestScore');

    if (bestMoves && bestTime) {
        bestScoreElement.textContent = `🏆 最佳: ${bestMoves}步 / ${formatTime(parseInt(bestTime))}`;
    } else if (bestMoves) {
        bestScoreElement.textContent = `🏆 最佳: ${bestMoves}步`;
    } else {
        bestScoreElement.textContent = '';
    }
}

// 开始计时
function startTimer() {
    gameTimer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('time').textContent =
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

// 游戏获胜
function gameWon() {
    clearInterval(gameTimer);

    // 计算星级
    let stars = '⭐⭐⭐';
    if (moves > 16) {
        stars = '⭐⭐';
    }
    if (moves > 24) {
        stars = '⭐';
    }

    // 保存最高分（最少步数）
    const bestMoves = localStorage.getItem('memoryBestMoves');
    if (!bestMoves || moves < parseInt(bestMoves)) {
        localStorage.setItem('memoryBestMoves', moves);
    }

    // 保存最高分（最短时间）
    const bestTime = localStorage.getItem('memoryBestTime');
    if (!bestTime || seconds < parseInt(bestTime)) {
        localStorage.setItem('memoryBestTime', seconds);
    }

    // 显示模态框
    const modal = document.getElementById('winModal');
    document.getElementById('stars').textContent = stars;
    document.getElementById('finalScore').textContent =
        `用时 ${formatTime(seconds)}，用了 ${moves} 步`;
    modal.classList.add('show');

    // 更新最高分显示
    updateBestScore();
}

// 格式化时间
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// 关闭模态框
function closeModal() {
    document.getElementById('winModal').classList.remove('show');
}

// 重新开始游戏
function restartGame() {
    initGame();
}

// 页面加载时初始化游戏
initGame();

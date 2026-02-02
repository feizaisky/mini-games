// 游戏状态
let score = 0;
let timeLeft = 60;
let gameRunning = false;
let moleTimer = null;
let countdownTimer = null;
let currentMole = null;
let moleSpeed = 1500;
let holes = [];

// 初始化游戏
function initGame() {
    score = 0;
    timeLeft = 60;
    moleSpeed = 1500;
    gameRunning = false;

    if (moleTimer) {
        clearTimeout(moleTimer);
        moleTimer = null;
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }

    updateDisplay();
    updateBestScore();
    createHoles();
}

// 创建地鼠洞
function createHoles() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    holes = [];

    for (let i = 0; i < 9; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.dataset.index = i;

        const mole = document.createElement('div');
        mole.className = 'mole';
        mole.dataset.index = i;

        hole.appendChild(mole);
        board.appendChild(hole);
        holes.push({ element: hole, mole: mole });

        mole.addEventListener('click', (e) => {
            e.stopPropagation();
            whackMole(i);
        });

        hole.addEventListener('click', () => {
            whackMole(i);
        });
    }
}

// 开始游戏
function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    score = 0;
    timeLeft = 60;
    moleSpeed = 1500;

    document.getElementById('startBtn').disabled = true;
    document.getElementById('startBtn').textContent = '游戏进行中...';

    updateDisplay();
    showMole();
    startTimer();
}

// 显示地鼠
function showMole() {
    if (!gameRunning) return;

    // 隐藏当前地鼠
    if (currentMole !== null) {
        holes[currentMole].mole.classList.remove('up');
    }

    // 随机选择一个洞
    let randomHole;
    do {
        randomHole = Math.floor(Math.random() * 9);
    } while (randomHole === currentMole);

    currentMole = randomHole;
    holes[currentMole].mole.classList.remove('hit');
    holes[currentMole].mole.classList.add('up');

    // 根据分数增加难度
    if (score >= 50) {
        moleSpeed = 700;
    } else if (score >= 30) {
        moleSpeed = 900;
    } else if (score >= 15) {
        moleSpeed = 1100;
    }

    // 设置下一个地鼠出现时间（随机变化）
    const randomTime = moleSpeed + Math.random() * 500 - 250;

    moleTimer = setTimeout(() => {
        if (currentMole !== null && !holes[currentMole].mole.classList.contains('hit')) {
            holes[currentMole].mole.classList.remove('up');
        }
        showMole();
    }, randomTime);
}

// 打地鼠
function whackMole(index) {
    if (!gameRunning) return;

    const hole = holes[index];
    if (!hole.mole.classList.contains('up') || hole.mole.classList.contains('hit')) {
        return;
    }

    score++;
    hole.mole.classList.add('hit');
    hole.mole.classList.remove('up');

    updateDisplay();

    // 更新最高分
    const highScore = localStorage.getItem('whackMoleHighScore') || 0;
    if (score > parseInt(highScore)) {
        localStorage.setItem('whackMoleHighScore', score);
        updateBestScore();
    }
}

// 更新显示
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('timer').textContent = timeLeft;
}

// 更新最高分显示
function updateBestScore() {
    const highScore = localStorage.getItem('whackMoleHighScore');
    const bestScoreElement = document.getElementById('bestScore');

    if (highScore) {
        bestScoreElement.textContent = `🏆 最高分: ${highScore}`;
    } else {
        bestScoreElement.textContent = '';
    }
}

// 开始倒计时
function startTimer() {
    countdownTimer = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// 游戏结束
function endGame() {
    gameRunning = false;

    if (moleTimer) {
        clearTimeout(moleTimer);
        moleTimer = null;
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }

    // 隐藏当前地鼠
    if (currentMole !== null) {
        holes[currentMole].mole.classList.remove('up');
    }

    document.getElementById('startBtn').disabled = false;
    document.getElementById('startBtn').textContent = '🎮 开始游戏';

    // 保存最高分
    const highScore = localStorage.getItem('whackMoleHighScore') || 0;
    if (score > parseInt(highScore)) {
        localStorage.setItem('whackMoleHighScore', score);
        updateBestScore();
    }

    // 显示模态框
    const modal = document.getElementById('endModal');
    const title = document.getElementById('modalTitle');
    const finalScore = document.getElementById('finalScore');

    if (score >= 50) {
        title.textContent = '🎉 太棒了！';
    } else if (score >= 30) {
        title.textContent = '👏 很不错！';
    } else if (score >= 15) {
        title.textContent = '😊 继续加油！';
    } else {
        title.textContent = '💪 再试一次！';
    }

    finalScore.textContent = `你打中了 ${score} 只地鼠！`;
    modal.classList.add('show');
}

// 关闭模态框
function closeModal() {
    document.getElementById('endModal').classList.remove('show');
}

// 页面加载时初始化
initGame();

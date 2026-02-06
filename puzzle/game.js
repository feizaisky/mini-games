var sizeLevels = [
    { size: 3, name: '3×3', unlock: 0 },
    { size: 4, name: '4×4', unlock: 1 },
    { size: 5, name: '5×5', unlock: 2 }
];

var images = [
    { id: 'sunset', label: '夕阳' },
    { id: 'ocean', label: '海浪' },
    { id: 'forest', label: '森林' },
    { id: 'city', label: '城市' },
    { id: 'candy', label: '糖果' },
    { id: 'aurora', label: '极光' }
];

var sizeGrid = document.getElementById('sizeGrid');
var imageGrid = document.getElementById('imageGrid');
var imagePanel = document.getElementById('imagePanel');
var imageToggle = document.getElementById('imageToggle');
var currentImageLabel = document.getElementById('currentImageLabel');
var sizePanel = document.getElementById('sizePanel');
var sizeToggle = document.getElementById('sizeToggle');
var currentSizeLabel = document.getElementById('currentSizeLabel');
var board = document.getElementById('board');
var movesValue = document.getElementById('movesValue');
var timeValue = document.getElementById('timeValue');
var bestValue = document.getElementById('bestValue');
var message = document.getElementById('message');
var startBtn = document.getElementById('startBtn');
var shuffleBtn = document.getElementById('shuffleBtn');
var resetBtn = document.getElementById('resetBtn');
var winModal = document.getElementById('winModal');
var winDetail = document.getElementById('winDetail');
var closeWinBtn = document.getElementById('closeWinBtn');
var nextLevelBtn = document.getElementById('nextLevelBtn');
var GAME_ID = 'puzzle';
var STORAGE_PREFIX = 'miniGames.v1.' + GAME_ID;
var STORAGE_KEYS = {
    best: STORAGE_PREFIX + '.best',
    stats: STORAGE_PREFIX + '.stats',
    progress: STORAGE_PREFIX + '.progress'
};

var unlockKey = 'puzzleV2Unlock';
var panelKey = 'puzzleV2ImagePanel';
var sizePanelKey = 'puzzleV2SizePanel';

var currentSize = 3;
var unlockedLevel = 0;
var currentImage = images[0].id;
var tiles = [];
var moves = 0;
var secondsElapsed = 0;
var timerId = null;
var hasStarted = false;
var selectedIndex = null;
var raceMode = false;
var raceTimeLeft = 0;

var imageCache = {};

function init() {
    loadUnlocks();
    setupImagePanel();
    setupSizePanel();
    renderSizeButtons();
    renderImageCards();
    bindEvents();
    setMessage('选择难度与图案，点击开始后两两交换完成拼图。');
    buildBoard();
    updateBest();
}

function loadUnlocks() {
    var stored = parseInt(localStorage.getItem(unlockKey), 10);
    if (!isNaN(stored) && stored >= 0) {
        unlockedLevel = Math.min(stored, sizeLevels.length - 1);
    } else {
        unlockedLevel = 0;
    }
}

function bindEvents() {
    startBtn.addEventListener('click', startGame);
    shuffleBtn.addEventListener('click', shuffleBoard);
    resetBtn.addEventListener('click', resetProgress);
    closeWinBtn.addEventListener('click', hideWinModal);
    nextLevelBtn.addEventListener('click', goNextLevel);
    ensureRaceButton();
}

function setupImagePanel() {
    var stored = localStorage.getItem(panelKey);
    var collapsed = stored ? stored === 'collapsed' : true;
    setPanelCollapsed(collapsed);
    imageToggle.addEventListener('click', function() {
        setPanelCollapsed(!imagePanel.classList.contains('collapsed'));
    });
}

function setupSizePanel() {
    var stored = localStorage.getItem(sizePanelKey);
    var collapsed = stored ? stored === 'collapsed' : false;
    setSizePanelCollapsed(collapsed);
    sizeToggle.addEventListener('click', function() {
        setSizePanelCollapsed(!sizePanel.classList.contains('collapsed'));
    });
}

function renderSizeButtons() {
    sizeGrid.innerHTML = '';
    for (var i = 0; i < sizeLevels.length; i++) {
        (function(level, index) {
            var btn = document.createElement('button');
            btn.className = 'size-btn';
            btn.textContent = level.name;
            if (index > unlockedLevel) {
                btn.classList.add('locked');
                btn.textContent = '🔒';
            }
            if (level.size === currentSize) {
                btn.classList.add('selected');
            }
            btn.addEventListener('click', function() {
                if (index > unlockedLevel) return;
                currentSize = level.size;
                renderSizeButtons();
                buildBoard();
                updateBest();
            });
            sizeGrid.appendChild(btn);
        })(sizeLevels[i], i);
    }
    currentSizeLabel.textContent = getSizeLabel(currentSize);
}

function renderImageCards() {
    imageGrid.innerHTML = '';
    for (var i = 0; i < images.length; i++) {
        (function(image) {
            var button = document.createElement('button');
            button.className = 'image-card';
            if (image.id === currentImage) {
                button.classList.add('selected');
            }
            var canvas = document.createElement('canvas');
            canvas.width = 96;
            canvas.height = 96;
            canvas.className = 'image-thumb';
            button.appendChild(canvas);
            imageGrid.appendChild(button);
            drawImageThumb(image.id, canvas);

            button.addEventListener('click', function() {
                currentImage = image.id;
                renderImageCards();
                buildBoard();
                updateBest();
            });
        })(images[i]);
    }
    currentImageLabel.textContent = getImageLabel(currentImage);
}

function startGame() {
    if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    if (!hasStarted) {
        hasStarted = true;
        shuffleBoard();
    } else {
        shuffleBoard();
    }
}

function buildBoard() {
    stopTimer();
    secondsElapsed = 0;
    moves = 0;
    hasStarted = false;
    selectedIndex = null;
    tiles = [];

    var count = currentSize * currentSize;
    for (var i = 0; i < count; i++) {
        tiles.push(i);
    }
    renderBoard();
    updateStats();
}

function shuffleBoard() {
    if (!hasStarted) {
        hasStarted = true;
    }
    stopTimer();
    secondsElapsed = 0;
    raceTimeLeft = raceMode ? (currentSize * currentSize * 8) : 0;
    moves = 0;
    selectedIndex = null;

    var shuffleMoves = currentSize * currentSize * 10;
    for (var i = 0; i < shuffleMoves; i++) {
        var a = Math.floor(Math.random() * tiles.length);
        var b = Math.floor(Math.random() * tiles.length);
        if (a === b) continue;
        swapTiles(a, b, false);
    }

    if (isSolved()) {
        shuffleBoard();
        return;
    }

    renderBoard();
    updateStats();
    setMessage('开始！点击两块进行交换。');
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({
        size: currentSize,
        image: currentImage,
        raceMode: raceMode,
        updatedAt: Date.now()
    }));
}

function renderBoard() {
    board.innerHTML = '';
    board.style.gridTemplateColumns = 'repeat(' + currentSize + ', 1fr)';

    var size = 100 * currentSize;
    var image = getImageData(currentImage, size);

    for (var i = 0; i < tiles.length; i++) {
        var value = tiles[i];
        var tile = document.createElement('div');
        tile.className = 'tile';
        var row = Math.floor(value / currentSize);
        var col = value % currentSize;
        var bgX = (col / (currentSize - 1)) * 100;
        var bgY = (row / (currentSize - 1)) * 100;
        tile.style.backgroundImage = 'url(' + image + ')';
        tile.style.backgroundSize = (currentSize * 100) + '% ' + (currentSize * 100) + '%';
        tile.style.backgroundPosition = bgX + '% ' + bgY + '%';
        tile.setAttribute('data-index', i);
        if (selectedIndex === i) {
            tile.classList.add('selected');
        }
        (function(index) {
            tile.addEventListener('click', function() {
                moveTile(index);
            });
        })(i);
        board.appendChild(tile);
    }
}

function moveTile(index) {
    if (!hasStarted) return;

    if (!timerId) {
        startTimer();
    }

    if (selectedIndex === null) {
        selectedIndex = index;
        renderBoard();
        return;
    }

    if (selectedIndex === index) {
        selectedIndex = null;
        renderBoard();
        return;
    }

    swapTiles(index, selectedIndex, true);
    selectedIndex = null;
    moves += 1;
    if (typeof GameAudio !== 'undefined') GameAudio.play('move');

    renderBoard();
    updateStats();

    if (isSolved()) {
        finishGame();
    }
}

function swapTiles(i, j, repaint) {
    var temp = tiles[i];
    tiles[i] = tiles[j];
    tiles[j] = temp;
    if (repaint) {
        renderBoard();
    }
}

function isSolved() {
    for (var i = 0; i < tiles.length; i++) {
        if (tiles[i] !== i) return false;
    }
    return true;
}

function finishGame() {
    stopTimer();
    if (typeof GameAudio !== 'undefined') GameAudio.play('win');
    if (typeof GameCelebration !== 'undefined') GameCelebration.show();
    setMessage('太棒了！拼图完成。', true);
    saveBest();
    unlockNext();
    showWinModal();
}

function unlockNext() {
    var currentIndex = -1;
    for (var i = 0; i < sizeLevels.length; i++) {
        if (sizeLevels[i].size === currentSize) {
            currentIndex = i;
            break;
        }
    }
    if (currentIndex >= 0 && currentIndex >= unlockedLevel && currentIndex < sizeLevels.length - 1) {
        unlockedLevel = currentIndex + 1;
        localStorage.setItem(unlockKey, String(unlockedLevel));
        if (typeof GameAudio !== 'undefined') GameAudio.play('upgrade');
        renderSizeButtons();
    }
}

function saveBest() {
    var key = 'puzzleV2Best_' + currentSize;
    var bestRaw = localStorage.getItem(key);
    var current = { moves: moves, time: secondsElapsed };

    if (!bestRaw) {
        localStorage.setItem(key, JSON.stringify(current));
        updateBest();
        return;
    }

    try {
        var best = JSON.parse(bestRaw);
        var betterMoves = current.moves < (best.moves || Infinity);
        var sameMoves = current.moves === (best.moves || Infinity);
        var betterTime = current.time < (best.time || Infinity);

        if (betterMoves || (sameMoves && betterTime)) {
            localStorage.setItem(key, JSON.stringify(current));
        }
    } catch (error) {
        localStorage.setItem(key, JSON.stringify(current));
    }
    localStorage.setItem(STORAGE_KEYS.best, JSON.stringify({
        size: currentSize,
        moves: current.moves,
        time: current.time
    }));
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
        size: currentSize,
        raceMode: raceMode,
        raceTimeLeft: raceTimeLeft,
        moves: current.moves,
        time: current.time,
        updatedAt: Date.now()
    }));
    updateBest();
}

function updateBest() {
    var key = 'puzzleV2Best_' + currentSize;
    var bestRaw = localStorage.getItem(key);
    if (!bestRaw) {
        bestValue.textContent = '--';
        return;
    }

    try {
        var best = JSON.parse(bestRaw);
        var minutes = Math.floor((best.time || 0) / 60);
        var secs = (best.time || 0) % 60;
        bestValue.textContent = (best.moves || 0) + '步 / ' + minutes + ':' + String(secs).padStart(2, '0');
    } catch (error) {
        bestValue.textContent = '--';
    }
}

function resetProgress() {
    localStorage.removeItem(unlockKey);
    for (var i = 0; i < sizeLevels.length; i++) {
        localStorage.removeItem('puzzleV2Best_' + sizeLevels[i].size);
    }
    unlockedLevel = 0;
    currentSize = 3;
    renderSizeButtons();
    buildBoard();
    updateBest();
    setMessage('进度已重置。');
}

function updateStats() {
    movesValue.textContent = String(moves);
    var minutes = Math.floor(secondsElapsed / 60);
    var secs = secondsElapsed % 60;
    if (raceMode) {
        var raceMin = Math.floor(Math.max(0, raceTimeLeft) / 60);
        var raceSec = Math.max(0, raceTimeLeft) % 60;
        timeValue.textContent = minutes + ':' + String(secs).padStart(2, '0') + ' / ⏳ ' + raceMin + ':' + String(raceSec).padStart(2, '0');
    } else {
        timeValue.textContent = minutes + ':' + String(secs).padStart(2, '0');
    }
}

function startTimer() {
    stopTimer();
    timerId = setInterval(function() {
        secondsElapsed += 1;
        if (raceMode) {
            raceTimeLeft -= 1;
            if (raceTimeLeft <= 0) {
                stopTimer();
                hasStarted = false;
                setMessage('⏱️ 时间到！点击开始重试竞速模式。');
                return;
            }
        }
        updateStats();
    }, 1000);
}

function ensureRaceButton() {
    if (document.getElementById('raceBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'raceBtn';
    btn.className = startBtn.className || 'btn';
    btn.textContent = '竞速:关';
    btn.addEventListener('click', function() {
        raceMode = !raceMode;
        btn.textContent = '竞速:' + (raceMode ? '开' : '关');
        buildBoard();
    });
    startBtn.parentNode.appendChild(btn);
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function setMessage(text, isWin) {
    if (isWin === undefined) isWin = false;
    message.textContent = text;
    message.classList.toggle('win', isWin);
}

function showWinModal() {
    var nextLabel = getNextLevelLabel();
    if (nextLabel) {
        winDetail.textContent = '继续挑战 ' + nextLabel + ' 吧！';
        nextLevelBtn.disabled = false;
    } else {
        winDetail.textContent = '已经是最高难度啦！';
        nextLevelBtn.disabled = true;
    }
    winModal.classList.add('show');
}

function hideWinModal() {
    winModal.classList.remove('show');
}

function getNextLevelLabel() {
    var currentIndex = -1;
    for (var i = 0; i < sizeLevels.length; i++) {
        if (sizeLevels[i].size === currentSize) {
            currentIndex = i;
            break;
        }
    }
    if (currentIndex >= 0 && currentIndex < sizeLevels.length - 1) {
        return sizeLevels[currentIndex + 1].name;
    }
    return '';
}

function goNextLevel() {
    hideWinModal();
    var currentIndex = -1;
    for (var i = 0; i < sizeLevels.length; i++) {
        if (sizeLevels[i].size === currentSize) {
            currentIndex = i;
            break;
        }
    }
    if (currentIndex < 0 || currentIndex >= sizeLevels.length - 1) return;
    if (currentIndex + 1 > unlockedLevel) return;
    currentSize = sizeLevels[currentIndex + 1].size;
    renderSizeButtons();
    buildBoard();
    updateBest();
    shuffleBoard();
}

function getImageData(id, size) {
    var cacheKey = id + '-' + size;
    if (imageCache[cacheKey]) {
        return imageCache[cacheKey];
    }
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    if (id === 'sunset') {
        drawGradient(ctx, size, ['#ff7a59', '#fbb040', '#7f00ff']);
        drawSun(ctx, size, '#fff3e0');
        drawBand(ctx, size, '#ffffff');
        drawBadge(ctx, size, 'S', '#ffffff');
    } else if (id === 'ocean') {
        drawGradient(ctx, size, ['#4facfe', '#00f2fe', '#1f7ae0']);
        drawWaves(ctx, size);
        drawBadge(ctx, size, 'O', '#ffffff');
    } else if (id === 'forest') {
        drawGradient(ctx, size, ['#2ecc71', '#27ae60', '#145a32']);
        drawTrees(ctx, size);
        drawBadge(ctx, size, 'F', '#ffffff');
    } else if (id === 'city') {
        drawGradient(ctx, size, ['#bdc3c7', '#2c3e50', '#34495e']);
        drawSkyline(ctx, size);
        drawBadge(ctx, size, 'C', '#ffffff');
    } else if (id === 'candy') {
        drawGradient(ctx, size, ['#ff9a9e', '#fad0c4', '#fbc8d4']);
        drawDots(ctx, size);
        drawBadge(ctx, size, 'D', '#ffffff');
    } else {
        drawGradient(ctx, size, ['#7f7fd5', '#86a8e7', '#91eae4']);
        drawAurora(ctx, size);
        drawBadge(ctx, size, 'A', '#ffffff');
    }

    var dataUrl = canvas.toDataURL();
    imageCache[cacheKey] = dataUrl;
    return dataUrl;
}

function drawImageThumb(id, canvas) {
    var size = canvas.width;
    var ctx = canvas.getContext('2d');
    var dataUrl = getImageData(id, size * 2);
    var img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
    };
    img.src = dataUrl;
}

function drawGradient(ctx, size, colors) {
    var gradient = ctx.createLinearGradient(0, 0, size, size);
    for (var i = 0; i < colors.length; i++) {
        gradient.addColorStop(i / (colors.length - 1), colors[i]);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
}

function drawSun(ctx, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.3, size * 0.14, 0, Math.PI * 2);
    ctx.fill();
}

function drawBand(ctx, size, color) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(size * 0.1, size * 0.55, size * 0.8, size * 0.12);
    ctx.fillStyle = color;
    ctx.fillRect(size * 0.1, size * 0.68, size * 0.8, size * 0.06);
}

function drawWaves(ctx, size) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    for (var y = size * 0.4; y < size; y += 18) {
        ctx.beginPath();
        ctx.moveTo(size * 0.1, y);
        ctx.quadraticCurveTo(size * 0.3, y - 8, size * 0.5, y);
        ctx.quadraticCurveTo(size * 0.7, y + 8, size * 0.9, y);
        ctx.stroke();
    }
}

function drawTrees(ctx, size) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var i = 0; i < 6; i++) {
        var x = size * (0.12 + i * 0.14);
        var h = size * (0.2 + (i % 3) * 0.08);
        ctx.beginPath();
        ctx.moveTo(x, size * 0.75);
        ctx.lineTo(x - size * 0.06, size * 0.75 - h);
        ctx.lineTo(x + size * 0.06, size * 0.75 - h);
        ctx.closePath();
        ctx.fill();
    }
}

function drawSkyline(ctx, size) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var i = 0; i < 7; i++) {
        var x = size * (0.08 + i * 0.13);
        var w = size * 0.08;
        var h = size * (0.2 + (i % 3) * 0.1);
        ctx.fillRect(x, size * 0.7 - h, w, h);
    }
}

function drawDots(ctx, size) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (var i = 0; i < 20; i++) {
        var x = Math.random() * size;
        var y = Math.random() * size;
        var r = 4 + Math.random() * 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawAurora(ctx, size) {
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 6;
    for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(size * 0.1, size * (0.2 + i * 0.15));
        ctx.bezierCurveTo(size * 0.3, size * (0.1 + i * 0.15), size * 0.7, size * (0.3 + i * 0.15), size * 0.9, size * (0.2 + i * 0.15));
        ctx.stroke();
    }
}

function drawBadge(ctx, size, text, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = 'bold ' + Math.floor(size * 0.18) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size * 0.5, size * 0.5);
}

function getImageLabel(id) {
    for (var i = 0; i < images.length; i++) {
        if (images[i].id === id) return images[i].label;
    }
    return '';
}

function setPanelCollapsed(collapsed) {
    imagePanel.classList.toggle('collapsed', collapsed);
    imageToggle.textContent = collapsed ? '展开' : '收起';
    localStorage.setItem(panelKey, collapsed ? 'collapsed' : 'expanded');
}

function setSizePanelCollapsed(collapsed) {
    sizePanel.classList.toggle('collapsed', collapsed);
    sizeToggle.textContent = collapsed ? '展开' : '收起';
    localStorage.setItem(sizePanelKey, collapsed ? 'collapsed' : 'expanded');
}

function getSizeLabel(size) {
    for (var i = 0; i < sizeLevels.length; i++) {
        if (sizeLevels[i].size === size) return sizeLevels[i].name;
    }
    return '';
}

init();

window.render_game_to_text = function() {
    return JSON.stringify({
        coordinateSystem: 'tile index in board array',
        mode: hasStarted ? 'playing' : 'idle',
        size: currentSize,
        moves: moves,
        secondsElapsed: secondsElapsed,
        raceMode: raceMode,
        raceTimeLeft: raceTimeLeft
    });
};

window.advanceTime = function(ms) {
    var ticks = Math.max(1, Math.floor(ms / 1000));
    for (var i = 0; i < ticks; i++) {
        secondsElapsed += 1;
        if (raceMode) raceTimeLeft = Math.max(0, raceTimeLeft - 1);
    }
    updateStats();
};

window.get_game_meta = function() {
    return JSON.stringify({
        gameId: GAME_ID,
        version: 'v1',
        mode: raceMode ? 'race' : 'classic'
    });
};

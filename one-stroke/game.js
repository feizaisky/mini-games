const levels = [
    { name: '1-1', rows: 3, cols: 3, start: [0, 1], end: [0, 2], blocked: [[2, 2]] },
    { name: '1-2', rows: 3, cols: 3, start: [2, 1], end: [0, 0], blocked: [[2, 0]] },
    { name: '1-3', rows: 3, cols: 4, start: [0, 0], end: [2, 2], blocked: [[1, 2]] },
    { name: '2-1', rows: 4, cols: 4, start: [1, 2], end: [0, 3], blocked: [[2, 2]] },
    { name: '2-2', rows: 4, cols: 4, start: [0, 3], end: [3, 2], blocked: [[3, 3]] },
    { name: '2-3', rows: 4, cols: 4, start: [3, 2], end: [2, 2], blocked: [[0, 0], [1, 2]] },
    { name: '3-1', rows: 5, cols: 5, start: [3, 0], end: [1, 3], blocked: [[3, 1]] },
    { name: '3-2', rows: 5, cols: 5, start: [0, 3], end: [1, 1], blocked: [[3, 3]] },
    { name: '3-3', rows: 5, cols: 5, start: [4, 4], end: [0, 2], blocked: [[2, 3], [2, 4]] },
    { name: '4-1', rows: 5, cols: 6, start: [4, 2], end: [2, 4], blocked: [[4, 3]] },
    { name: '4-2', rows: 5, cols: 6, start: [0, 3], end: [1, 0], blocked: [[3, 1]] },
    { name: '4-3', rows: 5, cols: 6, start: [0, 2], end: [0, 3], blocked: [[2, 0], [4, 3]] }
];

const board = document.getElementById('board');
const progressValue = document.getElementById('progressValue');
const movesValue = document.getElementById('movesValue');
const timeValue = document.getElementById('timeValue');
const message = document.getElementById('message');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const levelGrid = document.getElementById('levelGrid');
const levelPanel = document.getElementById('levelPanel');
const levelToggle = document.getElementById('levelToggle');
const currentLevelLabel = document.getElementById('currentLevelLabel');

let currentLevelIndex = 0;
let nodes = [];
let nodeMap = new Map();
let blockedSet = new Set();
let path = [];
let isDrawing = false;
let timerId = null;
let secondsElapsed = 0;
let lastPointer = null;
let polyline = null;
let unlockedLevel = 0;

const unlockKey = 'oneStrokeUnlocked';
const panelKey = 'oneStrokeLevelPanel';

function init() {
    loadUnlocks();
    setupLevelPanel();
    renderLevelList();
    resetBtn.addEventListener('click', () => setupLevel(currentLevelIndex));
    undoBtn.addEventListener('click', undoStep);

    board.addEventListener('pointerdown', handlePointerDown);
    board.addEventListener('pointermove', handlePointerMove);
    board.addEventListener('pointerup', handlePointerUp);
    board.addEventListener('pointerleave', handlePointerUp);

    setupLevel(unlockedLevel);
}

function setupLevelPanel() {
    const stored = localStorage.getItem(panelKey);
    const collapsed = stored ? stored === 'collapsed' : true;
    setPanelCollapsed(collapsed);
    levelToggle.addEventListener('click', () => {
        setPanelCollapsed(!levelPanel.classList.contains('collapsed'));
    });
}

function loadUnlocks() {
    const stored = parseInt(localStorage.getItem(unlockKey), 10);
    if (!Number.isNaN(stored) && stored >= 0) {
        unlockedLevel = Math.min(stored, levels.length - 1);
    } else {
        unlockedLevel = 0;
    }
}

function setupLevel(levelIndex) {
    if (levelIndex > unlockedLevel) return;
    currentLevelIndex = levelIndex;
    path = [];
    isDrawing = false;
    secondsElapsed = 0;
    lastPointer = null;
    clearTimer();

    createNodes();
    renderBoard();
    updateStats();
    updateLevelSelection();
    const level = levels[currentLevelIndex];
    setMessage(`起点为蓝色，终点为绿色，避开障碍完成 ${level.name}。`);
}

function createNodes() {
    const { rows, cols, blocked } = levels[currentLevelIndex];
    const size = 320;
    const padding = 28;
    const width = size - padding * 2;
    const height = size - padding * 2;
    const dx = cols > 1 ? width / (cols - 1) : 0;
    const dy = rows > 1 ? height / (rows - 1) : 0;

    nodes = [];
    nodeMap = new Map();
    blockedSet = new Set(blocked.map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (blockedSet.has(`${r},${c}`)) continue;
            const index = r * cols + c;
            const node = {
                index,
                row: r,
                col: c,
                x: padding + c * dx,
                y: padding + r * dy
            };
            nodes.push(node);
            nodeMap.set(index, node);
        }
    }
}

function renderBoard() {
    board.innerHTML = '';
    polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('class', 'path-line');
    polyline.setAttribute('points', '');
    board.appendChild(polyline);

    renderObstacles();
    renderRings();

    nodes.forEach(node => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 10);
        circle.setAttribute('data-index', node.index);
        circle.setAttribute('class', getNodeClass(node));
        board.appendChild(circle);
    });

    renderLabels();
}

function renderObstacles() {
    const { rows, cols } = levels[currentLevelIndex];
    const size = 320;
    const padding = 28;
    const width = size - padding * 2;
    const height = size - padding * 2;
    const dx = cols > 1 ? width / (cols - 1) : 0;
    const dy = rows > 1 ? height / (rows - 1) : 0;

    blockedSet.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const x = padding + c * dx;
        const y = padding + r * dy;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - 8);
        rect.setAttribute('y', y - 8);
        rect.setAttribute('width', 16);
        rect.setAttribute('height', 16);
        rect.setAttribute('class', 'obstacle');
        board.appendChild(rect);
    });
}

function renderRings() {
    const { start, end } = levels[currentLevelIndex];
    const startNode = nodeFromCoord(start);
    const endNode = nodeFromCoord(end);

    if (startNode) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', startNode.x);
        ring.setAttribute('cy', startNode.y);
        ring.setAttribute('r', 12);
        ring.setAttribute('class', 'ring start');
        board.appendChild(ring);
    }

    if (endNode) {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', endNode.x);
        ring.setAttribute('cy', endNode.y);
        ring.setAttribute('r', 12);
        ring.setAttribute('class', 'ring end');
        board.appendChild(ring);
    }
}

function renderLabels() {
    const { start, end } = levels[currentLevelIndex];
    const startNode = nodeFromCoord(start);
    const endNode = nodeFromCoord(end);

    if (startNode) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', startNode.x);
        label.setAttribute('y', startNode.y);
        label.setAttribute('class', 'node-label start');
        label.textContent = '起';
        board.appendChild(label);
    }

    if (endNode) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', endNode.x);
        label.setAttribute('y', endNode.y);
        label.setAttribute('class', 'node-label end');
        label.textContent = '终';
        board.appendChild(label);
    }
}

function getNodeClass(node) {
    const base = ['node'];
    const { start, end } = levels[currentLevelIndex];
    if (node.row === start[0] && node.col === start[1]) {
        base.push('start');
    }
    if (node.row === end[0] && node.col === end[1]) {
        base.push('end');
    }
    return base.join(' ');
}

function handlePointerDown(event) {
    const point = getPointerPosition(event);
    const targetNode = findNode(point);
    if (!targetNode) return;

    if (path.length === 0) {
        if (isStartNode(targetNode)) {
            startPath(targetNode);
        } else {
            setMessage('请从蓝色起点开始。');
        }
    } else {
        const lastNode = nodeMap.get(path[path.length - 1]);
        const previousIndex = path.length >= 2 ? path[path.length - 2] : null;

        if (previousIndex !== null && targetNode.index === previousIndex) {
            undoStep();
        } else if (isAdjacent(lastNode, targetNode) && !path.includes(targetNode.index)) {
            addStep(targetNode);
        }
    }

    isDrawing = true;
    lastPointer = point;
}

function handlePointerMove(event) {
    if (!isDrawing || path.length === 0) return;
    const point = getPointerPosition(event);
    lastPointer = point;

    const targetNode = findNode(point);
    if (!targetNode) return;

    const lastNode = nodeMap.get(path[path.length - 1]);
    if (targetNode.index === lastNode.index) return;

    const previousIndex = path.length >= 2 ? path[path.length - 2] : null;
    if (previousIndex !== null && targetNode.index === previousIndex) {
        undoStep();
        return;
    }

    if (isAdjacent(lastNode, targetNode) && !path.includes(targetNode.index)) {
        addStep(targetNode);
    }
}

function handlePointerUp() {
    isDrawing = false;
    lastPointer = null;
}

function startPath(startNode) {
    path = [startNode.index];
    secondsElapsed = 0;
    clearTimer();
    timerId = setInterval(() => {
        secondsElapsed += 1;
        updateTime();
    }, 1000);
    updatePathVisual();
    updateStats();
}

function addStep(node) {
    path.push(node.index);
    updatePathVisual();
    updateStats();

    if (path.length === nodes.length) {
        if (isEndNode(node)) {
            finishLevel();
        } else {
            setMessage('还差一步：必须在绿色终点结束。');
        }
    }
}

function undoStep() {
    if (path.length <= 1) return;
    path.pop();
    updatePathVisual();
    updateStats();
}

function updatePathVisual() {
    const points = path.map(index => {
        const node = nodeMap.get(index);
        return `${node.x},${node.y}`;
    });

    polyline.setAttribute('points', points.join(' '));

    board.querySelectorAll('.node').forEach(circle => {
        const index = parseInt(circle.getAttribute('data-index'), 10);
        circle.classList.remove('visited', 'current');
        if (path.includes(index)) {
            circle.classList.add('visited');
        }
        if (path.length && index === path[path.length - 1]) {
            circle.classList.add('current');
        }
    });
}

function updateStats() {
    const total = nodes.length;
    const current = path.length;
    const moves = Math.max(0, path.length - 1);

    progressValue.textContent = `${current}/${total}`;
    movesValue.textContent = `${moves}`;
    updateTime();
}

function updateTime() {
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    timeValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function finishLevel() {
    clearTimer();
    isDrawing = false;
    setMessage('太棒了！完美一笔画！', true);
    saveBestScore();
    unlockNextLevel();
    autoAdvance();
}

function saveBestScore() {
    const key = 'oneStrokeBest';
    const bestRaw = localStorage.getItem(key);
    const current = {
        level: levels[currentLevelIndex].name,
        nodes: nodes.length,
        time: secondsElapsed,
        moves: Math.max(0, path.length - 1)
    };

    if (!bestRaw) {
        localStorage.setItem(key, JSON.stringify(current));
        return;
    }

    try {
        const best = JSON.parse(bestRaw);
        const betterLevel = current.nodes > (best.nodes || 0);
        const sameLevel = current.nodes === (best.nodes || 0);
        const betterTime = current.time < (best.time || Infinity);
        const betterMoves = current.moves < (best.moves || Infinity);

        if (betterLevel || (sameLevel && (betterTime || betterMoves))) {
            localStorage.setItem(key, JSON.stringify(current));
        }
    } catch (error) {
        localStorage.setItem(key, JSON.stringify(current));
    }
}

function unlockNextLevel() {
    if (currentLevelIndex >= levels.length - 1) return;
    if (currentLevelIndex >= unlockedLevel) {
        unlockedLevel = currentLevelIndex + 1;
        localStorage.setItem(unlockKey, `${unlockedLevel}`);
        renderLevelList();
    }
}

function autoAdvance() {
    if (currentLevelIndex >= levels.length - 1) return;
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex > unlockedLevel) return;
    setTimeout(() => {
        setupLevel(nextIndex);
    }, 900);
}

function renderLevelList() {
    levelGrid.innerHTML = '';
    levels.forEach((level, index) => {
        const button = document.createElement('button');
        button.className = 'level-btn';
        button.textContent = level.name;
        button.dataset.level = index;
        if (index > unlockedLevel) {
            button.classList.add('locked');
            button.textContent = '🔒';
        }
        if (index === currentLevelIndex) {
            button.classList.add('selected');
        }
        button.addEventListener('click', () => {
            if (index > unlockedLevel) return;
            setupLevel(index);
        });
        levelGrid.appendChild(button);
    });
}

function updateLevelSelection() {
    levelGrid.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('selected');
        const index = parseInt(btn.dataset.level, 10);
        if (index === currentLevelIndex) {
            btn.classList.add('selected');
        }
    });
    currentLevelLabel.textContent = levels[currentLevelIndex].name;
}

function setMessage(text, isWin = false) {
    message.textContent = text;
    message.classList.toggle('win', isWin);
}

function setPanelCollapsed(collapsed) {
    levelPanel.classList.toggle('collapsed', collapsed);
    levelToggle.textContent = collapsed ? '展开' : '收起';
    localStorage.setItem(panelKey, collapsed ? 'collapsed' : 'expanded');
}

function clearTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function getPointerPosition(event) {
    const rect = board.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 320;
    const y = ((event.clientY - rect.top) / rect.height) * 320;
    return { x, y };
}

function findNode(point) {
    const hitRadius = 16;
    for (const node of nodes) {
        const dx = node.x - point.x;
        const dy = node.y - point.y;
        if (Math.hypot(dx, dy) <= hitRadius) {
            return node;
        }
    }
    return null;
}

function isAdjacent(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function isStartNode(node) {
    const { start } = levels[currentLevelIndex];
    return node.row === start[0] && node.col === start[1];
}

function isEndNode(node) {
    const { end } = levels[currentLevelIndex];
    return node.row === end[0] && node.col === end[1];
}

function nodeFromCoord(coord) {
    const [row, col] = coord;
    for (const node of nodes) {
        if (node.row === row && node.col === col) {
            return node;
        }
    }
    return null;
}

init();

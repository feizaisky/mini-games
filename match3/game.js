(function() {
    const COLS = 8;
    const ROWS = 8;
    const CELL = 40;
    const CANVAS_SIZE = COLS * CELL;
    const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    const NUM_COLORS = 5;
    const MAX_STEPS = 25;
    const STORAGE_KEY = 'miniGames.v1.match3.best';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = CANVAS_SIZE + 'px';
    canvas.style.height = CANVAS_SIZE + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scoreEl = document.getElementById('score');
    const movesEl = document.getElementById('moves');
    const bestScoreEl = document.getElementById('bestScore');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');

    let grid = [];
    let selected = null;
    let score = 0;
    let movesLeft = MAX_STEPS;
    let bestScore = 0;
    let gameRunning = false;
    let animating = false;
    let combo = 0;

    function loadBest() {
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            return v ? Math.max(0, parseInt(v, 10)) : 0;
        } catch (e) { return 0; }
    }

    function saveBest() {
        if (score <= bestScore) return;
        bestScore = score;
        try { localStorage.setItem(STORAGE_KEY, String(bestScore)); } catch (e) {}
        bestScoreEl.textContent = bestScore;
        if (typeof GameAudio !== 'undefined') GameAudio.play('record');
    }

    function fillGrid() {
        for (let r = 0; r < ROWS; r++) {
            grid[r] = [];
            for (let c = 0; c < COLS; c++) {
                grid[r][c] = Math.floor(Math.random() * NUM_COLORS);
            }
        }
        while (findMatches().length > 0) {
            removeMatches(findMatches());
            drop();
            fillEmpty();
        }
    }

    function findMatches() {
        const set = {};
        function add(r, c) { set[r + ',' + c] = true; }
        for (let r = 0; r < ROWS; r++) {
            let len = 1;
            for (let c = 1; c <= COLS; c++) {
                if (c < COLS && grid[r][c] === grid[r][c - 1]) {
                    len++;
                } else {
                    if (len >= 3) for (let i = c - len; i < c; i++) add(r, i);
                    len = 1;
                }
            }
        }
        for (let c = 0; c < COLS; c++) {
            let len = 1;
            for (let r = 1; r <= ROWS; r++) {
                if (r < ROWS && grid[r][c] === grid[r - 1][c]) {
                    len++;
                } else {
                    if (len >= 3) for (let i = r - len; i < r; i++) add(i, c);
                    len = 1;
                }
            }
        }
        return Object.keys(set).map(function(k) {
            const p = k.split(',');
            return { r: parseInt(p[0], 10), c: parseInt(p[1], 10) };
        });
    }

    function removeMatches(matches) {
        const base = 100;
        const count = matches.length;
        combo++;
        const addScore = Math.round(base * count * (1 + (combo - 1) * 0.5));
        score += addScore;
        scoreEl.textContent = score;
        matches.forEach(function(m) {
            grid[m.r][m.c] = -1;
        });
        if (typeof GameAudio !== 'undefined') GameAudio.play(count >= 4 ? 'clear' : 'merge');
    }

    function drop() {
        for (let c = 0; c < COLS; c++) {
            let write = ROWS - 1;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (grid[r][c] >= 0) {
                    if (write !== r) {
                        grid[write][c] = grid[r][c];
                        grid[r][c] = -1;
                    }
                    write--;
                }
            }
        }
    }

    function fillEmpty() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c] < 0) grid[r][c] = Math.floor(Math.random() * NUM_COLORS);
            }
        }
    }

    function swap(r1, c1, r2, c2) {
        const t = grid[r1][c1];
        grid[r1][c1] = grid[r2][c2];
        grid[r2][c2] = t;
    }

    function isAdjacent(r1, c1, r2, c2) {
        return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
    }

    function resolveMatches() {
        let matches = findMatches();
        if (matches.length === 0) {
            combo = 0;
            return false;
        }
        removeMatches(matches);
        drop();
        fillEmpty();
        return true;
    }

    function trySwap(r1, c1, r2, c2) {
        swap(r1, c1, r2, c2);
        const hadMatch = findMatches().length > 0;
        if (!hadMatch) swap(r1, c1, r2, c2);
        return hadMatch;
    }

    function tick() {
        if (!resolveMatches()) {
            animating = false;
            movesLeft--;
            movesEl.textContent = movesLeft + ' / ' + MAX_STEPS;
            if (movesLeft <= 0) endGame();
            return;
        }
        draw();
        requestAnimationFrame(tick);
    }

    function endGame() {
        gameRunning = false;
        startBtn.style.display = '';
        saveBest();
        if (typeof GameCelebration !== 'undefined' && score > 0) GameCelebration.show({ duration: 2000 });
    }

    function draw() {
        ctx.fillStyle = '#2d1b3d';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * CELL + CELL / 2;
                const y = r * CELL + CELL / 2;
                const id = grid[r][c];
                if (id < 0) continue;
                const color = COLORS[id];
                ctx.strokeStyle = '#1a0f26';
                ctx.lineWidth = 2;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, CELL / 2 - 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                if (selected && selected.r === r && selected.c === c) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL, 0);
            ctx.lineTo(i * CELL, CANVAS_SIZE);
            ctx.stroke();
        }
        for (let i = 0; i <= ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * CELL);
            ctx.lineTo(CANVAS_SIZE, i * CELL);
            ctx.stroke();
        }
    }

    function getCell(x, y) {
        const rect = canvas.getBoundingClientRect();
        const cx = (x - rect.left) * (CANVAS_SIZE / rect.width);
        const cy = (y - rect.top) * (CANVAS_SIZE / rect.height);
        const c = Math.floor(cx / CELL);
        const r = Math.floor(cy / CELL);
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) return { r: r, c: c };
        return null;
    }

    function handleClick(r, c) {
        if (!gameRunning || animating || movesLeft <= 0) return;
        if (selected) {
            if (selected.r === r && selected.c === c) {
                selected = null;
                draw();
                return;
            }
            if (!isAdjacent(selected.r, selected.c, r, c)) {
                selected = { r: r, c: c };
                draw();
                return;
            }
            const ok = trySwap(selected.r, selected.c, r, c);
            selected = null;
            if (ok) {
                if (typeof GameAudio !== 'undefined') GameAudio.play('move');
                animating = true;
                draw();
                requestAnimationFrame(tick);
            } else {
                if (typeof GameAudio !== 'undefined') GameAudio.play('error');
                draw();
            }
            return;
        }
        selected = { r: r, c: c };
        draw();
    }

    function startGame() {
        fillGrid();
        score = 0;
        movesLeft = MAX_STEPS;
        combo = 0;
        selected = null;
        gameRunning = true;
        animating = false;
        scoreEl.textContent = '0';
        movesEl.textContent = movesLeft + ' / ' + MAX_STEPS;
        bestScore = loadBest();
        bestScoreEl.textContent = bestScore;
        startBtn.style.display = 'none';
        draw();
        if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    }

    canvas.addEventListener('click', function(e) {
        const cell = getCell(e.clientX, e.clientY);
        if (cell) handleClick(cell.r, cell.c);
    });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        const t = e.changedTouches[0];
        const cell = getCell(t.clientX, t.clientY);
        if (cell) handleClick(cell.r, cell.c);
    }, { passive: false });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', function() {
        if (gameRunning) startGame();
    });

    bestScoreEl.textContent = loadBest();
    draw();
    if (typeof window.GameLoader !== 'undefined') window.GameLoader.hide();
})();

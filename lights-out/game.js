(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const movesEl = document.getElementById('moves');
    const timeEl = document.getElementById('time');
    const bestEl = document.getElementById('best');
    const modeText = document.getElementById('modeText');

    const newGameBtn = document.getElementById('newGameBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const undoBtn = document.getElementById('undoBtn');

    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayDesc = document.getElementById('overlayDesc');
    const overlayStats = document.getElementById('overlayStats');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');

    const sizeButtons = Array.from(document.querySelectorAll('[data-size]'));
    const diffButtons = Array.from(document.querySelectorAll('[data-diff]'));

    const state = {
        mode: 'menu',
        size: 5,
        difficulty: 'normal',
        grid: [],
        moves: 0,
        time: 0,
        history: [],
        layout: {
            boardX: 0,
            boardY: 0,
            boardSize: 0,
            cellSize: 0,
            gap: 0
        }
    };

    const difficultyLabels = {
        easy: '轻松',
        normal: '经典',
        hard: '进阶'
    };

    function createGrid(size, value) {
        const grid = [];
        for (let r = 0; r < size; r += 1) {
            const row = [];
            for (let c = 0; c < size; c += 1) {
                row.push(Boolean(value));
            }
            grid.push(row);
        }
        return grid;
    }

    function copyGrid(grid) {
        return grid.map(row => row.slice());
    }

    function inBounds(row, col) {
        return row >= 0 && row < state.size && col >= 0 && col < state.size;
    }

    function toggleAt(row, col, grid) {
        if (!inBounds(row, col)) return;
        grid[row][col] = !grid[row][col];
    }

    function applyMove(row, col) {
        if (state.mode !== 'playing') return;
        const snapshot = {
            grid: copyGrid(state.grid),
            moves: state.moves,
            time: state.time
        };
        state.history.push(snapshot);

        toggleAt(row, col, state.grid);
        toggleAt(row - 1, col, state.grid);
        toggleAt(row + 1, col, state.grid);
        toggleAt(row, col - 1, state.grid);
        toggleAt(row, col + 1, state.grid);

        if (typeof GameAudio !== 'undefined') GameAudio.play('click');
        state.moves += 1;
        updateStats();
        checkWin();
    }

    function undoMove() {
        if (state.history.length === 0) return;
        if (typeof GameAudio !== 'undefined') GameAudio.play('undo');
        const snapshot = state.history.pop();
        state.grid = snapshot.grid;
        state.moves = snapshot.moves;
        state.time = snapshot.time;
        updateStats();
    }

    function isSolved() {
        for (let r = 0; r < state.size; r += 1) {
            for (let c = 0; c < state.size; c += 1) {
                if (state.grid[r][c]) return false;
            }
        }
        return true;
    }

    function getShuffleMoves(size, difficulty) {
        const base = size * size;
        const factor = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.5 : 1;
        return Math.max(6, Math.round(base * factor));
    }

    function shuffleGrid() {
        state.grid = createGrid(state.size, false);
        const moves = getShuffleMoves(state.size, state.difficulty);
        for (let i = 0; i < moves; i += 1) {
            const row = Math.floor(Math.random() * state.size);
            const col = Math.floor(Math.random() * state.size);
            toggleAt(row, col, state.grid);
            toggleAt(row - 1, col, state.grid);
            toggleAt(row + 1, col, state.grid);
            toggleAt(row, col - 1, state.grid);
            toggleAt(row, col + 1, state.grid);
        }
        if (isSolved()) {
            const row = Math.floor(Math.random() * state.size);
            const col = Math.floor(Math.random() * state.size);
            toggleAt(row, col, state.grid);
            toggleAt(row - 1, col, state.grid);
            toggleAt(row + 1, col, state.grid);
            toggleAt(row, col - 1, state.grid);
            toggleAt(row, col + 1, state.grid);
        }
        state.moves = 0;
        state.time = 0;
        state.history = [];
        state.mode = 'playing';
        updateStats();
    }

    function startGame() {
        if (typeof GameAudio !== 'undefined') GameAudio.play('click');
        shuffleGrid();
        updateModeText();
        hideOverlay();
    }

    function updateModeText() {
        if (state.mode === 'playing') {
            modeText.textContent = '挑战中';
        } else if (state.mode === 'won') {
            modeText.textContent = '已通关';
        } else {
            modeText.textContent = '准备开始';
        }
    }

    function updateStats() {
        movesEl.textContent = state.moves.toString();
        timeEl.textContent = formatTime(state.time);
        bestEl.textContent = getBestLabel();
    }

    function formatTime(totalSeconds) {
        const seconds = Math.floor(totalSeconds);
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return `${minutes}:${remainder.toString().padStart(2, '0')}`;
    }

    function getBestKey() {
        return `lightsOutBest_${state.size}_${state.difficulty}`;
    }

    function loadBest() {
        const raw = localStorage.getItem(getBestKey());
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function saveBest(record) {
        localStorage.setItem(getBestKey(), JSON.stringify(record));
        const overallKey = 'lightsOutBest';
        const overallRecord = {
            ...record,
            size: state.size,
            difficulty: state.difficulty
        };
        let shouldUpdateOverall = true;
        const existingRaw = localStorage.getItem(overallKey);
        if (existingRaw) {
            try {
                const existing = JSON.parse(existingRaw);
                if (existing && existing.moves !== undefined && existing.time !== undefined) {
                    if (overallRecord.moves > existing.moves) {
                        shouldUpdateOverall = false;
                    } else if (overallRecord.moves === existing.moves && overallRecord.time >= existing.time) {
                        shouldUpdateOverall = false;
                    }
                }
            } catch (error) {
                shouldUpdateOverall = true;
            }
        }
        if (shouldUpdateOverall) {
            localStorage.setItem(overallKey, JSON.stringify(overallRecord));
        }
    }

    function getBestLabel() {
        const best = loadBest();
        if (!best) return '--';
        const time = formatTime(best.time);
        return `${best.moves}步 / ${time}`;
    }

    function checkWin() {
        if (!isSolved()) return;
        state.mode = 'won';
        if (typeof GameAudio !== 'undefined') GameAudio.play('win');
        if (typeof GameCelebration !== 'undefined') GameCelebration.show();
        updateModeText();
        updateBestIfNeeded();
        showOverlay(true);
    }

    function updateBestIfNeeded() {
        const best = loadBest();
        const record = {
            moves: state.moves,
            time: Math.floor(state.time)
        };
        let shouldSave = false;
        if (!best) {
            shouldSave = true;
        } else if (record.moves < best.moves) {
            shouldSave = true;
        } else if (record.moves === best.moves && record.time < best.time) {
            shouldSave = true;
        }
        if (shouldSave) {
            saveBest(record);
        }
        updateStats();
    }

    function setSize(size) {
        state.size = size;
        sizeButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === size);
        });
        updateStats();
    }

    function setDifficulty(difficulty) {
        state.difficulty = difficulty;
        diffButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === difficulty);
        });
        updateStats();
    }

    function updateOverlayContent(win) {
        if (win) {
            overlayTitle.textContent = '通关成功';
            overlayDesc.textContent = '全场灯光已熄灭，新的记录还在等你！';
            overlayStats.textContent = `${difficultyLabels[state.difficulty]} ${state.size}x${state.size}：${state.moves} 步 / ${formatTime(state.time)}`;
        } else {
            overlayTitle.textContent = '熄灯挑战';
            overlayDesc.textContent = '点击方块会翻转它与上下左右的灯。把所有灯熄灭即可获胜。';
            overlayStats.textContent = `${difficultyLabels[state.difficulty]} ${state.size}x${state.size} 已准备好`; 
        }
    }

    function showOverlay(win = false) {
        updateOverlayContent(win);
        overlay.classList.add('show');
    }

    function hideOverlay() {
        overlay.classList.remove('show');
    }

    function resizeCanvas() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        const padding = 24;
        const availableSize = Math.min(rect.width - padding, window.innerHeight * 0.7);
        const cssSize = Math.max(240, Math.floor(availableSize));
        canvas.style.width = `${cssSize}px`;
        canvas.style.height = `${cssSize}px`;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(cssSize * dpr);
        canvas.height = Math.floor(cssSize * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getCanvasSize() {
        return canvas.clientWidth;
    }

    function render() {
        const size = getCanvasSize();
        const padding = size * 0.06;
        const boardSize = size - padding * 2;
        const cellSize = boardSize / state.size;
        const gap = Math.max(2, cellSize * 0.08);

        state.layout = {
            boardX: padding,
            boardY: padding,
            boardSize,
            cellSize,
            gap
        };

        ctx.clearRect(0, 0, size, size);
        const bgGradient = ctx.createLinearGradient(0, 0, size, size);
        bgGradient.addColorStop(0, '#1b2230');
        bgGradient.addColorStop(1, '#10141c');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(padding, padding);
        ctx.fillStyle = '#0f131a';
        roundRect(ctx, 0, 0, boardSize, boardSize, 18);
        ctx.fill();

        const pulse = 0.5 + 0.5 * Math.sin(state.time * 3.2);

        for (let r = 0; r < state.size; r += 1) {
            for (let c = 0; c < state.size; c += 1) {
                const cellX = c * cellSize + gap;
                const cellY = r * cellSize + gap;
                const tileSize = cellSize - gap * 2;
                const isOn = state.grid[r] && state.grid[r][c];

                if (isOn) {
                    const glow = ctx.createRadialGradient(
                        cellX + tileSize / 2,
                        cellY + tileSize / 2,
                        tileSize * 0.1,
                        cellX + tileSize / 2,
                        cellY + tileSize / 2,
                        tileSize * 0.9
                    );
                    glow.addColorStop(0, `rgba(255, 245, 190, ${0.7 + pulse * 0.2})`);
                    glow.addColorStop(1, 'rgba(255, 154, 82, 0.2)');
                    ctx.fillStyle = glow;
                    roundRect(ctx, cellX - 2, cellY - 2, tileSize + 4, tileSize + 4, 10);
                    ctx.fill();

                    const light = ctx.createLinearGradient(cellX, cellY, cellX + tileSize, cellY + tileSize);
                    light.addColorStop(0, '#fff4c9');
                    light.addColorStop(1, '#ffc062');
                    ctx.fillStyle = light;
                    ctx.shadowColor = 'rgba(255, 184, 92, 0.6)';
                    ctx.shadowBlur = 12 + pulse * 6;
                    roundRect(ctx, cellX, cellY, tileSize, tileSize, 10);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = '#1f2a3b';
                    roundRect(ctx, cellX, cellY, tileSize, tileSize, 10);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }

    function roundRect(ctxRef, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctxRef.beginPath();
        ctxRef.moveTo(x + radius, y);
        ctxRef.lineTo(x + w - radius, y);
        ctxRef.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctxRef.lineTo(x + w, y + h - radius);
        ctxRef.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctxRef.lineTo(x + radius, y + h);
        ctxRef.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctxRef.lineTo(x, y + radius);
        ctxRef.quadraticCurveTo(x, y, x + radius, y);
        ctxRef.closePath();
    }

    function update(dt) {
        if (state.mode === 'playing') {
            state.time += dt;
            timeEl.textContent = formatTime(state.time);
        }
    }

    let lastTime = 0;
    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;
        update(delta);
        render();
        requestAnimationFrame(loop);
    }

    function pickCell(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * getCanvasSize();
        const y = ((clientY - rect.top) / rect.height) * getCanvasSize();

        const { boardX, boardY, boardSize, cellSize } = state.layout;
        if (x < boardX || y < boardY || x > boardX + boardSize || y > boardY + boardSize) {
            return null;
        }
        const col = Math.floor((x - boardX) / cellSize);
        const row = Math.floor((y - boardY) / cellSize);
        if (!inBounds(row, col)) return null;
        return { row, col };
    }

    canvas.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (state.mode === 'menu') {
            startGame();
            return;
        }
        if (state.mode === 'won') {
            return;
        }
        const cell = pickCell(event.clientX, event.clientY);
        if (cell) {
            applyMove(cell.row, cell.col);
        }
    });

    newGameBtn.addEventListener('click', () => {
        startGame();
    });

    shuffleBtn.addEventListener('click', () => {
        startGame();
    });

    undoBtn.addEventListener('click', () => {
        undoMove();
    });

    startBtn.addEventListener('click', () => {
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        startGame();
    });

    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const size = parseInt(btn.dataset.size, 10);
            if (!Number.isNaN(size)) {
                setSize(size);
                startGame();
            }
        });
    });

    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.dataset.diff;
            setDifficulty(difficulty);
            startGame();
        });
    });

    window.addEventListener('resize', () => {
        resizeCanvas();
        render();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'f' || event.key === 'F') {
            toggleFullscreen();
        }
        if (event.key === 'r' || event.key === 'R') {
            startGame();
        }
        if (event.key === 'u' || event.key === 'U') {
            undoMove();
        }
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    document.addEventListener('fullscreenchange', () => {
        resizeCanvas();
    });

    function init() {
        setSize(state.size);
        setDifficulty(state.difficulty);
        state.grid = createGrid(state.size, false);
        updateStats();
        updateModeText();
        resizeCanvas();
        showOverlay(false);
        requestAnimationFrame(loop);
    }

    window.advanceTime = (ms) => {
        const steps = Math.max(1, Math.round(ms / (1000 / 60)));
        const dt = 1 / 60;
        for (let i = 0; i < steps; i += 1) {
            update(dt);
        }
        render();
    };

    window.render_game_to_text = () => {
        const payload = {
            mode: state.mode,
            size: state.size,
            difficulty: state.difficulty,
            moves: state.moves,
            time: Math.floor(state.time),
            grid: state.grid.map(row => row.map(cell => (cell ? 1 : 0))),
            goal: '将所有灯熄灭 (0 为熄灭, 1 为点亮)',
            coordinates: '左上角为 (0,0)，行向下增加，列向右增加'
        };
        return JSON.stringify(payload);
    };

    init();
})();

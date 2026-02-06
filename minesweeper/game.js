(function() {
    const PRESETS = {
        easy: { rows: 9, cols: 9, mines: 10 },
        medium: { rows: 12, cols: 11, mines: 18 },
        hard: { rows: 18, cols: 11, mines: 35 }
    };
    const STORAGE_KEY = 'miniGames.v1.minesweeper.best';

    const gridWrap = document.getElementById('gridWrap');
    const timerEl = document.getElementById('timer');
    const minesCountEl = document.getElementById('minesCount');
    const flagsCountEl = document.getElementById('flagsCount');
    const bestTimeEl = document.getElementById('bestTime');
    const newGameBtn = document.getElementById('newGameBtn');
    const flagBtn = document.getElementById('flagBtn');
    const diffChips = document.querySelectorAll('[data-diff]');

    let state = {
        difficulty: 'easy',
        rows: 9,
        cols: 9,
        mines: 10,
        grid: [],
        revealed: [],
        flagged: [],
        firstClick: true,
        gameOver: false,
        timerId: null,
        seconds: 0,
        flagMode: false
    };

    function loadBest() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            return JSON.parse(raw);
        } catch (e) { return {}; }
    }

    function saveBest(diff, seconds) {
        const best = loadBest();
        if (best[diff] == null || seconds < best[diff]) {
            best[diff] = seconds;
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(best)); } catch (e) {}
        }
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateBestDisplay() {
        const best = loadBest();
        const v = state.difficulty && best[state.difficulty] != null ? formatTime(best[state.difficulty]) : '--';
        bestTimeEl.textContent = v;
    }

    function getNeighbours(r, c) {
        const out = [];
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++)
                if (dr !== 0 || dc !== 0)
                    if (r + dr >= 0 && r + dr < state.rows && c + dc >= 0 && c + dc < state.cols)
                        out.push([r + dr, c + dc]);
        return out;
    }

    function countMines(r, c) {
        let n = 0;
        getNeighbours(r, c).forEach(function(rc) {
            if (state.grid[rc[0]][rc[1]]) n++;
        });
        return n;
    }

    function placeMines(excludeR, excludeC) {
        const exclude = {};
        exclude[excludeR + ',' + excludeC] = true;
        getNeighbours(excludeR, excludeC).forEach(function(rc) { exclude[rc[0] + ',' + rc[1]] = true; });
        let placed = 0;
        while (placed < state.mines) {
            const r = Math.floor(Math.random() * state.rows);
            const c = Math.floor(Math.random() * state.cols);
            if (exclude[r + ',' + c] || state.grid[r][c]) continue;
            state.grid[r][c] = true;
            placed++;
        }
    }

    function reveal(r, c) {
        if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
        if (state.revealed[r][c] || state.flagged[r][c]) return;
        state.revealed[r][c] = true;
        const cell = gridWrap.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
        if (!cell) return;
        cell.classList.add('revealed');
        cell.classList.remove('flagged');
        if (state.grid[r][c]) {
            cell.classList.add('mine');
            cell.textContent = '*';
            endGame(false);
            return;
        }
        const num = countMines(r, c);
        if (num > 0) {
            cell.textContent = num;
            cell.classList.add('num' + num);
        } else {
            cell.textContent = '';
            getNeighbours(r, c).forEach(function(rc) { reveal(rc[0], rc[1]); });
        }
        checkWin();
    }

    function checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < state.rows; r++)
            for (let c = 0; c < state.cols; c++)
                if (state.revealed[r][c]) revealedCount++;
        const total = state.rows * state.cols;
        if (total - revealedCount === state.mines) {
            endGame(true);
        }
    }

    function endGame(won) {
        state.gameOver = true;
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        if (won) {
            saveBest(state.difficulty, state.seconds);
            updateBestDisplay();
            if (typeof GameAudio !== 'undefined') GameAudio.play('win');
            if (typeof GameCelebration !== 'undefined') GameCelebration.show();
        } else {
            for (let r = 0; r < state.rows; r++)
                for (let c = 0; c < state.cols; c++)
                    if (state.grid[r][c] && !state.flagged[r][c]) {
                        const cell = gridWrap.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
                        if (cell && !cell.classList.contains('revealed')) {
                            cell.classList.add('revealed', 'mine');
                            cell.textContent = '*';
                        }
                    }
            if (typeof GameAudio !== 'undefined') GameAudio.play('lose');
        }
    }

    function startTimer() {
        if (state.timerId) return;
        state.timerId = setInterval(function() {
            state.seconds++;
            timerEl.textContent = formatTime(state.seconds);
        }, 1000);
    }

    function buildGrid() {
        gridWrap.innerHTML = '';
        const preset = PRESETS[state.difficulty];
        state.rows = preset.rows;
        state.cols = preset.cols;
        state.mines = preset.mines;
        state.grid = [];
        state.revealed = [];
        state.flagged = [];
        for (let r = 0; r < state.rows; r++) {
            state.grid[r] = [];
            state.revealed[r] = [];
            state.flagged[r] = [];
            const rowEl = document.createElement('div');
            rowEl.className = 'grid-row';
            for (let c = 0; c < state.cols; c++) {
                state.grid[r][c] = false;
                state.revealed[r][c] = false;
                state.flagged[r][c] = false;
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.setAttribute('role', 'button');
                cell.setAttribute('aria-label', '格子 ' + (r + 1) + ' ' + (c + 1));
                (function(rr, cc) {
                    let longPressTimer = null;
                    cell.addEventListener('click', function(e) {
                        if (state.gameOver) return;
                        if (state.flagMode) {
                            e.preventDefault();
                            toggleFlag(rr, cc);
                            return;
                        }
                        if (state.firstClick) {
                            state.firstClick = false;
                            placeMines(rr, cc);
                            startTimer();
                        }
                        if (state.flagged[rr][cc]) return;
                        reveal(rr, cc);
                        if (typeof GameAudio !== 'undefined' && !state.grid[rr][cc]) GameAudio.play('click');
                    });
                    cell.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (state.gameOver) return;
                        toggleFlag(rr, cc);
                    });
                    cell.addEventListener('touchstart', function() {
                        longPressTimer = setTimeout(function() {
                            longPressTimer = null;
                            if (state.gameOver || state.revealed[rr][cc]) return;
                            toggleFlag(rr, cc);
                        }, 500);
                    }, { passive: true });
                    cell.addEventListener('touchend', function() {
                        if (longPressTimer) clearTimeout(longPressTimer);
                    }, { passive: true });
                })(r, c);
                rowEl.appendChild(cell);
            }
            gridWrap.appendChild(rowEl);
        }
        minesCountEl.textContent = state.mines;
        flagsCountEl.textContent = '0';
        timerEl.textContent = '0:00';
        state.seconds = 0;
        state.firstClick = true;
        state.gameOver = false;
        updateBestDisplay();
    }

    function toggleFlag(r, c) {
        if (state.revealed[r][c] || state.gameOver) return;
        state.flagged[r][c] = !state.flagged[r][c];
        const cell = gridWrap.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
        if (cell) {
            if (state.flagged[r][c]) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            } else {
                cell.classList.remove('flagged');
                cell.textContent = '';
            }
        }
        let flags = 0;
        for (let rr = 0; rr < state.rows; rr++)
            for (let cc = 0; cc < state.cols; cc++)
                if (state.flagged[rr][cc]) flags++;
        flagsCountEl.textContent = flags;
        if (typeof GameAudio !== 'undefined') GameAudio.play('select');
    }

    function newGame() {
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        buildGrid();
    }

    newGameBtn.addEventListener('click', newGame);
    flagBtn.addEventListener('click', function() {
        state.flagMode = !state.flagMode;
        flagBtn.classList.toggle('active', state.flagMode);
        if (typeof GameAudio !== 'undefined') GameAudio.play('click');
    });
    diffChips.forEach(function(chip) {
        chip.addEventListener('click', function() {
            if (state.gameOver || state.firstClick) {
                diffChips.forEach(function(c) { c.classList.remove('active'); });
                chip.classList.add('active');
                state.difficulty = chip.dataset.diff;
                newGame();
            }
        });
    });

    buildGrid();
    if (typeof window.GameLoader !== 'undefined') window.GameLoader.hide();
})();

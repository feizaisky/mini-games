/**
 * UI模块 - 管理游戏界面和用户交互
 */

const UI = {
    elements: {},

    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.loadBestScore();
    },

    cacheElements: function() {
        this.elements = {
            distance: document.getElementById('distance'),
            coins: document.getElementById('coins'),
            soundBtn: document.getElementById('soundBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            startBtn: document.getElementById('startBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            restartBtnPause: document.getElementById('restartBtnPause'),
            shareBtn: document.getElementById('shareBtn'),
            bestScoreDisplay: document.getElementById('bestScoreDisplay'),
            finalDistance: document.getElementById('finalDistance'),
            finalCoins: document.getElementById('finalCoins'),
            finalScore: document.getElementById('finalScore'),
            newRecord: document.getElementById('newRecord'),
            controlsHint: document.querySelector('.controls-hint')
        };
    },

    bindEvents: function() {
        // 开始按钮
        this.elements.startBtn.addEventListener('click', () => {
            if (window.Game) Game.start();
        });

        // 暂停按钮
        this.elements.pauseBtn.addEventListener('click', () => {
            if (window.Game) Game.pause();
        });

        // 继续按钮
        this.elements.resumeBtn.addEventListener('click', () => {
            if (window.Game) Game.resume();
        });

        // 重新开始按钮（暂停界面）
        this.elements.restartBtnPause.addEventListener('click', () => {
            if (window.Game) Game.restart();
        });

        // 重新开始按钮（结束界面）
        this.elements.restartBtn.addEventListener('click', () => {
            if (window.Game) Game.restart();
        });

        // 分享按钮
        this.elements.shareBtn.addEventListener('click', () => {
            this.shareScore();
        });

        // 音效按钮
        this.elements.soundBtn.addEventListener('click', () => {
            if (window.GameAudio) {
                GameAudio.toggle();
                this.updateSoundButton();
            }
        });

        // 初始化音效按钮状态
        this.updateSoundButton();
    },

    updateSoundButton: function() {
        if (window.GameAudio) {
            this.elements.soundBtn.textContent = GameAudio.isMuted() ? '🔇' : '🔊';
        }
    },

    loadBestScore: function() {
        const best = localStorage.getItem('miniGames.v1.endless-runner.best');
        if (best) {
            const data = JSON.parse(best);
            this.elements.bestScoreDisplay.textContent =
                `最高分: ${data.score} (距离 ${data.distance})`;
        }
    },

    updateHUD: function(distance, coins) {
        this.elements.distance.textContent = Math.floor(distance);
        this.elements.coins.textContent = coins;
    },

    showStartScreen: function() {
        this.elements.startScreen.classList.remove('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.controlsHint.classList.add('hidden');
        this.loadBestScore();
    },

    showPauseScreen: function() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.remove('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
    },

    showGameOverScreen: function(distance, coins, score) {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.remove('hidden');

        this.elements.finalDistance.textContent = Math.floor(distance);
        this.elements.finalCoins.textContent = coins;
        this.elements.finalScore.textContent = score;

        // 检查是否新纪录
        const best = localStorage.getItem('miniGames.v1.endless-runner.best');
        let isNewRecord = false;

        if (best) {
            const data = JSON.parse(best);
            isNewRecord = score > data.score;
        } else {
            isNewRecord = true;
        }

        if (isNewRecord && score > 0) {
            this.elements.newRecord.classList.remove('hidden');
            localStorage.setItem('miniGames.v1.endless-runner.best', JSON.stringify({
                score: score,
                distance: Math.floor(distance),
                coins: coins
            }));

            if (window.GameAudio) GameAudio.play('record');
            if (window.GameCelebration) GameCelebration.show();
        } else {
            this.elements.newRecord.classList.add('hidden');
        }
    },

    hideAllOverlays: function() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.controlsHint.classList.remove('hidden');
    },

    shareScore: function() {
        const distance = this.elements.finalDistance.textContent;
        const coins = this.elements.finalCoins.textContent;
        const score = this.elements.finalScore.textContent;

        if (window.GameShare) {
            GameShare.show({
                title: '极速跑酷',
                score: `${score}分`,
                extra: `距离 ${distance} | 金币 ${coins}`,
                icon: '🏃'
            });
        }
    }
};

window.UI = UI;

/**
 * 主模块 - 游戏初始化和主循环
 */

const Game = {
    // 游戏状态
    state: 'idle', // idle, playing, paused, gameover

    // 游戏参数
    baseSpeed: 0.3,
    speed: 0.3,
    maxSpeed: 0.8,
    speedIncrement: 0.0001,

    // 统计
    distance: 0,
    score: 0,

    // Three.js 对象
    scene: null,
    camera: null,
    renderer: null,
    lastFrameTime: 0,
    fixedDeltaMs: 1000 / 60,

    // 触控
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,

    init: function() {
        this.setupThree();
        this.setupLights();
        this.setupModules();
        this.setupControls();
        this.bindAutomationHooks();
        UI.init();
        this.animate();
    },

    setupThree: function() {
        const container = document.querySelector('.game-wrap');
        const canvas = document.getElementById('gameCanvas');

        // 场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 100);

        // 相机
        const aspect = container.clientWidth / container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
        this.camera.position.set(0, 6, 12);
        this.camera.lookAt(0, 1, -10);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 响应式
        window.addEventListener('resize', () => this.onResize());
    },

    setupLights: function() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // 主光源
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(10, 20, 10);
        directional.castShadow = true;
        directional.shadow.mapSize.width = 1024;
        directional.shadow.mapSize.height = 1024;
        directional.shadow.camera.near = 1;
        directional.shadow.camera.far = 100;
        directional.shadow.camera.left = -20;
        directional.shadow.camera.right = 20;
        directional.shadow.camera.top = 20;
        directional.shadow.camera.bottom = -20;
        this.scene.add(directional);

        // 背光
        const backLight = new THREE.DirectionalLight(0x667eea, 0.3);
        backLight.position.set(-5, 10, -10);
        this.scene.add(backLight);
    },

    setupModules: function() {
        Track.init(this.scene);
        Player.init(this.scene);
        Obstacles.init(this.scene);
        Coins.init(this.scene);
    },

    setupControls: function() {
        const canvas = document.getElementById('gameCanvas');

        // 触控事件
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });

        // 鼠标事件（桌面端）
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    },

    bindAutomationHooks: function() {
        window.render_game_to_text = () => this.renderGameToText();
        window.advanceTime = (ms) => this.advanceTime(ms);
        window.get_game_meta = () => ({
            id: 'endless-runner',
            name: '极速跑酷',
            controls: {
                moveLeft: ['ArrowLeft', 'A'],
                moveRight: ['ArrowRight', 'D'],
                jump: ['ArrowUp', 'W', 'Space', 'Click'],
                slide: ['ArrowDown', 'S'],
                pause: ['P', 'Escape'],
                fullscreen: ['F']
            }
        });
    },

    onTouchStart: function(e) {
        if (this.state !== 'playing') return;
        e.preventDefault();

        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    },

    onTouchEnd: function(e) {
        if (this.state !== 'playing') return;
        e.preventDefault();

        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.touchStartX;
        const dy = touch.clientY - this.touchStartY;
        const dt = Date.now() - this.touchStartTime;

        // 判断滑动方向
        const minSwipe = 30;
        const maxTime = 300;

        if (dt < maxTime) {
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
                // 水平滑动
                if (dx > 0) {
                    Player.moveRight();
                } else {
                    Player.moveLeft();
                }
            } else if (dy < -minSwipe) {
                // 上滑 - 跳跃
                Player.jump();
            } else if (dy > minSwipe) {
                // 下滑 - 滑铲
                Player.slide();
            } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                // 点击 - 跳跃
                Player.jump();
            }
        }
    },

    onMouseDown: function(e) {
        if (this.state !== 'playing') return;
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.touchStartTime = Date.now();
    },

    onMouseUp: function(e) {
        if (this.state !== 'playing') return;

        const dx = e.clientX - this.touchStartX;
        const dy = e.clientY - this.touchStartY;
        const dt = Date.now() - this.touchStartTime;

        if (dt < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            Player.jump();
        }
    },

    onKeyDown: function(e) {
        if (e.key === 'f' || e.key === 'F') {
            this.toggleFullscreen();
            return;
        }

        if (this.state === 'paused' && (e.key === 'Escape' || e.key === 'p' || e.key === 'P')) {
            this.resume();
            return;
        }

        if (this.state !== 'playing') return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                Player.moveLeft();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                Player.moveRight();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                Player.jump();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                Player.slide();
                break;
            case 'Escape':
            case 'p':
            case 'P':
                this.pause();
                break;
        }
    },

    onResize: function() {
        const container = document.querySelector('.game-wrap');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    toggleFullscreen: function() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    },

    start: function() {
        this.state = 'playing';
        this.distance = 0;
        this.score = 0;
        this.speed = this.baseSpeed;

        Player.reset();
        Obstacles.reset();
        Coins.reset();

        UI.hideAllOverlays();

        if (window.GameAudio) GameAudio.play('click');
    },

    pause: function() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        UI.showPauseScreen();

        if (window.GameAudio) GameAudio.play('pause');
    },

    resume: function() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        UI.hideAllOverlays();

        if (window.GameAudio) GameAudio.play('resume');
    },

    restart: function() {
        this.start();
    },

    gameOver: function() {
        this.state = 'gameover';

        const coins = Coins.getCollected();
        const score = Math.floor(this.distance * 10 + coins * 50);

        if (window.GameAudio) GameAudio.play('lose');

        UI.showGameOverScreen(this.distance, coins, score);
    },

    update: function() {
        this.updateWithDelta(this.fixedDeltaMs);
    },

    updateWithDelta: function(deltaMs) {
        if (this.state !== 'playing') return;
        const deltaScale = Math.max(0.2, Math.min(3, deltaMs / this.fixedDeltaMs));
        const speedDelta = this.speed * deltaScale;

        // 更新速度
        this.speed = Math.min(this.maxSpeed, this.speed + this.speedIncrement * deltaScale);

        // 更新距离
        this.distance += speedDelta;

        // 更新模块
        Track.update(speedDelta);
        Player.update(deltaScale, deltaMs);
        Obstacles.update(speedDelta, deltaMs);
        Coins.update(speedDelta, deltaMs);

        // 生成障碍物和金币
        const difficulty = Math.floor(this.distance / 100);
        Obstacles.spawn(this.distance, difficulty);
        Coins.spawn(this.distance, difficulty);

        // 碰撞检测
        const playerBounds = Player.getBounds();

        if (Obstacles.checkCollision(playerBounds)) {
            this.gameOver();
            return;
        }

        // 金币收集
        Coins.checkCollection(playerBounds);

        // 更新UI
        UI.updateHUD(this.distance, Coins.getCollected());
    },

    advanceTime: function(ms) {
        const steps = Math.max(1, Math.round(ms / this.fixedDeltaMs));
        for (let i = 0; i < steps; i++) {
            this.updateWithDelta(this.fixedDeltaMs);
        }
        this.renderer.render(this.scene, this.camera);
    },

    renderGameToText: function() {
        return JSON.stringify({
            mode: this.state,
            coordinateSystem: 'origin center-lane at x=0; x increases right; y increases upward; z increases toward camera',
            player: {
                lane: Player.currentLane,
                x: Number(Player.mesh.position.x.toFixed(2)),
                y: Number(Player.mesh.position.y.toFixed(2)),
                jumping: Player.isJumping,
                sliding: Player.isSliding
            },
            speed: Number(this.speed.toFixed(3)),
            distance: Math.floor(this.distance),
            coins: Coins.getCollected(),
            obstacles: Obstacles.list.slice(0, 8).map((o) => ({
                type: o.userData.type,
                lane: o.userData.lane,
                x: Number(o.position.x.toFixed(2)),
                y: Number(o.position.y.toFixed(2)),
                z: Number(o.position.z.toFixed(2))
            })),
            coinPickups: Coins.list.slice(0, 12).map((coin) => ({
                lane: coin.userData.lane,
                x: Number(coin.position.x.toFixed(2)),
                y: Number(coin.position.y.toFixed(2)),
                z: Number(coin.position.z.toFixed(2))
            }))
        });
    },

    animate: function(ts) {
        requestAnimationFrame((ts) => this.animate(ts));
        if (!this.lastFrameTime) {
            this.lastFrameTime = ts;
        }
        const deltaMs = Math.min(100, ts - this.lastFrameTime || this.fixedDeltaMs);
        this.lastFrameTime = ts;
        this.updateWithDelta(deltaMs);
        this.renderer.render(this.scene, this.camera);
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

window.Game = Game;

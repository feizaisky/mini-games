/**
 * 金币模块 - 管理金币生成和收集
 */

const Coins = {
    list: [],
    pool: [],

    SPAWN_DISTANCE: 40,
    MIN_SPAWN_INTERVAL: 15,
    lastSpawnZ: 0,

    collected: 0,
    combo: 0,
    comboWindowMs: 1000,
    comboRemainingMs: 0,

    init: function(scene) {
        this.scene = scene;
        this.list = [];
        this.collected = 0;
        this.combo = 0;
        this.comboRemainingMs = 0;
        this.lastSpawnZ = 0;
        this.createPool();
    },

    createPool: function() {
        for (let i = 0; i < 30; i++) {
            const coin = this.createCoin();
            coin.visible = false;
            this.pool.push(coin);
            this.scene.add(coin);
        }
    },

    createCoin: function() {
        const group = new THREE.Group();

        // 金币主体
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 24);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0xffa500,
            emissiveIntensity: 0.35
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;
        mesh.rotation.z = Math.PI / 2;
        mesh.castShadow = true;
        group.add(mesh);

        // 内圈
        const innerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        const innerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.3,
            metalness: 0.6
        });
        const inner = new THREE.Mesh(innerGeometry, innerMaterial);
        inner.rotation.x = Math.PI / 2;
        inner.rotation.z = Math.PI / 2;
        group.add(inner);

        group.userData = {
            type: 'coin',
            active: false,
            rotationSpeed: 0.03 + Math.random() * 0.02,
            floatPhase: Math.random() * Math.PI * 2
        };

        return group;
    },

    getFromPool: function() {
        let coin = this.pool.find(c => !c.userData.active);
        if (!coin) {
            coin = this.createCoin();
            this.scene.add(coin);
            this.pool.push(coin);
        }
        coin.userData.active = true;
        coin.userData.floatPhase = Math.random() * Math.PI * 2;
        coin.visible = true;
        return coin;
    },

    spawn: function(distance, difficulty) {
        const interval = Math.max(this.MIN_SPAWN_INTERVAL, 20 - difficulty);

        if (distance - this.lastSpawnZ < interval) return;

        this.lastSpawnZ = distance;

        // 随机生成金币组
        const pattern = Math.random();
        const lane = Math.floor(Math.random() * 3);

        if (pattern < 0.4) {
            // 单个金币
            this.spawnCoin(lane, -this.SPAWN_DISTANCE);
        } else if (pattern < 0.7) {
            // 直线金币
            for (let i = 0; i < 3; i++) {
                this.spawnCoin(lane, -this.SPAWN_DISTANCE - i * 2);
            }
        } else {
            // 弧形金币
            const lanes = [0, 1, 2];
            for (let i = 0; i < 3; i++) {
                this.spawnCoin(lanes[i], -this.SPAWN_DISTANCE - i * 1.5);
            }
        }
    },

    spawnCoin: function(lane, z) {
        const coin = this.getFromPool();
        coin.position.set(
            Track.getLaneX(lane),
            1 + Math.random() * 0.5,
            z
        );
        coin.userData.lane = lane;
        coin.userData.active = true;
        this.list.push(coin);
    },

    update: function(speedDelta, deltaMs) {
        if (this.combo > 0) {
            this.comboRemainingMs -= deltaMs;
            if (this.comboRemainingMs <= 0) {
                this.combo = 0;
                this.comboRemainingMs = 0;
            }
        }

        for (let i = this.list.length - 1; i >= 0; i--) {
            const coin = this.list[i];

            // 移动
            coin.position.z += speedDelta;

            // 旋转动画
            coin.rotation.y += coin.userData.rotationSpeed * Math.max(1, deltaMs / (1000 / 60));

            // 浮动动画
            coin.userData.floatPhase += 0.003 * deltaMs;
            coin.position.y = 1 + Math.sin(coin.userData.floatPhase + i) * 0.1;

            // 超出屏幕
            if (coin.position.z > 10) {
                coin.userData.active = false;
                coin.visible = false;
                this.list.splice(i, 1);
            }
        }
    },

    checkCollection: function(playerBounds) {
        let collected = 0;

        for (let i = this.list.length - 1; i >= 0; i--) {
            const coin = this.list[i];

            // Z轴范围
            if (coin.position.z > 2 || coin.position.z < -1) continue;

            // X轴范围
            const cx = coin.position.x;
            if (cx < playerBounds.minX - 0.5 || cx > playerBounds.maxX + 0.5) continue;

            // Y轴范围
            const cy = coin.position.y;
            if (cy > playerBounds.maxY + 0.5) continue;

            // 收集
            coin.userData.active = false;
            coin.visible = false;
            this.list.splice(i, 1);
            collected++;

            // 连击
            this.combo++;
            this.comboRemainingMs = this.comboWindowMs;
        }

        if (collected > 0) {
            // 连击加成
            const bonus = 1 + Math.floor(this.combo / 3) * 0.5;
            this.collected += Math.floor(collected * bonus);

            if (window.GameAudio) {
                if (this.combo >= 3) {
                    GameAudio.play('combo');
                } else {
                    GameAudio.play('score');
                }
            }
        }

        return collected;
    },

    getCollected: function() {
        return this.collected;
    },

    reset: function() {
        this.list.forEach(c => {
            c.userData.active = false;
            c.visible = false;
        });
        this.list = [];
        this.collected = 0;
        this.combo = 0;
        this.comboRemainingMs = 0;
        this.lastSpawnZ = 0;
    }
};

window.Coins = Coins;

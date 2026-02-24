/**
 * 障碍物模块 - 管理障碍物生成和碰撞
 */

const Obstacles = {
    list: [],
    pool: {
        barrier: [],
        highWall: [],
        car: []
    },
    SPAWN_DISTANCE: 50,
    MIN_SPAWN_INTERVAL: 20,
    lastSpawnZ: 0,

    init: function(scene) {
        this.scene = scene;
        this.list = [];
        this.lastSpawnZ = 0;
        this.createPool();
    },

    createPool: function() {
        // 路障 - 低矮障碍，需要跳跃
        for (let i = 0; i < 10; i++) {
            const barrier = this.createBarrier();
            barrier.visible = false;
            this.pool.barrier.push(barrier);
            this.scene.add(barrier);
        }

        // 高墙 - 需要滑铲
        for (let i = 0; i < 5; i++) {
            const wall = this.createHighWall();
            wall.visible = false;
            this.pool.highWall.push(wall);
            this.scene.add(wall);
        }

        // 车辆 - 移动障碍
        for (let i = 0; i < 5; i++) {
            const car = this.createCar();
            car.visible = false;
            this.pool.car.push(car);
            this.scene.add(car);
        }
    },

    createBarrier: function() {
        const group = new THREE.Group();

        // 主体
        const geometry = new THREE.BoxGeometry(2, 0.8, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff6b6b,
            roughness: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        group.add(mesh);

        // 警示条纹
        const stripeGeometry = new THREE.BoxGeometry(2.1, 0.15, 0.55);
        const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
        for (let i = 0; i < 3; i++) {
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.y = -0.25 + i * 0.25;
            group.add(stripe);
        }

        group.userData = {
            type: 'barrier',
            requiresJump: true,
            requiresSlide: false,
            active: false
        };
        return group;
    },

    createHighWall: function() {
        const group = new THREE.Group();

        // 顶部横梁
        const topGeometry = new THREE.BoxGeometry(2.5, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4ecdc4,
            roughness: 0.4
        });
        const top = new THREE.Mesh(topGeometry, material);
        top.position.y = 1.2;
        top.castShadow = true;
        group.add(top);

        // 支柱
        const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

        const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        leftPillar.position.set(-1, 0.6, 0);
        group.add(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        rightPillar.position.set(1, 0.6, 0);
        group.add(rightPillar);

        group.userData = {
            type: 'highWall',
            requiresJump: false,
            requiresSlide: true,
            active: false
        };
        return group;
    },

    createCar: function() {
        const group = new THREE.Group();

        // 车身
        const bodyGeometry = new THREE.BoxGeometry(1.8, 0.6, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x9b59b6,
            roughness: 0.3,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);

        // 车顶
        const roofGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.8);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.position.y = 0.9;
        roof.position.z = -0.1;
        group.add(roof);

        // 车轮
        const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const positions = [
            [-0.7, 0.2, 0.5],
            [0.7, 0.2, 0.5],
            [-0.7, 0.2, -0.5],
            [0.7, 0.2, -0.5]
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            group.add(wheel);
        });

        group.userData = {
            type: 'car',
            requiresJump: false,
            requiresSlide: false,
            active: false,
            moveDirection: 0,
            moveSpeed: 0
        };
        return group;
    },

    getFromPool: function(type) {
        let obj = this.pool[type].find(o => !o.userData.active);
        if (!obj) {
            // 池子用完，创建新的
            switch (type) {
                case 'barrier': obj = this.createBarrier(); break;
                case 'highWall': obj = this.createHighWall(); break;
                case 'car': obj = this.createCar(); break;
            }
            this.scene.add(obj);
            this.pool[type].push(obj);
        }
        obj.userData.active = true;
        obj.visible = true;
        return obj;
    },

    spawn: function(distance, difficulty) {
        const interval = Math.max(this.MIN_SPAWN_INTERVAL, 35 - difficulty * 2);

        if (distance - this.lastSpawnZ < interval) return;

        this.lastSpawnZ = distance;

        // 根据难度选择障碍物类型
        const types = ['barrier'];
        if (difficulty > 3) types.push('highWall');
        if (difficulty > 5) types.push('car');

        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);

        const obstacle = this.getFromPool(type);
        obstacle.position.set(
            Track.getLaneX(lane),
            type === 'barrier' ? 0.4 : 0,
            -this.SPAWN_DISTANCE
        );

        obstacle.userData.lane = lane;
        obstacle.userData.active = true;

        // 车辆特殊处理
        if (type === 'car') {
            obstacle.userData.moveDirection = Math.random() > 0.5 ? 1 : -1;
            obstacle.userData.moveSpeed = 0.05 + Math.random() * 0.05;
        }

        this.list.push(obstacle);
    },

    update: function(speed) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const obstacle = this.list[i];

            // 移动
            obstacle.position.z += speed;

            // 车辆横向移动
            if (obstacle.userData.type === 'car') {
                obstacle.position.x += obstacle.userData.moveDirection * obstacle.userData.moveSpeed;
                if (Math.abs(obstacle.position.x) > 4) {
                    obstacle.userData.moveDirection *= -1;
                }
            }

            // 超出屏幕，回收到池中
            if (obstacle.position.z > 10) {
                obstacle.userData.active = false;
                obstacle.visible = false;
                this.list.splice(i, 1);
            }
        }
    },

    checkCollision: function(playerBounds) {
        const playerX = (playerBounds.minX + playerBounds.maxX) / 2; // 玩家中心X
        const playerTopY = playerBounds.maxY;
        const playerBottomY = playerBounds.minY;

        for (const obstacle of this.list) {
            // Z轴范围检测（障碍物靠近玩家）
            const oz = obstacle.position.z;
            if (oz > 1.5 || oz < -1.5) continue;

            const ox = obstacle.position.x;
            const type = obstacle.userData.type;

            // X轴碰撞检测（玩家和障碍物是否在相近位置）
            const xDist = Math.abs(ox - playerX);
            if (xDist > 1.2) continue;

            // 根据障碍物类型检测
            if (type === 'barrier') {
                // 路障 - 角色底部仍较低时会撞上，只有跳起抬高整体位置才能越过
                if (playerBottomY < 0.75) {
                    return true;
                }
            } else if (type === 'highWall') {
                // 高墙 - 横梁在1.2高度，滑铲可以躲避
                if (playerTopY > 0.9) {
                    return true;
                }
            } else if (type === 'car') {
                // 车辆 - 站立/下蹲都会碰撞，只有跳到足够高才能越过
                // xDist 已在上方做过 <= 1.2 的通用命中范围判断
                if (playerBottomY < 1.0) {
                    return true;
                }
            }
        }
        return false;
    },

    reset: function() {
        this.list.forEach(o => {
            o.userData.active = false;
            o.visible = false;
        });
        this.list = [];
        this.lastSpawnZ = 0;
    }
};

window.Obstacles = Obstacles;

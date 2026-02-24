/**
 * 玩家模块 - 管理玩家角色和移动
 */

const Player = {
    currentLane: 1, // 0=左, 1=中, 2=右
    targetX: 0,
    isJumping: false,
    isSliding: false,
    jumpVelocity: 0,
    jumpHeight: 2.5,
    gravity: 0.015,
    moveSpeed: 0.25,
    slideDuration: 600,
    slideTimer: 0,
    runAnimTime: 0,

    mesh: null,
    body: null,
    shadow: null,

    init: function(scene) {
        this.scene = scene;
        this.createPlayer();
    },

    createPlayer: function() {
        // 玩家组
        this.mesh = new THREE.Group();

        // 身体 - 胶囊体形状
        const bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.8, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x667eea,
            roughness: 0.3,
            metalness: 0.5
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.castShadow = true;
        this.mesh.add(this.body);

        // 头部
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.8;
        head.castShadow = true;
        this.mesh.add(head);

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.85, 0.25);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.85, 0.25);
        this.mesh.add(rightEye);

        // 阴影
        const shadowGeometry = new THREE.CircleGeometry(0.5, 16);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = 0.01;
        this.mesh.add(this.shadow);

        // 初始位置
        this.mesh.position.set(0, 0, 0);
        this.targetX = 0;

        this.scene.add(this.mesh);
    },

    moveLeft: function() {
        if (this.currentLane > 0 && !this.isJumping) {
            this.currentLane--;
            this.targetX = Track.getLaneX(this.currentLane);
            if (window.GameAudio) GameAudio.play('move');
        }
    },

    moveRight: function() {
        if (this.currentLane < 2 && !this.isJumping) {
            this.currentLane++;
            this.targetX = Track.getLaneX(this.currentLane);
            if (window.GameAudio) GameAudio.play('move');
        }
    },

    jump: function() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 0.25;
            if (window.GameAudio) GameAudio.play('move');
        }
    },

    slide: function() {
        if (!this.isSliding && !this.isJumping) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            // 缩小身体
            this.body.scale.set(1, 0.5, 1);
            this.body.position.y = -0.3;
        }
    },

    update: function(deltaScale, deltaMs) {
        // 水平移动插值
        const dx = this.targetX - this.mesh.position.x;
        if (Math.abs(dx) > 0.01) {
            this.mesh.position.x += dx * this.moveSpeed * deltaScale;
        } else {
            this.mesh.position.x = this.targetX;
        }

        // 跳跃物理
        if (this.isJumping) {
            this.mesh.position.y += this.jumpVelocity * deltaScale;
            this.jumpVelocity -= this.gravity * deltaScale;

            // 落地
            if (this.mesh.position.y <= 0) {
                this.mesh.position.y = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }

        if (this.isSliding) {
            this.slideTimer -= deltaMs;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.slideTimer = 0;
                this.body.scale.set(1, 1, 1);
                this.body.position.y = 0;
            }
        }

        // 更新阴影
        this.shadow.scale.setScalar(1 - this.mesh.position.y * 0.15);
        this.shadow.material.opacity = 0.3 - this.mesh.position.y * 0.05;

        // 跑步动画
        if (!this.isJumping && !this.isSliding) {
            this.runAnimTime += deltaMs;
            this.body.rotation.z = Math.sin(this.runAnimTime * 0.01) * 0.1;
        } else {
            this.body.rotation.z = 0;
        }
    },

    getBounds: function() {
        const x = this.mesh.position.x;
        const y = this.mesh.position.y;
        const height = this.isSliding ? 0.5 : 1.5;
        return {
            minX: x - 0.4,
            maxX: x + 0.4,
            minY: y,
            maxY: y + height,
            lane: this.currentLane
        };
    },

    reset: function() {
        this.currentLane = 1;
        this.targetX = 0;
        this.mesh.position.set(0, 0, 0);
        this.isJumping = false;
        this.isSliding = false;
        this.jumpVelocity = 0;
        this.slideTimer = 0;
        this.runAnimTime = 0;
        this.body.scale.set(1, 1, 1);
        this.body.position.y = 0;
        this.body.rotation.z = 0;
    }
};

window.Player = Player;

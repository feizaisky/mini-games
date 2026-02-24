/**
 * 赛道模块 - 管理三条赛道和地面渲染
 */

const Track = {
    LANE_WIDTH: 3,
    LANE_POSITIONS: [-3, 0, 3], // 左、中、右

    mesh: null,
    ground: null,
    buildings: [],
    buildingPool: [],

    init: function(scene) {
        this.scene = scene;
        this.createGround();
        this.createBuildings();
    },

    createGround: function() {
        // 主赛道
        const trackGeometry = new THREE.PlaneGeometry(12, 200);
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f2338,
            roughness: 0.8,
            metalness: 0.2
        });
        this.mesh = new THREE.Mesh(trackGeometry, trackMaterial);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0;
        this.mesh.position.z = -80;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // 三条跑道底色分区，强化可跑区域感知
        const laneColors = [0x252c46, 0x2f3757, 0x252c46];
        for (let lane = 0; lane < 3; lane++) {
            const lanePlane = new THREE.Mesh(
                new THREE.PlaneGeometry(2.8, 200),
                new THREE.MeshStandardMaterial({
                    color: laneColors[lane],
                    roughness: 0.85,
                    metalness: 0.12
                })
            );
            lanePlane.rotation.x = -Math.PI / 2;
            lanePlane.position.set(this.LANE_POSITIONS[lane], 0.002, -80);
            lanePlane.receiveShadow = true;
            this.scene.add(lanePlane);
        }

        // 跑道分隔线（中间两根）和外边界线（左右两根）
        const dividerGeometry = new THREE.PlaneGeometry(0.2, 200);
        const dividerMaterial = new THREE.MeshBasicMaterial({
            color: 0xaab6ff
        });
        const boundaryGeometry = new THREE.PlaneGeometry(0.28, 200);
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0x5be1ff
        });

        [-1.5, 1.5].forEach((x) => {
            const line = new THREE.Mesh(dividerGeometry, dividerMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.01, -80);
            this.scene.add(line);
        });
        [-4.5, 4.5].forEach((x) => {
            const line = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.012, -80);
            this.scene.add(line);
        });

        // 两侧墙壁效果
        const wallGeometry = new THREE.PlaneGeometry(2, 200);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.9
        });

        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-7, 1, -80);
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(7, 1, -80);
        this.scene.add(rightWall);
    },

    createBuildings: function() {
        const buildingColors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a40];

        for (let i = 0; i < 30; i++) {
            const height = 5 + Math.random() * 15;
            const width = 2 + Math.random() * 3;
            const depth = 2 + Math.random() * 3;

            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                roughness: 0.9,
                metalness: 0.1
            });

            const building = new THREE.Mesh(geometry, material);
            building.castShadow = true;

            // 左侧建筑
            if (i < 15) {
                building.position.set(
                    -12 - Math.random() * 8,
                    height / 2,
                    -i * 15 - Math.random() * 10
                );
            } else {
                // 右侧建筑
                building.position.set(
                    12 + Math.random() * 8,
                    height / 2,
                    -(i - 15) * 15 - Math.random() * 10
                );
            }

            this.buildings.push(building);
            this.scene.add(building);
        }
    },

    update: function(speed) {
        // 移动建筑，创造移动感
        this.buildings.forEach(building => {
            building.position.z += speed;

            // 重置到远处
            if (building.position.z > 20) {
                building.position.z -= 250;
                building.position.x = (building.position.x < 0 ? -1 : 1) *
                    (12 + Math.random() * 8);
            }
        });
    },

    getLaneX: function(lane) {
        return this.LANE_POSITIONS[lane];
    }
};

// 导出到全局
window.Track = Track;

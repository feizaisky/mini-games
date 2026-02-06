/**
 * 公共胜利庆祝动画 - GameCelebration
 * Canvas 彩带/烟花粒子效果
 *
 * 用法：
 *   <link rel="stylesheet" href="/common/celebration.css">
 *   <script src="/common/celebration.js"></script>
 *   GameCelebration.show();                   // 默认彩带
 *   GameCelebration.show({ duration: 3000 }); // 自定义时长
 */

(function () {
    'use strict';

    var canvas = null;
    var ctxC = null;
    var animId = null;
    var particles = [];
    var startTime = 0;
    var duration = 2500;

    var COLORS = [
        '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
        '#ff9ff3', '#f368e0', '#ff9f43', '#ee5a24',
        '#0abde3', '#10ac84', '#5f27cd', '#48dbfb'
    ];

    function ensureCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.className = 'celebration-canvas';
        ctxC = canvas.getContext('2d');
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /* ---- 彩带粒子 ---- */

    function Confetti(x, y) {
        this.x = x;
        this.y = y;
        this.w = 6 + Math.random() * 6;
        this.h = 4 + Math.random() * 4;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = -(Math.random() * 8 + 4);
        this.gravity = 0.15 + Math.random() * 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.opacity = 1;
        this.decay = 0.005 + Math.random() * 0.01;
    }

    Confetti.prototype.update = function () {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.99;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.decay;
    };

    Confetti.prototype.draw = function (c) {
        if (this.opacity <= 0) return;
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.globalAlpha = Math.max(0, this.opacity);
        c.fillStyle = this.color;
        c.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        c.restore();
    };

    /* ---- 星星粒子 ---- */

    function Star(x, y) {
        this.x = x;
        this.y = y;
        this.size = 3 + Math.random() * 4;
        var angle = Math.random() * Math.PI * 2;
        var speed = 2 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.08;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.opacity = 1;
        this.decay = 0.015 + Math.random() * 0.01;
    }

    Star.prototype.update = function () {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= this.decay;
        this.size *= 0.98;
    };

    Star.prototype.draw = function (c) {
        if (this.opacity <= 0) return;
        c.save();
        c.globalAlpha = Math.max(0, this.opacity);
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
    };

    /* ---- 动画循环 ---- */

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;

        ctxC.clearRect(0, 0, canvas.width, canvas.height);

        // 前半段持续生成新粒子
        if (elapsed < duration * 0.5) {
            for (var i = 0; i < 4; i++) {
                var x = Math.random() * canvas.width;
                particles.push(new Confetti(x, -10));
            }
            // 偶尔从两侧喷射
            if (Math.random() < 0.3) {
                var side = Math.random() < 0.5 ? 0 : canvas.width;
                var sy = Math.random() * canvas.height * 0.6;
                var s = new Star(side, sy);
                s.vx = side === 0 ? Math.abs(s.vx) : -Math.abs(s.vx);
                particles.push(s);
            }
        }

        // 更新和绘制
        for (var j = particles.length - 1; j >= 0; j--) {
            particles[j].update();
            particles[j].draw(ctxC);
            if (particles[j].opacity <= 0 || particles[j].y > canvas.height + 50) {
                particles.splice(j, 1);
            }
        }

        if (elapsed < duration || particles.length > 0) {
            animId = requestAnimationFrame(animate);
        } else {
            cleanup();
        }
    }

    function cleanup() {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        particles = [];
        startTime = 0;
    }

    /* ---- 爆发效果：从指定点喷射 ---- */

    function burst(x, y, count) {
        for (var i = 0; i < (count || 30); i++) {
            particles.push(new Star(x, y));
        }
    }

    /* ---- 公共 API ---- */

    window.GameCelebration = {
        /**
         * 显示庆祝动画
         * @param {Object} [opts]
         * @param {number} [opts.duration=2500] - 持续时间(ms)
         */
        show: function (opts) {
            opts = opts || {};
            cleanup();
            duration = opts.duration || 2500;

            ensureCanvas();
            resize();
            document.body.appendChild(canvas);

            // 初始爆发
            var cx = canvas.width / 2;
            var cy = canvas.height * 0.35;
            burst(cx, cy, 60);
            burst(cx - 100, cy + 30, 25);
            burst(cx + 100, cy + 30, 25);

            // 添加初始彩带
            for (var i = 0; i < 40; i++) {
                var x = Math.random() * canvas.width;
                particles.push(new Confetti(x, Math.random() * canvas.height * 0.3));
            }

            startTime = 0;
            animId = requestAnimationFrame(animate);
        },

        /**
         * 手动隐藏
         */
        hide: function () {
            cleanup();
        }
    };

    // 监听窗口大小变化
    window.addEventListener('resize', resize);
})();

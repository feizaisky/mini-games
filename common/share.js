/**
 * 公共分享组件 - GameShare
 * 生成成绩卡片图 + 复制到剪贴板
 *
 * 用法：
 *   <script src="/common/share.js"></script>
 *   GameShare.show({
 *     title: '贪吃蛇',
 *     score: '120分',
 *     extra: '最高纪录',
 *     icon: '🐍'
 *   });
 */

(function () {
    'use strict';

    var overlay = null;

    function createShareCard(opts) {
        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        var ctx = canvas.getContext('2d');

        // 背景渐变
        var grad = ctx.createLinearGradient(0, 0, 600, 400);
        grad.addColorStop(0, '#667eea');
        grad.addColorStop(1, '#764ba2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 400);

        // 白色卡片
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        roundRect(ctx, 40, 40, 520, 320, 20);
        ctx.fill();

        // 标题
        ctx.fillStyle = '#333';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(opts.title || '小游戏中心', 300, 100);

        // 图标
        if (opts.icon) {
            ctx.font = '48px Arial';
            ctx.fillText(opts.icon, 300, 165);
        }

        // 分数
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
        ctx.fillText(opts.score || '', 300, 230);

        // 额外信息
        if (opts.extra) {
            ctx.fillStyle = '#999';
            ctx.font = '18px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
            ctx.fillText(opts.extra, 300, 270);
        }

        // 底部水印
        ctx.fillStyle = '#bbb';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
        ctx.fillText('小游戏中心 - 精选网页小游戏', 300, 340);

        return canvas;
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function showOverlay(cardCanvas, opts) {
        if (overlay) hideOverlay();

        overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';

        // 卡片图片
        var img = document.createElement('img');
        img.src = cardCanvas.toDataURL('image/png');
        img.style.cssText = 'max-width:90%;max-height:50vh;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.3);';
        overlay.appendChild(img);

        // 按钮容器
        var btns = document.createElement('div');
        btns.style.cssText = 'margin-top:16px;display:flex;gap:12px;';

        // 复制文本按钮
        var copyBtn = document.createElement('button');
        copyBtn.textContent = '复制成绩';
        copyBtn.style.cssText = 'background:#667eea;color:white;border:none;padding:10px 24px;border-radius:22px;font-size:14px;cursor:pointer;';
        copyBtn.addEventListener('click', function () {
            var text = (opts.title || '') + ' ' + (opts.score || '') + (opts.extra ? ' (' + opts.extra + ')' : '') + ' - 小游戏中心';
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                    copyBtn.textContent = '已复制!';
                    setTimeout(function () { copyBtn.textContent = '复制成绩'; }, 1500);
                });
            } else {
                // 回退方案
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                copyBtn.textContent = '已复制!';
                setTimeout(function () { copyBtn.textContent = '复制成绩'; }, 1500);
            }
        });
        btns.appendChild(copyBtn);

        // 保存图片按钮
        var saveBtn = document.createElement('button');
        saveBtn.textContent = '保存图片';
        saveBtn.style.cssText = 'background:#27ae60;color:white;border:none;padding:10px 24px;border-radius:22px;font-size:14px;cursor:pointer;';
        saveBtn.addEventListener('click', function () {
            var link = document.createElement('a');
            link.download = (opts.title || 'game') + '_score.png';
            link.href = cardCanvas.toDataURL('image/png');
            link.click();
        });
        btns.appendChild(saveBtn);

        // 关闭按钮
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = 'background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);padding:10px 24px;border-radius:22px;font-size:14px;cursor:pointer;';
        closeBtn.addEventListener('click', hideOverlay);
        btns.appendChild(closeBtn);

        overlay.appendChild(btns);

        // 点击遮罩关闭
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) hideOverlay();
        });

        document.body.appendChild(overlay);
    }

    function hideOverlay() {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        overlay = null;
    }

    window.GameShare = {
        /**
         * 显示分享卡片
         * @param {Object} opts
         * @param {string} opts.title - 游戏名称
         * @param {string} opts.score - 得分
         * @param {string} [opts.extra] - 额外信息
         * @param {string} [opts.icon] - 图标 emoji
         */
        show: function (opts) {
            var canvas = createShareCard(opts || {});
            showOverlay(canvas, opts || {});
        },

        /**
         * 隐藏分享卡片
         */
        hide: hideOverlay,

        /**
         * 生成卡片图片的 dataURL
         * @param {Object} opts
         * @returns {string} PNG dataURL
         */
        toDataURL: function (opts) {
            return createShareCard(opts || {}).toDataURL('image/png');
        }
    };
})();

/**
 * 公共防长按组件 - 禁用微信"搜一搜/翻译"浮层、长按选中、复制等
 *
 * 用法：在 </body> 前引入
 *   <script src="/common/anti-longpress.js"></script>
 *
 * 原理：
 *   1. 阻止 contextmenu/selectstart/dragstart/copy/cut/paste 默认行为
 *   2. 阻止 gesture 系列事件（iOS 捏合缩放）
 *   3. 全局 touchstart preventDefault — 彻底禁用微信"搜一搜/翻译"浮层
 *   4. touchmove 手动实现页面滚动（因 touchstart preventDefault 禁用了原生滚动）
 *   5. touchend 手动合成 click 事件（因 touchstart preventDefault 禁用了 click 合成）
 */
(function () {
    'use strict';

    // 1. 禁用右键菜单、文本选中、拖拽、复制粘贴
    ['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'].forEach(function (evt) {
        document.addEventListener(evt, function (e) { e.preventDefault(); }, { passive: false });
    });

    // 2. 禁用 iOS 手势缩放
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (evt) {
        document.addEventListener(evt, function (e) { e.preventDefault(); }, { passive: false });
    });

    // 3. 触摸处理
    var _target = null;
    var _time = 0;
    var _x = 0;
    var _y = 0;
    var _lastY = 0;
    var _moved = false;

    // 惯性滚动
    var _velocityY = 0;
    var _lastMoveTime = 0;
    var _momentumRAF = null;

    function stopMomentum() {
        if (_momentumRAF) {
            cancelAnimationFrame(_momentumRAF);
            _momentumRAF = null;
        }
    }

    function startMomentum(velocity) {
        stopMomentum();
        // velocity: px/ms, 转换为 px/frame (约 16ms)
        var v = velocity * 16;
        if (Math.abs(v) < 1) return;
        function step() {
            if (Math.abs(v) < 0.5) { _momentumRAF = null; return; }
            window.scrollBy(0, v);
            v *= 0.95; // 减速
            _momentumRAF = requestAnimationFrame(step);
        }
        _momentumRAF = requestAnimationFrame(step);
    }

    document.addEventListener('touchstart', function (e) {
        e.preventDefault(); // 禁用微信搜一搜/翻译浮层
        stopMomentum();
        if (e.touches.length !== 1) { _target = null; return; }
        var t = e.touches[0];
        _target = e.target;
        _time = Date.now();
        _x = t.clientX;
        _y = t.clientY;
        _lastY = t.clientY;
        _lastMoveTime = Date.now();
        _velocityY = 0;
        _moved = false;
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (e.touches.length !== 1) return;
        var currentY = e.touches[0].clientY;
        var deltaY = _lastY - currentY;
        _lastY = currentY;

        if (Math.abs(currentY - _y) > 8 || Math.abs(e.touches[0].clientX - _x) > 8) {
            _moved = true;
        }

        // 手动滚动页面
        if (deltaY !== 0) {
            window.scrollBy(0, deltaY);
        }

        // 记录速度用于惯性
        var now = Date.now();
        var dt = now - _lastMoveTime;
        if (dt > 0) {
            _velocityY = deltaY / dt;
        }
        _lastMoveTime = now;
    }, { passive: false });

    document.addEventListener('touchend', function (e) {
        var target = _target;
        _target = null;

        // 惯性滚动
        if (_moved && Math.abs(_velocityY) > 0.3) {
            startMomentum(_velocityY);
        }
        _velocityY = 0;

        if (!target || _moved) return;

        var dt = Date.now() - _time;
        var touch = e.changedTouches[0];
        var dx = Math.abs(touch.clientX - _x);
        var dy = Math.abs(touch.clientY - _y);

        // 短按+无移动 → 合成 click
        if (dt < 300 && dx < 12 && dy < 12) {
            // <a> 链接：合成 click 不触发导航，需手动跳转
            var link = target.closest('a[href]');
            if (link) {
                e.preventDefault();
                window.location.href = link.getAttribute('href');
                return;
            }
            target.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: touch.clientX,
                clientY: touch.clientY
            }));
        }
    }, { passive: false });
})();

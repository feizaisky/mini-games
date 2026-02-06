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
 *   4. 在 touchend 手动合成 click 事件，确保所有按钮/元素正常响应点击
 *      （因全局 touchstart preventDefault 会阻止浏览器自动合成 click）
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

    // 3. 全局 touchstart preventDefault + touchend 合成 click
    //    这样既禁用了微信长按浮层，又不影响任何元素的点击交互
    var _target = null;
    var _time = 0;
    var _x = 0;
    var _y = 0;

    document.addEventListener('touchstart', function (e) {
        e.preventDefault(); // 禁用微信搜一搜/翻译浮层
        if (e.touches.length !== 1) {
            _target = null; // 多指触摸不合成 click
            return;
        }
        _target = e.target;
        _time = Date.now();
        _x = e.touches[0].clientX;
        _y = e.touches[0].clientY;
    }, { passive: false });

    document.addEventListener('touchend', function (e) {
        var target = _target;
        _target = null;
        if (!target) return;

        var dt = Date.now() - _time;
        var touch = e.changedTouches[0];
        var dx = Math.abs(touch.clientX - _x);
        var dy = Math.abs(touch.clientY - _y);

        // 仅短按且无明显移动时合成 click（排除滑动手势）
        if (dt < 300 && dx < 12 && dy < 12) {
            // <a> 链接：synthetic click 不会触发浏览器导航，需手动跳转
            var link = target.closest('a[href]');
            if (link) {
                e.preventDefault();
                window.location.href = link.getAttribute('href');
                return;
            }
            // 其他元素：派发合成 click，触发 onclick / addEventListener('click')
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

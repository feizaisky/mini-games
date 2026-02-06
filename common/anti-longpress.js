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
 *      按钮的 onclick / touchend 不受影响
 *   4. 为 .home-btn 链接添加 touchend 导航（因 touchstart 被拦截，click 可能不触发）
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

    // 3. 全局阻止 touchstart 默认行为（禁用微信搜一搜/翻译浮层）
    document.addEventListener('touchstart', function (e) {
        e.preventDefault();
    }, { passive: false });

    // 4. 首页按钮：touchstart 被全局拦截后 click 可能失效，改用 touchend 导航
    var homeBtn = document.querySelector('.home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            window.location.href = homeBtn.getAttribute('href') || '/';
        }, { passive: false });
    }
})();

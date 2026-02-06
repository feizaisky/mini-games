/**
 * 公共防长按组件 - 禁用微信"搜一搜/翻译"浮层、长按选中、复制等
 *
 * 用法：在 </body> 前引入
 *   <script src="/common/anti-longpress.js"></script>
 *
 * 原理：
 *   1. 阻止 contextmenu/selectstart/dragstart/copy/cut/paste 默认行为
 *   2. 阻止 gesture 系列事件（iOS 捏合缩放）
 *   3. 非交互区域的 touchstart preventDefault — 禁用微信"搜一搜/翻译"浮层
 *      交互元素（button/a/input 等）不受影响，onclick/click 正常工作
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

    // 3. 非交互区域阻止 touchstart 默认行为（禁用微信搜一搜/翻译浮层）
    //    交互元素（按钮、链接、输入框等）跳过，保证 onclick/click 正常触发
    document.addEventListener('touchstart', function (e) {
        if (e.target.closest('button, a, input, select, textarea, label, [onclick]')) return;
        e.preventDefault();
    }, { passive: false });
})();

/**
 * 公共防长按组件 - 禁用长按菜单/文本选中/手势缩放
 *
 * 重要：不拦截 touchstart/touchmove，保留系统原生滚动能力。
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
})();

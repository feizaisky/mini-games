/**
 * 统一加载动画控制脚本
 * 在页面完全加载后自动隐藏加载遮罩
 */

(function() {
    'use strict';

    /**
     * 隐藏加载遮罩
     */
    function hideLoader() {
        var loader = document.getElementById('game-loader');
        if (loader) {
            loader.classList.add('hidden');
            // 动画结束后移除 DOM 节点
            setTimeout(function() {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 400);
        }
    }

    /**
     * 初始化加载器
     * 监听页面加载完成事件
     */
    function initLoader() {
        // 优先使用 load 事件确保所有资源加载完成
        if (document.readyState === 'complete') {
            // 页面已加载完成，延迟一小段时间确保渲染
            setTimeout(hideLoader, 100);
        } else {
            window.addEventListener('load', function() {
                // 给一点缓冲时间让游戏初始化
                setTimeout(hideLoader, 100);
            });
        }
    }

    // 确保 DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoader);
    } else {
        initLoader();
    }

    // 暴露手动控制接口（可选）
    window.GameLoader = {
        hide: hideLoader
    };
})();

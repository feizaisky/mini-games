(function () {
    'use strict';

    function bindCanvasMaxHeight(options) {
        if (!options || !options.canvas) return function () {};

        var canvas = options.canvas;
        var containerSelector = options.containerSelector || '.game-wrap';
        var minHeight = typeof options.minHeight === 'number' ? options.minHeight : 240;
        var bottomGap = typeof options.bottomGap === 'number' ? options.bottomGap : 6;

        function fitCanvasToViewport() {
            var wrap = document.querySelector(containerSelector);
            if (!wrap) return;

            var vv = window.visualViewport;
            var viewportHeight = vv ? vv.height : window.innerHeight;
            var wrapRect = wrap.getBoundingClientRect();
            var canvasRect = canvas.getBoundingClientRect();
            var nonCanvasHeight = Math.max(0, wrapRect.height - canvasRect.height);
            var topOffset = Math.max(0, wrapRect.top);
            var available = viewportHeight - topOffset - bottomGap - nonCanvasHeight;
            var target = Math.max(minHeight, Math.floor(available));
            canvas.style.maxHeight = target + 'px';
        }

        function scheduleFitCanvas() {
            requestAnimationFrame(function () {
                requestAnimationFrame(fitCanvasToViewport);
            });
        }

        window.addEventListener('resize', scheduleFitCanvas);
        window.addEventListener('orientationchange', scheduleFitCanvas);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', scheduleFitCanvas);
            window.visualViewport.addEventListener('scroll', scheduleFitCanvas);
        }

        scheduleFitCanvas();
        return scheduleFitCanvas;
    }

    window.GameLayoutFit = {
        bindCanvasMaxHeight: bindCanvasMaxHeight
    };
})();

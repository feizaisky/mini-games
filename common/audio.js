/**
 * 公共音效系统 - GameAudio
 * 基于 Web Audio API 合成音效，无需加载外部音频文件
 * 
 * 用法：
 *   <script src="/common/audio.js"></script>
 *   GameAudio.play('click');
 *   GameAudio.play('win');
 *   GameAudio.toggle(); // 切换静音
 */

(function () {
    'use strict';

    var ctx = null;
    var STORAGE_KEY = 'gameAudioMuted';
    var muted = localStorage.getItem(STORAGE_KEY) === '1';

    function getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    /* ---- 合成音效定义 ---- */

    function playTone(freq, duration, type, gain, delay) {
        var c = getCtx();
        if (!c) return;
        var t = c.currentTime + (delay || 0);
        var osc = c.createOscillator();
        var g = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(gain || 0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t);
        osc.stop(t + duration);
    }

    function playNoise(duration, gain, delay) {
        var c = getCtx();
        if (!c) return;
        var t = c.currentTime + (delay || 0);
        var bufferSize = c.sampleRate * duration;
        var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        var source = c.createBufferSource();
        source.buffer = buffer;
        var g = c.createGain();
        g.gain.setValueAtTime(gain || 0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + duration);
        source.connect(g);
        g.connect(c.destination);
        source.start(t);
        source.stop(t + duration);
    }

    var effects = {
        /* 按钮点击 - 短促的高音 */
        click: function () {
            playTone(800, 0.08, 'sine', 0.2);
        },

        /* 移动/放置 */
        move: function () {
            playTone(400, 0.06, 'sine', 0.15);
        },

        /* 成功匹配/合并 */
        merge: function () {
            playTone(523, 0.12, 'sine', 0.25);
            playTone(659, 0.12, 'sine', 0.25, 0.08);
        },

        /* 收集/得分 */
        score: function () {
            playTone(660, 0.1, 'triangle', 0.2);
            playTone(880, 0.15, 'triangle', 0.2, 0.08);
        },

        /* 消除行/连锁 */
        clear: function () {
            playTone(523, 0.08, 'square', 0.15);
            playTone(659, 0.08, 'square', 0.15, 0.06);
            playTone(784, 0.08, 'square', 0.15, 0.12);
            playTone(1047, 0.15, 'square', 0.15, 0.18);
        },

        /* 翻牌 */
        flip: function () {
            playTone(600, 0.06, 'sine', 0.15);
            playTone(900, 0.06, 'sine', 0.12, 0.04);
        },

        /* 不匹配/错误 */
        error: function () {
            playTone(300, 0.15, 'sawtooth', 0.12);
            playTone(250, 0.2, 'sawtooth', 0.12, 0.12);
        },

        /* 胜利 - 上行琶音 */
        win: function () {
            playTone(523, 0.15, 'sine', 0.25);
            playTone(659, 0.15, 'sine', 0.25, 0.12);
            playTone(784, 0.15, 'sine', 0.25, 0.24);
            playTone(1047, 0.3, 'sine', 0.3, 0.36);
        },

        /* 失败 - 下行音阶 */
        lose: function () {
            playTone(400, 0.2, 'sine', 0.2);
            playTone(350, 0.2, 'sine', 0.2, 0.15);
            playTone(300, 0.2, 'sine', 0.2, 0.3);
            playTone(200, 0.4, 'sine', 0.25, 0.45);
        },

        /* 新纪录 - 欢快的音阶 */
        record: function () {
            playTone(523, 0.1, 'sine', 0.25);
            playTone(659, 0.1, 'sine', 0.25, 0.08);
            playTone(784, 0.1, 'sine', 0.25, 0.16);
            playTone(1047, 0.15, 'sine', 0.3, 0.24);
            playTone(1175, 0.15, 'sine', 0.3, 0.32);
            playTone(1319, 0.25, 'sine', 0.3, 0.4);
        },

        /* 倒计时提示音 */
        tick: function () {
            playTone(1000, 0.03, 'sine', 0.1);
        },

        /* 打击 */
        hit: function () {
            playNoise(0.08, 0.2);
            playTone(200, 0.08, 'square', 0.15);
        },

        /* 放置/落下 */
        drop: function () {
            playTone(150, 0.15, 'sine', 0.2);
            playNoise(0.05, 0.08);
        },

        /* 选择 */
        select: function () {
            playTone(660, 0.06, 'sine', 0.15);
        },

        /* 升级 */
        upgrade: function () {
            playTone(440, 0.1, 'sine', 0.2);
            playTone(554, 0.1, 'sine', 0.2, 0.08);
            playTone(659, 0.1, 'sine', 0.2, 0.16);
            playTone(880, 0.2, 'sine', 0.25, 0.24);
        },

        /* 暂停 */
        pause: function () {
            playTone(500, 0.1, 'sine', 0.15);
            playTone(400, 0.15, 'sine', 0.1, 0.08);
        },

        /* 恢复 */
        resume: function () {
            playTone(400, 0.1, 'sine', 0.15);
            playTone(500, 0.15, 'sine', 0.1, 0.08);
        },

        /* 撤销 */
        undo: function () {
            playTone(500, 0.08, 'sine', 0.15);
            playTone(400, 0.1, 'sine', 0.12, 0.06);
        },

        /* 连击 */
        combo: function () {
            playTone(700, 0.08, 'triangle', 0.2);
            playTone(900, 0.08, 'triangle', 0.2, 0.06);
            playTone(1100, 0.12, 'triangle', 0.25, 0.12);
        }
    };

    /* ---- 公共 API ---- */

    window.GameAudio = {
        /**
         * 播放音效
         * @param {string} name - 音效名称
         */
        play: function (name) {
            if (muted) return;
            var fn = effects[name];
            if (fn) {
                try { fn(); } catch (e) { /* 忽略音频错误 */ }
            }
        },

        /**
         * 切换静音
         * @returns {boolean} 当前是否静音
         */
        toggle: function () {
            muted = !muted;
            localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
            return muted;
        },

        /**
         * 设置静音状态
         * @param {boolean} val
         */
        setMuted: function (val) {
            muted = !!val;
            localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
        },

        /**
         * 获取当前静音状态
         * @returns {boolean}
         */
        isMuted: function () {
            return muted;
        },

        /**
         * 注册自定义音效
         * @param {string} name
         * @param {Function} fn
         */
        register: function (name, fn) {
            effects[name] = fn;
        }
    };
})();

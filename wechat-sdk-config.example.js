/**
 * 微信 JS-SDK 分享配置示例
 *
 * 使用方法：
 * 1. 申请微信公众号（服务号）
 * 2. 配置服务器域名白名单
 * 3. 后端提供签名接口
 * 4. 引入微信 JS-SDK: <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
 */

// 后端签名接口示例（需要你的服务器实现）
async function getWechatSignature(url) {
    const response = await fetch(`https://your-server.com/api/wechat/signature?url=${encodeURIComponent(url)}`);
    return await response.json();
}

// 初始化微信分享
async function initWechatShare() {
    // 检查是否在微信浏览器中
    const isWechat = /micromessenger/i.test(navigator.userAgent);
    if (!isWechat) return;

    try {
        const signature = await getWechatSignature(window.location.href);

        wx.config({
            debug: false,
            appId: signature.appId,
            timestamp: signature.timestamp,
            nonceStr: signature.nonceStr,
            signature: signature.signature,
            jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData']
        });

        wx.ready(function() {
            // 分享给朋友
            wx.updateAppMessageShareData({
                title: '小游戏中心',
                desc: '贪吃蛇、2048、俄罗斯方块等精选小游戏',
                link: window.location.href,
                imgUrl: 'https://your-domain.com/preview.png',
                success: function() {
                    console.log('分享设置成功');
                }
            });

            // 分享到朋友圈
            wx.updateTimelineShareData({
                title: '小游戏中心 - 精选网页小游戏',
                link: window.location.href,
                imgUrl: 'https://your-domain.com/preview.png',
                success: function() {
                    console.log('朋友圈分享设置成功');
                }
            });
        });
    } catch (error) {
        console.error('微信分享初始化失败:', error);
    }
}

// 页面加载时初始化
if (typeof wx !== 'undefined') {
    initWechatShare();
}

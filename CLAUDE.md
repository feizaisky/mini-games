# CLAUDE.md

简要说明此仓库的结构与约定。

## 概览

- 纯静态 HTML/CSS/JavaScript，无构建步骤
- 目标：移动端/微信浏览器兼容
- 工作目录：`/opt/code/mini-games`

## 本地运行

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 目录与入口

- 主页：`/opt/code/mini-games/index.html`
- 每个游戏一个目录：`<game>/index.html` + `<game>/game.js`
- 公共组件目录：`common/`

### 目录结构约定

根据游戏复杂度选择合适的结构：

**简单游戏（< 500 行代码）** — 单文件结构：
```
<game>/
├── index.html
├── game.js          # 所有逻辑在一个文件
└── README.md
```

**复杂游戏（> 500 行代码）** — 模块化结构：
```
<game>/
├── index.html
├── styles.css       # 独立样式文件（可选）
├── js/              # JS 模块目录
│   ├── main.js      # 入口/初始化
│   ├── game.js      # 核心游戏逻辑
│   ├── ui.js        # UI 交互
│   └── ...          # 其他功能模块
└── README.md
```

选择原则：
- 优先使用简单结构，保持一致性
- 当单文件难以维护时（代码量大、功能模块多），再拆分为模块化结构
- 参考 `tower-defense/` 作为模块化结构示例

## 新增游戏

1. 新建目录（如 `new-game/`），包含 `index.html` 和 `game.js`（复杂游戏可用 `js/` 子目录）
2. 在主站 `index.html` 的 `.games-grid` 中加入口卡片（需要添加 `data-category` 属性）
3. 若有最高分，需加入主站的分数读取脚本
4. 添加统一加载动画（见下方说明）
5. 接入公共音效、庆祝动画、分享组件

示例卡片：
```html
<a href="/your-game/" class="game-card" data-category="classic">
  <div class="game-icon">🎮</div>
  <div class="game-title">Game Name</div>
  <div class="game-desc">Description</div>
</a>
```

分类标签可选值：`classic`（经典）、`puzzle`（益智）、`board`（棋类）、`action`（动作）、`other`（其他）

## 公共组件（common/）

所有游戏共享 `common/` 目录下的组件。

### 加载动画

确保用户在游戏完全加载前无法操作。

在游戏 `index.html` 中添加以下内容：

1. **`<head>` 末尾**添加 CSS 引用：
```html
<link rel="stylesheet" href="/common/loader.css">
```

2. **`<body>` 开头**添加加载遮罩 HTML：
```html
<div id="game-loader" class="game-loader">
    <div class="loader-spinner"></div>
    <div class="loader-text">加载中</div>
</div>
```

3. **`</body>` 前**添加 JS 引用：
```html
<script src="/common/loader.js"></script>
```

手动控制（可选）：
```javascript
window.GameLoader.hide();
```

### 音效系统

基于 Web Audio API 合成音效，无需加载外部音频文件。

```html
<script src="/common/audio.js"></script>
```

常用 API：
```javascript
GameAudio.play('click');    // 按钮点击
GameAudio.play('move');     // 移动/放置
GameAudio.play('merge');    // 合并/匹配
GameAudio.play('score');    // 得分
GameAudio.play('clear');    // 消除
GameAudio.play('flip');     // 翻牌
GameAudio.play('error');    // 错误
GameAudio.play('win');      // 胜利
GameAudio.play('lose');     // 失败
GameAudio.play('record');   // 新纪录
GameAudio.play('hit');      // 打击
GameAudio.play('drop');     // 落下
GameAudio.play('select');   // 选择
GameAudio.play('upgrade');  // 升级
GameAudio.play('pause');    // 暂停
GameAudio.play('resume');   // 恢复
GameAudio.play('undo');     // 撤销
GameAudio.play('combo');    // 连击
GameAudio.play('tick');     // 倒计时
GameAudio.toggle();         // 切换静音
GameAudio.isMuted();        // 查询静音状态
GameAudio.register('name', fn); // 注册自定义音效
```

静音状态自动通过 localStorage 键 `gameAudioMuted` 持久化。

### 庆祝动画

Canvas 彩带/粒子效果。

```html
<link rel="stylesheet" href="/common/celebration.css">
<script src="/common/celebration.js"></script>
```

```javascript
GameCelebration.show();                   // 默认效果
GameCelebration.show({ duration: 3000 }); // 自定义时长
GameCelebration.hide();                   // 手动隐藏
```

### 分享组件

生成成绩卡片图，支持保存图片和复制文本。

```html
<script src="/common/share.js"></script>
```

```javascript
GameShare.show({
    title: '贪吃蛇',
    score: '120分',
    extra: '最高纪录',
    icon: '🐍'
});
GameShare.hide();
GameShare.toDataURL(opts); // 获取卡片图 dataURL
```

### 脚本加载顺序

在 `</body>` 前按以下顺序引入：
```html
<script src="game.js"></script>
<script src="/common/audio.js"></script>
<script src="/common/celebration.js"></script>
<script src="/common/share.js"></script>
<script src="/common/loader.js"></script>
```

## 移动端/微信兼容

必需 meta：
```html
<meta name="x5-orientation" content="portrait">
<meta name="x5-fullscreen" content="true">
<meta name="x5-page-mode" content="app">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

常用样式/事件：
- `overscroll-behavior: none`
- `touch-action: manipulation`
- `env(safe-area-inset-*)`
- `addEventListener(..., { passive: false })`

## 交互限制

- 所有游戏页面禁止复制/选择文本（`-webkit-user-select: none; user-select: none`）
- 所有游戏页面禁止缩放（`meta viewport` 加 `maximum-scale=1.0, user-scalable=no`）

## LocalStorage 键

### 游戏成绩
- `snakeHighScore` — 贪吃蛇最高分
- `bestScore2048` — 2048 最高分
- `tetrisHighScore` — 俄罗斯方块最高分
- `whackMoleHighScore` — 打地鼠最高分
- `memoryBestMoves` / `memoryBestTime` — 记忆翻牌最佳成绩
- `sudokuBestTime` — 数独最佳时间
- `tictactoeWins` / `tictactoeLosses` / `tictactoeDraws` — 井字棋胜负统计
- `puzzleV2Best_3` / `puzzleV2Best_4` / `puzzleV2Best_5` — 拼图各尺寸最佳
- `lightsOutBest` — 熄灯最佳成绩
- `oneStrokeBest` — 一笔画最佳成绩
- `td_progress_v1` — 塔防进度（解锁地图、最佳波数）
- `td_achievements_v1` — 塔防成就

### 游戏设置
- `gameMode2048` — 2048 游戏模式
- `gameAudioMuted` — 全局静音状态
- `mbtiHistory` — MBTI 历史记录

### 主站
- `lastPlayed_<href>` — 各游戏最后游玩时间

## 语言

界面文案以简体中文为主。

## Git 提交规范

### 使用 Git Push Skill

在 Claude Code 中直接说 **"push 到仓库"** 即可自动：
- 添加所有更改
- 智能生成提交消息
- 推送到远程仓库

### 提交消息格式

遵循 Conventional Commits：
- `feat:` 新功能
- `fix:` 修复问题
- `style:` 样式优化
- `refactor:` 重构代码
- `docs:` 文档更新
- `chore:` 其他更改

所有提交自动添加：
```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

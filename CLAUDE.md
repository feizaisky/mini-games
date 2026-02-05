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
2. 在主站 `index.html` 的 `.games-grid` 中加入口卡片
3. 若有最高分，需加入主站的分数读取脚本
4. 添加统一加载动画（见下方说明）

示例卡片：
```html
<a href="/your-game/" class="game-card">
  <div class="game-icon">🎮</div>
  <div class="game-title">Game Name</div>
  <div class="game-desc">Description</div>
</a>
```

## 统一加载动画

所有游戏使用 `common/` 目录下的公共加载组件，确保用户在游戏完全加载前无法操作。

### 添加方式

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

### 公共文件

- `common/loader.css` — 加载动画样式
- `common/loader.js` — 自动监听页面加载完成并隐藏遮罩

### 手动控制（可选）

如需手动隐藏加载动画（如异步资源加载完成后）：
```javascript
window.GameLoader.hide();
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

- `snakeHighScore`
- `bestScore2048`
- `tetrisHighScore`
- `oneStrokeBest`

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

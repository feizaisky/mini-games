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

## 新增游戏

1. 新建目录（如 `new-game/`），包含 `index.html` 和 `game.js`
2. 在主站 `index.html` 的 `.games-grid` 中加入口卡片
3. 若有最高分，需加入主站的分数读取脚本

示例卡片：
```html
<a href="/your-game/" class="game-card">
  <div class="game-icon">🎮</div>
  <div class="game-title">Game Name</div>
  <div class="game-desc">Description</div>
</a>
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

## LocalStorage 键

- `snakeHighScore`
- `bestScore2048`
- `tetrisHighScore`

## 语言

界面文案以简体中文为主。

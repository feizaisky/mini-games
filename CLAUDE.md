# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a static web game portal containing vanilla HTML/CSS/JavaScript games with no build step or framework dependencies. The games are optimized for mobile browsers, including WeChat browser.

**Current Working Directory**: `/opt/code/mini-games`

## Running the Application

### Local Development Server

To test changes locally before deploying:

```bash
# Python 3
python3 -m http.server 8000

# Then visit http://localhost:8000
```

### Production (nginx)

The files are served directly by nginx. No build process is required - simply edit files and reload the browser.

## Architecture

### Directory Structure

```
/opt/code/mini-games/
├── index.html              # Main game portal/landing page
├── snake-game/             # Snake game subdirectory
│   ├── index.html         # Snake game page
│   └── game.js            # Snake game logic
├── 2048/                   # 2048 game subdirectory
│   ├── index.html
│   └── game.js
├── tetris/                 # Tetris game subdirectory
│   ├── index.html
│   └── game.js
├── gomoku/                 # Gomoku (Five-in-a-Row) game subdirectory
│   ├── index.html
│   └── game.js
├── CLAUDE.md              # This file
└── README.md              # Documentation
```

### Game Portal Design

The main `index.html` serves as a hub for multiple games. Games are organized as subdirectories (e.g., `/snake-game/`, `/2048/`). Each game is self-contained with its own `index.html` and `game.js`.

The portal displays high scores from `localStorage` for games that store them:
- `snakeHighScore` - Snake game
- `bestScore2048` - 2048 game
- `tetrisHighScore` - Tetris game

### Adding New Games

1. Create a new subdirectory for the game (e.g., `new-game/`)
2. Add an `index.html` file in that directory
3. Add a link card in the main `index.html` in the `.games-grid` section
4. If the game has high scores, add it to the `games` array in the portal's score loading script

Example card structure:
```html
<a href="/your-game/" class="game-card">
    <div class="game-icon">🎮</div>
    <div class="game-title">Game Name</div>
    <div class="game-desc">Description</div>
</a>
```

### Mobile/WeChat Browser Compatibility

All games include WeChat browser-specific meta tags:
```html
<meta name="x5-orientation" content="portrait">
<meta name="x5-fullscreen" content="true">
<meta name="x5-page-mode" content="app">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

Common mobile compatibility patterns used:
- `overscroll-behavior: none` to prevent pull-to-refresh
- `touch-action: manipulation` to improve touch responsiveness
- `env(safe-area-inset-*)` for notched devices
- Passive event listeners with `{passive: false}` for preventing default touch behaviors

## Game Implementations

### Snake Game (`snake-game/`)

Built with HTML5 Canvas and a variable-speed game loop:
- **Controls**: Keyboard arrows, touch swipes, click/tap
- **Difficulty system**: Easy (200ms), Medium (120ms), Hard (80ms)
- **Key variables**: `gridSize = 20`, `tileCount` calculated from canvas width
- **Storage**: `localStorage.getItem('snakeHighScore')`

### 2048 Game (`2048/`)

Grid-based puzzle game:
- **Grid size**: 4x4
- **Controls**: Arrow keys, touch swipes
- **Scoring**: Merging tiles adds their value to score
- **Storage**: `localStorage.getItem('bestScore2048')`
- **Key functions**: `slideLeft()` for row manipulation, `move()` for all four directions

### Tetris Game (`tetris/`)

Classic falling block game:
- **Board**: 10 columns × 20 rows, 30px blocks
- **Controls**: Arrow keys (Up=rotate, Down=soft drop, Space=hard drop), touch swipes, on-screen buttons
- **Features**: Shadow piece (landing preview), next piece preview, wall kicks
- **Scoring**: 100/300/500/800 points for 1/2/3/4 lines × level
- **Level system**: Speed increases every 10 lines cleared
- **Storage**: `localStorage.getItem('tetrisHighScore')`
- **Responsive canvas**: Dynamically scales on mobile (`resizeCanvas()`)

### Gomoku Game (`gomoku/`)

Five-in-a-Row board game with AI opponent:
- **Board**: 13×13 grid with canvas rendering
- **AI difficulty**: Easy (depth 1, 30% random), Medium (depth 2, 10% random), Hard (depth 3)
- **Features**: Undo move, last move marker, star points
- **AI evaluation**: Considers both offense and defense with position-based scoring
- **Controls**: Click/tap on intersections, full touch support

### Common Game Loop Pattern

Most games use recursive `setTimeout` for variable speed control:
```javascript
function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    gameLoopId = setTimeout(gameLoop, gameSpeed);
}
```

Use `clearTimeout(gameLoopId)` to stop the loop.

## LocalStorage Keys

The portal and games use these `localStorage` keys:
- `snakeHighScore` - Snake game high score
- `bestScore2048` - 2048 game high score
- `tetrisHighScore` - Tetris game high score

## Language

The UI text is primarily in Chinese (Simplified). When adding new features or games, maintain Chinese language consistency with existing content.

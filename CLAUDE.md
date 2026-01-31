# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a static web game portal served via nginx. The codebase contains vanilla HTML/CSS/JavaScript games with no build step or framework dependencies.

**Current Working Directory**: `/usr/share/nginx/html`

## Running the Application

### Local Development Server

To test changes locally before deploying:

```bash
# Python 3
python3 -m http.server 8000

# Then visit http://localhost:8000
```

### Production (nginx)

The files are served directly by nginx from `/usr/share/nginx/html`. No build process is required - simply edit files and reload the browser.

## Architecture

### Directory Structure

```
/usr/share/nginx/html/
├── index.html              # Main game portal/landing page
├── snake-game/             # Snake game subdirectory
│   ├── index.html         # Snake game page
│   └── game.js            # Snake game logic
└── README.md              # Documentation
```

### Game Portal Design

The main `index.html` serves as a hub for multiple games. Games are organized as subdirectories (e.g., `/snake-game/`). Each game is self-contained with its own `index.html` and any required assets/scripts.

### Adding New Games

1. Create a new subdirectory for the game (e.g., `tetris-game/`)
2. Add an `index.html` file in that directory
3. Add a link card in the main `index.html` following the existing pattern in `.games-grid`

Example card structure:
```html
<a href="/your-game/" class="game-card">
    <div class="game-icon">🎮</div>
    <div class="game-title">Game Name</div>
    <div class="game-desc">Description</div>
</a>
```

### Snake Game Implementation

The snake game (`snake-game/game.js`) is built with:
- **HTML5 Canvas** for rendering
- **Game loop** using `setTimeout()` (variable speed increases as score increases)
- **Input handling**: Keyboard arrows, touch swipes, and click/tap controls
- **Collision detection**: Wall boundaries and self-collision
- **Rendering**: Canvas gradients for snake body segments and food

Key game state variables (in `game.js`):
- `gridSize = 20` - Size of each grid cell in pixels
- `gameSpeed = 100` - Initial game loop delay in milliseconds (decreases as score increases)
- `tileCount` - Number of tiles (calculated from canvas width / gridSize)

### Game Loop Pattern

The game uses a recursive `setTimeout` pattern rather than `setInterval` to allow variable speed:
```javascript
function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    gameLoopId = setTimeout(gameLoop, gameSpeed);
}
```

## Common Modifications

### Changing Snake Game Difficulty

Edit `snake-game/game.js`:
- Line 8: `const gridSize = 20;` - Smaller values = more tiles, harder game
- Line 18: `let gameSpeed = 100;` - Lower values = faster initial speed
- Lines 136-138: Speed increase rate per food eaten

### Changing Canvas Size

Edit `snake-game/index.html` line 110:
```html
<canvas id="gameCanvas" width="400" height="400"></canvas>
```

Note: The JavaScript assumes a square canvas. If changing dimensions, update the tile calculation logic.

## Language

The UI text is primarily in Chinese (Simplified). When adding new features or games, consider maintaining Chinese language consistency with existing content.

Original prompt: Use the develop-web-game skill.

Build a complete, playable tower defense web game optimized for mobile browsers.

Game design:
- 2D top-down tower defense.
- Enemies follow a fixed path from spawn to base.
- Player can place towers on valid tiles (not on the path).
- Towers automatically target nearest enemy in range and shoot projectiles.
- Player starts with gold; placing towers costs gold; killing enemies grants gold.
- Base has HP; enemy reaching base reduces HP; game ends at 0 HP.
- Waves: at least 10 waves with increasing difficulty and a “Start Wave” button.

Mobile-first UX:
- Works well on iPhone/Android Chrome/Safari.
- Use responsive layout (fit to viewport).
- Controls must be touch-friendly:
  - Tap a build button (e.g., “Gun Tower”, “Slow Tower”) then tap a valid tile to place.
  - Tap an existing tower to show upgrade/sell buttons.
  - Optional: pinch-zoom is not required; keep the board fully visible.
- Large buttons, no hover interactions.

Tech constraints:
- Pure HTML + CSS + JavaScript using Canvas (no external frameworks, no build step).
- Use requestAnimationFrame game loop.
- Organize code into modules/files (not a single monolithic JS file).
- Provide simple pixel-art-like visuals with shapes (no external images).
- Include sound toggle (mute/unmute) but do not require audio assets.

Deliverables:
- Full project file tree.
- All source code for every file.
- Clear instructions: open index.html to play.
- Include a short README with rules and controls.
Focus on executable code, minimal explanation.

Add an option to drag a tower icon from the UI onto the map to place it (touch drag).
Add Pause and 1x/2x speed controls.
Add level select (3 maps) and save progress to localStorage.
风格更像《Kingdom Rush》

---

Updates:
- Created tower defense game in /opt/code/mini-games/tower-defense with modular JS, canvas rendering, drag/tap build, upgrades, waves, maps, pause/speed, and localStorage progress.
- Added sound toggle with simple WebAudio beeps.
- Added render_game_to_text + advanceTime hooks and fullscreen toggle (key: f).
- Attempted Playwright run but Playwright dependency missing; npm install failed due to network (ENOTFOUND registry.npmjs.org).

TODO:
- Run Playwright tests once Playwright is available and verify screenshots/state output.

Updates:
- Added Tower Defense card to homepage and generated an icon at /opt/code/mini-games/tower-defense/icon.svg.

TODO:
- Re-run Playwright once Playwright is available.

Updates:
- Switched homepage links to relative paths for better compatibility in embedded browsers.
- Localized tower-defense UI, maps, and messages to Chinese; updated README in Chinese.

Updates:
- Playwright test run succeeded after fixing overlay hidden pointer events; captured screenshots/state.
- Note: Playwright required symlinks for arm64 chromium binaries.

Updates:
- Moved Start Wave button to top bar next to Maps.
- Added auto-next-wave countdown (3s) and UI countdown text.
- Gave each tower a unique silhouette and added descriptions for long-press info.

Updates:
- Tower info now displayed inline on cards (cost, damage, attack speed, effect), long-press tooltip removed.
- Disabled long-press selection/copy and tightened top bar layout to single row.

Updates:
- Moved gold/base/wave/start button to the second header row; tightened header layout.

Updates:
- Redesigned top header with home button + title chip and two-row grouped layout.
- Start button text shortened to "开始" and "进行中".
- Added selected tower range ring rendering.
- Added Home button linking to ../index.html.

Updates:
- Tower selection now takes priority on tap, clearing build mode and showing range + actions instantly.

Updates:
- Stats line now inline (金币/城堡/波) and empty-tap clears selection.

Updates:
- Pause button moved next to Start on the bottom row.
- Tower upgrade/sell actions moved into an overlay inside the canvas for immediate access.

Updates:
- Tower actions now render as a bubble near the selected tower; disabled double-tap zoom via touchend handler and touch-action.

Updates:
- Fixed tower action bubble hidden state via [hidden] display none.

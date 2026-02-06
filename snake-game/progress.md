Original prompt: 把贪吃蛇的速度调成现在的一半。

- 2026-02-03: Slowed all difficulty speeds to half speed by doubling tick delays.
- 2026-02-03: Added render_game_to_text and advanceTime hooks plus stepGame helper for deterministic testing.
- 2026-02-03: Ran Playwright client against file URL; captured screenshots and render_game_to_text output in output/web-game.
- 2026-02-03: Further slowed speed by 1.5x (easy 600, medium 360, hard 240) to make gameplay easier.
- 2026-02-03: Slowed speed further (easy 800, medium 480, hard 320) to make the game easier.
- 2026-02-03: Added press-and-hold boost (touch/mouse) and speed tracking; added copy/zoom prevention handlers.
- 2026-02-06: Redesigned snake UI in index.html with a new glass-panel layout, upgraded scoreboard/cards, and refreshed button/board visuals while preserving existing game IDs and controls.
- 2026-02-06: Updated map button injection in game.js to target .map-selector .map-btns and keep selected map state visually synced.
- 2026-02-06: Compressed top UI footprint by shrinking title/score cards, reducing paddings/margins, and switching difficulty+map controls into a compact 2-column row.
- 2026-02-06: Renamed visible game title to Chinese (贪吃蛇冲刺).
- 2026-02-06: Fixed cross map layout by adding passable gates (no longer fully blocked) and added map-specific spawn/direction presets.
- 2026-02-06: Adjusted canyon spawn to a safer entry point/direction to reduce hard-mode instant deaths at game start.
- 2026-02-06: Locked difficulty/map switching during active gameplay (including paused), and only allow switching when not in a running round.
- 2026-02-06: Keep restart button visible after game start so players can restart mid-run without waiting for game over.
- 2026-02-06: Switched UI to a light card theme (background, panels, controls, action buttons) and updated canvas board/pause overlay to matching light palette.
- 2026-02-06: Changed pre-game difficulty/map switching to reset into idle preview state only; game starts strictly on Start button.

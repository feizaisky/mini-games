Original prompt: 把贪吃蛇的速度调成现在的一半。

- 2026-02-03: Slowed all difficulty speeds to half speed by doubling tick delays.
- 2026-02-03: Added render_game_to_text and advanceTime hooks plus stepGame helper for deterministic testing.
- 2026-02-03: Ran Playwright client against file URL; captured screenshots and render_game_to_text output in output/web-game.
- 2026-02-03: Further slowed speed by 1.5x (easy 600, medium 360, hard 240) to make gameplay easier.
- 2026-02-03: Slowed speed further (easy 800, medium 480, hard 320) to make the game easier.
- 2026-02-03: Added press-and-hold boost (touch/mouse) and speed tracking; added copy/zoom prevention handlers.

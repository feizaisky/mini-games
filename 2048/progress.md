Original prompt: 2048游戏界面有些乱，看看怎么调整一下布局

- 2026-02-06: Rebuilt 2048 page layout into clear sections (header, score cards, mode toggles, board, controls, action rows).
- 2026-02-06: Fixed malformed HTML structure around game-won block and cleaned container hierarchy.
- 2026-02-06: Updated revive button injection to rely on layout styles instead of inline margin offsets.
- 2026-02-06: Reduced overall 2048 page height to avoid vertical scrolling by tightening paddings, typography, and board cell sizes.
- 2026-02-06: Replaced dual mode buttons with a single \"打开8\" toggle in the same row as score cards.
- 2026-02-06: Moved action buttons into a single row (new game, revive, undo) and updated mode toggle logic in game.js.
- 2026-02-06: Changed the "打开8" control from a card block to an inline toggle style in the score row.

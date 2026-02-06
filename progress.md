Original prompt: PLEASE IMPLEMENT THIS PLAN: 小游戏中心二次巡检后迭代方案（全量 14 款）

- 2026-02-06: 开始实施全量迭代，优先完成统一接口（render_game_to_text / advanceTime / get_game_meta）和统一存档键迁移。
- 2026-02-06: 计划分两批提交：先基础能力与首页聚合，再补逐游戏玩法增量与回归校验。
- 2026-02-06: 已为 14 款游戏补齐或统一 `window.get_game_meta`，并为缺失项目补齐 `render_game_to_text` 与 `advanceTime`。
- 2026-02-06: 首页 `/opt/code/mini-games/index.html` 重构为 `scoreAdapters` 聚合层，新增 legacy -> `miniGames.v1.*` 迁移并修正塔防图标相对路径。
- 2026-02-06: 已实现玩法增量（轻量可切换）：2048 保底复活；贪吃蛇障碍地图；俄罗斯方块 B2B；熄灯每日挑战；塔防精英敌人；象棋残局挑战；五子棋禁手+复盘；拼图竞速；打地鼠连击狂热；MBTI 历史雷达。
- 2026-02-06: 语法回归：全部目标 JS 文件通过 `node --check`。

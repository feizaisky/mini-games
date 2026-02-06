Original prompt: PLEASE IMPLEMENT THIS PLAN: 小游戏中心二次巡检后迭代方案（全量 14 款）

- 2026-02-06: 开始实施全量迭代，优先完成统一接口（render_game_to_text / advanceTime / get_game_meta）和统一存档键迁移。
- 2026-02-06: 计划分两批提交：先基础能力与首页聚合，再补逐游戏玩法增量与回归校验。
- 2026-02-06: 已为 14 款游戏补齐或统一 `window.get_game_meta`，并为缺失项目补齐 `render_game_to_text` 与 `advanceTime`。
- 2026-02-06: 首页 `/opt/code/mini-games/index.html` 重构为 `scoreAdapters` 聚合层，新增 legacy -> `miniGames.v1.*` 迁移并修正塔防图标相对路径。
- 2026-02-06: 已实现玩法增量（轻量可切换）：2048 保底复活；贪吃蛇障碍地图；俄罗斯方块 B2B；熄灯每日挑战；塔防精英敌人；象棋残局挑战；五子棋禁手+复盘；拼图竞速；打地鼠连击狂热；MBTI 历史雷达。
- 2026-02-06: 语法回归：全部目标 JS 文件通过 `node --check`。
- 2026-02-06: 新增三款街机游戏目录与实现：`airplane-shooter`、`breakout`、`pinball`，均接入统一接口 `render_game_to_text / advanceTime / get_game_meta`。
- 2026-02-06: 三款新游戏页面完成公共组件接入（`/common/audio.js`、`/common/share.js`、`/common/anti-longpress.js`、`/common/loader.js`）并保留返回首页、移动端操作与全屏快捷键 `f`。
- 2026-02-06: 首页 `/opt/code/mini-games/index.html` 新增三张游戏卡片与 `scoreAdapters` 读取：`miniGames.v1.airplane-shooter.best`、`miniGames.v1.breakout.best`、`miniGames.v1.pinball.best`。
- 2026-02-06: README 已补充 3 款新游戏列表与目录结构。
- TODO: 使用 Playwright 对三款新游戏分别执行最小可玩脚本，补充截图与控制台回归记录。

- 2026-02-06: 统一今日新增游戏图标资源，新增 `/common/icons/{airplane-shooter,breakout,pinball,minesweeper,match3}.svg`，并同步替换首页卡片、成绩区和 5 个游戏页标题图标，移除对应 emoji 显示。

- 2026-02-06: 调整首页“我的成绩”区：修正图标映射（2048/俄罗斯方块及新增游戏图标引用）、新增“超过三行默认折叠两行+更多/收起”交互、并将成绩值字号与标题字号统一。

- 2026-02-06: 成绩区图标改为优先复用首页游戏卡片图标（SVG/IMG），确保与卡片视觉统一；仅在找不到卡片图标时才使用后备符号。

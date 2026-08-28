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
- 2026-02-14: 按用户要求开始“棋类残局章节化”迭代，目标覆盖 `gomoku` 与 `chinese-chess`，并保持原有人机/人人模式可用。
- 2026-02-14: `chinese-chess/game.js` 已从随机残局改为章节挑战：新增 3 章残局配置、章节解锁存档、章节按钮（轮换章节+进入/退出）、步数上限失败判定与通关解锁下一章。
- 2026-02-14: `gomoku/game.js` 新增残局章节模式：新增 3 章局面、章节解锁存档、章节按钮（轮换章节+进入/退出）、步数限制（一步/两步）与通关解锁。
- 2026-02-14: 回归验证已执行：
  - `node --check chinese-chess/game.js`
  - `node --check gomoku/game.js`
  - Playwright 客户端：`/chinese-chess/` 与 `/gomoku/` 均可进入残局模式并输出 challenge 状态；截图位于 `output/web-game/chinese-chess/` 与 `output/web-game/gomoku/`。
- TODO: 为中国象棋残局第2/3章补充更稳定的“必胜步数”验证样例，避免个别 AI 分支导致体感难度波动。

- 2026-02-24: 用户要求检查并修复 `endless-runner`。已完成首轮代码阅读，准备通过 Playwright 复现实际问题。
- 2026-02-24: 已修复 `endless-runner` 的可测性与时间步进问题：新增 `render_game_to_text`/`advanceTime`/`get_game_meta`，将玩家滑铲与金币连击从 `setTimeout` 改为基于 delta 的更新，并支持 `F` 全屏切换与暂停状态键盘恢复。
- 2026-02-24: 回归验证完成：`output/endless-runner-check-3/` 已生成 `state-0/1/2.json` 与 `shot-0/1/2.png`，未出现新的 `errors-*.json`；此前一次 `ReferenceError: ts is not defined` 已修复。
- 2026-02-24: 根据反馈移除路径新增图标（障碍/金币的 Sprite 标识），仅保留地面环形提示；并修复低墙/路障碰撞判定（改为基于角色底部高度），现在站立会碰撞结束、跳跃可越过。
- 2026-03-02: 扫雷输入迭代：`/minesweeper/game.js` 新增 `chordReveal`，支持数字格在“旗子数匹配”时展开周围未插旗邻格。
- 2026-03-02: 已接入两种触发方式：`dblclick`（双击数字格）和“鼠标左右键同时按下” (`mousedown` 左右键组合)。
- 2026-03-02: 为避免组合键后误触，新增 `suppressClick/chordConsumed` 逻辑，抑制后续 click/contextmenu 重入。
- 2026-03-02: 语法检查通过：`node --check /opt/code/mini-games/minesweeper/game.js`。
- 2026-03-02: Playwright 自动回归受环境限制阻塞：客户端访问 `http://127.0.0.1:<port>/minesweeper/` 持续返回 `ERR_CONNECTION_REFUSED`，需在可访问本地环回的环境补跑。

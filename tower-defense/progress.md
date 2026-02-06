原始需求：使用 develop-web-game 技能。

构建完整可玩的塔防网页游戏，优化移动端浏览器。

游戏设计：
- 2D 俯视塔防。
- 敌人沿固定路线从出生点到达基地。
- 玩家可在有效地块上放置炮塔（不能放在道路上）。
- 炮塔自动锁定范围内最近敌人并发射弹丸。
- 玩家初始拥有金币；放置炮塔消耗金币；击杀敌人获得金币。
- 基地有生命值；敌人到达基地会减少生命值；生命值为 0 时结束。
- 波次：至少 10 波，难度逐步提升，并有“开始波次”按钮。

移动端优先体验：
- 在 iPhone/Android 的 Chrome/Safari 上运行良好。
- 响应式布局（适配视口）。
- 操作必须适合触摸：
  - 点击建造按钮（如“枪塔”“减速塔”），再点击有效地块放置。
  - 点击已有炮塔显示升级/出售按钮。
  - 可选：不需要双指缩放，棋盘保持完整可见。
- 大按钮，无悬停交互。

技术约束：
- 纯 HTML + CSS + JavaScript，使用 Canvas（无外部框架、无构建步骤）。
- 使用 requestAnimationFrame 游戏循环。
- 代码按模块/文件组织（不是单文件巨型 JS）。
- 视觉为简单像素风/图形形状（无外部图片）。
- 提供静音/开声音开关，但不要求音频资源。

交付物：
- 完整项目文件树。
- 每个文件的全部源码。
- 清晰说明：打开 index.html 即可游玩。
- 简短 README，包含规则与控制。
重点：可执行代码，尽量少解释。

新增：支持从 UI 拖拽炮塔图标到地图放置（触摸拖拽）。
新增：暂停与 1x/2x 速度控制。
新增：关卡选择（3 张地图）并将进度保存到 localStorage。
风格更像《Kingdom Rush》。

---

更新：
- 在 /opt/code/mini-games/tower-defense 创建塔防游戏，包含模块化 JS、Canvas 渲染、拖拽/点击建造、升级、波次、地图和本地存档。
- 添加音效开关与简单 WebAudio 提示音。
- 添加 render_game_to_text + advanceTime 钩子以及全屏切换（快捷键：f）。
- 尝试运行 Playwright，但依赖缺失；npm install 因网络问题失败（ENOTFOUND registry.npmjs.org）。

待办：
- Playwright 可用后运行测试并验证截图/状态输出。

更新：
- 在首页添加塔防卡片，并生成图标 /opt/code/mini-games/tower-defense/icon.svg。

待办：
- Playwright 可用后重新运行。

更新：
- 将首页链接改为相对路径，提升在嵌入式浏览器中的兼容性。
- 将塔防 UI、地图与文本本地化为中文，并更新 README 为中文。

更新：
- 修复遮罩层 pointer-events 后 Playwright 通过；已截取截图/状态。
- 备注：Playwright 需要为 arm64 的 Chromium 二进制建立符号链接。

更新：
- 将“开始波次”按钮移至顶栏并紧挨地图选择。
- 增加自动下一波 3 秒倒计时与 UI 文案。
- 为每个炮塔添加独立剪影并提供长按说明。

更新：
- 炮塔信息改为卡片内联显示（花费、伤害、攻速、效果），移除长按提示。
- 禁用长按选择/复制并压缩顶栏为单行布局。

更新：
- 将金币/基地/波次/开始按钮移到第二行并收紧头部布局。

更新：
- 重新设计顶部栏，包含返回主页按钮与标题徽章，改为两行分组布局。
- 开始按钮文字缩短为“开始”/“进行中”。
- 增加所选炮塔射程环显示。
- 添加返回主页按钮链接到 ../index.html。

更新：
- 点击时炮塔选择优先，清除建造模式并立刻显示射程与操作。

更新：
- 状态行改为“金币/城堡/波”内联显示，点击空白处清除选择。

更新：
- 暂停按钮移至底部行并靠近开始按钮。
- 炮塔升级/出售操作移入画布内的浮层以便就近点击。

更新：
- 炮塔操作气泡显示在所选炮塔附近；通过 touchend 处理并设置 touch-action 以禁用双击缩放。

更新：
- 修复炮塔操作气泡 [hidden] 隐藏态未正确 display:none 的问题。

更新：
- 将波次数量扩展到 20 波。
- 炮塔升级/出售气泡在靠近顶部时自动翻转到塔下方，并限制横向位置，避免溢出画布。

更新：
- 缩小顶部状态栏“金币/城堡/波”的字体尺寸（常规 13px，窄屏 12px）。

测试：
- 尝试用 Playwright 打开 file:// 进行截图，因模块脚本 CORS 限制失败（控制台报错 file:///.../js/main.js 被阻止）。
- Sandbox 内本地 http 服务/127.0.0.1 请求被限制（Operation not permitted），暂无法用 http 方式跑测试。

更新：
- 顶部第二行“开始/暂停”按钮整体靠右（在开始按钮上设置 margin-left:auto）。

更新：
- 炮塔建造栏改为紧凑小卡：仅展示图标、名称、费用、效果图标。
- 交互改为“短按选中建造 / 再次短按取消”，并新增“长按（420ms）显示详细属性”面板。
- 详细属性面板包含：费用、攻击力、攻速、射程、效果类型、描述；支持关闭按钮。
- 通过本地 http + Playwright 动作脚本完成一次验证：可完成选塔建造并保持主流程可玩。

测试：
- `node --check /opt/code/mini-games/tower-defense/js/main.js`
- `node --check /opt/code/mini-games/tower-defense/js/ui.js`
- Playwright 截图输出：`/opt/code/mini-games/output/tower-defense-ui/shot-0.png`

更新：
- 修复“点击地图后无法继续操作”问题：地图卡片从仅 click 改为 click + pointerup 双通道触发，避免移动端触摸未触发 click 导致界面卡在遮罩态。
- 修复“进入地图后无法滑动”问题：`#game-canvas` 的 `touch-action` 从 `none` 调整为 `pan-y`，允许纵向滚动。

测试：
- `node --check /opt/code/mini-games/tower-defense/js/ui.js`
- `node --check /opt/code/mini-games/tower-defense/js/main.js`
- Playwright 验证截图：`/opt/code/mini-games/output/tower-defense-map-fix/shot-0.png`

更新：
- 地图选择卡片增加显式“开始游戏”按钮（仅已解锁地图显示），降低 WebView 点击歧义。
- 地图启动事件改为三通道：`click + pointerup + touchend(passive:false)`，提升微信/内嵌浏览器兼容性。
- 锁定地图同样三通道提示“未解锁”。

测试：
- `node --check /opt/code/mini-games/tower-defense/js/ui.js`
- Playwright 端到端：打开地图面板并触发开始，结果进入 playing。
- 截图：`/opt/code/mini-games/output/tower-defense-map-start-fix/shot-0.png`

更新：
- 重写 `ui.js` 交互层，统一关键按钮为 `touchend + click` 双通道 tap 绑定，消除 iOS WebView 下 click 丢失导致的无响应问题。
- 地图卡片保持显式“开始游戏”按钮并沿用统一 tap 绑定。
- 炮塔卡片与画布操作补齐 touch 事件链（touchstart/move/end/cancel），不再仅依赖 pointer。
- 修复一次由交互重构引入的前端崩溃（此前页面报 `SyntaxError: Unexpected token ')'`，导致全局无响应/黑屏）。
- 顶部栏提升层级（`z-index:30`）并显式 `pointer-events:auto`，防止被其他层遮挡后按钮不可点击。

测试：
- `node --check /opt/code/mini-games/tower-defense/js/ui.js`
- `node --check /opt/code/mini-games/tower-defense/js/main.js`
- Playwright 回归（地图/开始/控制链路）通过，输出：`/opt/code/mini-games/output/tower-defense-controls-fix-2/shot-0.png`

更新：
- 修复地图浮层层级：`.overlay` 提升到 `z-index: 200`，保证覆盖顶部控制条。
- 修复地图浮层无法滑动：`overlay` 和 `menu` 均启用 `overflow-y:auto`、`-webkit-overflow-scrolling: touch`、`touch-action: pan-y`。
- 地图列表固定两列：`.map-list` 统一 `grid-template-columns: repeat(2, minmax(0, 1fr))`。
- 移动端优化：菜单最大高度基于视口并可滚动，减少遮挡与触控冲突。

测试：
- `node --check /opt/code/mini-games/tower-defense/js/ui.js`
- Playwright 截图校验命令执行通过（语法与运行无报错）。

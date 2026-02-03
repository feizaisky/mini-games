Original prompt: 完善lights-out 游戏并加到首页中

Updates:
- 新增熄灯（Lights Out）游戏：Canvas 渲染、三种尺寸与难度、计时与步数、撤销、新局/洗牌、胜利弹层与本地最佳记录。
- 增加 render_game_to_text 与 advanceTime 钩子，支持自动化测试。
- 支持 F 键全屏切换与移动端触摸操作。
- 已添加到首页卡片与成绩区域。
- 运行 Playwright 脚本并检查截图与状态输出（output/web-game/shot-0..2.png、state-0..2.json），交互正常。

TODO:
- 若需要，可在更多尺寸/难度下补充自动化测试用例。

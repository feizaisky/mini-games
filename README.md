# 小游戏中心

一个集合了多款经典与休闲小游戏的网页合集，打开即玩，适合本地试玩或静态部署。

## 游戏列表

- [贪吃蛇](./snake-game/)：经典贪吃蛇游戏
- [2048](./2048/)：数字合并挑战
- [俄罗斯方块](./tetris/)：方块消除
- [王国塔防](./tower-defense/)：策略塔防守卫
- [五子棋](./gomoku/)：益智棋类对战
- [记忆翻牌](./memory-game/)：配对记忆游戏
- [MBTI测试](./mbti-test/)：人格性格测试
- [打地鼠](./whack-a-mole/)：反应速度挑战
- [数独](./sudoku/)：逻辑填数
- [井字棋](./tic-tac-toe/)：经典策略
- [拼图游戏](./puzzle/)：图像拼图挑战
- [一笔画](./one-stroke/)：一笔连通所有点

## 快速开始

### 方法 1：直接打开

在浏览器中打开根目录的 `index.html`，即可进入游戏大厅。

### 方法 2：本地服务器

```bash
cd /path/to/mini-games
python3 -m http.server 8000
# 然后在浏览器访问 http://localhost:8000
```

## 目录结构

```
mini-games/
├── index.html         # 游戏大厅入口
├── 2048/              # 2048
├── gomoku/            # 五子棋
├── mbti-test/         # MBTI 测试
├── memory-game/       # 记忆翻牌
├── one-stroke/        # 一笔画
├── puzzle/            # 拼图
├── snake-game/        # 贪吃蛇
├── sudoku/            # 数独
├── tetris/            # 俄罗斯方块
├── tic-tac-toe/       # 井字棋
├── tower-defense/     # 塔防
└── whack-a-mole/      # 打地鼠
```

## 开发说明

每个小游戏都是独立的静态页面，进入对应目录即可单独运行。若要新增游戏，建议：

- 新建一个游戏目录（如 `new-game/`）
- 在该目录下放置 `index.html` 与相关资源
- 在根目录 `index.html` 的游戏列表中增加入口

玩得开心！

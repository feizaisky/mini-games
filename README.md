# 小游戏中心

一个集合了多款经典与休闲小游戏的网页合集，打开即玩，适合本地试玩或静态部署。

## 游戏列表

- [贪吃蛇](./snake-game/)：经典贪吃蛇游戏（道具系统、暂停、死亡动画）
- [2048](./2048/)：数字合并挑战（撤销、合并动画、新纪录提示）
- [俄罗斯方块](./tetris/)：方块消除（Hold 暂存、消行特效、连击系统）
- [王国塔防](./tower-defense/)：策略塔防守卫（5 种防御塔、4 张地图、成就系统）
- [中国象棋](./chinese-chess/)：人机对战与双人对弈（走子动画、棋谱记录）
- [五子棋](./gomoku/)：益智棋类对战
- [记忆翻牌](./memory-game/)：配对记忆游戏（多难度）
- [MBTI测试](./mbti-test/)：人格性格测试（历史记录）
- [打地鼠](./whack-a-mole/)：反应速度挑战（金色/炸弹地鼠）
- [数独](./sudoku/)：逻辑填数（提示、笔记模式）
- [井字棋](./tic-tac-toe/)：经典策略
- [拼图游戏](./puzzle/)：图像拼图挑战
- [一笔画](./one-stroke/)：一笔连通所有点
- [熄灯](./lights-out/)：翻转灯光解谜

## 公共组件

所有游戏共享 `common/` 目录下的公共组件：

- **加载动画** (`loader.css` + `loader.js`)：统一的加载遮罩
- **音效系统** (`audio.js`)：基于 Web Audio API 的合成音效，支持静音开关
- **庆祝动画** (`celebration.css` + `celebration.js`)：胜利时的彩带/粒子效果
- **分享组件** (`share.js`)：生成成绩卡片图，支持保存图片和复制文本

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
├── index.html           # 游戏大厅入口（分类筛选、成绩面板）
├── common/              # 公共组件
│   ├── loader.css       # 加载动画样式
│   ├── loader.js        # 加载动画逻辑
│   ├── audio.js         # 音效系统
│   ├── celebration.css  # 庆祝动画样式
│   ├── celebration.js   # 庆祝动画逻辑
│   └── share.js         # 分享组件
├── 2048/                # 2048
├── chinese-chess/       # 中国象棋
├── gomoku/              # 五子棋
├── lights-out/          # 熄灯
├── mbti-test/           # MBTI 测试
├── memory-game/         # 记忆翻牌
├── one-stroke/          # 一笔画
├── puzzle/              # 拼图
├── snake-game/          # 贪吃蛇
├── sudoku/              # 数独
├── tetris/              # 俄罗斯方块
├── tic-tac-toe/         # 井字棋
├── tower-defense/       # 塔防（模块化结构，js/ 子目录）
└── whack-a-mole/        # 打地鼠
```

## 开发说明

每个小游戏都是独立的静态页面，进入对应目录即可单独运行。若要新增游戏，建议：

- 新建一个游戏目录（如 `new-game/`）
- 在该目录下放置 `index.html` 与相关资源
- 在根目录 `index.html` 的游戏列表中增加入口
- 接入公共组件（加载动画、音效、庆祝动画）

玩得开心！

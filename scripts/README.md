# 脚本工具集

## 📦 Git Push - 自动提交并推送

### 使用方法

在项目根目录运行：

```bash
./scripts/git-push.sh
```

### 功能

自动执行以下操作：

1. ✅ 检查是否有更改
2. ✅ 显示当前状态
3. ✅ 添加所有文件（git add -A）
4. ✅ 智能生成提交消息
5. ✅ 创建提交
6. ✅ 推送到远程

### 智能提交消息

脚本会根据修改的文件自动生成合适的提交消息：

| 修改内容 | 提交消息 |
|---------|---------|
| README / CLAUDE.md | `docs: 更新项目文档` |
| index.html | `style: 优化页面布局和样式` |
| 新游戏目录 | `feat: 新增 [游戏名] 游戏` |
| .js 文件 | `feat: 优化游戏逻辑` |
| .css 文件 | `style: 优化样式` |
| 其他 | `chore: 更新文件和优化` |

### 示例输出

```bash
$ ./scripts/git-push.sh

📦 Git Push

📋 当前更改：
 M game.js
 M index.html

➕ 添加所有更改...
📝 提交消息：style: 优化页面布局和样式
[main 8a3b2c1] style: 优化页面布局和样式
 2 files changed, 45 insertions(+), 12 deletions(-)

🚀 推送到远程仓库...

✓ 推送完成！
```

### 自定义提交消息

如果需要自定义提交消息，可以使用传统的 git 命令：

```bash
git add .
git commit -m "你的提交消息"
git push
```

---

## 🚀 Deploy - 一键部署到生产

### 使用方法

```bash
./scripts/deploy.sh
```

就这么简单！脚本会自动：
1. ✅ 检查依赖（rsync、ssh）
2. ✅ 部署前检查（未提交更改、关键文件）
3. ✅ 同步文件到生产服务器
4. ✅ 完成部署

### 默认配置

| 配置项 | 默认值 |
|--------|--------|
| 服务器 | `web-server` |
| 目录 | `/usr/share/nginx/html/` |

### 自定义配置（可选）

如果需要修改服务器，创建配置文件：

```bash
cp .deploy/config.sh.example .deploy/config.sh
vi .deploy/config.sh
```

配置内容：
```bash
DEPLOY_SERVER="user@your-server.com"
DEPLOY_DIR="/var/www/html/mini-games"
```

### 示例输出

```bash
$ ./scripts/deploy.sh

╔══════════════════════════════════════╗
║       🚀 Deploy Tool v1.0          ║
╚══════════════════════════════════════╝

[INFO] 检查依赖...
✓ 依赖检查完成
[INFO] 执行部署前检查...
✓ 部署前检查完成
[INFO] 🚀 开始部署...
[INFO] 部署到: web-server:/usr/share/nginx/html/
[INFO] 开始同步文件...
building file list ... done
...
✓ 部署完成！
✓ 服务器: web-server
✓ 目录:   /usr/share/nginx/html/

✓ 所有操作完成！
```

### 自动排除的文件

部署时不会上传以下文件：

- 🚫 `.git/`、`.claude/`、`.deploy/`、`scripts/`
- 🚫 `*.md`、`*.sh`、`*.log`
- 🚫 `node_modules/`、`output/`

### 在 Claude Code 中使用

直接说：
- **"部署到生产环境"**
- **"执行部署脚本"**
- **"运行 deploy.sh"**

详细文档：[`.deploy/README.md`](../.deploy/README.md)

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

## 🚀 Deploy - 多环境部署

### 使用方法

```bash
./scripts/deploy.sh [环境]
```

### 支持的环境

| 环境 | 说明 | 命令 |
|------|------|------|
| **local** | 启动本地服务器 | `./scripts/deploy.sh local` |
| **production** | 部署到生产服务器 | `./scripts/deploy.sh production` |
| **staging** | 部署到测试服务器 | `./scripts/deploy.sh staging` |
| **github-pages** | 部署到 GitHub Pages | `./scripts/deploy.sh github-pages` |
| **preview** | 预览配置（不执行） | `./scripts/deploy.sh preview` |

### 配置

1. 复制配置模板：
```bash
cp .deploy/config.sh.example .deploy/config.sh
```

2. 编辑配置文件设置服务器信息：
```bash
# 生产服务器
DEPLOY_SERVER="user@server.com"
DEPLOY_DIR="/var/www/html/mini-games"
```

### 示例输出

```bash
$ ./scripts/deploy.sh production

╔══════════════════════════════════════╗
║       🚀 Deploy Tool v1.0          ║
╚══════════════════════════════════════╝

[09:30:00] 检查依赖...
✓ 依赖检查完成
[09:30:01] 执行部署前检查...
✓ 部署前检查完成
[09:30:02] 🚀 开始生产环境部署...
[09:30:02] 部署到 user@server.com:/var/www/html/mini-games
building file list ... done
...
[09:30:15] ✓ 部署到 user@server.com 完成
✓ 生产环境部署完成！
✓ 日志文件: deploy-20240205_093015.log
```

### 在 Claude Code 中使用

直接说：
- **"部署到生产环境"**
- **"本地部署"**
- **"查看部署配置"**

### 功能特性

- ✅ 部署前检查（未提交更改、关键文件验证）
- ✅ 安全传输（rsync + SSH）
- ✅ 自动排除敏感文件
- ✅ 详细的日志记录
- ✅ 多环境支持

详细文档：[`.deploy/README.md`](../.deploy/README.md)

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

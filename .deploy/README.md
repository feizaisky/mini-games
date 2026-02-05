# 部署配置目录

此目录包含部署相关的配置文件。

## 文件说明

### config.sh
实际使用的部署配置文件（包含敏感信息，不提交到 Git）。

### config.sh.example
配置文件模板（提交到 Git，供其他人参考）。

## 快速开始

1. **创建配置文件**
   ```bash
   cp config.sh.example config.sh
   ```

2. **编辑配置**
   ```bash
   vi config.sh
   ```

3. **设置服务器信息**
   ```bash
   # 生产环境
   DEPLOY_SERVER="user@your-server.com"
   DEPLOY_DIR="/var/www/html/mini-games"

   # 测试环境
   DEPLOY_STAGING_SERVER="user@staging.com"
   DEPLOY_STAGING_DIR="/var/www/html/mini-games-staging"
   ```

4. **配置 SSH 密钥**
   ```bash
   # 复制公钥到服务器
   ssh-copy-id user@your-server.com

   # 测试连接
   ssh user@your-server.com
   ```

5. **执行部署**
   ```bash
   # 从项目根目录
   ./scripts/deploy.sh production
   ```

## 默认排除规则

部署时自动排除以下文件和目录：

| 排除项 | 说明 |
|--------|------|
| `.git/` | Git 仓库数据 |
| `.DS_Store` | macOS 系统文件 |
| `node_modules/` | Node.js 依赖 |
| `.claude/` | Claude AI 配置 |
| `.deploy/` | 部署配置目录 |
| `scripts/` | 开发工具脚本 |
| `*.md` | 所有 Markdown 文档 |
| `*.sh` | 所有 Shell 脚本 |
| `*.log` | 日志文件 |
| `output/` | 输出目录 |

### 部署内容

只部署以下类型的内容：
- ✅ 游戏文件（HTML、CSS、JS）
- ✅ 静态资源（图片、图标）
- ✅ 配置文件（除敏感配置外）

### 部署排除内容

以下内容**不会**被部署：
- ❌ 开发文档（README.md 等）
- ❌ 工具脚本（*.sh）
- ❌ 配置目录（.claude/、.deploy/、scripts/）
- ❌ 日志和临时文件

## 配置选项详解

### 服务器配置

```bash
# 生产服务器
DEPLOY_SERVER="user@hostname.com"     # SSH 连接地址
DEPLOY_DIR="/var/www/html/mini-games" # 目标部署目录

# 测试服务器（可选）
DEPLOY_STAGING_SERVER="user@staging.com"
DEPLOY_STAGING_DIR="/var/www/html/mini-games-staging"
```

### GitHub Pages 配置

```bash
# GitHub Pages 部署分支
DEPLOY_BRANCH="main"  # 或 "gh-pages"
```

### 本地开发配置

```bash
# 本地服务器端口
DEPLOY_PORT="8000"
```

### 部署选项

```bash
# 部署前是否自动提交未保存的更改
AUTO_COMMIT=false

# 部署前是否运行测试
RUN_TESTS=false

# 是否在部署前创建备份
CREATE_BACKUP=true
```

## 安全提示

⚠️ **重要**：`config.sh` 包含敏感信息（服务器地址、SSH 用户等），已在 `.gitignore` 中排除，不会被提交到 Git。

### 保护配置文件

```bash
# 设置只有你可以读写
chmod 600 config.sh
```

## 多环境部署策略

### 开发流程

```
本地开发 → 测试环境 → 生产环境
   ↓           ↓           ↓
  local     staging    production
```

### 推荐工作流

1. **本地测试**
   ```bash
   ./scripts/deploy.sh local
   ```

2. **部署到测试环境**
   ```bash
   ./scripts/deploy.sh staging
   ```

3. **验证测试环境**

4. **部署到生产环境**
   ```bash
   ./scripts/deploy.sh production
   ```

## 常见问题

### Q: 如何检查配置是否正确？

A: 使用 preview 模式：
```bash
./scripts/deploy.sh preview
```

### Q: 如何测试 SSH 连接？

A:
```bash
ssh $DEPLOY_SERVER
```

### Q: 如何查看部署日志？

A: 所有日志保存在项目根目录：
```bash
ls -la deploy-*.log
cat deploy-最新日志.log
```

### Q: 如何回滚部署？

A: 方法 1 - 使用 Git 回滚：
```bash
ssh $DEPLOY_SERVER "cd $DEPLOY_DIR && git pull --revert"
```

方法 2 - 恢复备份（如果启用）：
```bash
ssh $DEPLOY_SERVER "cp -r /backup/mini-games.备份日期 $DEPLOY_DIR"
```

## 高级配置

### 自定义排除文件

创建 `.deploy/rsync-exclude.txt`：
```
# 注释行以 # 开头
.git/
.DS_Store
node_modules/
.env.local
*.log
.vscode/
.idea/
```

### 部署后脚本

创建 `.deploy/post-deploy.sh`：
```bash
#!/bin/bash
# 部署后执行的命令

# 重启 Nginx
sudo systemctl reload nginx

# 清理缓存
rm -rf /var/www/html/mini-games/cache/*

# 设置权限
sudo chown -R www-data:www-data /var/www/html/mini-games
```

## 相关文档

- [部署脚本使用指南](../scripts/README.md#-deploy---多环境部署)
- [Claude Skill 文档](../.claude/skills/deploy.md)

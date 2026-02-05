#!/bin/bash
# Git Push Script - 自动提交并推送更改

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Git Push${NC}"
echo ""

# 检查是否有更改
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ 没有需要提交的更改${NC}"
    exit 0
fi

# 显示更改状态
echo -e "${BLUE}📋 当前更改：${NC}"
git status --short
echo ""

# 添加所有更改
echo -e "${BLUE}➕ 添加所有更改...${NC}"
git add -A

# 生成提交消息
COMMIT_MSG=""

# 检测修改类型
if git diff --cached --name-only | grep -q "README"; then
    COMMIT_MSG="docs: 更新项目文档"
elif git diff --cached --name-only | grep -q "CLAUDE.md"; then
    COMMIT_MSG="docs: 更新项目文档"
elif git diff --cached --name-only | grep -q "index.html"; then
    COMMIT_MSG="style: 优化页面布局和样式"
elif git diff --cached --diff-filter=A --name-only | grep -E "^[^/]+/" | head -1 > /dev/null; then
    # 检测是否有新游戏目录
    NEW_DIRS=$(git diff --cached --diff-filter=A --name-only | grep -E "^[^/]+/" | cut -d'/' -f1 | sort -u)
    if [ -n "$NEW_DIRS" ]; then
        FIRST_DIR=$(echo "$NEW_DIRS" | head -1)
        if [ -d "$FIRST_DIR" ] && [ -f "$FIRST_DIR/index.html" ]; then
            GAME_NAME=$(basename "$FIRST_DIR" | sed 's/-/ /g')
            COMMIT_MSG="feat: 新增 ${GAME_NAME} 游戏"
        fi
    fi
fi

# 如果没有生成消息，使用默认消息
if [ -z "$COMMIT_MSG" ]; then
    # 检查修改的文件类型
    if git diff --cached --name-only | grep -q "\.js$"; then
        COMMIT_MSG="feat: 优化游戏逻辑"
    elif git diff --cached --name-only | grep -q "\.css$"; then
        COMMIT_MSG="style: 优化样式"
    else
        COMMIT_MSG="chore: 更新文件和优化"
    fi
fi

# 创建提交
echo -e "${BLUE}📝 提交消息：${NC}${YELLOW}$COMMIT_MSG${NC}"
git commit -m "$COMMIT_MSG" -m "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 推送到远程
echo -e "${BLUE}🚀 推送到远程仓库...${NC}"
git push

echo ""
echo -e "${GREEN}✓ 推送完成！${NC}"

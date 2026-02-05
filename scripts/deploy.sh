#!/bin/bash
# Deploy Script - 部署到生产服务器
# 使用方法: ./scripts/deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置（与旧 deploy.sh 保持一致）
LOCAL_DIR="./"
REMOTE_DIR="/usr/share/nginx/html/"
REMOTE_SERVER="web-server"

# 日志函数
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查依赖
check_dependencies() {
    log "检查依赖..."

    command -v rsync >/dev/null 2>&1 || error "缺少 rsync，请先安装"
    command -v ssh >/dev/null 2>&1 || error "缺少 ssh，请先安装"

    success "依赖检查完成"
}

# 加载配置文件（如果存在）
if [ -f ".deploy/config.sh" ]; then
    source .deploy/config.sh
    log "已加载配置文件: .deploy/config.sh"
    REMOTE_SERVER=${DEPLOY_SERVER:-"web-server"}
    REMOTE_DIR=${DEPLOY_DIR:-"/usr/share/nginx/html/"}
fi

# 显示帮助
show_help() {
    cat << EOF
${BLUE}🚀 Deploy Tool${NC}

一键部署到生产服务器

使用方法:
  ./scripts/deploy.sh

默认配置:
  服务器: $REMOTE_SERVER
  目录:   $REMOTE_DIR

配置文件: .deploy/config.sh (可选)

示例:
  ./scripts/deploy.sh    # 使用默认配置部署

EOF
}

# 部署前检查
pre_deploy_checks() {
    log "执行部署前检查..."

    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        warning "检测到未提交的更改:"
        git status --short
        echo ""
        read -p "是否继续部署? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "部署已取消"
        fi
    fi

    # 检查关键文件
    if [ ! -f "index.html" ]; then
        error "缺少 index.html 文件"
    fi

    success "部署前检查完成"
}

# 执行部署
deploy() {
    log "🚀 开始部署..."
    log "部署到: ${REMOTE_SERVER}:${REMOTE_DIR}"

    # rsync 配置
    local RSYNC_OPTS=(
        -avz                          # 归档模式，显示进度
        --delete                      # 删除目标中多余的文件
        --exclude ".git/"             # 排除 .git
        --exclude ".DS_Store"         # 排除 .DS_Store
        --exclude "node_modules/"     # 排除 node_modules
        --exclude ".claude/"          # 排除 .claude
        --exclude ".deploy/"          # 排除 .deploy 配置目录
        --exclude "scripts/"          # 排除 scripts 脚本目录
        --exclude "*.md"              # 排除所有 Markdown 文档
        --exclude "*.sh"              # 排除所有 Shell 脚本
        --exclude "*.log"             # 排除日志文件
        --exclude "output/"           # 排除输出目录
        --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r  # 设置权限
    )

    log "开始同步文件..."
    rsync "${RSYNC_OPTS[@]}" "${LOCAL_DIR}" "${REMOTE_SERVER}:${REMOTE_DIR}"

    success "部署完成！"
    success "服务器: ${REMOTE_SERVER}"
    success "目录:   ${REMOTE_DIR}"
}

# 主函数
main() {
    # 处理命令行参数
    if [ "$1" = "help" ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi

    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       🚀 Deploy Tool v1.0          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""

    # 检查依赖
    check_dependencies

    # 部署前检查
    pre_deploy_checks

    # 执行部署
    deploy

    echo ""
    success "所有操作完成！"
}

# 捕获错误
trap 'error "部署失败"' ERR

# 执行主函数
main "$@"

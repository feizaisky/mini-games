#!/bin/bash
# Deploy Script - 多环境部署工具
# 使用方法: ./scripts/deploy.sh [环境]
# 环境选项: local, production, staging, github-pages

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
ENVIRONMENT=${1:-local}
PROJECT_NAME="mini-games"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deploy-${TIMESTAMP}.log"

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

# 显示帮助
show_help() {
    cat << EOF
${BLUE}🚀 Deploy Tool${NC}

使用方法:
  ./scripts/deploy.sh [环境]

环境选项:
  ${GREEN}local${NC}         - 本地部署 (启动本地服务器)
  ${GREEN}production${NC}   - 生产环境 (部署到服务器)
  ${GREEN}staging${NC}      - 测试环境 (部署到测试服务器)
  ${GREEN}github-pages${NC} - GitHub Pages 部署
  ${GREEN}preview${NC}      - 预览模式 (显示部署配置但不执行)

示例:
  ./scripts/deploy.sh local
  ./scripts/deploy.sh production
  ./scripts/deploy.sh github-pages

配置文件: .deploy/config.sh
EOF
}

# 检查依赖
check_dependencies() {
    log "检查依赖..."

    local missing_deps=()

    # 基本依赖
    command -v git >/dev/null 2>&1 || missing_deps+=("git")

    # 根据环境检查特定依赖
    case $ENVIRONMENT in
        production|staging)
            command -v rsync >/dev/null 2>&1 || missing_deps+=("rsync")
            command -v ssh >/dev/null 2>&1 || missing_deps+=("ssh")
            ;;
        github-pages)
            command -v ghp-import >/dev/null 2>&1 || {
                warning "ghp-import 未安装，尝试安装..."
                pip install ghp-import || missing_deps+=("ghp-import")
            }
            ;;
    esac

    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "缺少依赖: ${missing_deps[*]}"
    fi

    success "依赖检查完成"
}

# 部署前检查
pre_deploy_checks() {
    log "执行部署前检查..."

    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        warning "检测到未提交的更改:"
        git status --short
        read -p "是否继续部署? (y/N) " -n 1 -r
        echo
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

# 本地部署
deploy_local() {
    log "启动本地服务器..."

    local PORT=${DEPLOY_PORT:-8000}
    local DIR=${DEPLOY_DIR:-.}

    success "本地服务器启动中..."
    success "访问地址: http://localhost:${PORT}"

    cd "$DIR"
    python3 -m http.server "$PORT"
}

# SSH 部署
deploy_ssh() {
    local SERVER=$1
    local DIR=$2

    log "部署到 $SERVER:$DIR"

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
        --exclude "deploy-*.log"      # 排除部署日志
        --exclude "output/"           # 排除输出目录
        --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r  # 设置权限
    )

    log "开始同步文件..."
    rsync "${RSYNC_OPTS[@]}" ./ "${SERVER}:${DIR}"

    success "部署到 $SERVER 完成"
}

# 生产环境部署
deploy_production() {
    log "🚀 开始生产环境部署..."

    local SERVER=${DEPLOY_SERVER:-"web-server"}
    local DIR=${DEPLOY_DIR:-"/usr/share/nginx/html/${PROJECT_NAME}"}

    pre_deploy_checks
    deploy_ssh "$SERVER" "$DIR"

    success "生产环境部署完成！"
}

# 测试环境部署
deploy_staging() {
    log "🧪 开始测试环境部署..."

    local SERVER=${DEPLOY_STAGING_SERVER:-"staging-server"}
    local DIR=${DEPLOY_STAGING_DIR:-"/usr/share/nginx/html/${PROJECT_NAME}-staging"}

    deploy_ssh "$SERVER" "$DIR"

    success "测试环境部署完成！"
}

# GitHub Pages 部署
deploy_github_pages() {
    log "📄 开始 GitHub Pages 部署..."

    local BRANCH=${DEPLOY_BRANCH:-"gh-pages"}

    # 检查是否在正确的分支
    if [ "$BRANCH" != "$(git rev-parse --abbrev-ref HEAD)" ]; then
        warning "不在 $BRANCH 分支，当前分支: $(git rev-parse --abbrev-ref HEAD)"
    fi

    log "部署到 GitHub Pages..."

    # 使用 ghp-import 部署
    if command -v ghp-import >/dev/null 2>&1; then
        ghp-import -n -p -f ./
        success "GitHub Pages 部署完成！"
        success "访问地址: https://$(git remote get-url origin | sed 's/.*:\(.*\)\.git/\1/')"
    else
        error "ghp-import 未安装，请运行: pip install ghp-import"
    fi
}

# 预览配置
deploy_preview() {
    log "📋 部署配置预览"
    echo ""
    echo "${BLUE}当前配置:${NC}"
    echo "  环境: $ENVIRONMENT"
    echo "  项目: $PROJECT_NAME"
    echo "  时间: $TIMESTAMP"
    echo ""
    echo "${BLUE}生产环境:${NC}"
    echo "  服务器: ${DEPLOY_SERVER:-web-server}"
    echo "  目录: ${DEPLOY_DIR:-/usr/share/nginx/html/mini-games}"
    echo ""
    echo "${BLUE}测试环境:${NC}"
    echo "  服务器: ${DEPLOY_STAGING_SERVER:-staging-server}"
    echo "  目录: ${DEPLOY_STAGING_DIR:-/usr/share/nginx/html/mini-games-staging}"
    echo ""
    echo "${BLUE}本地服务器:${NC}"
    echo "  端口: ${DEPLOY_PORT:-8000}"
    echo ""
    success "预览完成"
}

# 清理日志
cleanup_logs() {
    log "清理旧日志..."
    find . -name "deploy-*.log" -type f -mtime +7 -delete 2>/dev/null || true
    success "日志清理完成"
}

# 主函数
main() {
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       🚀 Deploy Tool v1.0          ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""

    # 加载配置文件（如果存在）
    if [ -f ".deploy/config.sh" ]; then
        source .deploy/config.sh
        log "已加载配置文件: .deploy/config.sh"
    fi

    # 检查依赖
    check_dependencies

    # 清理旧日志
    cleanup_logs

    # 根据环境执行部署
    case $ENVIRONMENT in
        local)
            deploy_local
            ;;
        production)
            deploy_production
            ;;
        staging)
            deploy_staging
            ;;
        github-pages)
            deploy_github_pages
            ;;
        preview)
            deploy_preview
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "未知环境: $ENVIRONMENT"
            echo ""
            show_help
            exit 1
            ;;
    esac

    echo ""
    success "所有操作完成！"
    success "日志文件: $LOG_FILE"
}

# 捕获错误
trap 'error "部署失败，请检查日志: $LOG_FILE"' ERR

# 执行主函数
main "$@"

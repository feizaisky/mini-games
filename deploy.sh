#!/usr/bin/env bash
set -euo pipefail

# 你的项目目录：同步整个仓库（排除 .git 等）
LOCAL_DIR="./"

# 服务器目标目录：按需改
REMOTE_DIR="/usr/share/nginx/html/"

# 如果需要先构建（例如 Vite / Webpack），取消注释
# npm ci
# npm run build

echo "Deploying ${LOCAL_DIR} -> web-server:${REMOTE_DIR}"

rsync -avz --delete \
  --exclude ".git/" \
  --exclude ".DS_Store" \
  --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
  "${LOCAL_DIR}" \
  "web-server:${REMOTE_DIR}"

echo "Done."

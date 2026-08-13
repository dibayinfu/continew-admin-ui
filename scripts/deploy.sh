#!/usr/bin/env bash
# ============================================================
# continew-admin-ui 部署到 ECS 静态站点（不在服务器编译）
# 用法：
#   ./deploy.sh                 # 拉取 deploy 发布分支 -> 原子切换 current
#   ./deploy.sh <发布分支>      # 部署指定发布分支
# ============================================================
set -euo pipefail

GIT_REPO="git@github.com:dibayinfu/continew-admin-ui.git"
# repo 保留源码和运维脚本；artifact-repo 仅保存本地构建好的静态文件。
ARTIFACT_REPO_DIR="/data/longan/frontend/artifact-repo"
RELEASES_DIR="/data/longan/frontend/releases"
CURRENT_LINK="/data/longan/frontend/current"
RELEASE_BRANCH="${1:-deploy}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "未找到 git"

mkdir -p "$(dirname "$ARTIFACT_REPO_DIR")" "$RELEASES_DIR"
if [ ! -d "${ARTIFACT_REPO_DIR}/.git" ]; then
  log "克隆静态发布分支: $RELEASE_BRANCH"
  git clone --depth 1 --branch "$RELEASE_BRANCH" "$GIT_REPO" "$ARTIFACT_REPO_DIR"
else
  log "拉取静态发布分支: $RELEASE_BRANCH"
  git -C "$ARTIFACT_REPO_DIR" fetch --depth 1 origin "$RELEASE_BRANCH"
  git -C "$ARTIFACT_REPO_DIR" checkout --force -B "$RELEASE_BRANCH" "origin/$RELEASE_BRANCH"
fi

[ -f "${ARTIFACT_REPO_DIR}/index.html" ] || die "发布分支中未找到 index.html；请先在本地执行 ./scripts/publish-server.sh"

STAMP=$(date '+%Y%m%d-%H%M%S')
RELEASE_DIR="${RELEASES_DIR}/${STAMP}"
mkdir -p "$RELEASE_DIR"
tar -C "$ARTIFACT_REPO_DIR" --exclude=.git -cf - . | tar -C "$RELEASE_DIR" -xf -
printf 'server_deployed_at=%s\n' "$(date --iso-8601=seconds)" >> "${RELEASE_DIR}/.release-info"
log "已归档: $RELEASE_DIR"

# Nginx root 指向 current；先创建临时链接后再 rename，访问方不会读到半成品目录。
TEMP_LINK="${CURRENT_LINK}.next"
rm -f "$TEMP_LINK"
ln -s "$RELEASE_DIR" "$TEMP_LINK"
mv -Tf "$TEMP_LINK" "$CURRENT_LINK"
log "已切换线上版本: $CURRENT_LINK -> $RELEASE_DIR"

if command -v nginx >/dev/null 2>&1; then
  nginx -t
  systemctl reload nginx
fi
log "部署完成 ✔"

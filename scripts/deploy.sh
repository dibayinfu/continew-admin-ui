#!/usr/bin/env bash
# ============================================================
# continew-admin-ui 部署到 ECS 静态站点
# 用法：
#   ./deploy.sh                 # 拉取 main -> 构建 -> 原子切换 current
#   ./deploy.sh <分支>          # 部署指定分支
# ============================================================
set -euo pipefail

GIT_REPO="git@github.com:dibayinfu/continew-admin-ui.git"
CODE_DIR="/data/longan/frontend/repo"
RELEASES_DIR="/data/longan/frontend/releases"
CURRENT_LINK="/data/longan/frontend/current"
API_BASE_URL="${API_BASE_URL:-https://longan-api.mozi365.com}"
VITE_BASE_PATH="${VITE_BASE_PATH:-/}"
BRANCH="${1:-main}"
# 构建已大幅瘦身：原型模式下不再打包全量后台视图（import.meta.glob 已按模式收敛），
# 单次 vite build 约 20s。Node 堆上限按物理内存自动估算（物理内存 60%，1~3GB），
# 避免在内存较小的 ECS 上因堆过大导致 OOM / 构建卡死；也可用 NODE_HEAP_MB 显式覆盖。
total_mem_kb=$(awk '/MemTotal/{print $2}' /proc/meminfo 2>/dev/null || echo 0)
if [ "$total_mem_kb" -gt 0 ]; then
  suggested=$(( total_mem_kb / 1024 * 60 / 100 ))
  [ "$suggested" -lt 1024 ] && suggested=1024
  [ "$suggested" -gt 3072 ] && suggested=3072
  if [ -n "${NODE_HEAP_MB:-}" ] && [ "$NODE_HEAP_MB" -gt $(( total_mem_kb / 1024 / 2 )) ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 警告：检测到 NODE_HEAP_MB=${NODE_HEAP_MB} 超过物理内存一半，自动调整为 ${suggested}MB 以避免 OOM/卡死"
    NODE_HEAP_MB="$suggested"
  else
    NODE_HEAP_MB="${NODE_HEAP_MB:-$suggested}"
  fi
else
  NODE_HEAP_MB="${NODE_HEAP_MB:-2048}"
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "未找到 git"
command -v pnpm >/dev/null 2>&1 || die "未找到 pnpm"

mkdir -p "$(dirname "$CODE_DIR")" "$RELEASES_DIR"
if [ ! -d "${CODE_DIR}/.git" ]; then
  log "克隆仓库: $GIT_REPO"
  git clone --branch "$BRANCH" "$GIT_REPO" "$CODE_DIR"
else
  log "拉取代码: $GIT_REPO 分支 $BRANCH"
  git -C "$CODE_DIR" fetch --all --prune
  git -C "$CODE_DIR" checkout "$BRANCH"
  git -C "$CODE_DIR" pull --ff-only origin "$BRANCH"
fi

log "安装依赖"
(cd "$CODE_DIR" && pnpm install --frozen-lockfile)

log "构建静态站点（API：$API_BASE_URL，Node 堆：${NODE_HEAP_MB}MB）"
(cd "$CODE_DIR" && NODE_OPTIONS="--max-old-space-size=${NODE_HEAP_MB} ${NODE_OPTIONS:-}" VITE_BASE="$VITE_BASE_PATH" VITE_COLLECTOR_API_BASE_URL="$API_BASE_URL" pnpm build:prototype)
[ -f "${CODE_DIR}/dist/index.html" ] || die "构建失败：未生成 dist/index.html"

STAMP=$(date '+%Y%m%d-%H%M%S')
RELEASE_DIR="${RELEASES_DIR}/${STAMP}"
mkdir -p "$RELEASE_DIR"
cp -a "${CODE_DIR}/dist/." "$RELEASE_DIR/"
printf '%s\n' "branch=${BRANCH}" "commit=$(git -C "$CODE_DIR" rev-parse --short HEAD)" "api=${API_BASE_URL}" "deployed_at=$(date --iso-8601=seconds)" > "${RELEASE_DIR}/.release-info"
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

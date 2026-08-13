#!/usr/bin/env bash
# ============================================================
# 本地构建并发布前端静态文件到 GitHub 的 deploy 分支。
# 服务器随后只需执行 ./scripts/deploy.sh，不再安装或运行 pnpm。
# 用法：
#   ./scripts/publish-server.sh
#   RELEASE_BRANCH=deploy ./scripts/publish-server.sh
# ============================================================
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
RELEASE_BRANCH="${RELEASE_BRANCH:-deploy}"
API_BASE_URL="${API_BASE_URL:-https://longan-api.mozi365.com}"
VITE_BASE_PATH="${VITE_BASE_PATH:-/}"
TEMP_DIR=""

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }
cleanup() { [ -z "$TEMP_DIR" ] || rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

command -v git >/dev/null 2>&1 || die "未找到 git"
command -v pnpm >/dev/null 2>&1 || die "未找到 pnpm"

cd "$ROOT_DIR"
REMOTE_URL=$(git remote get-url origin 2>/dev/null) || die "未配置 Git 远端 origin"
if [ -n "$(git status --porcelain)" ]; then
  die "源码工作区存在未提交修改；请先提交或暂存后再发布"
fi

log "安装依赖"
pnpm install --frozen-lockfile
log "本地构建静态站点（API：$API_BASE_URL）"
VITE_BASE="$VITE_BASE_PATH" VITE_COLLECTOR_API_BASE_URL="$API_BASE_URL" pnpm build:prototype
[ -f "${ROOT_DIR}/dist/index.html" ] || die "构建失败：未生成 dist/index.html"

# deploy 分支是构建产物专用分支，允许使用强制推送使其始终只包含当前版本。
TEMP_DIR=$(mktemp -d)
cp -a "${ROOT_DIR}/dist/." "$TEMP_DIR/"
printf '%s\n' \
  "source_branch=$(git branch --show-current)" \
  "source_commit=$(git rev-parse HEAD)" \
  "api=${API_BASE_URL}" \
  "built_at=$(date --iso-8601=seconds)" > "$TEMP_DIR/.release-info"

git -C "$TEMP_DIR" init -q
git -C "$TEMP_DIR" checkout -q -b "$RELEASE_BRANCH"
git -C "$TEMP_DIR" add --all
git -C "$TEMP_DIR" -c user.name="Longan Deploy" -c user.email="deploy@mozi365.com" commit -q -m "deploy: $(git -C "$ROOT_DIR" rev-parse --short HEAD)"
git -C "$TEMP_DIR" remote add origin "$REMOTE_URL"
log "推送静态发布分支: $RELEASE_BRANCH"
git -C "$TEMP_DIR" push --force origin "$RELEASE_BRANCH"
log "发布产物已推送 ✔；服务器执行 ./scripts/deploy.sh 即可上线"

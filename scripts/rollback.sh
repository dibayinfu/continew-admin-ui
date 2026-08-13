#!/usr/bin/env bash
# ============================================================
# continew-admin-ui 回滚脚本
# 用法：
#   ./rollback.sh --list          # 列出历史发布包
#   ./rollback.sh                 # 回滚到当前版本之前的最近版本
#   ./rollback.sh <时间戳>        # 回滚到指定发布包，例如 20260813-123000
# ============================================================
set -euo pipefail

RELEASES_DIR="/data/longan/frontend/releases"
CURRENT_LINK="/data/longan/frontend/current"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }
list_releases() { find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r; }

if [ "${1:-}" = "--list" ]; then
  echo "可回退发布包（${RELEASES_DIR}）："
  list_releases
  exit 0
fi

[ -d "$RELEASES_DIR" ] || die "发布目录不存在：$RELEASES_DIR"
CURRENT_TARGET=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)
if [ -n "${1:-}" ]; then
  TARGET="${RELEASES_DIR}/${1}"
else
  TARGET=""
  while IFS= read -r release; do
    candidate="${RELEASES_DIR}/${release}"
    if [ "$(readlink -f "$candidate")" != "$CURRENT_TARGET" ]; then
      TARGET="$candidate"
      break
    fi
  done < <(list_releases)
fi

[ -n "$TARGET" ] && [ -d "$TARGET" ] && [ -f "$TARGET/index.html" ] || die "未找到可用发布包"
TEMP_LINK="${CURRENT_LINK}.next"
rm -f "$TEMP_LINK"
ln -s "$TARGET" "$TEMP_LINK"
mv -Tf "$TEMP_LINK" "$CURRENT_LINK"
log "已回退：$CURRENT_LINK -> $TARGET"

if command -v nginx >/dev/null 2>&1; then
  nginx -t
  systemctl reload nginx
fi
log "回滚完成 ✔"

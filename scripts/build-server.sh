#!/usr/bin/env bash
# 仅在本地构建服务器版静态文件及手动上传用的压缩包。
set -euo pipefail
cd "$(dirname "$0")/.."

echo '[1/2] 本地构建服务器版前端'
# 与 Pages 使用相同页面逻辑；根路径部署，接口走同源 /api/。
VITE_BASE=/ VITE_COLLECTOR_API_BASE_URL='' pnpm build:prototype
test -s dist/index.html

echo '[2/2] 生成手动上传用的压缩包'
mkdir -p outputs/server
ARCHIVE="$(mktemp "$PWD/outputs/server/.longan-ui.XXXXXX")"
trap 'rm -f "$ARCHIVE"' EXIT
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$ARCHIVE" -C dist .
mv -f "$ARCHIVE" outputs/server/longan-ui.tar.gz
cp scripts/deploy.sh outputs/server/deploy.sh
cp scripts/rollback.sh outputs/server/rollback.sh
echo "打包完成：$PWD/outputs/server/longan-ui.tar.gz"
echo "部署脚本：$PWD/outputs/server/deploy.sh"
echo "回滚脚本：$PWD/outputs/server/rollback.sh"
echo "静态文件：$PWD/dist"
echo '请手动上传压缩包、deploy.sh 和 rollback.sh 到 /data/longan/frontend/，在服务器执行 sh deploy.sh。'

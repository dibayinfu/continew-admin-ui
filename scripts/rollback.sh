#!/bin/sh
# 回滚最近一次成功发布：sh /data/longan/frontend/rollback.sh
set -eu

deploy_dir=/data/longan/frontend
current="$deploy_dir/current"
next="$deploy_dir/.rollback-$$"
target=$(readlink "$deploy_dir/previous" || true)
active=$(readlink "$current" || true)

if [ -z "$target" ] || [ ! -s "$target/index.html" ]; then
    echo '错误：没有可用的上一版本，请先使用新版 deploy.sh 完成一次发布。' >&2
    exit 1
fi
if [ -z "$active" ]; then
    echo '错误：current 不是版本链接，未执行回滚。' >&2
    exit 1
fi
if [ "$target" = "$active" ]; then
    echo "当前已经是回滚版本：$target"
    exit 0
fi

nginx -t
trap 'rm -f "$next"' EXIT
ln -s "$target" "$next"
mv -Tf "$next" "$current"
if ! systemctl reload nginx; then
    ln -s "$active" "$next"
    mv -Tf "$next" "$current"
    echo '错误：Nginx 重载失败，已撤销回滚。' >&2
    exit 1
fi
echo "回滚成功：$target"
echo '访问地址：https://longan.mozi365.com/'

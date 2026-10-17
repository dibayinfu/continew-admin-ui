#!/bin/sh
# 在服务器执行：sh /data/longan/frontend/deploy.sh
set -eu

deploy_dir=/data/longan/frontend
archive="$deploy_dir/longan-ui.tar.gz"
current="$deploy_dir/current"
next="$deploy_dir/.current-$$"
previous_next="$deploy_dir/.previous-$$"

if [ ! -s "$archive" ]; then
    echo "错误：请先上传压缩包到 $archive" >&2
    exit 1
fi
if [ -e "$current" ] && [ ! -L "$current" ]; then
    echo "错误：$current 已存在且不是符号链接，请先确认目录。" >&2
    exit 1
fi

echo '[1/4] 检查 Nginx 配置'
nginx -t

echo '[2/4] 解压新版本'
mkdir -p "$deploy_dir/releases"
release_dir=$(mktemp -d "$deploy_dir/releases/$(date +%Y%m%d-%H%M%S)-XXXXXX")
tar -xzf "$archive" -C "$release_dir"
if [ ! -s "$release_dir/index.html" ]; then
    echo '错误：压缩包根目录缺少 index.html，未切换线上版本。' >&2
    exit 1
fi
chmod -R a+rX "$release_dir"

echo '[3/4] 切换到新版本'
previous=$(readlink "$current" || true)
trap 'rm -f "$next" "$previous_next"' EXIT
ln -s "$release_dir" "$next"
mv -Tf "$next" "$current"

echo '[4/4] 平滑重载 Nginx'
if ! systemctl reload nginx; then
    if [ -n "$previous" ]; then
        ln -s "$previous" "$next"
        mv -Tf "$next" "$current"
        echo '错误：Nginx 重载失败，已恢复上一版前端。' >&2
    else
        rm -f "$current"
        echo '错误：Nginx 重载失败，已撤销本次版本切换。' >&2
    fi
    exit 1
fi

echo "发布成功：$release_dir"
echo '访问地址：https://longan.mozi365.com/'
if [ -n "$previous" ]; then
    ln -s "$previous" "$previous_next"
    mv -Tf "$previous_next" "$deploy_dir/previous"
    echo "上一版本：$previous"
fi

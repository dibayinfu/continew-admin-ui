# 前端部署

前端有两种独立发布方式，使用同一套构建产物和 API 地址：

| 目标 | 触发方式 | 访问地址 |
| --- | --- | --- |
| GitHub Pages | `git push origin HEAD:main` | GitHub Pages 地址 |
| ECS 静态站点 | 本地构建后，服务器执行 `./scripts/deploy.sh` | `https://longan.mozi365.com` |

GitHub Pages 工作流和 ECS 脚本都会注入 `https://longan-api.mozi365.com`，不会把 `localhost` 或服务器 IP 写进前端包。

## 首次安装到 ECS

```bash
sudo mkdir -p /data/longan/frontend/{releases,repo}
sudo cp /data/longan/frontend/repo/scripts/longan-frontend.nginx.conf /etc/nginx/conf.d/longan-frontend.conf
sudo nginx -t && sudo systemctl reload nginx
```

Cloudflare 新建一条橙云代理的 A 记录：`longan` 指向 `156.238.249.157`。当前 Origin Certificate 必须同时覆盖 `longan.mozi365.com` 与 `longan-api.mozi365.com`；否则重新创建包含两个主机名的 Origin Certificate，再替换服务器上的 pem/key。

## 日常发布与回退

本地电脑构建并推送专用 `deploy` 分支：

```bash
cd /你的本地目录/continew-admin-ui
./scripts/publish-server.sh
```

`deploy` 分支只存静态构建产物，允许脚本强制覆盖。它不影响 `main` 源码分支和 GitHub Pages。

服务器不需要 Node.js 和 pnpm，只拉取构建产物：

```bash
cd /data/longan/frontend/repo
./scripts/deploy.sh
./scripts/rollback.sh --list
./scripts/rollback.sh 20260813-123000
```

部署以 `current` 软链接原子切换，不会先删除线上文件。每次发布包都保留在 `/data/longan/frontend/releases`，便于回退。

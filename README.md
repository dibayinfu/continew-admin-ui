
# 1.克隆本项目
git clone git@github.com:dibayinfu/continew-admin-ui.git

# 2.在 IDE（Visual Studio Code/WebStorm）中打开前端项目 continew-admin-ui

# 3.安装 pnpm
npm install -g pnpm

# 4.安装依赖
pnpm i

# 5.启动程序
# 5.1 启动成功：访问 http://localhost:5173/
pnpm dev
```

## 双端发布

GitHub Pages 保留原有 `.github/workflows/deploy-pages.yml`，推送 main/master 后仍按原流程发布。

服务器版只在本地打包，文件由你手动上传，无需配置 GitHub Secrets 或输入服务器密码。

### VSCode 打包服务器版

1. 打开 `longan` 或 `continew-admin-ui` 文件夹。
2. 打开 **Run and Debug（运行和调试）**。
3. 选择 **打包服务器版前端（手动上传）**，点击运行或按 F5。

也可在前端目录执行：

```sh
bash scripts/build-server.sh
```

产物：

- `dist/`：静态文件。
- `outputs/server/longan-ui.tar.gz`：手动上传用的压缩包，解压后直接包含 `index.html`、`static/` 等文件，不包含外层 dist 目录。
- `outputs/server/deploy.sh`：服务器端部署脚本。
- `outputs/server/rollback.sh`：回滚最近一次成功发布。

本地需已安装 pnpm 和项目依赖。构建使用 prototype 模式，根路径为 `/`，接口使用同源 `/api/`。脚本仅构建、压缩文件，不连接或修改服务器。

### 手动部署服务器

将 `outputs/server/longan-ui.tar.gz`、`outputs/server/deploy.sh` 和 `outputs/server/rollback.sh` 上传到服务器 `/data/longan/frontend/`。脚本首次上传或脚本更新时覆盖，日常仅需更新压缩包。在服务器终端执行：

```sh
cd /data/longan/frontend
sh deploy.sh
```

访问 https://longan.mozi365.com/ 。现有 Nginx 静态目录为 `/data/longan/frontend/current`，`/api/` 已代理到 `127.0.0.1:8080`。配置源文件为 `scripts/longan-ui.nginx.conf`，日常发布无需修改配置。

脚本会检查 Nginx 配置、解压、切换版本并平滑重载 Nginx；重载失败时恢复原版本。使用 root 或具有相应目录和 Nginx 管理权限的用户执行。旧版本保留在 releases 中，新版 deploy.sh 成功发布后会记录 previous 链接，回滚执行：

```sh
cd /data/longan/frontend
sh rollback.sh
```

重复执行回滚不会继续倒退。未记录上一版本时脚本会提示并退出。首次迁移前的静态文件也保留在 `/data/longan/frontend/app`。

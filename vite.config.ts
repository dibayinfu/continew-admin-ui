import { URL, fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import createVitePlugins from './config/plugins'

// 只合并布局和地图共用的基础组件，避免根导出将所有业务组件拉进首屏，
// 同时避免每个按钮、菜单及其样式分别产生网络请求。
const arcoCoreComponents = [
  'button', 'space', 'grid', 'layout', 'card', 'input', 'checkbox', 'select',
  'dropdown', 'menu', 'tabs', 'tooltip', 'tag', 'popover', 'badge', 'scrollbar',
  'spin', 'empty', 'avatar', 'watermark', 'message', 'notification', 'modal', 'drawer',
]

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv

  return {
    // 开发或生产环境服务的公共基础路径
    base: env.VITE_BASE,
    // 路径别名
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 引入sass全局样式变量
    css: {
      preprocessorOptions: {
        less: {
          // 保留原有主题对尺寸、颜色等 Less token 的覆盖；reference 不重复输出 CSS。
          additionalData: (source: string, filename: string) => {
            const theme = fileURLToPath(new URL('./node_modules/@arco-themes/vue-gi-demo/', import.meta.url))
            const component = filename.replace(/\\/g, '/').match(/\/es\/(?:_components\/)?([^/]+)\/style\/index\.less$/)?.[1]
            const aliases = { drawer: 'modal', 'date-picker': 'picker', 'time-picker': 'picker', 'select-view': 'input' }
            const name = aliases[component || ''] || component
            const override = fileURLToPath(new URL(`./src/styles/arco-ui/a-${name}.less`, import.meta.url))
            // 懒加载组件的样式可能晚于全局 CSS 到达，末尾补上对应覆盖，避免覆盖顺序改变。
            return `${source}
@import (reference) "${theme}theme.less";
@import (reference) "${theme}variables.less";
${component && existsSync(override) ? `@import "${override}";` : ''}`
          },
        },
        scss: {
          additionalData: `@use "@/styles/var.scss" as *;`,
          api: 'modern-compiler',
        },
      },
    },
    // 添加需要vite优化的依赖
    optimizeDeps: {
      // 某次预构建中断后，浏览器可能继续请求已被清理的 chunk-*.js，表现为部分
      // 懒加载菜单 URL 已变化但页面仍停留在旧页。开发启动时强制重建可避免该状态。
      force: command === 'serve',
      include: ['vue-draggable-plus'],
    },
    server: {
      // 服务启动时是否自动打开浏览器
      open: env.VITE_OPEN_DEVTOOLS === 'true',
      // 本地跨域代理 -> 代理到服务器的接口地址
      proxy: env.VITE_API_BASE_URL
        ? {
            [env.VITE_API_PREFIX]: {
              target: env.VITE_API_BASE_URL, // 后台服务器地址
              changeOrigin: true, // 是否允许不同源
              secure: false, // 支持https
              rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API_PREFIX}`), ''),
            },
          }
        : undefined,
    },
    plugins: [
      ...createVitePlugins(env, command === 'build'),
    ],
    // 构建
    build: {
      chunkSizeWarningLimit: 2000, // 消除打包大小超过500kb警告
      outDir: 'dist', // 指定打包路径，默认为项目根目录下的dist目录
      // esbuild 比 Terser 快得多，适合在 ECS 上执行发布构建。
      // 保留原有的生产清理效果，避免为了压缩而让发布等待数分钟。
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
      },
      // 静态资源打包到dist下的不同目录
      rollupOptions: {
        output: {
          // 将变更频率低的依赖固定拆包。GitHub Pages 的文件名带 hash，后续业务发版时
          // 浏览器可继续复用这些依赖缓存，避免重复下载整个入口包。
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            'arco-core': arcoCoreComponents.flatMap((name) => [
              `@arco-design/web-vue/es/${name}/index.js`,
              `@arco-design/web-vue/es/${name}/style/index.js`,
            ]),
            echarts: ['echarts', 'vue-echarts'],
            utils: ['dayjs', 'lodash-es', '@vueuse/core'],
            'http-client': ['axios', 'query-string'],
          },
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    // 以 envPrefix 开头的环境变量会通过 import.meta.env 暴露在你的客户端源码中。
    envPrefix: ['VITE', 'FILE'],
  }
})

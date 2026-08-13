type ImportVueFileType = typeof import('*.vue')
type ImportVueFileFnType = () => Promise<ImportVueFileType>

/**
 * 原型模式（VITE_PROTOTYPE_MODE=true）下所有页面路由均静态声明在
 * `src/router/route.ts` 中，无需后端菜单动态加载视图，因此不打包
 * `@/views` 下全量视图，显著降低构建内存占用与产物体积，
 * 解决服务器部署时 OOM / 构建卡住的问题。
 */
const moduleFiles = import.meta.env.VITE_PROTOTYPE_MODE === 'true'
  ? {} as Record<string, ImportVueFileFnType>
  : import.meta.glob<ImportVueFileType>('@/views/**/*.vue')

export const asyncRouteModules = Object.entries(moduleFiles).reduce((routes, [url, importFn]) => {
  if (!/\/(views\/login|components)\//.test(url)) {
    const path = url.replace('/src/views/', '').replace('.vue', '')
    routes[path] = importFn
  }

  return routes
}, {} as Recordable<ImportVueFileFnType>)

import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { useRouteStore } from '@/stores'
import { constantRoutes, systemRoutes } from '@/router/route'
import { setupPageGuard, setupRouterGuard } from '@/router/guard'

// 原型模式使用 Hash 路由，兼容 Neocities 等纯静态托管平台
const isPrototype = import.meta.env.VITE_PROTOTYPE_MODE === 'true'
const router = createRouter({
  history: isPrototype
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [...constantRoutes, ...systemRoutes],
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

setupRouterGuard(router)
setupPageGuard(router)

/**
 * @description 重置路由
 * @description 注意：所有动态路由路由必须带有 name 属性，否则可能会不能完全重置干净
 */
export function resetRouter() {
  try {
    const routeStore = useRouteStore()
    routeStore.asyncRoutes.forEach((route) => {
      const { name } = route
      if (name) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch (error) {
    // 强制刷新浏览器也行，只是交互体验不是很好
    window.location.reload()
  }
}

export default router

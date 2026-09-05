/**
 * daas-api 全局登录 / 请求工具
 *
 * 地图通过 collectorMapRequest 使用后端 Redis Token；旧直连接口保留 localStorage 兼容。
 * 所有页面共用同一个全局登录弹窗，保存到 Redis 成功后再更新本地状态：
 * - 调用 daasRequest 时若未登录或 token 过期，会自动弹出全局登录框
 * - 登录成功后自动重试原请求，各页面无需自己处理登录/401
 */
import { reactive } from 'vue'

export const DAS_API_BASE = 'https://daas-api.seazonmotor.com'
export const DAS_TOKEN_KEY = 'sbg-monitor:token'
export const DAS_REFRESH_KEY = 'sbg-monitor:refresh-token'
export const DAS_CLIENT_ID = 'XyeIWUO2gq'
export const DAS_CLIENT_SECRET = 'Wy2h@bGi9S'
const COLLECTOR_API_BASE_URL = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')

function read(key: string) {
  try { return localStorage.getItem(key) || '' } catch { return '' }
}
function write(key: string, value: string) {
  try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key) } catch { /* 忽略 */ }
}

/** 全局 daas 登录状态（单例，页面与全局登录弹窗共享） */
export const daasAuth = reactive({
  token: read(DAS_TOKEN_KEY),
  refreshToken: read(DAS_REFRESH_KEY),
  visible: false, // 全局登录弹窗是否显示
  expired: false, // 最近一次请求发现 token 过期 / 未登录
})

export function setDaasToken(token: string, refreshToken?: string) {
  daasAuth.token = token
  write(DAS_TOKEN_KEY, token)
  if (refreshToken !== undefined) {
    daasAuth.refreshToken = refreshToken
    write(DAS_REFRESH_KEY, refreshToken)
  }
  daasAuth.expired = false
}

export function clearDaasToken() {
  daasAuth.token = ''
  daasAuth.refreshToken = ''
  write(DAS_TOKEN_KEY, '')
  write(DAS_REFRESH_KEY, '')
}

/** 隐藏配置：箱体/收集点哪些 id 不在地图上显示（localStorage 持久化，两个地图页共用） */
const HIDDEN_BOXES_KEY = 'sbg-monitor:hidden-boxes'
const HIDDEN_POINTS_KEY = 'sbg-monitor:hidden-points'

function readIdSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr.filter((n): n is number => typeof n === 'number') : [])
  } catch { return new Set() }
}
function writeIdSet(key: string, ids: Set<number> | number[]) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(ids))) } catch { /* 忽略 */ }
}
export function getHiddenBoxIds(): Set<number> { return readIdSet(HIDDEN_BOXES_KEY) }
export function getHiddenPointIds(): Set<number> { return readIdSet(HIDDEN_POINTS_KEY) }
export function saveHiddenBoxIds(ids: Set<number> | number[]) { writeIdSet(HIDDEN_BOXES_KEY, ids) }
export function saveHiddenPointIds(ids: Set<number> | number[]) { writeIdSet(HIDDEN_POINTS_KEY, ids) }

interface LoginWaiter {
  resolve: () => void
  reject: (error: Error) => void
}
const pendingLogins: LoginWaiter[] = []

/** 打开全局登录弹窗；返回的 Promise 在登录成功后 resolve（取消则 reject） */
export function requireDaasLogin(): Promise<void> {
  daasAuth.expired = true
  daasAuth.visible = true
  return new Promise((resolve, reject) => pendingLogins.push({ resolve, reject }))
}

/** 全局登录弹窗在登录成功后调用 */
export function notifyDaasLoginSuccess(token: string, refreshToken?: string) {
  setDaasToken(token, refreshToken)
  daasAuth.visible = false
  daasAuth.expired = false
  const waiters = pendingLogins.splice(0)
  waiters.forEach((w) => w.resolve())
}

/** 将 daas-api 登录 token 同步到采集服务，供后端定时采集任务使用。 */
export async function syncCollectorToken(token: string) {
  const response = await fetch(`${COLLECTOR_API_BASE_URL}/api/collector/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!response.ok) throw new Error(`采集服务返回 HTTP ${response.status}`)
}

/** 地图统一由采集服务读取 Redis Token；登录保存成功后重试一次。 */
export async function collectorDaasFetch(path: string): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(`${COLLECTOR_API_BASE_URL}${path}`)
    if (response.ok) {
      daasAuth.expired = false
      return response
    }
    if (response.status === 401 || response.status === 503) {
      daasAuth.expired = true
      if (attempt === 0) {
        await requireDaasLogin()
        continue
      }
      throw new Error('登录后仍无法访问云端接口，请检查 Token 或采集服务')
    }
    throw new Error(`云端数据加载失败：HTTP ${response.status}`)
  }
  throw new Error('云端数据加载失败')
}

export async function collectorMapRequest<T>(includeTransportTasks = true): Promise<T> {
  const response = await collectorDaasFetch(`/api/collector/box-map/data?includeTransportTasks=${includeTransportTasks}`)
  return await response.json() as T
}

/** 箱体地图车辆图层：实时位置与车型档案保持两个独立请求。 */
export async function collectorVehicleRuntimeRequest<T>(): Promise<T> {
  const response = await collectorDaasFetch('/api/collector/vehicles/runtime')
  return await response.json() as T
}

export async function collectorVehicleTypesRequest<T>(): Promise<T> {
  const response = await collectorDaasFetch('/api/collector/vehicles/types')
  return await response.json() as T
}

/** Redis 保存成功后才更新本地兼容状态、关闭弹窗并唤醒请求。 */
export async function saveSharedDaasToken(token: string, refreshToken?: string) {
  const normalized = token.trim().replace(/^Bearer\s+/i, '')
  if (!normalized) throw new Error('请输入 Token')
  await syncCollectorToken(normalized)
  notifyDaasLoginSuccess(normalized, refreshToken)
}

/** 全局登录弹窗被取消时调用 */
export function cancelDaasLogin() {
  daasAuth.visible = false
  const waiters = pendingLogins.splice(0)
  waiters.forEach((w) => w.reject(new Error('登录已取消')))
}

export interface DaasRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, unknown>
}

/**
 * 统一请求 daas-api：未登录 / 401 时自动弹登录框，登录成功后自动重试一次。
 * 返回接口 data 字段；失败抛错（含「登录已取消」「登录后仍无法访问」等提示）。
 */
export async function daasRequest<T = unknown>(path: string, options: DaasRequestOptions = {}): Promise<T> {
  const run = async (retried: boolean): Promise<T> => {
    if (!daasAuth.token) {
      await requireDaasLogin()
      return run(true)
    }
    let url = `${DAS_API_BASE}${path}`
    if (options.query) {
      const qs = new URLSearchParams()
      Object.entries(options.query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Spring 的 List<String> 查询参数需要重复传参：start2end=a&start2end=b，
          // 不能拼成一个 "a,b" 字符串。
          value.forEach((item) => { if (item !== undefined && item !== null) qs.append(key, String(item)) })
        } else if (value !== undefined && value !== null) {
          qs.set(key, String(value))
        }
      })
      const q = qs.toString()
      if (q) url += `?${q}`
    }
    const hasBody = options.body !== undefined
    const res = await fetch(url, {
      method: options.method || (hasBody ? 'POST' : 'GET'),
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${daasAuth.token}`,
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
    })
    let json: { code?: number, message?: string, data?: T } | null = null
    try { json = await res.json() } catch { /* 忽略解析失败 */ }
    // 仅明确的认证/权限错误触发重新登录，普通业务错误直接返回。
    if (res.status === 401 || res.status === 403 || json?.code === 401 || json?.code === 403) {
      clearDaasToken()
      if (retried) throw new Error(json?.message || '登录后仍无法访问云端接口')
      await requireDaasLogin()
      return run(true)
    }
    if (!json) throw new Error('云端接口响应解析失败')
    if (!res.ok || json.code !== 200) throw new Error(json.message || `云端接口请求失败：HTTP ${res.status}`)
    return json.data as T
  }
  return run(false)
}

/**
 * daas-api 全局登录 / 请求工具
 *
 * 多个页面共用同一份 token（localStorage 持久化）与同一个全局登录弹窗：
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
    // token 失效：HTTP 401 或业务码非 200
    if (res.status === 401 || (json && json.code !== 200)) {
      clearDaasToken()
      if (retried) throw new Error(json?.message || '登录后仍无法访问云端接口')
      await requireDaasLogin()
      return run(true)
    }
    if (!json) throw new Error('云端接口响应解析失败')
    return json.data as T
  }
  return run(false)
}

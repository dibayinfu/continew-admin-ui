/**
 * 地图页云端 JSON 数据源（阿里云 OSS，免后端）
 *
 * ⚠️ 注意：OSS 文件名与内容相反——
 *   - points.json      实际是「小勾臂箱 / 箱体」数据（data.points）
 *   - small-boxes.json 实际是「收集点」数据（data.boxes）
 * 这里按实际内容映射：CLOUD_BOXES_URL 给箱体用，CLOUD_POINTS_URL 给收集点用。
 */
export const CLOUD_BOXES_URL = 'https://mozihao.oss-cn-hangzhou.aliyuncs.com/shard/json/points.json'
export const CLOUD_POINTS_URL = 'https://mozihao.oss-cn-hangzhou.aliyuncs.com/shard/json/small-boxes.json'

const cacheKey = (url: string) => `map-cloud:${url}`

/**
 * 从云端拉取 JSON：成功写入 localStorage 缓存；失败回退缓存；都失败则抛错。
 * 这样刷新页面不丢数据（离线也能看上次的缓存）。
 */
export async function fetchCloudJson<T = unknown>(url: string): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as T
    try { localStorage.setItem(cacheKey(url), JSON.stringify(json)) } catch { /* 忽略存储失败 */ }
    return json
  } catch (error) {
    try {
      const cached = localStorage.getItem(cacheKey(url))
      if (cached) return JSON.parse(cached) as T
    } catch { /* 忽略 */ }
    throw error
  }
}

/**
 * 从云端 JSON 中按候选 key 提取数组，兼容 data.list / data.boxes / data.points 等结构。
 */
export function extractArray<T>(json: unknown, keys: string[]): T[] | undefined {
  const data = (json as { data?: Record<string, unknown> })?.data
  if (!data) return undefined
  for (const key of keys) {
    const arr = data[key]
    if (Array.isArray(arr)) return arr as T[]
  }
  return undefined
}

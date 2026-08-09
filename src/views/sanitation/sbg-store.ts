/**
 * 箱体监控共享数据缓存（小勾臂箱监控 / 箱体地图 / 箱体收集点地图 / 数据隐藏配置 共用）
 *
 * 任一页面「从云端更新」成功后，把最新箱体/收集点列表写入 localStorage 并通过 mitt 广播，
 * 其它已打开的页面会收到通知并刷新数据——保证几个页面看到同一份最新数据。
 */
import mittBus from '@/utils/mitt'

export const SBG_BOXES_UPDATED = 'sbg:boxes-updated'
export const SBG_POINTS_UPDATED = 'sbg:points-updated'

const BOXES_CACHE_KEY = 'sbg-monitor:boxes'
const POINTS_CACHE_KEY = 'sbg-monitor:points'

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch { return undefined }
}
function writeRaw(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 忽略存储失败 */ }
}

function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && Array.isArray((data as { list?: T[] }).list)) return (data as { list: T[] }).list
  return []
}

export function getCachedBoxes<T = unknown>(): T[] { return extractList<T>(readRaw(BOXES_CACHE_KEY)) }
export function getCachedPoints<T = unknown>(): T[] { return extractList<T>(readRaw(POINTS_CACHE_KEY)) }

export function saveCachedBoxes<T>(list: T[]) {
  writeRaw(BOXES_CACHE_KEY, list)
  mittBus.emit(SBG_BOXES_UPDATED, list)
}
export function saveCachedPoints<T>(list: T[]) {
  writeRaw(POINTS_CACHE_KEY, list)
  mittBus.emit(SBG_POINTS_UPDATED, list)
}

/** 订阅其它页面更新的箱体数据；返回取消订阅函数 */
export function subscribeBoxesUpdated(handler: (list: unknown[]) => void): () => void {
  mittBus.on(SBG_BOXES_UPDATED, handler)
  return () => mittBus.off(SBG_BOXES_UPDATED, handler)
}
export function subscribePointsUpdated(handler: (list: unknown[]) => void): () => void {
  mittBus.on(SBG_POINTS_UPDATED, handler)
  return () => mittBus.off(SBG_POINTS_UPDATED, handler)
}

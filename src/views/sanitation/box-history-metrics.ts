import { parseBeijingDateTime } from '@/utils/beijing-time'

export type BoxHistoryMetric = 'fillLevel' | 'temperature' | 'battery'
export type BoxHistoryView = BoxHistoryMetric | 'track'
export const HISTORY_DAY_OPTIONS = [1, 2, 3, 7] as const
export type BoxHistoryDays = typeof HISTORY_DAY_OPTIONS[number]
export interface BoxHistorySample {
  time: string
  fillLevel: number | null
  temperature: number | null
  battery: number | null
  pointId: number | null
  pointName: string | null
}
export interface BoxMetricHistory {
  boxId: number
  from: string
  to: string
  samples: BoxHistorySample[]
  truncated: boolean
}
export interface TimedBoxSample extends BoxHistorySample { timestamp: number }
export interface BoxPointSegment { start: number, end: number, key: string, name: string, color: string }
export const HISTORY_GAP_MS = 60 * 60 * 1000
const POINT_COLORS = ['#165dff', '#00b42a', '#ff7d00', '#722ed1', '#14c9c9', '#f5319d', '#86909c']
export const METRIC_LABELS: Record<BoxHistoryMetric, string> = { fillLevel: '垃圾占比', temperature: '温度', battery: '电量' }

export function normalizeHistorySamples(samples: BoxHistorySample[]): TimedBoxSample[] {
  return samples.map(sample => ({ ...sample, timestamp: parseBeijingDateTime(sample.time).getTime() }))
    .filter(sample => Number.isFinite(sample.timestamp)).sort((a, b) => a.timestamp - b.timestamp)
}
export function sampleMetricValue(sample: BoxHistorySample, metric: BoxHistoryMetric): number | null {
  const value = sample[metric]
  return value != null && Number.isFinite(value) && (metric === 'temperature' || (value >= 0 && value <= 100)) ? value : null
}
/** 色带只连接相邻采集记录；长时间缺测不推断地点，也不把末次点位延伸到现在。 */
export function buildPointSegments(samples: TimedBoxSample[]): BoxPointSegment[] {
  const segments: BoxPointSegment[] = []
  const colors = new Map<string, string>()
  samples.forEach((sample, index) => {
    const name = sample.pointName?.trim() || '未匹配收集点'
    const key = sample.pointId != null ? `id:${sample.pointId}` : `name:${name}`
    if (!colors.has(key)) colors.set(key, name === '未匹配收集点' ? '#86909c' : POINT_COLORS[colors.size % POINT_COLORS.length])
    const next = samples[index + 1]
    const end = next && next.timestamp - sample.timestamp <= HISTORY_GAP_MS ? next.timestamp : sample.timestamp
    const previous = segments[segments.length - 1]
    if (previous?.key === key && previous.end === sample.timestamp) previous.end = end
    else segments.push({ start: sample.timestamp, end, key, name, color: colors.get(key)! })
  })
  return segments
}

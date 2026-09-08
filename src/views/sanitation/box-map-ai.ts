export interface AiBoxSnapshot {
  id: number
  containerNo: string
  containerName: string
  fillLevel: number
  overflowStatus: number
  onlineStatus: number
  township: string
  village: string
  reportTime: string
  residenceMinutes?: number
  /** 连续超过满溢率阈值的时长，必须由后端阈值变更记录计算，不能用最后上报时间替代。 */
  overflowDurationMinutes?: number
}

export interface AiChart {
  type: 'bar'
  title: string
  labels: string[]
  values: number[]
}

/** AI 只能选择展示形式；真实行数据始终由后端按 dataRef 绑定。 */
export interface AiVisualization {
  type: 'metric' | 'table' | 'bar' | 'line' | 'none'
  title: string
  dataRef: string
  valueField?: 'taskCount' | 'garbageWeightTon'
}

export interface AiTransportMetricRow {
  dimension: string
  taskCount: number
  garbageWeightKg: number
  garbageWeightTon: number
  dataUpdatedAt?: string
}

export interface AiTransportMetrics {
  startDate: string
  endDate: string
  groupBy: 'NONE' | 'DAY' | 'TOWNSHIP' | 'VEHICLE'
  rows: AiTransportMetricRow[]
  taskCount: number
  garbageWeightKg: number
  garbageWeightTon: number
  dataUpdatedAt?: string
}

export interface AiMapAction {
  type: 'focusBox' | 'showOverflow'
  boxNo?: string
}

export interface AiSourceLink {
  title: string
  url: string
}

/** 优先清运的排名和分项得分只取后端确定性计算结果，不由模型生成。 */
export interface AiPriorityRankingItem {
  boxId: number
  boxNo: string
  boxName: string
  pointName: string
  townshipName: string
  villageName: string
  /** 0 正常在线；1 设备离线。 */
  onlineStatus: number
  fillLevel: number
  residenceMinutes: number
  overflowDurationMinutes: number | null
  fillScore: number
  residenceScore: number
  overflowDurationScore: number
  priorityScore: number
}

export interface AiReply {
  answer: string
  evidence: string[]
  chart?: AiChart
  visualization?: AiVisualization
  mapActions?: AiMapAction[]
  /** AI 实际联网检索到的公开来源；调度数据回答不会伪造该字段。 */
  sources?: AiSourceLink[]
  priorityRanking?: AiPriorityRankingItem[]
  transportMetrics?: AiTransportMetrics
  /** 优先清运的确定性评分是否由后端成功返回。 */
  priorityRankingAvailable?: boolean
  queryDurationMs?: number
  aiDurationMs?: number
  totalDurationMs?: number
  dataUpdatedAt: string
  source: 'ai' | 'local'
}

export interface AiQueryContext {
  boxes: AiBoxSnapshot[]
  selectedBoxNo?: string
}

export interface AiStreamCallbacks {
  onProgress?: (message: string) => void
  onAnswerDelta?: (text: string) => void
}

interface PriorityCleanupResponse {
  items: AiPriorityRankingItem[]
  dataUpdatedAt?: string
}

/** 工具模块独立运行，不能依赖 box-map.vue 组件内的同名函数。 */
function isPriorityCleanupQuestion(question: string) {
  return /优先.*清运|清运.*优先|哪些箱体/.test(question.replace(/\s/g, ''))
}

function formatPercent(value: number) {
  return `${Math.round(Number(value) || 0)}%`
}

function formatDuration(totalMinutes: number | undefined) {
  if (totalMinutes === undefined) return '待补充'
  const hours = Math.floor(totalMinutes / 60)
  return hours ? `${hours}小时${totalMinutes % 60}分` : `${totalMinutes}分`
}

function priorityScore(box: AiBoxSnapshot) {
  // 80% 满溢率 + 10% 当前停留时长（24h 封顶）+ 10% 连续超过满溢率阈值时长（12h 封顶）。
  const fill = Math.min(80, Math.max(0, box.fillLevel) / 100 * 80)
  const residence = Math.min(10, Math.max(0, box.residenceMinutes || 0) / (24 * 60) * 10)
  const overflowDuration = box.fillLevel >= 80
    ? Math.min(10, Math.max(0, box.overflowDurationMinutes || 0) / (12 * 60) * 10)
    : 0
  return Math.round(fill + residence + overflowDuration)
}

function buildLocalReply(question: string, context: AiQueryContext): AiReply {
  const boxes = context.boxes
  const risks = [...boxes]
    .filter((box) => box.overflowStatus === 1 || box.fillLevel >= 70)
    .sort((a, b) => priorityScore(b) - priorityScore(a) || b.fillLevel - a.fillLevel)
  const townshipCounts = new Map<string, number>()
  risks.forEach((box) => townshipCounts.set(box.township || '未匹配', (townshipCounts.get(box.township || '未匹配') || 0) + 1))
  const ranking = [...townshipCounts.entries()].sort((a, b) => b[1] - a[1])
  const key = question.replace(/\s/g, '')
  const first = risks[0]
  const common = {
    chart: {
      type: 'bar' as const,
      title: '各乡镇待关注箱体',
      labels: ranking.map(([name]) => name),
      values: ranking.map(([, count]) => count),
    },
    dataUpdatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    source: 'local' as const,
  }

  if (/哪个乡镇|区域|排行/.test(key)) {
    const [township, count] = ranking[0] || ['暂无风险数据', 0]
    return {
      ...common,
      answer: count ? `${township}当前风险最高，有 ${count} 个满溢或接近满溢箱体，建议优先安排巡查与清运。` : '当前没有满溢或接近满溢的箱体。',
      evidence: ranking.slice(0, 3).map(([name, value]) => `${name}：${value} 个待关注箱体`),
      mapActions: [{ type: 'showOverflow' }],
    }
  }

  if (/近期|预测|可能/.test(key)) {
    const near = risks.filter((box) => box.overflowStatus !== 1)
    return {
      ...common,
      answer: near.length ? `发现 ${near.length} 个接近满溢箱体。${near.slice(0, 3).map((box) => `${box.containerNo}号（${formatPercent(box.fillLevel)}）`).join('、')} 应优先关注；预测需要补充连续满溢率历史数据后才可给出准确时间。` : '当前没有接近满溢箱体。',
      evidence: near.slice(0, 3).map((box) => `${box.containerNo}号 · ${box.township || '未匹配区域'} · 当前 ${formatPercent(box.fillLevel)}`),
      mapActions: [{ type: 'showOverflow' }, ...(first ? [{ type: 'focusBox' as const, boxNo: first.containerNo }] : [])],
    }
  }

  return {
    ...common,
    answer: risks.length ? `当前有 ${risks.length} 个箱体需要关注。已按满溢率、当前停留时长和连续满溢时长综合排序，优先处理 ${risks.slice(0, 3).map((box) => `${box.containerNo}号（评分 ${priorityScore(box)}）`).join('、')}。` : '当前没有满溢或接近满溢箱体。',
    evidence: risks.slice(0, 3).map((box) => `${box.containerNo}号 · 满溢率 ${formatPercent(box.fillLevel)} · 停留时长 ${formatDuration(box.residenceMinutes)} · 满溢时长（超过 80%）${formatDuration(box.overflowDurationMinutes)} · 综合评分 ${priorityScore(box)}`),
    mapActions: [{ type: 'showOverflow' }, ...(first ? [{ type: 'focusBox' as const, boxNo: first.containerNo }] : [])],
  }
}

/** “优先清运”属于确定性调度规则，供界面在模型返回前立即展示。 */
export function getPriorityCleanupReply(context: AiQueryContext) {
  return buildLocalReply('哪些箱体需要优先清运？', context)
}

/**
 * 优先清运是确定性调度接口，不经过 AI/SSE。
 * 这样即使反向代理提前关闭长连接，也不会把一份已经完成的排名误报为“流式响应未完成”。
 */
export async function queryPriorityCleanup(limit = 5, signal?: AbortSignal): Promise<AiReply> {
  const collectorApiBaseUrl = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${collectorApiBaseUrl}/api/collector/boxes/priority-cleanup?limit=${Math.min(10, Math.max(1, limit))}`, { signal })
  if (!response.ok) throw new Error(await response.text() || '优先清运评分服务异常')
  const ranking = await response.json() as PriorityCleanupResponse
  const items = ranking.items || []
  return {
    answer: items.length
      ? '以下箱体已按综合评分从高到低排序。综合评分由满溢率、停留时长和满溢时长（超过 80%）共同决定。'
      : '当前没有满溢或接近满溢的箱体，无需安排优先清运。',
    evidence: items.slice(0, 3).map((item) => `${item.boxNo}号箱：综合评分 ${Math.round(Number(item.priorityScore) || 0)} 分`),
    priorityRanking: items,
    priorityRankingAvailable: true,
    mapActions: [{ type: 'showOverflow' }, ...(items[0] ? [{ type: 'focusBox' as const, boxNo: items[0].boxNo }] : [])],
    dataUpdatedAt: ranking.dataUpdatedAt || new Date().toLocaleString('zh-CN', { hour12: false }),
    source: 'ai',
  }
}

export async function queryBoxMapAssistant(question: string, context: AiQueryContext): Promise<AiReply> {
  const collectorApiBaseUrl = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
  const response = await fetch(`${collectorApiBaseUrl}/api/ai/box-map/query`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, context }),
  })
  if (!response.ok) throw new Error(await response.text() || 'AI 服务异常')
  return await response.json() as AiReply
}

/** 后端 SSE：进度先到达，answer-delta 直接来自模型生成过程，complete 补齐结构化结果。 */
export async function queryBoxMapAssistantStream(question: string, context: AiQueryContext, callbacks: AiStreamCallbacks = {}, signal?: AbortSignal): Promise<AiReply> {
  try {
    const collectorApiBaseUrl = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
    const response = await fetch(`${collectorApiBaseUrl}/api/ai/box-map/query/stream`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ question, context }), signal,
    })
    if (!response.ok || !response.body) throw new Error(await response.text())
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let completed: AiReply | undefined
    for (;;) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done }).replace(/\r/g, '')
      let separator: number
      while ((separator = buffer.indexOf('\n\n')) >= 0) {
        const packet = buffer.slice(0, separator)
        buffer = buffer.slice(separator + 2)
        const event = packet.match(/^event:\s*(.+)$/m)?.[1]
        const raw = packet.match(/^data:\s*(.+)$/m)?.[1]
        if (!event || !raw) continue
        const data = JSON.parse(raw) as { message?: string, text?: string }
        if (event === 'progress' && data.message) callbacks.onProgress?.(data.message)
        if (event === 'answer-delta' && data.text) callbacks.onAnswerDelta?.(data.text)
        if (event === 'complete') completed = data as AiReply
        if (event === 'error') throw new Error(data.message || 'AI 服务异常')
      }
      if (done) break
    }
    if (!completed) throw new Error('AI 流式响应未完成')
    return completed
  } catch (error) {
    // 用户主动停止时必须将 AbortError 抛回界面；不能降级为本地回答。
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error
    // 所有实时调度结论都必须来自后端工具结果，不能在浏览器伪造本地评分或回答。
    throw error
  }
}

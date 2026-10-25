<template>
  <section class="metric-history" aria-label="箱体历史曲线">
    <BoxHistoryToolbar v-model:days="rangeDays" :box-no="boxNo" :view="metric" :loading="loading" @range-change="loadHistory" @refresh="loadHistory" @view-change="changeView" @close="emit('close')" />
    <div v-if="loading" class="metric-empty"><a-spin tip="正在加载历史数据" /></div>
    <div v-else-if="error" class="metric-empty"><a-result status="error" title="曲线加载失败" :subtitle="error"><template #extra><a-button @click="loadHistory">重试</a-button></template></a-result></div>
    <div v-else class="metric-content">
      <div class="metric-facts"><span>有效采集 <b>{{ validSamples.length }}</b> 个点</span><span v-if="validSamples.length">范围 <b>{{ numberLabel(minValue) }} ～ {{ numberLabel(maxValue) }}</b></span><span v-if="history">{{ displayTime(history.from) }} ～ {{ displayTime(history.to) }}</span></div>
      <VChart v-if="validSamples.length" class="metric-chart" :option="option" :update-options="{ notMerge: true }" :theme="appStore.theme === 'dark' ? 'dark' : undefined" autoresize />
      <a-empty v-else class="metric-empty" :description="`近${rangeDays}天暂无有效${label}数据`" />
      <template v-if="metric === 'fillLevel' && validSamples.length">
        <div class="point-legend"><span v-for="point in pointLegend" :key="point.key"><i :style="{ background: point.color }"></i>{{ point.name }}</span></div>
        <p class="metric-note">上方为垃圾占比，下方色带为对应收集点；两图共用时间轴。悬停查看时间、占比及收集点，拖动底部滑块缩放。</p>
      </template>
      <p v-else-if="validSamples.length" class="metric-note">悬停查看时间与{{ label }}，拖动底部滑块缩放。</p>
      <p v-if="validSamples.length" class="metric-note">缺测和超过 1 小时的采集间隔以虚线连接两端有效值，虚线仅作连接参考，不代表实际采集值。<template v-if="metric === 'fillLevel'">收集点未匹配时明确标注，不推断空白时段。</template></p>
      <p v-if="validSamples.length === 1" class="metric-note">仅一个有效采集点，暂不能判断变化趋势。</p>
      <p v-if="history?.truncated" class="metric-note">数据较多，仅展示最近 6000 个采集点。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useAppStore } from '@/stores'
import { beijingDateTime, parseBeijingDateTime } from '@/utils/beijing-time'
import { buildMetricGapData, buildPointSegments, HISTORY_GAP_MS, METRIC_LABELS, normalizeHistorySamples, sampleMetricValue, type BoxHistoryMetric, type BoxHistoryView, type BoxHistoryDays, type BoxMetricHistory } from '../box-history-metrics'

import BoxHistoryToolbar from './BoxHistoryToolbar.vue'

use([LineChart, CustomChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])
const props = defineProps<{ boxId: number, boxNo: string, initialMetric: BoxHistoryMetric, initialDays?: BoxHistoryDays }>()
const emit = defineEmits<{ (event: 'close'): void, (event: 'track', days: BoxHistoryDays): void }>()
const appStore = useAppStore()
const metric = ref<BoxHistoryMetric>(props.initialMetric)
const rangeDays = ref<BoxHistoryDays>(props.initialDays ?? 2)
function changeView(view: BoxHistoryView) {
  if (view === 'track') emit('track', rangeDays.value)
  else metric.value = view
}
const label = computed(() => METRIC_LABELS[metric.value])
const unit = computed(() => metric.value === 'temperature' ? '℃' : '%')
const history = shallowRef<BoxMetricHistory>()
const loading = ref(false)
const error = ref('')
let requestVersion = 0
let controller: AbortController | undefined
const BASE_URL = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
async function loadHistory() {
  const version = ++requestVersion
  controller?.abort()
  const abort = new AbortController()
  controller = abort
  const timeout = window.setTimeout(() => abort.abort(), 25000)
  loading.value = true; error.value = ''; history.value = undefined
  try {
    const end = new Date(), start = new Date(end.getTime() - rangeDays.value * 24 * 60 * 60 * 1000)
    const query = new URLSearchParams({ from: beijingDateTime(start), to: beijingDateTime(end) })
    const response = await fetch(`${BASE_URL}/api/collector/boxes/${props.boxId}/history-metrics?${query}`, { signal: abort.signal })
    if (!response.ok) throw new Error(`请求失败（${response.status}）`)
    const result = await response.json() as BoxMetricHistory
    if (!Array.isArray(result.samples) || result.boxId !== props.boxId) throw new Error('历史数据格式不正确')
    if (version === requestVersion) history.value = result
  } catch (failure) {
    if (version === requestVersion) error.value = abort.signal.aborted ? '请求超时，请重试' : failure instanceof Error ? failure.message : '网络异常，请重试'
  } finally {
    window.clearTimeout(timeout)
    if (version === requestVersion) loading.value = false
  }
}
onMounted(loadHistory)
onBeforeUnmount(() => { requestVersion++; controller?.abort() })
const samples = computed(() => normalizeHistorySamples(history.value?.samples || []))
const validSamples = computed(() => samples.value.filter(sample => sampleMetricValue(sample, metric.value) != null))
const minValue = computed(() => Math.min(...validSamples.value.map(sample => sampleMetricValue(sample, metric.value)!)))
const maxValue = computed(() => Math.max(...validSamples.value.map(sample => sampleMetricValue(sample, metric.value)!)))
const pointSegments = computed(() => buildPointSegments(samples.value))
const pointLegend = computed(() => [...new Map(pointSegments.value.map(point => [point.key, point])).values()])
function numberLabel(value: number) { return `${Number(value.toFixed(2))}${unit.value}` }
function displayTime(value: string) { return value.replace('T', ' ').slice(5, 16) }
function timeLabel(time: number) { return displayTime(beijingDateTime(new Date(time))) }
const option = computed(() => {
  const withPoints = metric.value === 'fillLevel'
  const data: Array<{ value: [number, number | null], pointName?: string | null }> = []
  samples.value.forEach((sample, index) => {
    const previous = samples.value[index - 1]
    if (previous && sample.timestamp - previous.timestamp > HISTORY_GAP_MS) data.push({ value: [(previous.timestamp + sample.timestamp) / 2, null] })
    data.push({ value: [sample.timestamp, sampleMetricValue(sample, metric.value)], pointName: sample.pointName })
  })
  const minTime = history.value ? parseBeijingDateTime(history.value.from).getTime() : undefined
  const maxTime = history.value ? parseBeijingDateTime(history.value.to).getTime() : undefined
  const timeAxis = { type: 'time', min: minTime, max: maxTime, axisLabel: { fontSize: 11, hideOverlap: true, formatter: timeLabel }, axisPointer: { show: true, label: { formatter: ({ value }: { value: number }) => timeLabel(value) } } }
  const color = metric.value === 'temperature' ? '#ff7d00' : metric.value === 'battery' ? '#00b42a' : '#165dff'
  return {
    animation: false, backgroundColor: 'transparent',
    grid: withPoints ? [{ left: 64, right: 28, top: 34, bottom: 190 }, { left: 64, right: 28, bottom: 70, height: 60 }] : [{ left: 64, right: 28, top: 34, bottom: 70 }],
    xAxis: withPoints ? [{ ...timeAxis, gridIndex: 0 }, { ...timeAxis, gridIndex: 1, name: '时间', nameGap: 28, nameLocation: 'middle' }] : [{ ...timeAxis, name: '时间', nameGap: 28, nameLocation: 'middle' }],
    yAxis: [{ type: 'value', name: `${label.value}（${unit.value}）`, ...(metric.value === 'temperature' ? { scale: true } : { min: 0, max: 100 }), axisLabel: { formatter: `{value}${unit.value}` } }, ...(withPoints ? [{ gridIndex: 1, type: 'value', min: -1, max: 1, name: '所在收集点', axisLabel: { show: false }, axisTick: { show: false }, axisLine: { show: false }, splitLine: { show: false } }] : [])],
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    dataZoom: [{ type: 'inside', xAxisIndex: withPoints ? [0, 1] : [0], filterMode: 'none' }, { type: 'slider', xAxisIndex: withPoints ? [0, 1] : [0], filterMode: 'none', height: 18, bottom: 8, labelFormatter: timeLabel }],
    tooltip: { trigger: 'axis', renderMode: 'richText', formatter: (params: Array<{ seriesId: string, value: [number, number | null], data: { pointName?: string | null } }>) => {
      const point = params.find(item => item.seriesId === 'box-metric')
      if (!point) return ''
      return `${beijingDateTime(new Date(point.value[0]), ' ')}\n${label.value}：${point.value[1] == null ? '缺测' : numberLabel(point.value[1])}${withPoints ? `\n收集点：${point.data.pointName || '未匹配收集点'}` : ''}`
    } },
    series: [{ id: 'box-metric', type: 'line', data, smooth: false, connectNulls: false, showSymbol: validSamples.value.length <= 30, symbolSize: 6, lineStyle: { color, width: 2 }, itemStyle: { color } }, {
      id: 'box-metric-gaps', type: 'line', data: buildMetricGapData(samples.value, metric.value),
      smooth: false, connectNulls: false, showSymbol: false, silent: true,
      lineStyle: { color, width: 2, type: 'dashed' }, tooltip: { show: false },
    }, ...(withPoints ? [{
      id: 'collection-points', type: 'custom', xAxisIndex: 1, yAxisIndex: 1, encode: { x: [0, 1], y: 2 },
      data: pointSegments.value.map(point => ({ value: [point.start, point.end, 0], ...point })),
      tooltip: { trigger: 'item', renderMode: 'richText', formatter: ({ data: point }: { data: { name: string, start: number, end: number } }) => `${point.name}\n${timeLabel(point.start)} ～ ${timeLabel(point.end)}` },
      renderItem: (params: { dataIndex: number, coordSys: { x: number, y: number, width: number, height: number } }, api: { value: (index: number) => number, coord: (value: number[]) => number[] }) => {
        const point = pointSegments.value[params.dataIndex]
        const start = api.coord([api.value(0), 0]), end = api.coord([api.value(1), 0])
        const x = Math.max(start[0], params.coordSys.x), right = Math.min(Math.max(end[0], start[0] + 2), params.coordSys.x + params.coordSys.width)
        if (right <= x) return
        const width = right - x, y = start[1] - 18
        return { type: 'group', children: [{ type: 'rect', shape: { x, y, width, height: 36 }, style: { fill: point.color, opacity: 0.86 } }, ...(width > 44 ? [{ type: 'text', style: { x: x + width / 2, y: y + 18, text: point.name, fill: '#fff', align: 'center', verticalAlign: 'middle', width: width - 10, overflow: 'truncate', fontSize: 11 } }] : [])] }
      },
    }] : [])],
  }
})
</script>

<style scoped>
.metric-history { display: flex; flex-direction: column; }
.metric-content { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow-y: auto; }
.metric-facts { display: flex; flex-wrap: wrap; gap: 8px 20px; color: var(--color-text-3); font-size: 12px; }.metric-facts b { color: var(--color-text-1); }
.metric-chart { width: 100%; flex: 1; min-height: 400px; }
.metric-empty { display: flex; flex: 1; min-height: 200px; align-items: center; justify-content: center; }
.metric-note { margin: 8px 0 0; color: var(--color-text-3); font-size: 12px; line-height: 19px; }
.point-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; padding-top: 8px; }.point-legend span { display: flex; align-items: center; gap: 5px; color: var(--color-text-2); font-size: 12px; }.point-legend i { width: 10px; height: 10px; border-radius: 2px; }
@media (max-width: 720px) { .metric-chart { min-height: 400px; } }
</style>

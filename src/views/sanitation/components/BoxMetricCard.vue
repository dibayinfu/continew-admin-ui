<template>
  <section class="metric-card">
    <header><b>{{ analysis.boxNo }} 号箱 · {{ label }}变化</b><small>近 3 天 · 北京时间</small></header>
    <div class="facts">
      <span>当前{{ label }}<b>{{ valueLabel(analysis.currentValue) }}</b></span>
      <span>历史范围<b>{{ valueLabel(history?.summary?.minValue) }}～{{ valueLabel(history?.summary?.maxValue) }}</b></span>
    </div>
    <small v-if="analysis.dataUpdatedAt">当前值采集 {{ analysis.dataUpdatedAt.replace('T', ' ') }}</small>
    <VChart v-if="hasSamples" class="curve" :option="option" :theme="appStore.theme === 'dark' ? 'dark' : undefined" autoresize />
    <p v-else>{{ history?.message || `该时段暂无有效${label}数据` }}</p>
    <small v-if="hasSamples">横轴：采集时间 · 纵轴：{{ label }}（{{ unit }}）。悬停查看，拖动底部缩放。缺测及超过 1 小时的采集间隔断线显示。</small>
    <small v-if="hasSamples">有效采集 {{ history?.summary?.validCount }} 个点</small>
    <p v-if="history?.summary?.validCount === 1">仅一个有效点，暂不能判断变化趋势。</p>
    <p v-if="history?.truncated">仅展示最近 2000 个采集点，分析以展示时段为准。</p>
    <p v-if="!analysis.basic">{{ analysis.message || '暂无箱体数据' }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { beijingDateTime, parseBeijingDateTime } from '@/utils/beijing-time'
import type { AiBoxAnalysis } from '../box-map-ai'

use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])
const props = defineProps<{ analysis: AiBoxAnalysis }>()
const appStore = useAppStore()
const label = computed(() => props.analysis.metric === 'temperature' ? '温度' : '电量')
const unit = computed(() => props.analysis.metric === 'temperature' ? '℃' : '%')
const history = computed(() => props.analysis.metricHistory)
function valueLabel(value?: number | null) { return value != null && Number.isFinite(value) ? `${Number(value.toFixed(2))}${unit.value}` : '未知' }
function timeLabel(time: number) { return beijingDateTime(new Date(time)).replace('T', ' ').slice(5, 16) }
const samples = computed(() => (history.value?.points || [])
  .map(point => [parseBeijingDateTime(point.time).getTime(), point.value] as [number, number | null])
  .filter(([time]) => Number.isFinite(time)).sort((a, b) => a[0] - b[0]))
const hasSamples = computed(() => samples.value.some(([, value]) => value != null))
const option = computed(() => {
  const data: Array<[number, number | null]> = []
  samples.value.forEach((point, index) => {
    const previous = samples.value[index - 1]
    if (previous && point[0] - previous[0] > 3600000) data.push([(previous[0] + point[0]) / 2, null])
    data.push(point)
  })
  const battery = props.analysis.metric === 'battery'
  return {
    backgroundColor: 'transparent',
    animation: false,
    grid: { left: 50, right: 14, top: 28, bottom: 66 },
    tooltip: { trigger: 'axis', renderMode: 'richText', formatter: (params: Array<{ value: [number, number | null] }>) => {
      const point = params[0]?.value
      return point ? `${beijingDateTime(new Date(point[0]), ' ')}\n${label.value} ${valueLabel(point[1])}` : ''
    } },
    xAxis: { type: 'time', name: '时间', nameLocation: 'middle', nameGap: 27, axisLabel: { fontSize: 10, hideOverlap: true, formatter: timeLabel } },
    yAxis: { type: 'value', name: `${label.value}（${unit.value}）`, ...(battery ? { min: 0, max: 100, interval: 25 } : { scale: true }), axisLabel: { fontSize: 10, formatter: `{value}${unit.value}` } },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 4, labelFormatter: timeLabel }],
    series: [{ type: 'line', data, smooth: false, connectNulls: false, showSymbol: samples.value.length <= 30, symbolSize: 6, lineStyle: { width: 2, color: battery ? '#00b42a' : '#ff7d00' }, itemStyle: { color: battery ? '#00b42a' : '#ff7d00' } }],
  }
})
</script>

<style scoped>
.metric-card { display: grid; gap: 8px; margin-top: 10px; padding: 10px; border: 1px solid var(--color-border-2); border-radius: 6px; background: var(--color-bg-2); }
header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px; }
b { color: var(--color-text-1); font-size: 12px; }
small, p { color: var(--color-text-3); font-size: 10px; line-height: 1.6; margin: 0; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.facts span { display: grid; gap: 4px; padding: 8px; background: var(--color-fill-1); color: var(--color-text-3); font-size: 11px; }
.facts b { font-size: 14px; }
.curve { width: 100%; height: 230px; min-width: 0; }
</style>

<template>
  <section class="box-analysis">
    <header><b>{{ analysis.boxNo }} 号箱 · 数据</b><small v-if="analysis.dataUpdatedAt">采集 {{ timeLabel(analysis.dataUpdatedAt) }}</small></header>
    <p v-if="!analysis.basic" class="missing">{{ analysis.message || '暂无箱体数据' }}</p>
    <template v-else>
      <p v-if="analysis.basic.boxName" class="location">{{ analysis.basic.boxName }}</p>
      <div class="facts">
        <span>垃圾占比<b>{{ percent(analysis.basic.fillLevel) }}</b></span>
        <span>满溢标记<b>{{ analysis.basic.overflowStatus == null ? '未知' : analysis.basic.overflowStatus === 1 ? '满溢' : '未满溢' }}</b></span>
        <span>当前停留<b>{{ duration(analysis.residence?.durationMinutes) }}</b></span>
        <span>连续满溢<b>{{ analysis.overflow?.overflowing === false ? '未满溢' : duration(analysis.overflow?.durationMinutes) }}</b></span>
      </div>
      <p class="location">{{ [analysis.residence?.townshipName, analysis.residence?.villageName, analysis.residence?.pointName].filter(Boolean).join(' · ') || '未匹配收集点' }}</p>
      <div class="curve-title"><b>垃圾占比变化</b><small>近 3 天 · 北京时间</small></div>
      <VChart v-if="hasSamples" class="curve" :option="option" autoresize />
      <p v-else class="missing">{{ analysis.fillHistory?.message || '该时段暂无有效垃圾占比数据' }}</p>
      <small class="curve-note" v-if="hasSamples">横轴：采集时间 · 纵轴：垃圾占比（0–100%）。悬停查看，拖动底部缩放。缺测及超过 1 小时的采集间隔断线显示。</small>
      <p v-if="hasSamples && analysis.fillHistory?.summary" class="location">有效采集 {{ analysis.fillHistory.summary.validCount }} 个点 · 占比范围 {{ percent(analysis.fillHistory.summary.minFillLevel) }}～{{ percent(analysis.fillHistory.summary.maxFillLevel) }}</p>
      <p v-if="analysis.fillHistory?.summary?.validCount === 1" class="missing">只有一个有效数据点，暂不能判断变化趋势。</p>
      <p v-if="analysis.fillHistory?.truncated" class="missing">数据较多，仅展示最近 2000 个采集点；分析以展示时段为准。</p>
      <div class="curve-title"><b>运输任务</b><small>最多 5 条 · 未完成优先</small></div>
      <div v-for="(task, index) in analysis.transport?.items || []" :key="`${task.taskNo}-${index}`" class="task">
        <span>{{ task.taskNo || '未记录单号' }}<b>{{ task.statusName || task.taskStatus || '状态未知' }}</b></span>
        <small>{{ task.vehicleNo || '未记录车辆' }} · 同步 {{ task.dataUpdatedAt ? timeLabel(task.dataUpdatedAt) : '时间未知' }}</small>
      </div>
      <p v-if="!analysis.transport?.items?.length" class="missing">{{ analysis.transport?.message || '暂无运输任务数据' }}</p>
      <p v-if="analysis.transport?.truncated" class="missing">还有更多运输任务未展示。</p>
      <p v-if="analysis.residence?.status !== 'SUPPORTED'" class="missing">停留时长：{{ analysis.residence?.message || '暂无数据' }}</p>
      <p v-if="analysis.overflow?.status !== 'SUPPORTED'" class="missing">满溢时长：{{ analysis.overflow?.message || '暂无数据' }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { beijingDateTime, parseBeijingDateTime } from '@/utils/beijing-time'
import type { AiBoxAnalysis } from '../box-map-ai'

use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])
const props = defineProps<{ analysis: AiBoxAnalysis }>()
function timeLabel(value: string) { return value.replace('T', ' ').slice(5, 16) }
function percent(value?: number | null) { return value != null && Number.isFinite(value) && value >= 0 && value <= 100 ? `${value.toFixed(1)}%` : '未知' }
function duration(minutes?: number) {
  if (minutes == null) return '未知'
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)} 天 ${Math.floor(minutes % 1440 / 60)} 小时`
  return minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`
}
const samples = computed(() => (props.analysis.fillHistory?.points || [])
  .map(point => [parseBeijingDateTime(point.time).getTime(), point.fillLevel] as [number, number | null])
  .filter(([time]) => Number.isFinite(time))
  .sort((a, b) => a[0] - b[0]))
const hasSamples = computed(() => samples.value.some(([, fill]) => fill != null))
const option = computed(() => {
  const data: Array<[number, number | null]> = []
  samples.value.forEach((point, index) => {
    const previous = samples.value[index - 1]
    if (previous && point[0] - previous[0] > 60 * 60 * 1000) data.push([(previous[0] + point[0]) / 2, null])
    data.push(point)
  })
  return {
    animation: false,
    grid: { left: 44, right: 14, top: 22, bottom: 66 },
    tooltip: {
      trigger: 'axis', renderMode: 'richText',
      formatter: (params: Array<{ value: [number, number | null] }>) => {
        const point = params[0]?.value
        return point ? `${beijingDateTime(new Date(point[0]), ' ')}\n垃圾占比 ${percent(point[1])}` : ''
      },
    },
    xAxis: {
      type: 'time', name: '时间', nameLocation: 'middle', nameGap: 27,
      axisLabel: { fontSize: 10, hideOverlap: true, formatter: (value: number) => timeLabel(beijingDateTime(new Date(value))) },
      axisPointer: { label: { formatter: (params: { value: number }) => beijingDateTime(new Date(params.value), ' ') } },
    },
    yAxis: { type: 'value', name: '垃圾占比', min: 0, max: 100, interval: 25, axisLabel: { fontSize: 10, formatter: '{value}%' } },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 16, bottom: 4, labelFormatter: (value: number) => timeLabel(beijingDateTime(new Date(value))) }],
    series: [{ type: 'line', data, smooth: false, connectNulls: false, showSymbol: samples.value.length <= 30, symbolSize: 6, lineStyle: { width: 2, color: '#165dff' }, itemStyle: { color: '#165dff' } }],
  }
})
</script>

<style scoped>
.box-analysis { display: grid; gap: 8px; margin-top: 10px; padding: 10px; border: 1px solid #e5e6eb; border-radius: 6px; background: #fff; }
header, .curve-title { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px; }
b { color: #1d2129; font-size: 12px; }
small { color: #86909c; font-size: 10px; }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.facts span { display: grid; gap: 4px; padding: 8px; background: #f7f8fa; color: #86909c; font-size: 11px; }
.facts b { font-size: 14px; }
.curve { width: 100%; height: 230px; min-width: 0; }
.curve-note { line-height: 1.6; }
.location, .missing { margin: 0; font-size: 11px; line-height: 1.6; color: #86909c; }
.task { display: grid; gap: 4px; padding: 8px 0; border-top: 1px solid #f2f3f5; }
.task span { display: flex; justify-content: space-between; gap: 6px; font-size: 11px; color: #4e5969; }
</style>

<template>
  <div class="command-v2-page">
    <div class="resolution-switch">
      <button :class="{ active: resolutionMode === 'formal' }" @click="resolutionMode = 'formal'">正式分辨率</button>
      <button :class="{ active: resolutionMode === 'test' }" @click="resolutionMode = 'test'">测试分辨率</button>
    </div>

    <div ref="stageViewportRef" class="stage-viewport" :class="`mode-${resolutionMode}`" :style="stageViewportStyle">
      <div class="screen-shell" :style="{ transform: `scale(${screenScale})` }">
        <header class="screen-header">
          <div class="header-left">
            <span>2025-06-25</span>
            <span>10:31:28</span>
            <span>星期三</span>
            <span class="weather">☁ 28°C 多云转晴</span>
            <span>东风2级</span>
            <span>湿度 56%</span>
          </div>
          <h1>安阳龙安区生活垃圾收运监控指挥中心</h1>
          <div class="header-actions">
            <button class="ai-btn">AI小犀</button>
            <button>大屏模式</button>
            <button>全屏</button>
            <button>刷新</button>
            <button>设置</button>
          </div>
        </header>

        <div class="dashboard-grid">
          <aside class="left-rail">
            <PanelCard title="静态基础档案" class="archive-card">
              <div class="archive-list">
                <div v-for="item in archiveStats" :key="item.label" class="archive-row">
                  <span class="row-icon">{{ item.icon }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </PanelCard>

            <PanelCard title="累计任务 256 单" class="result-card">
              <div class="operation-list">
                <div v-for="item in operationStats" :key="item.label" class="operation-row">
                  <span class="row-icon">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                </div>
              </div>
            </PanelCard>
          </aside>

          <section class="analysis-column">
            <PanelCard title="昨日垃圾量乡镇排行（吨）" class="chart-card">
              <VChart class="analysis-chart" :option="townWasteChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="近7日清运走势（吨）" class="chart-card">
              <VChart class="analysis-chart" :option="wasteTrendChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="昨日司机排行（按任务量）" class="chart-card">
              <VChart class="analysis-chart" :option="driverRankChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="任务准点率（单/日）" class="chart-card">
              <VChart class="analysis-chart" :option="ontimeTaskChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
          </section>

          <main class="map-panel">
            <div class="map-stage" :class="`map-theme-${activeMapTheme}`" @wheel.prevent="onMapWheel">
              <div ref="v2MapBaseRef" class="v2-map-base" />

              <div class="map-kpis">
                <div v-for="item in mapKpis" :key="item.label" class="map-kpi">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                </div>
              </div>

              <div class="map-zoom-controls">
                <button @click="zoomMap(0.2)">+</button>
                <button @click="zoomMap(-0.2)">−</button>
                <button @click="resetMapZoom">1:1</button>
                <span>{{ Math.round(mapZoom * 100) }}%</span>
              </div>

              <div class="map-theme-switcher" aria-label="地图主题切换">
                <span>底图主题</span>
                <button
                  v-for="theme in mapThemes"
                  :key="theme.key"
                  :class="{ active: activeMapTheme === theme.key }"
                  :title="`切换为${theme.label}`"
                  @click.stop="activeMapTheme = theme.key"
                >
                  <i :style="{ background: theme.color }" />
                  {{ theme.label }}
                </button>
              </div>
              <div class="map-zoom-layer" :style="{ transform: `scale(${mapZoom})` }">
                <div class="region-shape">
                  <span class="town-label town-a">安阳县</span>
                  <span class="town-label town-b">龙泉镇</span>
                  <span class="town-label town-c">马家乡</span>
                  <span class="town-label town-d">东风乡</span>
                  <span class="town-label town-e">文明大道街道</span>
                  <span class="town-label town-f">殷都区</span>
                </div>

                <button
                  v-for="point in visibleMapEntities"
                  :key="point.id"
                  class="map-entity"
                  :class="[point.kind, point.status, { pulse: point.pulse }]"
                  :style="mapEntityStyle(point)"
                  @click="selectMapEntity(point)"
                >
                  <span class="entity-icon">
                    <img :src="mapEntityIcon(point)" :alt="`${point.type}图标`" />
                  </span>
                  <i v-if="point.alarm && activeLayers.includes('alarm')" class="alarm-dot" :class="{ pulse: point.pulse }">!</i>
                  <em>{{ point.name }}</em>
                </button>
              </div>

              <div class="map-layer-bar">
                <span>图层 · {{ visibleMapEntities.length }}/{{ mapEntities.length }}</span>
                <button v-for="layer in mapLayers" :key="layer.key" :class="{ active: activeLayers.includes(layer.key) }" @click="toggleLayer(layer.key)">
                  <img class="layer-icon" :src="layer.icon" :alt="`${layer.label}图标`" />{{ layer.label }}
                </button>
              </div>
            </div>

            <aside v-if="detailPanelVisible" class="detail-panel">
              <div class="panel-title">
                统一详情
                <button class="detail-close" @click="detailPanelVisible = false">×</button>
              </div>
              <div class="entity-tabs">
                <button v-for="tab in entityTabs" :key="tab" :class="{ active: currentEntityType === tab }">{{ tab }}</button>
              </div>
              <div class="entity-summary">
                <div>
                  <span>当前选中：</span>
                  <strong>{{ selectedEntity.name }}</strong>
                </div>
                <p>
                  <i :class="selectedEntity.status" /> {{ selectedEntity.onlineText }}
                </p>
                <img v-if="selectedEntity.image" :src="selectedEntity.image" alt="" />
              </div>
              <div class="detail-list">
                <div v-for="item in selectedEntity.details" :key="item.label">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
              <div class="relation-card">
                <div class="section-title">关联信息</div>
                <div v-for="item in selectedEntity.relations" :key="item.label" class="relation-row">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <i>›</i>
                </div>
              </div>
              <div class="quick-actions">
                <button>轨迹回放</button>
                <button>实时视频</button>
                <button>派单处置</button>
                <button>导航定位</button>
              </div>
            </aside>
          </main>

          <aside class="right-rail">
            <div class="right-tabs">
              <button v-for="tab in rightTabs" :key="tab.key" :class="{ active: activeRightTab === tab.key }" @click="activeRightTab = tab.key">
                {{ tab.label }}
              </button>
            </div>

            <PanelCard v-if="activeRightTab === 'alarm'" title="实时告警" class="right-card">
              <div class="alarm-stats">
                <div v-for="item in alarmStats" :key="item.label">
                  <span>{{ item.label }}</span>
                  <strong :class="item.tone">{{ item.value }}</strong>
                </div>
              </div>
              <div class="alarm-filters">
                <button class="active">全部 · 36</button>
                <button>严重 8</button>
                <button>未读 8</button>
                <button>星标 12</button>
              </div>
              <div class="table-title">告警列表（实时）</div>
              <div class="alarm-table">
                <div class="table-head">
                  <span>时间</span><span>类型</span><span>位置</span><span>状态</span><span />
                </div>
                <div v-for="item in alarmRows" :key="`${item.time}-${item.name}`" class="alarm-row">
                  <span><i :class="item.level" />{{ item.time }}</span>
                  <span>{{ item.name }}</span>
                  <span>{{ item.place }}</span>
                  <strong :class="item.stateTone">{{ item.state }}</strong>
                  <em>{{ item.star ? '★' : '☆' }}</em>
                </div>
              </div>
            </PanelCard>

            <PanelCard v-else :title="activeRightTitle" class="right-card">
              <template v-if="activeRightTab === 'task'">
                <div class="tab-stats-grid">
                  <div v-for="item in taskMonitorStats" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </div>
                </div>
                <div class="monitor-list">
                  <div v-for="item in taskMonitorRows" :key="item.id" class="monitor-row">
                    <div><strong>{{ item.name }}</strong><span>{{ item.route }}</span></div>
                    <em :class="item.tone">{{ item.status }}</em>
                  </div>
                </div>
              </template>
              <template v-else-if="activeRightTab === 'box'">
                <div class="tab-stats-grid">
                  <div v-for="item in boxMonitorStats" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </div>
                </div>
                <div class="monitor-list">
                  <div v-for="item in boxMonitorRows" :key="item.id" class="monitor-row">
                    <div><strong>{{ item.name }}</strong><span>{{ item.place }} · 满溢率 {{ item.fillRate }}%</span></div>
                    <em :class="item.tone">{{ item.status }}</em>
                  </div>
                </div>
              </template>
              <template v-else-if="activeRightTab === 'vehicle'">
                <div class="tab-stats-grid">
                  <div v-for="item in vehicleMonitorStats" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </div>
                </div>
                <div class="monitor-list">
                  <div v-for="item in vehicleMonitorRows" :key="item.id" class="monitor-row">
                    <div><strong>{{ item.plate }}</strong><span>{{ item.driver }} · {{ item.speed }}km/h · {{ item.task }}</span></div>
                    <em :class="item.tone">{{ item.status }}</em>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="tab-stats-grid">
                  <div v-for="item in safetyMonitorStats" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </div>
                </div>
                <div class="monitor-list">
                  <div v-for="item in safetyMonitorRows" :key="item.id" class="monitor-row">
                    <div><strong>{{ item.type }}</strong><span>{{ item.vehicle }} · {{ item.place }}</span></div>
                    <em :class="item.tone">{{ item.level }}</em>
                  </div>
                </div>
              </template>
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type EChartsOption, graphic } from 'echarts'
import L from 'leaflet'
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import 'leaflet/dist/leaflet.css'
import { longanVillageArchives, wgs84ToGcj02 } from './data/longan-archive'

defineOptions({ name: 'SanitationCommandCenterJulyV2' })

interface MapEntity {
  id: string
  type: '车辆' | '箱体' | '告警' | '任务' | '收集点' | '中转站' | '焚烧厂'
  layer: string
  kind: string
  status: string
  icon: string
  name: string
  lng: number
  lat: number
  alarm?: boolean
  pulse?: boolean
  onlineText: string
  image?: string
  details: Array<{ label: string, value: string }>
  relations: Array<{ label: string, value: string }>
}

const DESIGN_WIDTH = 4784
const DESIGN_HEIGHT = 1560
const resolutionMode = ref<'formal' | 'test'>('test')
const stageViewportRef = ref<HTMLElement>()
const autoTestScale = ref(0.35)
const screenScale = computed(() => resolutionMode.value === 'formal' ? 1 : autoTestScale.value)
const stageViewportStyle = computed(() => ({
  width: `${DESIGN_WIDTH * screenScale.value}px`,
  height: `${DESIGN_HEIGHT * screenScale.value}px`,
}))

let resizeObserver: ResizeObserver | undefined
const v2MapBaseRef = ref<HTMLDivElement>()
let v2BaseMap: L.Map | null = null
let wheelZoomTimer: number | undefined
let pendingWheelZoom = 0

function initV2BaseMap() {
  if (!v2MapBaseRef.value) return
  if (v2BaseMap) {
    v2BaseMap.remove()
    v2BaseMap = null
  }

  v2BaseMap = L.map(v2MapBaseRef.value, {
    center: [36.07, 114.30],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    inertia: false,
    minZoom: 11,
    maxZoom: 18,
  })

  L.tileLayer(
    'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
    {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 18,
    },
  ).addTo(v2BaseMap)
}

function updateTestScale() {
  if (!stageViewportRef.value || resolutionMode.value !== 'test') return
  const parent = stageViewportRef.value.parentElement
  if (!parent) return
  const availableWidth = parent.clientWidth - 16
  const availableHeight = Math.max(520, window.innerHeight - 132)
  autoTestScale.value = Math.min(1, availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT)
}

onMounted(() => {
  nextTick(updateTestScale)
  window.setTimeout(initV2BaseMap, 100)
  resizeObserver = new ResizeObserver(updateTestScale)
  if (stageViewportRef.value?.parentElement) {
    resizeObserver.observe(stageViewportRef.value.parentElement)
  }
  window.addEventListener('resize', updateTestScale)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateTestScale)
  if (wheelZoomTimer !== undefined) {
    window.clearTimeout(wheelZoomTimer)
  }
  if (v2BaseMap) {
    v2BaseMap.remove()
    v2BaseMap = null
  }
})

watch(resolutionMode, () => nextTick(updateTestScale))

const archiveStats = [
  { icon: '▥', value: '8', unit: '个', label: '乡镇' },
  { icon: '⌂', value: '157', unit: '个', label: '村庄' },
  { icon: '▣', value: '370', unit: '个', label: '小勾臂箱' },
  { icon: '▤', value: '12', unit: '个', label: '大勾臂箱' },
  { icon: '♙', value: '540', unit: '辆', label: '小三轮车' },
  { icon: '♜', value: '20', unit: '台', label: '小勾臂车' },
  { icon: '▰', value: '6', unit: '台', label: '大勾臂车' },
  { icon: '☷', value: '约 19 万', unit: '人', label: '覆盖人口' },
]

const operationStats = [
  { icon: '◫', label: '累计清运', value: '285.6', unit: '吨' },
  { icon: '▣', label: '累计趟次', value: '642', unit: '趟' },
  { icon: '◉', label: '累计里程', value: '3,856', unit: '公里' },
  { icon: '◷', label: '平均响应', value: '18.6', unit: '分钟' },
  { icon: '◇', label: '安全运行', value: '128', unit: '天' },
]

const townWasteRank = [
  { name: '龙泉镇', value: 186 },
  { name: '马家乡', value: 168 },
  { name: '彰武街道', value: 151 },
  { name: '东风乡', value: 136 },
  { name: '罗庄镇', value: 118 },
  { name: '善应镇', value: 96 },
  { name: '太行街道', value: 84 },
  { name: '文明大道街道', value: 72 },
]

const wasteTrend = [
  { date: '06-19', value: 210 },
  { date: '06-20', value: 238 },
  { date: '06-21', value: 196 },
  { date: '06-22', value: 265 },
  { date: '06-23', value: 228 },
  { date: '06-24', value: 252 },
  { date: '06-25', value: 241 },
]

const driverRank = [
  { name: '张师傅', tasks: 42, rate: 98 },
  { name: '李师傅', tasks: 39, rate: 97 },
  { name: '王师傅', tasks: 36, rate: 96 },
  { name: '赵师傅', tasks: 34, rate: 95 },
  { name: '陈师傅', tasks: 31, rate: 94 },
  { name: '郑师傅', tasks: 28, rate: 93 },
  { name: '孙师傅', tasks: 26, rate: 92 },
]

const ontimeTaskTrend = [
  { date: '06-19', tasks: 188, rate: 94 },
  { date: '06-20', tasks: 205, rate: 96 },
  { date: '06-21', tasks: 176, rate: 93 },
  { date: '06-22', tasks: 232, rate: 98 },
  { date: '06-23', tasks: 218, rate: 95 },
  { date: '06-24', tasks: 246, rate: 99 },
  { date: '06-25', tasks: 226, rate: 96 },
]

const chartTextColor = '#b8d8f2'
const chartGridColor = 'rgba(72, 174, 255, 0.14)'
const axisLabel = {
  color: chartTextColor,
  fontSize: 11,
}
const formalAxisLabel = {
  color: chartTextColor,
  fontSize: 18,
}

function chartFontSize(testSize: number, formalSize: number) {
  return resolutionMode.value === 'formal' ? formalSize : testSize
}

const townWasteChartOption = computed<EChartsOption>(() => ({
  grid: { top: 12, right: 52, bottom: 8, left: 78 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: '{b}<br/>昨日垃圾量：{c} 吨',
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...(resolutionMode.value === 'formal' ? formalAxisLabel : axisLabel) },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: townWasteRank.map((item) => item.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#d7ecff', fontSize: chartFontSize(12, 24), margin: 10 },
  },
  series: [{
    type: 'bar',
    data: townWasteRank.map((item) => item.value),
    barWidth: '48%',
    showBackground: true,
    backgroundStyle: { color: 'rgba(55, 126, 180, 0.14)', borderRadius: 8 },
    itemStyle: {
      borderRadius: [0, 8, 8, 0],
      color: new graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: 'rgba(36, 107, 255, 0.72)' },
        { offset: 0.55, color: '#24d6ff' },
        { offset: 1, color: '#83fff1' },
      ]),
      shadowBlur: 14,
      shadowColor: 'rgba(36, 214, 255, 0.35)',
    },
    label: {
      show: true,
      position: 'right',
      color: '#e5fbff',
      fontSize: chartFontSize(11, 22),
      formatter: '{c} 吨',
    },
  }],
  animation: false,
}))

const wasteTrendChartOption = computed<EChartsOption>(() => ({
  grid: { top: 22, right: 20, bottom: 26, left: 42 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: '{b}<br/>清运量：{c} 吨',
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: wasteTrend.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(96, 164, 220, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  series: [{
    type: 'line',
    data: wasteTrend.map((item) => item.value),
    smooth: true,
    symbol: 'circle',
    symbolSize: chartFontSize(7, 14),
    lineStyle: {
      width: chartFontSize(3, 6),
      color: '#38f58b',
      shadowBlur: 14,
      shadowColor: 'rgba(56, 245, 139, 0.45)',
    },
    itemStyle: { color: '#eafff2', borderColor: '#38f58b', borderWidth: 2 },
    areaStyle: {
      color: new graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(56, 245, 139, 0.34)' },
        { offset: 1, color: 'rgba(56, 245, 139, 0.02)' },
      ]),
    },
    label: {
      show: true,
      color: '#c8ffd9',
      fontSize: chartFontSize(10, 19),
      formatter: '{c}',
    },
  }],
  animation: false,
}))

const driverRankChartOption = computed<EChartsOption>(() => ({
  grid: { top: 12, right: 76, bottom: 10, left: 70 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: driverRank.map((item) => item.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#d7ecff', fontSize: chartFontSize(12, 24), margin: 10 },
  },
  series: [
    {
      name: '任务量',
      type: 'bar',
      data: driverRank.map((item) => item.tasks),
      barWidth: '46%',
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: new graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(22, 103, 255, 0.68)' },
          { offset: 1, color: '#20e7ff' },
        ]),
        shadowBlur: 14,
        shadowColor: 'rgba(32, 231, 255, 0.35)',
      },
      label: {
        show: true,
        position: 'right',
        color: '#e7f7ff',
        fontSize: chartFontSize(11, 22),
        formatter: '{c} 单',
      },
    },
    {
      name: '准点率',
      type: 'scatter',
      data: driverRank.map((item) => [item.tasks + 4, item.name, item.rate]),
      symbolSize: chartFontSize(1, 1),
      label: {
        show: true,
        position: 'right',
        color: '#43f08f',
        fontSize: chartFontSize(11, 22),
        formatter: (params: any) => `${params.value[2]}%`,
      },
      tooltip: { show: false },
    },
  ],
  animation: false,
}))

const ontimeTaskChartOption = computed<EChartsOption>(() => ({
  grid: { top: 32, right: 46, bottom: 28, left: 42 },
  legend: {
    top: 0,
    right: 4,
    itemWidth: chartFontSize(12, 22),
    itemHeight: chartFontSize(8, 14),
    textStyle: { color: '#aac9e5', fontSize: chartFontSize(10, 20) },
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
  },
  xAxis: {
    type: 'category',
    data: ontimeTaskTrend.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(96, 164, 220, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: [
    {
      type: 'value',
      name: '单',
      splitLine: { lineStyle: { color: chartGridColor } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
      nameTextStyle: { color: chartTextColor, fontSize: chartFontSize(10, 18) },
    },
    {
      type: 'value',
      name: '%',
      min: 90,
      max: 100,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20), formatter: '{value}%' },
      nameTextStyle: { color: chartTextColor, fontSize: chartFontSize(10, 18) },
    },
  ],
  series: [
    {
      name: '任务数',
      type: 'bar',
      data: ontimeTaskTrend.map((item) => item.tasks),
      barWidth: '32%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2ee7ff' },
          { offset: 1, color: 'rgba(27, 99, 255, 0.38)' },
        ]),
        shadowBlur: 14,
        shadowColor: 'rgba(46, 231, 255, 0.32)',
      },
    },
    {
      name: '准点率',
      type: 'line',
      yAxisIndex: 1,
      data: ontimeTaskTrend.map((item) => item.rate),
      smooth: true,
      symbol: 'circle',
      symbolSize: chartFontSize(7, 14),
      lineStyle: { width: chartFontSize(3, 6), color: '#43f08f' },
      itemStyle: { color: '#f4fff7', borderColor: '#43f08f', borderWidth: 2 },
      label: {
        show: true,
        color: '#caffdc',
        fontSize: chartFontSize(10, 18),
        formatter: '{c}%',
      },
    },
  ],
  animation: false,
}))

const mapKpis = [
  { label: '今日垃圾量', value: '1,280', unit: '吨' },
  { label: '今日任务', value: '256', unit: '单' },
  { label: '待接单', value: '32', unit: '单' },
  { label: '收运中', value: '128', unit: '单' },
  { label: '已完成', value: '108', unit: '单' },
  { label: '已超时', value: '20', unit: '单' },
]

const MAP_ICON_BASE = '/static/images/command-center-v2/map-icons'
const mapLayerIconMap: Record<string, string> = {
  smallTruck: `${MAP_ICON_BASE}/tricycle.png`,
  hookTruck: `${MAP_ICON_BASE}/hook-truck.png`,
  largeTruck: `${MAP_ICON_BASE}/large-hook-truck.png`,
  smallBox: `${MAP_ICON_BASE}/small-box.png`,
  largeBox: `${MAP_ICON_BASE}/large-box.png`,
  collectionPoint: `${MAP_ICON_BASE}/collection-point.png`,
  station: `${MAP_ICON_BASE}/transfer-station.png`,
  plant: `${MAP_ICON_BASE}/incineration-plant.png`,
  alarm: `${MAP_ICON_BASE}/alarm-beacon.png`,
}

type MapThemeKey = 'darkblue' | 'dark' | 'blue'
const activeMapTheme = ref<MapThemeKey>('blue')
const mapThemes: Array<{ key: MapThemeKey, label: string, color: string }> = [
  { key: 'darkblue', label: '极夜蓝', color: 'linear-gradient(135deg, #031525, #075b91)' },
  { key: 'dark', label: '幻影黑', color: 'linear-gradient(135deg, #02050a, #293543)' },
  { key: 'blue', label: '靛青蓝', color: 'linear-gradient(135deg, #062849, #1686c7)' },
]

const chartInitOptions = computed(() => ({
  renderer: 'canvas' as const,
  // 测试模式会整体缩放 4784px 画布，降低像素比可显著减少四张图表的绘制面积。
  devicePixelRatio: resolutionMode.value === 'test' ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
}))

const LONGAN_BOUNDS = {
  west: 113.985,
  east: 114.365,
  south: 35.955,
  north: 36.115,
}

const vehicleImage
  = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 130"><rect x="32" y="45" width="128" height="48" rx="8" fill="%23dff7ef" stroke="%2325d36f" stroke-width="5"/><rect x="150" y="60" width="38" height="33" rx="5" fill="%23e8fff7" stroke="%2325d36f" stroke-width="5"/><rect x="48" y="56" width="34" height="20" fill="%239bd7ff"/><rect x="92" y="56" width="36" height="20" fill="%239bd7ff"/><circle cx="66" cy="98" r="14" fill="%2320262e"/><circle cx="160" cy="98" r="14" fill="%2320262e"/><path d="M36 42h122l-10-18H52z" fill="%2325d36f"/></svg>'

const mapEntities = ref<MapEntity[]>([
  {
    id: 'v1',
    type: '车辆',
    layer: 'smallTruck',
    kind: 'truck-small',
    status: 'online',
    icon: '▣',
    name: '豫E01622D',
    lng: 114.2986,
    lat: 36.0952,
    onlineText: '在线  运行中',
    image: vehicleImage,
    details: [
      { label: '车辆类型', value: '小三轮车' },
      { label: '车牌号', value: '豫E01622D' },
      { label: '司机', value: '张师傅 138****6622' },
      { label: '速度', value: '35 km/h' },
      { label: '方向', value: '东北' },
      { label: '任务', value: '乡镇A-村庄3-收运' },
      { label: '位置', value: '文明大道与龙安路交叉口' },
      { label: '上报时间', value: '10:30:30' },
    ],
    relations: [
      { label: '正在服务箱体', value: '2 个' },
      { label: '附近告警', value: '1 条未处理' },
      { label: '当前任务进度', value: '65%' },
    ],
  },
  { id: 'v2', type: '车辆', layer: 'hookTruck', kind: 'truck-hook', status: 'online', icon: '▣', name: '豫E3G516', lng: 114.3268, lat: 36.0724, onlineText: '在线  收运中', details: [{ label: '车辆类型', value: '小勾臂车' }, { label: '司机', value: '李师傅' }, { label: '速度', value: '42 km/h' }, { label: '任务', value: '箱体满溢收运' }], relations: [{ label: '关联箱体', value: 'XB-龙泉-008' }] },
  { id: 'v3', type: '车辆', layer: 'largeTruck', kind: 'truck-large', status: 'online', icon: '▣', name: '豫E6N109', lng: 114.2442, lat: 36.0648, onlineText: '在线  转运中', details: [{ label: '车辆类型', value: '大勾臂车' }, { label: '司机', value: '孙师傅' }, { label: '速度', value: '48 km/h' }, { label: '载重', value: '13.8 吨' }], relations: [{ label: '目的地', value: '焚烧厂' }] },
  { id: 'b1', type: '箱体', layer: 'smallBox', kind: 'small-box', status: 'warning', icon: '▥', name: 'XB-012', lng: 114.3098, lat: 36.0872, alarm: true, onlineText: '在线  满溢预警', details: [{ label: '箱体类型', value: '小勾臂箱' }, { label: '满溢率', value: '92%' }, { label: '电量', value: '68%' }, { label: '位置', value: '马投涧镇牛家窑村' }], relations: [{ label: '待处理告警', value: '满溢告警' }] },
  { id: 'b2', type: '箱体', layer: 'largeBox', kind: 'large-box', status: 'danger', icon: '▤', name: 'DB-005', lng: 114.2796, lat: 36.0544, alarm: true, onlineText: '在线  严重满溢', details: [{ label: '箱体类型', value: '大勾臂箱' }, { label: '满溢率', value: '96%' }, { label: '所属站点', value: '马投涧中转站' }], relations: [{ label: '建议任务', value: '大勾臂车转运' }] },
  { id: 'c1', type: '任务', layer: 'collectionPoint', kind: 'collection', status: 'online', icon: '●', name: '收集点', lng: 114.3568, lat: 36.0676, onlineText: '运行正常', details: [{ label: '收集点', value: '文明大道收集点' }, { label: '服务范围', value: '3 个村庄' }, { label: '今日投放', value: '4.8 吨' }], relations: [{ label: '附近车辆', value: '2 辆' }] },
  { id: 's1', type: '箱体', layer: 'station', kind: 'station', status: 'online', icon: '⌂', name: '中转站', lng: 114.3245, lat: 36.0462, onlineText: '运行正常', details: [{ label: '站点名称', value: '文明大道中转站' }, { label: '在站箱体', value: '4 个' }, { label: '今日进站', value: '28 趟' }], relations: [{ label: '关联车辆', value: '6 辆' }] },
  { id: 'p1', type: '任务', layer: 'plant', kind: 'plant', status: 'online', icon: '▰', name: '焚烧厂', lng: 114.3842, lat: 36.0265, onlineText: '运行正常', details: [{ label: '今日处理', value: '218.5 吨' }, { label: '日处理能力', value: '600 吨' }], relations: [{ label: '入厂车辆', value: '12 辆' }] },
  { id: 'a1', type: '告警', layer: 'alarm', kind: 'alarm', status: 'danger', icon: '!', name: '告警', lng: 114.3475, lat: 36.0928, alarm: true, onlineText: '严重  未处理', details: [{ label: '告警类型', value: '箱体满溢' }, { label: '位置', value: '龙泉镇白龙庙村' }, { label: '触发时间', value: '10:28' }], relations: [{ label: '关联任务', value: '待派单' }] },
  { id: 'a2', type: '告警', layer: 'alarm', kind: 'alarm', status: 'warning', icon: '!', name: '告警', lng: 114.2278, lat: 36.0302, alarm: true, onlineText: '重要  处理中', details: [{ label: '告警类型', value: '车辆超速' }, { label: '位置', value: '马家乡北街' }, { label: '触发时间', value: '10:12' }], relations: [{ label: '关联车辆', value: '豫E3G516' }] },
])

const villageGeoArchives = longanVillageArchives.map((item) => {
  const point = wgs84ToGcj02(item.lng, item.lat)
  return { ...item, amapLng: point.lng, amapLat: point.lat }
})
const driverNames = ['张师傅', '李师傅', '王师傅', '赵师傅', '陈师傅', '郑师傅', '孙师傅', '刘师傅', '周师傅', '郭师傅']

function padCode(value: number) {
  return String(value).padStart(3, '0')
}

function seededRatio(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function pickVillage(index: number, offset: number) {
  return villageGeoArchives[Math.abs(index * 17 + offset * 7) % villageGeoArchives.length]
}

function simulatedLngLat(index: number, offset: number, jitterScale = 1) {
  const village = pickVillage(index, offset)
  const lngJitter = (seededRatio(index + offset) - 0.5) * 0.006 * jitterScale
  const latJitter = (seededRatio(index * 1.37 + offset * 2.11) - 0.5) * 0.004 * jitterScale
  return {
    lng: +clamp(village.amapLng + lngJitter, LONGAN_BOUNDS.west + 0.004, LONGAN_BOUNDS.east - 0.004).toFixed(6),
    lat: +clamp(village.amapLat + latJitter, LONGAN_BOUNDS.south + 0.004, LONGAN_BOUNDS.north - 0.004).toFixed(6),
  }
}

function createMapEntity(entity: Omit<MapEntity, 'lng' | 'lat'>, index: number, offset: number, jitterScale = 1): MapEntity {
  return {
    ...entity,
    ...simulatedLngLat(index, offset, jitterScale),
  }
}

function createGeneratedMapEntities(): MapEntity[] {
  const list: MapEntity[] = []

  for (let i = 1; i <= 20; i += 1) {
    const village = pickVillage(i, 10)
    const town = village.town
    list.push(createMapEntity({
      id: `hook-${i}`,
      type: '车辆',
      layer: 'hookTruck',
      kind: 'truck-hook',
      status: i % 9 === 0 ? 'warning' : 'online',
      icon: '▣',
      name: `小勾臂${padCode(i)}`,
      onlineText: i % 9 === 0 ? '在线  等待接单' : '在线  收运中',
      image: i === 1 ? vehicleImage : undefined,
      details: [
        { label: '车辆类型', value: '小勾臂车' },
        { label: '车牌号', value: `豫E${padCode(600 + i)}` },
        { label: '司机', value: driverNames[i % driverNames.length] },
        { label: '当前乡镇', value: town },
        { label: '速度', value: `${28 + (i % 18)} km/h` },
        { label: '任务', value: `${town}箱体收运` },
      ],
      relations: [
        { label: '关联箱体', value: `${2 + (i % 4)} 个` },
        { label: '今日任务', value: `${6 + (i % 7)} 单` },
      ],
    }, i, 10, 1.3))
  }

  for (let i = 1; i <= 6; i += 1) {
    const village = pickVillage(i, 30)
    const town = village.town
    list.push(createMapEntity({
      id: `large-truck-${i}`,
      type: '车辆',
      layer: 'largeTruck',
      kind: 'truck-large',
      status: 'online',
      icon: '▣',
      name: `大勾臂${padCode(i)}`,
      onlineText: '在线  转运中',
      details: [
        { label: '车辆类型', value: '大勾臂车' },
        { label: '车牌号', value: `豫E${padCode(800 + i)}` },
        { label: '司机', value: driverNames[(i + 3) % driverNames.length] },
        { label: '当前乡镇', value: town },
        { label: '载重', value: `${10 + i}.6 吨` },
        { label: '目的地', value: '龙安生活垃圾焚烧厂' },
      ],
      relations: [
        { label: '关联中转站', value: `${town}中转站` },
        { label: '今日转运', value: `${4 + i} 趟` },
      ],
    }, i, 30, 1.6))
  }

  for (let i = 1; i <= 30; i += 1) {
    const village = pickVillage(i, 60)
    const town = village.town
    list.push(createMapEntity({
      id: `tricycle-${i}`,
      type: '车辆',
      layer: 'smallTruck',
      kind: 'truck-small',
      status: i % 17 === 0 ? 'warning' : 'online',
      icon: '▣',
      name: `三轮${padCode(i)}`,
      onlineText: i % 17 === 0 ? '在线  低电量' : '在线  巡回清运',
      details: [
        { label: '车辆类型', value: '小三轮车' },
        { label: '车辆编号', value: `TR-${padCode(i)}` },
        { label: '驾驶员', value: driverNames[i % driverNames.length] },
        { label: '服务区域', value: town },
        { label: '今日里程', value: `${18 + (i % 24)} 公里` },
        { label: '今日任务', value: `${3 + (i % 6)} 单` },
      ],
      relations: [
        { label: '服务村庄', value: village.name },
        { label: '附近收集点', value: `${1 + (i % 3)} 个` },
      ],
    }, i, 60, 1.2))
  }

  for (let i = 1; i <= 12; i += 1) {
    const village = pickVillage(i, 110)
    const town = village.town
    const alarm = i <= 3
    list.push(createMapEntity({
      id: `large-box-${i}`,
      type: '箱体',
      layer: 'largeBox',
      kind: 'large-box',
      status: alarm ? 'danger' : 'online',
      icon: '▤',
      name: `大箱${padCode(i)}`,
      alarm,
      onlineText: alarm ? '在线  严重告警' : '在线  正常',
      details: [
        { label: '箱体类型', value: '大勾臂箱' },
        { label: '箱体编号', value: `DB-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: town },
        { label: '邻近村庄', value: village.name },
        { label: '满溢率', value: `${alarm ? 91 + (i % 8) : 42 + (i % 35)}%` },
        { label: '称重', value: `${6 + (i % 5)}.${i % 9} 吨` },
      ],
      relations: [
        { label: '关联任务', value: alarm ? '待派大勾臂车' : '暂无待办' },
        { label: '最近中转站', value: `${town}中转站` },
      ],
    }, i, 110, 0.45))
  }

  for (let i = 1; i <= 24; i += 1) {
    const village = pickVillage(i, 150)
    const town = village.town
    const alarm = i <= 10
    list.push(createMapEntity({
      id: `small-box-${i}`,
      type: '箱体',
      layer: 'smallBox',
      kind: 'small-box',
      status: alarm ? 'warning' : 'online',
      icon: '▥',
      name: `小箱${padCode(i)}`,
      alarm,
      onlineText: alarm ? '在线  满溢预警' : '在线  正常',
      details: [
        { label: '箱体类型', value: '小勾臂箱' },
        { label: '箱体编号', value: `XB-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: town },
        { label: '所在村庄', value: village.name },
        { label: '满溢率', value: `${alarm ? 82 + (i % 15) : 24 + (i % 48)}%` },
        { label: '电量', value: `${58 + (i % 39)}%` },
      ],
      relations: [
        { label: '建议车辆', value: `小勾臂${padCode((i % 20) + 1)}` },
        { label: '最近任务', value: alarm ? '待派单' : '正常巡检' },
      ],
    }, i, 150, 0.4))
  }

  for (let i = 1; i <= 18; i += 1) {
    const village = pickVillage(i, 210)
    const town = village.town
    list.push(createMapEntity({
      id: `collection-${i}`,
      type: '收集点',
      layer: 'collectionPoint',
      kind: 'collection',
      status: 'online',
      icon: '●',
      name: `收集点${padCode(i)}`,
      onlineText: '运行正常',
      details: [
        { label: '点位类型', value: '收集点' },
        { label: '点位名称', value: `${town}${village.name}收集点` },
        { label: '服务范围', value: `${2 + (i % 5)} 个村庄` },
        { label: '昨日垃圾量', value: `${Math.max(0.3, village.wasteTons).toFixed(2)} 吨` },
      ],
      relations: [
        { label: '附近车辆', value: `${2 + (i % 5)} 辆` },
        { label: '关联箱体', value: `${1 + (i % 4)} 个` },
      ],
    }, i, 210, 0.25))
  }

  for (let i = 1; i <= 12; i += 1) {
    const village = pickVillage(i, 280)
    const town = village.town
    list.push(createMapEntity({
      id: `station-${i}`,
      type: '中转站',
      layer: 'station',
      kind: 'station',
      status: i % 6 === 0 ? 'warning' : 'online',
      icon: '⌂',
      name: `${town}中转站`,
      onlineText: i % 6 === 0 ? '运行中  接近满载' : '运行正常',
      details: [
        { label: '站点类型', value: '垃圾中转站' },
        { label: '在站箱体', value: `${2 + (i % 6)} 个` },
        { label: '今日进站', value: `${18 + (i % 19)} 趟` },
        { label: '压缩量', value: `${18 + i}.5 吨` },
      ],
      relations: [
        { label: '关联车辆', value: `${4 + (i % 7)} 辆` },
        { label: '出站去向', value: '龙安生活垃圾焚烧厂' },
      ],
    }, i, 280, 0.85))
  }

  for (let i = 1; i <= 8; i += 1) {
    const village = pickVillage(i, 340)
    const tone = i <= 3 ? 'danger' : 'warning'
    list.push(createMapEntity({
      id: `alarm-${i}`,
      type: '告警',
      layer: 'alarm',
      kind: 'alarm',
      status: tone,
      icon: '!',
      name: i <= 3 ? '严重告警' : '重要告警',
      alarm: true,
      pulse: i <= 3,
      onlineText: i <= 3 ? '严重  未处理' : '重要  处理中',
      details: [
        { label: '告警类型', value: i % 2 === 0 ? '车辆主动安全告警' : '箱体满溢告警' },
        { label: '所属乡镇', value: village.town },
        { label: '所在村庄', value: village.name },
        { label: '触发时间', value: `10:${String(10 + i * 2).padStart(2, '0')}` },
      ],
      relations: [
        { label: '处置状态', value: i <= 3 ? '待派单' : '处置中' },
        { label: '附近车辆', value: `${1 + (i % 4)} 辆` },
      ],
    }, i, 340, 0.55))
  }

  list.push({
    id: 'plant-1',
    type: '焚烧厂',
    layer: 'plant',
    kind: 'plant',
    status: 'online',
    icon: '▰',
    name: '龙安生活垃圾焚烧厂',
    lng: 114.3892,
    lat: 36.0238,
    onlineText: '运行正常',
    details: [
      { label: '设施类型', value: '焚烧厂' },
      { label: '今日入厂', value: '218.5 吨' },
      { label: '处理能力', value: '600 吨/日' },
      { label: '排队车辆', value: '4 辆' },
    ],
    relations: [
      { label: '关联中转站', value: '12 个' },
      { label: '今日转运任务', value: '46 单' },
    ],
  })

  return list
}

mapEntities.value = createGeneratedMapEntities()

const selectedEntity = ref<MapEntity>(mapEntities.value[0])
const detailPanelVisible = ref(false)
const currentEntityType = computed(() => selectedEntity.value.type)
const entityTabs = ['车辆', '箱体', '告警', '任务']

const mapLayers = [
  { key: 'largeTruck', label: '大勾臂车', icon: mapLayerIconMap.largeTruck },
  { key: 'hookTruck', label: '小勾臂车', icon: mapLayerIconMap.hookTruck },
  { key: 'smallTruck', label: '小三轮车', icon: mapLayerIconMap.smallTruck },
  { key: 'largeBox', label: '大勾臂箱', icon: mapLayerIconMap.largeBox },
  { key: 'smallBox', label: '小勾臂箱', icon: mapLayerIconMap.smallBox },
  { key: 'collectionPoint', label: '收集点', icon: mapLayerIconMap.collectionPoint },
  { key: 'station', label: '中转站', icon: mapLayerIconMap.station },
  { key: 'plant', label: '焚烧厂', icon: mapLayerIconMap.plant },
  { key: 'alarm', label: '告警', icon: mapLayerIconMap.alarm },
]
const activeLayers = ref(mapLayers.map((layer) => layer.key))
const mapZoom = ref(1)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function zoomMap(delta: number) {
  mapZoom.value = +clamp(mapZoom.value + delta, 0.7, 2.4).toFixed(2)
  if (v2BaseMap) {
    const nextZoom = Math.round(clamp(13 + (mapZoom.value - 1) * 3, 11, 18))
    if (v2BaseMap.getZoom() !== nextZoom) {
      v2BaseMap.setZoom(nextZoom, { animate: false })
    }
  }
}

function resetMapZoom() {
  mapZoom.value = 1
}

function onMapWheel(event: WheelEvent) {
  pendingWheelZoom += event.deltaY > 0 ? -1 : 1
  if (wheelZoomTimer !== undefined) return

  wheelZoomTimer = window.setTimeout(() => {
    const direction = pendingWheelZoom >= 0 ? 1 : -1
    pendingWheelZoom = 0
    wheelZoomTimer = undefined
    zoomMap(direction * 0.2)
  }, 110)
}

const visibleMapEntities = computed(() => {
  const densityStep = mapZoom.value >= 1.55 ? 1 : mapZoom.value >= 1.2 ? 2 : 3
  const alwaysVisibleLayers = new Set(['alarm', 'plant', 'station', 'hookTruck', 'largeTruck', 'largeBox'])

  return mapEntities.value.filter((item, index) => {
    if (!activeLayers.value.includes(item.layer)) return false
    if (alwaysVisibleLayers.has(item.layer)) return true
    return index % densityStep === 0
  })
})

function lngLatToPercent(entity: Pick<MapEntity, 'lng' | 'lat'>) {
  const x = ((entity.lng - LONGAN_BOUNDS.west) / (LONGAN_BOUNDS.east - LONGAN_BOUNDS.west)) * 100
  const y = ((LONGAN_BOUNDS.north - entity.lat) / (LONGAN_BOUNDS.north - LONGAN_BOUNDS.south)) * 100
  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(92, Math.max(8, y)),
  }
}

function mapEntityStyle(entity: MapEntity) {
  const point = lngLatToPercent(entity)
  return { left: `${point.x}%`, top: `${point.y}%` }
}

function mapEntityIcon(entity: MapEntity) {
  return mapLayerIconMap[entity.layer] || mapLayerIconMap.alarm
}

function selectMapEntity(entity: MapEntity) {
  selectedEntity.value = entity
  detailPanelVisible.value = true
}

function toggleLayer(key: string) {
  if (activeLayers.value.includes(key)) {
    activeLayers.value = activeLayers.value.filter((item) => item !== key)
  } else {
    activeLayers.value = [...activeLayers.value, key]
  }
}

const rightTabs = [
  { key: 'alarm', label: '实时告警' },
  { key: 'task', label: '任务监控' },
  { key: 'box', label: '箱体监控' },
  { key: 'vehicle', label: '车辆监控' },
  { key: 'safety', label: '主动安全' },
]
const activeRightTab = ref('alarm')
const activeRightTitle = computed(() => rightTabs.find((tab) => tab.key === activeRightTab.value)?.label || '监控')

const alarmStats = [
  { label: '今日告警', value: 36, tone: 'danger' },
  { label: '未读', value: 8, tone: 'warning' },
  { label: '星标', value: 12, tone: 'info' },
]

const alarmRows = [
  { time: '10:31', name: '箱体满溢', place: '乡镇A-村庄1', state: '未读', stateTone: 'warning', level: 'danger', star: false },
  { time: '10:28', name: '车辆超速', place: '乡镇B-路段3', state: '处理中', stateTone: 'warning', level: 'danger', star: true },
  { time: '10:25', name: '箱体低电量', place: '乡镇C-村庄5', state: '未读', stateTone: 'warning', level: 'danger', star: false },
  { time: '10:22', name: '线路偏离', place: '乡镇D-中转线', state: '已派单', stateTone: 'info', level: 'info', star: true },
  { time: '10:19', name: '箱体倾倒', place: '乡镇E-路口7', state: '严重', stateTone: 'danger', level: 'danger', star: true },
  { time: '10:16', name: '车辆离线', place: '乡镇F-清运线', state: '未读', stateTone: 'warning', level: 'danger', star: false },
  { time: '10:12', name: '中转站满载', place: '中转站1号', state: '处理中', stateTone: 'warning', level: 'warning', star: false },
  { time: '10:08', name: '收集点溢出', place: '乡镇G-收集点2', state: '已派单', stateTone: 'info', level: 'info', star: true },
  { time: '10:03', name: '焚烧厂排队', place: '焚烧厂入口', state: '关注', stateTone: 'success', level: 'info', star: false },
  { time: '09:58', name: '箱体满溢', place: '乡镇H-村庄9', state: '已处理', stateTone: 'success', level: 'warning', star: false },
]

const taskMonitorStats = [
  { label: '今日总任务', value: '256', tone: 'info' },
  { label: '待接单', value: '32', tone: 'warning' },
  { label: '收运中', value: '128', tone: 'success' },
  { label: '已超时', value: '20', tone: 'danger' },
]

const taskMonitorRows = [
  { id: 'T001', name: '牛家窑2号小勾臂箱收运', route: '马投涧镇 -> 马投涧中转站', status: '收运中', tone: 'success' },
  { id: 'T002', name: '龙泉压缩箱C转运', route: '龙泉中转站 -> 焚烧厂', status: '待接单', tone: 'warning' },
  { id: 'T003', name: '文明大道收集点清运', route: '文明大道街道 -> 中转站', status: '已完成', tone: 'info' },
  { id: 'T004', name: '东风乡箱体满溢处置', route: '东风乡 -> 东风中转站', status: '已超时', tone: 'danger' },
  { id: 'T005', name: '善应镇日常巡回清运', route: '善应镇 -> 善应中转站', status: '收运中', tone: 'success' },
]

const boxMonitorStats = [
  { label: '小勾臂箱', value: '370', tone: 'success' },
  { label: '大勾臂箱', value: '12', tone: 'info' },
  { label: '满溢预警', value: '18', tone: 'warning' },
  { label: '设备离线', value: '6', tone: 'danger' },
]

const boxMonitorRows = [
  { id: 'B001', name: 'XB-马投-012', place: '牛家窑村', fillRate: 92, status: '满溢', tone: 'danger' },
  { id: 'B002', name: 'DB-龙泉-003', place: '龙泉中转站', fillRate: 76, status: '预警', tone: 'warning' },
  { id: 'B003', name: 'XB-善应-021', place: '善应北村', fillRate: 63, status: '正常', tone: 'success' },
  { id: 'B004', name: 'XB-东风-008', place: '徐家口村', fillRate: 0, status: '离线', tone: 'danger' },
  { id: 'B005', name: 'DB-马投-005', place: '马投涧中转站', fillRate: 96, status: '严重', tone: 'danger' },
]

const vehicleMonitorStats = [
  { label: '在线车辆', value: '486', tone: 'success' },
  { label: '收运中', value: '128', tone: 'info' },
  { label: '充电', value: '31', tone: 'warning' },
  { label: '离线', value: '23', tone: 'danger' },
]

const vehicleMonitorRows = [
  { id: 'V001', plate: '豫E01622D', driver: '张师傅', speed: 35, task: '乡镇A-村庄3-收运', status: '运行中', tone: 'success' },
  { id: 'V002', plate: '豫E3G516', driver: '李师傅', speed: 42, task: '箱体满溢收运', status: '收运中', tone: 'success' },
  { id: 'V003', plate: '豫E6N109', driver: '孙师傅', speed: 48, task: '大箱转运', status: '转运中', tone: 'info' },
  { id: 'V004', plate: '豫E2M883', driver: '赵师傅', speed: 0, task: '待命', status: '充电', tone: 'warning' },
  { id: 'V005', plate: '豫E8K270', driver: '王师傅', speed: 0, task: '无', status: '离线', tone: 'danger' },
]

const safetyMonitorStats = [
  { label: '今日安全告警', value: '21', tone: 'danger' },
  { label: '严重', value: '8', tone: 'danger' },
  { label: '处理中', value: '6', tone: 'warning' },
  { label: '已闭环', value: '13', tone: 'success' },
]

const safetyMonitorRows = [
  { id: 'S001', type: '分神驾驶', vehicle: '豫E3G516', place: '龙泉镇南街', level: '严重', tone: 'danger' },
  { id: 'S002', type: '疲劳驾驶', vehicle: '豫E6N109', place: '马投涧工业路', level: '严重', tone: 'danger' },
  { id: 'S003', type: '接打电话', vehicle: '豫E01622D', place: '文明大道', level: '重要', tone: 'warning' },
  { id: 'S004', type: '车道偏离', vehicle: '豫E2R012', place: '龙泉镇陈家庄', level: '已处理', tone: 'success' },
  { id: 'S005', type: '行人碰撞预警', vehicle: '豫E0D789', place: '善应镇中城村', level: '关注', tone: 'info' },
]

const PanelCard = {
  props: { title: String },
  setup(props: { title: string }, { slots }: any) {
    return () => h('section', { class: 'panel-card' }, [
      h('div', { class: 'panel-title' }, props.title),
      slots.default?.(),
    ])
  },
}
</script>

<style scoped lang="scss">
.command-v2-page {
  min-height: calc(100vh - 84px);
  overflow: auto;
  padding: 48px 8px 12px;
  background: #020813;
}

.resolution-switch {
  position: sticky;
  z-index: 30;
  top: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: -40px 0 8px;

  button {
    height: 32px;
    padding: 0 18px;
    color: #bfdbfe;
    cursor: pointer;
    background: rgba(15, 31, 52, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.34);
    border-radius: 4px;

    &.active {
      color: #031321;
      background: #67e8f9;
      box-shadow: 0 0 18px rgba(34, 211, 238, 0.45);
    }
  }
}

.stage-viewport {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  transition: width 0.28s ease, height 0.28s ease;

  &.mode-formal {
    overflow: auto;
  }
}

.screen-shell {
  position: relative;
  width: 4784px;
  height: 1560px;
  transform-origin: left top;
  color: #dbeeff;
  background:
    radial-gradient(circle at 50% 30%, rgba(0, 164, 255, 0.18), transparent 38%),
    linear-gradient(90deg, rgba(23, 95, 145, 0.13) 1px, transparent 1px),
    linear-gradient(rgba(23, 95, 145, 0.12) 1px, transparent 1px),
    #04101e;
  background-size: 100% 100%, 48px 48px, 48px 48px, 100% 100%;
  transition: transform 0.28s ease;

  &::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(180deg, transparent 0, rgba(67, 214, 255, 0.08) 48%, transparent 100%);
    opacity: 0.48;
  }
}

.screen-header {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.45fr 1fr;
  align-items: center;
  height: 92px;
  padding: 0 34px;
  border-bottom: 1px solid rgba(31, 175, 255, 0.25);

  &::before {
    position: absolute;
    inset: 8px 33.5% auto;
    height: 42px;
    content: "";
    border: 1px solid rgba(31, 175, 255, 0.55);
    border-top: 0;
    transform: skewX(-28deg);
    box-shadow: 0 0 20px rgba(31, 175, 255, 0.22) inset;
  }

  h1 {
    position: relative;
    margin: 0;
    color: #f2fbff;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: 0;
    text-align: center;
    text-shadow: 0 0 18px rgba(57, 215, 255, 0.88);
  }
}

.header-left,
.header-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  color: #a8c8e8;
  font-size: 20px;
  white-space: nowrap;
}

.header-actions {
  justify-content: flex-end;

  button {
    height: 40px;
    padding: 0 18px;
    color: #bcd8f5;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .ai-btn {
    min-width: 84px;
    color: #e9f8ff;
    background: rgba(21, 103, 157, 0.45);
    border: 1px solid rgba(44, 182, 255, 0.34);
    border-radius: 4px;
    box-shadow: 0 0 16px rgba(34, 179, 255, 0.18) inset;
  }
}

.weather {
  color: #f7d77f;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 620px 760px minmax(0, 1fr) 0 900px;
  gap: 14px;
  height: calc(100% - 92px);
  padding: 14px;
}

:deep(.panel-card),
.map-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(11, 31, 48, 0.88), rgba(7, 23, 37, 0.92));
  border: 1px solid rgba(58, 145, 206, 0.38);
  box-shadow: 0 0 0 1px rgba(8, 39, 62, 0.8) inset, 0 0 28px rgba(0, 149, 255, 0.08);

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(90deg, rgba(36, 198, 255, 0.18), transparent 24%, transparent 76%, rgba(36, 198, 255, 0.12));
    opacity: 0.45;
  }
}

:deep(.panel-title),
.panel-title {
  position: relative;
  z-index: 1;
  height: 34px;
  padding: 8px 12px 0;
  color: #66dcff;
  font-size: 15px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(61, 206, 255, 0.42);
}

.left-rail,
.analysis-column {
  display: grid;
  gap: 8px;
  min-height: 0;
}

.left-rail {
  grid-column: 1;
  grid-template-rows: 1fr 0.92fr;
  animation: panelEnterLeft 0.7s ease both;
}

.analysis-column {
  grid-column: 2;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  animation: panelEnterLeft 0.82s ease 0.05s both;
}

.archive-list,
.operation-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  padding: 4px 14px 14px;
}

.archive-row,
.operation-row {
  display: grid;
  grid-template-columns: 24px 70px 30px 1fr;
  align-items: center;
  min-height: 32px;
  color: #c8dcf2;
  border-bottom: 1px solid rgba(120, 180, 230, 0.1);

  strong {
    color: #e7f5ff;
    font-size: 18px;
    font-family: DINPro, Arial, sans-serif;
    font-weight: 800;
  }

  em {
    color: #a4bdd4;
    font-style: normal;
  }
}

.operation-row {
  grid-template-columns: 24px 1fr 70px 40px;

  strong {
    text-align: right;
  }
}

.row-icon {
  color: #bde7ff;
  font-size: 18px;
  text-align: center;
  text-shadow: 0 0 10px rgba(59, 204, 255, 0.38);
}

.chart-card {
  min-height: 0;
}

.analysis-chart {
  position: relative;
  z-index: 1;
  width: 100%;
  height: calc(100% - 36px);
  padding: 4px 8px 8px;
}

.rank-chart,
.driver-chart,
.trend-chart,
.ontime-chart {
  position: relative;
  z-index: 1;
  height: calc(100% - 36px);
  padding: 6px 12px 12px;
}

.rank-chart,
.driver-chart {
  display: grid;
  align-content: space-evenly;
  gap: 3px;
}

.rank-row,
.driver-row {
  display: grid;
  grid-template-columns: 22px 78px 1fr 54px;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  color: #b7d3ec;
  font-size: 12px;
}

.driver-row {
  grid-template-columns: 22px 64px 1fr 50px 38px;

  em {
    color: #45df85;
    font-style: normal;
    text-align: right;
  }
}

.rank-index {
  color: #7fa4c1;
  font-family: DINPro, Arial, sans-serif;
  text-align: center;
}

.rank-name {
  overflow: hidden;
  color: #d7ebff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-track {
  height: 10px;
  overflow: hidden;
  background: rgba(57, 118, 174, 0.22);
  border-radius: 999px;

  i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #486dff, #22ddff);
    border-radius: inherit;
    box-shadow: 0 0 12px rgba(37, 201, 255, 0.36);
  }
}

.driver-row .rank-track i {
  background: linear-gradient(90deg, #1588ff, #19e4ff);
}

.rank-row strong,
.driver-row strong {
  color: #e2f4ff;
  font-size: 12px;
  font-family: DINPro, Arial, sans-serif;
  font-weight: 700;
  text-align: right;
}

.trend-chart {
  display: grid;
  grid-template-rows: 1fr 20px;
  gap: 2px;

  svg {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  text {
    fill: #c8f7d9;
    font-size: 10px;
  }
}

.ontime-chart {
  display: grid;
  grid-template-rows: 1fr 18px 18px;
  gap: 0;

  svg {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  text {
    font-size: 10px;
  }
}

.trend-grid {
  stroke: rgba(74, 162, 255, 0.14);
  stroke-width: 1;
}

.trend-area {
  fill: rgba(46, 221, 118, 0.13);
}

.trend-line {
  fill: none;
  stroke: #32de79;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 5px rgba(50, 222, 121, 0.42));
}

.trend-dot {
  fill: #32de79;
  stroke: #dfffe8;
  stroke-width: 1.4;
}

.ontime-bar {
  fill: url("#ontimeBarGradient");
}

.ontime-chart svg {
  .ontime-bar {
    fill: #166dd6;
    filter: drop-shadow(0 0 5px rgba(25, 133, 255, 0.45));
  }
}

.ontime-line {
  fill: none;
  stroke: #42f08f;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 5px rgba(66, 240, 143, 0.42));
}

.ontime-dot {
  fill: #42f08f;
  stroke: #e6fff0;
  stroke-width: 1.3;
}

.ontime-task-label {
  fill: #cfe8ff;
}

.ontime-rate-label {
  fill: #bfffd5;
}

.ontime-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #9db9d5;
  font-size: 11px;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  i {
    display: inline-block;
    width: 14px;
    height: 7px;
    border-radius: 2px;
  }

  .bar-mark {
    background: #166dd6;
  }

  .line-mark {
    height: 2px;
    background: #42f08f;
  }
}

.trend-axis {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  color: #9db9d5;
  font-size: 11px;
  text-align: center;
}

.map-panel {
  grid-column: 3 / 5;
  display: flex;
  flex-direction: column;
  padding: 4px;
  animation: mapEnter 0.86s ease 0.08s both;
}

.map-stage {
  --map-tile-opacity: 0.78;
  --map-theme-tint: rgba(0, 55, 105, 0.52);

  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #081220;

  // 雷达扫描装饰环 — 仅边缘微弱光晕，不遮挡地图
  &::after {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    content: "";
    background:
      radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(10, 40, 64, 0.35) 84%, rgba(4, 20, 36, 0.65) 100%);
  }
}

.map-stage.map-theme-darkblue {
  --map-tile-opacity: 0.66;
  --map-theme-tint: rgba(0, 23, 48, 0.66);
}

.map-stage.map-theme-dark {
  --map-tile-opacity: 0.58;
  --map-theme-tint: rgba(1, 5, 12, 0.68);
}

.map-stage.map-theme-blue {
  --map-tile-opacity: 0.78;
  --map-theme-tint: rgba(0, 55, 105, 0.52);
}

.v2-map-base {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 50% 42%, #0b2d42, #040c17 68%);

  &::after {
    position: absolute;
    inset: 0;
    z-index: 400;
    pointer-events: none;
    content: "";
    background: var(--map-theme-tint);
    transition: background 0.28s ease;
  }

  :deep(.leaflet-container) {
    width: 100%;
    height: 100%;
    background: #050d18 !important;
  }

  :deep(.leaflet-tile-pane) {
    opacity: var(--map-tile-opacity);
    transition: opacity 0.22s ease;
  }

  :deep(.leaflet-control-attribution) {
    display: none;
  }
}

.map-zoom-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  transform-origin: center center;
  transition: transform 0.22s ease;
  pointer-events: none;

  &::before,
  &::after {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    content: "";
  }

  &::before {
    background:
      linear-gradient(90deg, rgba(64, 212, 255, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(64, 212, 255, 0.08) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(circle at 50% 50%, #000 0 56%, transparent 78%);
  }

  &::after {
    background:
      radial-gradient(circle at 28% 32%, rgba(51, 230, 255, 0.16), transparent 12%),
      radial-gradient(circle at 68% 58%, rgba(65, 255, 169, 0.12), transparent 14%);
  }

  > * {
    pointer-events: auto;
  }
}

.map-zoom-controls {
  position: absolute;
  z-index: 12;
  top: 68px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  color: rgba(196, 223, 243, 0.78);
  font-size: 12px;
  background: rgba(4, 18, 31, 0.72);
  border: 1px solid rgba(86, 170, 230, 0.28);
  border-radius: 4px;

  button {
    min-width: 28px;
    height: 24px;
    padding: 0 7px;
    color: rgba(215, 240, 255, 0.86);
    cursor: pointer;
    background: rgba(20, 57, 82, 0.72);
    border: 1px solid rgba(94, 174, 232, 0.24);
    border-radius: 3px;
  }

  span {
    min-width: 38px;
    text-align: center;
  }
}

.map-theme-switcher {
  position: absolute;
  z-index: 12;
  top: 96px;
  right: 34px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  color: rgba(172, 210, 236, 0.78);
  font-size: 22px;
  background: rgba(3, 15, 27, 0.82);
  border: 1px solid rgba(78, 169, 232, 0.3);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.32);

  > span {
    margin: 0 4px;
    white-space: nowrap;
  }

  button {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 44px;
    padding: 0 14px;
    color: rgba(182, 211, 232, 0.72);
    font-size: 21px;
    white-space: nowrap;
    cursor: pointer;
    background: rgba(14, 43, 67, 0.66);
    border: 1px solid rgba(81, 157, 211, 0.24);
    border-radius: 6px;
    transition: color 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;

    i {
      width: 24px;
      height: 24px;
      border: 1px solid rgba(181, 226, 255, 0.44);
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(48, 186, 255, 0.34);
    }

    &:hover {
      color: #e3f7ff;
      border-color: rgba(73, 197, 255, 0.55);
    }

    &.active {
      color: #e9fbff;
      background: rgba(15, 102, 157, 0.58);
      border-color: rgba(74, 213, 255, 0.7);
      box-shadow: 0 0 14px rgba(37, 191, 255, 0.22) inset, 0 0 12px rgba(37, 191, 255, 0.16);
    }
  }
}

.region-shape {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.town-label {
  position: absolute;
  color: rgba(222, 244, 255, 0.75);
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.9);
}

.town-a { left: 10%; top: 25%; }
.town-b { left: 58%; top: 19%; }
.town-c { left: 28%; top: 31%; }
.town-d { left: 40%; top: 53%; }
.town-e { left: 57%; top: 64%; }
.town-f { right: 7%; bottom: 11%; color: rgba(222, 244, 255, 0.42); }

.map-entity {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 8px rgba(31, 211, 255, 0.34));
  box-shadow: none;
  animation: mapPointIn 0.5s ease both, mapPointBreath 2.4s ease-in-out infinite;

  .entity-icon {
    position: relative;
    display: block;
    width: 24px;
    height: 24px;
    color: currentColor;

    &::before,
    &::after {
      position: absolute;
      content: "";
    }
  }

  em {
    position: absolute;
    top: 30px;
    left: 50%;
    display: none;
    padding: 1px 6px;
    color: #e6f6ff;
    font-size: 10px;
    font-style: normal;
    white-space: nowrap;
    background: rgba(0, 10, 18, 0.72);
    border-radius: 3px;
    transform: translateX(-50%);
  }

  &:hover {
    z-index: 10;
    transform: translate(-50%, -50%) scale(1.18);

    em {
      display: block;
    }
  }

  &.truck-small { color: #22aaff; }

  &.truck-hook,
  &.small-box { color: #36e889; }

  &.truck-large,
  &.large-box { color: #ffca38; }

  &.collection { color: #b487ff; }

  &.station { color: #20d5d2; }

  &.plant,
  &.alarm { color: #ff6647; }

  &.truck-small,
  &.truck-hook,
  &.truck-large {
    .entity-icon {
      &::before {
        left: 2px;
        top: 7px;
        width: 17px;
        height: 10px;
        background: linear-gradient(135deg, color-mix(in srgb, currentColor 85%, white 15%), currentColor);
        border-radius: 4px 5px 3px 3px;
        box-shadow: 0 0 10px currentColor;
      }

      &::after {
        right: 1px;
        top: 10px;
        width: 8px;
        height: 7px;
        background: linear-gradient(135deg, rgba(235, 253, 255, 0.95), currentColor);
        border-radius: 2px 4px 3px 1px;
        box-shadow:
          -12px 7px 0 -4px #07121e,
          -12px 7px 0 -2px currentColor,
          0 7px 0 -4px #07121e,
          0 7px 0 -2px currentColor;
      }
    }
  }

  &.truck-large .entity-icon {
    transform: scale(1.14);
  }

  &.small-box,
  &.large-box {
    .entity-icon {
      &::before {
        inset: 4px;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), currentColor 34%, color-mix(in srgb, currentColor 72%, #042138 28%));
        border-radius: 4px;
        transform: rotate(45deg);
        box-shadow: 0 0 13px currentColor;
      }

      &::after {
        left: 9px;
        top: 5px;
        width: 7px;
        height: 14px;
        border-right: 1px solid rgba(255, 255, 255, 0.45);
        border-left: 1px solid rgba(3, 18, 31, 0.45);
        transform: rotate(45deg);
      }
    }
  }

  &.large-box .entity-icon {
    transform: scale(1.16);
  }

  &.collection {
    .entity-icon {
      width: 18px;
      height: 18px;
      background: radial-gradient(circle at 38% 34%, #fff, currentColor 42%, rgba(45, 20, 90, 0.95));
      border-radius: 50%;
      box-shadow: 0 0 16px currentColor;

      &::before {
        inset: -5px;
        border: 1px solid currentColor;
        border-radius: 50%;
        opacity: 0.42;
      }
    }
  }

  &.station {
    .entity-icon {
      &::before {
        left: 4px;
        top: 8px;
        width: 16px;
        height: 12px;
        background: linear-gradient(180deg, rgba(240, 255, 255, 0.92), currentColor);
        clip-path: polygon(50% 0, 100% 38%, 100% 100%, 0 100%, 0 38%);
        box-shadow: 0 0 13px currentColor;
      }

      &::after {
        left: 9px;
        top: 13px;
        width: 6px;
        height: 7px;
        background: rgba(4, 20, 34, 0.72);
        border-radius: 1px 1px 0 0;
      }
    }
  }

  &.plant {
    .entity-icon {
      &::before {
        left: 4px;
        bottom: 4px;
        width: 17px;
        height: 11px;
        background: linear-gradient(145deg, rgba(255, 245, 224, 0.92), currentColor);
        clip-path: polygon(0 36%, 24% 56%, 46% 30%, 66% 54%, 100% 20%, 100% 100%, 0 100%);
        box-shadow: 0 0 14px currentColor;
      }

      &::after {
        right: 3px;
        top: 3px;
        width: 5px;
        height: 14px;
        background: currentColor;
        border-radius: 3px 3px 0 0;
        box-shadow: -7px -2px 0 -2px rgba(255, 255, 255, 0.72);
      }
    }
  }

  &.online { filter: drop-shadow(0 0 8px rgba(40, 226, 113, 0.42)); }
  &.warning { filter: drop-shadow(0 0 11px rgba(255, 191, 54, 0.58)); }
  &.danger { filter: drop-shadow(0 0 13px rgba(255, 76, 65, 0.68)); }
}

/* ImageGen 生成的业务对象直接作为地图点位，保留真实轮廓而非抽象几何标记。 */
.map-entity {
  width: 52px;
  height: 52px;
  overflow: visible;

  .entity-icon,
  &.collection .entity-icon,
  &.station .entity-icon,
  &.plant .entity-icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    background: none;
    border-radius: 0;
    box-shadow: none;

    &::before,
    &::after {
      display: none;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
      filter: drop-shadow(0 3px 4px rgba(0, 5, 12, 0.82)) drop-shadow(0 0 5px currentColor);
      transform: translateZ(0);
    }
  }

  &.truck-small .entity-icon { transform: scale(1.02); }
  &.truck-hook .entity-icon { transform: scale(1.08); }
  &.truck-large .entity-icon { transform: scale(1.2); }
  &.small-box .entity-icon { transform: scale(0.92); }
  &.large-box .entity-icon { transform: scale(1.08); }
  &.collection .entity-icon { transform: scale(1.02); }
  &.station .entity-icon { transform: scale(1.12); }
  &.plant .entity-icon { transform: scale(1.28); }
  &.alarm .entity-icon { transform: scale(0.84); }

  em {
    top: 54px;
  }
}

.alarm-dot {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 15px;
  height: 15px;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  line-height: 15px;
  text-align: center;
  background: #ff4a36;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(255, 74, 54, 0.8);

  &.pulse {
    animation: alarmPulse 1.2s ease-in-out infinite;
  }
}

.map-kpis {
  position: absolute;
  z-index: 8;
  top: 10px;
  left: 50%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  width: 74%;
  min-width: 640px;
  overflow: hidden;
  background: rgba(7, 20, 34, 0.78);
  border: 1px solid rgba(84, 165, 229, 0.38);
  border-radius: 6px;
  transform: translateX(-50%);
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.5), 0 0 24px rgba(16, 149, 255, 0.2);
}

.map-kpi {
  padding: 10px 8px;
  text-align: center;
  border-right: 1px solid rgba(116, 165, 205, 0.18);

  &:last-child {
    border-right: 0;
  }

  span {
    display: block;
    color: #9db9d5;
    font-size: 12px;
  }

  strong {
    color: #e5f6ff;
    font-size: 22px;
    font-family: DINPro, Arial, sans-serif;
  }

  em {
    margin-left: 4px;
    color: #9ab5cf;
    font-size: 12px;
    font-style: normal;
  }

  &:last-child strong {
    color: #ff594f;
  }
}

.map-layer-bar {
  position: absolute;
  z-index: 8;
  bottom: 12px;
  left: 50%;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  padding: 8px 18px;
  color: rgba(190, 214, 232, 0.72);
  font-size: 12px;
  background: rgba(5, 18, 30, 0.82);
  border: 1px solid rgba(84, 165, 229, 0.32);
  border-radius: 8px;
  transform: translateX(-50%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

  > span {
    color: rgba(140, 200, 240, 0.6);
    margin-right: 4px;
  }

  button {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 7px;
    color: rgba(190, 214, 232, 0.64);
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;

    &:hover {
      color: rgba(220, 240, 255, 0.9);
      background: rgba(45, 135, 210, 0.18);
    }

    &.active {
      color: #d7f0ff;
      background: rgba(45, 135, 210, 0.28);
      text-shadow: 0 0 8px rgba(120, 210, 255, 0.5);
    }
  }

  i {
    font-size: 16px;
    font-style: normal;
  }

  .layer-icon {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    object-fit: contain;
    filter: drop-shadow(0 0 5px rgba(80, 210, 255, 0.42));
    opacity: 0.46;
    transition: opacity 0.2s, filter 0.2s, transform 0.2s;
  }

  button:hover .layer-icon,
  button.active .layer-icon {
    opacity: 1;
    filter: drop-shadow(0 0 7px rgba(95, 221, 255, 0.72));
  }

  button:hover .layer-icon {
    transform: translateY(-1px) scale(1.08);
  }
}

.detail-panel {
  position: absolute;
  z-index: 10;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  overflow-y: auto;
  padding: 0 12px 12px;
  background: linear-gradient(180deg, rgba(11, 31, 48, 0.94), rgba(7, 23, 37, 0.96));
  border: 1px solid rgba(58, 145, 206, 0.42);
  border-right: 0;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5), 0 0 28px rgba(0, 149, 255, 0.1);
  animation: slideInDetail 0.24s ease both;

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(90deg, rgba(36, 198, 255, 0.18), transparent 60%);
    opacity: 0.35;
  }
}

.right-rail {
  grid-column: 5;
  min-width: 0;
  animation: panelEnterRight 0.78s ease 0.08s both;
}

.left-rail,
.analysis-column,
.map-panel,
.right-rail {
  contain: layout style;
}

.detail-close {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 28px;
  height: 28px;
  color: #9fc7e6;
  cursor: pointer;
  background: rgba(10, 34, 52, 0.9);
  border: 1px solid rgba(84, 160, 224, 0.34);
  border-radius: 4px;
}

.entity-tabs,
.right-tabs {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 0;

  button {
    height: 30px;
    color: #b7ccea;
    cursor: pointer;
    background: rgba(16, 40, 63, 0.86);
    border: 1px solid rgba(88, 154, 220, 0.32);
    border-radius: 3px;

    &.active {
      color: #55ff91;
      background: rgba(18, 94, 70, 0.56);
      border-color: rgba(65, 225, 134, 0.42);
    }
  }
}

.entity-summary {
  position: relative;
  z-index: 1;
  min-height: 136px;
  padding: 8px 0 10px;
  border-bottom: 1px solid rgba(84, 158, 213, 0.18);

  div {
    color: #a7bfd7;
    font-size: 13px;
  }

  strong {
    color: #e9f6ff;
    font-size: 16px;
  }

  p {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #56e985;
    margin: 8px 0;
    font-size: 13px;
  }

  i {
    width: 9px;
    height: 9px;
    background: #32e676;
    border-radius: 50%;
    box-shadow: 0 0 10px #32e676;

    &.danger {
      background: #ff4a36;
      box-shadow: 0 0 10px #ff4a36;
    }
  }

  img {
    position: absolute;
    right: 6px;
    bottom: 8px;
    width: 118px;
    height: auto;
  }
}

.detail-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 7px;
  padding: 14px 0;

  div {
    display: grid;
    grid-template-columns: 74px 1fr;
    gap: 8px;
    font-size: 13px;
  }

  span {
    color: #8ea9c2;
  }

  strong {
    color: #dceeff;
    font-weight: 600;
  }
}

.relation-card {
  position: relative;
  z-index: 1;
  padding: 10px 0;
  border-top: 1px solid rgba(84, 158, 213, 0.18);
  border-bottom: 1px solid rgba(84, 158, 213, 0.18);
}

.section-title,
.table-title {
  color: #59d8ff;
  font-size: 14px;
  font-weight: 800;
}

.relation-row {
  display: grid;
  grid-template-columns: 1fr auto 18px;
  align-items: center;
  min-height: 30px;
  color: #9cb8d3;
  font-size: 13px;

  strong {
    color: #e3f1ff;
  }

  i {
    color: #6baed9;
    font-style: normal;
    text-align: right;
  }
}

.quick-actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-top: 14px;

  button {
    height: 42px;
    color: #bbdcff;
    cursor: pointer;
    background: rgba(18, 47, 76, 0.86);
    border: 1px solid rgba(84, 160, 224, 0.34);
    border-radius: 4px;
  }
}

.right-rail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.right-tabs {
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  padding: 0;

  button {
    height: 42px;
    border-radius: 0;
  }
}

.right-card {
  flex: 1;
  min-height: 0;
}

.alarm-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px 12px;

  div {
    height: 72px;
    padding-top: 12px;
    text-align: center;
    background: rgba(13, 34, 55, 0.86);
    border: 1px solid rgba(84, 160, 224, 0.25);
    border-radius: 5px;
  }

  span {
    display: block;
    color: #aec4d8;
    font-size: 13px;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 30px;
    font-family: DINPro, Arial, sans-serif;
  }
}

.danger { color: #ff5b56 !important; }
.warning { color: #ffbe38 !important; }
.info { color: #55a8ff !important; }
.success { color: #45df85 !important; }

.alarm-filters {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 12px 12px;

  button {
    height: 28px;
    color: #a9c0d8;
    cursor: pointer;
    background: rgba(16, 39, 62, 0.86);
    border: 1px solid rgba(75, 147, 214, 0.35);
    border-radius: 4px;

    &.active {
      color: #d8eeff;
      background: rgba(21, 84, 137, 0.72);
    }
  }
}

.table-title {
  position: relative;
  z-index: 1;
  padding: 0 12px 8px;
}

.alarm-table {
  position: relative;
  z-index: 1;
  padding: 0 12px 12px;
}

.table-head,
.alarm-row {
  display: grid;
  grid-template-columns: 60px 86px 1fr 66px 24px;
  align-items: center;
  min-height: 34px;
  gap: 8px;
  font-size: 12px;
}

.table-head {
  color: #8ca7bf;
  border-bottom: 1px solid rgba(99, 159, 209, 0.16);
}

.alarm-row {
  color: #b7cbe0;

  span,
  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 8px;
    border-radius: 50%;

    &.danger { background: #ff4b3d; }
    &.warning { background: #ffbe38; }
    &.info { background: #4a9dff; }
  }

  em {
    color: #4a9dff;
    font-style: normal;
    text-align: center;
  }
}

.tab-placeholder {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 12px;
}

.tab-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  height: 54px;
  padding: 0 14px;
  color: #a9c1d9;
  background: rgba(13, 34, 55, 0.74);
  border: 1px solid rgba(84, 160, 224, 0.2);
  border-radius: 4px;

  strong {
    color: #e9f8ff;
    font-size: 20px;
    font-family: DINPro, Arial, sans-serif;
  }
}

.screen-shell {
  .panel-title {
    height: 72px;
    padding: 18px 28px 0;
    font-size: 34px;
  }

  .archive-list,
  .operation-list {
    gap: 12px;
    padding: 8px 30px 28px;
  }

  .archive-row,
  .operation-row {
    grid-template-columns: 56px 150px 70px 1fr;
    min-height: 68px;
    font-size: 28px;

    strong {
      font-size: 40px;
    }
  }

  .operation-row {
    grid-template-columns: 56px 1fr 150px 80px;
  }

  .row-icon {
    font-size: 38px;
  }

  .rank-chart,
  .driver-chart,
  .trend-chart,
  .ontime-chart {
    height: calc(100% - 72px);
    padding: 16px 30px 24px;
  }

  .analysis-chart {
    height: calc(100% - 72px);
    padding: 14px 24px 22px;
  }

  .rank-row,
  .driver-row {
    grid-template-columns: 48px 180px 1fr 128px;
    min-height: 46px;
    gap: 18px;
    font-size: 28px;
  }

  .driver-row {
    grid-template-columns: 48px 150px 1fr 120px 84px;
  }

  .rank-track {
    height: 22px;
  }

  .rank-row strong,
  .driver-row strong,
  .driver-row em {
    font-size: 26px;
  }

  .trend-axis,
  .ontime-legend {
    font-size: 24px;
  }

  .trend-chart text,
  .ontime-chart text {
    font-size: 24px;
  }

  .map-kpis {
    min-width: 1680px;
    margin-top: 30px;
  }

  .map-kpi {
    padding: 24px 16px;

    span,
    em {
      font-size: 26px;
    }

    strong {
      font-size: 48px;
    }
  }

  .town-label {
    font-size: 34px;
  }

  .map-zoom-controls {
    top: 30px;
    right: 34px;
    gap: 12px;
    padding: 10px;
    font-size: 26px;

    button {
      min-width: 58px;
      height: 48px;
      padding: 0 16px;
      font-size: 26px;
    }

    span {
      min-width: 86px;
    }
  }

  .map-entity {
    width: 46px;
    height: 46px;

    .entity-icon {
      width: 38px;
      height: 38px;
    }

    em {
      top: 52px;
      font-size: 22px;
    }
  }

  .alarm-dot {
    top: -13px;
    right: -13px;
    width: 30px;
    height: 30px;
    font-size: 20px;
    line-height: 30px;
  }

  .map-layer-bar {
    bottom: 24px;
    gap: 12px;
    padding: 16px 32px;
    font-size: 26px;
    border-radius: 14px;

    > span {
      margin-right: 8px;
    }

    button {
      height: 52px;
      padding: 0 14px;
      gap: 12px;
      font-size: 24px;
      white-space: nowrap;
    }

    i {
      font-size: 32px;
    }
  }

  .entity-tabs button,
  .right-tabs button {
    height: 58px;
    font-size: 26px;
  }

  .entity-summary,
  .detail-list,
  .relation-row,
  .quick-actions button {
    font-size: 26px;
  }

  .entity-summary {
    min-height: 250px;

    strong {
      font-size: 30px;
    }

    img {
      width: 260px;
    }
  }

  .detail-list div {
    grid-template-columns: 150px 1fr;
    gap: 18px;
  }

  .quick-actions button {
    height: 78px;
  }

  .alarm-stats {
    gap: 18px;
    padding: 18px 24px;

    div {
      height: 138px;
      padding-top: 26px;
    }

    span {
      font-size: 26px;
    }

    strong {
      font-size: 58px;
    }
  }

  .alarm-filters {
    gap: 14px;
    padding: 0 24px 22px;

    button {
      height: 52px;
      font-size: 24px;
    }
  }

  .table-title {
    padding: 0 24px 16px;
    font-size: 28px;
  }

  .alarm-table {
    padding: 0 24px 24px;
  }

  .table-head,
  .alarm-row {
    grid-template-columns: 120px 170px 1fr 130px 46px;
    min-height: 62px;
    gap: 16px;
    font-size: 24px;
  }

  .tab-stats-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    padding: 20px 24px;

    div {
      height: 120px;
      padding-top: 22px;
      text-align: center;
      background: rgba(13, 34, 55, 0.86);
      border: 1px solid rgba(84, 160, 224, 0.25);
      border-radius: 5px;
    }

    span {
      display: block;
      color: #aec4d8;
      font-size: 24px;
    }

    strong {
      display: block;
      margin-top: 8px;
      font-size: 46px;
      font-family: DINPro, Arial, sans-serif;
    }
  }

  .monitor-list {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 14px;
    padding: 0 24px 24px;
  }

  .monitor-row {
    display: grid;
    grid-template-columns: 1fr 130px;
    align-items: center;
    min-height: 78px;
    padding: 0 18px;
    background: rgba(13, 34, 55, 0.62);
    border: 1px solid rgba(84, 160, 224, 0.18);
    border-radius: 6px;

    strong,
    span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: #e9f8ff;
      font-size: 26px;
    }

    span {
      margin-top: 6px;
      color: #8faac4;
      font-size: 22px;
    }

    em {
      font-size: 24px;
      font-style: normal;
      text-align: right;
    }
  }
}

.rank-track i,
.ontime-bar {
  animation: chartGrow 0.8s ease both;
  transform-origin: left center;
}

.trend-line,
.ontime-line {
  animation: lineDraw 1.4s ease both;
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
}

.trend-dot,
.ontime-dot {
  animation: mapPointBreath 2s ease-in-out infinite;
}

/* 4784×1560 设计画布在测试模式会整体缩放，ICON 需保留足够的物理像素才能识别车型。 */
.screen-shell .map-entity {
  width: 72px;
  height: 72px;
  filter: none;
  animation: mapPointIn 0.5s ease both;

  .entity-icon,
  &.collection .entity-icon,
  &.station .entity-icon,
  &.plant .entity-icon {
    width: 64px;
    height: 64px;
  }

  .entity-icon img {
    filter: none;
  }

  em {
    top: 70px;
  }
}

.screen-shell .map-entity.collection { z-index: 3; }
.screen-shell .map-entity.small-box,
.screen-shell .map-entity.large-box { z-index: 4; }
.screen-shell .map-entity.station,
.screen-shell .map-entity.plant { z-index: 5; }
.screen-shell .map-entity.truck-small,
.screen-shell .map-entity.truck-hook,
.screen-shell .map-entity.truck-large { z-index: 6; }
.screen-shell .map-entity.alarm { z-index: 7; }

.screen-shell .map-entity.warning,
.screen-shell .map-entity.danger,
.screen-shell .map-entity.alarm {
  filter: none;
  animation: none;
}

.screen-shell .map-entity.pulse {
  animation: mapPointIn 0.5s ease both, mapPointBreath 2.2s ease-in-out infinite;
}

.screen-shell .map-layer-bar .layer-icon {
  width: 42px;
  height: 42px;
}

@keyframes chartGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes lineDraw {
  to { stroke-dashoffset: 0; }
}

@keyframes mapPointIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.45);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes mapPointBreath {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
}

@keyframes slideInDetail {
  from {
    opacity: 0;
    transform: translateX(32px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes panelEnterLeft {
  from {
    opacity: 0;
    transform: translateX(-18px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes panelEnterRight {
  from {
    opacity: 0;
    transform: translateX(18px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes mapEnter {
  from {
    opacity: 0;
    transform: scale(0.985);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes screenScan {
  from {
    transform: translateY(-100%);
  }

  to {
    transform: translateY(100%);
  }
}

@keyframes alarmPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(255, 74, 54, 0.75);
  }

  50% {
    transform: scale(1.2);
    box-shadow: 0 0 22px rgba(255, 74, 54, 0.95);
  }
}
</style>

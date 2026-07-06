<template>
  <div class="gi_page history-track-page">
    <section class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <h4 class="prd-section-title">🎯 功能要点（开发 / 测试关注）</h4>
              <table class="prd-table">
                <tbody>
                  <tr>
                    <td class="prd-label">功能范围</td>
                    <td class="prd-value">本功能仅针对历史轨迹中的车辆称重数据展示，不扩展其它业务功能。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">称重按钮</td>
                    <td class="prd-value">当车辆已安装称重设备时，在历史轨迹底部按钮栏显示“称重”按钮；未安装称重设备的车辆不显示该按钮。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">称重曲线</td>
                    <td class="prd-value">点击“称重”按钮后，在底部图表区域显示该车辆在当前时间范围内的重量变化曲线，用于查看车辆作业过程中的重量波动情况。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">装卸点</td>
                    <td class="prd-value">在称重曲线区域提供“显示装卸点”勾选项。勾选后，在地图轨迹上标记“装车点”和“卸车点”。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">点位弹层</td>
                    <td class="prd-value">点击地图上的“装车点”或“卸车点”后，弹层展示该点位的时间、地点、重量、坐标。</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <h4 class="prd-section-title">🔑 判断规则</h4>
              <table class="prd-table">
                <tbody>
                  <tr>
                    <td class="prd-label">装卸阈值</td>
                    <td class="prd-value">当车辆称重数据的重量波动超过箱体容量的 10% 时，判定为一次装车或卸车行为。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">装车</td>
                    <td class="prd-value">重量增加超过阈值，判定为装车。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">卸车</td>
                    <td class="prd-value">重量减少超过阈值，判定为卸车。</td>
                  </tr>
                  <tr>
                    <td class="prd-label">示例</td>
                    <td class="prd-value">大勾臂箱箱体容量为 10 吨，10% 阈值为 1 吨；当重量增加或减少 1 吨及以上时，视为装车或卸车。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </section>

    <div class="track-shell">
      <aside class="track-sidebar">
        <a-input-search
          v-model="keyword"
          allow-clear
          class="vehicle-search"
          placeholder="搜索车牌号"
        />

        <div class="status-row">
          <span><i class="dot online" />在线</span>
          <span><i class="dot charging" />充电</span>
          <span><i class="dot offline" />离线</span>
        </div>

        <div class="tree-panel">
          <div class="tree-node org" @click="orgOpen = !orgOpen">
            <icon-caret-right :class="{ open: orgOpen }" />
            <span>安阳市龙安区环境卫生事务中心({{ filteredVehicles.length }})</span>
          </div>
          <template v-if="orgOpen">
            <div class="tree-node group" @click="groupOpen = !groupOpen">
              <icon-caret-right :class="{ open: groupOpen }" />
              <span>清洗车</span>
            </div>
            <div v-if="groupOpen" class="vehicle-tree-list">
              <button
                v-for="vehicle in filteredVehicles"
                :key="vehicle.id"
                class="vehicle-tree-item"
                :class="{ active: vehicle.id === selectedVehicle.id }"
                type="button"
                @click="selectVehicle(vehicle)"
              >
                <i class="dot" :class="vehicle.statusClass" />
                <span>{{ vehicle.plateNo }}</span>
              </button>
            </div>
          </template>
        </div>
      </aside>

      <main class="track-main">

      <div class="query-bar">
        <a-select v-model="selectedVehicleId" class="vehicle-select" @change="handleVehicleChange">
          <a-option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
            {{ vehicle.plateNo }}
          </a-option>
        </a-select>
        <a-range-picker
          v-model="dateRange"
          class="range-picker"
          show-time
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <a-button @click="resetView">重置</a-button>
      </div>

      <section class="map-wrap">
        <LonganMapFrame />
        <svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            :points="trackLine"
            fill="none"
            stroke="#4d87ec"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="0.55"
          />
        </svg>

        <div class="map-filter-card">
          <label v-for="item in mapFilters" :key="item.label" :class="item.className">
            <input v-model="item.checked" type="checkbox">
            <span>{{ item.label }}</span>
          </label>
        </div>

        <span class="start-point" :style="pointStyle(firstPoint)">起</span>
        <span class="end-point" :style="pointStyle(lastPoint)">终</span>

        <button
          v-for="point in visibleLoadPoints"
          :key="`load-${point.time}`"
          class="load-point"
          :class="point.loadEvent === '装车点' ? 'load' : 'unload'"
          :style="pointStyle(point)"
          type="button"
          @click="selectedLoadPoint = point"
        >
          {{ point.loadEvent === '装车点' ? '装' : '卸' }}
        </button>

        <span
          v-for="point in visibleStopPoints"
          :key="point.time"
          class="stop-point"
          :style="pointStyle(point)"
        >
          停
        </span>

        <span class="vehicle-current" :style="pointStyle(currentPoint)">
          <icon-drive-file />
        </span>

        <div
          v-if="selectedLoadPoint"
          class="load-point-popup"
          :style="popupStyle(selectedLoadPoint)"
        >
          <div class="popup-title">{{ selectedLoadPoint.loadEvent }}</div>
          <dl>
            <div><dt>时间</dt><dd>{{ selectedLoadPoint.time }}</dd></div>
            <div><dt>地点</dt><dd>{{ selectedLoadPoint.location }}</dd></div>
            <div><dt>重量</dt><dd>{{ selectedLoadPoint.weight }} kg</dd></div>
            <div><dt>坐标</dt><dd>{{ selectedLoadPoint.lng.toFixed(6) }}, {{ selectedLoadPoint.lat.toFixed(6) }}</dd></div>
          </dl>
          <button type="button" @click="selectedLoadPoint = null">关闭</button>
        </div>
      </section>

      <section class="playback-panel">
        <div class="speed-row">
          <span class="label">播放速度:</span>
          <button
            v-for="speed in playbackSpeeds"
            :key="speed.value"
            class="pill-btn"
            :class="{ active: playSpeed === speed.value }"
            type="button"
            @click="playSpeed = speed.value"
          >
            {{ speed.label }}
          </button>
          <span class="mileage">里程:<b>{{ selectedVehicle.mileage.toFixed(2) }}km</b></span>
        </div>

        <div class="progress-row">
          <button class="play-btn" type="button" @click="togglePlay">
            <icon-pause v-if="playing" />
            <icon-play-arrow v-else />
          </button>
          <input
            v-model.number="currentIndex"
            class="timeline"
            :max="selectedVehicle.track.length - 1"
            min="0"
            type="range"
          >
        </div>

        <div class="time-row">
          <span>开始时间: {{ dateRange[0] }}</span>
          <span>结束时间: {{ dateRange[1] }}</span>
        </div>

        <div class="metric-tabs">
          <button
            v-for="tab in chartTabs"
            :key="tab.key"
            class="metric-btn"
            :class="{ active: activeChart === tab.key }"
            type="button"
            @click="switchChart(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="chart-box">
          <div class="chart-title-row">
            <span>
              {{ chartMeta.title }}曲线
              <template v-if="activeChart === 'weight'">({{ chartMeta.unit }})</template>
            </span>
            <label v-if="activeChart === 'weight'" class="load-toggle">
              <input v-model="showLoadPoints" type="checkbox">
              <span>显示装卸点</span>
            </label>
          </div>
          <div class="chart-render-area">
            <div v-if="activeChart === 'weight'" class="weight-curve-image">
              <svg viewBox="0 0 1180 160" preserveAspectRatio="none" role="img" aria-label="称重曲线">
                <polyline
                  class="weight-curve-line"
                  points="42,136 48,112 58,84 72,58 94,40 128,32 164,32 202,26 238,24 276,28 318,28 350,26 386,28 404,30 414,42 420,132 428,140 472,140 486,132 494,105 500,58 512,38 536,32 580,28 632,28 678,24 742,24 768,26 782,38 790,134 808,140 862,140 878,134 890,82 896,22 960,22 1018,24 1040,22 1064,22 1072,68 1080,104 1092,138 1114,142 1150,136"
                />
              </svg>
            </div>
            <TrackChartBox v-else :key="activeChart" :spec="activeChartSpec" />
          </div>
        </div>
      </section>
    </main>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import LonganMapFrame from './components/LonganMapFrame.vue'

defineOptions({ name: 'SanitationHistoryTrackWeighing' })

type VehicleStatus = 'online' | 'charging' | 'offline'
type ChartKey = 'speed' | 'electricity' | 'water' | 'track' | 'stop' | 'weight'

interface TrackPoint {
  time: string
  x: number
  y: number
  speed: number
  electricity: number
  water: number
  weight: number
  lng: number
  lat: number
  location: string
  stop?: boolean
  loadEvent?: '装车点' | '卸车点'
}

interface TrackVehicle {
  id: string
  plateNo: string
  statusClass: VehicleStatus
  mileage: number
  track: TrackPoint[]
}

const baseDate = '2026-07-06'

function createTrack(seed = 0): TrackPoint[] {
  const coords = [
    [16, 23], [16, 24], [16, 24], [36, 24], [36, 42], [44, 42],
    [44, 18], [58, 18], [58, 34], [66, 34], [66, 42], [82, 48],
    [86, 48], [82, 48], [66, 42], [66, 52], [58, 52], [58, 42],
    [44, 42], [44, 60], [66, 60], [66, 70],
  ]
  const eventMap: Record<number, TrackPoint['loadEvent']> = {
    4: '装车点',
    8: '卸车点',
    13: '装车点',
    16: '卸车点',
    19: '装车点',
    21: '卸车点',
  }
  const locations = ['龙凤山景区北侧', '善应镇中转站', '昆玉山区作业点', '安阳爱倩岛南侧', '双峰山雪花洞景区', '鹤山区转运点']

  return coords.map(([x, y], index) => {
    const hour = 6 + Math.floor(index * 0.52)
    const minute = (10 + index * 17 + seed * 3) % 60
    const baseWeight = [
      35, 128, 205, 235, 250, 252, 248, 244, 36, 34, 40,
      228, 244, 250, 252, 30, 24, 28, 270, 268, 270, 34,
    ][index] ?? 0
    const eventIndexes = Object.keys(eventMap).map(Number)
    const eventOrder = eventIndexes.indexOf(index)
    const lng = 114.20 + x / 100 * 0.25 + seed * 0.001
    const lat = 35.95 + y / 100 * 0.17 + seed * 0.001

    return {
      time: `${baseDate} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String((index * 8) % 60).padStart(2, '0')}`,
      x: x + seed * 0.7,
      y: y + seed * 0.4,
      speed: Math.max(0, Math.round(26 + Math.sin(index / 2) * 18 - (index % 7 === 0 ? 24 : 0))),
      electricity: Math.max(28, Math.round(95 - index * 1.4 - seed)),
      water: Math.max(0, Math.round(82 - index * 2.2 + Math.sin(index) * 5)),
      weight: Math.max(0, Math.round(baseWeight + seed * 3)),
      lng,
      lat,
      location: eventOrder >= 0 ? locations[eventOrder] : '安阳市龙安区规划作业路段',
      stop: index === 6 || index === 11 || index === 18,
      loadEvent: eventMap[index],
    }
  })
}

const vehicles = ref<TrackVehicle[]>([
  { id: 'v1', plateNo: '豫E01622D', statusClass: 'online', mileage: 46, track: createTrack(0) },
  { id: 'v2', plateNo: '豫E03100D', statusClass: 'charging', mileage: 38.7, track: createTrack(2) },
  { id: 'v3', plateNo: '豫E00115D', statusClass: 'offline', mileage: 27.4, track: createTrack(4) },
])

const keyword = ref('1622')
const orgOpen = ref(true)
const groupOpen = ref(true)
const selectedVehicleId = ref('v1')
const dateRange = ref<[string, string]>([`${baseDate} 00:00:00`, `${baseDate} 23:59:59`])
const currentIndex = ref(vehicles.value[0].track.length - 1)
const playing = ref(false)
const playSpeed = ref(1)
const activeChart = ref<ChartKey>('electricity')
const showLoadPoints = ref(false)
const selectedLoadPoint = ref<TrackPoint | null>(null)
let timer: number | undefined

const mapFilters = reactive([
  { label: '里程面板', checked: false, className: 'yellow' },
  { label: '停留点', checked: false, className: 'red' },
  { label: '车辆超速路段', checked: false, className: 'red' },
  { label: '规划作业路段', checked: false, className: 'purple' },
  { label: '有效作业路段', checked: false, className: 'green' },
  { label: '上装作业路段', checked: false, className: 'orange' },
])

const chartTabs: Array<{ key: ChartKey, label: string }> = [
  { key: 'speed', label: '速度' },
  { key: 'electricity', label: '电量' },
  { key: 'water', label: '水量' },
  { key: 'track', label: '轨迹点' },
  { key: 'stop', label: '停留点' },
  { key: 'weight', label: '称重' },
]

const playbackSpeeds = [
  { label: '正常', value: 1 },
  { label: '5X', value: 5 },
  { label: '10X', value: 10 },
  { label: '15X', value: 15 },
  { label: '20X', value: 20 },
  { label: '25X', value: 25 },
  { label: '30X', value: 30 },
]

const filteredVehicles = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return vehicles.value
  return vehicles.value.filter(item => item.plateNo.toLowerCase().includes(value))
})

const selectedVehicle = computed(() =>
  vehicles.value.find(item => item.id === selectedVehicleId.value) ?? vehicles.value[0],
)

const visibleTrack = computed(() => selectedVehicle.value.track.slice(0, currentIndex.value + 1))
const firstPoint = computed(() => selectedVehicle.value.track[0])
const lastPoint = computed(() => selectedVehicle.value.track[selectedVehicle.value.track.length - 1])
const currentPoint = computed(() => selectedVehicle.value.track[currentIndex.value] ?? lastPoint.value)
const visibleStopPoints = computed(() => visibleTrack.value.filter(point => point.stop))
const visibleLoadPoints = computed(() =>
  showLoadPoints.value ? selectedVehicle.value.track.filter(point => point.loadEvent) : [],
)
const trackLine = computed(() => visibleTrack.value.map(point => `${point.x},${point.y}`).join(' '))

const chartData = computed(() => {
  const points = activeChart.value === 'weight'
    ? selectedVehicle.value.track
    : visibleTrack.value

  return points.map((point, index) => {
    const valueMap: Record<ChartKey, number> = {
      speed: point.speed,
      electricity: point.electricity,
      water: point.water,
      track: index + 1,
      stop: point.stop ? 1 : 0,
      weight: point.weight,
    }
    return {
      time: point.time.slice(11, 19),
      value: valueMap[activeChart.value],
    }
  })
})

const chartMeta = computed(() => {
  const map: Record<ChartKey, { title: string, field: string, unit: string, color: string, area: string }> = {
    speed: { title: '速度', field: 'speed', unit: 'km/h', color: '#165dff', area: 'rgba(22,93,255,0.12)' },
    electricity: { title: '电量', field: 'electricity', unit: '%', color: '#16a34a', area: 'rgba(22,163,74,0.12)' },
    water: { title: '水量', field: 'water', unit: '%', color: '#0891b2', area: 'rgba(8,145,178,0.12)' },
    track: { title: '轨迹点', field: 'track', unit: '个', color: '#7c3aed', area: 'rgba(124,58,237,0.10)' },
    stop: { title: '停留点', field: 'stop', unit: '次', color: '#dc2626', area: 'rgba(220,38,38,0.10)' },
    weight: { title: '称重', field: 'weight', unit: 'kg', color: '#ff4d4f', area: 'rgba(255,77,79,0.08)' },
  }
  return map[activeChart.value]
})

const activeChartSpec = computed(() => ({
  type: 'line',
  data: [{ id: 'chart', values: chartData.value }],
  xField: 'time',
  yField: 'value',
  padding: [8, 18, 28, 44],
  background: '#eef3fb',
  axes: [
    {
      orient: 'left',
      min: activeChart.value === 'weight' ? 0 : undefined,
      max: activeChart.value === 'weight' ? 300 : undefined,
      label: { style: { fill: '#8a94a6', fontSize: 12 } },
      grid: { style: { stroke: '#dde5f0' } },
      domainLine: { visible: false },
      tick: { visible: false },
    },
    {
      orient: 'bottom',
      label: { style: { fill: '#8a94a6', fontSize: 12 } },
      grid: { visible: false },
      domainLine: { style: { stroke: '#9aa4b2', lineWidth: 2 } },
      tick: { visible: false },
    },
  ],
  line: {
    style: {
      stroke: chartMeta.value.color,
      lineWidth: activeChart.value === 'weight' ? 3 : 2,
    },
  },
  point: { style: { fill: '#fff', stroke: chartMeta.value.color, size: activeChart.value === 'weight' ? 3 : 2 } },
  tooltip: { visible: true },
}))

function switchChart(key: ChartKey) {
  activeChart.value = key
  if (key === 'weight') {
    currentIndex.value = selectedVehicle.value.track.length - 1
  } else {
    showLoadPoints.value = false
    selectedLoadPoint.value = null
  }
}

function pointStyle(point: TrackPoint) {
  return { left: `${point.x}%`, top: `${point.y}%` }
}

function popupStyle(point: TrackPoint) {
  return {
    left: `${Math.min(point.x + 2, 76)}%`,
    top: `${Math.max(point.y - 4, 8)}%`,
  }
}

function selectVehicle(vehicle: TrackVehicle) {
  selectedVehicleId.value = vehicle.id
  resetPlayback()
}

function handleVehicleChange() {
  resetPlayback()
}

function resetView() {
  keyword.value = ''
  dateRange.value = [`${baseDate} 00:00:00`, `${baseDate} 23:59:59`]
  resetPlayback()
}

function resetPlayback() {
  playing.value = false
  clearTimeout(timer)
  currentIndex.value = selectedVehicle.value.track.length - 1
  selectedLoadPoint.value = null
}

function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    if (currentIndex.value >= selectedVehicle.value.track.length - 1) currentIndex.value = 0
    runPlayback()
  } else {
    clearTimeout(timer)
  }
}

function runPlayback() {
  if (!playing.value) return
  if (currentIndex.value >= selectedVehicle.value.track.length - 1) {
    playing.value = false
    return
  }
  currentIndex.value += 1
  timer = window.setTimeout(runPlayback, Math.max(80, 700 / playSpeed.value))
}

watch(playSpeed, () => {
  if (!playing.value) return
  clearTimeout(timer)
  runPlayback()
})

watch(selectedVehicle, () => {
  currentIndex.value = selectedVehicle.value.track.length - 1
  selectedLoadPoint.value = null
})

watch(showLoadPoints, (value) => {
  if (!value) selectedLoadPoint.value = null
})

onBeforeUnmount(() => {
  clearTimeout(timer)
})

const TrackChartBox = defineComponent({
  props: {
    spec: { type: Object, required: true },
  },
  setup(props) {
    const el = ref<HTMLElement>()
    let chart: any
    let ro: ResizeObserver | undefined
    let raf = 0

    async function renderChart() {
      if (!el.value) return
      await nextTick()
      if (!el.value || el.value.clientWidth === 0 || el.value.clientHeight === 0) {
        raf = window.requestAnimationFrame(renderChart)
        return
      }
      const { VChart } = await import('@visactor/vchart')
      if (chart) chart.release()
      chart = new VChart(props.spec, { dom: el.value })
      chart.renderSync()
      if (!ro) {
        ro = new ResizeObserver(() => chart?.resize())
        ro.observe(el.value)
      }
    }

    onMounted(renderChart)
    watch(() => props.spec, renderChart, { deep: true })
    onBeforeUnmount(() => {
      if (raf) window.cancelAnimationFrame(raf)
      ro?.disconnect()
      chart?.release()
    })

    return () => h('div', { ref: el, class: 'chart-canvas', style: { width: '100%', height: '100%' } })
  },
})
</script>

<style scoped lang="scss">
.history-track-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  min-height: 760px;
  padding: 12px;
  overflow: hidden;
  background: #f5f7fc;
}

.track-shell {
  display: flex;
  flex: 1;
  min-height: 0;
  margin-top: 12px;
}

.track-sidebar {
  width: 282px;
  flex-shrink: 0;
  padding: 16px 14px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e8ef;
  border-radius: 4px;
}

.vehicle-search {
  margin-bottom: 16px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 18px;
  color: #4e5969;
  font-size: 14px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
}

.dot {
  width: 10px;
  height: 10px;
  display: inline-block;
  border-radius: 50%;

  &.online {
    background: #00c853;
  }

  &.charging {
    background: #168cff;
  }

  &.offline {
    background: #7d7d7d;
  }
}

.tree-panel {
  color: #1d2129;
  font-size: 15px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  cursor: pointer;

  .arco-icon {
    color: #4e5969;
    transition: transform 0.2s ease;
  }

  .arco-icon.open {
    transform: rotate(90deg);
  }

  &.group {
    padding-left: 24px;
  }
}

.vehicle-tree-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0 0 52px;
}

.vehicle-tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  color: #165dff;
  font-weight: 600;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;

  &.active {
    background: #e8e8ff;
  }
}

.track-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-left: 12px;
  background: #fff;
  border: 1px solid #e5e8ef;
  border-radius: 4px;
}

.prd-panel {
  width: 100%;
  background: var(--color-bg-2);
  border-radius: 4px;
  flex-shrink: 0;

  :deep(.arco-collapse-item-header) {
    font-weight: 600;
    font-size: 14px;
  }
}

.prd-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.prd-section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  tr {
    &:nth-child(even) {
      background: var(--color-fill-1);
    }
  }

  td {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    vertical-align: top;
    line-height: 1.6;
  }

  .prd-label {
    width: 140px;
    min-width: 140px;
    font-weight: 500;
    color: var(--color-text-2);
    white-space: nowrap;
  }

  .prd-value {
    color: var(--color-text-1);
  }
}

.query-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px 10px;

  .vehicle-select {
    width: 260px;
  }

  .range-picker {
    width: 420px;
  }
}

.map-wrap {
  position: relative;
  height: 480px;
  margin: 0 18px;
  overflow: hidden;
  background: #eef3f8;
  border: 1px solid #edf0f5;
}

.route-layer {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.map-filter-card {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 12;
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 10px 14px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 3px;
  transform: translateX(-50%);

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
  }

  input {
    width: 18px;
    height: 18px;
  }

  .yellow {
    color: #eab308;
  }

  .red {
    color: #ef4444;
  }

  .purple {
    color: #8b5cf6;
  }

  .green {
    color: #10b981;
  }

  .orange {
    color: #f59e0b;
  }
}

.start-point,
.end-point,
.stop-point,
.load-point,
.vehicle-current {
  position: absolute;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
}

.start-point,
.end-point,
.stop-point,
.load-point {
  width: 28px;
  height: 28px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 50% 50% 50% 4px;
  box-shadow: 0 2px 8px rgba(29, 33, 41, 0.22);
}

.start-point {
  background: #00b42a;
}

.end-point,
.stop-point {
  background: #f53f3f;
}

.load-point {
  border: 0;
  cursor: pointer;

  &.load {
    background: #ff7d00;
  }

  &.unload {
    background: #f53f3f;
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.08);
  }
}

.vehicle-current {
  width: 30px;
  height: 30px;
  color: #165dff;
  font-size: 22px;
  background: #fff;
  border: 2px solid #165dff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.28);
}

.load-point-popup {
  position: absolute;
  z-index: 20;
  width: 260px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #e5e8ef;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(29, 33, 41, 0.18);

  .popup-title {
    margin-bottom: 8px;
    color: #1d2129;
    font-size: 15px;
    font-weight: 700;
  }

  dl {
    margin: 0;
  }

  div {
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
    font-size: 13px;
  }

  dt {
    width: 40px;
    flex-shrink: 0;
    color: #86909c;
  }

  dd {
    min-width: 0;
    margin: 0;
    color: #1d2129;
    word-break: break-all;
  }

  button {
    height: 24px;
    margin-top: 4px;
    padding: 0 10px;
    color: #165dff;
    background: #f2f6ff;
    border: 1px solid #bedaff;
    border-radius: 4px;
    cursor: pointer;
  }
}

.playback-panel {
  padding: 10px 18px 16px;
}

.speed-row,
.progress-row,
.time-row,
.metric-tabs {
  display: flex;
  align-items: center;
}

.speed-row {
  gap: 12px;
  height: 36px;

  .label {
    color: #4e5969;
    font-weight: 600;
  }

  .mileage {
    margin-left: auto;
    color: #4e5969;

    b {
      margin-left: 2px;
      color: #37c2e6;
    }
  }
}

.pill-btn,
.metric-btn {
  height: 28px;
  padding: 0 18px;
  color: #4e5969;
  background: #fff;
  border: 1px solid #e5e8ef;
  border-radius: 999px;
  cursor: pointer;

  &.active {
    color: #fff;
    background: #1328f6;
    border-color: #1328f6;
  }
}

.progress-row {
  gap: 8px;
}

.play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #fff;
  font-size: 22px;
  background: #1328f6;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.timeline {
  flex: 1;
  accent-color: #1328f6;
}

.time-row {
  justify-content: space-between;
  padding: 4px 58px 8px;
  color: #4e5969;
  font-size: 15px;
  font-weight: 600;
}

.metric-tabs {
  gap: 12px;
  margin-bottom: 10px;
  padding-left: 0;
}

.chart-box {
  display: flex;
  flex-direction: column;
  height: 188px;
  overflow: hidden;
  background: #eef3fb;
}

.chart-title-row {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 28px;
  padding: 8px 14px 0;
  color: #4e5969;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.load-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ff4d4f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    accent-color: #ff4d4f;
  }
}

.chart-render-area {
  flex: 1;
  min-height: 0;
}

.weight-curve-image {
  width: 100%;
  height: 100%;
  padding: 8px 18px 10px;
  background: #eef3fb;

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.weight-curve-line {
  fill: none;
  stroke: #ff4d4f;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 0 rgba(255, 77, 79, 0.12));
}

:deep(.chart-canvas) {
  width: 100%;
  height: 100%;
}
</style>

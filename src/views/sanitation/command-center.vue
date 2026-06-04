<template>
  <div class="command-page">
    <div class="resolution-switch">
      <button :class="{ active: resolutionMode === 'formal' }" @click="resolutionMode = 'formal'">正式分辨率</button>
      <button :class="{ active: resolutionMode === 'test' }" @click="resolutionMode = 'test'">测试分辨率</button>
      <button :class="{ active: showPrd }" @click="showPrd = !showPrd">产品需求</button>
    </div>

    <div class="screen-shell" :class="`mode-${resolutionMode}`">
      <div class="screen-head">
        <div class="head-side">龙安区乡镇生活垃圾智慧环卫平台</div>
        <div class="head-title">数字大屏指挥中心</div>
        <div class="head-side right">{{ nowText }}</div>
      </div>

      <div v-if="showPrd" class="prd-board">
        <div class="prd-title">页面产品需求说明</div>
        <div class="prd-grid">
          <p><b>定位：</b>区级运营指挥大屏，统一查看告警、收运任务、车辆、箱体、中转站、焚烧厂和作业质量。</p>
          <p><b>核心用户：</b>运营主管、调度员、监管人员。</p>
          <p><b>核心流程：</b>告警触发 -> 大屏识别风险区域 -> 告警中心/APP派单 -> 地图跟踪收运轨迹 -> 自动完成与凭证补传 -> SLA和质量复盘。</p>
          <p><b>重点指标：</b>未读告警、待处理告警、收运中任务、超时任务、车辆在线率、箱体满溢率、垃圾量趋势、乡镇排行、任务闭环率。</p>
        </div>
      </div>

      <div class="screen-grid">
        <section class="screen-panel kpi-panel">
          <PanelTitle title="全局运行指标" />
          <div class="screen-metrics">
            <div v-for="item in commandMetrics" :key="item.label" class="screen-metric" :class="`tone-${item.tone || 'normal'}`">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}<em>{{ item.unit }}</em></strong>
              <small>{{ item.trend }}</small>
            </div>
          </div>
        </section>

        <section class="screen-panel left-mid">
          <PanelTitle title="乡镇垃圾量排行" />
          <VChartBox id="town-rank" :spec="townRankSpec" />
        </section>

        <section class="screen-panel left-bottom">
          <PanelTitle title="箱体状态分布" />
          <VChartBox id="box-status" :spec="boxStatusSpec" />
        </section>

        <main class="screen-map">
          <div class="map-title">全域告警与收运态势</div>
          <div class="big-map-bg">
            <LonganMapFrame dark />
            <div class="scan-line" />
            <div
              v-for="line in taskLines"
              :key="line.id"
              class="task-route"
              :class="{ done: line.done, overtime: line.overtime }"
              :style="line.style"
            />
            <div
              v-for="point in commandPoints"
              :key="point.id"
              class="big-point"
              :class="[point.type, `tone-${point.status}`]"
              :style="{ left: `${point.x}%`, top: `${point.y}%` }"
            >
              <span />
              <p>{{ point.name }}</p>
            </div>
          </div>
          <div class="map-bottom">
            <div>车辆定位 <b>{{ vehicleOnlineCount }}</b></div>
            <div>箱体点位 <b>{{ boxes.length }}</b></div>
            <div>待处理告警 <b>{{ pendingAlarmCount }}</b></div>
            <div>收运中任务 <b>{{ runningTaskCount }}</b></div>
            <div>焚烧厂 <b>1</b></div>
          </div>
        </main>

        <section class="screen-panel right-top">
          <PanelTitle title="今日垃圾量趋势" />
          <VChartBox id="waste-trend" :spec="trendSpec" />
        </section>

        <section class="screen-panel right-mid">
          <PanelTitle title="告警类型占比" />
          <VChartBox id="alarm-pie" :spec="alarmPieSpec" />
        </section>

        <section class="screen-panel right-bottom">
          <PanelTitle title="任务状态监控" />
          <VChartBox id="task-status" :spec="taskStatusSpec" />
        </section>

        <section class="screen-panel bottom-left">
          <PanelTitle title="车辆在线与作业结构" />
          <VChartBox id="vehicle-pie" :spec="vehicleStatusSpec" />
        </section>

        <section class="screen-panel bottom-mid">
          <PanelTitle title="SLA闭环趋势" />
          <VChartBox id="sla-line" :spec="slaTrendSpec" />
        </section>

        <section class="screen-panel bottom-right">
          <PanelTitle title="任务与凭证看板" />
          <div class="task-board">
            <div v-for="task in collectionTasks.slice(0, 5)" :key="task.id" class="task-row">
              <span>{{ task.vehicle }}</span>
              <b>{{ task.taskName }}</b>
              <em :class="{ danger: task.overtimeStatus === '已超时', success: task.collectionStatus === '已完成' }">{{ task.collectionStatus }}</em>
              <i>{{ task.proofImages?.length ? '已补传' : '待凭证' }}</i>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LonganMapFrame from './components/LonganMapFrame.vue'
import { alarms, boxes, dashboardMetrics, mapPoints, townWasteRank, trendData, vehicles } from './data/mock'
import { collectionTasks, sanitationAlarms } from './data/alert-task'

defineOptions({ name: 'SanitationCommandCenter' })

const resolutionMode = ref<'formal' | 'test'>('test')
const showPrd = ref(false)
const now = ref(new Date())
const timer = window.setInterval(() => {
  now.value = new Date()
}, 1000)

onBeforeUnmount(() => {
  window.clearInterval(timer)
})

const nowText = computed(() => now.value.toLocaleString('zh-CN', { hour12: false }))
const vehicleOnlineCount = computed(() => vehicles.filter((item) => item.status === '在线').length)
const pendingAlarmCount = computed(() => sanitationAlarms.filter((item) => item.readStatus === '未读' || item.handleStatus === '待处理').length)
const runningTaskCount = computed(() => collectionTasks.filter((item) => ['已接单', '收运中'].includes(item.collectionStatus)).length)
const completedTaskCount = computed(() => collectionTasks.filter((item) => item.collectionStatus === '已完成').length)
const overtimeTaskCount = computed(() => collectionTasks.filter((item) => item.overtimeStatus === '已超时').length)

const commandMetrics = computed(() => [
  ...dashboardMetrics.slice(0, 4),
  { label: '未读告警', value: sanitationAlarms.filter((item) => item.readStatus === '未读').length, unit: '条', trend: `${pendingAlarmCount.value} 条需关注`, tone: 'danger' },
  { label: '收运中任务', value: runningTaskCount.value, unit: '单', trend: `已完成 ${completedTaskCount.value} 单`, tone: 'processing' },
  { label: '任务超时', value: overtimeTaskCount.value, unit: '单', trend: '需调度复核', tone: overtimeTaskCount.value ? 'danger' : 'success' },
  { label: '凭证补传', value: collectionTasks.filter((item) => item.proofImages?.length).length, unit: '张', trend: '驾驶员补传', tone: 'success' },
])

const alarmTypeData = computed(() => {
  const bucket = [...alarms.map((item) => item.alarmType), ...sanitationAlarms.map((item) => item.type)]
    .reduce<Record<string, number>>((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
  return Object.entries(bucket).map(([type, value]) => ({ type, value }))
})

const taskStatusData = computed(() => {
  const statuses = ['待接单', '已接单', '收运中', '已完成']
  return statuses.map((status) => ({
    status,
    value: collectionTasks.filter((item) => item.collectionStatus === status).length,
  }))
})

const vehicleStatusData = computed(() => ['在线', '离线', '充电'].map((status) => ({
  status,
  value: vehicles.filter((item) => item.status === status).length,
})))

const boxStatusData = computed(() => ['正常', '预警', '满溢', '离线'].map((status) => ({
  status,
  small: boxes.filter((item) => item.boxType === '小勾臂箱' && item.status === status).length,
  large: boxes.filter((item) => item.boxType === '大勾臂箱' && item.status === status).length,
})))

const commandPoints = computed(() => [
  ...mapPoints,
  ...sanitationAlarms.slice(0, 5).map((alarm, index) => ({
    id: `alarm-${alarm.id}`,
    name: alarm.boxName,
    type: 'alarm' as const,
    category: alarm.type,
    status: alarm.level === '严重' ? 'danger' as const : 'warning' as const,
    town: alarm.town,
    x: 24 + index * 11,
    y: 24 + (index % 3) * 17,
    value: alarm.handleStatus,
  })),
  ...collectionTasks.slice(0, 4).map((task, index) => {
    const current = [...task.track].reverse().find((point) => point.done) || task.track[0]
    return {
      id: `task-${task.id}`,
      name: task.vehicle,
      type: 'vehicle' as const,
      category: task.taskName,
      status: task.collectionStatus === '已完成' ? 'success' as const : task.overtimeStatus === '已超时' ? 'danger' as const : 'processing' as const,
      town: task.town,
      x: current?.x || 36 + index * 8,
      y: current?.y || 54,
      value: task.collectionStatus,
    }
  }),
])

const taskLines = computed(() => collectionTasks.slice(0, 4).map((task, index) => {
  const start = task.track[0]
  const end = task.track[task.track.length - 1]
  const left = Math.min(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x) || 8
  const height = Math.abs(end.y - start.y) || 8
  return {
    id: task.id,
    done: task.collectionStatus === '已完成',
    overtime: task.overtimeStatus === '已超时',
    style: {
      left: `${left}%`,
      top: `${top + index * 0.8}%`,
      width: `${width}%`,
      transform: `rotate(${end.x >= start.x ? 16 : -16}deg)`,
      '--route-height': `${Math.max(2, height / 5)}px`,
    },
  }
}))

const axisStyle = {
  label: { style: { fill: '#9fc7ff', fontSize: 12 } },
  grid: { style: { stroke: 'rgba(91, 143, 249, 0.16)' } },
  domainLine: { visible: false },
  tick: { visible: false },
}

const trendSpec = computed(() => ({
  type: 'line',
  data: [{ id: 'trend', values: trendData }],
  xField: 'time',
  yField: 'value',
  padding: [18, 20, 28, 42],
  background: 'transparent',
  axes: [{ orient: 'bottom', ...axisStyle }, { orient: 'left', ...axisStyle }],
  line: { style: { stroke: '#22d3ee', lineWidth: 3 } },
  point: { style: { fill: '#ffffff', stroke: '#22d3ee', size: 8 } },
  area: { visible: true, style: { fill: 'linear-gradient(180deg, rgba(34,211,238,0.35), rgba(34,211,238,0.02))' } },
}))

const townRankSpec = computed(() => ({
  type: 'bar',
  data: [{ id: 'town', values: townWasteRank }],
  direction: 'horizontal',
  xField: 'value',
  yField: 'town',
  padding: [12, 24, 24, 76],
  background: 'transparent',
  axes: [{ orient: 'bottom', ...axisStyle }, { orient: 'left', ...axisStyle }],
  bar: { style: { fill: 'linear-gradient(90deg, #1d4ed8, #22d3ee)', cornerRadius: 3 } },
}))

const boxStatusSpec = computed(() => ({
  type: 'bar',
  data: [{ id: 'box', values: boxStatusData.value }],
  xField: 'status',
  yField: ['small', 'large'],
  padding: [18, 18, 28, 34],
  background: 'transparent',
  legends: { visible: true, orient: 'bottom', item: { label: { style: { fill: '#b9d8ff' } } } },
  axes: [{ orient: 'bottom', ...axisStyle }, { orient: 'left', ...axisStyle }],
}))

const alarmPieSpec = computed(() => ({
  type: 'pie',
  data: [{ id: 'alarm', values: alarmTypeData.value }],
  categoryField: 'type',
  valueField: 'value',
  innerRadius: 0.58,
  background: 'transparent',
  color: ['#ef4444', '#f59e0b', '#38bdf8', '#a78bfa', '#22c55e'],
  legends: { visible: true, orient: 'right', item: { label: { style: { fill: '#b9d8ff' } } } },
}))

const taskStatusSpec = computed(() => ({
  type: 'bar',
  data: [{ id: 'task', values: taskStatusData.value }],
  xField: 'status',
  yField: 'value',
  padding: [18, 18, 28, 34],
  background: 'transparent',
  axes: [{ orient: 'bottom', ...axisStyle }, { orient: 'left', ...axisStyle }],
  bar: { style: { fill: 'linear-gradient(180deg, #34d399, #2563eb)', cornerRadius: 4 } },
}))

const vehicleStatusSpec = computed(() => ({
  type: 'pie',
  data: [{ id: 'vehicle', values: vehicleStatusData.value }],
  categoryField: 'status',
  valueField: 'value',
  innerRadius: 0.68,
  background: 'transparent',
  color: ['#22c55e', '#64748b', '#f59e0b'],
  legends: { visible: true, orient: 'bottom', item: { label: { style: { fill: '#b9d8ff' } } } },
}))

const slaTrendSpec = computed(() => ({
  type: 'line',
  data: [{ id: 'sla', values: [
    { time: '08:00', value: 82 },
    { time: '10:00', value: 86 },
    { time: '12:00', value: 89 },
    { time: '14:00', value: 87 },
    { time: '16:00', value: 91 },
    { time: '18:00', value: completedTaskCount.value ? 94 : 88 },
  ] }],
  xField: 'time',
  yField: 'value',
  padding: [18, 18, 28, 42],
  background: 'transparent',
  axes: [{ orient: 'bottom', ...axisStyle }, { orient: 'left', ...axisStyle }],
  line: { style: { stroke: '#a3e635', lineWidth: 3 } },
  point: { style: { fill: '#ecfccb', stroke: '#84cc16', size: 7 } },
}))

const PanelTitle = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props) {
    return () => h('div', { class: 'panel-title' }, [h('span'), props.title])
  },
})

const VChartBox = defineComponent({
  props: {
    id: { type: String, required: true },
    spec: { type: Object, required: true },
  },
  setup(props) {
    const el = ref<HTMLElement>()
    let chart: any
    let resizeObserver: ResizeObserver | undefined

    async function render() {
      if (!el.value) return
      const { VChart } = await import('@visactor/vchart')
      if (chart) chart.release()
      chart = new VChart(props.spec, { dom: el.value })
      chart.renderSync()
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          chart?.resize?.()
        })
        resizeObserver.observe(el.value)
      }
    }

    onMounted(render)
    watch(() => props.spec, render, { deep: true })
    onBeforeUnmount(() => {
      resizeObserver?.disconnect()
      if (chart) chart.release()
    })

    return () => h('div', { ref: el, id: props.id, class: 'vchart-box' })
  },
})
</script>

<style scoped lang="scss">
.command-page {
  position: relative;
  overflow: auto;
  min-height: calc(100vh - 84px);
  padding: 48px 16px 16px;
  background: #050b18;
}

.resolution-switch {
  position: sticky;
  z-index: 20;
  top: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: -36px 0 12px;

  button {
    height: 32px;
    padding: 0 18px;
    color: #bfdbfe;
    cursor: pointer;
    background: rgba(15, 23, 42, 0.88);
    border: 1px solid rgba(56, 189, 248, 0.32);
    border-radius: 4px;

    &.active {
      color: #020617;
      background: #67e8f9;
      box-shadow: 0 0 18px rgba(34, 211, 238, 0.45);
    }
  }
}

.screen-shell {
  position: relative;
  margin: 0 auto;
  color: #dbeafe;
  background:
    linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
    linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
    radial-gradient(circle at 50% 38%, rgba(14, 165, 233, 0.28), transparent 34%),
    #06101f;
  background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%;
}

.mode-formal {
  width: 4810px;
  height: 1568px;
}

.mode-test {
  width: min(100%, 1680px);
  min-width: 1280px;
  aspect-ratio: 16 / 9;
  min-height: 720px;
}

.screen-head {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  align-items: center;
  height: 72px;
  padding: 0 28px;
  background: linear-gradient(180deg, rgba(29, 78, 216, 0.38), rgba(8, 47, 73, 0));
}

.head-title {
  color: #eff6ff;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0;
  text-align: center;
  text-shadow: 0 0 18px rgba(34, 211, 238, 0.8);
}

.head-side {
  color: #93c5fd;
  font-size: 16px;

  &.right {
    text-align: right;
  }
}

.prd-board {
  position: absolute;
  z-index: 15;
  top: 74px;
  right: 22px;
  width: 560px;
  padding: 14px 16px;
  background: rgba(2, 6, 23, 0.94);
  border: 1px solid rgba(125, 211, 252, 0.34);
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.32);
}

.prd-title {
  margin-bottom: 10px;
  color: #e0f2fe;
  font-size: 16px;
  font-weight: 700;
}

.prd-grid {
  display: grid;
  gap: 8px;

  p {
    margin: 0;
    color: #bfdbfe;
    line-height: 1.7;
  }
}

.screen-grid {
  display: grid;
  grid-template-columns: 23% 1fr 23%;
  grid-template-rows: 24% 24% 24% 20%;
  gap: 12px;
  height: calc(100% - 72px);
  padding: 0 16px 16px;
}

.screen-panel,
.screen-map {
  position: relative;
  overflow: hidden;
  padding: 12px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(12, 74, 110, 0.46));
  border: 1px solid rgba(56, 189, 248, 0.32);
  box-shadow: inset 0 0 32px rgba(14, 165, 233, 0.12), 0 0 22px rgba(2, 132, 199, 0.18);
}

.screen-panel::before,
.screen-map::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(120deg, transparent, rgba(125, 211, 252, 0.08), transparent);
  animation: shimmer 5s linear infinite;
  content: '';
}

.panel-title {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #e0f2fe;
  font-size: 16px;
  font-weight: 700;

  span {
    width: 5px;
    height: 18px;
    background: #22d3ee;
    box-shadow: 0 0 12px #22d3ee;
  }
}

.kpi-panel {
  grid-column: 1;
  grid-row: 1;
}

.left-mid {
  grid-column: 1;
  grid-row: 2;
}

.left-bottom {
  grid-column: 1;
  grid-row: 3;
}

.screen-map {
  grid-column: 2;
  grid-row: 1 / 4;
}

.right-top {
  grid-column: 3;
  grid-row: 1;
}

.right-mid {
  grid-column: 3;
  grid-row: 2;
}

.right-bottom {
  grid-column: 3;
  grid-row: 3;
}

.bottom-left {
  grid-column: 2;
  grid-row: 4;
}

.bottom-mid {
  grid-column: 3;
  grid-row: 4;
}

.bottom-right {
  grid-column: 1;
  grid-row: 4;
}

.screen-metrics {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.screen-metric {
  padding: 7px;
  background: rgba(15, 23, 42, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.18);

  span,
  small {
    display: block;
    color: #93c5fd;
    font-size: 11px;
  }

  strong {
    display: block;
    margin: 2px 0;
    color: #f8fafc;
    font-size: 20px;
    line-height: 1.1;

    em {
      margin-left: 3px;
      color: #93c5fd;
      font-size: 11px;
      font-style: normal;
    }
  }
}

.screen-metric.tone-danger strong {
  color: #fca5a5;
}

.screen-metric.tone-warning strong {
  color: #fcd34d;
}

.screen-metric.tone-success strong {
  color: #86efac;
}

.screen-metric.tone-processing strong {
  color: #67e8f9;
}

.map-title {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 18px;
  color: #bfdbfe;
  font-size: 22px;
  font-weight: 700;
  transform: translateX(-50%);
}

.big-map-bg {
  position: absolute;
  inset: 12px;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.16), rgba(2, 6, 23, 0.26));
}

.big-map-bg :deep(.longan-map-frame) {
  height: 100%;
  min-height: 100%;
  border: 0;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.9), transparent);
  animation: scan 4.8s linear infinite;
}

.task-route {
  position: absolute;
  z-index: 2;
  height: var(--route-height, 3px);
  min-height: 3px;
  background: linear-gradient(90deg, rgba(251, 191, 36, 0), rgba(251, 191, 36, 0.86), rgba(251, 191, 36, 0));
  border-radius: 999px;
  transform-origin: left center;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.56);

  &.done {
    background: linear-gradient(90deg, rgba(34, 197, 94, 0), rgba(34, 197, 94, 0.88), rgba(34, 197, 94, 0));
  }

  &.overtime {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0), rgba(239, 68, 68, 0.92), rgba(239, 68, 68, 0));
  }
}

.big-point {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);

  span {
    width: 12px;
    height: 12px;
    border: 2px solid #dbeafe;
    border-radius: 50%;
    box-shadow: 0 0 0 6px rgba(96, 165, 250, 0.12), 0 0 14px rgba(56, 189, 248, 0.6);
  }

  p {
    max-width: 96px;
    margin: 0;
    overflow: hidden;
    color: #dbeafe;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.big-point.tone-danger span {
  background: #ef4444;
  animation: pulse 1.4s infinite;
}

.big-point.tone-warning span {
  background: #f59e0b;
}

.big-point.tone-success span {
  background: #22c55e;
}

.big-point.tone-processing span {
  background: #38bdf8;
}

.big-point.tone-offline span {
  background: #64748b;
}

.big-point.alarm span {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.map-bottom {
  position: absolute;
  z-index: 4;
  right: 18px;
  bottom: 18px;
  left: 18px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;

  div {
    padding: 8px;
    color: #93c5fd;
    font-size: 12px;
    text-align: center;
    background: rgba(2, 6, 23, 0.72);
    border: 1px solid rgba(56, 189, 248, 0.22);
  }

  b {
    display: block;
    margin-top: 2px;
    color: #e0f2fe;
    font-size: 18px;
  }
}

.vchart-box {
  position: relative;
  z-index: 1;
  width: 100%;
  height: calc(100% - 26px);
  min-height: 120px;
}

.task-board {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
}

.task-row {
  display: grid;
  grid-template-columns: 74px 1fr 58px 58px;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  color: #bfdbfe;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.16);

  b {
    overflow: hidden;
    color: #e0f2fe;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em,
  i {
    font-style: normal;
    text-align: right;
  }

  em.danger {
    color: #fca5a5;
  }

  em.success {
    color: #86efac;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

@keyframes scan {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(1000px);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.22), 0 0 16px rgba(239, 68, 68, 0.8);
  }

  50% {
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0.02), 0 0 24px rgba(239, 68, 68, 1);
  }
}
</style>

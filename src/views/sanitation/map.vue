<template>
  <div class="gi_page sanitation-map-page">
    <ModuleHeader
      title="全域地图监管"
      subtitle="围绕告警消息、收运任务单、车辆轨迹和目的地联动监管，支持地图侧派单、强制完成和转单。"
      phase="V2.0"
      priority="P0"
      module="地图监管"
    >
      <template #extra>
        <a-button type="primary" @click="dispatchFirstMapAlarm">
          <template #icon><icon-send /></template>
          地图派单
        </a-button>
        <a-button @click="focusMode = focusMode === 'tasks' ? 'alarms' : 'tasks'">
          <template #icon><icon-sync /></template>
          {{ focusMode === 'tasks' ? '看告警' : '看任务' }}
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="prd-panel">
      <a-collapse :bordered="false">
        <a-collapse-item key="prd" header="产品需求说明">
          <div class="prd-body">
            <p><b>目标用户：</b>PC 端运营人员、调度人员、监管人员。</p>
            <p><b>核心目标：</b>把告警消息、收运任务单、车辆位置、箱体位置、中转站/焚烧厂目的地放到同一地图视图中，支持快速判断和调度。</p>
            <p><b>核心操作：</b>未派单满溢告警可地图派单；未完成任务可强制完成或转单；点击地图点位可查看任务/告警详情。</p>
            <p><b>验收点：</b>图层切换有效；告警点和任务轨迹可视；右侧详情随选中对象切换；任务操作会同步更新共享任务数据。</p>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="map-shell">
      <section class="map-main-panel">
        <div class="map-toolbar">
          <a-checkbox-group v-model="layers">
            <a-checkbox value="vehicle">车辆</a-checkbox>
            <a-checkbox value="box">箱体</a-checkbox>
            <a-checkbox value="station">中转站</a-checkbox>
            <a-checkbox value="plant">焚烧厂</a-checkbox>
            <a-checkbox value="alarm">告警</a-checkbox>
            <a-checkbox value="task">任务</a-checkbox>
          </a-checkbox-group>
          <a-radio-group v-model="focusMode" type="button">
            <a-radio value="realtime">实时态势</a-radio>
            <a-radio value="alarms">告警处理</a-radio>
            <a-radio value="tasks">任务监控</a-radio>
          </a-radio-group>
        </div>

        <div class="smart-map">
          <LonganMapFrame />
          <div
            v-for="line in visibleTaskLines"
            :key="line.id"
            class="task-line"
            :class="{ done: line.status === '已完成', overtime: line.overtimeStatus === '已超时' }"
            :style="line.style"
          ></div>
          <button
            v-for="point in visiblePoints"
            :key="point.id"
            class="smart-point"
            :class="[point.type, `tone-${point.status}`]"
            :style="{ left: `${point.x}%`, top: `${point.y}%` }"
            type="button"
            @click="selectPoint(point)"
          >
            <span></span>
          </button>
        </div>
      </section>

      <aside class="side-panel">
        <div class="panel-title">监管详情</div>
        <template v-if="selectedPoint">
          <div class="detail-card">
            <div class="detail-head">
              <b>{{ selectedPoint.name }}</b>
              <StatusTag :value="selectedPoint.value || selectedPoint.status" />
            </div>
            <a-descriptions :column="1" size="small" bordered>
              <a-descriptions-item label="类型">{{ selectedPoint.category }}</a-descriptions-item>
              <a-descriptions-item label="所属乡镇">{{ selectedPoint.town }}</a-descriptions-item>
              <a-descriptions-item label="状态">{{ selectedPoint.value || selectedPoint.status }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </template>
        <a-empty v-else description="点击地图点位查看详情" />

        <div class="panel-title sub-title">告警消息</div>
        <div class="compact-list">
          <div v-for="alarm in pendingAlarms" :key="alarm.id" class="compact-card">
            <div class="compact-head">
              <b>{{ alarm.boxName }}</b>
              <StatusTag :value="alarm.handleStatus" />
            </div>
            <p>{{ alarm.content }}</p>
            <div class="compact-actions">
              <a-button v-if="alarm.type === '满溢告警'" size="mini" type="primary" @click="dispatchAlarm(alarm)">派单</a-button>
              <a-button size="mini" status="success" @click="markProcessed(alarm)">已处理</a-button>
            </div>
          </div>
        </div>

        <div class="panel-title sub-title">收运任务</div>
        <div class="compact-list">
          <div v-for="task in activeTasks" :key="task.id" class="compact-card">
            <div class="compact-head">
              <b>{{ task.vehicle }}</b>
              <a-space size="mini">
                <StatusTag :value="task.collectionStatus" />
                <StatusTag :value="task.overtimeStatus" />
              </a-space>
            </div>
            <p>{{ task.taskName }} -> {{ task.destinationName }}</p>
            <div class="compact-actions">
              <a-button size="mini" status="danger" :disabled="task.collectionStatus === '已完成'" @click="forceTask(task)">强制完成</a-button>
              <a-button size="mini" :disabled="task.collectionStatus === '已完成'" @click="transferTaskToNext(task)">转单</a-button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message as ArcoMessage } from '@arco-design/web-vue'
import { computed, ref } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import LonganMapFrame from './components/LonganMapFrame.vue'
import { mapPoints, type MapPoint } from './data/mock'
import {
  autoCompleteCollectionTask,
  collectionTasks,
  dispatchAlarmToTask,
  drivers,
  sanitationAlarms,
  transferTask,
  type CollectionTask,
  type SanitationAlarm,
} from './data/alert-task'

defineOptions({ name: 'SanitationMap' })

type SmartMapPoint = MapPoint & { taskId?: string, alarmId?: string }

const layers = ref(['vehicle', 'box', 'station', 'plant', 'alarm', 'task'])
const focusMode = ref('realtime')
const selectedPoint = ref<SmartMapPoint>()

const pendingAlarms = computed(() => sanitationAlarms.filter((item) => item.readStatus === '未读' || item.handleStatus === '待处理').slice(0, 5))
const activeTasks = computed(() => collectionTasks.filter((item) => item.collectionStatus !== '已完成').slice(0, 5))

const metrics = computed(() => [
  { label: '未读告警', value: sanitationAlarms.filter((item) => item.readStatus === '未读').length, unit: '条', tone: 'danger' },
  { label: '待处理', value: sanitationAlarms.filter((item) => item.handleStatus === '待处理').length, unit: '条', tone: 'warning' },
  { label: '收运中', value: collectionTasks.filter((item) => ['已接单', '收运中'].includes(item.collectionStatus)).length, unit: '单' },
  { label: '已超时', value: collectionTasks.filter((item) => item.overtimeStatus === '已超时').length, unit: '单', tone: 'danger' },
  { label: '今日完成', value: collectionTasks.filter((item) => item.collectionStatus === '已完成').length, unit: '单', tone: 'success' },
])

const taskPoints = computed<SmartMapPoint[]>(() => collectionTasks.map((task, index) => {
  const current = [...task.track].reverse().find((point) => point.done) || task.track[0]
  return {
    id: `task-${task.id}`,
    name: task.taskName,
    type: 'vehicle',
    category: `收运任务 · ${task.vehicle}`,
    status: task.collectionStatus === '已完成' ? 'success' : task.overtimeStatus === '已超时' ? 'danger' : 'processing',
    town: task.town,
    x: current?.x || 20 + index * 8,
    y: current?.y || 50,
    value: task.collectionStatus,
    taskId: task.id,
  }
}))

const alarmPoints = computed<SmartMapPoint[]>(() => sanitationAlarms.map((alarm, index) => ({
  id: `alarm-${alarm.id}`,
  name: alarm.boxName,
  type: 'alarm',
  category: alarm.type,
  status: alarm.level === '严重' ? 'danger' : alarm.level === '重要' ? 'warning' : 'processing',
  town: alarm.town,
  x: 18 + index * 13,
  y: 60 - index * 7,
  value: alarm.handleStatus,
  alarmId: alarm.id,
})))

const allPoints = computed<SmartMapPoint[]>(() => [
  ...mapPoints,
  ...alarmPoints.value,
  ...taskPoints.value,
] as SmartMapPoint[])

const visiblePoints = computed(() => allPoints.value.filter((item) => {
  const layerMatched = layers.value.includes(item.taskId ? 'task' : item.type)
  if (!layerMatched) return false
  if (focusMode.value === 'alarms') return item.alarmId || item.type === 'box' || item.type === 'station'
  if (focusMode.value === 'tasks') return item.taskId || item.type === 'vehicle' || item.type === 'station' || item.type === 'plant'
  return true
}))

const visibleTaskLines = computed(() => collectionTasks
  .filter((task) => layers.value.includes('task'))
  .map((task) => {
    const start = task.track[0]
    const end = task.track[task.track.length - 1]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    return {
      id: task.id,
      status: task.collectionStatus,
      overtimeStatus: task.overtimeStatus,
      style: {
        left: `${start.x}%`,
        top: `${start.y}%`,
        width: `${length}%`,
        transform: `rotate(${angle}deg)`,
      },
    }
  }))

function selectPoint(point: SmartMapPoint) {
  selectedPoint.value = point
}

function dispatchAlarm(alarm: SanitationAlarm) {
  if (alarm.type !== '满溢告警') {
    ArcoMessage.warning('非满溢告警暂不派收运任务')
    return
  }
  const task = dispatchAlarmToTask(alarm, alarm.boxType === '大勾臂箱' ? '孙师傅' : '张师傅')
  ArcoMessage.success(`已派单：${task?.taskName}`)
}

function dispatchFirstMapAlarm() {
  const alarm = sanitationAlarms.find((item) => item.type === '满溢告警' && !item.linkedTaskId)
  if (!alarm) {
    ArcoMessage.info('暂无未派单满溢告警')
    return
  }
  dispatchAlarm(alarm)
}

function markProcessed(alarm: SanitationAlarm) {
  alarm.readStatus = '已读'
  alarm.handleStatus = '已处理'
  alarm.offlineRemark = '地图监管侧标记已处理。'
  ArcoMessage.success('已处理')
}

function forceTask(task: CollectionTask) {
  autoCompleteCollectionTask(task, 'force')
  ArcoMessage.success('已强制完成')
}

function transferTaskToNext(task: CollectionTask) {
  const next = drivers.find((item) => item.name !== task.driver && item.vehicleType === task.vehicleType) || drivers.find((item) => item.name !== task.driver)
  if (!next) {
    ArcoMessage.warning('暂无可转单驾驶员')
    return
  }
  transferTask(task, next.name)
  ArcoMessage.success(`已转单至 ${next.name}`)
}
</script>

<style scoped lang="scss">
.sanitation-map-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.prd-panel,
.map-main-panel,
.side-panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.prd-body {
  display: grid;
  gap: 8px;

  p {
    margin: 0;
    line-height: 1.7;
  }
}

.map-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 14px;
  min-width: 0;
}

.map-main-panel,
.side-panel {
  min-width: 0;
}

.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.smart-map {
  position: relative;
  min-height: 620px;
  overflow: hidden;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
}

.smart-point {
  position: absolute;
  z-index: 3;
  width: 22px;
  height: 22px;
  padding: 0;
  color: rgb(var(--arcoblue-6));
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transform: translate(-50%, -50%);

  span {
    position: absolute;
    inset: 5px;
    background: currentColor;
    border-radius: 50%;
  }

  &::after {
    position: absolute;
    inset: -8px;
    border: 1px solid currentColor;
    border-radius: 50%;
    animation: pulse 1.8s infinite;
    content: '';
  }
}

.vehicle {
  border-radius: 4px;
}

.station {
  border-radius: 2px;
}

.plant {
  width: 28px;
  height: 28px;
}

.alarm {
  width: 26px;
  height: 26px;
}

.tone-success { color: rgb(var(--green-6)); }
.tone-processing { color: rgb(var(--arcoblue-6)); }
.tone-warning { color: rgb(var(--orange-6)); }
.tone-danger { color: rgb(var(--red-6)); }
.tone-offline { color: rgb(var(--gray-6)); }

.task-line {
  position: absolute;
  z-index: 2;
  height: 3px;
  background: linear-gradient(90deg, rgba(var(--arcoblue-6), 0.2), rgba(var(--arcoblue-6), 0.75));
  transform-origin: left center;

  &.done {
    background: linear-gradient(90deg, rgba(var(--green-6), 0.2), rgba(var(--green-6), 0.75));
  }

  &.overtime {
    background: linear-gradient(90deg, rgba(var(--red-6), 0.2), rgba(var(--red-6), 0.75));
  }
}

.panel-title {
  margin-bottom: 12px;
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 600;
}

.sub-title {
  margin-top: 18px;
}

.detail-card,
.compact-card {
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 4px;
}

.detail-head,
.compact-head,
.compact-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.detail-head {
  margin-bottom: 12px;
}

.compact-list {
  display: grid;
  gap: 10px;
  max-height: 280px;
  overflow: auto;
}

.compact-card {
  p {
    margin: 8px 0;
    color: var(--color-text-3);
    font-size: 12px;
    line-height: 1.5;
  }
}

.compact-actions {
  justify-content: flex-end;
}

@keyframes pulse {
  from {
    opacity: 0.8;
    transform: scale(0.65);
  }

  to {
    opacity: 0;
    transform: scale(1.8);
  }
}

@media (max-width: 1200px) {
  .map-shell {
    grid-template-columns: 1fr;
  }

  .map-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

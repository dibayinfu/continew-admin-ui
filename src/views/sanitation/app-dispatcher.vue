<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="APP端 - 运营告警处理"
      subtitle="运营人员在移动端查看告警消息，支持满溢告警派单、任务强制完成和转单。"
      phase="APP端"
      priority="P0"
      module="移动端"
    >
      <template #extra>
        <a-button type="primary" @click="dispatchFirstAlarm">
          <template #icon><icon-send /></template>
          一键派单
        </a-button>
      </template>
    </ModuleHeader>

    <div class="prd-panel">
      <a-collapse :bordered="false">
        <a-collapse-item key="prd" header="产品需求说明">
          <div class="prd-body">
            <p><b>目标用户：</b>运营/调度人员。</p>
            <p><b>核心流程：</b>收到箱体满溢/低电量/离线消息 -> 查看消息 -> 满溢消息派单 -> 监控司机接单与执行 -> 必要时强制完成或转单。</p>
            <p><b>状态边界：</b>消息只维护阅读状态和处理状态；任务单维护收运状态、超时状态、司机、车辆、轨迹和凭证。</p>
            <p><b>验收点：</b>满溢消息可派单；已派单消息可查看任务；未完成任务可强制完成；未完成任务可转给其他驾驶员。</p>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-header">
          <span class="time">10:18</span>
          <span class="battery">87%</span>
        </div>

        <div class="phone-content">
          <div class="app-top-bar">
            <div>
              <span class="app-title">运营消息</span>
              <p>满溢告警优先派单，低电量线下处理</p>
            </div>
            <span class="operator-name">王调度</span>
          </div>

          <div class="app-status-bar">
            <div class="status-item">
              <span class="status-label">未读</span>
              <span class="status-value danger">{{ unreadCount }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">待处理</span>
              <span class="status-value warning">{{ pendingCount }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">收运中</span>
              <span class="status-value success">{{ runningCount }}</span>
            </div>
          </div>

          <div class="app-section-title">告警消息</div>
          <div class="alert-list">
            <div v-for="alarm in alarms" :key="alarm.id" class="alert-card">
              <div class="alert-header">
                <b>{{ alarm.boxName }}</b>
                <a-space size="mini">
                  <StatusTag :value="alarm.readStatus" />
                  <StatusTag :value="alarm.handleStatus" />
                </a-space>
              </div>
              <p>{{ alarm.content }}</p>
              <div class="alert-meta">
                <span>{{ alarm.type }}</span>
                <span>{{ alarm.triggerTime }}</span>
              </div>
              <div class="alert-actions">
                <a-button v-if="alarm.type === '满溢告警'" size="mini" type="primary" @click="dispatchAlarm(alarm)">
                  派单
                </a-button>
                <a-button size="mini" @click="markPending(alarm)">待处理</a-button>
                <a-button size="mini" status="success" @click="markProcessed(alarm)">已处理</a-button>
              </div>
            </div>
          </div>

          <div class="app-section-title">任务管控</div>
          <div class="task-list">
            <div v-for="task in activeTasks" :key="task.id" class="task-card">
              <div class="task-header">
                <b>{{ task.taskName }}</b>
                <StatusTag :value="task.collectionStatus" />
              </div>
              <p>{{ task.driver }} · {{ task.vehicle }} · {{ task.destinationName }}</p>
              <div class="task-actions">
                <a-button size="mini" status="danger" :disabled="task.collectionStatus === '已完成'" @click="forceTask(task)">
                  强制完成
                </a-button>
                <a-button size="mini" :disabled="task.collectionStatus === '已完成'" @click="transferTaskToNext(task)">
                  转单
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <div class="phone-bottom-bar">
          <span class="nav-item active">消息</span>
          <span class="nav-item">任务</span>
          <span class="nav-item">地图</span>
          <span class="nav-item">我的</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message as ArcoMessage } from '@arco-design/web-vue'
import { computed } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'
import StatusTag from './components/StatusTag.vue'
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

defineOptions({ name: 'SanitationAppDispatcher' })

const alarms = computed(() => sanitationAlarms)
const activeTasks = computed(() => collectionTasks.filter((item) => item.collectionStatus !== '已完成').slice(0, 4))
const unreadCount = computed(() => sanitationAlarms.filter((item) => item.readStatus === '未读').length)
const pendingCount = computed(() => sanitationAlarms.filter((item) => item.handleStatus === '待处理').length)
const runningCount = computed(() => collectionTasks.filter((item) => ['已接单', '收运中'].includes(item.collectionStatus)).length)

function dispatchAlarm(alarm: SanitationAlarm) {
  if (alarm.type !== '满溢告警') {
    ArcoMessage.warning('非满溢消息暂不创建收运任务单')
    return
  }
  const defaultDriver = alarm.boxType === '大勾臂箱' ? '孙师傅' : '张师傅'
  const task = dispatchAlarmToTask(alarm, defaultDriver)
  ArcoMessage.success(`已派单：${task?.driver} ${task?.vehicle}`)
}

function dispatchFirstAlarm() {
  const alarm = sanitationAlarms.find((item) => item.type === '满溢告警' && !item.linkedTaskId)
  if (!alarm) {
    ArcoMessage.info('暂无未派单的满溢告警')
    return
  }
  dispatchAlarm(alarm)
}

function markPending(alarm: SanitationAlarm) {
  alarm.readStatus = '已读'
  alarm.handleStatus = '待处理'
  alarm.offlineRemark = 'APP端运营人员标记待处理。'
  ArcoMessage.success('已标记待处理')
}

function markProcessed(alarm: SanitationAlarm) {
  alarm.readStatus = '已读'
  alarm.handleStatus = '已处理'
  alarm.offlineRemark = 'APP端运营人员标记已处理。'
  ArcoMessage.success('已标记已处理')
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
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.prd-panel {
  padding: 12px 16px;
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

.phone-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.phone-frame {
  width: 390px;
  min-height: 760px;
  overflow: hidden;
  background: #f4f7fb;
  border: 3px solid #1f2937;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
}

.phone-header,
.app-top-bar,
.phone-bottom-bar,
.alert-header,
.task-header,
.alert-meta,
.alert-actions,
.task-actions {
  display: flex;
  align-items: center;
}

.phone-header {
  justify-content: space-between;
  padding: 12px 20px 8px;
  color: #475467;
  background: #fff;
  font-size: 12px;
}

.phone-content {
  max-height: 690px;
  overflow: auto;
  padding: 0 16px 16px;
}

.app-top-bar {
  justify-content: space-between;
  padding: 14px 0;

  p {
    margin: 4px 0 0;
    color: #667085;
    font-size: 12px;
  }
}

.app-title {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.operator-name {
  color: rgb(var(--arcoblue-6));
  font-size: 13px;
  font-weight: 600;
}

.app-status-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.status-item,
.alert-card,
.task-card {
  background: #fff;
  border-radius: 10px;
}

.status-item {
  padding: 12px 8px;
  text-align: center;
}

.status-label {
  color: #667085;
  font-size: 12px;
}

.status-value {
  display: block;
  margin-top: 4px;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
}

.danger { color: rgb(var(--red-6)); }
.warning { color: rgb(var(--orange-6)); }
.success { color: rgb(var(--green-6)); }

.app-section-title {
  margin: 14px 0 8px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.alert-list,
.task-list {
  display: grid;
  gap: 10px;
}

.alert-card,
.task-card {
  padding: 12px;
}

.alert-header,
.task-header {
  justify-content: space-between;
  gap: 8px;

  b {
    color: #111827;
    font-size: 14px;
    line-height: 1.4;
  }
}

.alert-card p,
.task-card p {
  margin: 6px 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}

.alert-meta {
  justify-content: space-between;
  color: #98a2b3;
  font-size: 11px;
}

.alert-actions,
.task-actions {
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

.phone-bottom-bar {
  justify-content: space-around;
  padding: 10px 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.nav-item {
  color: #98a2b3;
  font-size: 12px;
}

.nav-item.active {
  color: rgb(var(--arcoblue-6));
  font-weight: 600;
}
</style>

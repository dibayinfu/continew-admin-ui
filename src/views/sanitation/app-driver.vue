<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="APP端 - 驾驶员收运任务"
      subtitle="驾驶员接单、查看路线和补传完成凭证；任务完成由系统根据到达目的地自动判定。"
      phase="APP端"
      priority="P0"
      module="移动端"
    >
      <template #extra>
        <a-button type="primary" @click="acceptFirstTask">
          <template #icon><icon-check /></template>
          接单
        </a-button>
      </template>
    </ModuleHeader>

    <div class="prd-panel">
      <a-collapse :bordered="false">
        <a-collapse-item key="prd" header="产品需求说明">
          <div class="prd-body">
            <p><b>目标用户：</b>小勾臂车/大勾臂车驾驶员。</p>
            <p><b>核心流程：</b>收到任务 -> 接单 -> 到达箱体并装车 -> 系统跟踪轨迹并自动完成 -> 驾驶员补传凭证照片。</p>
            <p><b>关键约束：</b>驾驶员不需要手动点完成；完成由系统根据轨迹/目的地到达自动产生，APP 只提供补传凭证入口。</p>
            <p><b>验收点：</b>待接单任务可接单；收运中任务可模拟自动完成；已完成未有凭证时可补传照片。</p>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-header">
          <span class="time">10:22</span>
          <span class="battery">91%</span>
        </div>

        <div class="phone-content">
          <div class="app-top-bar">
            <div>
              <span class="app-title">我的收运任务</span>
              <p>系统自动完成，驾驶员补传凭证</p>
            </div>
            <span class="driver-name">{{ currentDriver }}</span>
          </div>

          <div class="app-status-bar">
            <div class="status-item">
              <span class="status-label">待接单</span>
              <span class="status-value warning">{{ pendingTasks.length }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">收运中</span>
              <span class="status-value">{{ runningTasks.length }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">待补传</span>
              <span class="status-value danger">{{ needProofTasks.length }}</span>
            </div>
          </div>

          <div class="app-section-title">任务列表</div>
          <div class="task-list">
            <div v-for="task in driverTasks" :key="task.id" class="task-card">
              <div class="task-header">
                <b>{{ task.taskName }}</b>
                <StatusTag :value="task.collectionStatus" />
              </div>
              <p>{{ task.startAddress }}</p>
              <div class="task-meta">
                <span>{{ task.destinationName }}</span>
                <span>{{ task.slaMinutes }}min</span>
                <StatusTag :value="task.overtimeStatus" />
              </div>
              <div class="route-mini">
                <span v-for="point in task.track" :key="point.label" :class="{ done: point.done }"></span>
              </div>
              <div class="task-actions">
                <a-button v-if="task.collectionStatus === '待接单'" size="mini" type="primary" @click="acceptTask(task)">
                  接单
                </a-button>
                <a-button v-if="task.collectionStatus !== '已完成'" size="mini" @click="autoFinish(task)">
                  模拟自动完成
                </a-button>
                <a-button v-if="task.collectionStatus === '已完成'" size="mini" status="success" @click="uploadProof(task)">
                  补传凭证
                </a-button>
              </div>
              <div v-if="task.proofImages?.length" class="proof-state">
                <icon-camera /> 已补传凭证
              </div>
            </div>
          </div>
        </div>

        <div class="phone-bottom-bar">
          <span class="nav-item active">任务</span>
          <span class="nav-item">路线</span>
          <span class="nav-item">凭证</span>
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
  acceptCollectionTask,
  autoCompleteCollectionTask,
  collectionTasks,
  uploadCollectionProof,
  type CollectionTask,
} from './data/alert-task'

defineOptions({ name: 'SanitationAppDriver' })

const currentDriver = '张师傅'
const driverTasks = computed(() => collectionTasks.filter((item) => item.driver === currentDriver || item.collectionStatus === '待接单').slice(0, 5))
const pendingTasks = computed(() => driverTasks.value.filter((item) => item.collectionStatus === '待接单'))
const runningTasks = computed(() => driverTasks.value.filter((item) => ['已接单', '收运中'].includes(item.collectionStatus)))
const needProofTasks = computed(() => driverTasks.value.filter((item) => item.collectionStatus === '已完成' && !item.proofImages?.length))

function acceptTask(task: CollectionTask) {
  acceptCollectionTask(task)
  ArcoMessage.success('已接单')
}

function acceptFirstTask() {
  const task = pendingTasks.value[0]
  if (!task) {
    ArcoMessage.info('暂无待接单任务')
    return
  }
  acceptTask(task)
}

function autoFinish(task: CollectionTask) {
  autoCompleteCollectionTask(task)
  ArcoMessage.success('系统已自动完成，等待补传凭证')
}

function uploadProof(task: CollectionTask) {
  uploadCollectionProof(task)
  ArcoMessage.success('凭证照片已补传')
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
.task-header,
.task-meta,
.task-actions,
.proof-state {
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

.driver-name {
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
  color: rgb(var(--arcoblue-6));
  font-size: 20px;
  font-weight: 700;
}

.danger { color: rgb(var(--red-6)); }
.warning { color: rgb(var(--orange-6)); }

.app-section-title {
  margin: 14px 0 8px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
}

.task-list {
  display: grid;
  gap: 10px;
}

.task-card {
  padding: 12px;
}

.task-header {
  justify-content: space-between;
  gap: 8px;

  b {
    color: #111827;
    font-size: 14px;
    line-height: 1.4;
  }
}

.task-card p {
  margin: 6px 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}

.task-meta {
  justify-content: space-between;
  gap: 8px;
  color: #98a2b3;
  font-size: 11px;
}

.route-mini {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 10px 0;

  span {
    height: 4px;
    background: #d0d5dd;
    border-radius: 99px;
  }

  .done {
    background: rgb(var(--arcoblue-6));
  }
}

.task-actions {
  justify-content: flex-end;
  gap: 6px;
}

.proof-state {
  gap: 6px;
  margin-top: 8px;
  color: rgb(var(--green-6));
  font-size: 12px;
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

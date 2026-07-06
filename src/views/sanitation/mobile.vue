<template>
  <div class="gi_page mobile-prototypes">
    <ModuleHeader
      :title="title"
      :subtitle="subtitle"
      :phase="phase"
      :priority="priority"
      :module="module"
    />
    <a-grid :cols="{ xs: 1, md: 2, xl: 4 }" :col-gap="18" :row-gap="18">
      <a-grid-item v-for="phone in phones" :key="phone.title">
        <div class="phone">
          <div class="phone-header">
            <span>9:41</span>
            <span>{{ phone.role }}</span>
          </div>
          <div class="phone-title">{{ phone.title }}</div>
          <div class="phone-metrics">
            <div v-for="metric in phone.metrics" :key="metric.label">
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </div>
          </div>
          <div class="phone-list">
            <div v-for="item in phone.items" :key="item.title" class="phone-item">
              <div>
                <b>{{ item.title }}</b>
                <p>{{ item.desc }}</p>
                <a-button v-if="item.action" size="mini" type="primary" class="phone-action" @click="item.action.handler">
                  {{ item.action.label }}
                </a-button>
              </div>
              <StatusTag :value="item.status" />
            </div>
          </div>
          <div class="phone-nav">
            <span v-for="nav in phone.navs" :key="nav">{{ nav }}</span>
          </div>
        </div>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import StatusTag from './components/StatusTag.vue'
import {
  acceptCollectionTask,
  autoCompleteCollectionTask,
  collectionTasks,
  dispatchAlarmToTask,
  drivers,
  sanitationAlarms,
  transferTask,
  uploadCollectionProof,
} from './data/alert-task'

const props = defineProps<{
  type: 'app' | 'mini'
}>()

const isMini = computed(() => props.type === 'mini')
const title = computed(() => isMini.value ? '小程序端原型' : 'APP 端原型')
const subtitle = computed(() => isMini.value
  ? '面向政府监管用户和乡镇用户，轻量展示项目概况、今日运行和异常查看。'
  : '面向驾驶员、保洁员、站点管理员和调度员，提供告警、收运任务单和数据简报。')
const phase = computed(() => isMini.value ? 'V2.0' : 'V1.5 / V2.0')
const priority = computed(() => isMini.value ? 'P2' : 'P1')
const module = computed(() => isMini.value ? '小程序端' : 'APP 端')
const firstPendingTask = computed(() => collectionTasks.find((item) => item.collectionStatus === '待接单') || collectionTasks[0])
const firstAlarm = computed(() => sanitationAlarms.find((item) => item.readStatus === '未读' || item.starred) || sanitationAlarms[0])

function toggleAlarmStar() {
  firstAlarm.value.starred = !firstAlarm.value.starred
  if (firstAlarm.value.readStatus === '未读') firstAlarm.value.readStatus = '已读'
  firstAlarm.value.offlineRemark = firstAlarm.value.starred ? '移动端已添加星标。' : '移动端已取消星标。'
  ArcoMessage.success(firstAlarm.value.starred ? '已添加星标' : '已取消星标')
}

function dispatchAlarm() {
  if (firstAlarm.value.type !== '满溢告警') {
    ArcoMessage.warning('非满溢消息暂不创建收运任务单')
    return
  }
  dispatchAlarmToTask(firstAlarm.value, firstAlarm.value.boxType === '大勾臂箱' ? '孙师傅' : '张师傅')
  ArcoMessage.success('已派单')
}

function forceTask() {
  autoCompleteCollectionTask(firstPendingTask.value, 'force')
  ArcoMessage.success('已强制完成')
}

function transferTaskToNext() {
  const next = drivers.find((item) => item.name !== firstPendingTask.value.driver && item.vehicleType === firstPendingTask.value.vehicleType)
    || drivers.find((item) => item.name !== firstPendingTask.value.driver)
  if (!next) return
  transferTask(firstPendingTask.value, next.name)
  ArcoMessage.success(`已转单至 ${next.name}`)
}

function acceptTask() {
  acceptCollectionTask(firstPendingTask.value)
  ArcoMessage.success('已接单')
}

function autoFinishTask() {
  autoCompleteCollectionTask(firstPendingTask.value)
  ArcoMessage.success('系统已自动完成')
}

function uploadProof() {
  uploadCollectionProof(firstPendingTask.value)
  ArcoMessage.success('凭证照片已补传')
}

const phones = computed(() => isMini.value ? [
  {
    title: '项目概况',
    role: '区级监管',
    metrics: [{ label: '垃圾量(t)', value: '107.3' }, { label: '在线车辆', value: '49' }],
    items: [
      { title: '全区今日运行', desc: '8个乡镇、157个行政村', status: '正常' },
      { title: '箱体异常', desc: '满溢11个，离线4个', status: '预警' },
      { title: '主动安全', desc: '严重告警3条', status: '未处理' },
    ],
    navs: ['概况', '异常', '简报'],
  },
  {
    title: '异常查看',
    role: '乡镇用户',
    metrics: [{ label: '本乡镇异常', value: '6' }, { label: '待处理', value: '3' }],
    items: [
      { title: '牛家窑2号箱满溢', desc: '91%，建议安排清运', status: '未处理' },
      { title: 'GPS离线', desc: '豫E2M883超过30分钟未上报', status: '已查看' },
      { title: '低电量提醒', desc: '马投涧压缩箱C电量67%', status: '预警' },
    ],
    navs: ['异常', '详情', '我的'],
  },
] : [
  {
    title: '告警消息',
    role: '运营人员',
    metrics: [{ label: '未读', value: sanitationAlarms.filter((item) => item.readStatus === '未读').length }, { label: '星标', value: sanitationAlarms.filter((item) => item.starred).length }],
    items: [
      { title: firstAlarm.value.boxName, desc: `${firstAlarm.value.type}，${firstAlarm.value.content}`, status: firstAlarm.value.starred ? '已星标' : '未星标', action: firstAlarm.value.type === '满溢告警' ? { label: '派单', handler: dispatchAlarm } : { label: firstAlarm.value.starred ? '取消星标' : '添加星标', handler: toggleAlarmStar } },
      { title: '陈家庄2号低电量', desc: '电量 8%，线下换电池后可添加星标关注', status: '未星标', action: { label: '添加星标', handler: toggleAlarmStar } },
      { title: '任务管控', desc: `${firstPendingTask.value.driver} · ${firstPendingTask.value.vehicle}`, status: firstPendingTask.value.collectionStatus, action: { label: '强制完成', handler: forceTask } },
    ],
    navs: ['消息', '告警', '处理', '我的'],
  },
  {
    title: '收运任务',
    role: '驾驶员',
    metrics: [{ label: '待接单', value: collectionTasks.filter((item) => item.collectionStatus === '待接单').length }, { label: '收运中', value: collectionTasks.filter((item) => item.collectionStatus === '收运中').length }],
    items: [
      { title: firstPendingTask.value.taskName, desc: `${firstPendingTask.value.startAddress} → ${firstPendingTask.value.destinationName}`, status: firstPendingTask.value.collectionStatus, action: { label: '接单', handler: acceptTask } },
      { title: '车辆与时效', desc: `${firstPendingTask.value.vehicle}，${firstPendingTask.value.slaMinutes}分钟内完成`, status: firstPendingTask.value.priority },
      { title: '导航地址', desc: firstPendingTask.value.destinationAddress, status: firstPendingTask.value.overtimeStatus === '已超时' ? '已超时' : '正常' },
    ],
    navs: ['任务', '导航', '轨迹', '我的'],
  },
  {
    title: '任务处理',
    role: '驾驶员',
    metrics: [{ label: '当前状态', value: firstPendingTask.value.collectionStatus }, { label: '耗时', value: firstPendingTask.value.durationText }],
    items: [
      { title: '系统自动完成', desc: firstPendingTask.value.destinationName, status: firstPendingTask.value.collectionStatus, action: { label: '模拟自动完成', handler: autoFinishTask } },
      { title: '补传凭证照片', desc: '司机只补传照片，不手动完成任务', status: firstPendingTask.value.proofImages?.length ? '已完成' : '待处理', action: { label: '补传凭证', handler: uploadProof } },
      { title: '运营转单', desc: '任务异常时由运营人员调整驾驶员', status: firstPendingTask.value.driver, action: { label: '转单', handler: transferTaskToNext } },
    ],
    navs: ['处理', '拍照', '完成', '我的'],
  },
])
</script>

<style scoped lang="scss">
.mobile-prototypes {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.phone {
  overflow: hidden;
  min-height: 680px;
  padding: 18px;
  color: #111827;
  background: #f3f6fb;
  border: 10px solid #101828;
  border-radius: 34px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.phone-header {
  display: flex;
  justify-content: space-between;
  color: #475467;
  font-size: 12px;
}

.phone-title {
  margin: 22px 0 16px;
  font-size: 22px;
  font-weight: 700;
}

.phone-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  div {
    padding: 12px;
    background: #fff;
    border-radius: 8px;
  }

  strong {
    display: block;
    color: #165dff;
    font-size: 24px;
  }

  span {
    color: #667085;
    font-size: 12px;
  }
}

.phone-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.phone-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
  background: #fff;
  border-radius: 8px;

  p {
    margin: 6px 0 0;
    color: #667085;
    font-size: 12px;
  }
}

.phone-action {
  margin-top: 10px;
}

.phone-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 18px;
  padding: 12px;
  color: #475467;
  text-align: center;
  background: #fff;
  border-radius: 12px;
}
</style>

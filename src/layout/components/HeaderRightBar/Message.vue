<template>
  <div class="message">
    <section class="alarm-section">
      <div class="alarm-header">
        <span>垃圾收运</span>
        <a-tag color="red" size="small">{{ collectionMessages.length }} 条</a-tag>
      </div>
      <div
        v-for="item in collectionMessages"
        :key="item.id"
        class="alarm-item"
        :class="{ unread: item.readStatus === '未读' }"
        @click="openCollectionAlarm(item.id)"
      >
        <div class="alarm-title"><b>{{ item.type }}</b><span>{{ item.triggerTime }}</span></div>
        <p>{{ item.boxName }}：{{ item.content }}</p>
      </div>
      <div class="alarm-footer">
        <a class="more-btn" @click="openCollectionList">查看更多 <icon-right /></a>
        <a @click="readAllCollection">全部已读</a>
      </div>
    </section>

    <section class="alarm-section vehicle-section">
      <div class="alarm-header">
        <span>车辆告警</span>
        <a-tag color="orangered" size="small">{{ vehicleMessages.length }} 条</a-tag>
      </div>
      <div
        v-for="item in vehicleMessages"
        :key="item.id"
        class="alarm-item vehicle-item"
        :class="{ unread: item.readStatus === '未读' }"
        @click="openVehicleAlarm(item.id)"
      >
        <div class="alarm-title"><b>{{ item.type }}</b><span>{{ item.triggerTime }}</span></div>
        <p>{{ item.plateNo }}：{{ item.content }}</p>
      </div>
      <div class="alarm-footer">
        <a class="more-btn" @click="openVehicleList">查看更多 <icon-right /></a>
        <a @click="readAllVehicle">全部已读</a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import router from '@/router'
import { sanitationAlarms } from '@/views/sanitation/data/alert-task'
import { vehicleAlarms } from '@/views/sanitation/data/vehicle-alert'

const collectionMessages = computed(() => [...sanitationAlarms]
  .sort((a, b) => new Date(b.triggerTime).getTime() - new Date(a.triggerTime).getTime())
  .slice(0, 3))

const vehicleMessages = computed(() => [...vehicleAlarms]
  .sort((a, b) => new Date(b.triggerTime).getTime() - new Date(a.triggerTime).getTime())
  .slice(0, 3))

const openCollectionAlarm = (alarmId: string) => {
  const alarm = sanitationAlarms.find((item) => item.id === alarmId)
  if (alarm?.readStatus === '未读') alarm.readStatus = '已读'
  if (!alarm || alarm.type !== '满溢告警') return
  router.push({
    path: '/sanitation/workOrderCreate',
    query: { focusAlarmId: alarmId, source: 'notification' },
  })
}

const openVehicleAlarm = (alarmId: string) => {
  const alarm = vehicleAlarms.find((item) => item.id === alarmId)
  if (alarm?.readStatus === '未读') alarm.readStatus = '已读'
  Message.info('车辆告警相关功能沿用系统现有功能，不在本次开发范围内')
}

const openCollectionList = () => router.push('/sanitation/workOrderCreate')
const openVehicleList = () => router.push('/sanitation/safetyAlarm')

const readAllCollection = () => {
  sanitationAlarms.forEach((item) => { item.readStatus = '已读' })
  Message.success('垃圾收运告警已全部标记为已读')
}

const readAllVehicle = () => {
  vehicleAlarms.forEach((item) => { item.readStatus = '已读' })
  Message.success('车辆告警已全部标记为已读')
}
</script>

<style scoped lang="scss">
.message {
  width: 360px;
  max-height: 720px;
  overflow-y: auto;

  .alarm-section { padding: 12px 12px 0; }
  .vehicle-section { border-top: 8px solid var(--color-fill-2); }
  .alarm-header, .alarm-title, .alarm-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .alarm-header { margin-bottom: 8px; font-size: 14px; font-weight: 600; }
  .alarm-item {
    padding: 10px;
    border-radius: var(--border-radius-medium);
    background: rgba(var(--red-1), 0.55);
    cursor: pointer;
    & + .alarm-item { margin-top: 8px; }
    &.unread { box-shadow: inset 3px 0 rgb(var(--red-6)); }
    p { margin: 6px 0 0; color: var(--color-text-2); font-size: 12px; line-height: 1.5; }
  }
  .vehicle-item { background: rgba(var(--orange-1), 0.65); }
  .alarm-title {
    b { color: rgb(var(--red-6)); font-size: 13px; }
    span { color: var(--color-text-4); font-size: 12px; }
  }
  .vehicle-item .alarm-title b { color: rgb(var(--orange-6)); }
  .alarm-footer {
    margin-top: 8px;
    padding: 10px 2px;
    border-top: 1px solid var(--color-border-2);
    color: rgb(var(--arcoblue-6));
    font-size: 12px;
    .more-btn { margin-right: auto; }
  }
}
</style>

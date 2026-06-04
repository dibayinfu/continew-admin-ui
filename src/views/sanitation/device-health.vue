<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="设备健康管理"
      subtitle="GPS、称重、满溢设备等在线状态与异常监测，实时掌握设备运行状况。"
      phase="三期"
      priority="P1"
      module="设备管理"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-sync /></template>
          批量巡检
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          告警阈值配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索设备编号/绑定对象" allow-clear class="search-input" />
          <a-select v-model="typeFilter" class="filter-select">
            <a-option v-for="item in typeFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-select v-model="statusFilter" class="filter-select">
            <a-option v-for="item in statusFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>
            新增设备
          </a-button>
          <a-button type="outline">
            <template #icon><icon-sync /></template>
            刷新
          </a-button>
        </a-space>
      </div>

      <a-table
        row-key="id"
        :data="filteredRows"
        :columns="tableColumns"
        :pagination="{ pageSize: 8, showTotal: true, showJumper: true }"
        :scroll="{ x: 1500 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'online' || column.dataIndex === 'healthLevel'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">详情</a-link>
            <a-link status="warning">远程重启</a-link>
          </a-space>
        </template>
      </a-table>
    </div>

    <EditModal
      v-model:visible="editModalVisible"
      :fields="editFields"
      :record="editRecord"
      :is-edit="isEdit"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import EditModal from './components/EditModal.vue'
import type { FormField } from './components/EditModal.vue'
import { deviceHealthList } from './data/mock-enhanced'
import type { DeviceHealth } from './data/mock-enhanced'

defineOptions({ name: 'SanitationDeviceHealth' })

const keyword = ref('')
const typeFilter = ref('全部类型')
const statusFilter = ref('全部状态')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const typeFilters = ['全部类型', 'GPS定位', '满溢设备', '称重设备', '电子锁']
const statusFilters = ['全部状态', '正常', '预警', '离线']

const metrics = [
  { label: '设备总数', value: 6, unit: '台' },
  { label: '在线设备', value: 4, unit: '台', tone: 'success' },
  { label: '离线设备', value: 2, unit: '台', tone: 'danger' },
  { label: '健康率', value: '66.7%', unit: '' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '设备类型', dataIndex: 'deviceType' },
  { title: '设备编号', dataIndex: 'deviceNo' },
  { title: '绑定对象', dataIndex: 'bindObject', ellipsis: true, tooltip: true },
  { title: '绑定类型', dataIndex: 'bindType' },
  { title: '在线状态', dataIndex: 'online' },
  { title: '电量', dataIndex: 'batteryText' },
  { title: '最后上报', dataIndex: 'lastReport', width: 180 },
  { title: '上报间隔', dataIndex: 'reportInterval' },
  { title: '异常次数', dataIndex: 'errorCount' },
  { title: '健康分', dataIndex: 'healthScore' },
  { title: '健康等级', dataIndex: 'healthLevel' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 220, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'deviceType', label: '设备类型', type: 'select', options: ['GPS定位', '满溢设备', '称重设备', '电子锁'] },
  { key: 'deviceNo', label: '设备编号', type: 'input', rules: [{ required: true, message: '请输入设备编号' }] },
  { key: 'bindObject', label: '绑定对象', type: 'input' },
  { key: 'bindType', label: '绑定类型', type: 'select', options: ['小三轮', '小勾臂车', '大勾臂车', '小勾臂箱', '移动压缩箱'] },
  { key: 'online', label: '在线状态', type: 'select', options: ['在线', '离线'] },
  { key: 'battery', label: '电量(%)', type: 'number', min: 0, max: 100 },
  { key: 'errorCount', label: '异常次数', type: 'number', min: 0 },
  { key: 'healthScore', label: '健康分', type: 'number', min: 0, max: 100 },
  { key: 'healthLevel', label: '健康等级', type: 'select', options: ['优秀', '良好', '一般', '差'] },
  { key: 'status', label: '状态', type: 'select', options: ['正常', '预警', '离线'] },
]

const filteredRows = computed(() => {
  let result = deviceHealthList
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.deviceNo.toLowerCase().includes(text) || row.bindObject.toLowerCase().includes(text))
  }
  if (typeFilter.value !== '全部类型') {
    result = result.filter((row) => row.deviceType === typeFilter.value)
  }
  if (statusFilter.value !== '全部状态') {
    result = result.filter((row) => row.status === statusFilter.value)
  }
  return result
})

function reset() {
  keyword.value = ''
  typeFilter.value = '全部类型'
  statusFilter.value = '全部状态'
}

function handleAdd() {
  isEdit.value = false
  editRecord.value = {}
  editModalVisible.value = true
}

function handleEdit(record: DeviceHealth) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = deviceHealthList.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      deviceHealthList[index] = {
        ...deviceHealthList[index],
        ...data,
        batteryText: data.battery ? data.battery + '%' : deviceHealthList[index].batteryText,
      } as DeviceHealth
    }
  } else {
    const newId = 'DH' + String(deviceHealthList.length + 1).padStart(3, '0')
    deviceHealthList.push({
      id: newId,
      deviceType: data.deviceType || '',
      deviceNo: data.deviceNo || '',
      bindObject: data.bindObject || '',
      bindType: data.bindType || '',
      online: data.online || '在线',
      battery: data.battery || 100,
      batteryText: data.battery ? data.battery + '%' : '100%',
      lastReport: new Date().toLocaleString(),
      reportInterval: '1分钟',
      errorCount: data.errorCount || 0,
      healthScore: data.healthScore || 100,
      healthLevel: data.healthLevel || '优秀',
      status: data.status || '正常',
    } as DeviceHealth)
  }
}
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.table-panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.search-input {
  width: 260px;
}

.filter-select {
  width: 160px;
}
</style>

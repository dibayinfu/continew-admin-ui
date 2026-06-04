<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="满溢预警与清运提醒"
      subtitle="小勾臂箱、大勾臂箱满溢自动提醒，由人工查看升级为系统主动提醒，支持一键派单。"
      phase="二期"
      priority="P0"
      module="满溢预警"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-send /></template>
          批量派单
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          预警规则配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索箱体编号/位置" allow-clear class="search-input" />
          <a-select v-model="filter" class="filter-select">
            <a-option v-for="item in filters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>
            新增预警
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
        :scroll="{ x: 1400 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'alertLevel'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">查看详情</a-link>
            <a-link status="warning">派单清运</a-link>
            <a-link status="danger">标记忽略</a-link>
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
import { overflowAlerts } from './data/mock-enhanced'
import type { OverflowAlert } from './data/mock-enhanced'

defineOptions({ name: 'SanitationOverflowAlert' })

const keyword = ref('')
const filter = ref('全部状态')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})


const filters = ['全部状态', '满溢', '预警', '已派单', '已忽略']

const metrics = [
  { label: '满溢告警', value: 3, unit: '个', tone: 'danger' },
  { label: '预警提醒', value: 2, unit: '个', tone: 'warning' },
  { label: '最长持续', value: '3h50min', unit: '' },
  { label: '今日已处理', value: 4, unit: '单' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '箱体名称', dataIndex: 'boxName', ellipsis: true, tooltip: true },
  { title: '箱体编号', dataIndex: 'boxNo' },
  { title: '箱体类型', dataIndex: 'boxType' },
  { title: '所属乡镇', dataIndex: 'town' },
  { title: '满溢比例', dataIndex: 'fillRateText' },
  { title: '电量', dataIndex: 'batteryText' },
  { title: '预警等级', dataIndex: 'alertLevel' },
  { title: '告警时间', dataIndex: 'alertTime', width: 180 },
  { title: '持续时长', dataIndex: 'duration' },
  { title: '建议操作', dataIndex: 'suggestAction' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 220, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'boxName', label: '箱体名称', type: 'input', rules: [{ required: true, message: '请输入箱体名称' }] },
  { key: 'boxNo', label: '箱体编号', type: 'input', rules: [{ required: true, message: '请输入箱体编号' }] },
  { key: 'boxType', label: '箱体类型', type: 'select', options: ['小勾臂箱', '大勾臂箱', '移动压缩箱'], rules: [{ required: true, message: '请选择箱体类型' }] },
  { key: 'town', label: '所属乡镇', type: 'select', options: ['马投涧镇', '龙泉镇', '善应镇', '马家乡'] },
  { key: 'village', label: '所属村庄', type: 'input' },
  { key: 'station', label: '所属中转站', type: 'input' },
  { key: 'fillRate', label: '满溢比例(%)', type: 'number', min: 0, max: 100 },
  { key: 'battery', label: '电量(%)', type: 'number', min: 0, max: 100 },
  { key: 'alertLevel', label: '预警等级', type: 'select', options: ['严重', '重要', '一般'] },
  { key: 'alertTime', label: '告警时间', type: 'datetime' },
  { key: 'duration', label: '持续时长', type: 'input' },
  { key: 'suggestAction', label: '建议操作', type: 'textarea' },
  { key: 'status', label: '状态', type: 'select', options: ['满溢', '预警', '已派单', '已忽略'] },
]

const filteredRows = computed(() => {
  if (!keyword.value && filter.value === '全部状态') return overflowAlerts
  let result = overflowAlerts
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(text)))
  }
  if (filter.value !== '全部状态') {
    result = result.filter((row) => row.status === filter.value)
  }
  return result
})

function reset() {
  keyword.value = ''
  filter.value = '全部状态'
}

function handleAdd() {
  isEdit.value = false
  editRecord.value = {}
  editModalVisible.value = true
}


function handleEdit(record: OverflowAlert) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value) {
    const index = overflowAlerts.findIndex((item) => item.id === editRecord.value!.id)
    if (index !== -1) {
      overflowAlerts[index] = {
        ...overflowAlerts[index],
        ...data,
        fillRateText: data.fillRate ? data.fillRate + '%' : overflowAlerts[index].fillRateText,
        batteryText: data.battery ? data.battery + '%' : overflowAlerts[index].batteryText,
      }
    }
  } else {
    const newId = 'OA' + String(overflowAlerts.length + 1).padStart(3, '0')
    overflowAlerts.push({
      id: newId,
      boxName: data.boxName || '',
      boxNo: data.boxNo || '',
      boxType: data.boxType || '',
      town: data.town || '',
      village: data.village || '',
      station: data.station || '',
      fillRate: data.fillRate || 0,
      fillRateText: data.fillRate ? data.fillRate + '%' : '0%',
      battery: data.battery || 0,
      batteryText: data.battery ? data.battery + '%' : '0%',
      status: data.status || '预警',
      alertLevel: data.alertLevel || '一般',
      alertTime: data.alertTime || new Date().toLocaleString(),
      duration: data.duration || '刚刚',
      suggestAction: data.suggestAction || '',
    } as OverflowAlert)
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

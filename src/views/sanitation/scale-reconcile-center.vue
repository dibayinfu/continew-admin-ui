<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="地磅对账中心"
      subtitle="对接焚烧厂地磅数据，识别重量异常，生成对账报表，支持三级数据比对。"
      phase="三期"
      priority="P0"
      module="对账中心"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-download /></template>
          导出对账报表
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          对账规则配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索车牌号" allow-clear class="search-input" />
          <a-select v-model="statusFilter" class="filter-select">
            <a-option v-for="item in statusFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-date-picker v-model="dateFilter" placeholder="选择日期" />
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>
            新增对账
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
          <StatusTag v-if="column.dataIndex === 'status'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">查看详情</a-link>
            <a-link status="warning">标记核查</a-link>
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
import { scaleReconciles } from './data/mock-enhanced'
import type { ScaleReconcile } from './data/mock-enhanced'

defineOptions({ name: 'SanitationScaleReconcileCenter' })

const keyword = ref('')
const statusFilter = ref('全部状态')
const dateFilter = ref()
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const statusFilters = ['全部状态', '正常', '预警', '异常']

const metrics = [
  { label: '今日对账', value: 3, unit: '单', tone: 'success' },
  { label: '数据一致', value: 2, unit: '单', tone: 'success' },
  { label: '差异预警', value: 1, unit: '单', tone: 'warning' },
  { label: '数据异常', value: 1, unit: '单', tone: 'danger' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '日期', dataIndex: 'date', width: 120 },
  { title: '车牌号', dataIndex: 'vehicle' },
  { title: '车辆类型', dataIndex: 'vehicleType' },
  { title: '车载称重', dataIndex: 'vehicleWeight' },
  { title: '中转站称重', dataIndex: 'stationWeight' },
  { title: '地磅称重', dataIndex: 'scaleWeight' },
  { title: '差异率', dataIndex: 'diffRate' },
  { title: '差异量', dataIndex: 'diffAmount' },
  { title: '备注', dataIndex: 'remark', ellipsis: true, tooltip: true },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 220, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'date', label: '日期', type: 'date' },
  { key: 'vehicle', label: '车牌号', type: 'input', rules: [{ required: true, message: '请输入车牌号' }] },
  { key: 'vehicleType', label: '车辆类型', type: 'select', options: ['大勾臂车', '小勾臂车', '小三轮'] },
  { key: 'vehicleWeight', label: '车载称重', type: 'input', placeholder: '如 13.8t' },
  { key: 'stationWeight', label: '中转站称重', type: 'input', placeholder: '如 13.5t' },
  { key: 'scaleWeight', label: '地磅称重', type: 'input', placeholder: '如 13.8t' },
  { key: 'diffRate', label: '差异率', type: 'input', placeholder: '如 0.0%' },
  { key: 'diffAmount', label: '差异量', type: 'input', placeholder: '如 0t' },
  { key: 'remark', label: '备注', type: 'textarea' },
  { key: 'status', label: '状态', type: 'select', options: ['正常', '预警', '异常'] },
]

const filteredRows = computed(() => {
  let result = scaleReconciles
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.vehicle.toLowerCase().includes(text))
  }
  if (statusFilter.value !== '全部状态') {
    result = result.filter((row) => row.status === statusFilter.value)
  }
  if (dateFilter.value) {
    result = result.filter((row) => row.date === dateFilter.value)
  }
  return result
})

function reset() {
  keyword.value = ''
  statusFilter.value = '全部状态'
  dateFilter.value = undefined
}

function handleAdd() {
  isEdit.value = false
  editRecord.value = {}
  editModalVisible.value = true
}

function handleEdit(record: ScaleReconcile) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = scaleReconciles.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      scaleReconciles[index] = { ...scaleReconciles[index], ...data } as ScaleReconcile
    }
  } else {
    const newId = 'SR' + String(scaleReconciles.length + 1).padStart(3, '0')
    scaleReconciles.push({
      id: newId,
      date: data.date || new Date().toISOString().slice(0, 10),
      vehicle: data.vehicle || '',
      vehicleType: data.vehicleType || '',
      vehicleWeight: data.vehicleWeight || '-',
      stationWeight: data.stationWeight || '-',
      scaleWeight: data.scaleWeight || '-',
      diffRate: data.diffRate || '-',
      diffAmount: data.diffAmount || '-',
      status: data.status || '正常',
      remark: data.remark || '',
    } as ScaleReconcile)
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

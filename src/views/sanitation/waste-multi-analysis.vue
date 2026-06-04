<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="垃圾量多维分析"
      subtitle="按乡镇、村庄、中转站、车辆等多维度统计分析垃圾量数据，支持趋势查看与异常预警。"
      phase="三期"
      priority="P0"
      module="数据分析"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-download /></template>
          导出分析报告
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          分析维度配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="dimension-tabs">
      <a-tabs v-model="activeDimension">
        <a-tab-pane key="乡镇" title="按乡镇分析" />
        <a-tab-pane key="车辆" title="按车辆分析" />
        <a-tab-pane key="中转站" title="按中转站分析" />
      </a-tabs>
    </div>

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索名称" allow-clear class="search-input" />
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
            新增分析
          </a-button>
        </a-space>
      </div>

      <a-table
        row-key="id"
        :data="filteredRows"
        :columns="tableColumns"
        :pagination="{ pageSize: 8, showTotal: true, showJumper: true }"
        :scroll="{ x: 1300 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
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
import { wasteMultiAnalysis } from './data/mock-enhanced'
import type { WasteMultiAnalysis } from './data/mock-enhanced'

defineOptions({ name: 'SanitationWasteMultiAnalysis' })

const keyword = ref('')
const statusFilter = ref('全部状态')
const activeDimension = ref('乡镇')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const statusFilters = ['全部状态', '正常', '预警']

const metrics = [
  { label: '日总垃圾量', value: '107.3t', unit: '' },
  { label: '月总垃圾量', value: '3,219t', unit: '' },
  { label: '日均车次', value: 109, unit: '次' },
  { label: '异常数据', value: 2, unit: '条', tone: 'warning' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '维度', dataIndex: 'dimension' },
  { title: '名称', dataIndex: 'name', ellipsis: true, tooltip: true },
  { title: '日垃圾量', dataIndex: 'dailyWaste' },
  { title: '月垃圾量', dataIndex: 'monthlyWaste' },
  { title: '车次', dataIndex: 'trips' },
  { title: '平均载重', dataIndex: 'avgLoad' },
  { title: '空驶率', dataIndex: 'emptyRate' },
  { title: '环比趋势', dataIndex: 'trend' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 80, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'name', label: '名称', type: 'input', rules: [{ required: true, message: '请输入名称' }] },
  { key: 'dimension', label: '维度', type: 'select', options: ['乡镇', '车辆', '中转站'], disabled: true },
  { key: 'dailyWaste', label: '日垃圾量', type: 'input', placeholder: '如 18.6t' },
  { key: 'monthlyWaste', label: '月垃圾量', type: 'input', placeholder: '如 558.0t' },
  { key: 'trips', label: '车次', type: 'number', min: 0 },
  { key: 'avgLoad', label: '平均载重', type: 'input', placeholder: '如 0.44t' },
  { key: 'emptyRate', label: '空驶率', type: 'input', placeholder: '如 4.8%' },
  { key: 'trend', label: '环比趋势', type: 'input', placeholder: '如 +2.1%' },
  { key: 'status', label: '状态', type: 'select', options: ['正常', '预警'] },
]

const filteredRows = computed(() => {
  let result = wasteMultiAnalysis.filter((row) => row.dimension === activeDimension.value)
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.name.toLowerCase().includes(text))
  }
  if (statusFilter.value !== '全部状态') {
    result = result.filter((row) => row.status === statusFilter.value)
  }
  return result
})

function reset() {
  keyword.value = ''
  statusFilter.value = '全部状态'
}

function handleAdd() {
  isEdit.value = false
  editRecord.value = { dimension: activeDimension.value }
  editModalVisible.value = true
}

function handleEdit(record: WasteMultiAnalysis) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.name) {
    const index = wasteMultiAnalysis.findIndex((item) => item.name === editRecord.value.name && item.dimension === editRecord.value.dimension)
    if (index !== -1) {
      wasteMultiAnalysis[index] = { ...wasteMultiAnalysis[index], ...data } as WasteMultiAnalysis
    }
  } else {
    wasteMultiAnalysis.push({
      dimension: data.dimension || activeDimension.value,
      name: data.name || '',
      dailyWaste: data.dailyWaste || '0t',
      monthlyWaste: data.monthlyWaste || '0t',
      trips: data.trips || 0,
      avgLoad: data.avgLoad || '0t',
      emptyRate: data.emptyRate || '0%',
      trend: data.trend || '-',
      status: data.status || '正常',
    } as WasteMultiAnalysis)
  }
}
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-tabs {
  padding: 0 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
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

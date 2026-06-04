<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="线路优化"
      subtitle="基于清运任务、车辆信息优化派单规则，减少空驶里程，提高清运效率。"
      phase="持续迭代"
      priority="P0"
      module="智能优化"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-thunderbolt /></template>
          执行优化
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          优化规则配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索线路名称" allow-clear class="search-input" />
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
            新增线路
          </a-button>
        </a-space>
      </div>

      <a-table
        row-key="id"
        :data="filteredRows"
        :columns="tableColumns"
        :pagination="{ pageSize: 8, showTotal: true, showJumper: true }"
        :scroll="{ x: 1600 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">查看对比</a-link>
            <a-link status="warning">采纳优化</a-link>
            <a-link>忽略</a-link>
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
import { routeOptimizations } from './data/mock-enhanced'
import type { RouteOptimization } from './data/mock-enhanced'

defineOptions({ name: 'SanitationRouteOptimization' })

const keyword = ref('')
const statusFilter = ref('全部状态')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const statusFilters = ['全部状态', '建议优化', '已采纳']

const metrics = [
  { label: '待优化线路', value: 2, unit: '条', tone: 'warning' },
  { label: '已采纳', value: 1, unit: '条', tone: 'success' },
  { label: '平均节省里程', value: '7.6%', unit: '' },
  { label: '平均节省时间', value: '13.2%', unit: '' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '线路名称', dataIndex: 'routeName', ellipsis: true, tooltip: true },
  { title: '线路类型', dataIndex: 'routeType' },
  { title: '乡镇', dataIndex: 'town' },
  { title: '当前车辆', dataIndex: 'currentVehicle' },
  { title: '当前里程', dataIndex: 'currentDistance' },
  { title: '当前耗时', dataIndex: 'currentDuration' },
  { title: '当前覆盖率', dataIndex: 'currentCoverage' },
  { title: '优化里程', dataIndex: 'optimizedDistance' },
  { title: '优化耗时', dataIndex: 'optimizedDuration' },
  { title: '优化覆盖率', dataIndex: 'optimizedCoverage' },
  { title: '节省里程', dataIndex: 'saveDistance' },
  { title: '节省时间', dataIndex: 'saveDuration' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 260, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'routeName', label: '线路名称', type: 'input', rules: [{ required: true, message: '请输入线路名称' }] },
  { key: 'routeType', label: '线路类型', type: 'select', options: ['小三轮收集', '小勾臂转运', '大勾臂转运'] },
  { key: 'town', label: '乡镇', type: 'select', options: ['马投涧镇', '龙泉镇', '善应镇', '马家乡'] },
  { key: 'currentVehicle', label: '当前车辆', type: 'input' },
  { key: 'currentDistance', label: '当前里程', type: 'input', placeholder: '如 28.6km' },
  { key: 'currentDuration', label: '当前耗时', type: 'input', placeholder: '如 4h' },
  { key: 'currentCoverage', label: '当前覆盖率', type: 'input', placeholder: '如 91.7%' },
  { key: 'optimizedDistance', label: '优化里程', type: 'input', placeholder: '如 24.2km' },
  { key: 'optimizedDuration', label: '优化耗时', type: 'input', placeholder: '如 3.2h' },
  { key: 'optimizedCoverage', label: '优化覆盖率', type: 'input', placeholder: '如 97.2%' },
  { key: 'saveDistance', label: '节省里程', type: 'input', placeholder: '如 -15.4%' },
  { key: 'saveDuration', label: '节省时间', type: 'input', placeholder: '如 -20%' },
  { key: 'status', label: '状态', type: 'select', options: ['建议优化', '已采纳'] },
]

const filteredRows = computed(() => {
  let result = routeOptimizations
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.routeName.toLowerCase().includes(text))
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
  editRecord.value = {}
  editModalVisible.value = true
}

function handleEdit(record: RouteOptimization) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = routeOptimizations.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      routeOptimizations[index] = { ...routeOptimizations[index], ...data } as RouteOptimization
    }
  } else {
    const newId = 'RO' + String(routeOptimizations.length + 1).padStart(3, '0')
    routeOptimizations.push({
      id: newId,
      routeName: data.routeName || '',
      routeType: data.routeType || '',
      town: data.town || '',
      currentVehicle: data.currentVehicle || '',
      currentDistance: data.currentDistance || '-',
      currentDuration: data.currentDuration || '-',
      currentCoverage: data.currentCoverage || '-',
      optimizedDistance: data.optimizedDistance || '-',
      optimizedDuration: data.optimizedDuration || '-',
      optimizedCoverage: data.optimizedCoverage || '-',
      saveDistance: data.saveDistance || '-',
      saveDuration: data.saveDuration || '-',
      status: data.status || '建议优化',
    } as RouteOptimization)
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

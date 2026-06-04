<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="任务派发中心"
      subtitle="调度员创建清运任务并通知驾驶员，支持满溢自动派单、区域设置、接单管理。"
      phase="二期"
      priority="P0"
      module="任务派发"
    >
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>
          新建任务
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          自动派单规则
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索任务名称/驾驶员" allow-clear class="search-input" />
          <a-select v-model="statusFilter" class="filter-select">
            <a-option v-for="item in statusFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-select v-model="priorityFilter" class="filter-select">
            <a-option v-for="item in priorityFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-space>
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
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'priority'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">查看</a-link>
            <a-link status="warning">派发</a-link>
            <a-link status="danger">取消</a-link>
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
import { dispatchTasks } from './data/mock-enhanced'
import type { DispatchTask } from './data/mock-enhanced'

defineOptions({ name: 'SanitationDispatchCenter' })

const keyword = ref('')
const statusFilter = ref('全部状态')
const priorityFilter = ref('全部优先级')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const statusFilters = ['全部状态', '待派发', '待接单', '进行中', '已完成']
const priorityFilters = ['全部优先级', '紧急', '普通']

const metrics = [
  { label: '待派发', value: 1, unit: '单', tone: 'danger' },
  { label: '待接单', value: 1, unit: '单', tone: 'warning' },
  { label: '进行中', value: 2, unit: '单' },
  { label: '今日已完成', value: 1, unit: '单', tone: 'success' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '任务名称', dataIndex: 'taskName', ellipsis: true, tooltip: true },
  { title: '任务类型', dataIndex: 'taskType' },
  { title: '来源', dataIndex: 'source' },
  { title: '来源对象', dataIndex: 'sourceObject' },
  { title: '优先级', dataIndex: 'priority' },
  { title: '驾驶员', dataIndex: 'assignee' },
  { title: '区域', dataIndex: 'area' },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '截止时间', dataIndex: 'deadline', width: 180 },
  { title: '进度', dataIndex: 'progress' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 220, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'taskName', label: '任务名称', type: 'input', rules: [{ required: true, message: '请输入任务名称' }] },
  { key: 'taskType', label: '任务类型', type: 'select', options: ['满溢清运', '日常清运', '建筑垃圾清运', '紧急清运'] },
  { key: 'source', label: '来源', type: 'select', options: ['系统自动', '计划生成', '手动创建'] },
  { key: 'sourceObject', label: '来源对象', type: 'input' },
  { key: 'priority', label: '优先级', type: 'select', options: ['紧急', '普通'] },
  { key: 'assignee', label: '驾驶员', type: 'select', options: ['张师傅', '李师傅', '孙师傅', '王师傅', '未指派'] },
  { key: 'assigneePhone', label: '驾驶员电话', type: 'input' },
  { key: 'area', label: '区域', type: 'select', options: ['马投涧镇北片', '马投涧中转站', '善应镇北片', '龙泉镇西片', '马家乡'] },
  { key: 'createTime', label: '创建时间', type: 'datetime' },
  { key: 'deadline', label: '截止时间', type: 'datetime' },
  { key: 'status', label: '状态', type: 'select', options: ['待派发', '待接单', '进行中', '已完成'] },
  { key: 'progress', label: '进度', type: 'input' },
]

const filteredRows = computed(() => {
  let result = dispatchTasks
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.taskName.toLowerCase().includes(text) || row.assignee.toLowerCase().includes(text))
  }
  if (statusFilter.value !== '全部状态') {
    result = result.filter((row) => row.status === statusFilter.value)
  }
  if (priorityFilter.value !== '全部优先级') {
    result = result.filter((row) => row.priority === priorityFilter.value)
  }
  return result
})

function reset() {
  keyword.value = ''
  statusFilter.value = '全部状态'
  priorityFilter.value = '全部优先级'
}

function handleAdd() {
  isEdit.value = false
  editRecord.value = {}
  editModalVisible.value = true
}

function handleEdit(record: DispatchTask) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = dispatchTasks.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      dispatchTasks[index] = { ...dispatchTasks[index], ...data } as DispatchTask
    }
  } else {
    const newId = 'DT' + String(dispatchTasks.length + 1).padStart(3, '0')
    dispatchTasks.push({
      id: newId,
      taskName: data.taskName || '',
      taskType: data.taskType || '',
      source: data.source || '手动创建',
      sourceObject: data.sourceObject || '',
      priority: data.priority || '普通',
      assignee: data.assignee || '未指派',
      assigneePhone: data.assigneePhone || '-',
      area: data.area || '',
      createTime: data.createTime || new Date().toLocaleString(),
      deadline: data.deadline || '',
      status: data.status || '待派发',
      progress: data.progress || '等待调度员指派',
    } as DispatchTask)
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

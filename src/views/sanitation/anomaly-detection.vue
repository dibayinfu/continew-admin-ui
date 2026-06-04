<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="异常行为检测"
      subtitle="通过AI分析车辆轨迹、作业行为，识别异常倾倒、违规停车、偏离路线等行为。"
      phase="持续迭代"
      priority="P1"
      module="AI检测"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-eye /></template>
          实时监测
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          检测规则配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索对象/描述" allow-clear class="search-input" />
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
            新增检测
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
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'severity'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">查看轨迹</a-link>
            <a-link status="warning">标记处理</a-link>
            <a-link status="danger">忽略</a-link>
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
import { anomalyDetections } from './data/mock-enhanced'
import type { AnomalyDetection } from './data/mock-enhanced'

defineOptions({ name: 'SanitationAnomalyDetection' })

const keyword = ref('')
const typeFilter = ref('全部类型')
const statusFilter = ref('全部状态')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const typeFilters = ['全部类型', '疑似漏收', '长时间停留', '车辆空跑', '载重异常', '箱体长时间满溢']
const statusFilters = ['全部状态', '待确认', '已确认', '待处理', '已处理']

const metrics = [
  { label: '今日检测', value: 3, unit: '条', tone: 'warning' },
  { label: '待确认', value: 1, unit: '条', tone: 'danger' },
  { label: '已处理', value: 2, unit: '条', tone: 'success' },
  { label: '准确率', value: '92%', unit: '' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '检测时间', dataIndex: 'detectTime', width: 180 },
  { title: '异常类型', dataIndex: 'anomalyType' },
  { title: '异常描述', dataIndex: 'anomalyDesc', ellipsis: true, tooltip: true },
  { title: '对象名称', dataIndex: 'objectName' },
  { title: '对象类型', dataIndex: 'objectType' },
  { title: '乡镇', dataIndex: 'town' },
  { title: '严重程度', dataIndex: 'severity' },
  { title: '证据', dataIndex: 'evidence', ellipsis: true, tooltip: true },
  { title: '建议操作', dataIndex: 'suggestAction', ellipsis: true, tooltip: true },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 280, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'detectTime', label: '检测时间', type: 'datetime' },
  { key: 'anomalyType', label: '异常类型', type: 'select', options: ['疑似漏收', '长时间停留', '车辆空跑', '载重异常', '箱体长时间满溢'] },
  { key: 'anomalyDesc', label: '异常描述', type: 'textarea' },
  { key: 'objectName', label: '对象名称', type: 'input', rules: [{ required: true, message: '请输入对象名称' }] },
  { key: 'objectType', label: '对象类型', type: 'select', options: ['车辆', '线路', '箱体'] },
  { key: 'town', label: '乡镇', type: 'select', options: ['马投涧镇', '龙泉镇', '善应镇', '马家乡'] },
  { key: 'severity', label: '严重程度', type: 'select', options: ['严重', '重要', '一般'] },
  { key: 'evidence', label: '证据', type: 'textarea' },
  { key: 'suggestAction', label: '建议操作', type: 'textarea' },
  { key: 'status', label: '状态', type: 'select', options: ['待确认', '已确认', '待处理', '已处理'] },
]

const filteredRows = computed(() => {
  let result = anomalyDetections
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.objectName.toLowerCase().includes(text) || row.anomalyDesc.toLowerCase().includes(text))
  }
  if (typeFilter.value !== '全部类型') {
    result = result.filter((row) => row.anomalyType === typeFilter.value)
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

function handleEdit(record: AnomalyDetection) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = anomalyDetections.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      anomalyDetections[index] = { ...anomalyDetections[index], ...data } as AnomalyDetection
    }
  } else {
    const newId = 'AD' + String(anomalyDetections.length + 1).padStart(3, '0')
    anomalyDetections.push({
      id: newId,
      anomalyType: data.anomalyType || '',
      anomalyDesc: data.anomalyDesc || '',
      objectName: data.objectName || '',
      objectType: data.objectType || '',
      town: data.town || '',
      detectTime: data.detectTime || new Date().toLocaleString(),
      severity: data.severity || '一般',
      evidence: data.evidence || '',
      status: data.status || '待确认',
      suggestAction: data.suggestAction || '',
    } as AnomalyDetection)
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

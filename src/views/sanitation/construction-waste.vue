<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="建筑垃圾识别"
      subtitle="通过AI自动识别建筑垃圾，实现预警与追踪，支持来源车辆追溯。"
      phase="三期"
      priority="P1"
      module="AI识别"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-eye /></template>
          手动识别
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          识别规则配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索位置/车辆" allow-clear class="search-input" />
          <a-select v-model="statusFilter" class="filter-select">
            <a-option v-for="item in statusFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-select v-model="processFilter" class="filter-select">
            <a-option v-for="item in processFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-space>
          <a-button type="primary" @click="handleAdd">
            <template #icon><icon-plus /></template>
            新增识别
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
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'processStatus'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-link type="primary">查看图片</a-link>
            <a-link status="warning">确认/驳回</a-link>
            <a-link status="danger">派发工单</a-link>
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
import { constructionWasteList } from './data/mock-enhanced'
import type { ConstructionWaste } from './data/mock-enhanced'

defineOptions({ name: 'SanitationConstructionWaste' })

const keyword = ref('')
const statusFilter = ref('全部状态')
const processFilter = ref('全部处理状态')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const statusFilters = ['全部状态', '确认', '疑似']
const processFilters = ['全部处理状态', '待确认', '待处理', '已处理']

const metrics = [
  { label: '今日识别', value: 2, unit: '条', tone: 'warning' },
  { label: '已确认', value: 2, unit: '条', tone: 'success' },
  { label: '待处理', value: 1, unit: '条', tone: 'danger' },
  { label: '最高置信度', value: '95%', unit: '' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '识别时间', dataIndex: 'detectTime', width: 180 },
  { title: '位置', dataIndex: 'location', ellipsis: true, tooltip: true },
  { title: '乡镇', dataIndex: 'town' },
  { title: '村庄', dataIndex: 'village' },
  { title: '置信度', dataIndex: 'confidenceText' },
  { title: '垃圾量', dataIndex: 'wasteVolume' },
  { title: '来源车辆', dataIndex: 'sourceVehicle' },
  { title: '识别状态', dataIndex: 'status' },
  { title: '处理状态', dataIndex: 'processStatus' },
  { title: '操作', slotName: 'action', width: 280, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'detectTime', label: '识别时间', type: 'datetime' },
  { key: 'location', label: '位置', type: 'input', rules: [{ required: true, message: '请输入位置' }] },
  { key: 'town', label: '乡镇', type: 'select', options: ['马投涧镇', '龙泉镇', '善应镇', '马家乡'] },
  { key: 'village', label: '村庄', type: 'input' },
  { key: 'confidence', label: '置信度(%)', type: 'number', min: 0, max: 100 },
  { key: 'wasteVolume', label: '垃圾量', type: 'input', placeholder: '如 约0.8m³' },
  { key: 'sourceVehicle', label: '来源车辆', type: 'input', placeholder: '如 豫E7A031' },
  { key: 'status', label: '识别状态', type: 'select', options: ['确认', '疑似'] },
  { key: 'processStatus', label: '处理状态', type: 'select', options: ['待确认', '待处理', '已处理'] },
]

const filteredRows = computed(() => {
  let result = constructionWasteList
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.location.toLowerCase().includes(text) || row.sourceVehicle.toLowerCase().includes(text))
  }
  if (statusFilter.value !== '全部状态') {
    result = result.filter((row) => row.status === statusFilter.value)
  }
  if (processFilter.value !== '全部处理状态') {
    result = result.filter((row) => row.processStatus === processFilter.value)
  }
  return result
})

function reset() {
  keyword.value = ''
  statusFilter.value = '全部状态'
  processFilter.value = '全部处理状态'
}

function handleAdd() {
  isEdit.value = false
  editRecord.value = {}
  editModalVisible.value = true
}

function handleEdit(record: ConstructionWaste) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = constructionWasteList.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      constructionWasteList[index] = {
        ...constructionWasteList[index],
        ...data,
        confidenceText: data.confidence ? data.confidence + '%' : constructionWasteList[index].confidenceText,
      } as ConstructionWaste
    }
  } else {
    const newId = 'CW' + String(constructionWasteList.length + 1).padStart(3, '0')
    constructionWasteList.push({
      id: newId,
      detectTime: data.detectTime || new Date().toLocaleString(),
      location: data.location || '',
      town: data.town || '',
      village: data.village || '',
      imageUrl: '',
      confidence: data.confidence || 0,
      confidenceText: data.confidence ? data.confidence + '%' : '0%',
      wasteVolume: data.wasteVolume || '',
      sourceVehicle: data.sourceVehicle || '未识别',
      status: data.status || '疑似',
      processStatus: data.processStatus || '待确认',
    } as ConstructionWaste)
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

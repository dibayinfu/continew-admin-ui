<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="小勾臂箱远程控制"
      subtitle="支持远程开锁、关锁控制面板，实时查看箱体状态与操作记录。"
      phase="二期"
      priority="P1"
      module="远程控制"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-lock /></template>
          批量关锁
        </a-button>
        <a-button>
          <template #icon><icon-history /></template>
          操作日志
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索箱体名称/编号" allow-clear class="search-input" />
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
            新增箱体
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
        :scroll="{ x: 1300 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'lockStatus' || column.dataIndex === 'online'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-link type="primary" @click="handleEdit(record)">编辑</a-link>
            <a-button size="mini" type="primary" :disabled="record.online !== '在线'">
              <template #icon><icon-unlock /></template>
              开锁
            </a-button>
            <a-button size="mini" status="warning" :disabled="record.online !== '在线'">
              <template #icon><icon-lock /></template>
              关锁
            </a-button>
            <a-link type="primary">详情</a-link>
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
import { boxRemoteControls } from './data/mock-enhanced'
import type { BoxRemoteControl } from './data/mock-enhanced'

defineOptions({ name: 'SanitationBoxRemoteControl' })

const keyword = ref('')
const statusFilter = ref('全部状态')
const editModalVisible = ref(false)
const isEdit = ref(false)
const editRecord = ref<Record<string, any>>({})

const statusFilters = ['全部状态', '正常', '预警', '离线']

const metrics = [
  { label: '在线箱体', value: 2, unit: '个', tone: 'success' },
  { label: '离线箱体', value: 1, unit: '个', tone: 'danger' },
  { label: '当前开锁', value: 1, unit: '个', tone: 'warning' },
  { label: '今日操作', value: 8, unit: '次' },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '箱体名称', dataIndex: 'boxName', ellipsis: true, tooltip: true },
  { title: '箱体编号', dataIndex: 'boxNo' },
  { title: '箱体类型', dataIndex: 'boxType' },
  { title: '所属乡镇', dataIndex: 'town' },
  { title: '锁编号', dataIndex: 'lockNo' },
  { title: '锁状态', dataIndex: 'lockStatus' },
  { title: '在线状态', dataIndex: 'online' },
  { title: '电量', dataIndex: 'batteryText' },
  { title: '上次操作', dataIndex: 'lastControl', width: 180 },
  { title: '操作结果', dataIndex: 'controlResult' },
  { title: '状态', dataIndex: 'status' },
  { title: '操作', slotName: 'action', width: 280, align: 'center' as const, fixed: 'right' as const },
]

const editFields: FormField[] = [
  { key: 'boxName', label: '箱体名称', type: 'input', rules: [{ required: true, message: '请输入箱体名称' }] },
  { key: 'boxNo', label: '箱体编号', type: 'input', rules: [{ required: true, message: '请输入箱体编号' }] },
  { key: 'boxType', label: '箱体类型', type: 'select', options: ['小勾臂箱', '大勾臂箱', '移动压缩箱'] },
  { key: 'town', label: '所属乡镇', type: 'select', options: ['马投涧镇', '龙泉镇', '善应镇', '马家乡'] },
  { key: 'village', label: '所属村庄', type: 'input' },
  { key: 'lockNo', label: '锁编号', type: 'input' },
  { key: 'lockStatus', label: '锁状态', type: 'select', options: ['开锁', '关锁', '未知'] },
  { key: 'online', label: '在线状态', type: 'select', options: ['在线', '离线'] },
  { key: 'battery', label: '电量(%)', type: 'number', min: 0, max: 100 },
  { key: 'status', label: '状态', type: 'select', options: ['正常', '预警', '离线'] },
]

const filteredRows = computed(() => {
  let result = boxRemoteControls
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => row.boxName.toLowerCase().includes(text) || row.boxNo.toLowerCase().includes(text))
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

function handleEdit(record: BoxRemoteControl) {
  isEdit.value = true
  editRecord.value = { ...record }
  editModalVisible.value = true
}

function handleSave(data: Record<string, any>) {
  if (isEdit.value && editRecord.value?.id) {
    const index = boxRemoteControls.findIndex((item) => item.id === editRecord.value.id)
    if (index !== -1) {
      boxRemoteControls[index] = {
        ...boxRemoteControls[index],
        ...data,
        batteryText: data.battery ? data.battery + '%' : boxRemoteControls[index].batteryText,
      } as BoxRemoteControl
    }
  } else {
    const newId = 'BR' + String(boxRemoteControls.length + 1).padStart(3, '0')
    boxRemoteControls.push({
      id: newId,
      boxName: data.boxName || '',
      boxNo: data.boxNo || '',
      boxType: data.boxType || '',
      town: data.town || '',
      village: data.village || '',
      lockNo: data.lockNo || '',
      lockStatus: data.lockStatus || '关锁',
      online: data.online || '在线',
      battery: data.battery || 100,
      batteryText: data.battery ? data.battery + '%' : '100%',
      lastControl: new Date().toLocaleString(),
      controlResult: '新增注册',
      status: data.status || '正常',
    } as BoxRemoteControl)
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

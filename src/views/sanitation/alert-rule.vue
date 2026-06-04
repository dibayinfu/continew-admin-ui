<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      :title="config.title"
      :subtitle="config.subtitle"
      :phase="config.phase"
      :priority="config.priority"
      :module="config.module"
    >
      <template #extra>
        <a-button type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>
          新增规则
        </a-button>
      </template>
    </ModuleHeader>

    <!-- PRD -->
    <div v-if="config.prd?.length" class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div v-for="section in config.prd" :key="section.title" class="prd-section">
              <h4 class="prd-section-title">{{ section.title }}</h4>
              <table class="prd-table">
                <tbody>
                  <tr v-for="item in section.items" :key="item.label">
                    <td class="prd-label">{{ item.label }}</td>
                    <td class="prd-value">{{ item.value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" :placeholder="config.searchPlaceholder" allow-clear class="search-input" />
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
        :columns="columns"
        :pagination="{ pageSize: 20, showTotal: true, showJumper: true }"
        :scroll="{ x: 1600 }"
        stripe
      >
        <template #cell="{ column, record }">
          <!-- 等级 -->
          <span v-if="column.dataIndex === 'level'">
            <a-tag v-if="record.level === '一般'" color="arcoblue">一般</a-tag>
            <a-tag v-else-if="record.level === '严重'" color="red">严重</a-tag>
            <span v-else>{{ record.level }}</span>
          </span>
          <!-- 通知方式 -->
          <span v-else-if="column.dataIndex === 'notifyMethods'" class="notify-cell">
            <a-tag v-for="m in record.notifyMethods" :key="m" color="blue" style="margin: 2px 4px 2px 0;">{{ m }}</a-tag>
          </span>
          <!-- 通知范围 -->
          <span v-else-if="column.dataIndex === 'notifyScopeLabel'">{{ record.notifyScopeLabel }}</span>
          <!-- 定时发送 -->
          <span v-else-if="column.dataIndex === 'morningSendLabel'">{{ record.morningSendLabel }}</span>
          <!-- 状态 -->
          <span v-else-if="column.dataIndex === 'status'">
            <a-switch :model-value="record.status === '启用'" :disabled="true" />
          </span>
          <!-- 默认 -->
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-tooltip content="编辑">
              <a-link @click="handleEdit(record)"><icon-edit /></a-link>
            </a-tooltip>
            <a-popconfirm content="确定要删除该规则吗？" @ok="handleDelete(record)">
              <a-tooltip content="删除">
                <a-link status="danger"><icon-delete /></a-link>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑告警规则' : '新增告警规则'"
      :width="720"
      unmount-on-close
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" auto-label-width>
        <a-row :gutter="16">
          <!-- 告警类型 -->
          <a-col :span="12">
            <a-form-item field="alarmType" label="告警类型" :rules="[{ required: true, message: '请选择告警类型' }]">
              <a-select v-model="formData.alarmType" placeholder="请选择告警类型" @change="onAlarmTypeChange">
                <a-option v-for="t in alarmTypeOptions" :key="t" :value="t" :label="t" />
              </a-select>
            </a-form-item>
          </a-col>
          <!-- 等级 -->
          <a-col :span="12">
            <a-form-item field="level" label="等级" :rules="[{ required: true, message: '请选择等级' }]">
              <a-select v-model="formData.level" placeholder="请选择等级">
                <a-option value="一般">一般</a-option>
                <a-option value="严重">严重</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <!-- 阈值 -->
          <a-col :span="12">
            <a-form-item field="thresholdValue" label="阈值" :rules="[{ required: true, message: '请输入阈值' }]">
              <a-input-number
                v-model="formData.thresholdValue"
                :min="0"
                :max="99999"
                placeholder="选择告警类型后自动填充"
                style="width: 160px;"
              />
              <span class="form-hint" style="margin-left: 8px;">{{ thresholdUnitLabel }}</span>
            </a-form-item>
          </a-col>
          <!-- 通知方式 -->
          <a-col :span="24">
            <a-form-item field="notifyMethods" label="通知方式" :rules="[{ required: true, message: '请至少选择一种通知方式' }]">
              <a-checkbox-group v-model="formData.notifyMethods">
                <a-checkbox value="系统消息（PC/APP）">系统消息（PC/APP）</a-checkbox>
                <a-checkbox value="小程序">小程序</a-checkbox>
                <a-checkbox value="短信">短信</a-checkbox>
              </a-checkbox-group>
            </a-form-item>
          </a-col>
          <!-- 通知范围 -->
          <a-col :span="24">
            <a-form-item field="notifyScope" label="通知范围" :rules="[{ required: true, message: '请选择通知范围' }]">
              <a-radio-group v-model="formData.notifyScope" type="button" @change="onScopeChange">
                <a-radio value="所有人">所有人</a-radio>
                <a-radio value="指定用户">指定用户</a-radio>
              </a-radio-group>
              <a-select
                v-if="formData.notifyScope === '指定用户'"
                v-model="formData.notifyUsers"
                :options="peopleOptions"
                placeholder="请选择人员"
                multiple
                allow-clear
                style="width: 320px; margin-left: 12px;"
              />
            </a-form-item>
          </a-col>
          <!-- 通知内容 -->
          <a-col :span="24">
            <a-form-item field="notifyContent" label="通知内容" :rules="[{ required: true, message: '请输入通知内容' }]">
              <a-textarea
                v-model="formData.notifyContent"
                placeholder="例：【告警通知】{boxName} 当前垃圾占比 {fillRate}%，已超过阈值，请及时处理。"
                :max-length="200"
                show-word-limit
                style="width: 100%;"
              />
            </a-form-item>
          </a-col>
          <!-- 早上定时发送 -->
          <a-col :span="24">
            <a-form-item field="morningSend" label="早上定时发送">
              <a-switch v-model="formData.morningSend" :checked-value="true" :unchecked-value="false" style="margin-right: 12px;" />
              <span v-if="!formData.morningSend" class="form-hint">关闭：告警触发后立即通知</span>
              <template v-else>
                <span class="form-hint" style="margin-right: 8px;">夜间触发的告警在次日</span>
                <a-time-picker v-model="formData.morningTime" format="HH:mm" style="width: 120px;" />
                <span class="form-hint" style="margin-left: 8px;">统一发送</span>
              </template>
            </a-form-item>
          </a-col>
          <!-- 状态 -->
          <a-col :span="12">
            <a-form-item field="status" label="状态">
              <a-switch v-model="formData.status" :checked-value="'启用'" :unchecked-value="'停用'" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'
import type { PrototypePageConfig } from './data/pageConfigs'
import { pageConfigs, peopleRows } from './data/pageConfigs'

const props = defineProps<{
  pageKey: string
}>()

const config = pageConfigs[props.pageKey] || pageConfigs.townArchive

const keyword = ref('')
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<Record<string, any>>({})

const alarmTypeOptions = [
  '小勾臂箱满溢',
  '小勾臂箱低电量',
  '小勾臂箱高温',
  '小勾臂箱离线',
  '大勾臂箱满溢',
  '大勾臂箱离线',
]

/** 阈值配置：每个告警类型的默认值、单位、运算符 */
interface ThresholdConfig {
  value: number
  unit: string
  operator: string
  desc: string
}

const thresholdConfigMap: Record<string, ThresholdConfig> = {
  '小勾臂箱满溢': { value: 90, unit: '%', operator: '>', desc: '垃圾占比 > {value}{unit}' },
  '小勾臂箱低电量': { value: 10, unit: '%', operator: '<', desc: '电量 < {value}{unit}' },
  '小勾臂箱高温': { value: 60, unit: '°C', operator: '>', desc: '温度 > {value}{unit}' },
  '小勾臂箱离线': { value: 60, unit: '分钟', operator: '>', desc: '无心跳 > {value}{unit}' },
  '大勾臂箱满溢': { value: 90, unit: '%', operator: '>', desc: '垃圾占比 > {value}{unit}' },
  '大勾臂箱离线': { value: 1440, unit: '分钟', operator: '>', desc: '无心跳 > {value}{unit}' },
}

/** 默认等级映射 */
const defaultLevelMap: Record<string, string> = {
  '小勾臂箱满溢': '一般',
  '小勾臂箱低电量': '一般',
  '小勾臂箱高温': '一般',
  '小勾臂箱离线': '一般',
  '大勾臂箱满溢': '一般',
  '大勾臂箱离线': '一般',
}

const peopleOptions = computed(() =>
  peopleRows.map((p) => ({ label: `${p.name}（${p.personType}）`, value: p.name }))
)

/** 当前阈值单位标签 */
const thresholdUnitLabel = computed(() => {
  const cfg = thresholdConfigMap[formData.value.alarmType]
  if (!cfg) return ''
  return `${cfg.operator} ${cfg.unit}`
})

/** 根据阈值值+单位生成描述 */
function buildThresholdDesc(alarmType: string, value: number): string {
  const cfg = thresholdConfigMap[alarmType]
  if (!cfg) return ''
  // 大勾臂箱离线显示为小时
  if (alarmType === '大勾臂箱离线') {
    return `无心跳 > ${value / 60} 小时`
  }
  return cfg.desc.replace('{value}', String(value)).replace('{unit}', cfg.unit)
}

function onAlarmTypeChange(val: string) {
  const cfg = thresholdConfigMap[val]
  if (cfg) {
    formData.value.thresholdValue = cfg.value
    formData.value.thresholdUnit = cfg.unit
  }
  // 默认等级
  if (!isEdit.value || !formData.value.level) {
    formData.value.level = defaultLevelMap[val] || '一般'
  }
}

function onScopeChange(val: string) {
  if (val === '所有人') {
    formData.value.notifyUsers = []
  }
}

const columns = computed(() => [
  { title: '序号', width: 70, align: 'center', render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '告警类型', dataIndex: 'alarmType', width: 180, ellipsis: true, tooltip: true },
  { title: '等级', dataIndex: 'level', width: 100 },
  { title: '阈值', dataIndex: 'thresholdDesc', width: 200, ellipsis: true, tooltip: true,
    render: ({ record }: { record: Record<string, any> }) => {
      const type = record.alarmType
      const val = record.thresholdValue
      if (!val && val !== 0) return record.thresholdDesc || '-'
      const cfg = thresholdConfigMap[type]
      if (!cfg) return record.thresholdDesc || '-'
      if (type === '大勾臂箱离线') return `无心跳 > ${val / 60} 小时`
      return cfg.desc.replace('{value}', String(val)).replace('{unit}', cfg.unit)
    },
  },
  { title: '通知方式', dataIndex: 'notifyMethods', width: 260 },
  { title: '通知内容', dataIndex: 'notifyContent', width: 280, ellipsis: true, tooltip: true },
  { title: '通知范围', dataIndex: 'notifyScopeLabel', width: 160, ellipsis: true, tooltip: true },
  { title: '早上定时发送', dataIndex: 'morningSendLabel', width: 160 },
  { title: '状态', dataIndex: 'status', width: 80 },
  { title: '操作', slotName: 'action', width: 120, align: 'center', fixed: 'right' },
])

const filteredRows = computed(() => {
  let result = config.rows
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(text))
    )
  }
  return result
})

function reset() {
  keyword.value = ''
}

function handleAdd() {
  isEdit.value = false
  editingId.value = null
  formData.value = {
    status: '启用',
    thresholdValue: undefined,
    thresholdUnit: '',
    notifyMethods: ['系统消息（PC/APP）'],
    notifyScope: '所有人',
    notifyUsers: [],
    notifyContent: '',
    morningSend: false,
    morningTime: '08:00',
  }
  modalVisible.value = true
}

function handleEdit(record: Record<string, any>) {
  isEdit.value = true
  editingId.value = record.id
  formData.value = {
    alarmType: record.alarmType,
    level: record.level,
    thresholdValue: record.thresholdValue,
    thresholdUnit: record.thresholdUnit || '',
    thresholdDesc: record.thresholdDesc,
    status: record.status,
    notifyMethods: [...(record.notifyMethods || [])],
    notifyScope: record.notifyScope || '所有人',
    notifyUsers: [...(record.notifyUsers || [])],
    notifyContent: record.notifyContent || '',
    morningSend: record.morningSend ?? false,
    morningTime: record.morningTime || '08:00',
  }
  modalVisible.value = true
}

function handleDelete(record: Record<string, any>) {
  const index = config.rows.findIndex((item) => item.id === record.id)
  if (index !== -1) {
    config.rows.splice(index, 1)
  }
}

function handleModalOk() {
  // 校验
  if (!formData.value.alarmType) {
    return
  }
  if (!formData.value.notifyMethods?.length) {
    return
  }

  // 从阈值值+类型生成描述
  const computedDesc = buildThresholdDesc(formData.value.alarmType, formData.value.thresholdValue)

  const notifyScopeLabel = formData.value.notifyScope === '指定用户'
    ? `指定 ${formData.value.notifyUsers?.length || 0} 人`
    : '所有人'

  const morningSendLabel = formData.value.morningSend
    ? `次日 ${formData.value.morningTime || '08:00'} 发送`
    : '实时发送'

  if (isEdit.value && editingId.value) {
    const index = config.rows.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      config.rows[index] = {
        ...config.rows[index],
        alarmType: formData.value.alarmType,
        level: formData.value.level,
        thresholdValue: formData.value.thresholdValue,
        thresholdUnit: formData.value.thresholdUnit,
        thresholdDesc: computedDesc,
        status: formData.value.status,
        notifyMethods: formData.value.notifyMethods,
        notifyScope: formData.value.notifyScope,
        notifyUsers: formData.value.notifyUsers,
        notifyContent: formData.value.notifyContent,
        notifyScopeLabel,
        morningSend: formData.value.morningSend,
        morningTime: formData.value.morningTime,
        morningSendLabel,
      }
    }
  } else {
    const newId = 'AR' + String(config.rows.length + 1).padStart(3, '0')
    config.rows.push({
      id: newId,
      alarmType: formData.value.alarmType,
      level: formData.value.level,
      thresholdValue: formData.value.thresholdValue,
      thresholdUnit: formData.value.thresholdUnit,
      thresholdDesc: computedDesc,
      status: formData.value.status,
      notifyMethods: formData.value.notifyMethods,
      notifyScope: formData.value.notifyScope,
      notifyUsers: formData.value.notifyUsers,
      notifyContent: formData.value.notifyContent,
      notifyScopeLabel,
      morningSend: formData.value.morningSend,
      morningTime: formData.value.morningTime,
      morningSendLabel,
    })
  }
  modalVisible.value = false
}

function handleModalCancel() {
  modalVisible.value = false
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

.form-hint {
  color: var(--color-text-3);
  font-size: 13px;
  white-space: nowrap;
}
</style>

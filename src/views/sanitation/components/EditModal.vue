<template>
  <a-modal
    :visible="visible"
    :title="isEdit ? '编辑' : '新增'"
    :width="width"
    :mask-closable="false"
    :unmount-on-close="true"
    @cancel="handleCancel"
    @before-ok="handleOk"
  >
    <a-form :model="formData" :layout="layout" :label-width="labelWidth">
      <a-form-item
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
        :field="field.key"
        :rules="field.rules"
        :row-span="field.rowSpan || 1"
      >
        <!-- 输入框 -->
        <a-input
          v-if="field.type === 'input'"
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请输入' + field.label"
          :disabled="field.disabled"
          allow-clear
        />
        <!-- 数字输入 -->
        <a-input-number
          v-else-if="field.type === 'number'"
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请输入' + field.label"
          :disabled="field.disabled"
          :min="field.min"
          :max="field.max"
          style="width: 100%"
        />
        <!-- 下拉选择 -->
        <a-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请选择' + field.label"
          :disabled="field.disabled"
          allow-clear
        >
          <a-option
            v-for="opt in field.options"
            :key="typeof opt === 'string' ? opt : opt.value"
            :value="typeof opt === 'string' ? opt : opt.value"
            :label="typeof opt === 'string' ? opt : opt.label"
          />
        </a-select>
        <!-- 日期选择 -->
        <a-date-picker
          v-else-if="field.type === 'date'"
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请选择' + field.label"
          :disabled="field.disabled"
          style="width: 100%"
        />
        <!-- 日期时间选择 -->
        <a-date-picker
          v-else-if="field.type === 'datetime'"
          v-model="formData[field.key]"
          show-time
          :placeholder="field.placeholder || '请选择' + field.label"
          :disabled="field.disabled"
          style="width: 100%"
        />
        <!-- 文本域 -->
        <a-textarea
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请输入' + field.label"
          :disabled="field.disabled"
          :max-length="field.maxLength || 200"
          show-word-limit
          :auto-size="{ minRows: 2, maxRows: 4 }"
        />
        <!-- 开关 -->
        <a-switch
          v-else-if="field.type === 'switch'"
          v-model="formData[field.key]"
          :disabled="field.disabled"
          :checked-value="field.checkedValue ?? true"
          :unchecked-value="field.uncheckedValue ?? false"
        />
        <!-- 标签输入 -->
        <a-input-tag
          v-else-if="field.type === 'tag'"
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请输入' + field.label"
          :disabled="field.disabled"
          allow-clear
        />
        <!-- 默认输入框 -->
        <a-input
          v-else
          v-model="formData[field.key]"
          :placeholder="field.placeholder || '请输入' + field.label"
          :disabled="field.disabled"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'

export interface FormField {
  key: string
  label: string
  type?: 'input' | 'number' | 'select' | 'date' | 'datetime' | 'textarea' | 'switch' | 'tag'
  placeholder?: string
  disabled?: boolean
  options?: (string | { value: any; label: string })[]
  rules?: any[]
  min?: number
  max?: number
  maxLength?: number
  rowSpan?: number
  checkedValue?: any
  uncheckedValue?: any
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    fields: FormField[]
    record?: Record<string, any>
    isEdit?: boolean
    width?: number | string
    layout?: 'horizontal' | 'vertical' | 'inline'
    labelWidth?: number
  }>(),
  {
    visible: false,
    fields: () => [],
    isEdit: false,
    width: 640,
    layout: 'vertical',
    labelWidth: 100,
  }
)

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save', data: Record<string, any>): void
}>()

const formData = reactive<Record<string, any>>({})

// 初始化表单数据
function initFormData() {
  const data: Record<string, any> = {}
  props.fields.forEach((field) => {
    if (props.isEdit && props.record) {
      data[field.key] = props.record[field.key] ?? ''
    } else {
      data[field.key] = ''
    }
  })
  Object.assign(formData, data)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initFormData()
    }
  }
)

function handleCancel() {
  emit('update:visible', false)
}

function handleOk(done: (closed: boolean) => void) {
  emit('save', { ...formData })
  done(true)
  emit('update:visible', false)
}
</script>

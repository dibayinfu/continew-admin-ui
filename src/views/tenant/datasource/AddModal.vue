<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns">
      <template #password>
        <a-input-password
          v-model="form.password"
          :placeholder="!isUpdate ? '请输入密码' : '保持密码为空将不更改密码'"
        />
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { addTenantDatasource, getTenantDatasource, updateTenantDatasource } from '@/apis/tenant/datasource'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { encryptByRsa } from '@/utils/encrypt'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改数据源' : '新增数据源'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { datasource_database_type_enum } = useDict('datasource_database_type_enum')

const [form, resetForm] = useResetReactive({
  databaseType: 1,
  port: 3306,
})

const columns: ColumnItem[] = reactive([
  {
    label: '名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 30,
    },
  },
  {
    label: '数据库类型',
    field: 'databaseType',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      type: 'button',
      options: datasource_database_type_enum,
    },
  },
  {
    label: '主机',
    field: 'host',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 128,
    },
  },
  {
    label: '端口',
    field: 'port',
    type: 'input-number',
    span: 24,
    required: true,
    props: {
      min: 0,
      max: 65535,
    },
  },
  {
    label: '用户名',
    field: 'username',
    type: 'input',
    span: 24,
    required: true,
    props: {
      maxLength: 128,
    },
  },
  {
    label: '密码',
    field: 'password',
    type: 'input-password',
    span: 24,
    required: true,
    props: {
      maxLength: 128,
    },
    show: () => {
      return !isUpdate.value
    },
  },
  {
    label: '密码',
    field: 'password',
    type: 'input-password',
    span: 24,
    props: {
      maxLength: 128,
    },
    show: () => {
      return isUpdate.value
    },
  },
  {
    label: '描述',
    field: 'description',
    type: 'textarea',
    span: 24,
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateTenantDatasource({
        ...form,
        password: form.password === undefined ? undefined : encryptByRsa(form.password),
      }, dataId.value)
      Message.success('修改成功')
    } else {
      await addTenantDatasource({
        ...form,
        password: encryptByRsa(form.password),
      })
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = async () => {
  reset()
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getTenantDatasource(id)
  Object.assign(form, data)
  form.password = undefined
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>

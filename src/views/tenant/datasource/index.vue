<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.description" placeholder="搜索名称/描述" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['tenant:datasource:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
      </template>

      <template #databaseType="{ record }">
        <GiCellTag :value="record.databaseType" :dict="datasource_database_type_enum" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['tenant:datasource:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['tenant:datasource:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-dropdown>
            <a-button v-if="has.hasPermOr(['tenant:datasource:testConnection', 'tenant:datasource:delete'])" type="text" size="mini" title="更多">
              <template #icon>
                <icon-more :size="16" />
              </template>
            </a-button>
            <template #content>
              <a-doption v-permission="['tenant:datasource:testConnection']" title="测试连接" @click="onTestConnection(record)">测试连接</a-doption>
              <a-doption
                v-permission="['tenant:datasource:delete']"
                :disabled="record.disabled"
                :title="record.disabled ? '禁止删除' : '删除'"
                @click="onDelete(record)"
              >
                删除
              </a-doption>
            </template>
          </a-dropdown>
        </a-space>
      </template>
    </GiTable>

    <AddModal ref="AddModalRef" @save-success="search" />
    <DetailDrawer ref="DetailDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import { Message, type TableInstance } from '@arco-design/web-vue'
import AddModal from './AddModal.vue'
import DetailDrawer from './DetailDrawer.vue'
import {
  type TenantDatasourceQuery,
  type TenantDatasourceResp,
  deleteTenantDatasource,
  listTenantDatasource,
  testTenantDatasourceConnection,
} from '@/apis/tenant/datasource'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import { useDict } from '@/hooks/app'

defineOptions({ name: 'TenantDatasource' })

const { datasource_database_type_enum } = useDict('datasource_database_type_enum')

const queryForm = reactive<TenantDatasourceQuery>({
  description: undefined,
  sort: ['createTime,desc'],
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listTenantDatasource({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
    fixed: !isMobile() ? 'left' : undefined,
  },
  { title: '名称', dataIndex: 'name', slotName: 'name', ellipsis: true, tooltip: true, fixed: !isMobile() ? 'left' : undefined },
  { title: '数据库类型', dataIndex: 'databaseType', slotName: 'databaseType', align: 'center' },
  { title: '主机', dataIndex: 'host', slotName: 'host', align: 'center' },
  { title: '端口', dataIndex: 'port', slotName: 'port', align: 'center' },
  { title: '用户名', dataIndex: 'username', slotName: 'username', align: 'center' },
  { title: '描述', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '创建人', dataIndex: 'createUserString', ellipsis: true, tooltip: true, show: false },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '修改人', dataIndex: 'updateUserString', ellipsis: true, tooltip: true, show: false },
  { title: '修改时间', dataIndex: 'updateTime', width: 180, show: false },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['tenant:datasource:get', 'tenant:datasource:update', 'tenant:datasource:delete']),
  },
]

// 重置
const reset = () => {
  queryForm.description = undefined
  search()
}

// 删除
const onDelete = (record: TenantDatasourceResp) => {
  return handleDelete(() => deleteTenantDatasource(record.id), {
    content: `是否确定删除数据源「${record.name}」？`,
    showModal: true,
  })
}

// 测试连接
const onTestConnection = async (record: TenantDatasourceResp) => {
  await testTenantDatasourceConnection(record.id)
  Message.success('测试连接成功')
}

const AddModalRef = ref<InstanceType<typeof AddModal>>()
// 新增
const onAdd = () => {
  AddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: TenantDatasourceResp) => {
  AddModalRef.value?.onUpdate(record.id)
}

const DetailDrawerRef = ref<InstanceType<typeof DetailDrawer>>()
// 详情
const onDetail = (record: TenantDatasourceResp) => {
  DetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>

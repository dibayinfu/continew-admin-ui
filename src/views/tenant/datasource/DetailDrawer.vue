<template>
  <a-drawer v-model:visible="visible" title="数据源详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="名称">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="数据库类型"><GiCellTag :value="dataDetail?.databaseType" :dict="datasource_database_type_enum" /></a-descriptions-item>
      <a-descriptions-item label="主机">{{ dataDetail?.host }}</a-descriptions-item>
      <a-descriptions-item label="端口">{{ dataDetail?.port }}</a-descriptions-item>
      <a-descriptions-item label="用户名">{{ dataDetail?.username }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUserString }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUserString }}</a-descriptions-item>
      <a-descriptions-item label="修改时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="描述" :span="2">{{ dataDetail?.description }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type TenantDatasourceResp, getTenantDatasource as getDetail } from '@/apis/tenant/datasource'
import { useDict } from '@/hooks/app'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<TenantDatasourceResp>()
const visible = ref(false)
const { datasource_database_type_enum } = useDict('datasource_database_type_enum')

// 查询详情
const getDataDetail = async () => {
  const { data } = await getDetail(dataId.value)
  dataDetail.value = data
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>

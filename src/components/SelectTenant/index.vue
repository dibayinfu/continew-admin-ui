<template>
  <a-modal
    v-model:visible="visible"
    title="选择租户"
    hide-cancel
    :closable="false"
    :mask-closable="false"
    :ok-loading="okLoading"
    draggable
    :width="width >= 500 ? 500 : '90%'"
    @before-ok="confirm"
  >
    <div class="scrollable-container">
      <a-radio-group v-model="tenantId" direction="vertical" class="scrollable-container-radio-group" @change="value => { setTenantId(value) }">
        <a-radio :value="0" class="scrollable-container-radio">
          <template #radio="{ checked }">
            <a-space
              align="start"
              class="custom-radio-card"
              :class="{ 'custom-radio-card-checked': checked }"
            >
              <div className="custom-radio-card-mask">
                <div className="custom-radio-card-mask-dot" />
              </div>
              系统默认租户
            </a-space>
          </template>
        </a-radio>
        <template v-for="item in tenantList" :key="item.id">
          <a-radio :value="item.id" class="scrollable-container-radio">
            <template #radio="{ checked }">
              <a-space
                align="start"
                class="custom-radio-card"
                :class="{ 'custom-radio-card-checked': checked }"
              >
                <div className="custom-radio-card-mask">
                  <div className="custom-radio-card-mask-dot" />
                </div>
                {{ item.name }}
              </a-space>
            </template>
          </a-radio>
        </template>
      </a-radio-group>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { Message } from '@arco-design/web-vue'
import { getTenantId, setTenantId } from '@/utils/tenant'
import { getTenantCommon } from '@/apis/tenant/management'

const { width } = useWindowSize()
const visible = ref(false)
const okLoading = ref(false)
const tenantList = ref()
const tenantId = ref(getTenantId())

const confirm = async () => {
  if (!getTenantId()) {
    Message.error('请确认需要登录的租户')
    return false
  } else {
    visible.value = true
  }
}

onMounted(async () => {
  const tenantCommon = await getTenantCommon()
  // 需要开启了多租户才显示租户选择款
  if (tenantCommon && tenantCommon.data.isEnabled) {
    if (tenantCommon.data.availableList.length > 0) {
      const hostname = window.location.hostname
      for (const item of tenantCommon.data.availableList) {
        // 如果有域名匹配则直接设置对应租户
        if (item.domain === hostname) {
          setTenantId(item.id)
          return false
        }
      }
    } else {
      // 如果后台没有配置租户则是默认系统租户
      setTenantId(0)
      return false
    }
    tenantList.value = tenantCommon.data.availableList
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
.tenant-select{
  width: 100%;
  padding: 10px 0;
}

.scrollable-container {
  height: 300px;
  overflow-y: auto;
  scrollbar-width: none;
  text-align: center;
  &-radio-group{
    width: 90%
  }
  &-radio{
    padding: 7px 0
  }
}

.custom-radio-card {
  padding: 10px 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.custom-radio-card-mask {
  height: 14px;
  width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  border: 1px solid var(--color-border-2);
  box-sizing: border-box;
}

.custom-radio-card-mask-dot {
  width: 8px;
  height: 8px;
  border-radius: 100%;
}

.custom-radio-card-title {
  color: var(--color-text-1);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.custom-radio-card:hover,
.custom-radio-card-checked,
.custom-radio-card:hover .custom-radio-card-mask,
.custom-radio-card-checked  .custom-radio-card-mask{
  border-color: rgb(var(--primary-6));
}

.custom-radio-card-checked {
  background-color: var(--color-primary-light-1);
}

.custom-radio-card:hover .custom-radio-card-title,
.custom-radio-card-checked .custom-radio-card-title {
  color: rgb(var(--primary-6));
}

.custom-radio-card-checked .custom-radio-card-mask-dot {
  background-color: rgb(var(--primary-6));
}
</style>

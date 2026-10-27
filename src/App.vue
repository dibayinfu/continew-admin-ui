<template>
  <a-config-provider update-at-scroll>
    <template #loading>
      <img :src="withBase('/static/images/loading.svg')" class="loading-icon" alt="loading" />
    </template>
    <template #empty>
      <a-empty :img-src="emptyStateImage" />
    </template>
    <a-watermark
      :content="appStore.isOpenWatermark ? (appStore.watermark || `${userStore.userInfo.nickname}(${userStore.userInfo.username})`) : ''"
      :zindex="9999"
      class="admin-ui-main"
    >
      <router-view></router-view>
    </a-watermark>
    <DaasLoginModal v-if="daasAuth.visible" />
  </a-config-provider>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import emptyStateImage from '@/assets/images/empty-state.png'
import { useAppStore, useUserStore } from '@/stores'
import { withBase } from '@/utils'
import { daasAuth } from '@/utils/daas'

// 登录弹窗包含滑块验证逻辑；仅在用户实际需要登录时才下载。
const DaasLoginModal = defineAsyncComponent(() => import('@/views/sanitation/components/DaasLoginModal.vue'))

defineOptions({ name: 'App' })
const userStore = useUserStore()
const appStore = useAppStore()
appStore.initTheme()
appStore.initSiteConfig()
</script>

<style scoped lang="scss">
.loading-icon {
  animation: arco-loading-circle 1s infinite cubic-bezier(0,0,1,1);
}

:deep(.arco-empty-image) img {
  height: 60px;
}
.admin-ui-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}
</style>

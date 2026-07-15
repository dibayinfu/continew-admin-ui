<template>
  <a-row justify="end" align="center">
    <a-space size="medium">
      <!-- 搜索 -->
      <Search v-if="isDesktop" />
      <!-- 项目配置 -->
      <a-tooltip content="项目配置" position="bl">
        <a-button size="mini" class="gi_hover_btn" @click="SettingDrawerRef?.open">
          <template #icon>
            <icon-settings :size="18" />
          </template>
        </a-button>
      </a-tooltip>

      <!-- 消息通知 -->
      <a-popover
        position="bottom"
        trigger="click"
        :content-style="{ marginTop: '-5px', padding: 0, border: 'none' }"
        :arrow-style="{ width: 0, height: 0 }"
      >
        <a-badge :count="displayUnreadCount" dot>
          <a-button size="mini" class="gi_hover_btn" :class="{ 'alarm-blink': displayUnreadCount > 0 }">
            <template #icon>
              <icon-notification :size="18" />
            </template>
          </a-button>
        </a-badge>
        <template #content>
          <Message />
        </template>
      </a-popover>

      <!-- 全屏切换组件 -->
      <a-tooltip v-if="!['xs', 'sm'].includes(breakpoint)" content="全屏切换" position="bottom">
        <a-button size="mini" class="gi_hover_btn" @click="toggle">
          <template #icon>
            <icon-fullscreen v-if="!isFullscreen" :size="18" />
            <icon-fullscreen-exit v-else :size="18" />
          </template>
        </a-button>
      </a-tooltip>

      <!-- 暗黑模式切换 -->
      <a-tooltip content="主题切换" position="bottom">
        <GiThemeBtn></GiThemeBtn>
      </a-tooltip>

      <!-- 管理员账户 -->
      <a-dropdown trigger="hover">
        <a-row align="center" :wrap="false" class="user">
          <!-- 管理员头像 -->
          <Avatar :src="userStore.avatar" :name="userStore.nickname" :size="32" />
          <span class="username">{{ userStore.nickname }}</span>
          <icon-down />
        </a-row>
        <template #content>
          <a-doption @click="router.push('/user/profile')">
            <span>个人中心</span>
          </a-doption>
          <a-doption @click="router.push('/user/message')">
            <span>消息中心</span>
          </a-doption>
          <a-divider :margin="0" />
          <a-doption @click="logout">
            <span>退出登录</span>
          </a-doption>
        </template>
      </a-dropdown>
    </a-space>
  </a-row>

  <SettingDrawer ref="SettingDrawerRef"></SettingDrawer>
</template>

<script setup lang="ts">
import { Modal } from '@arco-design/web-vue'
import { useFullscreen } from '@vueuse/core'
import { computed, ref } from 'vue'
import Message from './Message.vue'
import SettingDrawer from './SettingDrawer.vue'
import Search from './Search.vue'
import { sanitationAlarms } from '@/views/sanitation/data/alert-task'
import { vehicleAlarms } from '@/views/sanitation/data/vehicle-alert'
import { useUserStore } from '@/stores'
import { useBreakpoint, useDevice } from '@/hooks'

defineOptions({ name: 'HeaderRight' })

const { isDesktop } = useDevice()
const { breakpoint } = useBreakpoint()
const router = useRouter()
const userStore = useUserStore()
const sanitationUnreadCount = computed(() => sanitationAlarms.filter((item) => item.readStatus === '未读').length)
const vehicleUnreadCount = computed(() => vehicleAlarms.filter((item) => item.readStatus === '未读').length)
const displayUnreadCount = computed(() => sanitationUnreadCount.value + vehicleUnreadCount.value)

const { isFullscreen, toggle } = useFullscreen()

const SettingDrawerRef = ref<InstanceType<typeof SettingDrawer>>()

// 退出登录
const logout = () => {
  Modal.warning({
    title: '提示',
    content: '确认退出登录？',
    hideCancel: false,
    closable: true,
    onBeforeOk: async () => {
      try {
        await userStore.logout()
        await router.replace('/login')
        return true
      } catch (error) {
        return false
      }
    },
  })
}

</script>

<style scoped lang="scss">
.arco-dropdown-open .arco-icon-down {
  transform: rotate(180deg);
}

.user {
  cursor: pointer;
  color: var(--color-text-1);

  .username {
    margin-left: 10px;
    white-space: nowrap;
  }

  .arco-icon-down {
    transition: all 0.3s;
    margin-left: 2px;
  }
}

.alarm-blink {
  color: rgb(var(--red-6));
  animation: alarmBlink 1s ease-in-out infinite;
}

@keyframes alarmBlink {
  0%, 100% {
    background: rgba(var(--red-1), 0.65);
  }
  50% {
    background: rgba(var(--red-3), 0.95);
  }
}
</style>

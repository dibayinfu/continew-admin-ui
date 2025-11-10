<template>
  <div class="layout-columns">
    <div v-show="isDesktop" class="layout-columns__left">
      <!-- 左侧一级菜单区域 -->
      <OneLevelMenu :menus="oneLevelMenus" @menu-click="handleMenuItemClickByItem"></OneLevelMenu>

      <!-- 左侧二级菜单区域 -->
      <div class="layout-columns__right-menu">
        <div class="layout-columns__system-name gi_line_1">{{ appStore.getTitle() }}</div>
        <Menu
          v-if="twoLevelMenus.length > 1 || oneLevelMenuActiveRoute?.meta?.alwaysShow === true"
          class="layout-columns__menu" :menus="twoLevelMenus" :menu-style="{ width: '180px' }"
        />
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <section class="layout-columns__content">
      <Header />
      <Tabs v-if="appStore.tab" />
      <Main />
    </section>
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header/index.vue'
import Main from './components/Main.vue'
import Menu from './components/Menu/index.vue'
import OneLevelMenu from './components/OneLevelMenu/index.vue'
import Tabs from './components/Tabs/index.vue'
import { useAppStore } from '@/stores'
import { useLevelMenu } from '@/layout/hooks/useLevelMenu'
import { useDevice } from '@/hooks'

defineOptions({ name: 'LayoutColumns' })

const appStore = useAppStore()
const { isDesktop } = useDevice()

const { oneLevelMenus, twoLevelMenus, oneLevelMenuActiveRoute, getOneLevelMenus, handleMenuItemClickByItem } = useLevelMenu()
getOneLevelMenus()
</script>

<style lang="scss" scoped>
.layout-columns {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__left {
    display: flex;
    height: 100%;
    overflow: hidden;
    background-color: var(--color-bg-1);
  }

  &__right-menu {
    display: flex;
    flex-direction: column;
    width: 180px;
    overflow: hidden;
    background-color: var(--color-bg-1);
  }

  &__system-name {
    height: 56px;
    padding: 0 12px;
    color: var(--color-text-1);
    font-size: 20px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    user-select: none;
    transition: padding .2s;

    &:hover {
      color: $color-theme !important;
      cursor: pointer;
    }
  }
  &__menu {
    flex: 1;
    overflow: auto;
    border-right: 1px solid var(--color-border-2);
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }
}
</style>

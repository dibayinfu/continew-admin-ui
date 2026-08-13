<template>
  <div class="prd-panel">
    <a-collapse :default-active-key="[]" :bordered="false">
      <a-collapse-item key="prd" :header="header">
        <div class="prd-body">
          <div v-for="(section, i) in sections" :key="i" class="prd-section">
            <table class="prd-table">
              <tbody>
                <tr v-if="section.title" class="prd-section-row">
                  <td class="prd-section-title" colspan="2">{{ section.title }}</td>
                </tr>
                <tr v-for="(item, j) in section.items" :key="j">
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
</template>

<script setup lang="ts">
import type { PrdSection } from '../data/pageConfigs'

defineOptions({ name: 'PrdPanel' })

withDefaults(defineProps<{
  sections: PrdSection[]
  /** 折叠面板标题，默认「📋 产品需求说明」 */
  header?: string
}>(), {
  header: '📋 产品需求说明',
})
</script>

<style scoped lang="scss">
/* 产品需求说明折叠面板（公共组件，收敛各页面重复样式） */
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;

  :deep(.arco-collapse-item-header) {
    font-weight: 600;
    font-size: 14px;
  }
}

.prd-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.prd-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  tr {
    &:nth-child(even) {
      background: var(--color-fill-1);
    }
  }

  td {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    vertical-align: top;
    line-height: 1.6;
  }

  .prd-label {
    width: 140px;
    min-width: 140px;
    font-weight: 500;
    color: var(--color-text-2);
    white-space: nowrap;
  }
}
</style>

<template>
  <div class="gi-table" :class="{ 'gi-table--fullscreen': isFullscreen }">
    <a-row v-if="props.title" justify="space-between" align="center" class="gi-table__header">
      <a-space wrap>
        <slot name="custom-title">
          <div class="gi-table__header-title">{{ props.title }}</div>
        </slot>
      </a-space>
    </a-row>
    <a-row>
      <slot name="top"></slot>
    </a-row>
    <a-row justify="space-between" align="center" class="gi-table__toolbar">
      <a-space wrap class="gi-table__toolbar-left" :size="[8, 8]">
        <slot name="toolbar-left"></slot>
      </a-space>
      <a-space wrap class="gi-table__toolbar-right" :size="[8, 8]">
        <slot name="toolbar-right"></slot>
        <a-tooltip content="刷新">
          <a-button v-if="showRefreshBtn" @click="handleRefresh">
            <template #icon><icon-refresh /></template>
          </a-button>
        </a-tooltip>
        <a-dropdown v-if="showSizeBtn" @select="handleSizeChange">
          <a-tooltip content="尺寸">
            <a-button>
              <template #icon><icon-table-size style="width: 14px; height: 14px" /></template>
            </a-button>
          </a-tooltip>
          <template #content>
            <a-doption v-for="item in TABLE_SIZE_OPTIONS" :key="item.value" :value="item.value" :active="item.value === size">
              {{ item.label }}
            </a-doption>
          </template>
        </a-dropdown>
        <a-popover
          v-if="showSettingColumnBtn" trigger="click" position="br"
          :content-style="{ minWidth: '120px', padding: '6px 8px 10px' }"
        >
          <a-tooltip content="列设置">
            <a-button>
              <template #icon>
                <icon-settings />
              </template>
            </a-button>
          </a-tooltip>
          <template #content>
            <div class="gi-table__draggable">
              <VueDraggable v-model="settingColumnList">
                <div v-for="item in settingColumnList" :key="item.title" class="drag-item">
                  <div class="drag-item__move"><icon-drag-dot-vertical /></div>
                  <a-checkbox v-model:model-value="item.show" :disabled="item.disabled">{{ item.title }}</a-checkbox>
                </div>
              </VueDraggable>
            </div>
            <a-divider :margin="6" />
            <a-row justify="center">
              <a-button type="primary" size="mini" long @click="resetSettingColumns">
                <template #icon><icon-refresh /></template>
                <template #default>重置</template>
              </a-button>
            </a-row>
          </template>
        </a-popover>
        <a-tooltip content="全屏">
          <a-button v-if="showFullscreenBtn" @click="toggleFullscreen">
            <template #icon>
              <icon-fullscreen v-if="!isFullscreen" />
              <icon-fullscreen-exit v-else />
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
    </a-row>
    <a-row class="gi-table__toolbar-bottom">
      <slot name="toolbar-bottom"></slot>
    </a-row>
    <div class="gi-table__body" :class="`gi-table__body-pagination-${tableProps['page-position']}`">
      <div class="gi-table__container">
        <a-table
          ref="tableRef"
          v-bind="tableProps"
          :stripe="stripe"
          :size="size"
          :bordered="{ cell: isBordered }"
          :columns="visibleColumns"
          :scrollbar="true"
          :data="data"
          column-resizable
        >
          <template v-for="key in Object.keys(slots)" :key="key" #[key]="scope">
            <slot :key="key" :name="key" v-bind="scope" />
          </template>
        </a-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends TableData">
import { computed, ref, watch } from 'vue'
import type { DropdownInstance, TableColumnData, TableData, TableInstance } from '@arco-design/web-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { omit } from 'lodash-es'
import type { TableProps } from './type'

defineOptions({ name: 'GiTable' })

// Props 默认值
const props = withDefaults(defineProps<Props>(), {
  title: '',
  disabledColumnKeys: () => [],
  disabledTools: () => [],
  data: () => [],
})

/** Emits 类型定义 */
const emit = defineEmits<{
  (e: 'refresh'): void
}>()

/** Slots 类型定义 */
defineSlots<{
  'th': (props: { column: TableColumnData }) => void
  'thead': () => void
  'empty': (props: { column: TableColumnData }) => void
  'summary-cell': (props: { column: TableColumnData, record: T, rowIndex: number }) => void
  'pagination-right': () => void
  'pagination-left': () => void
  'td': (props: { column: TableColumnData, record: T, rowIndex: number }) => void
  'tr': (props: { record: T, rowIndex: number }) => void
  'tbody': () => void
  'drag-handle-icon': () => void
  'footer': () => void
  'expand-row': (props: { record: T }) => void
  'expand-icon': (props: { record: T, expanded?: boolean }) => void
  'columns': () => void
  'custom-title': () => void
  'top': () => void
  'toolbar-left': () => void
  'toolbar-right': () => void
  'toolbar-bottom': () => void
  [propsName: string]: (props: { key: string, record: T, column: TableColumnData, rowIndex: number }) => void
}>()

/** Props 类型定义 */
interface Props extends TableProps {
  /** 表格标题 */
  title?: string
  /** 禁止控制显示隐藏的列 */
  disabledColumnKeys?: string[]
  /** 禁止显示的工具 */
  disabledTools?: string[]
  /** 表格数据 */
  data: T[]
}

const slots = useSlots()
const attrs = useAttrs()

/** 表格属性计算 */
const tableProps = computed(() => ({
  ...omit(props, ['title', 'disabledColumnKeys', 'disabledTools']),
  ...attrs,
}))

/** 组件状态 */
const tableRef = useTemplateRef('tableRef')
const stripe = ref(false)
const size = ref<TableInstance['size']>('large')
const isBordered = ref(false)
const isFullscreen = ref(false)

/** 表格尺寸选项 */
const TABLE_SIZE_OPTIONS = [
  { label: '迷你', value: 'mini' },
  { label: '小型', value: 'small' },
  { label: '中等', value: 'medium' },
  { label: '大型', value: 'large' },
] as const

/** 处理表格尺寸变更 */
const handleSizeChange: DropdownInstance['onSelect'] = (value) => {
  if (value) {
    size.value = value as TableInstance['size']
  }
}

/** 处理表格刷新 */
const handleRefresh = () => {
  emit('refresh')
}

/** 切换全屏状态 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const showRefreshBtn = computed(() => !props.disabledTools?.includes('refresh'))
const showSizeBtn = computed(() => !props.disabledTools?.includes('size'))
const showFullscreenBtn = computed(() => !props.disabledTools?.includes('fullscreen'))
/** 列设置相关逻辑 */
const showSettingColumnBtn = computed(() => {
  const columns = props.columns as TableColumnData[] | undefined
  return !props.disabledTools?.includes('setting') && Boolean(columns?.length)
})

/** 列设置项类型 */
interface SettingColumnItem {
  /** 列标题 */
  title: string
  /** 列标识 */
  key: string
  /** 是否显示 */
  show: boolean
  /** 是否禁用 */
  disabled: boolean
}

const settingColumnList = ref<SettingColumnItem[]>([])

/** 重置列设置 */
const resetSettingColumns = () => {
  if (!props.columns) {
    settingColumnList.value = []
    return
  }

  const columns = props.columns as TableColumnData[]
  settingColumnList.value = columns.map((column) => {
    const key = column.dataIndex || (typeof column.title === 'string' ? column.title : '')
    return {
      key,
      title: typeof column.title === 'string' ? column.title : '',
      show: column.show ?? true,
      disabled: props.disabledColumnKeys.includes(key),
    }
  })
}

/** 监听属性变化，重置列设置 */
watch(
  () => props.columns,
  () => resetSettingColumns(),
  { immediate: true },
)

/** 计算显示的列 */
const visibleColumns = computed(() => {
  if (!props.columns) return []

  const columns = props.columns as TableColumnData[]
  const columnMap = new Map(
    columns.map((col) => [
      col.dataIndex || (typeof col.title === 'string' ? col.title : ''),
      col,
    ]),
  )

  // 按照设置列表的顺序返回可见列
  return settingColumnList.value
    .filter((item) => item.show)
    .map((item) => columnMap.get(item.key))
    .filter(Boolean) as TableColumnData[]
})

defineExpose({ tableRef })
</script>

<style lang="scss" scoped>
.gi-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  background: var(--color-bg-1);
  position: relative;
  box-sizing: border-box;
  &--fullscreen {
    padding: $padding;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1001;
  }

  &__container {
    max-height: 100%;
    overflow: hidden;
    flex: 1;

    // 控制table高度占满
    :deep(.arco-table-border:not(.arco-table-border-cell) .arco-table-container) {
      height: 100%;
    }

    :deep(.arco-table-container) {
      flex: 1;
    }

    :deep(.arco-table-body) {
      height: 100%;
    }

    // 控制表格最后一行的下边框显示
    :deep(.arco-table-border .arco-table-scroll-y .arco-table-body .arco-table-tr:last-of-type .arco-table-td,
      .arco-table-border .arco-table-scroll-y tfoot .arco-table-tr:last-of-type .arco-table-td) {
      border-bottom: 1px solid var(--color-border-table);
    }
  }

  &__body {

    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;

    //如果为空时，将表格铺满
    :deep(.arco-table-element):has(tbody .arco-table-tr-empty) {
      height: 100%;
    }

    // 分页默认位置
    :deep(.arco-pagination) {
      margin-top: 10px;
      justify-content: end;
    }

    &-pagination-top {
      flex-direction: column-reverse;

      :deep(.arco-pagination) {
        margin-bottom: 10px;
        justify-content: center;
      }
    }

    // 上
    &-pagination-t {
      &l {
        flex-direction: column-reverse;

        :deep(.arco-pagination) {
          margin-bottom: 10px;
          justify-content: start;
        }
      }

      &r {
        flex-direction: column-reverse;

        :deep(.arco-pagination) {
          margin-bottom: 10px;
          justify-content: end;
        }
      }
    }

    //下
    &-pagination-bottom {
      :deep(.arco-pagination) {
        margin-top: 10px;
        justify-content: center;
      }
    }

    &-pagination-b {
      &l {
        :deep(.arco-pagination) {
          margin-top: 10px;
          justify-content: start;
        }
      }

      &r {
        :deep(.arco-pagination) {
          margin-top: 10px;
          justify-content: end;
        }
      }
    }

    :deep(.link-text.arco-typography) {
      color: rgb(var(--link-6));
    }
  }

  &__header {
    padding: 0 0 10px;

    &-title {
      color: var(--color-text-1);
      font-size: 18px;
      font-weight: 500;
      line-height: 1.5;
    }
  }

  &__toolbar {
    :deep(.arco-form-item-layout-inline) {
      margin-right: 8px;

      &:last-of-type {
        margin-right: 0;
      }
    }

    :deep(.arco-form-layout-inline .arco-form-item) {
      margin-bottom: 0;
    }

    &-bottom {
      margin-bottom: 8px;
    }
  }

  &__draggable {
    padding: 1px 0; // 解决 max-height 和 overflow:auto 始终显示垂直滚动条问题
    max-height: 250px;
    box-sizing: border-box;
    overflow: hidden;
    overflow-y: auto;
  }
}

.drag-item {
  display: flex;
  align-items: center;

  cursor: pointer;

  &:hover {
    background-color: var(--color-fill-2);
  }

  &__move {
    padding-left: 2px;
    padding-right: 2px;
    cursor: move;
  }

  :deep(.arco-checkbox) {
    width: 100%;
    font-size: 12px;

    .arco-checkbox-icon {
      width: 14px;
      height: 14px;
    }
  }
}
</style>

<template>
  <div class="box-history-controls">
    <header class="box-history-header">
      <div class="box-history-title"><span>箱体编号</span><h2>{{ boxNo }}</h2><b>{{ title }}</b></div>
      <a-button type="text" size="large" class="box-history-close" :aria-label="`关闭${title}`" @click="emit('close')"><template #icon><icon-close /></template></a-button>
    </header>
    <div class="box-history-toolbar">
      <a-radio-group :model-value="view" type="button" size="small" aria-label="图形类型" @change="changeView">
        <a-radio v-for="item in views" :key="item.value" :value="item.value">{{ item.label }}</a-radio>
      </a-radio-group>
      <a-radio-group :model-value="days" type="button" size="small" aria-label="历史时间范围" @change="changeDays">
        <a-radio v-for="day in HISTORY_DAY_OPTIONS" :key="day" :value="day">近{{ day }}天</a-radio>
      </a-radio-group>
      <span>近{{ days }}天（{{ days * 24 }}小时） · 北京时间 · 采集时间</span>
      <a-button size="small" :loading="loading" @click="emit('refresh')"><template #icon><icon-refresh /></template>刷新</a-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { HISTORY_DAY_OPTIONS, METRIC_LABELS, type BoxHistoryDays, type BoxHistoryView } from '../box-history-metrics'
const props = defineProps<{ boxNo: string, view: BoxHistoryView, days: BoxHistoryDays, loading: boolean }>()
const emit = defineEmits<{
  (event: 'update:days', days: BoxHistoryDays): void
  (event: 'range-change'): void
  (event: 'view-change', view: BoxHistoryView): void
  (event: 'refresh'): void
  (event: 'close'): void
}>()
const views: Array<{ value: BoxHistoryView, label: string }> = [{ value: 'fillLevel', label: '垃圾占比' }, { value: 'temperature', label: '温度' }, { value: 'battery', label: '电量' }, { value: 'track', label: '轨迹' }]
const title = computed(() => props.view === 'track' ? '历史轨迹' : `${METRIC_LABELS[props.view]}曲线`)
function changeDays(value: string | number | boolean) {
  const days = Number(value) as BoxHistoryDays
  if (!HISTORY_DAY_OPTIONS.includes(days) || days === props.days) return
  emit('update:days', days)
  emit('range-change')
}
function changeView(value: string | number | boolean) {
  if (views.some(item => item.value === value) && value !== props.view) emit('view-change', value as BoxHistoryView)
}
</script>
<style scoped>
.box-history-controls { flex-shrink: 0; }
.box-history-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; }
.box-history-title { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }.box-history-title span { color: var(--color-text-3); font-size: 12px; }.box-history-title h2 { margin: 0; color: var(--color-text-1); font-size: 24px; line-height: 32px; }.box-history-title b { color: var(--color-text-1); font-size: 16px; }
.box-history-close { color: var(--color-text-3); }.box-history-close:hover { color: var(--color-text-1); background: var(--color-border-2); }
.box-history-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding-bottom: 12px; }.box-history-toolbar > span { color: var(--color-text-3); font-size: 12px; }.box-history-toolbar > .arco-btn { margin-left: auto; }
@media (max-width: 720px) { .box-history-title b { font-size: 14px; }.box-history-toolbar { gap: 8px; }.box-history-toolbar > span { width: 100%; order: 3; } }
</style>

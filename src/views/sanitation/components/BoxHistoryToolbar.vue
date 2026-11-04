<template>
  <div class="box-history-controls">
    <header class="box-history-header">
      <div class="box-history-title"><span>箱体编号</span><h2>{{ boxNo }}</h2><b>{{ title }}</b></div>
      <a-button type="text" size="large" class="box-history-close" :aria-label="`关闭${title}`" @click="emit('close')"><template #icon><icon-close /></template></a-button>
    </header>
    <div class="box-history-toolbar">
      <a-radio-group class="history-view-switch" :model-value="view" type="button" size="small" aria-label="图形类型" @change="changeView">
        <a-radio v-for="item in views" :key="item.value" :value="item.value">{{ item.label }}</a-radio>
      </a-radio-group>
      <a-radio-group class="history-day-switch" :model-value="customMode ? 'custom' : days" type="button" size="small" aria-label="历史时间范围" @change="changeDays">
        <a-radio v-for="day in HISTORY_DAY_OPTIONS" :key="day" :value="day">近{{ day }}天</a-radio>
        <a-radio value="custom">自定义</a-radio>
      </a-radio-group>
      <div v-if="customMode" class="history-custom-query">
        <a-range-picker v-model="draftRange" size="small" aria-label="自定义查询时间" show-time format="MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" :time-picker-props="{ format: 'HH:mm', defaultValue: ['00:00', '23:59'] }" :disabled-date="disabledDate" :allow-clear="false" class="history-custom-picker" @select="selectCalendarRange" @popup-visible-change="syncCalendarRange">
          <template #cell="{ date }">
            <div class="arco-picker-date history-calendar-date" :class="calendarDayClass(date)"><div class="arco-picker-date-value">{{ date.getDate() }}</div></div>
          </template>
        </a-range-picker>
        <a-button type="primary" size="small" @click="applyRange">查询</a-button>
      </div>
      <a-button class="history-refresh" size="small" aria-label="刷新历史数据" :loading="loading" @click="emit('refresh')"><template #icon><icon-refresh /></template><span class="history-refresh-label">刷新</span></a-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { beijingDate, beijingDateTime } from '@/utils/beijing-time'
import { HISTORY_DAY_OPTIONS, METRIC_LABELS, historyTimeRange, validateHistoryTimeRange, type BoxHistoryTimeRange, type BoxHistoryDays, type BoxHistoryView } from '../box-history-metrics'
const props = defineProps<{ boxNo: string, view: BoxHistoryView, days: BoxHistoryDays, loading: boolean, customRange?: BoxHistoryTimeRange }>()
const emit = defineEmits<{
  (event: 'update:days', days: BoxHistoryDays): void
  (event: 'update:customRange', range: BoxHistoryTimeRange | undefined): void
  (event: 'range-change'): void
  (event: 'view-change', view: BoxHistoryView): void
  (event: 'refresh'): void
  (event: 'close'): void
}>()
const views: Array<{ value: BoxHistoryView, label: string }> = [{ value: 'fillLevel', label: '垃圾占比' }, { value: 'temperature', label: '温度' }, { value: 'battery', label: '电量' }, { value: 'track', label: '轨迹' }]
const title = computed(() => props.view === 'track' ? '历史轨迹' : `${METRIC_LABELS[props.view]}曲线`)
const customMode = ref(!!props.customRange)
const draftRange = ref<string[]>([])
const calendarRange = ref<string[]>([])
function syncCalendarRange(visible: boolean) {
  if (visible) calendarRange.value = [...draftRange.value]
}
function selectCalendarRange(value: Array<string | undefined>) {
  calendarRange.value = value.map(date => date || '')
}
function calendarDayClass(date: Date) {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const [start, end] = calendarRange.value.map(value => value.slice(0, 10))
  if (disabledDate(date)) return {}
  return {
    'history-calendar-start': day === start,
    'history-calendar-end': day === end,
    'history-calendar-in-range': !!start && !!end && day >= start && day <= end,
  }
}
watch(() => props.customRange, (range) => {
  customMode.value = !!range
  if (range) draftRange.value = [range.from.replace('T', ' ').slice(0, 16), range.to.replace('T', ' ').slice(0, 16)]
}, { immediate: true })
function disabledDate(date: Date) {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return day < beijingDate(new Date(Date.now() - 7 * 86400000)) || day > beijingDate()
}
function applyRange() {
  const range = { from: (draftRange.value[0] || '').replace(' ', 'T'), to: (draftRange.value[1] || '').replace(' ', 'T') }
  // 今天默认可选择到23:59，实际历史查询截止当前分钟；更晚的日期仍拒绝。
  const now = beijingDateTime().slice(0, 16)
  if (range.to.slice(0, 10) === now.slice(0, 10) && range.to > now) range.to = now
  const error = validateHistoryTimeRange(range)
  if (error) { Message.warning(error); return }
  emit('update:customRange', range)
  emit('range-change')
}
function changeDays(value: string | number | boolean) {
  if (value === 'custom') {
    customMode.value = true
    if (!draftRange.value.length) {
      const range = historyTimeRange(props.days)
      draftRange.value = [`${range.from.slice(0, 10)} 00:00`, `${range.to.slice(0, 10)} 23:59`]
    }
    return
  }
  const days = Number(value) as BoxHistoryDays
  if (!HISTORY_DAY_OPTIONS.includes(days) || (days === props.days && !customMode.value)) return
  customMode.value = false
  emit('update:customRange', undefined)
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
.box-history-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding-bottom: 12px;
}
.history-view-switch,
.history-day-switch { flex: 0 0 auto; }
.history-custom-query {
  display: flex;
  align-items: center;
  flex: 0 1 368px;
  width: 368px;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}
/* 覆盖全局 .arco-picker 的满宽样式，时间框与查询按钮始终成组。 */
.history-custom-query :deep(.history-custom-picker) {
  flex: 0 1 300px;
  box-sizing: border-box;
  width: 300px;
  min-width: 0;
  max-width: 100%;
}
.history-custom-query :deep(.arco-btn) { flex: 0 0 auto; }
.box-history-toolbar .history-refresh { flex: 0 0 auto; margin-left: auto; }
@media (max-width: 720px) {
  .box-history-title b { font-size: 14px; }
  .box-history-toolbar { gap: 8px; }
  .box-history-toolbar .history-refresh { width: 28px; padding: 0; }
  .history-refresh-label { display: none; }
  .history-refresh :deep(.arco-btn-icon) { margin: 0; }
  .history-day-switch { order: 2; }
  .history-custom-query { order: 3; }
}
/* 自定义单元格保留组件的禁用态，同时让跨月日期也显示选中范围。 */
.history-calendar-date.history-calendar-in-range {
  background-color: var(--color-primary-light-1);
}
.history-calendar-date.history-calendar-start { border-radius: 24px 0 0 24px; }
.history-calendar-date.history-calendar-end { border-radius: 0 24px 24px 0; }
.history-calendar-date.history-calendar-start.history-calendar-end { border-radius: 24px; }
.history-calendar-date.history-calendar-start .arco-picker-date-value,
.history-calendar-date.history-calendar-end .arco-picker-date-value {
  color: var(--color-white);
  background-color: rgb(var(--primary-6));
  font-weight: 500;
}
</style>

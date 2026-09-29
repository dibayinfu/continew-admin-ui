<template>
  <div class="gi_page transport-page">
    <div class="page-title">运单统计</div>
    <div class="subtle">按创建时间统计已同步运单；重量缺失的运单仍计入单数。</div>
    <a-card :bordered="false">
      <a-space wrap>
        <a-button v-for="option in rangeOptions" :key="option.value" :type="preset === option.value ? 'primary' : 'outline'" @click="setRange(option.value)">{{ option.label }}</a-button>
        <a-date-picker v-model="from" value-format="YYYY-MM-DD" @change="preset = ''" />
        <span>至</span>
        <a-date-picker v-model="to" value-format="YYYY-MM-DD" @change="preset = ''" />
        <a-input v-model="township" allow-clear placeholder="乡镇" style="width: 140px" />
        <a-button type="primary" :loading="loading" @click="loadOverview">查询</a-button>
      </a-space>
    </a-card>
    <div class="summary">
      <a-card :bordered="false"><div class="subtle">运单数</div><strong>{{ overview.summary.taskCount }}</strong> 单</a-card>
      <a-card :bordered="false"><div class="subtle">垃圾量</div><strong>{{ formatWeight(overview.summary.weightTon) }}</strong> 吨<div class="subtle">{{ overview.summary.weightCount }} 单有重量</div></a-card>
      <a-card :bordered="false"><div class="subtle">最近同步</div><strong class="sync-time">{{ formatTime(overview.summary.dataUpdatedAt) }}</strong></a-card>
    </div>
    <div class="panels">
      <a-card title="每日运单走势" :bordered="false">
        <div class="legend"><span class="legend-bar" />运单数（单）<span class="legend-line" />垃圾量（吨）</div>
        <div v-if="!overview.daily.length" class="empty">该区间暂无运单</div>
        <div v-else class="chart-scroll">
          <div class="chart" :style="{ minWidth: `${Math.max(460, chartDays.length * 30)}px` }">
            <div class="chart-plot">
              <div v-for="row in chartDays" :key="row.day" class="bar" :class="{ active: selectedDay === row.day }" :title="`${row.day}：${row.taskCount} 单，${formatWeight(row.weightTon)} 吨`" @click="selectDay(row.day)">
                <span class="bar-value">{{ row.taskCount || '' }}</span><i :style="{ height: `${barHeight(row)}%` }" />
              </div>
              <svg v-if="chartDays.length > 1" class="line-overlay" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-label="每日垃圾量折线">
                <polyline :points="linePoints" fill="none" stroke="#f97316" stroke-width="2" vector-effect="non-scaling-stroke" />
                <circle v-for="(point, index) in lineDots" :key="index" :cx="point.x" :cy="point.y" r="3" fill="#f97316" vector-effect="non-scaling-stroke" />
              </svg>
            </div>
            <div class="chart-labels"><small v-for="row in chartDays" :key="row.day" :title="String(row.day)" @click="selectDay(row.day)">{{ chartDays.length > 14 ? String(row.day).slice(-2) : String(row.day).slice(5) }}</small></div>
          </div>
        </div>
      </a-card>
      <a-card title="乡镇排行" :bordered="false">
        <a-radio-group v-model="rankMetric" type="button" size="small"><a-radio value="taskCount">运单数</a-radio><a-radio value="weightTon">垃圾量</a-radio></a-radio-group>
        <a-empty v-if="!rankedTownships.length" description="暂无数据" />
        <div v-for="row in rankedTownships" :key="row.townshipName" class="rank"><span>{{ row.townshipName }}</span><b>{{ rankMetric === 'taskCount' ? `${row.taskCount} 单` : `${formatWeight(row.weightTon)} 吨` }}</b></div>
      </a-card>
    </div>
    <a-card :bordered="false" :title="selectedDay ? `${selectedDay} 运单明细` : '运单明细'">
      <a-space wrap class="detail-filter">
        <a-input v-model="taskNo" allow-clear placeholder="运单号" style="width: 160px" @press-enter="loadRecords(1)" />
        <a-input v-model="vehicle" allow-clear placeholder="车牌号" style="width: 150px" @press-enter="loadRecords(1)" />
        <a-input v-model="driver" allow-clear placeholder="司机姓名" style="width: 150px" @press-enter="loadRecords(1)" />
        <a-button @click="search">搜索</a-button>
        <a-button v-if="selectedDay" @click="clearDay">清除日期筛选</a-button>
      </a-space>
      <a-table row-key="taskId" :data="records" :loading="recordLoading" :pagination="pagination" :scroll="{ x: 1160 }" @page-change="loadRecords" @page-size-change="changeSize">
        <template #columns>
          <a-table-column title="创建时间" data-index="createdAt" :width="180"><template #cell="{ record }"><span class="cell-nowrap">{{ formatTime(record.createdAt) }}</span></template></a-table-column>
          <a-table-column title="箱号" data-index="boxNo" :width="90"><template #cell="{ record }">{{ record.boxNo || '—' }}</template></a-table-column>
          <a-table-column title="车牌号" data-index="vehicleNo" :width="130"><template #cell="{ record }"><span class="cell-nowrap">{{ record.vehicleNo || '—' }}</span></template></a-table-column>
          <a-table-column title="司机" data-index="driverName" :width="90"><template #cell="{ record }">{{ record.driverName || '—' }}</template></a-table-column>
          <a-table-column title="起始收集点" data-index="startPointName" :width="160"><template #cell="{ record }"><span class="cell-ellipsis" :title="record.startPointName || ''">{{ record.startPointName || '—' }}</span></template></a-table-column>
          <a-table-column title="中转站" data-index="destinationName" :width="220"><template #cell="{ record }"><span class="cell-ellipsis" :title="record.destinationName || ''">{{ record.destinationName || '—' }}</span></template></a-table-column>
          <a-table-column title="垃圾量（吨）" data-index="weightTon" :width="130"><template #cell="{ record }">{{ record.weightTon == null ? '—' : formatWeight(record.weightTon) }}</template></a-table-column>
          <a-table-column title="状态" data-index="statusName" :width="90"><template #cell="{ record }">{{ chineseStatus(record) }}</template></a-table-column>
          <a-table-column title="操作" :width="70"><template #cell="{ record }"><a-link @click="showDetail(record)">详情</a-link></template></a-table-column>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:visible="detailVisible" title="运单详情" :footer="false" width="680px">
      <a-descriptions v-if="detail" :column="2" bordered>
        <a-descriptions-item label="运单号">{{ detail.taskNo || detail.taskId }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatTime(detail.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="箱号">{{ detail.boxNo || '—' }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ chineseStatus(detail) }}</a-descriptions-item>
        <a-descriptions-item label="车牌号">{{ detail.vehicleNo || '—' }}</a-descriptions-item>
        <a-descriptions-item label="司机">{{ detail.driverName || '—' }}</a-descriptions-item>
        <a-descriptions-item label="起始收集点">{{ detail.startPointName || '—' }}</a-descriptions-item>
        <a-descriptions-item label="中转站">{{ detail.destinationName || '—' }}</a-descriptions-item>
        <a-descriptions-item label="垃圾量">{{ detail.weightTon == null ? '—' : `${formatWeight(detail.weightTon)} 吨` }}</a-descriptions-item>
      </a-descriptions>
      <div class="subtle raw-title">上游原始数据</div><pre class="raw">{{ rawDetail }}</pre>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { beijingDate } from '@/utils/beijing-time'

interface MetricRow { day: string; taskCount: number; weightTon: number }
interface TownshipRow { townshipName: string; taskCount: number; weightTon: number }
interface TaskRow { taskId: string; taskNo: string | null; taskStatus: string | null; statusName: string | null; vehicleNo: string | null; driverName: string | null; townshipName: string | null; createdAt: string | null; boxNo: string | null; startPointName: string | null; destinationName: string | null; weightTon: number | null; rawPayload: string | object }
interface Overview { summary: { taskCount: number; weightTon: number; weightCount: number; dataUpdatedAt: string | null }; daily: MetricRow[]; townships: TownshipRow[] }
type Preset = 'today' | 'yesterday' | 'week' | 'month'
const rangeOptions: { value: Preset; label: string }[] = [{ value: 'today', label: '今天' }, { value: 'yesterday', label: '昨天' }, { value: 'week', label: '近7天' }, { value: 'month', label: '近30天' }]
const base = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
const today = beijingDate()
const from = ref(dayjs(today).subtract(29, 'day').format('YYYY-MM-DD'))
const to = ref(today)
const preset = ref<Preset | ''>('month')
const township = ref('')
const vehicle = ref('')
const driver = ref('')
const taskNo = ref('')
const selectedDay = ref('')
const rankMetric = ref<'taskCount' | 'weightTon'>('taskCount')
const loading = ref(false)
const recordLoading = ref(false)
const overview = ref<Overview>({ summary: { taskCount: 0, weightTon: 0, weightCount: 0, dataUpdatedAt: null }, daily: [], townships: [] })
const records = ref<TaskRow[]>([])
const pagination = reactive({ current: 1, pageSize: 20, total: 0, showTotal: true, showPageSize: true, pageSizeOptions: [20, 50, 100] })
const detail = ref<TaskRow | null>(null)
const detailVisible = ref(false)
const rawDetail = computed(() => { try { const raw = detail.value?.rawPayload; return JSON.stringify(typeof raw === 'string' ? JSON.parse(raw) : raw, null, 2) } catch { return String(detail.value?.rawPayload || '') } })
const rankedTownships = computed(() => [...overview.value.townships].sort((a, b) => Number(b[rankMetric.value]) - Number(a[rankMetric.value])))
const chartDays = computed(() => {
  if (!dayjs(from.value).isValid() || !dayjs(to.value).isValid() || dayjs(to.value).diff(dayjs(from.value), 'day') > 30 || from.value > to.value) return []
  const byDay = new Map(overview.value.daily.map(row => [String(row.day), row]))
  const days: MetricRow[] = []
  for (let day = dayjs(from.value); !day.isAfter(dayjs(to.value)); day = day.add(1, 'day')) {
    const key = day.format('YYYY-MM-DD'); days.push(byDay.get(key) || { day: key, taskCount: 0, weightTon: 0 })
  }
  return days
})
const maxCount = computed(() => Math.max(1, ...chartDays.value.map(row => Number(row.taskCount))))
const maxWeight = computed(() => Math.max(1, ...chartDays.value.map(row => Number(row.weightTon))))
const lineDots = computed(() => chartDays.value.map((row, index) => ({ x: (index + .5) * 1000 / chartDays.value.length, y: 96 - Number(row.weightTon) / maxWeight.value * 88 })))
const linePoints = computed(() => lineDots.value.map(point => `${point.x},${point.y}`).join(' '))
function barHeight(row: MetricRow) { return Number(row.taskCount) / maxCount.value * 88 }
function formatWeight(value: number | null | undefined) { return Number(value || 0).toFixed(3).replace(/\.?0+$/, '') }
function formatTime(value: string | null | undefined) { return value ? value.replace('T', ' ').slice(0, 16) : '—' }
function chineseStatus(row: TaskRow) {
  if (row.statusName && /[\u4e00-\u9fa5]/.test(row.statusName)) return row.statusName
  const raw = (row.taskStatus || row.statusName || '').trim().toUpperCase()
  if (/[\u4e00-\u9fa5]/.test(raw)) return raw
  const names: Record<string, string> = { PENDING: '待接单', UNACCEPTED: '待接单', ACCEPTED: '已接单', IN_PROGRESS: '收运中', PROCESSING: '收运中', TRANSPORTING: '收运中', COMPLETED: '已完成', FINISHED: '已完成', DONE: '已完成', CANCELLED: '已取消', CANCELED: '已取消' }
  return names[raw] || '未知状态'
}
function setRange(value: Preset) {
  preset.value = value
  const current = dayjs(beijingDate())
  to.value = current.subtract(value === 'yesterday' ? 1 : 0, 'day').format('YYYY-MM-DD')
  from.value = current.subtract(value === 'week' ? 6 : value === 'month' ? 29 : value === 'yesterday' ? 1 : 0, 'day').format('YYYY-MM-DD')
  void loadOverview()
}
function params(extra: Record<string, string> = {}) { return new URLSearchParams({ from: from.value, to: to.value, township: township.value, vehicle: vehicle.value, ...extra }) }
async function getJson<T>(path: string, query: URLSearchParams): Promise<T> { const response = await fetch(`${base}/api/metrics/transport-statistics${path}?${query}`); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json() as Promise<T> }
async function loadOverview() {
  if (!from.value || !to.value || from.value > to.value || dayjs(to.value).diff(dayjs(from.value), 'day') > 30 || to.value > beijingDate()) { Message.warning('请选择过去 31 天以内的统计区间'); return }
  loading.value = true; selectedDay.value = ''
  try { overview.value = await getJson<Overview>('/overview', params()); await loadRecords(1) }
  catch (error) { Message.error(`获取运单统计失败：${error instanceof Error ? error.message : '网络异常'}`) }
  finally { loading.value = false }
}
async function loadRecords(page = pagination.current) {
  recordLoading.value = true; pagination.current = page
  const day = selectedDay.value
  try {
    const data = await getJson<{ total: number; list: TaskRow[] }>('/records', params({ from: day || from.value, to: day || to.value, taskNo: taskNo.value, driver: driver.value, page: String(page), size: String(pagination.pageSize) }))
    if (day !== selectedDay.value) return
    records.value = data.list; pagination.total = data.total
  } catch (error) { Message.error(`获取运单明细失败：${error instanceof Error ? error.message : '网络异常'}`) }
  finally { recordLoading.value = false }
}
function search() { void loadOverview() }
function selectDay(day: string) { selectedDay.value = day; void loadRecords(1) }
function clearDay() { selectedDay.value = ''; void loadRecords(1) }
function changeSize(size: number) { pagination.pageSize = size; void loadRecords(1) }
function showDetail(row: TaskRow) { detail.value = row; detailVisible.value = true }
onMounted(() => { void loadOverview() })
</script>

<style scoped>
.transport-page { display: flex; flex-direction: column; gap: 14px; }
.page-title { font-size: 20px; font-weight: 600; }
.subtle { color: var(--color-text-3); font-size: 12px; }
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.summary strong { font-size: 24px; }
.summary .sync-time { font-size: 16px; }
.panels { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }
.legend { display: flex; align-items: center; gap: 8px; color: var(--color-text-2); font-size: 12px; }
.legend-bar { width: 12px; height: 12px; background: rgb(var(--arcoblue-4)); }
.legend-line { width: 16px; height: 2px; margin-left: 12px; background: #f97316; }
.chart-scroll { overflow-x: auto; }
.chart { margin-top: 12px; }
.chart-plot { display: flex; position: relative; height: 170px; align-items: end; }
.bar { display: flex; flex: 1; min-width: 0; height: 100%; flex-direction: column; align-items: center; justify-content: end; cursor: pointer; }
.bar i { display: block; width: min(24px, 75%); background: rgb(var(--arcoblue-4)); }
.bar.active i, .bar:hover i { background: rgb(var(--arcoblue-6)); }
.bar-value { font-size: 10px; color: var(--color-text-2); }
.line-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.chart-labels { display: flex; }.chart-labels small { flex: 1; min-width: 0; text-align: center; font-size: 10px; white-space: nowrap; cursor: pointer; }
.cell-nowrap { white-space: nowrap; }
.cell-ellipsis { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border-2); }
.empty { padding: 70px 0; text-align: center; color: var(--color-text-3); }
.detail-filter { margin-bottom: 12px; }
.raw-title { margin: 16px 0 6px; }.raw { max-height: 300px; overflow: auto; padding: 12px; background: var(--color-fill-2); font-size: 12px; }
@media (max-width: 900px) { .summary, .panels { grid-template-columns: 1fr; } }
</style>

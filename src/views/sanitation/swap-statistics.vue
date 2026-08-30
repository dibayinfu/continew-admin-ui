<template>
  <div class="gi_page swap-statistics-page">
    <div class="page-header">
      <div>
        <div class="page-title">换箱统计</div>
        <div class="page-subtitle">按收集点识别满溢旧箱与新箱的更换记录</div>
      </div>
      <a-space>
        <a-button size="small" @click="openExcludedPoints">排除收集点配置</a-button>
        <a-dropdown position="br">
          <a-button size="small">更多<icon-down /></a-button>
          <template #content>
            <a-doption @click="openLogin">登录 / 更新 Token</a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>

    <div class="query-toolbar">
      <a-space wrap>
        <a-button size="small" :type="rangePreset === 'week' ? 'primary' : 'outline'" @click="applyRange('week')">近7天</a-button>
        <a-button size="small" :type="rangePreset === 'month' ? 'primary' : 'outline'" @click="applyRange('month')">近30天</a-button>
        <span class="toolbar-divider" />
        <span class="filter-label">统计区间</span>
        <a-date-picker v-model="from" size="small" value-format="YYYY-MM-DD" style="width: 132px" @change="rangePreset = ''" />
        <span class="date-separator">至</span>
        <a-date-picker v-model="to" size="small" value-format="YYYY-MM-DD" style="width: 132px" @change="rangePreset = ''" />
        <a-button size="small" type="primary" :loading="loading" @click="loadStatistics">查询</a-button>
      </a-space>
    </div>

    <div class="overview-grid">
      <a-card class="trend-card" :bordered="false">
        <template #title>每日换箱趋势 <span class="card-subtitle">{{ trendSummary }}</span></template>
        <a-spin :loading="loading" class="chart-wrap">
          <a-empty v-if="!daily.length" description="当前区间暂无换箱记录" />
          <div v-else class="bar-chart">
            <button v-for="item in daily" :key="item.day" class="bar-column" :class="{ active: selectedDay === item.day }" type="button" :title="item.day" @click="selectDay(item.day)">
              <span class="bar-value">{{ item.boxCount }}</span>
              <span class="bar-track"><span class="bar-fill" :style="{ height: `${barHeight(item.boxCount)}%` }" /></span>
              <span class="bar-label">{{ dayLabel(item.day) }}</span>
            </button>
          </div>
        </a-spin>
      </a-card>
      <a-card class="rank-card" :bordered="false">
        <template #title>乡镇换箱排行 <span class="card-subtitle">{{ selectedDay }}</span></template>
        <a-spin :loading="loading">
          <a-empty v-if="!townships.length" description="暂无数据" :image-style="{ height: '48px' }" />
          <div v-else class="rank-list">
            <div v-for="(item, index) in townships" :key="item.townshipName" class="rank-item">
              <b class="rank-no" :class="{ top: index < 3 }">{{ index + 1 }}</b>
              <span class="rank-name">{{ item.townshipName }}</span>
              <span class="rank-track"><i :style="{ width: `${rankWidth(item.boxCount)}%` }" /></span>
              <strong>{{ item.boxCount }}</strong>
            </div>
          </div>
        </a-spin>
      </a-card>
    </div>

    <a-card class="record-card" :bordered="false">
      <template #title>换箱明细 <span class="card-subtitle">{{ selectedDay || '-' }}</span></template>
      <a-table
        row-key="recordKey"
        :data="records"
        :columns="columns"
        :loading="recordLoading"
        :pagination="pagination"
        :scroll="{ x: 940 }"
        stripe
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #swapTime="{ record }">{{ formatDateTime(record.swapTime) }}</template>
        <template #point="{ record }">
          <div>{{ record.pointName || '-' }}</div>
        </template>
        <template #township="{ record }">{{ record.townshipName || '-' }}</template>
        <template #village="{ record }">{{ record.villageName || '-' }}</template>
        <template #boxChange="{ record }">
          <div class="box-change-flow">
            <span class="box-change old">{{ record.oldBoxNo || '-' }} <small>{{ formatPercent(record.oldFillLevel) }}</small></span>
            <icon-arrow-right class="change-arrow" />
            <span class="box-change new">{{ record.newBoxNo || '未知' }}</span>
          </div>
        </template>
        <template #alarmTime="{ record }">{{ formatDateTime(record.lastAlarmTime) }}</template>
        <template #vehicleNo="{ record }">
          <a-tag v-if="record.vehicleNo" color="arcoblue">{{ record.vehicleNo }}</a-tag>
          <span v-else class="empty-value">-</span>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="excludedPointsVisible" title="不纳入换箱统计的收集点" :width="640" :ok-loading="excludedPointsSaving" @before-ok="saveExcludedPoints">
      <p class="modal-tip">配置垃圾倾倒点等不应统计换箱的收集点。保存后，后端后续采集将跳过这些收集点。</p>
      <a-select v-model="excludedPointIds" multiple allow-clear allow-search placeholder="选择需要排除的收集点" style="width: 100%" :loading="excludedPointsLoading">
        <a-option v-for="point in allPoints" :key="point.pointId" :value="point.pointId">
          {{ [point.townshipName, point.villageName, point.pointName].filter(Boolean).join(' / ') }}
        </a-option>
      </a-select>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnData } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { daasAuth, daasRequest } from '@/utils/daas'

defineOptions({ name: 'SanitationSwapStatistics' })

interface DailyStatistic { day: string, boxCount: number }
interface TownshipStatistic { townshipName: string, boxCount: number }
interface StatisticsOverview { daily: DailyStatistic[], townships: TownshipStatistic[] }
interface PointOption { pointId: number, pointName: string, townshipName: string, villageName: string, excluded: boolean }
interface SwapRecord {
  id: number
  swapTime: string
  pointId: number
  pointName: string
  townshipName: string
  villageName: string
  oldBoxNo: string
  oldFillLevel: number | null
  newBoxNo: string
  newFillLevel: number | null
  lastAlarmTime: string | null
  vehicleNo: string | null
  recordKey: string
}

const collectorBaseUrl = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
const to = ref(dayjs().format('YYYY-MM-DD'))
const from = ref(dayjs().subtract(1, 'month').format('YYYY-MM-DD'))
const rangePreset = ref<'week' | 'month' | ''>('month')
const selectedDay = ref(to.value)
const daily = ref<DailyStatistic[]>([])
const records = ref<SwapRecord[]>([])
const townships = ref<TownshipStatistic[]>([])
const loading = ref(false)
const recordLoading = ref(false)
/** 换箱明细采用服务端分页：默认 20 条/页，支持 20/50/100/200。 */
const pagination = reactive({ current: 1, pageSize: 20, total: 0, showTotal: true, showPageSize: true, pageSizeOptions: [20, 50, 100, 200] })
const excludedPointsVisible = ref(false)
const excludedPointsLoading = ref(false)
const excludedPointsSaving = ref(false)
const allPoints = ref<PointOption[]>([])
const excludedPointIds = ref<number[]>([])

const maxCount = computed(() => Math.max(...daily.value.map((item) => item.boxCount), 1))
const maxTownshipCount = computed(() => Math.max(...townships.value.map((item) => item.boxCount), 1))
const trendSummary = computed(() => `共 ${daily.value.reduce((sum, item) => sum + item.boxCount, 0)} 次`)

const columns: TableColumnData[] = [
  {
    title: '换箱时间', dataIndex: 'swapTime', slotName: 'swapTime', width: 155,
    sortable: { sortDirections: ['ascend', 'descend'], sorter: (a, b) => String(a.swapTime).localeCompare(String(b.swapTime)) },
  },
  {
    title: '乡镇', dataIndex: 'townshipName', slotName: 'township', width: 90,
    sortable: { sortDirections: ['ascend', 'descend'], sorter: (a, b) => String(a.townshipName || '').localeCompare(String(b.townshipName || ''), 'zh-CN') },
  },
  { title: '村庄', dataIndex: 'villageName', slotName: 'village', width: 90 },
  { title: '收集点', dataIndex: 'pointName', slotName: 'point', width: 140 },
  { title: '换箱过程', dataIndex: 'oldBoxNo', slotName: 'boxChange', width: 175 },
  {
    title: '作业车辆', dataIndex: 'vehicleNo', slotName: 'vehicleNo', width: 120,
    sortable: { sortDirections: ['ascend', 'descend'], sorter: (a, b) => String(a.vehicleNo || '').localeCompare(String(b.vehicleNo || ''), 'zh-CN') },
  },
  { title: '最后告警时间', dataIndex: 'lastAlarmTime', slotName: 'alarmTime', width: 155 },
]

function endpoint(path: string) { return `${collectorBaseUrl}/api/collector/statistics${path}` }
function query(params: Record<string, string>) { return new URLSearchParams(params).toString() }
function barHeight(count: number) { return Math.max((count / maxCount.value) * 100, 5) }
function rankWidth(count: number) { return Math.max((count / maxTownshipCount.value) * 100, 4) }
/** 柱条较密集时只显示“日”（悬停可看完整日期），避免横坐标标签换行。 */
function dayLabel(day: string) { return daily.value.length > 18 ? day.slice(8) : day.slice(5) }
function formatDateTime(value: string) { return value ? value.replace('T', ' ').slice(0, 16) : '-' }
function formatPercent(value: number | null) { return value === null || value === undefined ? '-' : `${Math.round(value)}%` }
function openLogin() { daasAuth.visible = true }

async function loadRecords() {
  if (!selectedDay.value) return
  recordLoading.value = true
  const day = selectedDay.value
  try {
    const response = await fetch(`${endpoint('/records')}?${query({ day, page: String(pagination.current), size: String(pagination.pageSize) })}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json() as { total: number, list: Omit<SwapRecord, 'recordKey'>[] }
    if (day !== selectedDay.value) return
    records.value = data.list.map((item) => ({ ...item, recordKey: String(item.id) }))
    pagination.total = data.total
  } catch (error) {
    if (day !== selectedDay.value) return
    records.value = []
    pagination.total = 0
    Message.error(`获取换箱明细失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { recordLoading.value = false }
}

async function loadTownships() {
  if (!selectedDay.value) return
  // 同时携带 day/from/to：兼容仍在运行的旧后端，且保证其统计区间收敛为当前选中日期。
  const response = await fetch(`${endpoint('/townships')}?${query({ day: selectedDay.value, from: selectedDay.value, to: selectedDay.value })}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  townships.value = await response.json() as TownshipStatistic[]
}

async function loadStatistics() {
  if (!from.value || !to.value) { Message.warning('请选择完整统计区间'); return }
  if (from.value > to.value) { Message.warning('开始日期不能晚于结束日期'); return }
  loading.value = true
  const requestedDay = selectedDay.value
  try {
    const response = await fetch(`${endpoint('/overview')}?${query({ from: from.value, to: to.value, day: selectedDay.value })}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const overview = await response.json() as StatisticsOverview
    daily.value = overview.daily
    // 当天还没有换箱记录时，也保留当天柱状条，确保刷新后有明确的默认选中日期。
    if (!daily.value.some((item) => item.day === requestedDay) && requestedDay >= from.value && requestedDay <= to.value) {
      daily.value.push({ day: requestedDay, boxCount: 0 })
      daily.value.sort((a, b) => a.day.localeCompare(b.day))
    }
    // 用户切换日期后，较早的概览请求可能才返回；不得用旧日期的明细覆盖当前选择。
    if (requestedDay !== selectedDay.value) return
    townships.value = overview.townships
    // 明细已改为服务端分页，查询后回到第一页并单独拉取。
    pagination.current = 1
    await loadRecords()
  } catch (error) {
    daily.value = []
    townships.value = []
    records.value = []
    Message.error(`获取换箱统计失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { loading.value = false }
}

function applyRange(range: 'week' | 'month') {
  rangePreset.value = range
  to.value = dayjs().format('YYYY-MM-DD')
  from.value = dayjs().subtract(range === 'week' ? 6 : 1, range === 'week' ? 'day' : 'month').format('YYYY-MM-DD')
  loadStatistics()
}

async function openExcludedPoints() {
  excludedPointsVisible.value = true
  excludedPointsLoading.value = true
  try {
    const response = await fetch(endpoint('/excluded-points'))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    allPoints.value = await response.json() as PointOption[]
    excludedPointIds.value = allPoints.value.filter((point) => point.excluded).map((point) => point.pointId)
  } catch (error) {
    Message.error(`获取收集点配置失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { excludedPointsLoading.value = false }
}

async function saveExcludedPoints() {
  excludedPointsSaving.value = true
  try {
    const response = await fetch(endpoint('/excluded-points'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointIds: excludedPointIds.value }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    Message.success('排除收集点配置已保存，将在后续采集中生效')
    return true
  } catch (error) {
    Message.error(`保存收集点配置失败：${error instanceof Error ? error.message : '网络异常'}`)
    return false
  } finally { excludedPointsSaving.value = false }
}

/** 页面刷新时校验 DAAS token；失效时 daasRequest 会自动打开全局登录弹窗，并在登录后将新 token 同步给采集服务。 */
async function verifyDaasToken() {
  await daasRequest('/domestic/waste/v/alarm-tasks/page', {
    query: { organizationId: 506, page: 0, size: 1 },
  })
}

async function selectDay(day: string) {
  if (selectedDay.value === day) return
  selectedDay.value = day
  pagination.current = 1
  loading.value = true
  try {
    await Promise.all([loadRecords(), loadTownships()])
  } catch (error) {
    townships.value = []
    Message.error(`获取乡镇换箱排行失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { loading.value = false }
}

function handlePageChange(page: number) {
  pagination.current = page
  loadRecords()
}
function handlePageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  loadRecords()
}

onMounted(async () => {
  selectedDay.value = dayjs().format('YYYY-MM-DD')
  // 本地统计不依赖外部 DAAS 响应，先加载首屏；Token 校验仅负责失效时打开登录入口。
  void verifyDaasToken().catch((error) => {
    // 用户取消登录时不显示额外提示，登录弹窗已给出明确操作入口。
    if (error instanceof Error && error.message !== '登录已取消') Message.warning(`Token 校验失败：${error.message}`)
  })
  await loadStatistics()
})
</script>

<style scoped lang="scss">
.swap-statistics-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 14px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle { color: #86909c; font-size: 13px; }
.query-toolbar { padding: 10px 0; border-block: 1px solid var(--color-border-2); }
.toolbar-divider { width: 1px; height: 16px; background: var(--color-border-2); }
.date-separator, .filter-label { color: var(--color-text-2); font-size: 13px; }
.overview-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(220px, 1fr); gap: 14px; }
.trend-card, .rank-card, .record-card { border-radius: 6px; }
.chart-wrap { display: block; width: 100%; min-height: 220px; }
.bar-chart { display: flex; align-items: end; gap: 4px; height: 220px; padding: 6px 6px 0; }
.bar-column { display: grid; grid-template-rows: 22px 150px 20px; align-items: end; min-width: 0; flex: 1; padding: 0; border: 0; background: transparent; color: var(--color-text-3); cursor: pointer; }
.bar-column:hover, .bar-column.active { color: rgb(var(--arcoblue-6)); }
.bar-value { text-align: center; font-size: 13px; font-weight: 600; }
.bar-track { display: flex; align-items: end; justify-content: center; height: 150px; border-bottom: 1px solid var(--color-border-2); }
.bar-fill { width: min(34px, 60%); min-height: 5px; border-radius: 5px 5px 0 0; background: rgb(var(--arcoblue-4)); transition: height .2s; }
.bar-column:hover .bar-fill, .bar-column.active .bar-fill { background: rgb(var(--arcoblue-6)); }
.bar-label { padding-top: 6px; text-align: center; font-size: 12px; white-space: nowrap; }
.rank-list { display: grid; gap: 12px; padding-block: 5px; }
.rank-item { display: grid; grid-template-columns: 20px 62px minmax(30px, 1fr) 24px; align-items: center; gap: 8px; min-width: 0; font-size: 13px; }
.rank-no { color: var(--color-text-4); text-align: center; }.rank-no.top { color: rgb(var(--orange-6)); }
.rank-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-2); }
.rank-track { height: 6px; overflow: hidden; border-radius: 4px; background: var(--color-fill-2); }.rank-track i { display: block; height: 100%; border-radius: inherit; background: rgb(var(--arcoblue-4)); }
.rank-item strong { color: var(--color-text-1); text-align: right; }
small, .card-subtitle { color: var(--color-text-3); font-size: 12px; }
.card-subtitle { margin-left: 8px; font-weight: normal; }
.box-change-flow { display: flex; align-items: center; gap: 7px; white-space: nowrap; }.box-change { font-family: var(--font-family-mono); font-weight: 600; }.box-change small { margin-left: 3px; }
.box-change.old { color: rgb(var(--red-6)); }
.box-change.new { color: rgb(var(--green-6)); }
.change-arrow { color: var(--color-text-4); }
.empty-value { color: var(--color-text-4); }
.modal-tip { margin-top: 0; color: var(--color-text-3); line-height: 1.7; }
@media (max-width: 900px) { .overview-grid { grid-template-columns: 1fr; } }
</style>

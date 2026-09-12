<template>
  <div class="gi_page weighing-page">
    <header class="page-header">
      <div><div class="page-title">整车称重分析</div><div class="page-subtitle">按车识别换箱前后稳定平台，估算垃圾增量</div></div>
      <a-space class="header-actions" size="small" wrap>
        <a-tooltip content="分析参考设置"><a-button type="text" size="small" aria-label="分析参考设置" @click="openSettings"><template #icon><icon-settings /></template></a-button></a-tooltip>
        <a-button size="small" :disabled="!currentBatchId" @click="resetSelection">查看全部</a-button>
        <a-popconfirm content="将删除此批次及全部原始称重记录，操作不可恢复。" type="warning" @ok="deleteBatch">
          <a-button size="small" status="danger" :disabled="!currentBatchId">删除批次</a-button>
        </a-popconfirm>
      </a-space>
    </header>

    <div class="weighing-body" :class="{ collapsed }">
      <aside class="batch-aside" :class="{ collapsed }">
        <div class="aside-title">
          <span v-if="!collapsed">导入批次</span>
          <a-button type="text" size="mini" @click="collapsed = !collapsed"><icon-menu-fold v-if="!collapsed" /><icon-menu-unfold v-else /></a-button>
        </div>
        <template v-if="!collapsed">
          <input ref="fileInput" type="file" accept=".xlsx" class="hidden-input" @change="uploadFile">
          <a-button type="primary" long :loading="uploading" @click="fileInput?.click()"><template #icon><icon-upload /></template>导入 Excel</a-button>
          <p class="format-tip">固定表头：时间、重量、车牌号、VIN码、设备号</p>
          <a-spin :loading="batchLoading" class="batch-list">
            <a-empty v-if="!batches.length" description="尚未导入批次" :image-style="{ height: '56px' }" />
            <button v-for="item in batches" :key="item.id" type="button" class="batch-item" :class="{ active: currentBatchId === item.id }" @click="selectBatch(item.id)">
              <b>{{ item.fileName }}</b>
              <span>{{ item.vehicleNo || '未填写车牌' }} · {{ item.recordCount }} 条</span>
              <span>{{ formatTime(item.startTime) }} 至 {{ formatTime(item.endTime) }}</span>
              <small>导入于 {{ formatTime(item.importedAt) }}</small>
            </button>
          </a-spin>
        </template>
      </aside>

      <main class="analysis-main">
        <a-empty v-if="!currentBatch" description="请从左侧选择或导入一个称重 Excel 批次" class="main-empty" />
        <template v-else>
        <a-card class="chart-card">
          <template #title>时间 - 重量曲线 <small>{{ selectedSummary }}</small></template>
          <a-spin :loading="chartLoading" class="analysis-content">
            <VChart v-if="records.length" ref="chart" class="weight-chart" :option="chartOption" autoresize @brush-selected="handleBrushSelected" @datazoom="handleDataZoom" @restore="resetSelection" />
            <a-empty v-else description="该时段没有原始称重记录" />
          </a-spin>
        </a-card>
        <a-card class="table-card">
          <template #title>
            <div class="analysis-title">
              <span>动态分析</span>
              <small>垃圾增量 = 操作后平台中位数 − 操作前平台中位数</small>
            </div>
          </template>
          <div v-if="analysisResult" class="analysis-summary">
            <span>当前区间候选 <b>{{ analysisResult.summary.candidateCount }}</b> 次</span>
            <span>可估算 <b>{{ analysisResult.summary.estimatedCount }}</b> 次</span>
            <span>待核实 <b>{{ analysisResult.summary.unresolvedCount }}</b> 次</span>
            <span>估算合计 <b>{{ analysisResult.summary.estimatedCount ? formatWeight(analysisResult.summary.estimatedTotal) : '暂无可估算结果' }}</b></span>
          </div>
          <p class="analysis-note">仅为换箱候选的读数差估算，尚未核验车辆比例标定、两箱皮重及司机状态。缩放只筛选事件，保留区间外的完整取值依据。</p>
          <a-alert v-if="analysisError" type="error" class="analysis-error">{{ analysisError }}</a-alert>
          <div class="analysis-toolbar">
            <span v-if="analysisResult">本车平台波动容差 {{ formatWeight(analysisResult.profile.stableTolerance) }} · 零值 {{ analysisResult.profile.zeroPercent }}%</span>
            <label><a-switch v-model="showPlatforms" size="small" /> 显示稳定平台</label>
          </div>
          <a-table :data="displaySegments" :columns="columns" row-key="id" :loading="analysisLoading" :pagination="{ pageSize: 20, showTotal: true }" :scroll="{ x: 1140 }" stripe>
            <template #empty><a-empty description="该区间未找到具备前后平台证据的换箱候选；不代表垃圾量为0，可打开稳定平台检查" /></template>
            <template #type="{ record }"><a-tag :color="typeColor(record.type)">{{ record.type }}</a-tag></template>
            <template #period="{ record }"><span class="period">{{ formatPeriod(record.startTime, record.endTime) }}</span></template>
            <template #businessState="{ record }"><span>{{ record.businessState }}</span></template>
            <template #beforeWeight="{ record }">{{ formatWeight(record.evidence?.before?.weight) }}</template>
            <template #afterWeight="{ record }">{{ formatWeight(record.evidence?.after?.weight ?? (record.type === '稳定' ? record.stableWeight : null)) }}</template>
            <template #garbageWeight="{ record }"><strong v-if="record.garbageWeight !== null" class="garbage-value">≈ {{ formatWeight(record.garbageWeight) }}</strong><span v-else>—</span></template>
            <template #abnormal="{ record }"><span :class="{ abnormal: record.quality === '待核实' }">{{ record.abnormal }}</span></template>
            <template #evidence="{ record }"><a-button v-if="record.evidence" type="text" size="small" @click="openEvidence(record)">计算依据</a-button></template>
          </a-table>
          <a-collapse v-if="analysisResult" class="algorithm-details">
            <a-collapse-item key="algorithm" header="算法规则与本车数据质量">
              <p>仅使用 {{ analysisResult.profile.vehicleNo }} 当前批次的 {{ analysisResult.profile.rawCount }} 条原始记录；按 {{ analysisResult.profile.bucketSeconds }} 秒分桶取中位数，再对稳定平台内的桶等权取中位数。不会用全车队统一的空箱读数扣重，也不使用图中的9点移动平均线计算。</p>
              <p>平台至少5桶、持续 {{ analysisResult.profile.minPlatformSeconds / 60 }}～{{ analysisResult.profile.maxPlatformSeconds / 60 }} 分钟；同时检查整段波动和趋势。连续下降后等待回升平台，最长 {{ analysisResult.profile.maxWaitSeconds / 60 }} 分钟，不以350米截断。</p>
              <p>本车相邻非零桶变化中位数 {{ formatWeight(analysisResult.profile.noise) }}；平台波动容差 {{ formatWeight(analysisResult.profile.stableTolerance) }}。非零读数中位数 {{ formatWeight(analysisResult.profile.positiveMedian) }} 仅用于描述数据，不视为空箱重量。</p>
              <p>零值 {{ analysisResult.profile.zeroCount }} 条 · 重复时间 {{ analysisResult.profile.duplicateCount }} 条 · 冲突时间 {{ analysisResult.profile.conflictingTimestampCount }} 处 · 无效记录 {{ analysisResult.profile.invalidCount }} 条 · 超过90秒间隔 {{ analysisResult.profile.gapCount }} 处。</p>
              <p v-for="warning in analysisResult.profile.warnings" :key="warning">{{ warning }}</p>
            </a-collapse-item>
          </a-collapse>
        </a-card>
        </template>
      </main>
    </div>
    <a-modal v-model:visible="evidenceVisible" title="垃圾重量计算依据" :width="720" :footer="false">
      <template v-if="selectedEvent?.evidence">
        <p class="evidence-formula">{{ selectedEvent.evidence.formula }}</p>
        <div class="evidence-platform" v-for="side in (['before', 'after'] as const)" :key="side">
          <b>{{ side === 'before' ? '操作前稳定平台' : '操作后稳定平台' }}</b>
          <template v-if="selectedEvent.evidence[side]">
            <p>{{ formatTime(selectedEvent.evidence[side]!.startTime) }} ～ {{ formatTime(selectedEvent.evidence[side]!.endTime) }}</p>
            <p>平台中位数 {{ formatWeight(selectedEvent.evidence[side]!.weight) }} · {{ selectedEvent.evidence[side]!.bucketCount }} 个30秒桶 / {{ selectedEvent.evidence[side]!.recordCount }} 条记录</p>
            <p>P10～P90：{{ formatWeight(selectedEvent.evidence[side]!.p10) }} ～ {{ formatWeight(selectedEvent.evidence[side]!.p90) }}</p>
          </template>
          <p v-else>未找到可靠平台</p>
        </div>
        <p>低谷：{{ formatTime(selectedEvent.evidence.lowTime) }}，{{ formatWeight(selectedEvent.evidence.lowWeight) }}（仅辅助识别，不参与相减）</p>
        <p v-if="selectedEvent.evidence.responseSeconds !== null">下降开始至后平台起点：{{ (selectedEvent.evidence.responseSeconds / 60).toFixed(1) }} 分钟，包含作业及设备响应，不等同于固定设备延迟。</p>
        <p v-if="selectedEvent.evidence.differenceLow !== null">平台波动对应的差值范围：{{ formatWeight(selectedEvent.evidence.differenceLow) }} ～ {{ formatWeight(selectedEvent.evidence.differenceHigh) }}；这是读数波动范围，不是实际称量误差或统计置信区间。</p>
        <a-alert :type="selectedEvent.garbageWeight !== null ? 'info' : 'warning'">{{ selectedEvent.abnormal }}。{{ selectedEvent.evidence.assumption }}</a-alert>
        <a-button class="locate-button" type="primary" @click="locateEvidence">定位曲线及前后平台</a-button>
      </template>
    </a-modal>
    <a-modal v-model:visible="settingsVisible" title="分析参考设置" :width="420" :ok-loading="settingsSaving" @before-ok="saveSettings">
      <p class="settings-tip">差值算法应用于所有车辆，按车独立识别。参考范围仅提示异常，不筛除、不截断计算结果。旧的固定车重、箱重和重点车辆设置不再参与差值计算。</p>
      <a-form :model="settings" layout="vertical">
        <a-form-item label="垃圾重量范围">
          <a-space fill><a-input-number v-model="settings.garbageMinWeight" :min="1" :precision="0" placeholder="下限"><template #append>kg</template></a-input-number><span>至</span><a-input-number v-model="settings.garbageMaxWeight" :min="1" :precision="0" placeholder="上限"><template #append>kg</template></a-input-number></a-space>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnData } from '@arco-design/web-vue'
import type { EChartsOption } from 'echarts'
import { Message } from '@arco-design/web-vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { BrushComponent, DataZoomComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// vue-echarts 采用按需注册；缺少这些模块时组件存在但无法绘制曲线。
use([LineChart, GridComponent, TooltipComponent, ToolboxComponent, DataZoomComponent, BrushComponent, LegendComponent, CanvasRenderer])

defineOptions({ name: 'SanitationWeighingAnalysis' })
interface Batch { id: number; fileName: string; vehicleNo: string; vin: string; deviceNo: string; startTime: string; endTime: string; recordCount: number; importedAt: string; manualLabel: string }
interface RecordPoint { weighTime: string; weight: number }
interface PlatformEvidence { startTime: string; endTime: string; weight: number; p10: number; p90: number; bucketCount: number; recordCount: number }
interface Evidence { before: PlatformEvidence; after: PlatformEvidence | null; lowTime: string; lowWeight: number; responseSeconds: number | null; differenceLow: number | null; differenceHigh: number | null; formula: string; assumption: string }
interface Segment { id: string; type: string; startTime: string; endTime: string; stableWeight: number | null; minWeight: number; maxWeight: number; recordCount: number; changeAmount: number | null; businessState: string; garbageWeight: number | null; abnormal: string; quality: string; evidence: Evidence | null }
interface AnalysisResult {
  segments: Segment[]
  profile: { vehicleNo: string; rawCount: number; bucketCount: number; invalidCount: number; duplicateCount: number; conflictingTimestampCount: number; zeroCount: number; zeroPercent: number; gapCount: number; positiveMedian: number; noise: number; stableTolerance: number; bucketSeconds: number; minPlatformSeconds: number; maxPlatformSeconds: number; maxGapSeconds: number; maxWaitSeconds: number; warnings: string[] }
  summary: { candidateCount: number; estimatedCount: number; unresolvedCount: number; estimatedTotal: number; assumption: string }
  algorithmVersion: string
}
interface AnalysisSettings { emptyVehicleWeight: number; emptyBoxWeight: number; driverWeight: number; garbageMinWeight: number; garbageMaxWeight: number; focusVehicles: string[] }
interface CurveDetail { batch: Batch; records: RecordPoint[] }
const apiBase = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
const fileInput = ref<HTMLInputElement>()
const chart = ref<InstanceType<typeof VChart>>()
const batches = ref<Batch[]>([]); const currentBatch = ref<Batch>(); const currentBatchId = ref<number>(); const records = ref<RecordPoint[]>([]); const segments = ref<Segment[]>([])
const analysisResult = ref<AnalysisResult>(); const analysisError = ref(''); const showPlatforms = ref(false)
const selectedEvent = ref<Segment>(); const evidenceVisible = ref(false)
const displaySegments = computed(() => showPlatforms.value ? segments.value : segments.value.filter(segment => segment.type === '换箱'))
const batchLoading = ref(false); const uploading = ref(false); const collapsed = ref(false); const chartLoading = ref(false); const analysisLoading = ref(false); const selectedRange = ref<{ start?: string; end?: string }>({})
let rangeAnalysisTimer: number | undefined; let analysisRequestVersion = 0; let batchRequestVersion = 0
const settingsVisible = ref(false); const settingsSaving = ref(false); const settings = ref<AnalysisSettings>({ emptyVehicleWeight: 1670, emptyBoxWeight: 700, driverWeight: 85, garbageMinWeight: 350, garbageMaxWeight: 600, focusVehicles: ['豫AE9059'] })
const columns: TableColumnData[] = [
  { title: '状态', dataIndex: 'type', slotName: 'type', width: 70 }, { title: '时间段', dataIndex: 'startTime', slotName: 'period', width: 185 },
  { title: '业务判断', dataIndex: 'businessState', slotName: 'businessState', width: 170 },
  { title: '操作前平台', slotName: 'beforeWeight', width: 110 }, { title: '操作后平台', slotName: 'afterWeight', width: 110 },
  { title: '垃圾估算', dataIndex: 'garbageWeight', slotName: 'garbageWeight', width: 115 },
  { title: '质量说明', dataIndex: 'abnormal', slotName: 'abnormal', width: 270 }, { title: '依据', slotName: 'evidence', width: 100 },
]
const selectedSummary = computed(() => selectedRange.value.start ? `分析区间：${formatTime(selectedRange.value.start)} 至 ${formatTime(selectedRange.value.end!)}` : '可滚轮缩放、拖拽、框选时间段')
/** 居中 9 点移动平均：平滑跳点，同时避免改变真实曲线数据。 */
const movingAverageRecords = computed(() => records.value.map((point, index) => {
  const from = Math.max(0, index - 4); const to = Math.min(records.value.length, index + 5)
  const window = records.value.slice(from, to)
  return [point.weighTime, window.reduce((sum, item) => sum + Number(item.weight), 0) / window.length]
}))
const chartOption = computed<EChartsOption>(() => ({
  animation: false, grid: { left: 68, right: 28, top: 56, bottom: 86 }, tooltip: { trigger: 'axis', valueFormatter: value => formatWeight(value) }, legend: { top: 10, data: ['真实重量', '平均重量（9点）'] },
  toolbox: { right: 18, feature: { brush: { type: ['lineX', 'clear'] }, restore: {} } }, brush: { xAxisIndex: 'all', brushMode: 'single', throttleType: 'debounce', throttleDelay: 300 },
  xAxis: { type: 'time', axisLabel: { formatter: (value: number) => formatChartAxisTime(value) } }, yAxis: { type: 'value', name: '重量(kg)', scale: true },
  dataZoom: [
    // 不能把 selectedRange 回写到 option：拖动结束后的异步分析会触发 setOption，
    // 进而重置 dataZoom 手势，表现为曲线和滑块抖动。ECharts 自己持有当前视窗即可。
    { type: 'inside', xAxisIndex: 0 },
    { type: 'slider', xAxisIndex: 0, bottom: 12, height: 24 },
  ],
  series: [
    { type: 'line', name: '真实重量', showSymbol: false, sampling: 'lttb', lineStyle: { width: 1.5, type: 'solid', color: '#165dff' }, areaStyle: { color: 'rgba(22,93,255,.08)' }, data: records.value.map(item => [item.weighTime, item.weight]) },
    { type: 'line', name: '平均重量（9点）', showSymbol: false, smooth: 0.25, lineStyle: { width: 2, color: '#00b42a' }, data: movingAverageRecords.value },
  ],
}))
function endpoint(path: string) { return `${apiBase}/api/weighing-analysis${path}` }
/** 称重导入不能让按钮因网络或服务端异常永久保持 loading。 */
async function apiFetch(input: RequestInfo | URL, init?: RequestInit, timeout = 60_000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try { return await fetch(input, { ...init, signal: controller.signal }) }
  catch (error) { if (error instanceof DOMException && error.name === 'AbortError') throw new Error('请求超时，请确认称重分析后端已启动且数据库可连接'); throw error }
  finally { window.clearTimeout(timer) }
}
function formatTime(value?: string) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
/** 横轴必须使用浏览器本地时区；toISOString 会转 UTC，造成标签与悬停时间相差 8 小时。 */
function formatChartAxisTime(value: number) {
  const date = new Date(value); const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
/** Spring 的 LocalDateTime 参数不带时区，缩放事件的时间戳需还原成同一时区的 ISO 本地时间。 */
function chartQueryTime(value: unknown) {
  if (typeof value === 'string' && value.includes('-')) return value.replace(' ', 'T').slice(0, 19)
  const date = new Date(Number(value)); if (Number.isNaN(date.getTime())) return undefined
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
function formatTableTime(value?: string) { return value ? value.replace('T', ' ').slice(5, 16) : '-' }
function formatPeriod(start?: string, end?: string) { const from = formatTableTime(start); const to = formatTableTime(end); return start?.slice(0, 10) === end?.slice(0, 10) ? `${from} — ${to.slice(-5)}` : `${from} — ${to}` }
function formatWeight(value: unknown) { if (value === null || value === undefined) return '—'; const number = Number(value); return Number.isFinite(number) ? `${number.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} kg` : '—' }
function typeColor(type: string) { return ({ 稳定: 'green', 换箱: 'arcoblue' } as Record<string, string>)[type] || 'gray' }
function openEvidence(record: Segment) { selectedEvent.value = record; evidenceVisible.value = true }
function locateEvidence() {
  const event = selectedEvent.value; if (!event?.evidence) return
  const start = event.evidence.before.startTime; const end = event.evidence.after?.endTime || event.endTime
  chart.value?.chart?.dispatchAction({ type: 'dataZoom', startValue: new Date(start).getTime() - 60_000, endValue: new Date(end).getTime() + 60_000 })
  evidenceVisible.value = false
}
async function loadBatches(selectNewest = false) {
  batchLoading.value = true
  let selectedId: number | undefined
  try {
    const response = await apiFetch(endpoint('/batches'), undefined, 15_000)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    batches.value = await response.json()
    selectedId = selectNewest ? batches.value[0]?.id : undefined
  } catch (e) { Message.error(`获取导入批次失败：${e instanceof Error ? e.message : '网络异常'}`) }
  finally { batchLoading.value = false }
  // 批次列表加载与分析详情加载分离，详情请求不会让左侧批次一直显示 loading。
  if (selectedId) await selectBatch(selectedId)
}
async function loadSettings() { const response = await apiFetch(endpoint('/settings'), undefined, 15_000); if (!response.ok) throw new Error(`HTTP ${response.status}`); settings.value = await response.json() as AnalysisSettings }
async function openSettings() { try { await loadSettings(); settingsVisible.value = true } catch (e) { Message.error(`获取参考设置失败：${e instanceof Error ? e.message : '网络异常'}`) } }
async function saveSettings() {
  if (!(settings.value.garbageMinWeight > 0) || !(settings.value.garbageMaxWeight > 0) || settings.value.garbageMinWeight > settings.value.garbageMaxWeight) {
    Message.warning('垃圾参考范围必须大于0，且下限不能大于上限'); return false
  }
  settingsSaving.value = true
  try {
    const response = await apiFetch(endpoint('/settings'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings.value) }, 15_000)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    Message.success('分析参考范围已保存')
    if (currentBatchId.value) await reloadAnalysis(currentBatchId.value, selectedRange.value)
    return true
  } catch (e) { Message.error(`保存失败：${e instanceof Error ? e.message : '网络异常'}`); return false }
  finally { settingsSaving.value = false }
}
async function selectBatch(id: number) {
  const version = ++batchRequestVersion; analysisRequestVersion++
  if (rangeAnalysisTimer) window.clearTimeout(rangeAnalysisTimer)
  currentBatchId.value = id; currentBatch.value = batches.value.find(batch => batch.id === id); records.value = []
  selectedRange.value = {}; chartLoading.value = true; analysisLoading.value = true; segments.value = []; analysisResult.value = undefined; analysisError.value = ''; evidenceVisible.value = false
  try {
    const response = await apiFetch(endpoint(`/batches/${id}/curve`), undefined, 30_000)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json() as CurveDetail
    if (version !== batchRequestVersion) return
    currentBatch.value = data.batch; records.value = data.records; chartLoading.value = false; void reloadAnalysis(id, {})
  } catch (e) {
    if (version === batchRequestVersion) { analysisLoading.value = false; Message.error(`获取称重曲线失败：${e instanceof Error ? e.message : '网络异常'}`) }
  } finally { if (version === batchRequestVersion) chartLoading.value = false }
}
/** 仅异步刷新表格结果；曲线数据和交互状态保持不变。 */
async function reloadAnalysis(id: number, range: { start?: string; end?: string }) {
  const version = ++analysisRequestVersion; selectedRange.value = range; analysisLoading.value = true; analysisError.value = ''; segments.value = []; analysisResult.value = undefined
  try {
    const params = new URLSearchParams(); if (range.start) params.set('start', range.start); if (range.end) params.set('end', range.end)
    const response = await apiFetch(`${endpoint(`/batches/${id}/analysis`)}?${params}`, undefined, 30_000)
    if (!response.ok) {
      let message = await response.text()
      try { message = JSON.parse(message).message || message } catch { /* 非JSON错误保留原文 */ }
      throw new Error(message || `HTTP ${response.status}`)
    }
    const data = await response.json() as AnalysisResult
    if (!data.algorithmVersion || !Array.isArray(data.segments)) throw new Error('后端尚未更新为平台差值算法，请更新称重分析后端')
    if (version === analysisRequestVersion && currentBatchId.value === id) { segments.value = data.segments; analysisResult.value = data }
  }
  catch (e) { if (version === analysisRequestVersion) { analysisError.value = `动态分析失败：${e instanceof Error ? e.message : '网络异常'}`; Message.error(analysisError.value) } }
  finally { if (version === analysisRequestVersion) analysisLoading.value = false }
}
async function uploadFile(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; let imported = false; uploading.value = true; try { const form = new FormData(); form.append('file', file); const response = await apiFetch(endpoint('/import'), { method: 'POST', body: form }); if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`); imported = true; Message.success('称重数据已导入，正在加载分析结果'); } catch (e) { Message.error(`导入失败：${e instanceof Error ? e.message : '网络异常'}`) } finally { uploading.value = false; if (fileInput.value) fileInput.value.value = '' }
  // 刷新详情不再占用“导入 Excel”按钮的 loading，避免后续查询异常表现为上传卡住。
  if (imported) void loadBatches(true)
}
/** 框选、滚轮缩放、拖动滑块均按当前可见时间段重算；防抖避免拖动中产生连续请求。 */
function scheduleRangeAnalysis(start?: string, end?: string) {
  if (!currentBatchId.value || !start || !end || start >= end || (selectedRange.value.start === start && selectedRange.value.end === end)) return
  if (rangeAnalysisTimer) window.clearTimeout(rangeAnalysisTimer)
  const batchId = currentBatchId.value
  analysisRequestVersion++
  rangeAnalysisTimer = window.setTimeout(() => { if (currentBatchId.value === batchId) void reloadAnalysis(batchId, { start, end }) }, 350)
}
function handleBrushSelected(event: any) {
  const coordinateRange = event?.batch?.[0]?.areas?.[0]?.coordRange
  if (coordinateRange?.length === 2) { scheduleRangeAnalysis(chartQueryTime(coordinateRange[0]), chartQueryTime(coordinateRange[1])); return }
  const indexes: number[] = (event?.batch?.[0]?.selected || []).flatMap((item: any) => item.dataIndex || [])
  const times = [...new Set(indexes.map(index => records.value[index]?.weighTime).filter(Boolean))].sort()
  if (times.length) scheduleRangeAnalysis(times[0], times[times.length - 1])
}
function handleDataZoom(event: any) {
  const dataZoom = Array.isArray(event?.batch) ? event.batch[0] : event
  let startValue = dataZoom?.startValue; let endValue = dataZoom?.endValue
  if ((startValue === undefined || endValue === undefined) && Number.isFinite(dataZoom?.start) && Number.isFinite(dataZoom?.end) && records.value.length) {
    // time 轴百分比按时间跨度换算，不能按记录下标：实际采样间隔从1秒到180秒不等。
    const first = new Date(records.value[0].weighTime).getTime()
    const span = new Date(records.value[records.value.length - 1].weighTime).getTime() - first
    startValue = first + span * dataZoom.start / 100
    endValue = first + span * dataZoom.end / 100
  }
  const start = chartQueryTime(startValue); const end = chartQueryTime(endValue)
  scheduleRangeAnalysis(start, end)
}
function resetSelection() { if (rangeAnalysisTimer) window.clearTimeout(rangeAnalysisTimer); chart.value?.chart?.dispatchAction({ type: 'dataZoom', start: 0, end: 100 }, { silent: true }); if (currentBatchId.value) void reloadAnalysis(currentBatchId.value, {}) }
async function deleteBatch() { if (!currentBatchId.value) return; const id = currentBatchId.value; try { const response = await apiFetch(endpoint(`/batches/${id}`), { method: 'DELETE' }, 30_000); if (!response.ok) throw new Error(`HTTP ${response.status}`); currentBatchId.value = undefined; currentBatch.value = undefined; records.value = []; segments.value = []; selectedRange.value = {}; Message.success('批次及原始称重记录已删除'); await loadBatches(true) } catch (e) { Message.error(`删除批次失败：${e instanceof Error ? e.message : '网络异常'}`) } }
onMounted(() => { void loadBatches(true); void loadSettings().catch(() => undefined) })
onBeforeUnmount(() => { if (rangeAnalysisTimer) window.clearTimeout(rangeAnalysisTimer); analysisRequestVersion++; batchRequestVersion++ })
</script>

<style scoped lang="scss">
.analysis-summary { display: flex; flex-wrap: wrap; gap: 12px 28px; padding: 12px 16px; background: var(--color-fill-1); border-radius: 6px; }
.analysis-summary b, .garbage-value { color: rgb(var(--arcoblue-6)); }
.analysis-note { margin: 12px 0; font-size: 12px; line-height: 1.7; color: var(--color-text-3); }
.analysis-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 12px 0; font-size: 13px; color: var(--color-text-2); }
.analysis-toolbar label { display: flex; align-items: center; gap: 8px; }
.algorithm-details { margin-top: 16px; font-size: 13px; line-height: 1.7; }
.evidence-formula { margin: 0 0 16px; font-size: 24px; font-weight: 600; color: rgb(var(--arcoblue-6)); }
.evidence-platform { margin-bottom: 12px; padding: 12px; border-radius: 6px; background: var(--color-fill-1); }
.evidence-platform p { margin: 6px 0 0; font-size: 13px; }
.locate-button { margin-top: 16px; }
.weighing-page { width: 100%; min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 16px 20px !important; }.weighing-body { display: grid; grid-template-columns: 230px minmax(0, 1fr); flex: 1; min-height: 0; gap: 14px; }.weighing-body.collapsed { grid-template-columns: 44px minmax(0, 1fr); }.batch-aside { min-width: 0; padding: 14px; border-radius: 6px; background: var(--color-bg-2); transition: width .2s; overflow: hidden; }.batch-aside.collapsed { width: 44px; padding-inline: 6px; }.aside-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 16px; font-weight: 600; white-space: nowrap; }.hidden-input { display: none; }.format-tip { margin: 9px 2px 12px; color: var(--color-text-3); font-size: 12px; line-height: 1.5; }.batch-list { display: block; max-height: calc(100vh - 260px); overflow: auto; }.batch-item { display: grid; width: 100%; gap: 5px; margin-bottom: 8px; padding: 10px; border: 1px solid var(--color-border-2); border-radius: 5px; background: transparent; text-align: left; color: var(--color-text-2); cursor: pointer; }.batch-item:hover, .batch-item.active { border-color: rgb(var(--arcoblue-5)); background: rgb(var(--arcoblue-1)); }.batch-item b { overflow: hidden; color: var(--color-text-1); text-overflow: ellipsis; white-space: nowrap; }.batch-item span, .batch-item small { font-size: 12px; }.batch-item small { color: var(--color-text-4); }.analysis-main { display: grid; min-width: 0; align-content: start; gap: 14px; }.main-empty { align-self: center; }.page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 0; }.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }.page-subtitle, small { color: #86909c; font-size: 13px; }.header-actions { margin-left: auto; }.chart-card, .table-card { border-radius: 6px; }.analysis-content { display: block; min-height: 400px; }.weight-chart { width: 100%; height: 400px; }.analysis-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; }.analysis-title small { white-space: nowrap; }.period { display: inline-block; white-space: nowrap; }.garbage-tag { margin: 3px 0 0 6px; }.abnormal { color: rgb(var(--red-6)); }.settings-tip { margin-top: 0; color: var(--color-text-3); font-size: 13px; line-height: 1.6; } @media (max-width: 900px) { .weighing-page { padding: 14px !important; }.weighing-body { grid-template-columns: 1fr; }.batch-aside { width: auto; }.batch-list { max-height: 170px; }.page-header { align-items: flex-start; flex-direction: column; }.header-actions { margin-left: 0; } }
</style>

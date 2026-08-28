<template>
  <div class="gi_page weighing-page">
    <header class="page-header">
      <div><div class="page-title">整车称重分析</div><div class="page-subtitle">用于标定、逻辑、设置的讨论</div></div>
      <a-space class="header-actions" size="small" wrap>
        <a-tooltip content="称重基准设置"><a-button type="text" size="small" aria-label="称重基准设置" @click="openSettings"><template #icon><icon-settings /></template></a-button></a-tooltip>
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
          <a-spin :loading="analysisLoading" class="analysis-content">
            <VChart v-if="records.length" ref="chart" class="weight-chart" :option="chartOption" autoresize @brush-selected="handleBrushSelected" />
            <a-empty v-else description="该时段没有原始称重记录" />
          </a-spin>
        </a-card>
        <a-card class="table-card">
          <template #title>动态分析 <small>车重：{{ formatWeight(settings.emptyVehicleWeight) }}，车 + 空箱：{{ formatWeight(vehicleWithBoxWeight) }}，车 + 空箱 + 司机：{{ formatWeight(loadedBaselineWeight) }}</small></template>
          <a-table :data="segments" :columns="columns" row-key="startTime" :loading="analysisLoading" :pagination="false" :scroll="{ x: 1004 }" stripe>
            <template #type="{ record }"><a-tag :color="typeColor(record.type)">{{ record.type }}</a-tag></template>
            <template #period="{ record }"><span class="period">{{ formatPeriod(record.startTime, record.endTime) }}</span></template>
            <template #businessState="{ record }"><span>{{ record.businessState }}</span><a-tag v-if="record.garbageWeight !== null && record.garbageWeight > 0" size="small" color="orange" class="garbage-tag">垃圾量 {{ formatWeight(record.garbageWeight) }}</a-tag></template>
            <template #weight="{ record }">约 {{ formatWeight(record.stableWeight) }}</template>
            <template #range="{ record }">{{ formatWeight(record.minWeight) }} ～ {{ formatWeight(record.maxWeight) }}</template>
            <template #changeAmount="{ record }">{{ formatChange(record.changeAmount) }}</template>
            <template #garbageWeight="{ record }">{{ record.garbageWeight === null ? '-' : formatWeight(record.garbageWeight) }}</template>
            <template #abnormal="{ record }"><span :class="{ abnormal: record.abnormal !== '-' }">{{ record.abnormal }}</span></template>
          </a-table>
        </a-card>
        </template>
      </main>
    </div>
    <a-modal v-model:visible="settingsVisible" title="整车称重基准设置" :width="420" :ok-loading="settingsSaving" @before-ok="saveSettings">
      <p class="settings-tip">基准设置仅应用于选中的重点分析车辆；未选车辆仅展示趋势分析。</p>
      <a-form :model="settings" layout="vertical">
        <a-form-item field="focusVehicles" label="重点分析车辆">
          <a-select v-model="settings.focusVehicles" multiple allow-search allow-clear placeholder="从已导入车牌中选择" :loading="vehicleOptionsLoading">
            <a-option v-for="vehicle in vehicleOptions" :key="vehicle" :value="vehicle">{{ vehicle }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="emptyVehicleWeight" label="空车重量"><a-input-number v-model="settings.emptyVehicleWeight" :min="0" :precision="0" style="width: 100%"><template #append>kg</template></a-input-number></a-form-item>
        <a-form-item field="emptyBoxWeight" label="空箱重量"><a-input-number v-model="settings.emptyBoxWeight" :min="0" :precision="0" style="width: 100%"><template #append>kg</template></a-input-number></a-form-item>
        <a-form-item field="driverWeight" label="司机重量"><a-input-number v-model="settings.driverWeight" :min="0" :precision="0" style="width: 100%"><template #append>kg</template></a-input-number></a-form-item>
        <a-form-item label="垃圾重量范围">
          <a-space fill><a-input-number v-model="settings.garbageMinWeight" :min="0" :precision="0" placeholder="下限"><template #append>kg</template></a-input-number><span>至</span><a-input-number v-model="settings.garbageMaxWeight" :min="0" :precision="0" placeholder="上限"><template #append>kg</template></a-input-number></a-space>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnData } from '@arco-design/web-vue'
import type { EChartsOption } from 'echarts'
import { Message } from '@arco-design/web-vue'
import { computed, onMounted, ref } from 'vue'
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
interface Segment { type: string; startTime: string; endTime: string; stableWeight: number; minWeight: number; maxWeight: number; recordCount: number; changeAmount: number | null; businessState: string; garbageWeight: number | null; abnormal: string }
interface AnalysisSettings { emptyVehicleWeight: number; emptyBoxWeight: number; driverWeight: number; garbageMinWeight: number; garbageMaxWeight: number; focusVehicles: string[] }
interface Detail { batch: Batch; records: RecordPoint[]; analysis: Segment[] }
const apiBase = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
const fileInput = ref<HTMLInputElement>()
const chart = ref<InstanceType<typeof VChart>>()
const batches = ref<Batch[]>([]); const currentBatch = ref<Batch>(); const currentBatchId = ref<number>(); const records = ref<RecordPoint[]>([]); const segments = ref<Segment[]>([])
const batchLoading = ref(false); const uploading = ref(false); const collapsed = ref(false); const analysisLoading = ref(false); const selectedRange = ref<{ start?: string; end?: string }>({})
const settingsVisible = ref(false); const settingsSaving = ref(false); const vehicleOptionsLoading = ref(false); const vehicleOptions = ref<string[]>([]); const settings = ref<AnalysisSettings>({ emptyVehicleWeight: 1670, emptyBoxWeight: 700, driverWeight: 85, garbageMinWeight: 350, garbageMaxWeight: 600, focusVehicles: ['豫AE9059'] })
const columns: TableColumnData[] = [
  { title: '状态', dataIndex: 'type', slotName: 'type', width: 56 }, { title: '时间段', dataIndex: 'startTime', slotName: 'period', width: 185 },
  { title: '业务判断', dataIndex: 'businessState', slotName: 'businessState', width: 165 }, { title: '稳定称重值', dataIndex: 'stableWeight', slotName: 'weight', width: 100 }, { title: '重量范围', dataIndex: 'minWeight', slotName: 'range', width: 142 }, { title: '变化量', dataIndex: 'changeAmount', slotName: 'changeAmount', width: 78 }, { title: '箱中垃圾', dataIndex: 'garbageWeight', slotName: 'garbageWeight', width: 96 },
  { title: '记录数', dataIndex: 'recordCount', width: 62 }, { title: '异常', dataIndex: 'abnormal', slotName: 'abnormal', width: 120 },
]
const selectedSummary = computed(() => selectedRange.value.start ? `框选：${formatTime(selectedRange.value.start)} 至 ${formatTime(selectedRange.value.end!)}` : '可滚轮缩放、拖拽、框选时间段')
const vehicleWithBoxWeight = computed(() => Number(settings.value.emptyVehicleWeight || 0) + Number(settings.value.emptyBoxWeight || 0))
const loadedBaselineWeight = computed(() => vehicleWithBoxWeight.value + Number(settings.value.driverWeight || 0))
/** 居中 9 点移动平均：平滑跳点，同时避免改变真实曲线数据。 */
const movingAverageRecords = computed(() => records.value.map((point, index) => {
  const from = Math.max(0, index - 4); const to = Math.min(records.value.length, index + 5)
  const window = records.value.slice(from, to)
  return [point.weighTime, window.reduce((sum, item) => sum + Number(item.weight), 0) / window.length]
}))
const chartOption = computed<EChartsOption>(() => ({
  animation: false, grid: { left: 68, right: 28, top: 56, bottom: 86 }, tooltip: { trigger: 'axis', valueFormatter: value => formatWeight(value) }, legend: { top: 10, data: ['真实重量', '平均重量（9点）'] },
  toolbox: { right: 18, feature: { brush: { type: ['lineX', 'clear'] }, restore: {} } }, brush: { xAxisIndex: 'all', brushMode: 'single', throttleType: 'debounce', throttleDelay: 300 },
  xAxis: { type: 'time', axisLabel: { formatter: (value: number) => formatTime(new Date(value).toISOString()) } }, yAxis: { type: 'value', name: '重量(kg)', scale: true },
  dataZoom: [{ type: 'inside', xAxisIndex: 0 }, { type: 'slider', xAxisIndex: 0, bottom: 12, height: 24 }],
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
function formatTableTime(value?: string) { return value ? value.replace('T', ' ').slice(5, 16) : '-' }
function formatPeriod(start?: string, end?: string) { const from = formatTableTime(start); const to = formatTableTime(end); return start?.slice(0, 10) === end?.slice(0, 10) ? `${from} — ${to.slice(-5)}` : `${from} — ${to}` }
function formatWeight(value: unknown) { const number = Number(value); return Number.isFinite(number) ? `${number.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} kg` : '-' }
function formatChange(value: number | null) { if (value === null || value === undefined) return '-'; const number = Number(value); return `${number > 0 ? '+' : ''}${number.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} kg` }
function typeColor(type: string) { return ({ 稳定: 'green', 上升: 'arcoblue', 下降: 'orange', 抖动: 'red' } as Record<string, string>)[type] || 'gray' }
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
async function loadVehicleOptions() { vehicleOptionsLoading.value = true; try { const response = await apiFetch(endpoint('/vehicles'), undefined, 15_000); if (!response.ok) throw new Error(`HTTP ${response.status}`); vehicleOptions.value = await response.json() as string[] } finally { vehicleOptionsLoading.value = false } }
async function openSettings() { try { await Promise.all([loadSettings(), loadVehicleOptions()]); settingsVisible.value = true } catch (e) { Message.error(`获取基准设置失败：${e instanceof Error ? e.message : '网络异常'}`) } }
async function saveSettings() { if (!settings.value.emptyVehicleWeight || !settings.value.emptyBoxWeight || !settings.value.driverWeight || !settings.value.garbageMinWeight || !settings.value.garbageMaxWeight || settings.value.garbageMinWeight > settings.value.garbageMaxWeight) { Message.warning('重量均需大于 0，且垃圾重量下限不能大于上限'); return false } settingsSaving.value = true; try { const response = await apiFetch(endpoint('/settings'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings.value) }, 15_000); if (!response.ok) throw new Error(`HTTP ${response.status}`); Message.success('称重基准已保存'); if (currentBatchId.value) await selectBatch(currentBatchId.value, selectedRange.value); return true } catch (e) { Message.error(`保存失败：${e instanceof Error ? e.message : '网络异常'}`); return false } finally { settingsSaving.value = false } }
async function selectBatch(id: number, range: { start?: string; end?: string } = {}) { currentBatchId.value = id; selectedRange.value = range; analysisLoading.value = true; try { const params = new URLSearchParams(); if (range.start) { params.set('start', range.start); params.set('end', range.end!); } const response = await apiFetch(`${endpoint(`/batches/${id}`)}?${params}`, undefined, 30_000); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json() as Detail; if (currentBatchId.value !== id) return; currentBatch.value = data.batch; records.value = data.records; segments.value = data.analysis } catch (e) { Message.error(`获取称重分析失败：${e instanceof Error ? e.message : '网络异常'}`) } finally { if (currentBatchId.value === id) analysisLoading.value = false } }
async function uploadFile(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; let imported = false; uploading.value = true; try { const form = new FormData(); form.append('file', file); const response = await apiFetch(endpoint('/import'), { method: 'POST', body: form }); if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`); imported = true; Message.success('称重数据已导入，正在加载分析结果'); } catch (e) { Message.error(`导入失败：${e instanceof Error ? e.message : '网络异常'}`) } finally { uploading.value = false; if (fileInput.value) fileInput.value.value = '' }
  // 刷新详情不再占用“导入 Excel”按钮的 loading，避免后续查询异常表现为上传卡住。
  if (imported) void loadBatches(true)
}
function handleBrushSelected(event: any) { const indexes: number[] = event?.batch?.[0]?.selected?.[0]?.dataIndex || []; if (!indexes.length) return; const times = indexes.map(index => records.value[index]?.weighTime).filter(Boolean).sort(); if (times.length) void selectBatch(currentBatchId.value!, { start: times[0], end: times[times.length - 1] }) }
function resetSelection() { if (currentBatchId.value) void selectBatch(currentBatchId.value) }
async function deleteBatch() { if (!currentBatchId.value) return; const id = currentBatchId.value; try { const response = await apiFetch(endpoint(`/batches/${id}`), { method: 'DELETE' }, 30_000); if (!response.ok) throw new Error(`HTTP ${response.status}`); currentBatchId.value = undefined; currentBatch.value = undefined; records.value = []; segments.value = []; selectedRange.value = {}; Message.success('批次及原始称重记录已删除'); await loadBatches(true) } catch (e) { Message.error(`删除批次失败：${e instanceof Error ? e.message : '网络异常'}`) } }
onMounted(() => { void loadBatches(true); void loadSettings().catch(() => undefined) })
</script>

<style scoped lang="scss">
.weighing-page { width: 100%; min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 16px 20px !important; }.weighing-body { display: grid; grid-template-columns: 230px minmax(0, 1fr); flex: 1; min-height: 0; gap: 14px; }.weighing-body.collapsed { grid-template-columns: 44px minmax(0, 1fr); }.batch-aside { min-width: 0; padding: 14px; border-radius: 6px; background: var(--color-bg-2); transition: width .2s; overflow: hidden; }.batch-aside.collapsed { width: 44px; padding-inline: 6px; }.aside-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 16px; font-weight: 600; white-space: nowrap; }.hidden-input { display: none; }.format-tip { margin: 9px 2px 12px; color: var(--color-text-3); font-size: 12px; line-height: 1.5; }.batch-list { display: block; max-height: calc(100vh - 260px); overflow: auto; }.batch-item { display: grid; width: 100%; gap: 5px; margin-bottom: 8px; padding: 10px; border: 1px solid var(--color-border-2); border-radius: 5px; background: transparent; text-align: left; color: var(--color-text-2); cursor: pointer; }.batch-item:hover, .batch-item.active { border-color: rgb(var(--arcoblue-5)); background: rgb(var(--arcoblue-1)); }.batch-item b { overflow: hidden; color: var(--color-text-1); text-overflow: ellipsis; white-space: nowrap; }.batch-item span, .batch-item small { font-size: 12px; }.batch-item small { color: var(--color-text-4); }.analysis-main { display: grid; min-width: 0; align-content: start; gap: 14px; }.main-empty { align-self: center; }.page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 0; }.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }.page-subtitle, small { color: #86909c; font-size: 13px; }.header-actions { margin-left: auto; }.chart-card, .table-card { border-radius: 6px; }.analysis-content { display: block; min-height: 400px; }.weight-chart { width: 100%; height: 400px; }.period { display: inline-block; white-space: nowrap; }.garbage-tag { margin: 3px 0 0 6px; }.abnormal { color: rgb(var(--red-6)); }.settings-tip { margin-top: 0; color: var(--color-text-3); font-size: 13px; line-height: 1.6; } @media (max-width: 900px) { .weighing-page { padding: 14px !important; }.weighing-body { grid-template-columns: 1fr; }.batch-aside { width: auto; }.batch-list { max-height: 170px; }.page-header { align-items: flex-start; flex-direction: column; }.header-actions { margin-left: 0; } }
</style>

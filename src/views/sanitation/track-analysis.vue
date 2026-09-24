<template>
  <div class="gi_page track-page">
    <header class="track-header">
      <div><h2>轨迹分析</h2><p>导入并保存定位 Excel，随时查看历史轨迹</p></div>
    </header>
    <a-alert v-if="error" type="error">{{ error }}</a-alert>
    <div class="track-body" :class="{ collapsed }">
      <aside class="batch-aside" :class="{ collapsed }">
        <div class="aside-title">
          <span v-if="!collapsed">导入批次</span>
          <a-button type="text" size="mini" :aria-label="collapsed ? '展开批次栏' : '收起批次栏'" @click="toggleSidebar"><icon-menu-fold v-if="!collapsed" /><icon-menu-unfold v-else /></a-button>
        </div>
        <template v-if="!collapsed">
          <input ref="fileInput" type="file" accept=".xlsx" hidden @change="importFile">
          <a-button type="primary" long :loading="uploading" @click="fileInput?.click()">导入 Excel</a-button>
          <a :href="exampleUrl" download="箱号194.xlsx" class="example-link">下载导入示例</a>
          <p class="format-tip">表头：time、latitude、longitude（或时间、纬度、经度）</p>
          <a-spin :loading="batchLoading" class="batch-list">
            <a-empty v-if="!batches.length" description="暂无已导入轨迹" />
            <div v-for="batch in batches" :key="batch.id" class="batch-row" :class="{ active: selectedBatchId === batch.id }">
              <button type="button" class="batch-select" @click="selectBatch(batch.id)">
                <strong>{{ batch.fileName }}</strong>
                <span>{{ batch.recordCount }} 个点</span>
                <span>{{ formatBatchTime(batch.startTime) }} ～ {{ formatBatchTime(batch.endTime) }}</span>
                <small>导入于 {{ formatBatchTime(batch.importedAt) }}</small>
              </button>
              <a-popconfirm content="删除该批次及全部轨迹点？" type="warning" @ok="deleteBatch(batch.id)">
                <a-button type="text" status="danger" size="small" :disabled="uploading">删除</a-button>
              </a-popconfirm>
            </div>
          </a-spin>
        </template>
      </aside>
      <main class="track-main">
        <a-card class="map-card">
          <div class="map-surface">
            <div v-if="!points.length" class="empty-map">请导入或选择已保存的轨迹批次</div>
            <div ref="mapContainer" class="track-map" :class="{ 'map-hidden': !points.length }" />
            <div class="map-point-count">收集点 {{ validCollectionPoints.length }} 个<span v-if="collectionError" class="point-error"> · {{ collectionError }}</span></div>
            <div class="map-theme-picker">
              <span>主题</span>
              <a-select v-model="mapTheme" size="small" :allow-clear="false" @change="setMapTheme(mapTheme)">
                <a-option v-for="theme in mapThemes" :key="theme.value" :value="theme.value">{{ theme.label }}</a-option>
              </a-select>
            </div>
          </div>
        </a-card>
        <a-card v-if="points.length" class="timeline-card">
          <div class="timeline-top"><strong>{{ fileName }} · {{ points.length }} 个点</strong><span>{{ currentPoint?.time }} · {{ currentPoint?.longitude.toFixed(6) }}, {{ currentPoint?.latitude.toFixed(6) }}</span></div>
          <div class="timeline-controls">
            <a-button type="primary" @click="togglePlay">{{ playing ? '暂停' : '播放' }}</a-button>
            <a-button @click="reset">重头播放</a-button>
            <span class="speed-label">倍速</span>
            <div class="speed-options" role="group" aria-label="播放倍速">
              <a-button v-for="option in speedOptions" :key="option.value" :type="speed === option.value ? 'primary' : 'outline'" size="small" :aria-pressed="speed === option.value" @click="speed = option.value">{{ option.label }}</a-button>
            </div>
          </div>
          <input class="timeline-range" type="range" min="0" :max="duration" :value="elapsed" step="1" aria-label="轨迹时间轴" @input="seek">
          <div class="timeline-labels"><span>{{ points[0].time }}</span><span>{{ currentPoint?.time }}</span><span>{{ points[points.length - 1].time }}</span></div>
        </a-card>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { type TrackPoint, readTrackXlsx } from './track-xlsx'
import { getCachedPoints, saveCachedPoints, subscribePointsUpdated } from './sbg-store'
import { collectorMapRequest } from '@/utils/daas'
import { parseBeijingDateTime } from '@/utils/beijing-time'
import { type AMapInfoWindow, type AMapInstance, type AMapMarker, type AMapPolyline, loadAmapJsApi } from '@/utils/amap'
import { toGcj } from '@/utils/geo'

interface CollectionPoint { pointName: string, townshipName?: string, villageName?: string, latitude: number, longitude: number }
interface TrackBatch { id: number, fileName: string, startTime: string, endTime: string, recordCount: number, importedAt: string }
interface SavedTrackPoint { time: string, latitude: number, longitude: number }
const apiBase = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
const endpoint = (path: string) => `${apiBase}/api/track-analysis${path}`
const fileInput = ref<HTMLInputElement>()
const exampleUrl = `${import.meta.env.BASE_URL}static/examples/${encodeURIComponent('箱号194.xlsx')}`
const mapContainer = ref<HTMLDivElement>()
const points = ref<TrackPoint[]>([])
const fileName = ref('')
const batches = ref<TrackBatch[]>([])
const selectedBatchId = ref<number>()
const batchLoading = ref(false)
let batchRequestVersion = 0
const uploading = ref(false)
const error = ref('')
const collapsed = ref(false)
const playing = ref(false)
const speed = ref(1)
const speedOptions = [1, 5, 10, 20, 30].map((value) => ({ label: `${value}x`, value }))
const mapTheme = ref<'light' | 'normal'>('light')
const mapThemes = [{ label: '标准', value: 'light' }, { label: '默认', value: 'normal' }] as const
function setMapTheme(theme: 'light' | 'normal') {
  mapTheme.value = theme
  map?.setMapStyle(`amap://styles/${theme}`)
}
function toggleSidebar() { collapsed.value = !collapsed.value }
const collectionPoints = ref<CollectionPoint[]>([])
const validCollectionPoints = computed(() => collectionPoints.value.filter((point) => point.longitude != null && point.latitude != null && Number.isFinite(Number(point.longitude)) && Number.isFinite(Number(point.latitude))))
const collectionError = ref('')
let unsubscribePointsUpdated: (() => void) | undefined
const elapsed = ref(0)
const duration = computed(() => points.value.length ? Math.max(0, (points.value[points.value.length - 1].timestamp - points.value[0].timestamp) / 1000) : 0)
const currentIndex = computed(() => {
  const target = (points.value[0]?.timestamp || 0) + elapsed.value * 1000
  let low = 0
  let high = points.value.length - 1
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (points.value[mid].timestamp <= target) low = mid
    else high = mid - 1
  }
  return low
})
const currentPoint = computed(() => points.value[currentIndex.value])
function formatBatchTime(value: string) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
async function responseError(response: Response) {
  const body = await response.text()
  try { return JSON.parse(body).message || body || `HTTP ${response.status}` } catch { return body || `HTTP ${response.status}` }
}
async function loadBatches() {
  batchLoading.value = true
  try {
    const response = await fetch(endpoint('/batches'))
    if (!response.ok) throw new Error(await responseError(response))
    batches.value = await response.json() as TrackBatch[]
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '读取已导入轨迹失败' }
  finally { batchLoading.value = false }
}
async function selectBatch(batchId: number) {
  const version = ++batchRequestVersion
  stop()
  batchLoading.value = true
  error.value = ''
  try {
    const response = await fetch(endpoint(`/batches/${batchId}`))
    if (!response.ok) throw new Error(await responseError(response))
    const data = await response.json() as { batch: TrackBatch, records: SavedTrackPoint[] }
    if (version !== batchRequestVersion) return
    points.value = data.records.map((point) => ({
      time: formatBatchTime(point.time), latitude: Number(point.latitude), longitude: Number(point.longitude),
      timestamp: parseBeijingDateTime(point.time).getTime(),
    }))
    fileName.value = data.batch.fileName
    selectedBatchId.value = batchId
    elapsed.value = 0
    await drawMap()
  } catch (cause) { if (version === batchRequestVersion) error.value = cause instanceof Error ? cause.message : '读取轨迹失败' }
  finally { if (version === batchRequestVersion) batchLoading.value = false }
}
async function deleteBatch(batchId: number) {
  error.value = ''
  try {
    const response = await fetch(endpoint(`/batches/${batchId}`), { method: 'DELETE' })
    if (!response.ok) throw new Error(await responseError(response))
    if (selectedBatchId.value === batchId) {
      ++batchRequestVersion
      stop()
      selectedBatchId.value = undefined
      points.value = []
      fileName.value = ''
      route?.setMap(null); progress?.setMap(null); marker?.setMap(null)
    }
    await loadBatches()
    Message.success('轨迹批次已删除')
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '删除失败' }
}
let map: AMapInstance | undefined
let marker: AMapMarker | undefined
let collectionInfo: AMapInfoWindow | undefined
let collectionMarkers: AMapMarker[] = []
let route: AMapPolyline | undefined
let progress: AMapPolyline | undefined
let animation = 0
let lastFrame = 0
let renderedIndex = -1
let mapResizeObserver: ResizeObserver | undefined

function position(point: Pick<TrackPoint, 'longitude' | 'latitude'>): [number, number] {
  const gcj = toGcj(point.longitude, point.latitude)
  return [gcj.lng, gcj.lat]
}
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[char]!)
}
function drawCollectionMarkers(amap: Awaited<ReturnType<typeof loadAmapJsApi>>) {
  collectionMarkers.forEach((item) => item.setMap(null))
  collectionMarkers = []
  if (!map) return
  collectionInfo?.close()
  collectionInfo = new amap.InfoWindow({ offset: new amap.Pixel(0, -12) })
  for (const point of validCollectionPoints.value) {
    const name = escapeHtml(point.pointName || '未命名收集点')
    const marker = new amap.Marker({ position: position(point), title: [point.townshipName, point.villageName, point.pointName].filter(Boolean).join(' · '), content: `<span class="track-collection-marker" title="${name}"></span>`, offset: new amap.Pixel(-7, -7) })
    marker.on('click', () => {
      if (!map || !collectionInfo) return
      const location = [point.townshipName, point.villageName].filter(Boolean).map(escapeHtml).join(' · ')
      collectionInfo.setContent(`<div class="track-point-info"><strong>${name}</strong><div>${location || '收集点'}</div></div>`)
      collectionInfo.open(map, position(point))
    })
    marker.setMap(map)
    collectionMarkers.push(marker)
  }
}
async function loadCollectionPoints() {
  const cached = getCachedPoints<CollectionPoint>()
  if (cached.length) collectionPoints.value = cached
  try {
    const data = await collectorMapRequest<{ points?: CollectionPoint[] }>(false)
    if (!Array.isArray(data.points)) throw new Error('收集点数据格式无效')
    collectionPoints.value = data.points
    collectionError.value = ''
    saveCachedPoints(data.points)
    if (map) drawCollectionMarkers(await loadAmapJsApi())
  } catch { collectionError.value = cached.length ? '实时收集点加载失败，正在显示缓存' : '收集点加载失败' }
}
async function drawMap() {
  await nextTick()
  if (!mapContainer.value || !points.value.length) return
  try {
    const amap = await loadAmapJsApi()
    if (!map) map = new amap.Map(mapContainer.value, { zoom: 12, center: position(points.value[0]), viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true })
    collectionMarkers.forEach((item) => item.setMap(null))
    collectionMarkers = []
    route?.setMap(null)
    progress?.setMap(null)
    marker?.setMap(null)
    route = new amap.Polyline({ path: points.value.map(position), strokeColor: '#94a3b8', strokeWeight: 5, strokeOpacity: 0.75 })
    progress = new amap.Polyline({ path: [position(points.value[0])], strokeColor: '#165dff', strokeWeight: 6 })
    marker = new amap.Marker({ position: position(points.value[0]), title: '当前位置' })
    route.setMap(map)
    progress.setMap(map)
    marker.setMap(map)
    map.setFitView(undefined, false, [80, 80, 80, 80])
    drawCollectionMarkers(amap)
    renderedIndex = -1
    updateMap()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '地图加载失败' }
}
function updateMap() {
  if (!map || !points.value.length || currentIndex.value === renderedIndex) return
  renderedIndex = currentIndex.value
  const point = points.value[renderedIndex]
  marker?.setPosition(position(point))
  progress?.setPath(points.value.slice(0, renderedIndex + 1).map(position))
}
function tick(now: number) {
  if (!playing.value) return
  if (lastFrame) elapsed.value = Math.min(duration.value, elapsed.value + (now - lastFrame) / 1000 * speed.value)
  lastFrame = now
  updateMap()
  if (elapsed.value >= duration.value) {
    playing.value = false
    return
  }
  animation = requestAnimationFrame(tick)
}
function stop() {
  playing.value = false
  cancelAnimationFrame(animation)
  lastFrame = 0
}
function togglePlay() {
  if (playing.value) {
    stop()
    return
  }
  if (elapsed.value >= duration.value) elapsed.value = 0
  playing.value = true
  animation = requestAnimationFrame(tick)
}
function reset() {
  stop()
  elapsed.value = 0
  updateMap()
}
function seek(event: Event) {
  elapsed.value = Number((event.target as HTMLInputElement).value)
  updateMap()
}
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  stop()
  uploading.value = true
  error.value = ''
  try {
    const parsed = await readTrackXlsx(file)
    const response = await fetch(endpoint('/batches'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, points: parsed.map(({ time, latitude, longitude }) => ({ time, latitude, longitude })) }),
    })
    if (!response.ok) throw new Error(await responseError(response))
    const batch = await response.json() as { id: number }
    await loadBatches()
    await selectBatch(batch.id)
    Message.success(`已保存 ${parsed.length} 个轨迹点`)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '导入失败'
  } finally {
    uploading.value = false
  }
}
onMounted(() => {
  unsubscribePointsUpdated = subscribePointsUpdated((list) => {
    if (list === collectionPoints.value) return
    collectionPoints.value = list as CollectionPoint[]
    if (map) void loadAmapJsApi().then(drawCollectionMarkers)
  })
  if (mapContainer.value) {
    mapResizeObserver = new ResizeObserver(() => map?.resize())
    mapResizeObserver.observe(mapContainer.value)
  }
  void loadCollectionPoints()
  void loadBatches().then(() => { if (batches.value.length) void selectBatch(batches.value[0].id) })
})
onBeforeUnmount(() => {
  unsubscribePointsUpdated?.()
  mapResizeObserver?.disconnect()
  stop()
  route?.setMap(null)
  progress?.setMap(null)
  marker?.setMap(null)
  collectionMarkers.forEach((item) => item.setMap(null))
  collectionInfo?.close()
  map?.destroy()
})
</script>

<style scoped>
.track-page { width: 100%; min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 14px; padding: 16px 20px !important; }
.track-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.track-header h2 { margin: 0 0 5px; font-size: 20px; }.track-header p { margin: 0; color: #86909c; font-size: 13px; }
.track-body { display: grid; grid-template-columns: 244px minmax(0, 1fr); flex: 1; min-height: 0; gap: 14px; }
.track-body.collapsed { grid-template-columns: 44px minmax(0, 1fr); }
.batch-aside { min-width: 0; padding: 14px; border-radius: 6px; background: var(--color-bg-2); overflow: hidden; }
.batch-aside.collapsed { padding: 14px 6px; }
.aside-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 16px; font-weight: 600; white-space: nowrap; }
.example-link { display: block; margin: 10px 2px 0; color: #165dff; font-size: 13px; text-decoration: none; }.example-link:hover { text-decoration: underline; }
.format-tip { margin: 8px 2px 12px; color: var(--color-text-3); font-size: 12px; line-height: 1.5; }
.batch-list { display: block; max-height: calc(100vh - 300px); overflow: auto; }
.batch-row { position: relative; margin-bottom: 8px; padding: 8px; border: 1px solid var(--color-border-2); border-radius: 6px; }
.batch-row:hover, .batch-row.active { border-color: rgb(var(--arcoblue-5)); background: rgb(var(--arcoblue-1)); }
.batch-select { display: grid; width: 100%; gap: 4px; padding: 0 0 26px; border: 0; background: transparent; text-align: left; cursor: pointer; color: var(--color-text-1); }
.batch-select strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }.batch-select span, .batch-select small { color: var(--color-text-3); font-size: 12px; line-height: 1.4; }
.batch-row :deep(.arco-btn) { position: absolute; right: 4px; bottom: 2px; }
.track-main { display: grid; min-width: 0; align-content: start; gap: 14px; }
.map-card, .timeline-card { min-width: 0; }.map-card :deep(.arco-card-body) { padding: 0; }
.map-surface, .track-map, .empty-map { height: min(62vh, 650px); min-height: 360px; }.map-surface { position: relative; }.track-map { position: relative; z-index: 0; }.map-hidden { display: none; }.empty-map { display: grid; place-items: center; color: #86909c; }
.map-point-count, .map-theme-picker { position: absolute; z-index: 10; top: 16px; height: 32px; display: flex; align-items: center; padding: 0 9px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }
.map-point-count { left: 16px; }.map-theme-picker { right: 16px; gap: 8px; }.map-theme-picker :deep(.arco-select) { width: 88px; }.point-error { color: #f53f3f; }
.track-map :deep(.track-collection-marker) { display: block; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; background: #00b42a; box-shadow: 0 0 0 2px #00b42a, 0 2px 8px #0004; }
.timeline-card :deep(.arco-card-body) { display: grid; gap: 16px; }.timeline-top, .timeline-controls, .timeline-labels { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.timeline-top { flex-wrap: wrap; }.timeline-top span { color: #4e5969; }.timeline-controls { justify-content: flex-start; flex-wrap: wrap; }
.speed-options { display: flex; gap: 6px; flex-wrap: wrap; }.speed-label { color: #4e5969; }
.timeline-range { width: 100%; accent-color: #165dff; cursor: pointer; }.timeline-labels { color: #86909c; font-size: 12px; flex-wrap: wrap; }
@media (max-width: 900px) { .track-page { padding: 14px !important; }.track-body, .track-body.collapsed { grid-template-columns: 1fr; }.batch-aside.collapsed { width: 44px; }.batch-list { max-height: 190px; }.map-surface, .track-map, .empty-map { height: 50vh; min-height: 320px; } }
</style>

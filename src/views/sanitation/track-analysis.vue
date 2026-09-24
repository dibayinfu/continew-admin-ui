<template>
  <div class="gi_page track-page">
    <header class="track-header">
      <div><h2>轨迹分析</h2><p>导入定位 Excel，沿时间轴查看位置变化</p></div>
      <div class="header-actions">
        <input ref="fileInput" type="file" accept=".xlsx" hidden @change="importFile">
        <a :href="exampleUrl" download="箱号194.xlsx" class="example-link">下载导入事例</a>
        <a-button type="primary" :loading="uploading" @click="fileInput?.click()">导入 Excel</a-button>
      </div>
    </header>
    <a-alert v-if="error" type="error">{{ error }}</a-alert>
    <a-card class="map-card">
      <div class="map-toolbar">
        <span>收集点 {{ collectionPoints.length }} 个</span>
        <span v-if="collectionError" class="point-error">{{ collectionError }}</span>
        <label>主题
          <a-select v-model="mapTheme" size="small" :allow-clear="false" style="width: 88px">
            <a-option v-for="theme in mapThemes" :key="theme.value" :value="theme.value">{{ theme.label }}</a-option>
          </a-select>
        </label>
      </div>
      <div v-if="!points.length" class="empty-map">请导入包含 time、latitude、longitude 列的 .xlsx 文件，例如“箱号194.xlsx”</div>
      <div ref="mapContainer" class="track-map" :class="{ 'map-hidden': !points.length }" />
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
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CLOUD_POINTS_URL, extractArray, fetchCloudJson } from './map-cloud'
import { type TrackPoint, readTrackXlsx } from './track-xlsx'
import { type AMapInfoWindow, type AMapInstance, type AMapMarker, type AMapPolyline, loadAmapJsApi } from '@/utils/amap'
import { toGcj } from '@/utils/geo'

interface CollectionPoint { pointName: string, townshipName?: string, villageName?: string, latitude: number, longitude: number }
const fileInput = ref<HTMLInputElement>()
const exampleUrl = `${import.meta.env.BASE_URL}static/examples/${encodeURIComponent('箱号194.xlsx')}`
const mapContainer = ref<HTMLDivElement>()
const points = ref<TrackPoint[]>([])
const fileName = ref('')
const uploading = ref(false)
const error = ref('')
const playing = ref(false)
const speed = ref(1)
const speedOptions = [1, 5, 10, 20, 30].map((value) => ({ label: `${value}x`, value }))
const mapTheme = ref<'light' | 'normal'>('light')
const mapThemes = [{ label: '标准', value: 'light' }, { label: '默认', value: 'normal' }] as const
const collectionPoints = ref<CollectionPoint[]>([])
const collectionError = ref('')
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
let map: AMapInstance | undefined
let marker: AMapMarker | undefined
let collectionInfo: AMapInfoWindow | undefined
let collectionMarkers: AMapMarker[] = []
let route: AMapPolyline | undefined
let progress: AMapPolyline | undefined
let animation = 0
let lastFrame = 0
let renderedIndex = -1

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
  for (const point of collectionPoints.value) {
    if (!Number.isFinite(point.longitude) || !Number.isFinite(point.latitude)) continue
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
  try {
    const json = await fetchCloudJson(CLOUD_POINTS_URL)
    const list = extractArray<CollectionPoint>(json, ['list', 'boxes', 'points'])
    if (!list) throw new Error('数据格式无效')
    collectionPoints.value = list
    if (map) drawCollectionMarkers(await loadAmapJsApi())
  } catch { collectionError.value = '收集点加载失败' }
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
  map.setCenter(position(point))
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
    points.value = await readTrackXlsx(file)
    fileName.value = file.name
    elapsed.value = 0
    await drawMap()
    Message.success(`已导入 ${points.value.length} 个轨迹点`)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '导入失败'
  } finally {
    uploading.value = false
  }
}
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
onMounted(() => {
  void loadCollectionPoints()
})
onBeforeUnmount(() => {
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
.track-page { padding: 20px; display: grid; gap: 16px; }
.track-header, .timeline-top, .timeline-controls, .timeline-labels { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.track-header h2 { margin: 0 0 5px; }.track-header p { margin: 0; color: #86909c; }
.header-actions { display: flex; align-items: center; gap: 12px; }.example-link { color: #165dff; font-size: 14px; text-decoration: none; }.example-link:hover { text-decoration: underline; }
.map-card :deep(.arco-card-body) { padding: 0; }.track-map, .empty-map { height: min(65vh, 650px); min-height: 360px; }.map-hidden { display: none; }.empty-map { display: grid; place-items: center; color: #86909c; }
.map-toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 16px; padding: 10px 14px; color: #4e5969; font-size: 12px; }.map-toolbar label { display: flex; align-items: center; gap: 8px; }.point-error { color: #f53f3f; }
.track-map :deep(.track-collection-marker) { display: block; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; background: #00b42a; box-shadow: 0 0 0 2px #00b42a, 0 2px 8px #0004; }
.timeline-card :deep(.arco-card-body) { display: grid; gap: 16px; }.timeline-top { flex-wrap: wrap; }.timeline-top span { color: #4e5969; }.timeline-controls { justify-content: flex-start; flex-wrap: wrap; }.timeline-controls label { display: flex; align-items: center; gap: 8px; }
.speed-options { display: flex; gap: 6px; flex-wrap: wrap; }.speed-label { color: #4e5969; }
.timeline-range { width: 100%; accent-color: #165dff; cursor: pointer; }.timeline-labels { color: #86909c; font-size: 12px; flex-wrap: wrap; }
</style>

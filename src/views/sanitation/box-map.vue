<template>
  <div class="gi_page box-map-page">
    <div class="page-header">
      <div>
        <div class="page-title">箱体地图</div>
        <div class="page-subtitle">查看箱体实时位置、满溢状态及设备运行信息</div>
      </div>
      <a-space>
        <a-button :loading="cloudLoading" @click="loadFromCloud()">从云端刷新</a-button>
        <a-button @click="importVisible = true">导入最新 JSON</a-button>
        <a-button type="primary" :disabled="!selectedBox" @click="copyLocationLink">复制当前定位链接</a-button>
      </a-space>
    </div>

    <a-card class="filter-card" :bordered="false">
      <a-space wrap>
        <a-input v-model="keyword" allow-clear placeholder="输入箱体编号或名称" style="width: 240px">
          <template #prefix><icon-search /></template>
        </a-input>
        <a-button :type="overflowOnly ? 'primary' : 'outline'" :status="overflowOnly ? 'danger' : 'normal'" @click="overflowOnly = !overflowOnly">
          {{ overflowOnly ? '已筛选满溢' : '只看满溢' }}
        </a-button>
        <span class="filter-result">当前显示 {{ visibleBoxes.length }} 个箱体</span>
      </a-space>
    </a-card>

    <div class="map-layout" :class="{ 'has-detail': selectedBox }">
      <a-card class="map-card" :bordered="false">
        <div ref="mapRef" class="amap-container"></div>
        <div class="map-stats">
          <div class="map-stat"><span>箱体总数</span><b>{{ visibleBoxes.length }}</b></div>
          <div class="map-stat danger"><span>满溢预警</span><b>{{ overflowCount }}</b></div>
        </div>
        <div class="map-theme-picker">
          <span>地图主题</span>
          <a-select v-model="mapTheme" size="small" :allow-clear="false">
            <a-option v-for="theme in mapThemes" :key="theme.value" :value="theme.value">{{ theme.label }}</a-option>
          </a-select>
        </div>
        <div v-if="mapError" class="map-error">
          <icon-exclamation-circle-fill />
          <span>{{ mapError }}</span>
        </div>
      </a-card>

      <a-card v-if="selectedBox" class="detail-card" :bordered="false" title="箱体详情">
          <template #extra>
            <a-button type="text" size="mini" class="detail-close-btn" @click="selectedBox = undefined">
              <template #icon><icon-close /></template>
            </a-button>
          </template>
          <div class="detail-heading">
            <div>
              <span class="box-no">箱体编号 {{ selectedBox.containerNo }}</span>
              <h3>{{ selectedBox.containerName }}</h3>
            </div>
            <a-tag :color="statusColor(selectedBox)">{{ statusText(selectedBox) }}</a-tag>
          </div>
          <a-descriptions :column="2" size="small" layout="vertical" :label-style="{ color: '#86909c' }">
            <a-descriptions-item label="在线状态">{{ selectedBox.onlineStatus === 0 ? '在线' : '离线' }}</a-descriptions-item>
            <a-descriptions-item label="上报时间">{{ selectedBox.reportTime }}</a-descriptions-item>
            <a-descriptions-item label="垃圾占比">{{ selectedBox.fillLevel }}%</a-descriptions-item>
            <a-descriptions-item label="容量">{{ selectedBox.capacity }} 吨</a-descriptions-item>
            <a-descriptions-item label="温度">{{ selectedBox.temperature }} ℃</a-descriptions-item>
            <a-descriptions-item label="电量">{{ selectedBox.voltage }}%</a-descriptions-item>
            <a-descriptions-item label="开关状态">{{ selectedBox.switchStatus === '0' ? '关' : '开' }}</a-descriptions-item>
            <a-descriptions-item label="设备号">{{ selectedBox.deviceNo }}</a-descriptions-item>
          </a-descriptions>
          <div class="coordinate-block">
            <span>原始坐标（WGS84）</span><code>{{ selectedBox.longitude }}, {{ selectedBox.latitude }}</code>
            <span>地图坐标（GCJ-02）</span><code>{{ selectedGcj ? `${selectedGcj.lng.toFixed(6)}, ${selectedGcj.lat.toFixed(6)}` : '-' }}</code>
          </div>
          <div class="matched-block">
            <span class="section-label">匹配对象</span>
            <a-empty v-if="!matchedObjects.length" description="未匹配" :image-style="{ height: '34px' }" />
            <div v-for="item in matchedObjects" v-else :key="item.name" class="matched-item">
              <b>{{ item.name }}</b><span>{{ item.longitude }}, {{ item.latitude }}</span>
            </div>
          </div>
          <a-button type="primary" long @click="openAmap">在高德地图中打开</a-button>
      </a-card>
    </div>

    <a-modal v-model:visible="importVisible" title="导入最新箱体数据" :width="680" @before-ok="importBoxes">
      <p class="modal-tip">粘贴接口完整 JSON，格式需包含 <code>data.list</code> 数组（云端格式为 <code>data.points</code>）。导入后仅更新当前页面数据。</p>
      <a-textarea v-model="importText" :auto-size="{ minRows: 12, maxRows: 18 }" placeholder="粘贴完整接口 JSON" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'
import { CLOUD_BOXES_URL, extractArray, fetchCloudJson } from './map-cloud'

defineOptions({ name: 'SanitationBoxMap' })

interface GcjPoint { lng: number, lat: number }
type MapTheme = 'normal' | 'light'
interface Box {
  id: number
  deviceNo: string
  containerNo: string
  containerName: string
  onlineStatus: number
  overflowStatus: number
  matchObject: string
  fillLevel: number
  capacity: number
  longitude: number
  latitude: number
  reportTime: string
  temperature: number
  voltage: number
  switchStatus: string
}

const initialBoxes: Box[] = [
  { id: 48, deviceNo: '13820260721000000026', containerNo: '132', containerName: '小勾臂箱132号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368},"6225420055":{"latitude":36.068728,"longitude":114.242248},"6226170009":{"latitude":36.068764,"longitude":114.242648}}', fillLevel: 0, capacity: 1.5, longitude: 114.242817, latitude: 36.069452, reportTime: '2026-08-06 18:56:04', temperature: 34.37, voltage: 40, switchStatus: '0' },
  { id: 34, deviceNo: '13820260721000000121', containerNo: '148', containerName: '小勾臂箱148号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 60.8, capacity: 1.5, longitude: 114.045902, latitude: 36.039724, reportTime: '2026-08-06 18:56:03', temperature: 30, voltage: 80, switchStatus: '0' },
  { id: 62, deviceNo: '13820260721000000059', containerNo: '323', containerName: '小勾臂箱323号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"马家乡北齐":{"latitude":36.055297,"longitude":114.026639},"431":{"latitude":36.056207,"longitude":114.026885},"435":{"latitude":36.055823,"longitude":114.026455}}', fillLevel: 0, capacity: 1.5, longitude: 114.025919, latitude: 36.055901, reportTime: '2026-08-06 18:56:03', temperature: 30.62, voltage: 80, switchStatus: '0' },
  { id: 80, deviceNo: '13820260721000000002', containerNo: '358', containerName: '小勾臂箱358号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368}}', fillLevel: 0, capacity: 1.5, longitude: 114.242314, latitude: 36.06946, reportTime: '2026-08-06 18:56:03', temperature: 34.31, voltage: 60, switchStatus: '0' },
  { id: 65, deviceNo: '13820260721000000031', containerNo: '274', containerName: '小勾臂箱274号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"马家乡横岭三仓线":{"latitude":35.995262,"longitude":114.038768},"马家乡岭头":{"latitude":35.992369,"longitude":114.045606}}', fillLevel: 69.87, capacity: 1.5, longitude: 114.038736, latitude: 35.995271, reportTime: '2026-08-06 18:56:03', temperature: 31.31, voltage: 80, switchStatus: '0' },
  { id: 25, deviceNo: '13820260721000000020', containerNo: '150', containerName: '小勾臂箱150号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"416":{"latitude":36.035347,"longitude":114.022102}}', fillLevel: 0, capacity: 1.5, longitude: 114.022643, latitude: 36.03506, reportTime: '2026-08-06 18:56:03', temperature: 31.62, voltage: 40, switchStatus: '0' },
  { id: 67, deviceNo: '13820260721000000014', containerNo: '161', containerName: '小勾臂箱161号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"豫AE9509":{"latitude":36.067728,"longitude":114.242184},"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368},"豫AE9505":{"latitude":36.067772,"longitude":114.242472}}', fillLevel: 0, capacity: 1.5, longitude: 114.242216, latitude: 36.067765, reportTime: '2026-08-06 18:56:03', temperature: 32.06, voltage: 50, switchStatus: '0' },
  { id: 70, deviceNo: '13820260721000000010', containerNo: '285', containerName: '小勾臂箱285号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368}}', fillLevel: 0, capacity: 1.5, longitude: 114.242581, latitude: 36.069468, reportTime: '2026-08-06 18:56:03', temperature: 33.37, voltage: 40, switchStatus: '0' },
  { id: 47, deviceNo: '13820260721000000028', containerNo: '143', containerName: '小勾臂箱143号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 57.6, capacity: 1.5, longitude: 114.023128, latitude: 36.056029, reportTime: '2026-08-06 18:56:03', temperature: 30.81, voltage: 80, switchStatus: '0' },
  { id: 76, deviceNo: '13820260721000000070', containerNo: '176', containerName: '小勾臂箱176号设备', onlineStatus: 0, overflowStatus: 1, matchObject: '{"马家乡北齐":{"latitude":36.055297,"longitude":114.026639},"430":{"latitude":36.055177,"longitude":114.026652},"435":{"latitude":36.055823,"longitude":114.026455}}', fillLevel: 75.6, capacity: 1.5, longitude: 114.026696, latitude: 36.055253, reportTime: '2026-08-06 18:56:03', temperature: 30.68, voltage: 70, switchStatus: '0' },
]

const mapRef = ref<HTMLDivElement>()
const keyword = ref('')
const overflowOnly = ref(false)
const mapTheme = ref<MapTheme>('light')
const boxes = ref<Box[]>(initialBoxes)
const selectedBox = ref<Box>()
const mapError = ref('')
const cloudLoading = ref(false)
const importVisible = ref(false)
const importText = ref('')
let map: AMapInstance | undefined
let markers: AMapMarker[] = []
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let gcjPoints = new WeakMap<Box, GcjPoint>()
const mapThemes: Array<{ label: string, value: MapTheme }> = [
  { label: '标准', value: 'light' },
  { label: '默认', value: 'normal' },
]

const visibleBoxes = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return boxes.value.filter((box) => Number.isFinite(box.longitude) && Number.isFinite(box.latitude)
    && (!overflowOnly.value || box.overflowStatus === 1)
    && (!query || box.containerNo.toLowerCase().includes(query) || box.containerName.toLowerCase().includes(query)))
})
const overflowCount = computed(() => boxes.value.filter((box) => box.overflowStatus === 1).length)
const selectedGcj = computed(() => selectedBox.value ? getGcjPoint(selectedBox.value) : undefined)
const matchedObjects = computed(() => {
  if (!selectedBox.value?.matchObject) return []
  try {
    return Object.entries(JSON.parse(selectedBox.value.matchObject) as Record<string, { longitude: number, latitude: number }>)
      .map(([name, point]) => ({ name, ...point }))
  } catch { return [] }
})

function toGcj(lng: number, lat: number): GcjPoint {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35)
  const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}

function markerTone(box: Box) { return box.overflowStatus === 1 ? 'overflow' : box.fillLevel >= 70 ? 'warning' : '' }
function getGcjPoint(box: Box) {
  const cached = gcjPoints.get(box)
  if (cached) return cached
  const point = toGcj(box.longitude, box.latitude)
  gcjPoints.set(box, point)
  return point
}
function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}
function drawMarkers() {
  if (!map || !amap) return
  markers.forEach((marker) => marker.setMap(null)); markers = []
  markers = visibleBoxes.value.map((box) => {
    const point = getGcjPoint(box)
    const marker = new amap.Marker({ position: [point.lng, point.lat], offset: new amap.Pixel(-18, -34), content: `<div class="box-map-marker ${markerTone(box)}">${escapeHtml(box.containerNo)}</div>`, title: box.containerName })
    marker.on('click', () => selectBox(box))
    marker.setMap(map!)
    return marker
  })
  if (markers.length) map.setFitView(markers, false, [60, 60, 60, 360])
  if (selectedBox.value && !visibleBoxes.value.includes(selectedBox.value)) selectedBox.value = undefined
}

function selectBox(box: Box) {
  selectedBox.value = box
  const point = getGcjPoint(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 16), [point.lng, point.lat])
}
function statusText(box: Box) { return box.overflowStatus === 1 ? '满溢' : box.fillLevel >= 70 ? '接近满溢' : '正常' }
function statusColor(box: Box) { return box.overflowStatus === 1 ? 'red' : box.fillLevel >= 70 ? 'orange' : 'green' }
function locationUrl() {
  const box = selectedBox.value
  if (!box) return ''
  const point = getGcjPoint(box)
  return `https://uri.amap.com/marker?position=${point.lng.toFixed(6)},${point.lat.toFixed(6)}&name=${encodeURIComponent(box.containerName)}&coordinate=gaode&callnative=1`
}
async function copyLocationLink() {
  const url = locationUrl(); if (!url) return
  try { await navigator.clipboard.writeText(url); Message.success('高德定位链接已复制') } catch { window.prompt('复制此链接发送给客户：', url) }
}
function openAmap() { const url = locationUrl(); if (url) window.open(url, '_blank', 'noopener') }
function importBoxes() {
  try {
    const list = JSON.parse(importText.value)?.data?.list
    if (!Array.isArray(list)) throw new Error()
    boxes.value = list as Box[]; gcjPoints = new WeakMap<Box, GcjPoint>(); selectedBox.value = undefined; importText.value = ''
    Message.success(`已导入 ${list.length} 个箱体`)
    return true
  } catch { Message.error('JSON 格式不正确：需要包含 data.list 数组'); return false }
}

watch([keyword, overflowOnly], drawMarkers)
watch(boxes, drawMarkers)
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
async function loadFromCloud(silent = false) {
  cloudLoading.value = true
  try {
    const json = await fetchCloudJson<{ data?: Record<string, unknown> }>(CLOUD_BOXES_URL)
    const list = extractArray<Box>(json, ['boxes', 'list', 'points'])
    if (!list) throw new Error('no-list')
    boxes.value = list
    gcjPoints = new WeakMap<Box, GcjPoint>()
    selectedBox.value = undefined
    if (!silent) Message.success(`已加载云端箱体数据 ${list.length} 个`)
  } catch (error) {
    if (!silent) Message.warning('云端数据加载失败，已使用本地/缓存数据')
  } finally {
    cloudLoading.value = false
  }
}
onMounted(async () => {
  if (!mapRef.value) return
  try {
    amap = await loadAmapJsApi()
    map = new amap.Map(mapRef.value, { zoom: 13, center: [114.1, 36.04], viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true, animateEnable: false, jogEnable: false })
    drawMarkers()
    loadFromCloud(true)
  } catch (error) { mapError.value = error instanceof Error ? error.message : '高德地图加载失败，请检查地图配置' }
})
onBeforeUnmount(() => { markers.forEach((marker) => marker.setMap(null)); map?.destroy() })
</script>

<style scoped lang="scss">
.box-map-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle, .filter-result { color: #86909c; font-size: 13px; }
.filter-card :deep(.arco-card-body) { padding: 14px 16px; }
.map-layout { flex: 1; min-height: 600px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }.map-layout.has-detail { grid-template-columns: minmax(0, 1fr) 360px; }
.map-card, .detail-card { min-height: 0; overflow: hidden; }
.map-card :deep(.arco-card-body) { height: 100%; padding: 0; }
.detail-card :deep(.arco-card-body) { overflow: auto; }
.amap-container { width: 100%; height: 100%; min-height: 600px; background: #f2f3f5; }
.map-stats { position: absolute; top: 16px; left: 16px; display: flex; gap: 10px; z-index: 1; }
.map-theme-picker { position: absolute; z-index: 1; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-theme-picker :deep(.arco-select) { width: 88px; }
.map-stat { min-width: 106px; padding: 9px 14px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }
.map-stat b { display: block; color: #165dff; font-size: 22px; line-height: 28px; }.map-stat.danger b { color: #f53f3f; }
.map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: #f53f3f; background: #f7f8fa; }
.detail-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }.detail-heading h3 { margin: 4px 0 0; color: #1d2129; font-size: 17px; }.box-no, .section-label { color: #86909c; font-size: 12px; }
.detail-card :deep(.arco-card-header) { align-items: center; }.detail-close-btn { color: #86909c; }.detail-close-btn:hover { color: #1d2129; }
.coordinate-block { display: grid; gap: 5px; margin: 18px 0; }.coordinate-block span { color: #86909c; font-size: 12px; }.coordinate-block code { margin-bottom: 8px; padding: 8px; border-radius: 3px; background: #f7f8fa; color: #4e5969; font-size: 12px; }
.matched-block { margin-bottom: 18px; }.matched-item { display: grid; gap: 2px; padding: 9px 0; border-bottom: 1px solid #f2f3f5; }.matched-item b { color: #4e5969; font-size: 13px; }.matched-item span { color: #86909c; font-size: 12px; }
.modal-tip { margin-top: 0; color: #4e5969; }.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
:global(.box-map-marker) { position: relative; min-width: 36px; height: 26px; padding: 0 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 12px; font-weight: 600; }
:global(.box-map-marker::after) { content: ''; position: absolute; bottom: -6px; left: 50%; width: 10px; height: 10px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }.box-map-page :global(.box-map-marker.warning) { background: #ff7d00; }.box-map-page :global(.box-map-marker.overflow) { background: #f53f3f; }
@media (max-width: 960px) { .map-layout { grid-template-columns: 1fr; }.detail-card { min-height: 460px; }.page-header { align-items: flex-start; gap: 12px; flex-direction: column; } }
</style>

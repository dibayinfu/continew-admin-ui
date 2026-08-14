<template>
  <div class="gi_page point-map-page">
    <div class="page-header">
      <div>
        <div class="page-title">收集点地图</div>
        <div class="page-subtitle">查看收集点位置、服务半径及覆盖箱体信息</div>
      </div>
      <a-space>
        <a-button type="primary" :loading="cloudLoading" @click="loadFromCloud()">
          <template #icon><icon-sync /></template>
          更新
        </a-button>
        <a-dropdown position="br">
          <a-button>更多<icon-down /></a-button>
          <template #content>
            <a-doption @click="importVisible = true">导入最新 JSON</a-doption>
            <a-doption :disabled="!selectedPoint" @click="copyLocationLink">复制当前定位链接</a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>

    <a-card class="filter-card" :bordered="false">
      <a-space wrap>
        <a-input v-model="keyword" allow-clear placeholder="输入收集点名称、乡镇或村庄" style="width: 260px">
          <template #prefix><icon-search /></template>
        </a-input>
        <a-select v-model="township" placeholder="全部乡镇" allow-clear style="width: 160px">
          <a-option v-for="name in townshipOptions" :key="name" :value="name">{{ name }}</a-option>
        </a-select>
        <a-button :type="multiOnly ? 'primary' : 'outline'" :status="multiOnly ? 'warning' : 'normal'" @click="multiOnly = !multiOnly">
          {{ multiOnly ? '已筛多箱点' : '只看多箱点' }}
        </a-button>
        <span class="filter-result">当前显示 {{ visiblePoints.length }} 个收集点</span>
      </a-space>
      <div class="filter-block">
        <span class="filter-label">村庄</span>
        <button type="button" class="chip" :class="{ active: !villageFilter }" @click="villageFilter = ''">全部</button>
        <button v-for="v in visibleVillageOptions" :key="v" type="button" class="chip" :class="{ active: villageFilter === v }" @click="villageFilter = v">{{ v }}</button>
        <button v-if="villageOptions.length > VILLAGE_COLLAPSED" type="button" class="chip chip-more" @click="villageCollapsed = !villageCollapsed">
          {{ villageCollapsed ? `更多 ${villageOptions.length - VILLAGE_COLLAPSED}` : '收起' }}
        </button>
        <button type="button" class="chip unmatched" :class="{ active: villageFilter === UNMATCHED }" @click="villageFilter = UNMATCHED">未匹配 {{ unmatchedVillageCount }}</button>
      </div>
    </a-card>

    <div class="map-layout" :class="{ 'has-detail': selectedPoint }">
      <div ref="mapFullscreenRef" class="map-card-wrap">
        <a-card class="map-card" :bordered="false">
          <div ref="mapRef" class="amap-container"></div>
          <div class="map-stats">
            <div class="map-stat"><span>收集点</span><b>{{ visiblePoints.length }}</b></div>
            <div class="map-stat"><span>覆盖箱体</span><b>{{ containerTotal }}</b></div>
            <div class="map-stat"><span>涉及乡镇</span><b>{{ townshipCount }}</b></div>
          </div>
          <div class="map-controls">
            <div class="map-theme-picker">
              <span>主题</span>
              <a-select v-model="mapTheme" size="small" :allow-clear="false">
                <a-option v-for="theme in mapThemes" :key="theme.value" :value="theme.value">{{ theme.label }}</a-option>
              </a-select>
            </div>
            <a-tooltip :content="isMapFullscreen ? '退出全屏' : '全屏放大'">
              <a-button class="map-fullscreen-btn" :class="{ active: isMapFullscreen }" size="small" @click="toggleMapFullscreen">
                <template #icon>
                  <icon-fullscreen-exit v-if="isMapFullscreen" />
                  <icon-fullscreen v-else />
                </template>
              </a-button>
            </a-tooltip>
          </div>
          <div v-if="mapError" class="map-error">
            <icon-exclamation-circle-fill />
            <span>{{ mapError }}</span>
          </div>
        </a-card>
      </div>

      <a-card v-if="selectedPoint" class="detail-card" :bordered="false" title="收集点详情">
        <template #extra>
          <a-button type="text" size="mini" class="detail-close-btn" @click="selectedPoint = undefined">
            <template #icon><icon-close /></template>
          </a-button>
        </template>
        <div class="detail-scroll">
        <div class="detail-heading">
          <div>
            <span class="point-no">{{ selectedPoint.townshipName }} · {{ selectedPoint.villageName }}</span>
            <h3>{{ selectedPoint.pointName }}</h3>
          </div>
          <a-tag :color="selectedPoint.status === 1 ? 'green' : 'red'">{{ selectedPoint.status === 1 ? '启用' : '停用' }}</a-tag>
        </div>
        <a-descriptions :column="2" size="small" layout="vertical" :label-style="{ color: '#86909c' }">
          <a-descriptions-item label="所属乡镇">{{ selectedPoint.townshipName }}</a-descriptions-item>
          <a-descriptions-item label="所属村庄">{{ selectedPoint.villageName }}</a-descriptions-item>
          <a-descriptions-item label="箱体数量">{{ selectedPoint.containerCount }} 个</a-descriptions-item>
          <a-descriptions-item label="服务半径">{{ selectedPoint.serviceRadius }} 米</a-descriptions-item>
          <a-descriptions-item label="负责人">{{ selectedPoint.responsiblePerson || '-' }}</a-descriptions-item>
          <a-descriptions-item label="联系电话">{{ selectedPoint.contactPhone || '-' }}</a-descriptions-item>
        </a-descriptions>
        <div class="info-block">
          <span class="section-label">详细地址</span>
          <p>{{ selectedPoint.address || '-' }}</p>
        </div>
        <div v-if="selectedPoint.remark" class="info-block">
          <span class="section-label">备注</span>
          <p>{{ selectedPoint.remark }}</p>
        </div>
        <div class="info-block">
          <span class="section-label">更新时间</span>
          <p>{{ selectedPoint.updateTime || selectedPoint.createTime || '-' }}</p>
        </div>
        <div class="coordinate-block">
          <span>原始坐标（WGS84）</span><code>{{ selectedPoint.longitude }}, {{ selectedPoint.latitude }}</code>
          <span>地图坐标（GCJ-02）</span><code>{{ selectedGcj ? `${selectedGcj.lng.toFixed(6)}, ${selectedGcj.lat.toFixed(6)}` : '-' }}</code>
        </div>
        </div>
        <div class="detail-actions">
          <a-button type="primary" long @click="openAmap">在高德地图中打开</a-button>
        </div>
      </a-card>
    </div>

    <a-modal v-model:visible="importVisible" title="导入最新收集点数据" :width="680" @before-ok="importPoints">
      <p class="modal-tip">粘贴接口完整 JSON，格式需包含 <code>data.list</code> 数组（云端格式为 <code>data.boxes</code>）。导入后仅更新当前页面数据。</p>
      <a-textarea v-model="importText" :auto-size="{ minRows: 12, maxRows: 18 }" placeholder="粘贴完整接口 JSON" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useFullscreen } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type AMapCircle, type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'
import { CLOUD_POINTS_URL, extractArray, fetchCloudJson } from './map-cloud'

defineOptions({ name: 'SanitationCollectionPointMap' })

interface GcjPoint { lng: number, lat: number }
type MapTheme = 'normal' | 'light'
interface CollectionPoint {
  id: number
  pointName: string
  pointCode: string
  townshipId: number
  townshipName: string
  villageId: number
  villageName: string
  pointType: number | null
  containerCount: number
  longitude: number
  latitude: number
  serviceRadius: number
  address: string
  status: number
  remark: string
  responsiblePerson: string | null
  contactPhone: string | null
  organizationId: number
  isDeleted: number
  createTime: string
  updateTime: string | null
}

const initialPoints: CollectionPoint[] = [
  { id: 96, pointName: '马家乡岭头', pointCode: '', townshipId: 8, townshipName: '马家乡', villageId: 152, villageName: '岭头村', pointType: null, containerCount: 1, longitude: 114.045606, latitude: 35.992369, serviceRadius: 100, address: '河南省安阳市龙安区马家乡横岭三仓线洹河峡谷风景区', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-06 16:05:13', updateTime: '2026-08-06 18:59:13' },
  { id: 94, pointName: '马家乡横岭3', pointCode: '', townshipId: 8, townshipName: '马家乡', villageId: 156, villageName: '横岭村', pointType: null, containerCount: 1, longitude: 114.04264, latitude: 35.995244, serviceRadius: 100, address: '河南省安阳市龙安区马家乡横岭三仓线洹河峡谷风景区', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-06 11:50:47', updateTime: '2026-08-06 11:51:41' },
  { id: 93, pointName: '马家乡北齐', pointCode: '', townshipId: 8, townshipName: '马家乡', villageId: 141, villageName: '北齐村', pointType: null, containerCount: 1, longitude: 114.026639, latitude: 36.055297, serviceRadius: 100, address: '河南省安阳市龙安区马家乡马家乡北齐村第二卫生室', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-06 11:48:45', updateTime: null },
  { id: 88, pointName: '龙泉镇龙泉村', pointCode: '', townshipId: 4, townshipName: '龙泉镇', villageId: 18, villageName: '龙泉村', pointType: null, containerCount: 1, longitude: 114.185836, latitude: 36.063542, serviceRadius: 100, address: '河南省安阳市龙安区龙泉镇011县道', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-05 12:08:08', updateTime: '2026-08-06 11:33:10' },
  { id: 86, pointName: '龙泉吴家洞', pointCode: '', townshipId: 4, townshipName: '龙泉镇', villageId: 21, villageName: '吴家洞', pointType: null, containerCount: 1, longitude: 114.168431, latitude: 36.050852, serviceRadius: 100, address: '河南省安阳市龙安区龙泉镇安阳市龙泉农家乐服务管理中心', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-04 19:36:53', updateTime: '2026-08-06 11:33:01' },
  { id: 78, pointName: '善应三仓', pointCode: '', townshipId: 6, townshipName: '善应镇', villageId: 95, villageName: '三仓', pointType: null, containerCount: 1, longitude: 114.084759, latitude: 35.990363, serviceRadius: 100, address: '河南省安阳市龙安区善应镇028乡道', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-03 19:38:06', updateTime: '2026-08-06 11:32:29' },
  { id: 71, pointName: '马家乡马家', pointCode: '', townshipId: 8, townshipName: '马家乡', villageId: 149, villageName: '马家村', pointType: null, containerCount: 1, longitude: 114.030897, latitude: 36.037917, serviceRadius: 100, address: '河南省安阳市龙安区马家乡036乡道马家村民委员会', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-03 10:32:18', updateTime: null },
  { id: 55, pointName: '善应大平', pointCode: '', townshipId: 6, townshipName: '善应镇', villageId: 96, villageName: '大平', pointType: null, containerCount: 2, longitude: 114.080538, latitude: 35.997015, serviceRadius: 100, address: '河南省安阳市龙安区善应镇028乡道', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-01 09:31:31', updateTime: '2026-08-01 09:48:07' },
  { id: 52, pointName: '东风申家岗3', pointCode: '', townshipId: 7, townshipName: '东风乡', villageId: 128, villageName: '申家岗', pointType: null, containerCount: 1, longitude: 114.263076, latitude: 36.09231, serviceRadius: 100, address: '河南省安阳市龙安区东风乡申家岗瓷砖批发', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-07-27 10:28:40', updateTime: '2026-07-27 10:19:53' },
  { id: 40, pointName: '彰武西高平（可放多箱，需硬化）', pointCode: '', townshipId: 2, townshipName: '彰武街道', villageId: 10, villageName: '西高平村', pointType: null, containerCount: 2, longitude: 114.15997, latitude: 36.103984, serviceRadius: 100, address: '河南省安阳市龙安区彰武街道西高平小学', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-07-20 17:46:12', updateTime: null },
  { id: 8, pointName: '宗村4仲明寺东北26米', pointCode: '', townshipId: 3, townshipName: '文昌街道', villageId: 13, villageName: '宗村', pointType: null, containerCount: 2, longitude: 114.326847, latitude: 36.069723, serviceRadius: 100, address: '河南省安阳市龙安区文昌大道街道老姬羊汤烩面宗村仲明寺', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-07-14 16:26:59', updateTime: '2026-07-16 13:18:07' },
  { id: 1, pointName: '善应黑玉村', pointCode: '', townshipId: 6, townshipName: '善应镇', villageId: 104, villageName: '黑玉', pointType: null, containerCount: 2, longitude: 114.109719, latitude: 36.041684, serviceRadius: 100, address: '河南省安阳市龙安区善应镇装货口', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-07-14 15:56:36', updateTime: '2026-07-16 13:17:31' },
]

const mapRef = ref<HTMLDivElement>()
const mapFullscreenRef = ref<HTMLElement | null>(null)
const { isFullscreen: isMapFullscreen, toggle: toggleMapFullscreen } = useFullscreen(mapFullscreenRef, {
  // 进入/退出全屏后地图容器尺寸变化，通知高德地图重算视口
  onFullscreenChange: () => { nextTick(() => map?.resize()) },
})
const keyword = ref('')
const township = ref<string>()
const multiOnly = ref(false)
const mapTheme = ref<MapTheme>('light')
const points = ref<CollectionPoint[]>(initialPoints)
const selectedPoint = ref<CollectionPoint>()
const mapError = ref('')
const cloudLoading = ref(false)
const importVisible = ref(false)
const importText = ref('')
let map: AMapInstance | undefined
let markers: AMapMarker[] = []
let radiusCircles: AMapCircle[] = []
let selectedRadiusLabel: AMapMarker | undefined
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let gcjPoints = new WeakMap<CollectionPoint, GcjPoint>()
const mapThemes: Array<{ label: string, value: MapTheme }> = [
  { label: '标准', value: 'light' },
  { label: '默认', value: 'normal' },
]

const townshipOptions = computed(() => Array.from(new Set(points.value.map((p) => p.townshipName).filter(Boolean))).sort())
/** 「未匹配」筛选值：无村庄归属的收集点专用 sentinel，不会与真实村庄名冲突 */
const UNMATCHED = '__unmatched__'
const villageFilter = ref('')
/** 村庄 chips 折叠：默认只显示前 N 个（约两行），点击「更多」展开 */
const VILLAGE_COLLAPSED = 24
const villageCollapsed = ref(true)
const villageOptions = computed(() => Array.from(new Set(points.value.map((p) => p.villageName).filter(Boolean))).sort())
const visibleVillageOptions = computed(() => {
  const list = villageCollapsed.value ? villageOptions.value.slice(0, VILLAGE_COLLAPSED) : villageOptions.value
  // 保证当前选中的村庄始终可见（即使超出折叠数量）
  if (villageFilter.value && villageFilter.value !== UNMATCHED && !list.includes(villageFilter.value) && villageOptions.value.includes(villageFilter.value)) {
    return [...list, villageFilter.value]
  }
  return list
})
const unmatchedVillageCount = computed(() => points.value.filter((p) => !p.villageName).length)
function matchVillage(point: CollectionPoint) {
  if (!villageFilter.value) return true
  const village = point.villageName
  if (villageFilter.value === UNMATCHED) return !village
  return village === villageFilter.value
}
const visiblePoints = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return points.value.filter((p) => Number.isFinite(p.longitude) && Number.isFinite(p.latitude)
    && (!township.value || p.townshipName === township.value)
    && matchVillage(p)
    && (!multiOnly.value || p.containerCount >= 2)
    && (!query || p.pointName.toLowerCase().includes(query) || p.townshipName.toLowerCase().includes(query)
      || p.villageName.toLowerCase().includes(query) || p.address.toLowerCase().includes(query)))
})
const containerTotal = computed(() => visiblePoints.value.reduce((sum, p) => sum + (p.containerCount || 0), 0))
const townshipCount = computed(() => new Set(visiblePoints.value.map((p) => p.townshipName)).size)
const selectedGcj = computed(() => selectedPoint.value ? getGcjPoint(selectedPoint.value) : undefined)

function toGcj(lng: number, lat: number): GcjPoint {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35)
  const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}

function markerTone(point: CollectionPoint) { return point.containerCount >= 2 ? 'multi' : '' }
function getGcjPoint(point: CollectionPoint) {
  const cached = gcjPoints.get(point)
  if (cached) return cached
  const gcj = toGcj(point.longitude, point.latitude)
  gcjPoints.set(point, gcj)
  return gcj
}
function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}
function drawMarkers() {
  if (!map || !amap) return
  markers.forEach((marker) => marker.setMap(null)); markers = []
  radiusCircles.forEach((circle) => circle.setMap(null)); radiusCircles = []
  visiblePoints.value.forEach((point) => {
    const gcj = getGcjPoint(point)
    const marker = new amap.Marker({ position: [gcj.lng, gcj.lat], offset: new amap.Pixel(-16, -16), content: `<div class="point-map-marker ${markerTone(point)}">${escapeHtml(point.containerCount)}</div>`, title: point.pointName })
    marker.on('click', () => selectPoint(point))
    marker.setMap(map!)
    markers.push(marker)
    const radius = point.serviceRadius || 100
    const circle = new amap.Circle({ center: new amap.LngLat(gcj.lng, gcj.lat), radius, strokeColor: '#165dff', strokeOpacity: 0.55, strokeWeight: 1.5, strokeStyle: 'dashed', fillColor: '#165dff', fillOpacity: 0.07 })
    circle.setMap(map!)
    radiusCircles.push(circle)
  })
  if (markers.length) map.setFitView(markers, false, [60, 60, 60, 360])
  if (selectedPoint.value && !visiblePoints.value.includes(selectedPoint.value)) selectedPoint.value = undefined
  drawSelectedRadiusLabel()
}

/** 清除选中点的服务半径文字标记 */
function clearSelectedRadiusLabel() {
  if (selectedRadiusLabel) { selectedRadiusLabel.setMap(null); selectedRadiusLabel = undefined }
}

/** 在选中点服务半径顶部标注“XXm”文字 */
function drawSelectedRadiusLabel() {
  clearSelectedRadiusLabel()
  const point = selectedPoint.value
  if (!point || !map || !amap) return
  const gcj = getGcjPoint(point)
  const radius = point.serviceRadius || 100
  selectedRadiusLabel = new amap.Marker({
    position: [gcj.lng, gcj.lat + radius / 111320],
    content: `<div class="point-radius-label">${escapeHtml(radius)}m</div>`,
    offset: new amap.Pixel(-30, -18),
  })
  selectedRadiusLabel.setMap(map)
}

function selectPoint(point: CollectionPoint) {
  selectedPoint.value = point
  const gcj = getGcjPoint(point)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 15), [gcj.lng, gcj.lat])
}
function locationUrl() {
  const point = selectedPoint.value
  if (!point) return ''
  const gcj = getGcjPoint(point)
  return `https://uri.amap.com/marker?position=${gcj.lng.toFixed(6)},${gcj.lat.toFixed(6)}&name=${encodeURIComponent(point.pointName)}&coordinate=gaode&callnative=1`
}
async function copyLocationLink() {
  const url = locationUrl(); if (!url) return
  try { await navigator.clipboard.writeText(url); Message.success('高德定位链接已复制') } catch { window.prompt('复制此链接发送给客户：', url) }
}
function openAmap() { const url = locationUrl(); if (url) window.open(url, '_blank', 'noopener') }
function importPoints() {
  try {
    const list = JSON.parse(importText.value)?.data?.list
    if (!Array.isArray(list)) throw new Error()
    points.value = list as CollectionPoint[]; gcjPoints = new WeakMap<CollectionPoint, GcjPoint>(); selectedPoint.value = undefined; importText.value = ''
    Message.success(`已导入 ${list.length} 个收集点`)
    return true
  } catch { Message.error('JSON 格式不正确：需要包含 data.list 数组'); return false }
}

watch([keyword, township, villageFilter, multiOnly], drawMarkers)
watch(points, drawMarkers)
watch(selectedPoint, drawSelectedRadiusLabel)
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
async function loadFromCloud(silent = false) {
  cloudLoading.value = true
  try {
    const json = await fetchCloudJson<{ data?: Record<string, unknown> }>(CLOUD_POINTS_URL)
    const list = extractArray<CollectionPoint>(json, ['list', 'boxes', 'points'])
    if (!list) throw new Error('no-list')
    points.value = list
    gcjPoints = new WeakMap<CollectionPoint, GcjPoint>()
    selectedPoint.value = undefined
    if (!silent) Message.success(`已加载云端收集点数据 ${list.length} 个`)
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
    map = new amap.Map(mapRef.value, { zoom: 12, center: [114.13, 36.04], viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true, animateEnable: false, jogEnable: false })
    drawMarkers()
    loadFromCloud(true)
  } catch (error) { mapError.value = error instanceof Error ? error.message : '高德地图加载失败，请检查地图配置' }
})
onBeforeUnmount(() => { markers.forEach((marker) => marker.setMap(null)); radiusCircles.forEach((circle) => circle.setMap(null)); clearSelectedRadiusLabel(); map?.destroy() })
</script>

<style scoped lang="scss">
.point-map-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle, .filter-result { color: #86909c; font-size: 13px; }
.filter-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.filter-label { color: #4e5969; font-size: 13px; white-space: nowrap; }
.chip { padding: 2px 13px; border: 1px solid #e5e6eb; border-radius: 14px; background: #fff; color: #4e5969; font-size: 13px; line-height: 22px; cursor: pointer; transition: all .15s; }
.chip:hover { border-color: #165dff; color: #165dff; }
.chip.active { background: #165dff; border-color: #165dff; color: #fff; }
.chip.unmatched { border-style: dashed; color: #86909c; }
.chip.unmatched:hover { border-color: #86909c; color: #4e5969; }
.chip.unmatched.active { background: #4e5969; border-color: #4e5969; color: #fff; }
.chip-more { border-style: dashed; color: #165dff; }.chip-more:hover { border-color: #165dff; color: #165dff; }
.filter-card :deep(.arco-card-body) { padding: 14px 16px; }
.map-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 16px; overflow: hidden; }.map-layout.has-detail { grid-template-columns: minmax(0, 1fr) 360px; }
.map-card-wrap { min-height: 0; overflow: hidden; display: flex; }.map-card-wrap .map-card { flex: 1; min-height: 0; }.map-card-wrap:fullscreen { position: fixed; inset: 0; z-index: 1001; background: #f2f3f5; }
.map-card, .detail-card { min-height: 0; overflow: hidden; }
.map-card :deep(.arco-card-body) { height: 100%; padding: 0; }
.detail-card { display: flex; flex-direction: column; }
.detail-card :deep(.arco-card-body) { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.detail-card .detail-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.detail-card .detail-actions { flex-shrink: 0; padding-top: 16px; }
.amap-container { width: 100%; height: 100%; background: #f2f3f5; }
.map-stats { position: absolute; top: 16px; left: 16px; display: flex; gap: 10px; z-index: 1; }
.map-controls { position: absolute; z-index: 1; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; }
.map-theme-picker { height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 9px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-theme-picker :deep(.arco-select) { width: 88px; }
.map-fullscreen-btn { height: 32px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; }.map-fullscreen-btn.active { color: #165dff; border-color: #165dff; }
.map-stat { min-width: 106px; padding: 9px 14px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }
.map-stat b { display: block; color: #165dff; font-size: 22px; line-height: 28px; }
.map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: #f53f3f; background: #f7f8fa; }
.detail-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }.detail-heading h3 { margin: 4px 0 0; color: #1d2129; font-size: 17px; }.point-no, .section-label { color: #86909c; font-size: 12px; }
.detail-card :deep(.arco-card-header) { align-items: center; }.detail-close-btn { color: #86909c; }.detail-close-btn:hover { color: #1d2129; }
.info-block { margin-bottom: 16px; }.info-block p { margin: 4px 0 0; color: #4e5969; font-size: 13px; line-height: 1.6; }
.coordinate-block { display: grid; gap: 5px; margin: 18px 0; }.coordinate-block span { color: #86909c; font-size: 12px; }.coordinate-block code { margin-bottom: 8px; padding: 8px; border-radius: 3px; background: #f7f8fa; color: #4e5969; font-size: 12px; }
.modal-tip { margin-top: 0; color: #4e5969; }.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
:global(.point-map-marker) { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; border-radius: 50%; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 13px; font-weight: 600; }
.point-map-page :global(.point-map-marker.multi) { background: #ff7d00; }
:global(.point-radius-label) { position: relative; padding: 1px 6px; border-radius: 3px; background: rgb(22 93 255 / 90%); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 1px 4px rgb(29 33 41 / 25%); }
.point-radius-label::after { content: ''; position: absolute; bottom: -5px; left: 50%; width: 8px; height: 8px; border-left: 1px solid rgb(22 93 255 / 90%); border-bottom: 1px solid rgb(22 93 255 / 90%); background: rgb(22 93 255 / 90%); transform: translateX(-50%) rotate(-45deg); }
@media (max-width: 960px) { .map-layout { grid-template-columns: 1fr; grid-template-rows: minmax(0, 45vh) minmax(0, 45vh); overflow: hidden; }.detail-card { min-height: 0; }.page-header { align-items: flex-start; gap: 12px; flex-direction: column; } }
</style>

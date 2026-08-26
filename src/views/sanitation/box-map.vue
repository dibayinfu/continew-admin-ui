<template>
  <div class="gi_page box-map-page">
    <div class="page-header">
      <div>
        <div class="page-title">箱体地图</div>
        <div class="page-subtitle">查看箱体实时位置、满溢状态及设备运行信息</div>
      </div>
      <a-space>
        <a-button type="primary" :loading="cloudLoading" @click="loadFromCloud()">
          <template #icon><icon-sync /></template>
          更新
        </a-button>
        <a-dropdown position="br">
          <a-button>更多<icon-down /></a-button>
          <template #content>
            <a-doption @click="openLogin()">登录</a-doption>
            <a-doption @click="openTokenModal">Token</a-doption>
            <a-doption @click="importVisible = true">导入 JSON</a-doption>
            <a-doption :disabled="!selectedBox" @click="copyLocationLink">复制定位链接</a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>

    <a-card class="filter-card" :bordered="false">
      <div class="filter-block">
        <a-input v-model="keyword" allow-clear placeholder="输入箱体编号或名称" style="width: 240px" @press-enter="focusMatchedBox">
          <template #prefix><icon-search /></template>
        </a-input>
        <a-button :type="overflowOnly ? 'primary' : 'outline'" :status="overflowOnly ? 'danger' : 'normal'" @click="overflowOnly = !overflowOnly">
          {{ overflowOnly ? '已筛选满溢' : '只看满溢' }}
        </a-button>
        <span class="filter-result">{{ keyword.trim() ? `匹配到 ${matchedCount} 个箱体` : `当前显示 ${visibleBoxes.length} 个箱体` }}</span>
      </div>
      <div class="filter-block">
        <span class="filter-label">乡镇</span>
        <button type="button" class="chip" :class="{ active: !townshipFilter }" @click="selectTownship('')">全部</button>
        <button v-for="t in townshipOptions" :key="t" type="button" class="chip" :class="{ active: townshipFilter === t }" @click="selectTownship(t)">{{ t }}</button>
        <button type="button" class="chip unmatched" :class="{ active: townshipFilter === UNMATCHED }" @click="selectTownship(UNMATCHED)">未匹配 {{ unmatchedTownshipCount }}</button>
      </div>
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

    <div v-if="daasAuth.expired" class="token-expired-banner">
      <icon-exclamation-circle-fill />
      <span>接口 Token 已过期或未登录。请</span>
      <a class="token-reset-link" @click="openLogin()">重新登录</a>
      <span>后重试。</span>
    </div>

    <div class="map-layout">
      <div ref="mapFullscreenRef" class="map-card-wrap">
        <a-card class="map-card" :bordered="false">
          <div ref="mapRef" class="amap-container"></div>
          <div class="map-stats">
            <div class="map-stat"><span>箱体总数</span><b>{{ visibleBoxes.length }}</b></div>
            <div class="map-stat danger"><span>满溢预警</span><b>{{ overflowCount }}</b></div>
            <div class="map-stat warning"><span>接近满溢</span><b>{{ nearOverflowCount }}</b></div>
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

        <a-card v-if="selectedBox" class="detail-card" :bordered="false">
          <div class="detail-panel-header">
            <div>
              <span class="box-no">箱体编号</span>
              <h2>{{ selectedBox.containerNo }}</h2>
            </div>
            <a-button type="text" size="mini" class="detail-close-btn" @click="selectedBox = undefined">
              <template #icon><icon-close /></template>
            </a-button>
          </div>
          <div class="detail-scroll">
          <div class="detail-heading">
            <a-tag :color="statusColor(selectedBox)">{{ statusText(selectedBox) }}</a-tag>
            <a-tag v-if="selectedBox.onlineStatus !== 0" color="red">设备离线</a-tag>
            <span class="report-time">上报时间：{{ selectedBox.reportTime }}</span>
          </div>
          <div class="fill-summary" :class="markerTone(selectedBox)">
            <span>垃圾占比</span>
            <strong>{{ formatFillLevel(selectedBox) }}%</strong>
            <div class="fill-track"><i :style="{ width: `${fillLevelPercent(selectedBox)}%` }"></i></div>
          </div>
          <div class="location-summary">
            <span class="section-label">乡镇村庄</span>
            <b>{{ selectedArea.township || '未匹配乡镇' }} · {{ selectedArea.village || '未匹配村庄' }}</b>
            <span class="matched-point">{{ selectedArea.pointName || '未匹配收集点' }}</span>
          </div>
          <div v-if="matchedVehiclePlates.length" class="vehicle-summary">
            <span class="section-label">运输车辆</span>
            <a-tag v-for="vehicle in matchedVehiclePlates" :key="vehicle.name" color="arcoblue">{{ vehicle.name }}</a-tag>
          </div>
          <details class="more-details">
            <summary>更多设备信息</summary>
            <div class="detail-grid">
              <div class="detail-grid-item full"><span>箱体名称</span><b>{{ selectedBox.containerName }}</b></div>
              <div class="detail-grid-item"><span>容量</span><b>{{ selectedBox.capacity }} 吨</b></div>
              <div class="detail-grid-item"><span>温度</span><b>{{ selectedBox.temperature }} ℃</b></div>
              <div class="detail-grid-item"><span>电量</span><b>{{ selectedBox.voltage }}%</b></div>
              <div class="detail-grid-item"><span>开关状态</span><b>{{ selectedBox.switchStatus === '0' ? '关' : '开' }}</b></div>
              <div class="detail-grid-item full"><span>设备号</span><b>{{ selectedBox.deviceNo }}</b></div>
            </div>
            <div class="coordinate-block">
              <span>原始坐标（WGS84）</span><code>{{ selectedBox.longitude }}, {{ selectedBox.latitude }}</code>
              <div class="coordinate-title">
                <span>地图坐标（GCJ-02）</span>
                <a-button size="mini" type="outline" @click="openAmap">高德打开</a-button>
              </div>
              <code>{{ selectedGcj ? `${selectedGcj.lng.toFixed(6)}, ${selectedGcj.lat.toFixed(6)}` : '-' }}</code>
            </div>
            <div class="matched-block">
              <span class="section-label">全部匹配对象</span>
              <a-empty v-if="!matchedObjects.length" description="未匹配" :image-style="{ height: '30px' }" />
              <div v-for="item in matchedObjects" v-else :key="item.name" class="matched-item">
                <b>{{ item.name }}</b><span v-if="item.longitude !== undefined && item.latitude !== undefined">{{ item.longitude }}, {{ item.latitude }}</span>
              </div>
            </div>
          </details>
          </div>
        </a-card>
      </div>
    </div>

    <a-modal v-model:visible="importVisible" title="导入最新箱体数据" :width="680" @before-ok="importBoxes">
      <p class="modal-tip">粘贴接口完整 JSON，格式需包含 <code>data.list</code> 数组（云端格式为 <code>data.points</code>）。导入后仅更新当前页面数据。</p>
      <a-textarea v-model="importText" :auto-size="{ minRows: 12, maxRows: 18 }" placeholder="粘贴完整接口 JSON" />
    </a-modal>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" @ok="saveToken">
      <p class="modal-tip">
        用于调用真实接口 <code>/domestic/waste/containers/sbgMonitoring</code>（<code>size=1000</code> 一次性拉取全部箱体）。
        推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。
      </p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useFullscreen } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'
import { daasAuth, daasRequest, getHiddenBoxIds, setDaasToken } from '@/utils/daas'
import { getCachedBoxes, getCachedPoints, saveCachedBoxes, saveCachedPoints, subscribeBoxesUpdated, subscribePointsUpdated } from './sbg-store'

defineOptions({ name: 'SanitationBoxMap' })

/** 箱体监控真实接口路径（走全局 daas 登录/请求，size=1000 一次性拉取全部） */
const BOX_MONITOR_PATH = '/domestic/waste/containers/sbgMonitoring'
/** 收集点接口：用于给箱体匹配所属乡镇/村庄（townshipName/villageName） */
const COLLECTION_POINTS_PATH = '/domestic/waste/v/collection-points/page'
const COLLECTION_POINTS_QUERY = { keyword: '', organizationId: 506, page: 0, size: 1000 }

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
interface CollectionPoint {
  id: number
  pointName: string
  pointCode: string
  townshipName: string
  villageName: string
  longitude: number
  latitude: number
}
interface MatchedObject {
  name: string
  longitude?: number
  latitude?: number
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
const mapFullscreenRef = ref<HTMLElement | null>(null)
const { isFullscreen: isMapFullscreen, toggle: toggleMapFullscreen } = useFullscreen(mapFullscreenRef, {
  // 进入/退出全屏后地图容器尺寸变化，通知高德地图重算视口
  onFullscreenChange: () => { nextTick(() => map?.resize()) },
})
const keyword = ref('')
const overflowOnly = ref(false)
const mapTheme = ref<MapTheme>('light')
const boxes = ref<Box[]>(initialBoxes)
const points = ref<CollectionPoint[]>([])
const townshipFilter = ref('')
const villageFilter = ref('')
/** 「未匹配」筛选值：无收集点归属（无乡镇/村庄）的箱体专用 sentinel，不会与真实乡镇/村庄名冲突 */
const UNMATCHED = '__unmatched__'
const selectedBox = ref<Box>()
const mapError = ref('')
const cloudLoading = ref(false)
const importVisible = ref(false)
const importText = ref('')
const tokenModalVisible = ref(false)
const tokenInput = ref(daasAuth.token)
let map: AMapInstance | undefined
let markers: AMapMarker[] = []
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let gcjPoints = new WeakMap<Box, GcjPoint>()
const mapThemes: Array<{ label: string, value: MapTheme }> = [
  { label: '标准', value: 'light' },
  { label: '默认', value: 'normal' },
]

function openTokenModal() {
  tokenInput.value = daasAuth.token
  tokenModalVisible.value = true
}
function saveToken() {
  const token = tokenInput.value.trim()
  setDaasToken(token)
  if (token) Message.success('Token 已保存')
  tokenModalVisible.value = false
}
function openLogin() {
  daasAuth.visible = true
}

/** 箱体 -> 所属乡镇/村庄（仅以收集点名称关联，不能使用车辆/箱体编号） */
const boxAreas = new Map<number, { township: string, village: string, pointName: string }>()
function isCollectionPointNameKey(key: string) {
  return !/^\d+$/.test(key) && !/^[\u4E00-\u9FFF][A-Z][A-Z0-9]{5,6}$/.test(key)
}
function isVehiclePlate(value: string) { return /^[\u4E00-\u9FFF][A-Z][A-Z0-9]{5,6}$/.test(value) }

// matchObject 同时含收集点、车辆等对象。只接受非纯数字的收集点名称；
// 不能把 190、164 等车辆标识按收集点 ID/编码关联。
function assignBoxAreas(boxList: Box[], pointList: CollectionPoint[]) {
  boxAreas.clear()
  for (const box of boxList) {
    try {
      const keys = Object.keys(JSON.parse(box.matchObject || '{}'))
      const candidates = pointList.filter((point) => keys.some((key) =>
        isCollectionPointNameKey(key) && point.pointName === key,
      ))
      // 多个收集点命中时按坐标最近者确定归属，不依赖 JSON 键顺序。
      const hit = candidates.reduce<CollectionPoint | undefined>((nearest, point) => {
        if (!nearest) return point
        const distance = (point.longitude - box.longitude) ** 2 + (point.latitude - box.latitude) ** 2
        const nearestDistance = (nearest.longitude - box.longitude) ** 2 + (nearest.latitude - box.latitude) ** 2
        return distance < nearestDistance ? point : nearest
      }, undefined)
      if (hit) boxAreas.set(box.id, { township: hit.townshipName, village: hit.villageName || '', pointName: hit.pointName })
    } catch { /* 忽略 */ }
  }
}

const townshipOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    const a = boxAreas.get(b.id)
    if (a?.township) s.add(a.township)
  }
  return Array.from(s).sort()
})
const villageOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    const a = boxAreas.get(b.id)
    if (!a?.village) continue
    if (townshipFilter.value && a.township !== townshipFilter.value) continue
    s.add(a.village)
  }
  return Array.from(s).sort()
})
/** 村庄 chips 折叠：默认只显示前 N 个（约两行），点击「更多」展开 */
const VILLAGE_COLLAPSED = 24
const villageCollapsed = ref(true)
const visibleVillageOptions = computed(() => {
  const list = villageCollapsed.value ? villageOptions.value.slice(0, VILLAGE_COLLAPSED) : villageOptions.value
  // 保证当前选中的村庄始终可见（即使超出折叠数量）
  if (villageFilter.value && villageFilter.value !== UNMATCHED && !list.includes(villageFilter.value) && villageOptions.value.includes(villageFilter.value)) {
    return [...list, villageFilter.value]
  }
  return list
})
function selectTownship(val: string) {
  townshipFilter.value = val
  villageFilter.value = ''
}

/** 「未匹配」箱体数量：乡镇=无乡镇归属；村庄=无村庄归属（跟随乡镇筛选级联，同 villageOptions） */
const unmatchedTownshipCount = computed(() => boxes.value.filter((b) => !boxAreas.get(b.id)?.township).length)
const unmatchedVillageCount = computed(() => boxes.value.filter((b) => {
  if (boxAreas.get(b.id)?.village) return false
  if (townshipFilter.value && townshipFilter.value !== UNMATCHED) return false
  return true
}).length)
function matchTownship(box: Box) {
  if (!townshipFilter.value) return true
  const township = boxAreas.get(box.id)?.township
  if (townshipFilter.value === UNMATCHED) return !township
  return township === townshipFilter.value
}
function matchVillage(box: Box) {
  if (!villageFilter.value) return true
  const village = boxAreas.get(box.id)?.village
  if (villageFilter.value === UNMATCHED) return !village
  return village === villageFilter.value
}

const visibleBoxes = computed(() => {
  const hidden = getHiddenBoxIds()
  return boxes.value.filter((box) => Number.isFinite(box.longitude) && Number.isFinite(box.latitude)
    && !hidden.has(box.id)
    && (!overflowOnly.value || box.overflowStatus === 1)
    && matchTownship(box)
    && matchVillage(box))
})
// 汇总卡片与地图保持同一筛选范围；橙色箱体沿用既有判定：非满溢且垃圾占比 >= 70%。
const overflowCount = computed(() => visibleBoxes.value.filter((box) => box.overflowStatus === 1).length)
const nearOverflowCount = computed(() => visibleBoxes.value.filter((box) => box.overflowStatus !== 1 && box.fillLevel >= 70).length)
const matchedBoxes = computed<Set<Box> | null>(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return null
  return new Set(boxes.value.filter((box) => box.containerNo.toLowerCase().includes(query) || box.containerName.toLowerCase().includes(query)))
})
const matchedCount = computed(() => matchedBoxes.value?.size ?? 0)
const selectedGcj = computed(() => selectedBox.value ? getGcjPoint(selectedBox.value) : undefined)
const selectedArea = computed(() => selectedBox.value ? (boxAreas.get(selectedBox.value.id) || { township: '', village: '', pointName: '' }) : { township: '', village: '', pointName: '' })
const matchedObjects = computed<MatchedObject[]>(() => {
  if (!selectedBox.value?.matchObject) return []
  try {
    return Object.entries(JSON.parse(selectedBox.value.matchObject) as Record<string, { longitude?: number, latitude?: number }>)
      .map(([name, point]) => ({ name, ...point }))
  } catch { return [] }
})
const matchedVehiclePlates = computed(() => matchedObjects.value.filter((item) => isVehiclePlate(item.name)))

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
function markerClass(box: Box) {
  const classes = ['box-map-marker', markerTone(box)]
  if (box === selectedBox.value) classes.push('selected')
  if (matchedBoxes.value?.has(box)) classes.push('matched')
  return classes.filter(Boolean).join(' ')
}
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
function drawMarkers(fit = true) {
  if (!map || !amap) return
  markers.forEach((marker) => marker.setMap(null)); markers = []
  markers = visibleBoxes.value.map((box, index) => {
    const point = getGcjPoint(box)
    const marker = new amap.Marker({ position: [point.lng, point.lat], offset: new amap.Pixel(-18, -34), content: `<div class="${markerClass(box)}">${escapeHtml(box.containerNo)}</div>`, title: box.containerName, zIndex: box === selectedBox.value ? 1000 : 10 + index })
    marker.on('click', () => selectBox(box))
    marker.setMap(map!)
    return marker
  })
  if (fit && markers.length) map.setFitView(markers, false, [60, 60, 60, 360])
  if (selectedBox.value && !visibleBoxes.value.includes(selectedBox.value)) selectedBox.value = undefined
}

function selectBox(box: Box) {
  selectedBox.value = box
  drawMarkers(false)
  const point = getGcjPoint(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 16), [point.lng, point.lat])
}
function focusMatchedBox() {
  const matched = matchedBoxes.value
  if (!matched || matched.size === 0) return
  if (matched.size > 1) { Message.info(`匹配到 ${matched.size} 个箱体，请输入更精确的编号`); return }
  selectBox([...matched][0])
}
function statusText(box: Box) { return box.overflowStatus === 1 ? '满溢' : box.fillLevel >= 70 ? '接近满溢' : '正常' }
function statusColor(box: Box) { return box.overflowStatus === 1 ? 'red' : box.fillLevel >= 70 ? 'orange' : 'green' }
function fillLevelPercent(box: Box) { return Math.min(100, Math.max(0, box.fillLevel)) }
function formatFillLevel(box: Box) { return Math.round(box.fillLevel) }
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
    if (points.value.length) assignBoxAreas(boxes.value, points.value)
    Message.success(`已导入 ${list.length} 个箱体`)
    return true
  } catch { Message.error('JSON 格式不正确：需要包含 data.list 数组'); return false }
}

watch(keyword, () => drawMarkers(false))
watch([overflowOnly, townshipFilter, villageFilter], drawMarkers)
watch(boxes, drawMarkers)
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
async function loadFromCloud(silent = false) {
  cloudLoading.value = true
  let ok = false
  let boxList: Box[] | undefined
  try {
    const data = await daasRequest<{ list: Box[] }>(BOX_MONITOR_PATH, { body: { current: 1, size: 1000 } })
    if (Array.isArray(data?.list)) { boxList = data.list; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  try {
    const data = await daasRequest<{ list: CollectionPoint[] }>(COLLECTION_POINTS_PATH, { method: 'GET', query: COLLECTION_POINTS_QUERY })
    if (Array.isArray(data?.list)) { points.value = data.list; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  // 先分配箱体归属，再赋值 boxes（避免渲染时 boxAreas 为空导致筛选选项缓存为空）
  if (boxList?.length && points.value.length) assignBoxAreas(boxList, points.value)
  if (boxList) { boxes.value = boxList; gcjPoints = new WeakMap<Box, GcjPoint>(); selectedBox.value = undefined; saveCachedBoxes(boxList) }
  if (points.value.length) saveCachedPoints(points.value)
  cloudLoading.value = false
  if (ok) { if (!silent) Message.success(`已从云端更新 ${boxes.value.length} 个箱体`) }
  else if (!silent) Message.warning('云端数据加载失败，请检查网络或稍后重试')
}
let offBoxes: () => void
let offPoints: () => void
onMounted(async () => {
  // 先读共享缓存（其它页面已更新的数据），再静默刷新云端
  const cachedBoxes = getCachedBoxes<Box>()
  const cachedPoints = getCachedPoints<CollectionPoint>()
  if (cachedBoxes.length || cachedPoints.length) {
    if (cachedBoxes.length) boxes.value = cachedBoxes
    if (cachedPoints.length) { points.value = cachedPoints; assignBoxAreas(boxes.value, points.value) }
  }
  // 其它页面更新数据时，本页同步刷新
  offBoxes = subscribeBoxesUpdated((list) => {
    if (Array.isArray(list) && list.length) { boxes.value = list as Box[]; gcjPoints = new WeakMap<Box, GcjPoint>(); if (points.value.length) assignBoxAreas(boxes.value, points.value); selectedBox.value = undefined }
  })
  offPoints = subscribePointsUpdated((list) => {
    if (Array.isArray(list) && list.length) { points.value = list as CollectionPoint[]; assignBoxAreas(boxes.value, points.value) }
  })
  if (!mapRef.value) return
  try {
    amap = await loadAmapJsApi()
    map = new amap.Map(mapRef.value, { zoom: 13, center: [114.1, 36.04], viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true, animateEnable: false, jogEnable: false })
    drawMarkers()
    loadFromCloud(true)
  } catch (error) { mapError.value = error instanceof Error ? error.message : '高德地图加载失败，请检查地图配置' }
})
onBeforeUnmount(() => { offBoxes?.(); offPoints?.(); markers.forEach((marker) => marker.setMap(null)); map?.destroy() })
</script>

<style scoped lang="scss">
.box-map-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle, .filter-result { color: #86909c; font-size: 13px; }
.filter-card :deep(.arco-card-body) { padding: 14px 16px; }
.filter-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.filter-block:last-child { margin-bottom: 0; }
.filter-label { color: #4e5969; font-size: 13px; white-space: nowrap; }
.chip { padding: 2px 13px; border: 1px solid #e5e6eb; border-radius: 14px; background: #fff; color: #4e5969; font-size: 13px; line-height: 22px; cursor: pointer; transition: all .15s; }
.chip:hover { border-color: #165dff; color: #165dff; }
.chip.active { background: #165dff; border-color: #165dff; color: #fff; }
.chip.unmatched { border-style: dashed; color: #86909c; }
.chip.unmatched:hover { border-color: #86909c; color: #4e5969; }
.chip.unmatched.active { background: #4e5969; border-color: #4e5969; color: #fff; }
.chip-more { border-style: dashed; color: #165dff; }.chip-more:hover { border-color: #165dff; color: #165dff; }
.map-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); overflow: hidden; }
.map-card-wrap { position: relative; min-height: 0; overflow: hidden; display: flex; }.map-card-wrap .map-card { flex: 1; min-height: 0; }.map-card-wrap:fullscreen { position: fixed; inset: 0; z-index: 1001; background: #f2f3f5; }
.map-card { min-height: 0; overflow: hidden; }
.map-card :deep(.arco-card-body) { height: 100%; padding: 0; }
.detail-card { position: absolute; top: 16px; right: 16px; z-index: 2; width: 304px; max-height: calc(100% - 32px); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 24px rgb(29 33 41 / 18%); }
.detail-card :deep(.arco-card-body) { min-height: 0; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.detail-panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 16px 14px 12px; border-bottom: 1px solid #f2f3f5; }.detail-panel-header h2 { margin: 1px 0 0; color: #1d2129; font-size: 28px; line-height: 34px; }
.detail-card .detail-scroll { flex: 1; min-height: 0; padding: 14px; overflow-y: auto; }
.amap-container { width: 100%; height: 100%; background: #f2f3f5; }
.map-stats { position: absolute; top: 16px; left: 16px; display: flex; gap: 8px; z-index: 1; }
.map-controls { position: absolute; z-index: 1; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; }
.map-theme-picker { height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 9px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-theme-picker :deep(.arco-select) { width: 88px; }
.map-fullscreen-btn { height: 32px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; }.map-fullscreen-btn.active { color: #165dff; border-color: #165dff; }
.map-stat { min-width: 82px; padding: 7px 8px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; white-space: nowrap; }
.map-stat b { display: block; color: #165dff; font-size: 20px; line-height: 25px; }.map-stat.danger b { color: #f53f3f; }.map-stat.warning b { color: #ff7d00; }
.map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: #f53f3f; background: #f7f8fa; }
.detail-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }.box-no, .section-label { color: #86909c; font-size: 12px; }.report-time { flex-basis: 100%; overflow: hidden; color: #86909c; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
.detail-card :deep(.arco-card-header) { align-items: center; }.detail-close-btn { color: #86909c; }.detail-close-btn:hover { color: #1d2129; }
.fill-summary { padding: 12px; border-radius: 6px; background: #f2f3f5; }.fill-summary > span { color: #4e5969; font-size: 13px; }.fill-summary strong { display: block; margin: 2px 0 9px; color: #165dff; font-size: 28px; line-height: 34px; }.fill-summary.warning strong { color: #ff7d00; }.fill-summary.overflow strong { color: #f53f3f; }.fill-track { height: 6px; overflow: hidden; border-radius: 3px; background: #e5e6eb; }.fill-track i { display: block; height: 100%; border-radius: inherit; background: #165dff; }.fill-summary.warning .fill-track i { background: #ff7d00; }.fill-summary.overflow .fill-track i { background: #f53f3f; }
.location-summary { display: grid; gap: 5px; padding: 16px 0 12px; }.location-summary b { color: #1d2129; font-size: 14px; }.matched-point { color: #4e5969; font-size: 13px; }.vehicle-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 0 0 16px; }.vehicle-summary .section-label { flex-basis: 100%; }.more-details { border-top: 1px solid #f2f3f5; }.more-details summary { padding: 12px 0; color: #4e5969; font-size: 13px; cursor: pointer; }.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }.detail-grid-item { display: grid; gap: 3px; min-width: 0; }.detail-grid-item.full { grid-column: 1 / -1; }.detail-grid-item span { color: #86909c; font-size: 12px; white-space: nowrap; }.detail-grid-item b { overflow: hidden; color: #4e5969; font-size: 13px; font-weight: 500; white-space: nowrap; text-overflow: ellipsis; }.coordinate-block { display: grid; gap: 5px; margin: 12px 0; }.coordinate-block span { color: #86909c; font-size: 12px; }.coordinate-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.coordinate-title :deep(.arco-btn) { flex-shrink: 0; }.coordinate-block code { margin-bottom: 4px; padding: 6px; overflow-wrap: anywhere; border-radius: 3px; background: #f7f8fa; color: #4e5969; font-size: 11px; }.matched-block { display: grid; gap: 6px; padding-top: 4px; }.matched-item { display: grid; gap: 2px; padding: 8px 0; border-bottom: 1px solid #f2f3f5; }.matched-item b { color: #4e5969; font-size: 13px; }.matched-item span { color: #86909c; font-size: 11px; }
.modal-tip { margin-top: 0; color: #4e5969; }.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
.token-expired-banner { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1px solid #fbaca3; border-radius: 4px; background: #ffece8; color: #f53f3f; font-size: 13px; }
.token-reset-link { color: #165dff; cursor: pointer; text-decoration: underline; }
:global(.box-map-marker) { position: relative; min-width: 36px; height: 26px; padding: 0 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 12px; font-weight: 600; }
:global(.box-map-marker::after) { content: ''; position: absolute; bottom: -6px; left: 50%; width: 10px; height: 10px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }.box-map-page :global(.box-map-marker.warning) { background: #ff7d00; }.box-map-page :global(.box-map-marker.overflow) { background: #f53f3f; }.box-map-page :global(.box-map-marker.matched) { box-shadow: 0 0 0 3px #00b42a, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.1); z-index: 1; }.box-map-page :global(.box-map-marker.selected) { border: 2px solid #fff; box-shadow: 0 0 0 3px #165dff, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.15); opacity: 1; z-index: 2; }
@media (max-width: 960px) { .detail-card { top: auto; right: 10px; bottom: 10px; left: 10px; width: auto; max-height: 58%; }.page-header { align-items: flex-start; gap: 12px; flex-direction: column; } }
</style>

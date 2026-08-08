<template>
  <div class="gi_page box-point-map-page">
    <div class="page-header">
      <div>
        <div class="page-title">箱体收集点地图</div>
        <div class="page-subtitle">箱体与收集点同图展示，支持一键导入最新 JSON 数据</div>
      </div>
      <a-space>
        <a-tag :color="tokenStatusColor">{{ tokenStatusText }}</a-tag>
        <a-button type="primary" @click="openLogin()">登录</a-button>
        <a-button @click="openTokenModal">Token</a-button>
        <a-button :loading="cloudLoading" @click="loadFromCloud()">从云端更新</a-button>
        <a-button @click="importVisible = true">导入最新 JSON</a-button>
        <a-button :disabled="!selected" @click="copyLocationLink">复制定位链接</a-button>
      </a-space>
    </div>

    <a-card class="filter-card" :bordered="false">
      <div class="filter-block">
        <a-input v-model="keyword" allow-clear placeholder="输入箱体编号、收集点名称、乡镇或村庄" style="width: 320px">
          <template #prefix><icon-search /></template>
        </a-input>
      </div>
      <div class="filter-block">
        <span class="filter-label">乡镇</span>
        <button type="button" class="chip" :class="{ active: isAllSelected }" @click="toggleAllTownships">全部</button>
        <button v-for="name in allTownships" :key="name" type="button" class="chip" :class="{ active: selectedTownships.has(name) }" @click="toggleTownship(name)">{{ name }}</button>
      </div>
      <div class="filter-block">
        <span class="filter-label">箱体</span>
        <a-switch v-model="showBoxes" size="small" />
        <div class="seg" :class="{ disabled: !showBoxes }">
          <button type="button" class="seg-btn" :class="{ active: overflowFilter === 'all' }" @click="overflowFilter = 'all'">全部</button>
          <button type="button" class="seg-btn danger" :class="{ active: overflowFilter === 'overflow' }" @click="overflowFilter = 'overflow'">只看满溢</button>
        </div>
      </div>
      <div class="filter-block">
        <span class="filter-label">收集点</span>
        <a-switch v-model="showPoints" size="small" />
        <div class="seg" :class="{ disabled: !showPoints }">
          <button type="button" class="seg-btn" :class="{ active: multiFilter === 'all' }" @click="multiFilter = 'all'">全部</button>
          <button type="button" class="seg-btn warning" :class="{ active: multiFilter === 'multi' }" @click="multiFilter = 'multi'">只看多箱点</button>
        </div>
        <span class="filter-result">当前显示 {{ visiblePoints.length }} 收集点 / {{ visibleBoxes.length }} 箱体</span>
      </div>
    </a-card>

    <div v-if="daasAuth.expired" class="token-expired-banner">
      <icon-exclamation-circle-fill />
      <span>接口 Token 已过期或未登录。请</span>
      <a class="token-reset-link" @click="openLogin()">重新登录</a>
      <span>后重试。</span>
    </div>

    <div class="map-layout" :class="{ 'has-detail': selected }">
      <a-card class="map-card" :bordered="false">
        <div ref="mapRef" class="amap-container"></div>
        <div class="map-stats">
          <div class="map-stat"><span>收集点</span><b>{{ visiblePoints.length }}</b></div>
          <div class="map-stat"><span>箱体</span><b>{{ visibleBoxes.length }}</b></div>
          <div class="map-stat danger"><span>满溢预警</span><b>{{ overflowCount }}</b></div>
        </div>
        <div class="map-legend">
          <span><i class="legend-dot point"></i>收集点</span>
          <span><i class="legend-dot box"></i>箱体</span>
          <span><i class="legend-dot overflow"></i>满溢</span>
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

      <a-card v-if="selected" class="detail-card" :bordered="false" title="对象详情">
        <template #extra>
          <a-button type="text" size="mini" class="detail-close-btn" @click="clearSelection">
            <template #icon><icon-close /></template>
          </a-button>
        </template>

        <div class="detail-scroll">
        <!-- 箱体详情 -->
        <template v-if="selectedBox">
          <div class="detail-heading">
            <div>
              <span class="obj-no"><a-tag size="small" color="arcoblue">箱体</a-tag> 箱体编号 {{ selectedBox.containerNo }}</span>
              <h3>{{ selectedBox.containerName }}</h3>
            </div>
            <a-tag :color="boxStatusColor(selectedBox)">{{ boxStatusText(selectedBox) }}</a-tag>
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
        </template>

        <!-- 收集点详情 -->
        <template v-else-if="selectedPoint">
          <div class="detail-heading">
            <div>
              <span class="obj-no"><a-tag size="small" color="green">收集点</a-tag> {{ selectedPoint.townshipName }} · {{ selectedPoint.villageName }}</span>
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
        </template>

        <div class="coordinate-block">
          <span>原始坐标（WGS84）</span><code>{{ selectedBox ? `${selectedBox.longitude}, ${selectedBox.latitude}` : selectedPoint ? `${selectedPoint.longitude}, ${selectedPoint.latitude}` : '-' }}</code>
          <span>地图坐标（GCJ-02）</span><code>{{ selectedGcj ? `${selectedGcj.lng.toFixed(6)}, ${selectedGcj.lat.toFixed(6)}` : '-' }}</code>
        </div>
        </div>
        <div class="detail-actions">
          <a-button type="primary" long @click="openAmap">在高德地图中打开</a-button>
        </div>
      </a-card>
    </div>

    <a-modal v-model:visible="importVisible" title="导入最新箱体与收集点数据" :width="680" @before-ok="importData">
      <p class="modal-tip">粘贴接口完整 JSON，格式需包含 <code>data.boxes</code>（箱体）与 <code>data.points</code>（收集点）数组，可只传其一。</p>
      <a-textarea v-model="importText" :auto-size="{ minRows: 12, maxRows: 18 }" placeholder='{"code":200,"data":{"boxes":[...],"points":[...]}}' />
    </a-modal>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" @ok="saveToken">
      <p class="modal-tip">推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。</p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type AMapCircle, type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'
import { daasAuth, daasRequest, getHiddenBoxIds, getHiddenPointIds, setDaasToken } from '@/utils/daas'

defineOptions({ name: 'SanitationBoxPointMap' })

/** 真实接口（走全局 daas 登录/请求），size=1000 一次性拉取全部 */
const BOX_MONITOR_PATH = '/domestic/waste/containers/sbgMonitoring'
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

const initialBoxes: Box[] = [
  { id: 48, deviceNo: '13820260721000000026', containerNo: '132', containerName: '小勾臂箱132号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 0, capacity: 1.5, longitude: 114.242817, latitude: 36.069452, reportTime: '2026-08-06 18:56:04', temperature: 34.37, voltage: 40, switchStatus: '0' },
  { id: 34, deviceNo: '13820260721000000121', containerNo: '148', containerName: '小勾臂箱148号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 60.8, capacity: 1.5, longitude: 114.045902, latitude: 36.039724, reportTime: '2026-08-06 18:56:03', temperature: 30, voltage: 80, switchStatus: '0' },
  { id: 65, deviceNo: '13820260721000000031', containerNo: '274', containerName: '小勾臂箱274号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 69.87, capacity: 1.5, longitude: 114.038736, latitude: 35.995271, reportTime: '2026-08-06 18:56:03', temperature: 31.31, voltage: 80, switchStatus: '0' },
  { id: 76, deviceNo: '13820260721000000070', containerNo: '176', containerName: '小勾臂箱176号设备', onlineStatus: 0, overflowStatus: 1, matchObject: '', fillLevel: 75.6, capacity: 1.5, longitude: 114.026696, latitude: 36.055253, reportTime: '2026-08-06 18:56:03', temperature: 30.68, voltage: 70, switchStatus: '0' },
  { id: 47, deviceNo: '13820260721000000028', containerNo: '143', containerName: '小勾臂箱143号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 57.6, capacity: 1.5, longitude: 114.023128, latitude: 36.056029, reportTime: '2026-08-06 18:56:03', temperature: 30.81, voltage: 80, switchStatus: '0' },
  { id: 70, deviceNo: '13820260721000000010', containerNo: '285', containerName: '小勾臂箱285号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 0, capacity: 1.5, longitude: 114.242581, latitude: 36.069468, reportTime: '2026-08-06 18:56:03', temperature: 33.37, voltage: 40, switchStatus: '0' },
]

const initialPoints: CollectionPoint[] = [
  { id: 96, pointName: '马家乡岭头', pointCode: '', townshipId: 8, townshipName: '马家乡', villageId: 152, villageName: '岭头村', pointType: null, containerCount: 1, longitude: 114.045606, latitude: 35.992369, serviceRadius: 100, address: '河南省安阳市龙安区马家乡横岭三仓线洹河峡谷风景区', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-06 16:05:13', updateTime: '2026-08-06 18:59:13' },
  { id: 88, pointName: '龙泉镇龙泉村', pointCode: '', townshipId: 4, townshipName: '龙泉镇', villageId: 18, villageName: '龙泉村', pointType: null, containerCount: 1, longitude: 114.185836, latitude: 36.063542, serviceRadius: 100, address: '河南省安阳市龙安区龙泉镇011县道', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-05 12:08:08', updateTime: '2026-08-06 11:33:10' },
  { id: 86, pointName: '龙泉吴家洞', pointCode: '', townshipId: 4, townshipName: '龙泉镇', villageId: 21, villageName: '吴家洞', pointType: null, containerCount: 1, longitude: 114.168431, latitude: 36.050852, serviceRadius: 100, address: '河南省安阳市龙安区龙泉镇安阳市龙泉农家乐服务管理中心', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-04 19:36:53', updateTime: '2026-08-06 11:33:01' },
  { id: 78, pointName: '善应三仓', pointCode: '', townshipId: 6, townshipName: '善应镇', villageId: 95, villageName: '三仓', pointType: null, containerCount: 1, longitude: 114.084759, latitude: 35.990363, serviceRadius: 100, address: '河南省安阳市龙安区善应镇028乡道', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-03 19:38:06', updateTime: '2026-08-06 11:32:29' },
  { id: 71, pointName: '马家乡马家', pointCode: '', townshipId: 8, townshipName: '马家乡', villageId: 149, villageName: '马家村', pointType: null, containerCount: 1, longitude: 114.030897, latitude: 36.037917, serviceRadius: 100, address: '河南省安阳市龙安区马家乡036乡道马家村民委员会', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-03 10:32:18', updateTime: null },
  { id: 55, pointName: '善应大平', pointCode: '', townshipId: 6, townshipName: '善应镇', villageId: 96, villageName: '大平', pointType: null, containerCount: 2, longitude: 114.080538, latitude: 35.997015, serviceRadius: 100, address: '河南省安阳市龙安区善应镇028乡道', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-08-01 09:31:31', updateTime: '2026-08-01 09:48:07' },
  { id: 52, pointName: '东风申家岗3', pointCode: '', townshipId: 7, townshipName: '东风乡', villageId: 128, villageName: '申家岗', pointType: null, containerCount: 1, longitude: 114.263076, latitude: 36.09231, serviceRadius: 100, address: '河南省安阳市龙安区东风乡申家岗瓷砖批发', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-07-27 10:28:40', updateTime: '2026-07-27 10:19:53' },
  { id: 1, pointName: '善应黑玉村', pointCode: '', townshipId: 6, townshipName: '善应镇', villageId: 104, villageName: '黑玉', pointType: null, containerCount: 2, longitude: 114.109719, latitude: 36.041684, serviceRadius: 100, address: '河南省安阳市龙安区善应镇装货口', status: 1, remark: '', responsiblePerson: null, contactPhone: null, organizationId: 506, isDeleted: 0, createTime: '2026-07-14 15:56:36', updateTime: '2026-07-16 13:17:31' },
]

const mapRef = ref<HTMLDivElement>()
const keyword = ref('')
const mapTheme = ref<MapTheme>('light')
const boxes = ref<Box[]>(initialBoxes)
const points = ref<CollectionPoint[]>(initialPoints)
const selectedBox = ref<Box>()
const selectedPoint = ref<CollectionPoint>()
const mapError = ref('')
const cloudLoading = ref(false)
const importVisible = ref(false)
const importText = ref('')
const tokenModalVisible = ref(false)
const tokenInput = ref(daasAuth.token)

const tokenStatusText = computed(() => {
  if (!daasAuth.token) return daasAuth.expired ? 'Token 已过期' : 'Token 未配置'
  return daasAuth.expired ? 'Token 已过期' : 'Token 已配置'
})
const tokenStatusColor = computed(() => (daasAuth.expired ? 'red' : daasAuth.token ? 'green' : 'gray'))
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
let map: AMapInstance | undefined
let boxMarkers: AMapMarker[] = []
let pointMarkers: AMapMarker[] = []
let pointRadiusCircles: AMapCircle[] = []
let selectedRadiusLabel: AMapMarker | undefined
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let boxGcjPoints = new WeakMap<Box, GcjPoint>()
let pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>()
const mapThemes: Array<{ label: string, value: MapTheme }> = [
  { label: '标准', value: 'light' },
  { label: '默认', value: 'normal' },
]

const selected = computed(() => selectedBox.value || selectedPoint.value)
const selectedGcj = computed(() => {
  if (selectedBox.value) return getBoxGcj(selectedBox.value)
  if (selectedPoint.value) return getPointGcj(selectedPoint.value)
  return undefined
})
const allTownships = computed(() => Array.from(new Set(points.value.map((p) => p.townshipName).filter(Boolean))).sort())
const townshipTouched = ref(false)
const selectedTownships = ref<Set<string>>(new Set())
const isAllSelected = computed(() => allTownships.value.length > 0 && allTownships.value.every((t) => selectedTownships.value.has(t)))
// 默认全部勾选：乡镇列表变化（如加载真实数据后）且用户未手动筛选时，自动补全新出现的乡镇
watch(allTownships, (towns) => {
  if (!townshipTouched.value) selectedTownships.value = new Set(towns)
}, { immediate: true })
function toggleTownship(name: string) {
  townshipTouched.value = true
  const next = new Set(selectedTownships.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  selectedTownships.value = next
}
function toggleAllTownships() {
  townshipTouched.value = true
  selectedTownships.value = isAllSelected.value ? new Set() : new Set(allTownships.value)
}
const showBoxes = ref(true)
const showPoints = ref(true)
const multiFilter = ref<'all' | 'multi'>('all')
const overflowFilter = ref<'all' | 'overflow'>('all')
const visiblePoints = computed(() => {
  if (!showPoints.value) return []
  const hidden = getHiddenPointIds()
  const query = keyword.value.trim().toLowerCase()
  return points.value.filter((p) => Number.isFinite(p.longitude) && Number.isFinite(p.latitude)
    && !hidden.has(p.id)
    && selectedTownships.value.has(p.townshipName)
    && (multiFilter.value === 'all' || p.containerCount >= 2)
    && (!query || p.pointName.toLowerCase().includes(query) || p.townshipName.toLowerCase().includes(query)
      || p.villageName.toLowerCase().includes(query) || p.address.toLowerCase().includes(query)))
})
const visibleBoxes = computed(() => {
  if (!showBoxes.value) return []
  const hidden = getHiddenBoxIds()
  const query = keyword.value.trim().toLowerCase()
  return boxes.value.filter((b) => Number.isFinite(b.longitude) && Number.isFinite(b.latitude)
    && !hidden.has(b.id)
    && (overflowFilter.value === 'all' || b.overflowStatus === 1)
    && (!query || b.containerNo.toLowerCase().includes(query) || b.containerName.toLowerCase().includes(query)))
})
const overflowCount = computed(() => visibleBoxes.value.filter((b) => b.overflowStatus === 1).length)

function toGcj(lng: number, lat: number): GcjPoint {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35)
  const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}
function getBoxGcj(box: Box) {
  const cached = boxGcjPoints.get(box)
  if (cached) return cached
  const gcj = toGcj(box.longitude, box.latitude)
  boxGcjPoints.set(box, gcj)
  return gcj
}
function getPointGcj(point: CollectionPoint) {
  const cached = pointGcjPoints.get(point)
  if (cached) return cached
  const gcj = toGcj(point.longitude, point.latitude)
  pointGcjPoints.set(point, gcj)
  return gcj
}
function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}
function boxTone(box: Box) { return box.overflowStatus === 1 ? 'overflow' : box.fillLevel >= 70 ? 'warning' : '' }
function pointTone(point: CollectionPoint) { return point.containerCount >= 2 ? 'multi' : '' }
function boxStatusText(box: Box) { return box.overflowStatus === 1 ? '满溢' : box.fillLevel >= 70 ? '接近满溢' : '正常' }
function boxStatusColor(box: Box) { return box.overflowStatus === 1 ? 'red' : box.fillLevel >= 70 ? 'orange' : 'green' }

function drawMarkers() {
  if (!map || !amap) return
  boxMarkers.forEach((m) => m.setMap(null)); boxMarkers = []
  pointMarkers.forEach((m) => m.setMap(null)); pointMarkers = []
  pointRadiusCircles.forEach((c) => c.setMap(null)); pointRadiusCircles = []
  // 收集点：圆形标记 + 服务半径圈
  visiblePoints.value.forEach((point) => {
    const gcj = getPointGcj(point)
    const marker = new amap.Marker({ position: [gcj.lng, gcj.lat], offset: new amap.Pixel(-16, -16), content: `<div class="point-map-marker ${pointTone(point)}">${escapeHtml(point.containerCount)}</div>`, title: point.pointName })
    marker.on('click', () => selectPoint(point))
    marker.setMap(map!)
    pointMarkers.push(marker)
    const radius = point.serviceRadius || 100
    const circle = new amap.Circle({ center: new amap.LngLat(gcj.lng, gcj.lat), radius, strokeColor: '#165dff', strokeOpacity: 0.55, strokeWeight: 1.5, strokeStyle: 'dashed', fillColor: '#165dff', fillOpacity: 0.07 })
    circle.setMap(map!)
    pointRadiusCircles.push(circle)
  })
  // 箱体：图钉标记
  visibleBoxes.value.forEach((box) => {
    const gcj = getBoxGcj(box)
    const marker = new amap.Marker({ position: [gcj.lng, gcj.lat], offset: new amap.Pixel(-18, -34), content: `<div class="box-map-marker ${boxTone(box)}">${escapeHtml(box.containerNo)}</div>`, title: box.containerName })
    marker.on('click', () => selectBox(box))
    marker.setMap(map!)
    boxMarkers.push(marker)
  })
  const allMarkers = [...pointMarkers, ...boxMarkers]
  if (allMarkers.length) map.setFitView(allMarkers, false, [60, 60, 60, 360])
  if (selectedBox.value && !visibleBoxes.value.includes(selectedBox.value)) selectedBox.value = undefined
  if (selectedPoint.value && !visiblePoints.value.includes(selectedPoint.value)) selectedPoint.value = undefined
  drawSelectedRadiusLabel()
}

function clearSelectedRadiusLabel() {
  if (selectedRadiusLabel) { selectedRadiusLabel.setMap(null); selectedRadiusLabel = undefined }
}
function drawSelectedRadiusLabel() {
  clearSelectedRadiusLabel()
  const point = selectedPoint.value
  if (!point || !map || !amap) return
  const gcj = getPointGcj(point)
  const radius = point.serviceRadius || 100
  selectedRadiusLabel = new amap.Marker({
    position: [gcj.lng, gcj.lat + radius / 111320],
    content: `<div class="point-radius-label">${escapeHtml(radius)}m</div>`,
    offset: new amap.Pixel(-30, -18),
  })
  selectedRadiusLabel.setMap(map)
}

function selectBox(box: Box) {
  selectedBox.value = box
  selectedPoint.value = undefined
  const gcj = getBoxGcj(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 16), [gcj.lng, gcj.lat])
}
function selectPoint(point: CollectionPoint) {
  selectedPoint.value = point
  selectedBox.value = undefined
  const gcj = getPointGcj(point)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 15), [gcj.lng, gcj.lat])
}
function clearSelection() {
  selectedBox.value = undefined
  selectedPoint.value = undefined
}
function locationUrl() {
  if (selectedBox.value) {
    const box = selectedBox.value
    const gcj = getBoxGcj(box)
    return `https://uri.amap.com/marker?position=${gcj.lng.toFixed(6)},${gcj.lat.toFixed(6)}&name=${encodeURIComponent(box.containerName)}&coordinate=gaode&callnative=1`
  }
  if (selectedPoint.value) {
    const point = selectedPoint.value
    const gcj = getPointGcj(point)
    return `https://uri.amap.com/marker?position=${gcj.lng.toFixed(6)},${gcj.lat.toFixed(6)}&name=${encodeURIComponent(point.pointName)}&coordinate=gaode&callnative=1`
  }
  return ''
}
async function copyLocationLink() {
  const url = locationUrl(); if (!url) return
  try { await navigator.clipboard.writeText(url); Message.success('高德定位链接已复制') } catch { window.prompt('复制此链接发送给客户：', url) }
}
function openAmap() { const url = locationUrl(); if (url) window.open(url, '_blank', 'noopener') }
function importData() {
  try {
    const data = JSON.parse(importText.value)?.data
    const boxList = Array.isArray(data?.boxes) ? data.boxes : undefined
    const pointList = Array.isArray(data?.points) ? data.points : undefined
    if (boxList === undefined && pointList === undefined) throw new Error()
    if (boxList !== undefined) { boxes.value = boxList as Box[]; boxGcjPoints = new WeakMap<Box, GcjPoint>() }
    if (pointList !== undefined) { points.value = pointList as CollectionPoint[]; pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>() }
    selectedBox.value = undefined; selectedPoint.value = undefined; importText.value = ''
    Message.success(`已导入 ${pointList?.length ?? 0} 个收集点、${boxList?.length ?? 0} 个箱体`)
    return true
  } catch { Message.error('JSON 格式不正确：需要包含 data.boxes 或 data.points 数组'); return false }
}

watch([keyword, multiFilter, overflowFilter, selectedTownships, showBoxes, showPoints], drawMarkers)
watch(boxes, drawMarkers)
watch(points, drawMarkers)
watch(selectedPoint, drawSelectedRadiusLabel)
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
async function loadFromCloud(silent = false) {
  cloudLoading.value = true
  let boxCount = 0
  let pointCount = 0
  let ok = false
  try {
    const data = await daasRequest<{ list: Box[] }>(BOX_MONITOR_PATH, { body: { current: 1, size: 1000 } })
    if (Array.isArray(data?.list)) { boxes.value = data.list; boxGcjPoints = new WeakMap<Box, GcjPoint>(); boxCount = data.list.length; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  try {
    const data = await daasRequest<{ list: CollectionPoint[] }>(COLLECTION_POINTS_PATH, { method: 'GET', query: COLLECTION_POINTS_QUERY })
    if (Array.isArray(data?.list)) { points.value = data.list; pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>(); pointCount = data.list.length; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  selectedBox.value = undefined
  selectedPoint.value = undefined
  cloudLoading.value = false
  if (ok) { if (!silent) Message.success(`已从云端更新：${pointCount} 收集点 / ${boxCount} 箱体`) }
  else if (!silent) Message.warning('云端数据加载失败，请检查网络或稍后重试')
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
onBeforeUnmount(() => {
  boxMarkers.forEach((m) => m.setMap(null)); pointMarkers.forEach((m) => m.setMap(null))
  pointRadiusCircles.forEach((c) => c.setMap(null)); clearSelectedRadiusLabel()
  map?.destroy()
})
</script>

<style scoped lang="scss">
.box-point-map-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle, .filter-result { color: #86909c; font-size: 13px; }
.token-expired-banner { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1px solid #fbaca3; border-radius: 4px; background: #ffece8; color: #f53f3f; font-size: 13px; }
.token-reset-link { color: #165dff; cursor: pointer; text-decoration: underline; }
.filter-card :deep(.arco-card-body) { padding: 14px 16px; }
.filter-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.filter-block:last-child { margin-bottom: 0; }
.filter-label { color: #4e5969; font-size: 13px; white-space: nowrap; }
.chip { padding: 2px 13px; border: 1px solid #e5e6eb; border-radius: 14px; background: #fff; color: #4e5969; font-size: 13px; line-height: 22px; cursor: pointer; transition: all .15s; }
.chip:hover { border-color: #165dff; color: #165dff; }
.chip.active { background: #165dff; border-color: #165dff; color: #fff; }
.seg { display: inline-flex; align-items: stretch; border: 1px solid #d2d3d8; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgb(0 0 0 / 5%); }
.seg-btn { padding: 4px 15px; border: 0; background: #fff; color: #4e5969; font-size: 13px; line-height: 18px; cursor: pointer; transition: all .15s; }
.seg-btn + .seg-btn { border-left: 1px solid #d2d3d8; }
.seg-btn:hover { color: #165dff; }
.seg-btn.active { background: #165dff; color: #fff; font-weight: 500; box-shadow: inset 0 0 0 1px #165dff; }
.seg-btn.danger.active { background: #f53f3f; box-shadow: inset 0 0 0 1px #f53f3f; }
.seg-btn.warning.active { background: #ff7d00; box-shadow: inset 0 0 0 1px #ff7d00; }
.seg.disabled { opacity: .5; pointer-events: none; }
.map-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 16px; overflow: hidden; }.map-layout.has-detail { grid-template-columns: minmax(0, 1fr) 360px; }
.map-card, .detail-card { min-height: 0; overflow: hidden; }
.map-card :deep(.arco-card-body) { height: 100%; padding: 0; }
.detail-card { display: flex; flex-direction: column; }
.detail-card :deep(.arco-card-body) { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.detail-card .detail-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.detail-card .detail-actions { flex-shrink: 0; padding-top: 16px; }
.amap-container { width: 100%; height: 100%; background: #f2f3f5; }
.map-stats { position: absolute; top: 16px; left: 16px; display: flex; gap: 10px; z-index: 1; }
.map-legend { position: absolute; z-index: 1; bottom: 16px; left: 16px; display: flex; gap: 12px; padding: 7px 12px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-legend span { display: inline-flex; align-items: center; gap: 5px; }.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }.legend-dot.point { background: #165dff; }.legend-dot.box { background: #00b42a; border-radius: 2px; }.legend-dot.overflow { background: #f53f3f; }
.map-theme-picker { position: absolute; z-index: 1; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-theme-picker :deep(.arco-select) { width: 88px; }
.map-stat { min-width: 96px; padding: 9px 14px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }
.map-stat b { display: block; color: #165dff; font-size: 22px; line-height: 28px; }.map-stat.danger b { color: #f53f3f; }
.map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: #f53f3f; background: #f7f8fa; }
.detail-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }.detail-heading h3 { margin: 4px 0 0; color: #1d2129; font-size: 17px; }.obj-no, .section-label { color: #86909c; font-size: 12px; }.obj-no { display: inline-flex; align-items: center; gap: 4px; }
.detail-card :deep(.arco-card-header) { align-items: center; }.detail-close-btn { color: #86909c; }.detail-close-btn:hover { color: #1d2129; }
.info-block { margin-bottom: 16px; }.info-block p { margin: 4px 0 0; color: #4e5969; font-size: 13px; line-height: 1.6; }
.coordinate-block { display: grid; gap: 5px; margin: 18px 0; }.coordinate-block span { color: #86909c; font-size: 12px; }.coordinate-block code { margin-bottom: 8px; padding: 8px; border-radius: 3px; background: #f7f8fa; color: #4e5969; font-size: 12px; }
.modal-tip { margin-top: 0; color: #4e5969; }.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
:global(.point-map-marker) { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; border-radius: 50%; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 13px; font-weight: 600; }
.box-point-map-page :global(.point-map-marker.multi) { background: #ff7d00; }
:global(.box-map-marker) { position: relative; min-width: 36px; height: 26px; padding: 0 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #00b42a; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 12px; font-weight: 600; }
:global(.box-map-marker::after) { content: ''; position: absolute; bottom: -6px; left: 50%; width: 10px; height: 10px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }.box-point-map-page :global(.box-map-marker.warning) { background: #ff7d00; }.box-point-map-page :global(.box-map-marker.overflow) { background: #f53f3f; }
:global(.point-radius-label) { position: relative; padding: 1px 6px; border-radius: 3px; background: rgb(22 93 255 / 90%); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 1px 4px rgb(29 33 41 / 25%); }
.point-radius-label::after { content: ''; position: absolute; bottom: -5px; left: 50%; width: 8px; height: 8px; border-left: 1px solid rgb(22 93 255 / 90%); border-bottom: 1px solid rgb(22 93 255 / 90%); background: rgb(22 93 255 / 90%); transform: translateX(-50%) rotate(-45deg); }
@media (max-width: 960px) { .map-layout { grid-template-columns: 1fr; grid-template-rows: minmax(0, 45vh) minmax(0, 45vh); overflow: hidden; }.detail-card { min-height: 0; }.page-header { align-items: flex-start; gap: 12px; flex-direction: column; } }
</style>

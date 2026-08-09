<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="小勾臂箱监控"
      subtitle="小勾臂箱列表监控，数据与「箱体地图 / 箱体收集点地图 / 数据隐藏配置」共享。"
      phase="临时工具"
      priority="P0"
      module="箱体监控"
    >
      <template #extra>
        <a-space>
          <a-tag :color="tokenStatusColor">{{ tokenStatusText }}</a-tag>
          <a-button type="primary" @click="openLogin()">登录</a-button>
          <a-button @click="openTokenModal">Token</a-button>
          <a-button type="primary" :loading="cloudLoading" @click="loadFromCloud()">
            <template #icon><icon-sync /></template>
            从云端更新
          </a-button>
        </a-space>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div v-if="daasAuth.expired" class="token-expired-banner">
      <icon-exclamation-circle-fill />
      <span>接口 Token 已过期或未登录。请</span>
      <a class="token-reset-link" @click="openLogin()">重新登录</a>
      <span>后重试。</span>
    </div>

    <a-card class="filter-card" :bordered="false">
      <div class="filter-block">
        <a-input v-model="keyword" allow-clear placeholder="输入箱体编号或名称" style="width: 240px">
          <template #prefix><icon-search /></template>
        </a-input>
        <a-button :type="overflowOnly ? 'primary' : 'outline'" :status="overflowOnly ? 'danger' : 'normal'" @click="overflowOnly = !overflowOnly">
          {{ overflowOnly ? '已筛选满溢' : '只看满溢' }}
        </a-button>
        <span class="filter-result">{{ keyword.trim() ? `匹配到 ${rows.length} 个箱体` : `当前显示 ${rows.length} 个箱体` }}</span>
      </div>
      <div class="filter-block">
        <span class="filter-label">乡镇</span>
        <button type="button" class="chip" :class="{ active: !townshipFilter }" @click="selectTownship('')">全部</button>
        <button v-for="t in townshipOptions" :key="t" type="button" class="chip" :class="{ active: townshipFilter === t }" @click="selectTownship(t)">{{ t }}</button>
      </div>
      <div class="filter-block">
        <span class="filter-label">村庄</span>
        <button type="button" class="chip" :class="{ active: !villageFilter }" @click="villageFilter = ''">全部</button>
        <button v-for="v in villageOptions" :key="v" type="button" class="chip" :class="{ active: villageFilter === v }" @click="villageFilter = v">{{ v }}</button>
      </div>
    </a-card>

    <div class="table-panel">
      <a-table
        row-key="id"
        :data="rows"
        :columns="columns"
        :pagination="pagination"
        :scroll="{ x: 1200 }"
        stripe
      >
        <template #containerNo="{ record }">
          <span class="box-no-cell">{{ record.containerNo }}</span>
        </template>
        <template #townships="{ record }">
          <span v-if="record.townships.length">{{ record.townships.join('、') }}</span>
          <span v-else class="empty-text">-</span>
        </template>
        <template #villages="{ record }">
          <span v-if="record.villages.length">{{ record.villages.join('、') }}</span>
          <span v-else class="empty-text">-</span>
        </template>
        <template #overflowStatus="{ record }">
          <a-tag :color="record.overflowStatus === 1 ? 'red' : 'green'">{{ record.overflowStatus === 1 ? '满溢' : '正常' }}</a-tag>
        </template>
        <template #otherObjects="{ record }">
          <a-tooltip v-if="record.otherObjects.length" :content="record.otherObjects.join('、')">
            <span class="match-text">{{ record.otherObjects.join('、') }}</span>
          </a-tooltip>
          <span v-else class="empty-text">-</span>
        </template>
        <template #fillLevel="{ record }">
          <span :class="{ 'fill-high': (record.fillLevel ?? 0) >= 90 }">{{ record.fillLevel ?? 0 }}%</span>
        </template>
        <template #address="{ record }">
          <span :class="{ 'addr-loading': addressLoading[record.id], 'addr-fallback': !addressCache[record.id] && !addressLoading[record.id] }">{{ addressOf(record) }}</span>
        </template>
      </a-table>
    </div>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" @ok="saveToken">
      <p class="modal-tip">
        用于调用真实接口 <code>/domestic/waste/containers/sbgMonitoring</code>（<code>size=1000</code> 一次性拉取全部小勾臂箱）。
        推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。
        Token 失效时，「从云端更新」会自动弹出登录框，登录成功后自动重试。
      </p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnData } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import { daasAuth, daasRequest, setDaasToken } from '@/utils/daas'
import { getCachedBoxes, getCachedPoints, saveCachedBoxes, saveCachedPoints, subscribeBoxesUpdated, subscribePointsUpdated } from './sbg-store'

defineOptions({ name: 'SanitationSmallBoxMonitor' })

/** 小勾臂箱监控真实接口（走全局 daas 登录/请求），size=1000 一次性拉取全部（约 100 条） */
const BOX_MONITOR_PATH = '/domestic/waste/containers/sbgMonitoring'
/** 收集点接口：用于给箱体匹配所属乡镇/村庄（townshipName/villageName） */
const COLLECTION_POINTS_PATH = '/domestic/waste/v/collection-points/page'
const COLLECTION_POINTS_QUERY = { keyword: '', organizationId: 506, page: 0, size: 1000 }

interface GcjPoint { lng: number, lat: number }
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
}
interface Row {
  id: number
  containerNo: string
  overflowStatus: number
  fillLevel: number
  longitude: number
  latitude: number
  townships: string[]
  villages: string[]
  otherObjects: string[]
}

const boxes = ref<Box[]>([])
const points = ref<CollectionPoint[]>([])
const keyword = ref('')
const overflowOnly = ref(false)
const townshipFilter = ref('')
const villageFilter = ref('')
const cloudLoading = ref(false)
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

/** 解析箱体 matchObject 中匹配到的收集点（按 pointName / pointCode / id 匹配） */
function findPointsOf(box: Box): CollectionPoint[] {
  let names: string[] = []
  try { names = Object.keys(JSON.parse(box.matchObject || '{}')) } catch { return [] }
  const hits: CollectionPoint[] = []
  for (const name of names) {
    const p = points.value.find((pp) => pp.pointName === name || pp.pointCode === name || String(pp.id) === name)
    if (p) hits.push(p)
  }
  return hits
}

/** 匹配对象：除去收集点之外的其它对象（车辆 / 中转站 / 焚烧厂 等） */
function otherObjectsOf(box: Box): string[] {
  let names: string[] = []
  try { names = Object.keys(JSON.parse(box.matchObject || '{}')) } catch { return [] }
  return names.filter((name) => !points.value.some((pp) => pp.pointName === name || pp.pointCode === name || String(pp.id) === name))
}

const townshipOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) findPointsOf(b).forEach((p) => { if (p.townshipName) s.add(p.townshipName) })
  return Array.from(s).sort()
})
const villageOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) findPointsOf(b).forEach((p) => {
    if (!p.villageName) return
    if (townshipFilter.value && p.townshipName !== townshipFilter.value) return
    s.add(p.villageName)
  })
  return Array.from(s).sort()
})
function selectTownship(val: string) {
  townshipFilter.value = val
  villageFilter.value = ''
}

const rows = computed<Row[]>(() => {
  const q = keyword.value.trim().toLowerCase()
  return boxes.value
    .filter((b) => (!q || b.containerNo.toLowerCase().includes(q) || b.containerName.toLowerCase().includes(q))
      && (!overflowOnly.value || b.overflowStatus === 1)
      && (!townshipFilter.value || findPointsOf(b).some((p) => p.townshipName === townshipFilter.value))
      && (!villageFilter.value || findPointsOf(b).some((p) => p.villageName === villageFilter.value)))
    .map((b) => {
      const hits = findPointsOf(b)
      return {
        id: b.id,
        containerNo: b.containerNo,
        overflowStatus: b.overflowStatus,
        fillLevel: b.fillLevel,
        longitude: b.longitude,
        latitude: b.latitude,
        townships: Array.from(new Set(hits.map((p) => p.townshipName).filter(Boolean))),
        villages: Array.from(new Set(hits.map((p) => p.villageName).filter(Boolean))),
        otherObjects: otherObjectsOf(b),
      }
    })
})
const overflowCount = computed(() => boxes.value.filter((b) => b.overflowStatus === 1).length)
const metrics = computed(() => [
  { label: '箱体总数', value: boxes.value.length, tone: 'processing' },
  { label: '满溢预警', value: overflowCount.value, tone: 'danger' },
  { label: '收集点总数', value: points.value.length },
])
/** 响应式分页：每页条数可选 20/50/100/1000（onPageSizeChange 切换时回到第 1 页） */
const pagination = reactive({
  current: 1,
  pageSize: 20,
  showTotal: true,
  showJumper: true,
  showPageSize: true,
  pageSizeOptions: [20, 50, 100, 1000] as number[],
  onChange: (page: number) => { pagination.current = page },
  onPageSizeChange: (size: number) => { pagination.pageSize = size; pagination.current = 1 },
})
const columns: TableColumnData[] = [
  { title: '序号', dataIndex: 'index', width: 70, align: 'center', render: ({ rowIndex }: any) => rowIndex + 1 + (pagination.current - 1) * pagination.pageSize },
  { title: '箱体编号', dataIndex: 'containerNo', slotName: 'containerNo', width: 110, fixed: 'left' },
  { title: '乡镇', dataIndex: 'townships', slotName: 'townships', width: 110 },
  { title: '村庄', dataIndex: 'villages', slotName: 'villages', width: 110 },
  { title: '满溢', dataIndex: 'overflowStatus', slotName: 'overflowStatus', width: 80, align: 'center' },
  { title: '匹配对象', dataIndex: 'otherObjects', slotName: 'otherObjects', minWidth: 220 },
  { title: '垃圾占比', dataIndex: 'fillLevel', slotName: 'fillLevel', width: 100, align: 'center' },
  { title: '当前位置', dataIndex: 'address', slotName: 'address', minWidth: 280 },
]

// ==================== 当前位置逆解析（WGS84 → GCJ02 → 高德 Web 服务逆地理编码） ====================
const ADDRESS_CACHE_KEY = 'sbg-monitor:addresses'
function readAddressCache(): Record<number, string> {
  try {
    const raw = localStorage.getItem(ADDRESS_CACHE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw) as Record<string, unknown>
    const out: Record<number, string> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') out[Number(k)] = v
    }
    return out
  } catch { return {} }
}
const addressCache = ref<Record<number, string>>(readAddressCache())
const addressLoading = ref<Record<number, boolean>>({})
function persistAddressCache() {
  try { localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(addressCache.value)) } catch { /* 忽略 */ }
}

const AMAP_REVERSE_URL = 'https://restapi.amap.com/v3/geocode/regeo'
function getAmapKey(): string {
  return import.meta.env.VITE_AMAP_JS_KEY || import.meta.env.VITE_AMAP_KEY || ''
}
async function reverseGeocode(lng: number, lat: number): Promise<string | undefined> {
  const key = getAmapKey()
  if (!key) return undefined
  try {
    const url = `${AMAP_REVERSE_URL}?key=${encodeURIComponent(key)}&location=${lng.toFixed(6)},${lat.toFixed(6)}&extensions=all`
    const res = await fetch(url)
    if (!res.ok) return undefined
    const data = (await res.json()) as { status?: string, regeocode?: { formatted_address?: string } }
    if (data?.status === '1' && data.regeocode?.formatted_address) return data.regeocode.formatted_address
    return undefined
  } catch { return undefined }
}

function toGcj(lng: number, lat: number): GcjPoint {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35)
  const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}

const addressQueue: Box[] = []
const requestedIds = new Set<number>()
let poolRunning = 0
const ADDRESS_CONCURRENCY = 4

function queueAddress(box: Pick<Box, 'id' | 'longitude' | 'latitude'>) {
  if (!box || !Number.isFinite(box.longitude) || !Number.isFinite(box.latitude)) return
  if (addressCache.value[box.id] != null || requestedIds.has(box.id)) return
  requestedIds.add(box.id)
  addressQueue.push(box)
  drainAddressPool()
}
function drainAddressPool() {
  while (poolRunning < ADDRESS_CONCURRENCY && addressQueue.length) {
    const box = addressQueue.shift()!
    poolRunning++
    resolveAddress(box).finally(() => { poolRunning--; drainAddressPool() })
  }
}
async function resolveAddress(box: Pick<Box, 'id' | 'longitude' | 'latitude'>) {
  const gcj = toGcj(box.longitude, box.latitude)
  addressLoading.value = { ...addressLoading.value, [box.id]: true }
  try {
    const address = await reverseGeocode(gcj.lng, gcj.lat)
    if (address) {
      addressCache.value = { ...addressCache.value, [box.id]: address }
      persistAddressCache()
    }
  } catch { /* 单个失败不影响其它 */ }
  addressLoading.value = { ...addressLoading.value, [box.id]: false }
}
function addressOf(box: Pick<Box, 'id' | 'longitude' | 'latitude'>): string {
  const addr = addressCache.value[box.id]
  if (addr) return addr
  if (addressLoading.value[box.id]) return '解析中…'
  // 逆解析失败/未完成时，兜底显示 WGS84 原始坐标
  return `${Number(box.longitude).toFixed(5)}, ${Number(box.latitude).toFixed(5)}`
}

// 可视行变化 → 排队逆解析（懒加载 + 并发池 + 缓存）
watch(rows, (list) => { list.forEach((r) => queueAddress(r)) }, { immediate: true })

// ==================== 云端更新 ====================
async function loadFromCloud(silent = false) {
  cloudLoading.value = true
  let ok = false
  let boxList: Box[] | undefined
  try {
    const data = await daasRequest<{ list: Box[] }>(BOX_MONITOR_PATH, { body: { current: 1, size: 1000 } })
    if (Array.isArray(data?.list)) { boxList = data.list; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  let pointList: CollectionPoint[] | undefined
  try {
    const data = await daasRequest<{ list: CollectionPoint[] }>(COLLECTION_POINTS_PATH, { method: 'GET', query: COLLECTION_POINTS_QUERY })
    if (Array.isArray(data?.list)) { pointList = data.list; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  // 更新成功后写入共享缓存，其它页面（箱体地图/箱体收集点地图/数据隐藏配置）自动生效
  if (pointList) { points.value = pointList; saveCachedPoints(pointList) }
  if (boxList) { boxes.value = boxList; saveCachedBoxes(boxList) }
  cloudLoading.value = false
  if (ok) { if (!silent) Message.success(`已从云端更新 ${boxes.value.length} 个箱体`) }
  else if (!silent) Message.warning('云端数据加载失败，请检查网络或稍后重试')
}

let offBoxes: () => void
let offPoints: () => void
onMounted(() => {
  // 先读共享缓存（其它页面已更新的数据），再静默刷新云端
  const cachedBoxes = getCachedBoxes<Box>()
  const cachedPoints = getCachedPoints<CollectionPoint>()
  if (cachedBoxes.length) boxes.value = cachedBoxes
  if (cachedPoints.length) points.value = cachedPoints
  // 其它页面更新数据时，本页同步刷新
  offBoxes = subscribeBoxesUpdated((list) => {
    if (Array.isArray(list) && list.length) boxes.value = list as Box[]
  })
  offPoints = subscribePointsUpdated((list) => {
    if (Array.isArray(list) && list.length) points.value = list as CollectionPoint[]
  })
  loadFromCloud(true)
})
onBeforeUnmount(() => {
  offBoxes?.()
  offPoints?.()
})
</script>

<style scoped lang="scss">
.sanitation-page { display: flex; flex-direction: column; gap: 14px; }
.token-expired-banner { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1px solid #fbaca3; border-radius: 4px; background: #ffece8; color: #f53f3f; font-size: 13px; }
.token-reset-link { color: #165dff; cursor: pointer; text-decoration: underline; }

.filter-card :deep(.arco-card-body) { padding: 14px 16px; }
.filter-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.filter-block:last-child { margin-bottom: 0; }
.filter-label { font-size: 13px; color: var(--color-text-2); white-space: nowrap; }
.filter-result { color: var(--color-text-3); font-size: 13px; }
.chip { padding: 2px 13px; border: 1px solid var(--color-border-2); border-radius: 14px; background: var(--color-bg-2); color: var(--color-text-2); font-size: 13px; line-height: 22px; cursor: pointer; transition: all .15s; }
.chip:hover { border-color: rgb(var(--arcoblue-6)); color: rgb(var(--arcoblue-6)); }
.chip.active { background: rgb(var(--arcoblue-6)); border-color: rgb(var(--arcoblue-6)); color: #fff; }
.table-panel { padding: 16px; background: var(--color-bg-2); border-radius: 4px; }

/* 表头允许换行显示（与其它档案页统一样式） */
:deep(.arco-table-th) {
  .arco-table-th-item {
    white-space: normal !important;
    word-break: break-all !important;
    overflow: visible !important;
    height: auto !important;
    line-height: 1.4 !important;
    padding-top: 6px;
    padding-bottom: 6px;
  }
}

.box-no-cell { color: rgb(var(--arcoblue-6)); font-weight: 600; }
.empty-text { color: var(--color-text-4); }
.match-text { display: inline-block; max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; color: var(--color-text-1); }
.addr-loading { color: var(--color-text-3); }
.addr-fallback { color: var(--color-text-4); font-variant-numeric: tabular-nums; }
.fill-high { color: rgb(var(--red-6)); font-weight: 600; }

.modal-tip { margin-top: 0; color: var(--color-text-2); }
.modal-tip code { padding: 1px 4px; background: var(--color-fill-2); }
</style>

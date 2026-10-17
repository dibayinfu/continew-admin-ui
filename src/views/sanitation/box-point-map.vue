<template>
  <div ref="pageFullscreenRef" class="gi_page box-point-map-page">
    <div class="page-header">
      <div>
        <div class="page-title">箱体收集点地图</div>
        <div class="page-subtitle">对照箱体位置核对收集点信息，支持点位编辑与地图选点</div>
      </div>
      <a-space>
        <a-button type="primary" :loading="cloudLoading" @click="loadFromCloud()">
          <template #icon><icon-sync /></template>
          更新
        </a-button>
        <a-tooltip :content="isPageFullscreen ? '退出全屏' : '主体全屏'">
          <a-button :type="isPageFullscreen ? 'primary' : 'secondary'" @click="togglePageFullscreen">
            <template #icon>
              <icon-fullscreen-exit v-if="isPageFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
        <a-dropdown position="br">
          <a-button>更多<icon-down /></a-button>
          <template #content>
            <a-doption @click="openLogin()">登录</a-doption>
            <a-doption @click="openTokenModal">Token</a-doption>
            <a-doption @click="importVisible = true">导入最新 JSON</a-doption>
            <a-doption :disabled="!selected" @click="copyLocationLink">复制定位链接</a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>

    <a-card class="filter-card" :bordered="false">
      <div class="filter-block locate-block">
        <span class="filter-label">快速定位</span>
        <a-auto-complete v-model="keyword" class="locate-input" :data="locateSuggestions.slice(0, 8)" :filter-option="false" allow-clear aria-label="箱体编号或收集点名称" placeholder="输入箱体编号或收集点名称" @select="onLocateSelect" @press-enter="onLocateEnter">
          <template #prefix><icon-search /></template>
          <template v-if="locateSuggestions.length > 8" #footer>
            <div class="locate-suggestions-footer">请输入更完整的箱体编号或收集点名称</div>
          </template>
        </a-auto-complete>
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
      <div class="filter-block">
        <span class="filter-label">图层</span>
        <a-checkbox v-model="showBoxes" class="status-filter-checkbox" :class="{ selected: showBoxes }">箱体</a-checkbox>
        <a-checkbox v-model="showPoints" class="status-filter-checkbox" :class="{ selected: showPoints }">收集点</a-checkbox>
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
            <div class="map-stat"><span>收集点</span><b>{{ visiblePoints.length }}</b></div>
            <div class="map-stat"><span>箱体</span><b>{{ visibleBoxes.length }}</b></div>
          </div>
          <div class="map-legend">
            <span><i class="legend-dot point"></i>收集点</span>
            <span><i class="legend-dot box"></i>箱体</span>
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

        <a-card v-if="selected" class="detail-card" :bordered="false">
        <div class="detail-panel-header">
          <div class="detail-title">
            <span class="section-label">{{ selectedBox ? '箱体编号' : '收集点' }}</span>
            <h2 :class="{ 'point-detail-name': selectedPoint }">{{ selectedBox?.containerNo || selectedPoint?.pointName }}</h2>
          </div>
          <a-button type="text" size="mini" class="detail-close-btn" aria-label="关闭详情" @click="clearSelection"><template #icon><icon-close /></template></a-button>
        </div>
        <div class="detail-scroll">
          <template v-if="selectedBox">
            <div class="detail-heading">
              <a-tag :color="boxStatusColor(selectedBox)">{{ boxStatusText(selectedBox) }}</a-tag>
              <a-tag :color="selectedBox.onlineStatus === 0 ? 'green' : 'red'">{{ selectedBox.onlineStatus === 0 ? '在线' : '离线' }}</a-tag>
              <span class="report-time">上报时间：{{ selectedBox.reportTime || '-' }}</span>
            </div>
            <div class="fill-summary" :class="boxTone(selectedBox)">
              <span>垃圾占比</span><strong>{{ selectedBox.fillLevel ?? '-' }}%</strong>
              <div class="fill-track"><i :style="{ width: `${Math.max(0, Math.min(100, selectedBox.fillLevel || 0))}%` }"></i></div>
            </div>
            <div class="location-summary">
              <span class="section-label">乡镇村庄</span>
              <b>{{ selectedBoxArea?.township || '未匹配乡镇' }} · {{ selectedBoxArea?.village || '未匹配村庄' }}</b>
              <span class="matched-point">{{ selectedBoxArea?.pointName || '未匹配收集点' }}</span>
            </div>
            <div class="detail-grid">
              <div class="detail-grid-item full"><span>箱体名称</span><b>{{ selectedBox.containerName || '-' }}</b></div>
              <div class="detail-grid-item"><span>容量</span><b>{{ selectedBox.capacity ?? '-' }} 吨</b></div>
              <div class="detail-grid-item"><span>温度</span><b>{{ selectedBox.temperature ?? '-' }} ℃</b></div>
              <div class="detail-grid-item"><span>电量</span><b>{{ selectedBox.voltage ?? '-' }}%</b></div>
              <div class="detail-grid-item"><span>开关状态</span><b>{{ selectedBox.switchStatus === '0' ? '关' : selectedBox.switchStatus === '1' ? '开' : '-' }}</b></div>
              <div class="detail-grid-item full"><span>设备号</span><b>{{ selectedBox.deviceNo || '-' }}</b></div>
            </div>
          </template>
          <template v-else-if="selectedPoint">
            <div class="detail-heading">
              <a-tag :color="selectedPoint.status === 1 ? 'green' : 'red'">{{ selectedPoint.status === 1 ? '启用' : '停用' }}</a-tag>
              <a-tag v-if="demoEditedPointIds.has(selectedPoint.id)" color="orange">演示修改</a-tag>
              <a-tooltip content="编辑">
                <a-button class="point-edit-button" type="primary" size="mini" aria-label="编辑收集点" @click="openPointEditor"><template #icon><icon-edit /></template></a-button>
              </a-tooltip>
            </div>
            <div class="location-summary point-location-summary">
              <span class="section-label">乡镇村庄</span><b>{{ selectedPoint.townshipName || '-' }} · {{ selectedPoint.villageName || '-' }}</b>
              <span class="matched-point">{{ selectedPoint.address || '未填写具体地址' }}</span>
            </div>
            <div class="point-metrics">
              <div><span>容量数量</span><strong>{{ selectedPoint.containerCount ?? '-' }}<small> 个</small></strong></div>
              <div><span>服务半径</span><strong>{{ selectedPoint.serviceRadius ?? '-' }}<small> 米</small></strong></div>
            </div>
            <div class="detail-grid">
              <div class="detail-grid-item full"><span>点位编号</span><b>{{ selectedPoint.pointCode || '-' }}</b></div>
              <div class="detail-grid-item"><span>联系人</span><b>{{ selectedPoint.responsiblePerson || '-' }}</b></div>
              <div class="detail-grid-item"><span>联系电话</span><b>{{ selectedPoint.contactPhone || '-' }}</b></div>
              <div class="detail-grid-item full"><span>更新时间</span><b>{{ selectedPoint.updateTime || selectedPoint.createTime || '-' }}</b></div>
              <div v-if="selectedPoint.remark" class="detail-grid-item full"><span>备注</span><b>{{ selectedPoint.remark }}</b></div>
            </div>
          </template>
          <div class="coordinate-block">
            <span>原始坐标（WGS84）</span><code>{{ selectedBox ? `${selectedBox.longitude}, ${selectedBox.latitude}` : selectedPoint ? `${selectedPoint.longitude}, ${selectedPoint.latitude}` : '-' }}</code>
            <span>地图坐标（GCJ-02）</span><code>{{ selectedGcj ? `${selectedGcj.lng.toFixed(6)}, ${selectedGcj.lat.toFixed(6)}` : '-' }}</code>
          </div>
        </div>
      </a-card>
      </div>
    </div>

    <CollectionPointEditor v-if="editingPoint" :key="editingPoint.id" :point="editingPoint" :areas="pointEditorAreas" :popup-container="(isMapFullscreen ? mapFullscreenRef : isPageFullscreen ? pageFullscreenRef : undefined) || 'body'" @cancel="editingPoint = undefined" @save="savePointDemo" />

    <a-modal v-model:visible="importVisible" title="导入最新箱体与收集点数据" :width="680" @before-ok="importData">
      <p class="modal-tip">粘贴接口完整 JSON，格式需包含 <code>data.boxes</code>（箱体）与 <code>data.points</code>（收集点）数组，可只传其一。</p>
      <a-textarea v-model="importText" :auto-size="{ minRows: 12, maxRows: 18 }" placeholder='{"code":200,"data":{"boxes":[...],"points":[...]}}' />
    </a-modal>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" :on-before-ok="saveToken">
      <p class="modal-tip">推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。</p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useFullscreen } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { type AMapCircle, type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'
import { daasAuth, collectorMapRequest, getHiddenBoxIds, getHiddenPointIds, saveSharedDaasToken } from '@/utils/daas'
import { getCachedBoxes, getCachedPoints, saveCachedBoxes, saveCachedPoints, subscribeBoxesUpdated, subscribePointsUpdated } from './sbg-store'

import CollectionPointEditor from './components/CollectionPointEditor.vue'
import { validateCollectionPointDraft, type CollectionPointDraft } from './collection-point-edit'

defineOptions({ name: 'SanitationBoxPointMap' })

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
const pageFullscreenRef = ref<HTMLElement | null>(null)
const mapFullscreenRef = ref<HTMLElement | null>(null)
const { isFullscreen: isPageFullscreen, toggle: togglePageFullscreen } = useFullscreen(pageFullscreenRef, {
  onFullscreenChange: () => { nextTick(() => map?.resize()) },
})
const { isFullscreen: isMapFullscreen, toggle: toggleMapFullscreen } = useFullscreen(mapFullscreenRef, {
  // 进入/退出全屏后地图容器尺寸变化，通知高德地图重算视口
  onFullscreenChange: () => { nextTick(() => map?.resize()) },
})
const keyword = ref('')
const mapTheme = ref<MapTheme>('light')
const boxes = ref<Box[]>(initialBoxes)
const points = ref<CollectionPoint[]>(initialPoints)
const selectedBox = ref<Box>()
const selectedPoint = ref<CollectionPoint>()
const editingPoint = ref<CollectionPoint>()
const demoEditedPointIds = reactive(new Set<number>())
const pointNameAliases = new Map<number, Set<string>>()
const pointEditorAreas = computed(() => {
  const source = editingPoint.value ? [...points.value, editingPoint.value] : points.value
  return source.map(point => ({ townshipId: point.townshipId, townshipName: point.townshipName, villageId: point.villageId, villageName: point.villageName }))
})
function openPointEditor() {
  if (selectedPoint.value) editingPoint.value = { ...selectedPoint.value }
}
async function savePointDemo(draft: CollectionPointDraft) {
  const error = validateCollectionPointDraft(draft)
  if (error) { Message.warning(error); return }
  const original = points.value.find(point => point.id === draft.id)
  if (!original || original.id !== editingPoint.value?.id) { Message.warning('原收集点已变化，请重新打开编辑'); return }
  const area = pointEditorAreas.value.find(item => item.townshipId === draft.townshipId && item.villageId === draft.villageId)
  if (!area) { Message.warning('请选择所属乡镇下的村庄'); return }
  const updated: CollectionPoint = { ...original, ...draft, townshipId: area.townshipId, villageId: area.villageId, townshipName: area.townshipName, villageName: area.villageName }
  const aliases = pointNameAliases.get(original.id) || new Set<string>()
  aliases.add(original.pointName)
  pointNameAliases.set(original.id, aliases)
  const nextPoints = points.value.map(point => point.id === updated.id ? updated : point)
  assignBoxAreas(boxes.value, nextPoints)
  points.value = nextPoints
  pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>()
  selectedBox.value = undefined
  selectedPoint.value = points.value.find(point => point.id === updated.id)
  demoEditedPointIds.add(updated.id)
  if (!matchTownshipForPoint(updated)) { townshipFilter.value = ''; villageFilter.value = '' }
  else if (!matchVillageForPoint(updated)) villageFilter.value = ''
  showPoints.value = true
  editingPoint.value = undefined
  await nextTick()
  if (selectedPoint.value) selectPoint(selectedPoint.value)
  Message.success('演示修改已保存，仅当前页面生效')
}
const mapError = ref('')
const cloudLoading = ref(false)
const importVisible = ref(false)
const importText = ref('')
const tokenModalVisible = ref(false)
const tokenInput = ref(daasAuth.token)

function openTokenModal() {
  tokenInput.value = daasAuth.token
  tokenModalVisible.value = true
}
async function saveToken() {
  try {
    await saveSharedDaasToken(tokenInput.value)
    Message.success('Token 已保存到采集服务')
    tokenModalVisible.value = false
    void loadFromCloud(true)
    return true
  } catch (error) {
    Message.error(`Token 保存失败：${error instanceof Error ? error.message : '请检查采集服务'}`)
    return false
  }
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
/** 乡镇单选（与箱体地图一致）：全部 / 指定乡镇 / 未匹配 */
const townshipFilter = ref('')
const townshipOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    const a = boxAreas.get(b.id)
    if (a?.township) s.add(a.township)
  }
  for (const point of points.value) if (point.townshipName) s.add(point.townshipName)
  return Array.from(s).sort()
})
const unmatchedTownshipCount = computed(() => boxes.value.filter((b) => !boxAreas.get(b.id)?.township).length)
function selectTownship(val: string) {
  townshipFilter.value = val
  villageFilter.value = ''
}
function matchTownship(box: Box) {
  if (!townshipFilter.value) return true
  const township = boxAreas.get(box.id)?.township
  if (townshipFilter.value === UNMATCHED) return !township
  return township === townshipFilter.value
}
function matchTownshipForPoint(point: CollectionPoint) {
  if (!townshipFilter.value) return true
  const township = point.townshipName
  if (townshipFilter.value === UNMATCHED) return !township
  return township === townshipFilter.value
}
/** 箱体 -> 所属乡镇/村庄（仅以收集点名称关联，不能使用车辆/箱体编号） */
const boxAreas = reactive(new Map<number, { township: string, village: string, pointName: string }>())
const selectedBoxArea = computed(() => selectedBox.value ? boxAreas.get(selectedBox.value.id) : undefined)
function isCollectionPointNameKey(key: string) {
  return !/^\d+$/.test(key) && !/^[\u4E00-\u9FFF][A-Z][A-Z0-9]{5,6}$/.test(key)
}
function assignBoxAreas(boxList: Box[], pointList: CollectionPoint[]) {
  boxAreas.clear()
  for (const box of boxList) {
    try {
      const keys = Object.keys(JSON.parse(box.matchObject || '{}'))
      // matchObject 同时含收集点、车辆等对象。纯数字（如 190、164）及车牌不能按
      // 收集点 ID/编码关联，否则会把车辆所在乡镇误当成箱体归属。
      const candidates = pointList.filter((point) => keys.some((key) =>
        isCollectionPointNameKey(key) && (point.pointName === key || pointNameAliases.get(point.id)?.has(key)),
      ))
      // 一个箱体可能命中多个收集点，按与箱体坐标的距离确定归属，不能依赖 JSON 键顺序。
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
/** 「未匹配」筛选值：无收集点归属（无村庄）的箱体专用 sentinel，不会与真实村庄名冲突 */
const UNMATCHED = '__unmatched__'
const villageFilter = ref('')
/** 村庄 chips 折叠：默认只显示前 N 个（约两行），点击「更多」展开 */
const VILLAGE_COLLAPSED = 10
const villageCollapsed = ref(true)
const villageOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    const a = boxAreas.get(b.id)
    if (!a?.village) continue
    if (townshipFilter.value && a.township !== townshipFilter.value) continue
    s.add(a.village)
  }
  for (const point of points.value) {
    if (point.villageName && (!townshipFilter.value || point.townshipName === townshipFilter.value)) s.add(point.villageName)
  }
  return Array.from(s).sort()
})
const visibleVillageOptions = computed(() => {
  const list = villageCollapsed.value ? villageOptions.value.slice(0, VILLAGE_COLLAPSED) : villageOptions.value
  // 保证当前选中的村庄始终可见（即使超出折叠数量）
  if (villageFilter.value && villageFilter.value !== UNMATCHED && !list.includes(villageFilter.value) && villageOptions.value.includes(villageFilter.value)) {
    return [...list, villageFilter.value]
  }
  return list
})
const unmatchedVillageCount = computed(() => boxes.value.filter((b) => {
  if (boxAreas.get(b.id)?.village) return false
  if (townshipFilter.value && townshipFilter.value !== UNMATCHED) return false
  return true
}).length)
function matchVillage(box: Box) {
  if (!villageFilter.value) return true
  const village = boxAreas.get(box.id)?.village
  if (villageFilter.value === UNMATCHED) return !village
  return village === villageFilter.value
}
function matchVillageForPoint(point: CollectionPoint) {
  if (!villageFilter.value) return true
  const village = point.villageName
  if (villageFilter.value === UNMATCHED) return !village
  return village === villageFilter.value
}
const showBoxes = ref(true)
const showPoints = ref(true)
const visiblePoints = computed(() => {
  if (!showPoints.value) return []
  const hidden = getHiddenPointIds()
  // 关键字仅用于高亮定位，不隐藏未命中的收集点，仍受图层/隐藏/乡镇/村庄筛选约束
  return points.value.filter((p) => Number.isFinite(p.longitude) && Number.isFinite(p.latitude)
    && !hidden.has(p.id)
    && matchTownshipForPoint(p)
    && matchVillageForPoint(p))
})
const visibleBoxes = computed(() => {
  if (!showBoxes.value) return []
  const hidden = getHiddenBoxIds()
  // 关键字仅用于高亮定位，不隐藏未命中的箱体，仍受图层/隐藏/乡镇/村庄筛选约束
  return boxes.value.filter((b) => Number.isFinite(b.longitude) && Number.isFinite(b.latitude)
    && !hidden.has(b.id)
    && matchTownship(b)
    && matchVillage(b))
})

/** 输入箱体编号命中的箱体：仅高亮定位，不隐藏其它箱体 */
const matchedBoxes = computed<Set<Box> | null>(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return null
  return new Set(boxes.value.filter((box) => box.containerNo.toLowerCase().includes(query)))
})
/** 输入收集点名称命中的收集点：仅高亮定位，不隐藏其它收集点 */
const matchedPoints = computed<Set<CollectionPoint> | null>(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return null
  return new Set(points.value.filter((point) => point.pointName.toLowerCase().includes(query)))
})
const locateSuggestions = computed(() => {
  if (!keyword.value.trim()) return []
  const hiddenBoxes = getHiddenBoxIds()
  const hiddenPoints = getHiddenPointIds()
  const values = new Set([
    ...[...(matchedBoxes.value || [])].filter(box => !hiddenBoxes.has(box.id)).map(box => box.containerNo),
    ...[...(matchedPoints.value || [])].filter(point => !hiddenPoints.has(point.id)).map(point => point.pointName),
  ])
  const query = keyword.value.trim().toLowerCase()
  return [...values].filter(Boolean).sort((a, b) => Number(b.toLowerCase() === query) - Number(a.toLowerCase() === query)
    || a.localeCompare(b, 'zh-CN', { numeric: true }))
})
async function onLocateSelect(value: string) {
  keyword.value = value
  await nextTick()
  await focusMatchedObject()
}
async function onLocateEnter(event: KeyboardEvent) {
  if (event.isComposing) return
  await nextTick()
  if (!event.defaultPrevented) await focusMatchedObject()
}
async function focusMatchedObject() {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return
  const boxes = [...(matchedBoxes.value || [])]
  const points = [...(matchedPoints.value || [])]
  const exactBoxes = boxes.filter(box => box.containerNo.toLowerCase() === query)
  const exactPoints = points.filter(point => point.pointName.toLowerCase() === query)
  const exactCount = exactBoxes.length + exactPoints.length
  const targetBox = exactCount === 1 ? exactBoxes[0] : boxes.length + points.length === 1 ? boxes[0] : undefined
  const targetPoint = exactCount === 1 ? exactPoints[0] : boxes.length + points.length === 1 ? points[0] : undefined
  if (!targetBox && !targetPoint) {
    Message.info(boxes.length + points.length ? '匹配到多个对象，请输入更完整的箱体编号或收集点名称' : '未找到匹配的箱体或收集点')
    return
  }
  const target = targetBox || targetPoint!
  if ((targetBox ? getHiddenBoxIds() : getHiddenPointIds()).has(target.id)) {
    Message.info('该对象已被隐藏，请先在数据隐藏配置中取消隐藏')
    return
  }
  if (!Number.isFinite(target.longitude) || !Number.isFinite(target.latitude)) {
    Message.info('该对象暂无有效定位')
    return
  }
  // 全局定位只解除与目标冲突的筛选，保持其它条件。
  if (targetBox) {
    showBoxes.value = true
    if (!matchTownship(targetBox)) { townshipFilter.value = ''; villageFilter.value = '' }
    else if (!matchVillage(targetBox)) villageFilter.value = ''
  } else if (targetPoint) {
    showPoints.value = true
    if (!matchTownshipForPoint(targetPoint)) { townshipFilter.value = ''; villageFilter.value = '' }
    else if (!matchVillageForPoint(targetPoint)) villageFilter.value = ''
  }
  await nextTick()
  if (targetBox) selectBox(targetBox)
  else if (targetPoint) selectPoint(targetPoint)
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
function boxMarkerClass(box: Box) {
  const classes = ['box-map-marker', boxTone(box)]
  if (box === selectedBox.value) classes.push('selected')
  if (matchedBoxes.value?.has(box)) classes.push('matched')
  return classes.filter(Boolean).join(' ')
}
function pointTone(point: CollectionPoint) { return point.containerCount >= 2 ? 'multi' : '' }
function pointMarkerClass(point: CollectionPoint) {
  const classes = ['point-map-marker', pointTone(point)]
  if (point === selectedPoint.value) classes.push('selected')
  if (matchedPoints.value?.has(point)) classes.push('matched')
  return classes.filter(Boolean).join(' ')
}
function boxStatusText(box: Box) { return box.overflowStatus === 1 ? '满溢' : box.fillLevel >= 70 ? '接近满溢' : '正常' }
function boxStatusColor(box: Box) { return box.overflowStatus === 1 ? 'red' : box.fillLevel >= 70 ? 'orange' : 'green' }

function drawMarkers(fit = true) {
  if (!map || !amap) return
  boxMarkers.forEach((m) => m.setMap(null)); boxMarkers = []
  pointMarkers.forEach((m) => m.setMap(null)); pointMarkers = []
  pointRadiusCircles.forEach((c) => c.setMap(null)); pointRadiusCircles = []
  // 收集点：圆形标记 + 服务半径圈
  visiblePoints.value.forEach((point) => {
    const gcj = getPointGcj(point)
    const marker = new amap.Marker({ position: [gcj.lng, gcj.lat], offset: new amap.Pixel(-16, -16), content: `<div class="${pointMarkerClass(point)}">${escapeHtml(point.containerCount)}</div>`, title: point.pointName })
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
    const marker = new amap.Marker({ position: [gcj.lng, gcj.lat], offset: new amap.Pixel(-18, -34), content: `<div class="${boxMarkerClass(box)}">${escapeHtml(box.containerNo)}</div>`, title: box.containerName })
    marker.on('click', () => selectBox(box))
    marker.setMap(map!)
    boxMarkers.push(marker)
  })
  const allMarkers = [...pointMarkers, ...boxMarkers]
  if (fit && allMarkers.length) map.setFitView(allMarkers, false, [60, 60, 60, 360])
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
  drawMarkers(false)
  const gcj = getBoxGcj(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 16), [gcj.lng, gcj.lat])
}
function selectPoint(point: CollectionPoint) {
  selectedPoint.value = point
  selectedBox.value = undefined
  drawMarkers(false)
  const gcj = getPointGcj(point)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 15), [gcj.lng, gcj.lat])
}
function clearSelection() {
  selectedBox.value = undefined
  selectedPoint.value = undefined
  drawMarkers(false)
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
function importData() {
  try {
    const data = JSON.parse(importText.value)?.data
    const boxList = Array.isArray(data?.boxes) ? data.boxes : undefined
    const pointList = Array.isArray(data?.points) ? data.points : undefined
    if (boxList === undefined && pointList === undefined) throw new Error()
    demoEditedPointIds.clear(); pointNameAliases.clear()
    const nextBoxes = boxList !== undefined ? (boxList as Box[]) : boxes.value
    const nextPoints = pointList !== undefined ? (pointList as CollectionPoint[]) : points.value
    // 先分配箱体归属，再赋值（避免渲染时 villageOptions 读到空归属并缓存为空）
    assignBoxAreas(nextBoxes, nextPoints)
    if (boxList !== undefined) { boxes.value = nextBoxes; boxGcjPoints = new WeakMap<Box, GcjPoint>() }
    if (pointList !== undefined) { points.value = nextPoints; pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>() }
    selectedBox.value = undefined; selectedPoint.value = undefined; importText.value = ''
    Message.success(`已导入 ${pointList?.length ?? 0} 个收集点、${boxList?.length ?? 0} 个箱体`)
    return true
  } catch { Message.error('JSON 格式不正确：需要包含 data.boxes 或 data.points 数组'); return false }
}

// 关键字仅高亮定位，不重缩放；筛选条件变化时按筛选结果重新缩放适配
watch(keyword, () => drawMarkers(false))
watch([townshipFilter, villageFilter, showBoxes, showPoints], drawMarkers)
// 云端更新仅重绘标记，保留用户当前的中心点和缩放比例；筛选变化仍自动适配视野。
watch(boxes, () => drawMarkers(false))
watch(points, () => drawMarkers(false))
watch(selectedPoint, drawSelectedRadiusLabel)
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
async function loadFromCloud(silent = false) {
  if (cloudLoading.value) return
  cloudLoading.value = true
  let boxList: Box[] | undefined
  let pointList: CollectionPoint[] | undefined
  let ok = false
  try {
    const data = await collectorMapRequest<{ boxes?: Box[], points?: CollectionPoint[] }>(false)
    if (Array.isArray(data.boxes)) { boxList = data.boxes; ok = true }
    if (Array.isArray(data.points)) { pointList = data.points; ok = true }
  } catch (error) {
    if (!silent) Message.warning(error instanceof Error ? error.message : '云端数据加载失败')
  }
  // 先分配箱体归属，再赋值 boxes（避免渲染时 villageOptions 读到空归属并缓存为空）
  const nextBoxes = boxList ?? boxes.value
  if (pointList) { demoEditedPointIds.clear(); pointNameAliases.clear() }
  const nextPoints = pointList ?? points.value
  assignBoxAreas(nextBoxes, nextPoints)
  if (boxList) { boxes.value = nextBoxes; boxGcjPoints = new WeakMap<Box, GcjPoint>(); saveCachedBoxes(nextBoxes) }
  if (pointList) { points.value = nextPoints; pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>(); saveCachedPoints(nextPoints) }
  selectedBox.value = undefined
  selectedPoint.value = undefined
  cloudLoading.value = false
  const boxCount = boxList?.length ?? 0
  const pointCount = pointList?.length ?? 0
  if (ok) { if (!silent) Message.success(`已从云端更新：${pointCount} 收集点 / ${boxCount} 箱体`) }
  else if (!silent) Message.warning('云端数据加载失败，请检查网络或稍后重试')
}
let offBoxes: () => void
let offPoints: () => void
onMounted(async () => {
  // 先读共享缓存（其它页面已更新的数据），再静默刷新云端
  const cachedBoxes = getCachedBoxes<Box>()
  const cachedPoints = getCachedPoints<CollectionPoint>()
  const initBoxes = cachedBoxes.length ? cachedBoxes : boxes.value
  const initPoints = cachedPoints.length ? cachedPoints : points.value
  if (cachedBoxes.length || cachedPoints.length) {
    // 先分配箱体归属，再赋值（避免渲染时 villageOptions 读到空归属并缓存为空）
    assignBoxAreas(initBoxes, initPoints)
    if (cachedBoxes.length) { boxes.value = initBoxes; boxGcjPoints = new WeakMap<Box, GcjPoint>() }
    if (cachedPoints.length) { points.value = initPoints; pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>() }
  }
  // 其它页面更新数据时，本页同步刷新（boxes/points 已被 watch 绑定 drawMarkers）
  offBoxes = subscribeBoxesUpdated((list) => {
    if (Array.isArray(list) && list.length) { const next = list as Box[]; assignBoxAreas(next, points.value); boxes.value = next; boxGcjPoints = new WeakMap<Box, GcjPoint>() }
  })
  offPoints = subscribePointsUpdated((list) => {
    if (Array.isArray(list) && list.length) { demoEditedPointIds.clear(); pointNameAliases.clear(); const next = list as CollectionPoint[]; assignBoxAreas(boxes.value, next); points.value = next; pointGcjPoints = new WeakMap<CollectionPoint, GcjPoint>() }
  })
  if (!mapRef.value) return
  try {
    amap = await loadAmapJsApi()
    map = new amap.Map(mapRef.value, { zoom: 12, center: [114.13, 36.04], viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true, animateEnable: false, jogEnable: false })
    drawMarkers()
    loadFromCloud(true)
  } catch (error) { mapError.value = error instanceof Error ? error.message : '高德地图加载失败，请检查地图配置' }
})
onBeforeUnmount(() => {
  offBoxes?.(); offPoints?.()
  boxMarkers.forEach((m) => m.setMap(null)); pointMarkers.forEach((m) => m.setMap(null))
  pointRadiusCircles.forEach((c) => c.setMap(null)); clearSelectedRadiusLabel()
  map?.destroy()
})
</script>

<style scoped lang="scss">
.box-point-map-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; }
.box-point-map-page:fullscreen { width: 100%; height: 100%; min-height: 0; padding: 16px; overflow: auto; box-sizing: border-box; background: #f2f3f5; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle { color: #86909c; font-size: 13px; }
.token-expired-banner { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1px solid #fbaca3; border-radius: 4px; background: #ffece8; color: #f53f3f; font-size: 13px; }
.token-reset-link { color: #165dff; cursor: pointer; text-decoration: underline; }
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
.locate-block { padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border-2); }
.locate-block :deep(.locate-input) { flex: 0 1 240px; width: 240px; max-width: 100%; min-width: 0; }
.locate-suggestions-footer { padding: 8px 12px; border-top: 1px solid var(--color-border-2); color: var(--color-text-3); font-size: 12px; }
.status-filter-checkbox { margin: 0; padding: 4px 8px; border: 1px solid var(--color-border-2); border-radius: 4px; background: var(--color-bg-2); color: var(--color-text-2); line-height: 22px; transition: all .15s; }
.status-filter-checkbox:hover { border-color: #165dff; color: rgb(var(--primary-6)); }
.status-filter-checkbox.selected { border-color: #165dff; background: var(--color-primary-light-1); color: rgb(var(--primary-6)); }
.status-filter-checkbox.danger.selected { border-color: #f53f3f; background: var(--color-danger-light-1); color: rgb(var(--danger-6)); }
.map-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 16px; overflow: hidden; }
.map-card-wrap { position: relative; min-height: 0; overflow: hidden; display: flex; }.map-card-wrap .map-card { flex: 1; min-height: 0; }.map-card-wrap:fullscreen { position: fixed; inset: 0; z-index: 1001; background: #f2f3f5; }
.map-card, .detail-card { min-height: 0; overflow: hidden; }
.map-card :deep(.arco-card-body) { height: 100%; padding: 0; }
.detail-card { position: absolute; top: 16px; right: 16px; z-index: 2; width: 304px; max-height: calc(100% - 32px); display: flex; flex-direction: column; box-shadow: 0 8px 24px rgb(29 33 41 / 18%); }
.detail-card :deep(.arco-card-body) { padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.detail-card .detail-scroll { padding: 14px; flex: 1; min-height: 0; overflow-y: auto; }
.amap-container { width: 100%; height: 100%; background: #f2f3f5; }
.map-stats { position: absolute; top: 16px; left: 16px; display: flex; gap: 10px; z-index: 1; }
.map-legend { position: absolute; z-index: 1; bottom: 16px; left: 16px; display: flex; gap: 12px; padding: 7px 12px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-legend span { display: inline-flex; align-items: center; gap: 5px; }.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }.legend-dot.point { background: #165dff; }.legend-dot.box { background: #00b42a; border-radius: 2px; }.legend-dot.overflow { background: #f53f3f; }
.map-controls { position: absolute; z-index: 1; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; }
.map-theme-picker { height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 9px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }.map-theme-picker :deep(.arco-select) { width: 88px; }
.map-fullscreen-btn { height: 32px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; }.map-fullscreen-btn.active { color: #165dff; border-color: #165dff; }
.map-stat { min-width: 96px; padding: 9px 14px; border-radius: 4px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: #4e5969; font-size: 12px; }
.map-stat b { display: block; color: #165dff; font-size: 22px; line-height: 28px; }.map-stat.danger b { color: #f53f3f; }
.map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: #f53f3f; background: #f7f8fa; }
.section-label { color: var(--color-text-3); font-size: 12px; }
.detail-close-btn { color: #86909c; }.detail-close-btn:hover { color: #1d2129; }
.coordinate-block { display: grid; gap: 5px; margin: 18px 0; }.coordinate-block span { color: #86909c; font-size: 12px; }.coordinate-block code { margin-bottom: 8px; padding: 8px; border-radius: 3px; background: #f7f8fa; color: #4e5969; font-size: 12px; }
.modal-tip { margin-top: 0; color: #4e5969; }.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
:global(.point-map-marker) { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; border-radius: 50%; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 13px; font-weight: 600; }
.box-point-map-page :global(.point-map-marker.multi) { background: #ff7d00; }
.box-point-map-page :global(.point-map-marker.matched) { box-shadow: 0 0 0 3px #00b42a, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.12); z-index: 1; }
.box-point-map-page :global(.point-map-marker.selected) { border: 2px solid #fff; box-shadow: 0 0 0 3px #165dff, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.15); z-index: 2; }
.box-point-map-page :deep(.box-map-marker) { position: relative; min-width: 36px; height: 26px; padding: 0 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #00b42a; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 12px; font-weight: 600; }
.box-point-map-page :deep(.box-map-marker::after) { content: ''; position: absolute; bottom: -6px; left: 50%; width: 10px; height: 10px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }.box-point-map-page :deep(.box-map-marker.warning) { background: #ff7d00; }.box-point-map-page :deep(.box-map-marker.overflow) { background: #f53f3f; }.box-point-map-page :deep(.box-map-marker.matched) { box-shadow: 0 0 0 3px #00b42a, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.1); z-index: 1; }.box-point-map-page :deep(.box-map-marker.selected) { border: 2px solid #fff; box-shadow: 0 0 0 3px #165dff, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.15); opacity: 1; z-index: 2; }
:global(.point-radius-label) { position: relative; padding: 1px 6px; border-radius: 3px; background: rgb(22 93 255 / 90%); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 1px 4px rgb(29 33 41 / 25%); }
.point-radius-label::after { content: ''; position: absolute; bottom: -5px; left: 50%; width: 8px; height: 8px; border-left: 1px solid rgb(22 93 255 / 90%); border-bottom: 1px solid rgb(22 93 255 / 90%); background: rgb(22 93 255 / 90%); transform: translateX(-50%) rotate(-45deg); }
@media (max-width: 960px) { .map-layout { min-height: 480px; }.detail-card { top: auto; right: 10px; bottom: 10px; left: 10px; width: auto; max-height: 58%; }.page-header { align-items: flex-start; gap: 12px; flex-direction: column; } }

.detail-panel-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px; border-bottom: 1px solid var(--color-fill-2); }
.detail-title { min-width: 0; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.detail-panel-header h2 { margin: 0; color: var(--color-text-1); font-size: 28px; line-height: 34px; overflow-wrap: anywhere; }
.detail-panel-header h2.point-detail-name { flex-basis: 100%; font-size: 20px; line-height: 28px; }
.detail-close-btn { flex-shrink: 0; }
.detail-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.report-time { flex-basis: 100%; color: var(--color-text-3); font-size: 12px; }
.fill-summary { padding: 12px; border-radius: 6px; background: var(--color-fill-2); color: var(--color-text-2); font-size: 13px; }
.fill-summary strong { display: block; margin: 2px 0 9px; color: rgb(var(--primary-6)); font-size: 28px; line-height: 34px; }
.fill-summary.warning strong { color: rgb(var(--warning-6)); }.fill-summary.overflow strong { color: rgb(var(--danger-6)); }
.fill-track { height: 6px; overflow: hidden; border-radius: 3px; background: var(--color-border-2); }
.fill-track i { display: block; height: 100%; background: #165dff; border-radius: inherit; }
.fill-summary.warning .fill-track i { background: #ff7d00; }.fill-summary.overflow .fill-track i { background: #f53f3f; }
.location-summary { display: grid; gap: 5px; padding: 16px 0; }.location-summary b { color: var(--color-text-1); font-size: 14px; }
.matched-point { color: var(--color-text-2); font-size: 13px; line-height: 20px; overflow-wrap: anywhere; }
.point-location-summary { padding-top: 0; }.point-edit-button { margin-left: auto; }
.point-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; margin-bottom: 16px; border-radius: 6px; background: var(--color-fill-2); }
.point-metrics span { color: var(--color-text-2); font-size: 12px; }.point-metrics strong { display: block; margin-top: 4px; color: rgb(var(--primary-6)); font-size: 24px; }.point-metrics small { color: var(--color-text-3); font-size: 12px; font-weight: 400; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.detail-grid-item { display: grid; gap: 4px; min-width: 0; }.detail-grid-item.full { grid-column: 1 / -1; }
.detail-grid-item span { color: var(--color-text-3); font-size: 12px; }.detail-grid-item b { color: var(--color-text-2); font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.coordinate-block code { overflow-wrap: anywhere; font-size: 11px; }
</style>

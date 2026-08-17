<template>
  <div class="august-sm-map">
    <!-- 地图工具栏（手机端精简） -->
    <div class="sm-map-toolbar">
      <div class="sm-map-stats">
        <span class="sm-stat">共 <b>{{ visibleBoxes.length }}</b> 箱</span>
        <span class="sm-stat danger">满溢 <b>{{ overflowCount }}</b></span>
      </div>
      <span class="sm-overflow-btn" :class="{ active: overflowOnly }" @click="overflowOnly = !overflowOnly">只看满溢</span>
    </div>

    <!-- 箱号搜索：单独一行放大突出（重要入口，不再与村庄下拉挤在一起） -->
    <div class="sm-map-search">
      <a-input v-model="keyword" allow-clear size="large" placeholder="输入箱号搜索定位" @press-enter="focusMatchedBox">
        <template #prefix><icon-search /></template>
        <template #suffix>
          <span v-if="keyword.trim()" class="sm-search-locate" @click="focusMatchedBox">定位</span>
        </template>
      </a-input>
    </div>
    <div v-if="keyword.trim()" class="sm-search-hint">{{ matchedCount ? `匹配到 ${matchedCount} 个，回车或点定位` : '无匹配箱体' }}</div>

    <!-- 乡镇筛选（chips 横向滚动；「未匹配」= 未匹配到收集点、无法确定归属乡镇） -->
    <div class="sm-filter-row">
      <span class="sm-filter-label">乡镇</span>
      <div class="sm-chips">
        <button type="button" class="sm-chip" :class="{ active: !townshipFilter }" @click="selectTownship('')">全部</button>
        <button v-for="t in townshipOptions" :key="t" type="button" class="sm-chip" :class="{ active: townshipFilter === t }" @click="selectTownship(t)">{{ t }}</button>
        <button type="button" class="sm-chip sm-chip-unmatched" :class="{ active: townshipFilter === UNMATCHED }" @click="selectTownship(UNMATCHED)">未匹配{{ unmatchedTownshipCount ? ` ${unmatchedTownshipCount}` : '' }}</button>
      </div>
    </div>

    <!-- 村庄筛选（下拉：显式「全部」选项 + 可搜索；随乡镇联动，切换乡镇自动回「全部」） -->
    <div class="sm-filter-row">
      <span class="sm-filter-label">村庄</span>
      <a-select v-model="villageFilter" class="sm-village-select" size="small" allow-search :filter-option="villageFilterOption" placeholder="全部">
        <a-option value="">全部</a-option>
        <a-option v-for="v in villageOptions" :key="v" :value="v">{{ v }}</a-option>
        <a-option v-if="unmatchedVillageCount > 0" :value="UNMATCHED" label="未匹配">
          <span class="sm-opt-unmatched">未匹配 <em>{{ unmatchedVillageCount }}</em></span>
        </a-option>
      </a-select>
    </div>

    <div class="sm-map-wrap">
      <div ref="mapRef" class="sm-map-container"></div>
    </div>

    <!-- 选中箱体详情：从底部弹出层（默认重点展示「小勾臂箱」关键信息，点「详情」展开） -->
    <div v-if="selectedBox" class="sm-map-sheet">
      <!-- 拖拽把手 -->
      <div class="sms-handle" @click="closeSheet"></div>

      <!-- 头部：图标 + 大箱号 + 位置 + 状态（与「小勾臂箱」列表卡片共用设计） -->
      <div class="sms-head">
        <span class="sms-type-ic"><icon-storage /></span>
        <div class="sms-head-text">
          <b class="sms-no-main">{{ selectedBox.containerNo }}</b>
          <span class="sms-loc"><icon-location class="sms-loc-ic" />{{ selectedBox.township || '未匹配' }}{{ selectedBox.village ? ' · ' + selectedBox.village : '' }}</span>
        </div>
        <span class="sms-status-tag" :class="'status-' + statusTone(selectedBox)">{{ statusText(selectedBox) }}</span>
        <button type="button" class="sms-close-btn" aria-label="关闭" @click="closeSheet">
          <icon-close />
        </button>
      </div>

      <!-- 关键信息：满溢率 / 电量（与「小勾臂箱」列表卡片一致） -->
      <div class="sms-gauges">
        <div class="sms-gauge">
          <span class="sms-g-label">满溢率</span>
          <div class="sms-g-bar-bg"><div class="sms-g-bar" :class="selectedBox.overflowStatus === 1 ? 'bar-overflow' : ''" :style="{ width: selectedBox.fillLevel + '%' }"></div></div>
          <span class="sms-g-val" :class="{ 'val-overflow': selectedBox.overflowStatus === 1 }">{{ selectedBox.fillLevel }}%</span>
        </div>
        <div class="sms-gauge">
          <span class="sms-g-label">电量</span>
          <div class="sms-g-bar-bg"><div class="sms-g-bar bar-battery" :class="selectedBox.voltage < 20 ? 'bar-offline' : ''" :style="{ width: selectedBox.voltage + '%' }"></div></div>
          <span class="sms-g-val" :class="{ 'val-offline': selectedBox.voltage < 20 }">{{ selectedBox.voltage }}%</span>
        </div>
      </div>

      <!-- 匹配对象 -->
      <div class="sms-match"><span class="sms-m-label">匹配对象</span><span class="sms-m-value">{{ matchTarget(selectedBox) }}</span></div>

      <!-- 展开详情（点击「详情」按钮）：箱体名称、在线状态、设备编号、匹配对象、具体地址、温度、锁状态、最后上报时间 -->
      <div v-if="sheetDetail" class="sms-detail">
        <div class="sms-detail-row"><span>箱体名称</span><b>{{ selectedBox.containerName }}</b></div>
        <div class="sms-detail-row"><span>在线状态</span><b>{{ selectedBox.onlineStatus === 0 ? '在线' : '离线' }}</b></div>
        <div class="sms-detail-row"><span>设备编号</span><b>{{ selectedBox.deviceNo }}</b></div>
        <div class="sms-detail-row"><span>匹配对象</span><b>{{ matchTarget(selectedBox) }}</b></div>
        <div class="sms-detail-row"><span>具体地址</span><b>{{ boxAddress(selectedBox) }}</b></div>
        <div class="sms-detail-row"><span>温度</span><b>{{ selectedBox.temperature }}℃</b></div>
        <div class="sms-detail-row"><span>锁状态</span><b>{{ selectedBox.switchStatus === '0' ? '关锁' : '开锁' }}</b></div>
        <div class="sms-detail-row"><span>最后上报时间</span><b>{{ selectedBox.reportTime }}</b></div>
      </div>

      <!-- 操作：远程开锁 / 详情 / 导航 -->
      <div class="sms-actions">
        <a-button size="mini" type="primary" class="sms-lock-btn" @click="handleLock">
          <template #icon><icon-unlock /></template>
          {{ selectedBox.switchStatus === '0' ? '远程开锁' : '远程关锁' }}
        </a-button>
        <a-button size="mini" :type="sheetDetail ? 'primary' : 'outline'" @click="sheetDetail = !sheetDetail">
          <template #icon><icon-eye /></template>
          详情
        </a-button>
        <a-button size="mini" type="primary" class="sms-nav-btn" @click="navigateTo">
          <template #icon><icon-nav /></template>
          导航
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'
import { augustSmallBoxes, type AugustSmallBox } from '../data/august-small-boxes'

defineOptions({ name: 'AugustSmallBoxMap' })

interface GcjPoint { lng: number, lat: number }

const mapRef = ref<HTMLDivElement>()
const overflowOnly = ref(false)
const keyword = ref('')
const boxes = ref<AugustSmallBox[]>(augustSmallBoxes)
const selectedBox = ref<AugustSmallBox>()
/** 弹层是否展开详情（默认收起，重点展示关键信息） */
const sheetDetail = ref(false)
let map: AMapInstance | undefined
let markers: AMapMarker[] = []
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let gcjPoints = new WeakMap<AugustSmallBox, GcjPoint>()

/** 「未匹配」筛选值：未匹配到收集点、无法确定归属的箱体专用 sentinel，不会与真实乡镇/村庄名冲突 */
const UNMATCHED = '__unmatched__'
const townshipFilter = ref('')
const villageFilter = ref('')
/** 乡镇选项（来自箱体内置归属，含「未匹配」计数） */
const townshipOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) if (b.township) s.add(b.township)
  return Array.from(s).sort()
})
const unmatchedTownshipCount = computed(() => boxes.value.filter((b) => !b.township).length)
/** 村庄选项：随乡镇筛选联动（选定乡镇后只显示该乡镇下村庄；「未匹配」乡镇下无归属村庄，仅剩「未匹配」），避免罗列全部村庄 */
const villageOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    if (!b.village) continue
    if (townshipFilter.value && b.township !== townshipFilter.value) continue
    s.add(b.village)
  }
  return Array.from(s).sort()
})
const unmatchedVillageCount = computed(() => boxes.value.filter((b) => {
  if (b.village) return false
  if (townshipFilter.value && townshipFilter.value !== UNMATCHED) return false
  return true
}).length)
function selectTownship(val: string) {
  townshipFilter.value = val
  villageFilter.value = ''
}
function matchTownship(box: AugustSmallBox) {
  if (!townshipFilter.value) return true
  const t = box.township
  if (townshipFilter.value === UNMATCHED) return !t
  return t === townshipFilter.value
}
function matchVillage(box: AugustSmallBox) {
  if (!villageFilter.value) return true
  const v = box.village
  if (villageFilter.value === UNMATCHED) return !v
  return v === villageFilter.value
}
/** 村庄下拉搜索：按名称过滤（真实村庄名 / 未匹配） */
function villageFilterOption(inputValue: string, option: { label?: string, value?: string }) {
  const kw = inputValue.trim().toLowerCase()
  if (!kw) return true
  return String(option?.label ?? '').toLowerCase().includes(kw) || String(option?.value ?? '').toLowerCase().includes(kw)
}
const visibleBoxes = computed(() => boxes.value.filter((box) => Number.isFinite(box.longitude) && Number.isFinite(box.latitude)
  && (!overflowOnly.value || box.overflowStatus === 1)
  && matchTownship(box)
  && matchVillage(box)))
const overflowCount = computed(() => visibleBoxes.value.filter((box) => box.overflowStatus === 1).length)
/** 命中搜索的箱体：按箱号或名称模糊匹配（仅高亮，不隐藏其他箱体） */
const matchedBoxes = computed<Set<AugustSmallBox> | null>(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return null
  return new Set(boxes.value.filter((box) => box.containerNo.toLowerCase().includes(query) || box.containerName.toLowerCase().includes(query)))
})
const matchedCount = computed(() => matchedBoxes.value?.size ?? 0)

function toGcj(lng: number, lat: number): GcjPoint {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35)
  const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}

function markerTone(box: AugustSmallBox) { return box.overflowStatus === 1 ? 'overflow' : '' }
function markerClass(box: AugustSmallBox) {
  const classes = ['sm-map-marker', markerTone(box)]
  if (box === selectedBox.value) classes.push('selected')
  if (matchedBoxes.value?.has(box)) classes.push('matched')
  return classes.filter(Boolean).join(' ')
}
function getGcjPoint(box: AugustSmallBox) {
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
    const marker = new amap.Marker({ position: [point.lng, point.lat], offset: new amap.Pixel(-16, -30), content: `<div class="${markerClass(box)}">${escapeHtml(box.containerNo)}</div>`, title: box.containerName, zIndex: box === selectedBox.value ? 1000 : 10 + index })
    marker.on('click', () => selectBox(box))
    marker.setMap(map!)
    return marker
  })
  if (fit && markers.length) map.setFitView(markers, false, [40, 40, 40, 40])
}

function selectBox(box: AugustSmallBox) {
  selectedBox.value = box
  sheetDetail.value = false
  drawMarkers(false)
  const point = getGcjPoint(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 15), [point.lng, point.lat])
}
/** 关闭弹层 */
function closeSheet() {
  selectedBox.value = undefined
  sheetDetail.value = false
}
/** 搜索定位：0 条忽略 / 多条提示 / 单条定位并打开详情 */
function focusMatchedBox() {
  const matched = matchedBoxes.value
  if (!matched || matched.size === 0) return
  if (matched.size > 1) { Message.info(`匹配到 ${matched.size} 个箱体，请输入更精确的编号`); return }
  selectBox([...matched][0])
}
function statusText(box: AugustSmallBox) { return box.overflowStatus === 1 ? '满溢' : '正常' }
function statusTone(box: AugustSmallBox) { return box.overflowStatus === 1 ? 'overflow' : 'normal' }
/** 匹配对象：小勾臂箱匹配到乡镇中转站（与「小勾臂箱」列表一致） */
const transferStations: Record<string, string> = {
  '龙泉镇': '龙泉中转站',
  '马投涧镇': '马投涧中转站',
  '善应镇': '善应中转站',
  '彰武街道': '彰武中转站',
  '田村街道': '田村中转站',
  '马家乡': '马家中转站',
  '文昌街道': '文昌中转站',
}
function matchTarget(box: AugustSmallBox): string {
  if (box.township && transferStations[box.township]) return transferStations[box.township]
  return '未匹配'
}
/** 远程开锁 / 关锁（小勾臂箱）：模拟下发指令 */
function handleLock() {
  const box = selectedBox.value
  if (!box) return
  const action = box.switchStatus === '0' ? '开锁' : '关锁'
  Message.success(`已发送${action}指令到 ${box.containerName}`)
}
/** 具体位置：优先显示模拟地址（乡镇/村庄），未匹配时兜底显示 WGS84 原始坐标 */
function boxAddress(box: AugustSmallBox): string {
  if (box.township) {
    return `河南省安阳市龙安区 · ${box.township}${box.village ? ' · ' + box.village : ''}`
  }
  return `${Number(box.longitude).toFixed(5)}, ${Number(box.latitude).toFixed(5)}`
}
/** 调用手机导航（高德 URI API：可唤起高德/其他导航 App 进行驾车导航） */
function navigateTo() {
  const box = selectedBox.value
  if (!box) return
  const point = getGcjPoint(box)
  const url = `https://uri.amap.com/navigation?to=${point.lng.toFixed(6)},${point.lat.toFixed(6)},${encodeURIComponent(box.containerName)}&mode=car&coordinate=gaode&callnative=1`
  window.open(url, '_blank', 'noopener')
}

watch(overflowOnly, drawMarkers)
watch([townshipFilter, villageFilter], () => drawMarkers())
watch(keyword, () => drawMarkers(false))

onMounted(async () => {
  if (!mapRef.value) return
  try {
    amap = await loadAmapJsApi()
    map = new amap.Map(mapRef.value, { zoom: 11, center: [114.13, 36.06], viewMode: '2D', mapStyle: 'amap://styles/light', resizeEnable: true, animateEnable: false, jogEnable: false })
    drawMarkers()
  } catch { /* 地图加载失败不阻塞原型演示 */ }
})
onBeforeUnmount(() => { markers.forEach((marker) => marker.setMap(null)); map?.destroy() })
</script>

<style scoped lang="scss">
.august-sm-map { position: relative; width: 100%; min-height: 0; display: flex; flex-direction: column; }
.sm-map-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-shrink: 0; }
.sm-map-stats { display: flex; gap: 14px; }
.sm-stat { font-size: 12px; color: #4e5969; b { color: #165dff; font-size: 15px; } }
.sm-stat.danger b { color: #f53f3f; }
.sm-overflow-btn { padding: 3px 12px; font-size: 12px; color: #86909c; background: #fff; border: 1px solid #e5e6eb; border-radius: 12px; cursor: pointer; transition: all .2s; &.active { background: #f53f3f; border-color: #f53f3f; color: #fff; } }
/* 箱号搜索（单独一行，放大突出） */
.sm-map-search { margin-bottom: 4px; flex-shrink: 0; }
.sm-map-search :deep(.arco-input) { font-size: 14px; }
.sm-search-locate { font-size: 12px; color: #165dff; cursor: pointer; white-space: nowrap; user-select: none; }
.sm-search-hint { margin-bottom: 6px; font-size: 11px; color: #86909c; flex-shrink: 0; }
/* 筛选行 */
.sm-filter-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-shrink: 0; }
.sm-filter-label { flex-shrink: 0; font-size: 12px; color: #86909c; }
.sm-chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.sm-chips::-webkit-scrollbar { display: none; }
.sm-chip { flex-shrink: 0; padding: 3px 11px; font-size: 12px; line-height: 16px; color: #4e5969; background: #fff; border: 1px solid #e5e6eb; border-radius: 12px; cursor: pointer; transition: all .2s; white-space: nowrap; }
.sm-chip.active { background: #165dff; border-color: #165dff; color: #fff; }
.sm-chip-unmatched { color: #86909c; }
.sm-chip-unmatched.active { background: #f53f3f; border-color: #f53f3f; color: #fff; }
.sm-village-select { flex: 1; min-width: 0; }
.sm-village-select :deep(.arco-select-view) { font-size: 13px; }
.sm-opt-unmatched { color: #86909c; em { margin-left: 4px; font-style: normal; color: #f53f3f; font-weight: 600; } }
/* 地图容器 */
.sm-map-wrap { position: relative; flex: 1; min-height: 0; width: 100%; }
.sm-map-container { position: absolute; inset: 0; background: #eef0f4; border-radius: 8px; overflow: hidden; }
/* 底部弹出详情层 */
.sm-map-sheet { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 6px 14px 12px; background: #fff; border-radius: 12px; box-shadow: 0 -4px 24px rgb(0 0 0 / 18%); z-index: 5; }
.sms-handle { width: 36px; height: 4px; margin: 0 auto 8px; border-radius: 2px; background: #e5e6eb; cursor: pointer; }
.sms-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.sms-type-ic { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; background: #f2f3f5; color: #165dff; font-size: 20px; flex-shrink: 0; }
.sms-head-text { flex: 1; min-width: 0; }
.sms-no-main { display: block; font-size: 16px; font-weight: 700; color: #1d2129; line-height: 1.3; }
.sms-status-tag { font-size: 12px; padding: 2px 9px; border-radius: 8px; flex-shrink: 0; }
.sms-status-tag.status-normal { background: #e8ffea; color: #00b42a; }
.sms-status-tag.status-overflow { background: #fff0f0; color: #f53f3f; }
.sms-close-btn { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; font-size: 14px; color: #86909c; background: #f2f3f5; border: none; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
.sms-close-btn:hover { color: #1d2129; background: #e8eaed; }
/* 位置行（乡镇 · 村庄） */
.sms-loc { display: flex; align-items: center; gap: 3px; font-size: 13px; color: #4e5969; margin-top: 2px; }
.sms-loc-ic { color: #165dff; font-size: 14px; }
/* 关键信息：满溢率 / 电量（与「小勾臂箱」列表卡片一致） */
.sms-gauges { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.sms-gauge { display: flex; align-items: center; gap: 8px; }
.sms-g-label { font-size: 12px; color: #86909c; width: 48px; flex-shrink: 0; }
.sms-g-bar-bg { flex: 1; height: 6px; background: #eef0f4; border-radius: 3px; overflow: hidden; }
.sms-g-bar { height: 100%; border-radius: 3px; background: #00b42a; }
.sms-gauge .bar-overflow { background: #f53f3f; }
.sms-gauge .bar-battery { background: #165dff; }
.sms-gauge .bar-offline { background: #86909c; }
.sms-g-val { font-size: 13px; font-weight: 600; color: #1d2129; width: 40px; text-align: right; }
.sms-g-val.val-overflow { color: #f53f3f; }
.sms-g-val.val-offline { color: #86909c; }
/* 匹配对象 */
.sms-match { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
.sms-m-label { color: #86909c; }
.sms-m-value { color: #165dff; font-weight: 500; }
/* 展开详情 */
.sms-detail { margin-bottom: 10px; padding: 10px 12px; background: #f7f8fa; border-radius: 8px; display: flex; flex-direction: column; gap: 7px; }
.sms-detail-row { display: flex; justify-content: space-between; font-size: 13px; span { color: #86909c; flex-shrink: 0; margin-right: 8px; } b { color: #1d2129; text-align: right; word-break: break-all; } }
.sms-actions { display: flex; gap: 6px; }
.sms-lock-btn { background: #165dff; border-color: #165dff; }
.sms-nav-btn { background: #165dff; border-color: #165dff; }
/* 底部弹出层 */
:global(.sm-map-marker) { position: relative; min-width: 32px; height: 22px; padding: 0 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 11px; font-weight: 600; }
:global(.sm-map-marker::after) { content: ''; position: absolute; bottom: -5px; left: 50%; width: 8px; height: 8px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }
:global(.sm-map-marker.overflow) { background: #f53f3f; }
:global(.sm-map-marker.matched) { box-shadow: 0 0 0 3px #00b42a, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.12); z-index: 1; }
:global(.sm-map-marker.selected) { border: 2px solid #fff; box-shadow: 0 0 0 3px #165dff, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.15); z-index: 2; }
</style>

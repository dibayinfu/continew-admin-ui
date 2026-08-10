<template>
  <div class="august-sm-map">
    <!-- 地图工具栏（手机端精简） -->
    <div class="sm-map-toolbar">
      <div class="sm-map-stats">
        <span class="sm-stat">共 <b>{{ boxes.length }}</b> 箱</span>
        <span class="sm-stat danger">满溢 <b>{{ overflowCount }}</b></span>
      </div>
      <span class="sm-overflow-btn" :class="{ active: overflowOnly }" @click="overflowOnly = !overflowOnly">只看满溢</span>
    </div>

    <div class="sm-map-search">
      <a-input v-model="keyword" allow-clear size="small" placeholder="输入箱号搜索定位" @press-enter="focusMatchedBox">
        <template #prefix><icon-search /></template>
      </a-input>
      <span v-if="keyword.trim()" class="sm-search-result">{{ matchedCount ? `匹配到 ${matchedCount} 个` : '无匹配' }}</span>
    </div>

    <div ref="mapRef" class="sm-map-container"></div>

    <!-- 选中箱体详情：从底部弹出层 -->
    <Transition name="sm-sheet">
      <div v-if="selectedBox" class="sm-map-sheet">
        <!-- 拖拽把手 -->
        <div class="sms-handle" @click="selectedBox = undefined"></div>

        <div class="sms-head">
          <div>
            <span class="sms-no">箱体编号 {{ selectedBox.containerNo }}</span>
            <h4>{{ selectedBox.containerName }}</h4>
          </div>
          <div class="sms-head-right">
            <a-tag :color="statusColor(selectedBox)">{{ statusText(selectedBox) }}</a-tag>
            <a-button type="text" size="mini" class="sms-close-btn" @click="selectedBox = undefined">
              <template #icon><icon-close /></template>
            </a-button>
          </div>
        </div>

        <div class="sms-grid">
          <div><span>垃圾占比</span><b>{{ selectedBox.fillLevel }}%</b></div>
          <div><span>容量</span><b>{{ selectedBox.capacity }} 吨</b></div>
          <div><span>温度</span><b>{{ selectedBox.temperature }}℃</b></div>
          <div><span>电量</span><b>{{ selectedBox.voltage }}%</b></div>
          <div><span>在线状态</span><b>{{ selectedBox.onlineStatus === 0 ? '在线' : '离线' }}</b></div>
          <div><span>开关状态</span><b>{{ selectedBox.switchStatus === '0' ? '关' : '开' }}</b></div>
        </div>

        <div class="sms-info">
          <div class="sms-info-row"><span>具体位置</span><b>{{ boxAddress(selectedBox) }}</b></div>
          <div class="sms-info-row"><span>所属乡镇</span><b>{{ selectedBox.township || '未匹配' }}{{ selectedBox.village ? ' · ' + selectedBox.village : '' }}</b></div>
          <div class="sms-info-row"><span>设备号</span><b>{{ selectedBox.deviceNo }}</b></div>
          <div class="sms-info-row"><span>上报时间</span><b>{{ selectedBox.reportTime }}</b></div>
        </div>

        <div class="sms-actions">
          <a-button size="mini" type="primary" long class="sms-nav-btn" @click="navigateTo">
            <template #icon><icon-nav /></template>
            导航
          </a-button>
        </div>
      </div>
    </Transition>
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
let map: AMapInstance | undefined
let markers: AMapMarker[] = []
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let gcjPoints = new WeakMap<AugustSmallBox, GcjPoint>()

const visibleBoxes = computed(() => boxes.value.filter((box) => Number.isFinite(box.longitude) && Number.isFinite(box.latitude)
  && (!overflowOnly.value || box.overflowStatus === 1)))
const overflowCount = computed(() => boxes.value.filter((box) => box.overflowStatus === 1).length)
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

function markerTone(box: AugustSmallBox) { return box.overflowStatus === 1 ? 'overflow' : box.fillLevel >= 70 ? 'warning' : '' }
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
  drawMarkers(false)
  const point = getGcjPoint(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 15), [point.lng, point.lat])
}
/** 搜索定位：0 条忽略 / 多条提示 / 单条定位并打开详情 */
function focusMatchedBox() {
  const matched = matchedBoxes.value
  if (!matched || matched.size === 0) return
  if (matched.size > 1) { Message.info(`匹配到 ${matched.size} 个箱体，请输入更精确的编号`); return }
  selectBox([...matched][0])
}
function statusText(box: AugustSmallBox) { return box.overflowStatus === 1 ? '满溢' : box.fillLevel >= 70 ? '接近满溢' : '正常' }
function statusColor(box: AugustSmallBox) { return box.overflowStatus === 1 ? 'red' : box.fillLevel >= 70 ? 'orange' : 'green' }
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
.sm-map-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-shrink: 0; }
.sm-map-stats { display: flex; gap: 14px; }
.sm-stat { font-size: 12px; color: #4e5969; b { color: #165dff; font-size: 15px; } }
.sm-stat.danger b { color: #f53f3f; }
.sm-overflow-btn { padding: 3px 12px; font-size: 12px; color: #86909c; background: #fff; border: 1px solid #e5e6eb; border-radius: 12px; cursor: pointer; transition: all .2s; &.active { background: #f53f3f; border-color: #f53f3f; color: #fff; } }
.sm-map-search { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-shrink: 0; }
.sm-map-search :deep(.arco-input) { font-size: 13px; }
.sm-search-result { font-size: 12px; color: #86909c; white-space: nowrap; }
.sm-map-container { flex: 1; min-height: 0; width: 100%; background: #eef0f4; border-radius: 8px; overflow: hidden; }
/* 底部弹出详情层 */
.sm-map-sheet { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 6px 14px 12px; background: #fff; border-radius: 12px; box-shadow: 0 -4px 24px rgb(0 0 0 / 18%); z-index: 5; }
.sms-handle { width: 36px; height: 4px; margin: 0 auto 8px; border-radius: 2px; background: #e5e6eb; cursor: pointer; }
.sms-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.sms-head-right { display: flex; align-items: center; gap: 6px; }
.sms-close-btn { color: #86909c; &:hover { color: #1d2129; } }
.sms-no { font-size: 11px; color: #86909c; } .sms-head h4 { margin: 2px 0 0; font-size: 15px; color: #1d2129; }
.sms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
.sms-grid div { display: flex; flex-direction: column; align-items: center; padding: 6px 2px; background: #f7f8fa; border-radius: 6px; }
.sms-grid span { font-size: 9px; color: #86909c; } .sms-grid b { font-size: 12px; color: #1d2129; margin-top: 1px; }
.sms-info { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.sms-info-row { display: flex; justify-content: space-between; font-size: 11px; span { color: #86909c; flex-shrink: 0; } b { color: #4e5969; text-align: right; word-break: break-all; } }
.sms-actions { display: flex; gap: 6px; }
.sms-nav-btn { background: #165dff; border-color: #165dff; }
/* 底部弹出动画 */
.sm-sheet-enter-active { transition: transform .28s cubic-bezier(.18, .89, .32, 1.1), opacity .22s ease; }
.sm-sheet-leave-active { transition: transform .2s ease, opacity .2s ease; }
.sm-sheet-enter-from, .sm-sheet-leave-to { transform: translateY(100%); opacity: 0; }
:global(.sm-map-marker) { position: relative; min-width: 32px; height: 22px; padding: 0 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 11px; font-weight: 600; }
:global(.sm-map-marker::after) { content: ''; position: absolute; bottom: -5px; left: 50%; width: 8px; height: 8px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }
:global(.sm-map-marker.warning) { background: #ff7d00; } :global(.sm-map-marker.overflow) { background: #f53f3f; }
:global(.sm-map-marker.matched) { box-shadow: 0 0 0 3px #00b42a, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.12); z-index: 1; }
:global(.sm-map-marker.selected) { border: 2px solid #fff; box-shadow: 0 0 0 3px #165dff, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.15); z-index: 2; }
</style>

<template>
  <div class="task-track-map">
    <div ref="mapWrapRef" class="map-fullscreen-wrap">
      <div ref="mapContainer" class="map-container" />
      <button class="map-fullscreen-btn" :title="isMapFullscreen ? '退出全屏' : '全屏放大'" @click="toggleMapFullscreen">
        <icon-fullscreen-exit v-if="isMapFullscreen" />
        <icon-fullscreen v-else />
      </button>
    </div>
    <div class="map-legend">
      <span><i class="legend-line actual"></i>实际轨迹</span>
      <span><i class="legend-line planned"></i>未完成路段</span>
      <span><i class="legend-dot start"></i>始发围栏</span>
      <span><i class="legend-dot dest"></i>目的围栏</span>
      <span v-if="weight && weight > 0" class="legend-weight">称重 <b>{{ weight }} t</b></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { type AMapInstance, type AMapMarker, type AMapOverlay, loadAmapJsApi } from '@/utils/amap'
import type { TrackPoint } from '../data/alert-task'

const props = defineProps<{
  track: TrackPoint[]
  weight?: number
  showWeight?: boolean
}>()

const mapContainer = ref<HTMLDivElement>()
const mapWrapRef = ref<HTMLElement>()
const { isFullscreen: isMapFullscreen, toggle: toggleMapFullscreen } = useFullscreen(mapWrapRef, {
  onFullscreenChange: () => setTimeout(() => map?.resize(), 300),
})

let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let map: AMapInstance | null = null
let overlays: AMapOverlay[] = []

function clearOverlays() {
  overlays.forEach((o) => o.setMap(null))
  overlays = []
}

async function initMap() {
  if (!mapContainer.value) return
  if (!amap) {
    try {
      amap = await loadAmapJsApi()
    } catch (error) {
      console.error('高德地图加载失败', error)
      return
    }
  }
  if (map) { map.destroy(); map = null }
  clearOverlays()

  const allPoints = props.track.filter((p) => p.lng != null && p.lat != null)
  if (allPoints.length === 0) return

  // 计算中心（高德坐标为 [lng, lat]）
  const lngs = allPoints.map((p) => p.lng)
  const lats = allPoints.map((p) => p.lat)
  const center: [number, number] = [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ]

  map = new amap.Map(mapContainer.value, {
    zoom: 14,
    center,
    viewMode: '2D',
    mapStyle: 'amap://styles/light',
    resizeEnable: true,
    animateEnable: false,
    jogEnable: false,
  })

  // ---- 轨迹连线：已走路段实线，未完成路段虚线 ----
  const completed = allPoints.filter((p) => p.done).map((p) => [p.lng, p.lat] as [number, number])
  let lastDoneIndex = -1
  for (let index = allPoints.length - 1; index >= 0; index -= 1) {
    if (allPoints[index].done) {
      lastDoneIndex = index
      break
    }
  }
  const planned = lastDoneIndex >= 0
    ? allPoints.slice(lastDoneIndex).map((p) => [p.lng, p.lat] as [number, number])
    : allPoints.map((p) => [p.lng, p.lat] as [number, number])

  if (completed.length >= 2) {
    const line = new amap.Polyline({
      path: completed,
      strokeColor: '#0e42d2',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
    })
    line.setMap(map)
    overlays.push(line)
  }

  if (planned.length >= 2 && allPoints.some((p) => !p.done)) {
    const line = new amap.Polyline({
      path: planned,
      strokeColor: '#86909c',
      strokeWeight: 4,
      strokeOpacity: 0.75,
      strokeStyle: 'dashed',
      strokeDasharray: [8, 8],
      lineJoin: 'round',
      lineCap: 'round',
    })
    line.setMap(map)
    overlays.push(line)
  }

  const allMarkers: AMapMarker[] = []

  // 车辆当前位置
  const currentPoint = [...allPoints].reverse().find((p) => p.done)
  if (currentPoint) {
    const marker = new amap.Marker({
      position: [currentPoint.lng, currentPoint.lat],
      offset: new amap.Pixel(-15, -15),
      content: '<div class="vehicle-marker"><div class="vehicle-dot">车</div></div>',
      zIndex: 30,
    })
    marker.setMap(map)
    overlays.push(marker)
    allMarkers.push(marker)
  }

  // ---- 电子围栏圈：始发点 & 目的地 ----
  const fencePoints = allPoints.filter((p) => p.label === '始发点' || p.label === '目的地')
  fencePoints.forEach((p) => {
    const isStart = p.label === '始发点'
    const circle = new amap.Circle({
      center: new amap.LngLat(p.lng, p.lat),
      radius: p.fenceRadius || 500,
      strokeColor: isStart ? '#0e42d2' : '#7a35d8',
      strokeOpacity: p.done ? 0.65 : 0.4,
      strokeWeight: 2,
      strokeStyle: p.done ? 'solid' : 'dashed',
      fillColor: isStart ? '#0e42d2' : '#7a35d8',
      fillOpacity: p.done ? 0.09 : 0.05,
    })
    circle.setMap(map)
    overlays.push(circle)
  })

  // ---- 标记点：所有关键事件点（统一蓝/灰），点击弹出信息 ----
  const doneColor = '#165dff'
  const pendingColor = '#a9aeb8'
  const keyPoints = allPoints.filter((p) => p.label)

  keyPoints.forEach((p) => {
    const isDone = p.done
    const color = isDone ? doneColor : pendingColor
    const dotSize = 14
    const outerSize = dotSize + 8
    const dotHtml = isDone
      ? `<div class="tm-dot" style="width:${outerSize}px;height:${outerSize}px;background:${color}33;border-color:${color}"><span style="width:${dotSize}px;height:${dotSize}px;background:${color};border-color:${color}"></span></div>`
      : `<div class="tm-dot tm-pending" style="width:${outerSize}px;height:${outerSize}px;border-color:${color}44"><span style="width:${dotSize}px;height:${dotSize}px;background:${color}88;border-color:${color}44"></span></div>`

    const marker = new amap.Marker({
      position: [p.lng, p.lat],
      offset: new amap.Pixel(-outerSize / 2, -outerSize / 2),
      content: `<div class="track-marker">${dotHtml}<div class="tm-label${isDone ? '' : ' tm-label-pending'}">${p.label}</div></div>`,
      zIndex: 20,
    })
    marker.setMap(map)
    overlays.push(marker)
    allMarkers.push(marker)

    const timeHtml = `<div class="tm-popup-time${isDone ? '' : ' tm-popup-pending'}">🕐 ${p.time}</div>`
    const info = new amap.InfoWindow({
      content: `<div class="tm-popup">
        <div class="tm-popup-title">${p.label}</div>
        <div class="tm-popup-addr">${p.address || ''}</div>
        ${timeHtml}
        ${p.fenceRadius ? `<div class="tm-popup-fence">围栏半径 ${p.fenceRadius}m</div>` : ''}
      </div>`,
      offset: new amap.Pixel(0, -outerSize / 2 - 10),
    })
    marker.on('click', () => info.open(map!, [p.lng, p.lat]))
  })

  if (allMarkers.length) map.setFitView(allMarkers, false, [60, 60, 60, 60])
}

onMounted(() => nextTick(() => initMap()))
watch(() => props.track, () => nextTick(() => initMap()), { deep: true })

function focusStartPoint() {
  const startPoint = props.track.find((p) => p.lng != null && p.lat != null)
  if (!map || !startPoint) return
  map.setZoomAndCenter(17, [startPoint.lng, startPoint.lat])
}

defineExpose({ focusStartPoint })

onBeforeUnmount(() => { if (map) { map.destroy(); map = null } })
</script>

<style scoped>
.task-track-map {
  position: relative;
  width: 100%;
}

.map-fullscreen-wrap {
  position: relative;
}

.map-fullscreen-wrap:fullscreen {
  width: 100vw;
  height: 100vh;
  background: #f2f3f5;

  .map-container {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
}

.map-fullscreen-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  color: #4e5969;
  background: rgb(255 255 255 / 94%);
  border: none;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgb(0 0 0 / 10%);
  cursor: pointer;
}

.map-container {
  width: 100%;
  height: 440px;
  border-radius: 6px;
  overflow: hidden;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  align-items: center;
  padding: 8px 2px 0;
  font-size: 12px;
  color: var(--color-text-3);
}

.legend-line {
  display: inline-block;
  width: 18px;
  height: 0;
  margin-right: 4px;
  vertical-align: middle;
  border-top: 3px solid #0e42d2;
  border-radius: 999px;
}

.legend-line.planned {
  border-top-color: #86909c;
  border-top-style: dashed;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 4px;
  vertical-align: middle;
  border-radius: 50%;
  background: #0e42d2;
}

.legend-dot.dest {
  background: #7a35d8;
}

.legend-weight {
  padding: 1px 6px;
  font-size: 12px;
  color: var(--color-text-1);
  background: var(--color-fill-2);
  border-radius: 4px;
}
</style>

<style>
/* 全局：标记点样式 */
.track-marker {
  position: relative;
  background: none !important;
  border: none !important;
}

.tm-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.tm-dot span {
  display: block;
  border-radius: 50%;
  border: 2px solid;
  box-sizing: border-box;
}

.tm-dot.tm-pending {
  background: transparent;
}

.tm-label {
  position: absolute;
  left: 50%;
  top: calc(100% + 2px);
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
  text-shadow: 0 0 4px #fff, 0 0 4px #fff;
}

.tm-label-pending {
  color: var(--color-text-4);
}

/* 弹出框 */
.tm-popup {
  min-width: 150px;
}

.tm-popup-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.tm-popup-addr {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.tm-popup-time {
  font-size: 12px;
  color: #0e42d2;
}

.tm-popup-pending {
  color: #86909c;
}

.tm-popup-fence {
  margin-top: 2px;
  font-size: 12px;
  color: #7a35d8;
}

.vehicle-marker {
  background: none !important;
  border: none !important;
}

.vehicle-dot {
  width: 30px;
  height: 30px;
  border: 2px solid #fff;
  border-radius: 50%;
  color: #fff;
  background: #f53f3f;
  box-shadow: 0 2px 8px rgba(0,0,0,0.24);
  font-size: 12px;
  font-weight: 700;
  line-height: 26px;
  text-align: center;
}
</style>

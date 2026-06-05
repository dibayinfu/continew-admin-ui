<template>
  <div class="task-track-map">
    <div ref="mapContainer" class="map-container" />
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
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TrackPoint } from '../data/alert-task'

const props = defineProps<{
  track: TrackPoint[]
  weight?: number
  showWeight?: boolean
}>()

const mapContainer = ref<HTMLDivElement>()
let map: L.Map | null = null

function initMap() {
  if (!mapContainer.value) return
  if (map) { map.remove(); map = null }

  const allPoints = props.track.filter((p) => p.lng != null && p.lat != null)
  if (allPoints.length === 0) return

  // 关键事件点（有 label）和中间途经点
  const keyPoints = allPoints.filter((p) => p.label)

  // 计算中心
  const lngs = allPoints.map((p) => p.lng)
  const lats = allPoints.map((p) => p.lat)
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2

  map = L.map(mapContainer.value, {
    center: [centerLat, centerLng],
    zoom: 14,
    zoomControl: true,
    attributionControl: false,
  })

  // 高德瓦片（优先）
  const amapLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    maxZoom: 18, subdomains: ['webrd01', 'webrd02', 'webrd03', 'webrd04'],
  })
  const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
  amapLayer.addTo(map)
  amapLayer.on('tileerror', () => {
    map?.removeLayer(amapLayer)
    if (!map?.hasLayer(osmLayer)) osmLayer.addTo(map!)
  })

  // ---- 轨迹连线：按车辆实际轨迹点绘制，已走路段实线，未完成路段虚线 ----
  const completedLatLngs = allPoints.filter((p) => p.done).map((p) => [p.lat, p.lng] as [number, number])
  let lastDoneIndex = -1
  for (let index = allPoints.length - 1; index >= 0; index -= 1) {
    if (allPoints[index].done) {
      lastDoneIndex = index
      break
    }
  }
  const plannedLatLngs = lastDoneIndex >= 0
    ? allPoints.slice(lastDoneIndex).map((p) => [p.lat, p.lng] as [number, number])
    : allPoints.map((p) => [p.lat, p.lng] as [number, number])

  if (completedLatLngs.length >= 2) {
    L.polyline(completedLatLngs, {
      color: '#0e42d2',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)
  }

  if (plannedLatLngs.length >= 2 && allPoints.some((p) => !p.done)) {
    L.polyline(plannedLatLngs, {
      color: '#86909c',
      weight: 4,
      opacity: 0.75,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)
  }

  const currentPoint = [...allPoints].reverse().find((p) => p.done)
  if (currentPoint) {
    const vehicleIcon = L.divIcon({
      className: 'vehicle-marker',
      html: '<div class="vehicle-dot">车</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
    L.marker([currentPoint.lat, currentPoint.lng], { icon: vehicleIcon }).addTo(map)
  }

  // ---- 电子围栏圈：始发点 & 目的地 ----
  const fencePoints = allPoints.filter((p) => p.label === '始发点' || p.label === '目的地')
  fencePoints.forEach((p) => {
    const isDone = p.done
    const isStart = p.label === '始发点'
    L.circle([p.lat, p.lng], {
      radius: p.fenceRadius || 500,
      color: isStart ? '#0e42d2' : '#7a35d8',
      weight: 2,
      opacity: isDone ? 0.65 : 0.4,
      fillColor: isStart ? '#0e42d2' : '#7a35d8',
      fillOpacity: isDone ? 0.09 : 0.05,
      dashArray: isDone ? undefined : '6, 4',
    }).addTo(map).bindTooltip(`${p.label}电子围栏 ${p.fenceRadius || 500}m`, {
      permanent: false,
      direction: 'top',
    })
  })

  // ---- 标记点：所有关键事件点都显示 ----
  const labelColors: Record<string, { bg: string; border: string }> = {
    '始发点': { bg: '#0e42d2', border: '#0e42d2' },
    '装车': { bg: '#ff7d00', border: '#ff7d00' },
    '目的地': { bg: '#7a35d8', border: '#7a35d8' },
    '卸车': { bg: '#00b42a', border: '#00b42a' },
  }

  keyPoints.forEach((p) => {
    const colors = labelColors[p.label] || { bg: '#86909c', border: '#86909c' }
    const isDone = p.done
    const dotSize = 14
    const outerSize = dotSize + 8

    const markerIcon = L.divIcon({
      className: 'track-marker',
      html: isDone
        ? `<div class="tm-dot" style="width:${outerSize}px;height:${outerSize}px;background:${colors.bg}33;border-color:${colors.border}">
             <span style="width:${dotSize}px;height:${dotSize}px;background:${colors.bg};border-color:${colors.border}"></span>
           </div>
           <div class="tm-label">${p.label}</div>`
        : `<div class="tm-dot tm-pending" style="width:${outerSize}px;height:${outerSize}px;border-color:${colors.border}44">
             <span style="width:${dotSize}px;height:${dotSize}px;background:${colors.border}88;border-color:${colors.border}44"></span>
           </div>
           <div class="tm-label tm-label-pending">${p.label}</div>`,
      iconSize: [outerSize, outerSize + 20],
      iconAnchor: [outerSize / 2, outerSize / 2],
    })

    const marker = L.marker([p.lat, p.lng], { icon: markerIcon }).addTo(map!)

    const timeHtml = isDone
      ? `<div class="tm-popup-time">🕐 ${p.time}</div>`
      : `<div class="tm-popup-time tm-popup-pending">🕐 ${p.time}</div>`

    marker.bindPopup(`
      <div class="tm-popup">
        <div class="tm-popup-title">${p.label}</div>
        <div class="tm-popup-addr">${p.address}</div>
        ${timeHtml}
        ${p.fenceRadius ? `<div class="tm-popup-fence">围栏半径 ${p.fenceRadius}m</div>` : ''}
      </div>
    `)
  })

  // 自动适配边界
  const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng] as [number, number]))
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
  setTimeout(() => map?.invalidateSize(), 300)
}

onMounted(() => nextTick(() => initMap()))

watch(() => props.track, () => nextTick(() => initMap()), { deep: true })

onBeforeUnmount(() => { if (map) { map.remove(); map = null } })
</script>

<style scoped>
.task-track-map {
  position: relative;
  width: 100%;
}

.map-container {
  width: 100%;
  height: 360px;
  border-radius: 6px;
  overflow: hidden;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  padding: 10px 2px 0;
  font-size: 14px;
  color: var(--color-text-2);
}

.legend-line {
  display: inline-block;
  width: 28px;
  height: 0;
  margin-right: 6px;
  vertical-align: middle;
  border-top: 4px solid #0e42d2;
  border-radius: 999px;
}

.legend-line.planned {
  border-top-color: #86909c;
  border-top-style: dashed;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  vertical-align: middle;
  border-radius: 50%;
  background: #0e42d2;
}

.legend-dot.dest {
  background: #7a35d8;
}

.legend-weight {
  padding: 2px 8px;
  color: var(--color-text-1);
  background: var(--color-fill-2);
  border-radius: 4px;
}
</style>

<style>
/* 全局：标记点样式 */
.track-marker {
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

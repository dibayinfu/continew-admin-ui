<template>
  <div class="august-nav-page">
    <!-- 全屏地图 -->
    <div ref="mapRef" class="nav-amap"></div>

    <!-- 返回按钮 -->
    <button type="button" class="nav-back" @click="goBack"><icon-left /></button>

    <!-- 底部信息条 -->
    <div class="nav-sheet">
      <div class="nav-sheet-main">
        <span class="nav-no">{{ box.boxNo }}</span>
        <h3>{{ box.boxName }}</h3>
        <span class="nav-addr"><icon-location />{{ boxAddress }}</span>
      </div>
      <a-button type="primary" long class="nav-start-btn" @click="startNav">
        <template #icon><icon-nav /></template>
        开始导航
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type AMapInstance, type AMapMarker, loadAmapJsApi } from '@/utils/amap'

defineOptions({ name: 'SanitationAugustBoxNavigation' })

interface GcjPoint { lng: number, lat: number }

const route = useRoute()
const router = useRouter()

const box = {
  boxNo: String(route.query.no || ''),
  boxName: String(route.query.name || ''),
  town: String(route.query.town || ''),
  village: String(route.query.village || ''),
  longitude: Number(route.query.lng),
  latitude: Number(route.query.lat),
  fillRate: Number(route.query.fillRate ?? 0),
}

const mapRef = ref<HTMLDivElement>()
let map: AMapInstance | undefined
let marker: AMapMarker | undefined
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined

const boxAddress = computed(() => {
  if (box.town) return `河南省安阳市龙安区 · ${box.town}${box.village ? ' · ' + box.village : ''}`
  return `${box.longitude.toFixed(5)}, ${box.latitude.toFixed(5)}`
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

function goBack() { router.back() }
/** 调起手机导航（高德 URI API） */
function startNav() {
  if (!Number.isFinite(box.longitude) || !Number.isFinite(box.latitude)) return
  const point = toGcj(box.longitude, box.latitude)
  const url = `https://uri.amap.com/navigation?to=${point.lng.toFixed(6)},${point.lat.toFixed(6)},${encodeURIComponent(box.boxName)}&mode=car&coordinate=gaode&callnative=1`
  window.open(url, '_blank', 'noopener')
}

onMounted(async () => {
  if (!mapRef.value) return
  try {
    amap = await loadAmapJsApi()
    const point = toGcj(box.longitude, box.latitude)
    map = new amap.Map(mapRef.value, { zoom: 15, center: [point.lng, point.lat], viewMode: '2D', mapStyle: 'amap://styles/light', resizeEnable: true, animateEnable: false, jogEnable: false })
    marker = new amap.Marker({ position: [point.lng, point.lat], content: `<div class="nav-marker">${box.boxNo}</div>`, title: box.boxName })
    marker.setMap(map!)
  } catch { /* 地图加载失败不阻塞原型演示 */ }
})
onBeforeUnmount(() => { marker?.setMap(null); map?.destroy() })
</script>

<style scoped lang="scss">
.august-nav-page { position: relative; width: 100%; height: calc(100vh - 112px); min-height: 520px; background: #eef0f4; overflow: hidden; }
.nav-amap { position: absolute; inset: 0; }
.nav-back { position: absolute; top: 14px; left: 14px; z-index: 2; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: none; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgb(0 0 0 / 16%); color: #1d2129; font-size: 18px; cursor: pointer; }
.nav-sheet { position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 2; padding: 14px 16px; background: #fff; border-radius: 12px; box-shadow: 0 -4px 20px rgb(0 0 0 / 12%); }
.nav-sheet-main { margin-bottom: 10px; }
.nav-no { font-size: 12px; color: #86909c; }
.nav-sheet h3 { margin: 2px 0 6px; font-size: 17px; color: #1d2129; }
.nav-addr { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #4e5969; }
.nav-start-btn { background: #165dff; border-color: #165dff; }
:global(.nav-marker) { position: relative; min-width: 36px; height: 26px; padding: 0 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #f53f3f; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 12px; font-weight: 600; }
:global(.nav-marker::after) { content: ''; position: absolute; bottom: -6px; left: 50%; width: 10px; height: 10px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }
</style>

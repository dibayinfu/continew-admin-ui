<template>
  <a-modal
    :visible="visible"
    title="地图选点"
    :width="820"
    :footer="false"
    :mask-closable="false"
    unmount-on-close
    @cancel="handleCancel"
    @open="onModalOpen"
  >
    <div class="map-picker-body">
      <div class="map-toolbar">
        <a-input-search
          v-model="searchText"
          placeholder="搜索地址（如：安阳市龙安区马投涧镇）"
          search-button
          allow-clear
          :loading="searching"
          @search="handleSearch"
        />
      </div>
      <div ref="mapContainer" class="map-container" />
      <div v-if="searchResults.length > 0" class="search-results">
        <div
          v-for="(item, index) in searchResults"
          :key="index"
          class="search-result-item"
          @click="selectSearchResult(item)"
        >
          <icon-location />
          <span>{{ item.name }}</span>
        </div>
      </div>
      <div class="coord-panel">
        <a-space>
          <a-input :model-value="formattedLng" placeholder="经度" readonly>
            <template #prefix>经度</template>
          </a-input>
          <a-input :model-value="formattedLat" placeholder="纬度" readonly>
            <template #prefix>纬度</template>
          </a-input>
          <a-button type="primary" @click="handleConfirm">确认</a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
        <div class="coord-hint">点击地图任意位置或拖动标记可设置坐标</div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 修复 Leaflet 默认图标路径问题
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const props = defineProps<{
  visible: boolean
  longitude?: number
  latitude?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'confirm', data: { longitude: number; latitude: number }): void
}>()

// 龙安区中心坐标（默认定位）
const DEFAULT_CENTER: [number, number] = [36.058, 114.338]
const DEFAULT_ZOOM = 13

const mapContainer = ref<HTMLDivElement>()
const searchText = ref('')
const searching = ref(false)
const searchResults = ref<Array<{ name: string; lat: number; lng: number }>>([])
const selectedLng = ref(props.longitude ?? DEFAULT_CENTER[1])
const selectedLat = ref(props.latitude ?? DEFAULT_CENTER[0])

let map: L.Map | null = null
let marker: L.Marker | null = null

const formattedLng = computed(() => selectedLng.value.toFixed(6))
const formattedLat = computed(() => selectedLat.value.toFixed(6))

function onModalOpen() {
  // 模态框打开动画完成后初始化地图
  nextTick(() => {
    selectedLng.value = props.longitude ?? DEFAULT_CENTER[1]
    selectedLat.value = props.latitude ?? DEFAULT_CENTER[0]
    initMap()
    // 等待一帧确保布局完成后再纠正尺寸
    requestAnimationFrame(() => map?.invalidateSize())
  })
}

function initMap() {
  if (!mapContainer.value || map) return

  map = L.map(mapContainer.value, {
    center: [selectedLat.value, selectedLng.value],
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
    attributionControl: false,
  })

  // 使用多源瓦片（优先高德，兜底 OSM，确保国内国外都能显示）
  const amapLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    maxZoom: 18, subdomains: ['webrd01', 'webrd02', 'webrd03', 'webrd04'],
  })
  const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  })

  amapLayer.addTo(map)
  // 如果高德瓦片加载失败，自动切到 OSM
  amapLayer.on('tileerror', () => {
    map?.removeLayer(amapLayer)
    if (!map?.hasLayer(osmLayer)) osmLayer.addTo(map!)
  })

  // 添加标记
  marker = L.marker([selectedLat.value, selectedLng.value], { draggable: true }).addTo(map)

  marker.on('dragend', () => {
    const pos = marker!.getLatLng()
    selectedLat.value = pos.lat
    selectedLng.value = pos.lng
  })

  map.on('click', (e: L.LeafletMouseEvent) => {
    selectedLat.value = e.latlng.lat
    selectedLng.value = e.latlng.lng
    if (marker) {
      marker.setLatLng(e.latlng)
    }
  })

  // 后备：确保地图尺寸正确
  setTimeout(() => map?.invalidateSize(), 500)
}

function handleSearch() {
  const q = searchText.value.trim()
  if (!q || !map) return
  searching.value = true
  searchResults.value = []

  const amapKey = import.meta.env.VITE_AMAP_KEY

  if (amapKey) {
    // 使用高德地图地理编码 API（不限城市范围）
    fetchWithTimeout(
      `https://restapi.amap.com/v3/geocode/geo?key=${amapKey}&address=${encodeURIComponent(q)}&output=JSON`,
      8000
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== '1' || !data.geocodes?.length) {
          searching.value = false
          return
        }
        searchResults.value = data.geocodes.map((g: any) => {
          const [lng, lat] = g.location.split(',')
          return {
            name: g.formatted_address,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          }
        })
        selectSearchResult(searchResults.value[0])
      })
      .catch(() => {
        searching.value = false
      })
  } else {
    // 未配置高德 Key，提示用户配置
    searching.value = false
    // eslint-disable-next-line no-alert
    window.alert('请先配置高德地图 Web API Key：\n1. 打开 https://lbs.amap.com/ 注册并登录\n2. 进入控制台 → 应用管理 → 创建新应用\n3. 添加 Key（服务类型选择 "Web服务"）\n4. 复制 Key 到 .env.development 中的 VITE_AMAP_KEY')
  }
}

/** 带超时的 fetch */
function fetchWithTimeout(url: string, ms: number, options?: RequestInit) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
}

function selectSearchResult(item: { name: string; lat: number; lng: number }) {
  selectedLat.value = item.lat
  selectedLng.value = item.lng
  map?.setView([item.lat, item.lng], 16)
  if (marker) {
    marker.setLatLng([item.lat, item.lng])
  }
  searchText.value = item.name
  searchResults.value = []
  searching.value = false
}

function handleConfirm() {
  emit('confirm', {
    longitude: selectedLng.value,
    latitude: selectedLat.value,
  })
  emit('update:visible', false)
}

function handleCancel() {
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      selectedLng.value = props.longitude ?? DEFAULT_CENTER[1]
      selectedLat.value = props.latitude ?? DEFAULT_CENTER[0]
      searchText.value = ''
      searchResults.value = []
    }
  }
)

onBeforeUnmount(() => {
  map?.remove()
  map = null
  marker = null
})
</script>

<style scoped lang="scss">
.map-picker-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-toolbar {
  display: flex;
  gap: 12px;

  :deep(.arco-input-search) {
    flex: 1;
  }
}

.map-container {
  width: 100%;
  height: 440px;
  border-radius: 4px;
  border: 1px solid var(--color-border-2);
  z-index: 1;
}

.search-results {
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  background: var(--color-bg-2);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-2);
  transition: background 0.2s;

  &:hover {
    background: var(--color-fill-2);
    color: var(--color-text-1);
  }

  svg {
    flex-shrink: 0;
    color: var(--color-text-4);
  }
}

.coord-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .arco-input {
    width: 180px;
  }
}

.coord-hint {
  font-size: 12px;
  color: var(--color-text-3);
}
</style>

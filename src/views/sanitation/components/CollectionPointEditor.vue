<template>
  <a-modal :visible="true" title="编辑收集点" :width="960" :modal-style="{ maxWidth: 'calc(100vw - 32px)' }" :body-style="{ maxHeight: 'calc(100dvh - 180px)', overflowY: 'auto' }" :popup-container="popupContainer || 'body'" :mask-closable="false" unmount-on-close @open="initializeMap" @cancel="emit('cancel')" :on-before-ok="submit">
    <div class="point-editor-note">当前仅为演示，正式功能正在开发中</div>
    <div class="point-editor-layout">
      <a-form :model="draft" layout="vertical" class="point-editor-form">
        <a-form-item label="点位名称" required><a-input v-model="draft.pointName" :max-length="100" allow-clear /></a-form-item>
        <div class="point-editor-pair">
          <a-form-item label="所属乡镇" required>
            <a-select v-model="draft.townshipId" allow-search placeholder="选择乡镇" @change="changeTownship">
              <a-option v-for="town in townships" :key="town.id" :value="town.id">{{ town.name }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="所属村庄" required>
            <a-select v-model="draft.villageId" allow-search :disabled="!draft.townshipId" placeholder="选择村庄">
              <a-option v-for="village in villages" :key="village.id" :value="village.id">{{ village.name }}</a-option>
            </a-select>
          </a-form-item>
        </div>
        <div class="point-editor-pair">
          <a-form-item label="容量数量" required><a-input-number v-model="draft.containerCount" :min="0" :precision="0" /></a-form-item>
          <a-form-item label="服务半径（米）" required><a-input-number v-model="draft.serviceRadius" :min="1" :precision="0" /></a-form-item>
        </div>
        <a-form-item label="具体地址"><a-textarea v-model="draft.address" :max-length="500" :auto-size="{ minRows: 2, maxRows: 4 }" /></a-form-item>
        <div class="point-editor-pair">
          <a-form-item label="联系人"><a-input v-model="draft.responsiblePerson" :max-length="50" allow-clear /></a-form-item>
          <a-form-item label="联系电话"><a-input v-model="draft.contactPhone" :max-length="30" allow-clear /></a-form-item>
        </div>
        <a-form-item label="状态" required><a-radio-group v-model="draft.status"><a-radio :value="1">启用</a-radio><a-radio :value="0">停用</a-radio></a-radio-group></a-form-item>
        <div class="point-editor-pair">
          <a-form-item label="经度（WGS84）" required><a-input-number v-model="draft.longitude" :min="-180" :max="180" :precision="6" :hide-button="true" /></a-form-item>
          <a-form-item label="纬度（WGS84）" required><a-input-number v-model="draft.latitude" :min="-90" :max="90" :precision="6" :hide-button="true" /></a-form-item>
        </div>
      </a-form>
      <div class="point-editor-map-panel">
        <div class="point-editor-map-heading"><b>地图选点</b><a-button size="mini" @click="locateDraft">定位到坐标</a-button></div>
        <div ref="mapContainer" class="point-editor-map"></div>
        <a-alert v-if="mapError" type="warning">{{ mapError }}，可手动输入坐标。</a-alert>
        <div class="point-editor-hint">点击地图或拖动标记选择坐标，圆形区域为服务范围。保存后生效，取消不修改原点位。</div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { loadAmapJsApi, type AMapCircle, type AMapInstance, type AMapMarker } from '@/utils/amap'
import { fromGcj, toGcj } from '@/utils/geo'
import { validateCollectionPointDraft, type CollectionPointArea, type CollectionPointDraft } from '../collection-point-edit'

const props = defineProps<{ point: CollectionPointDraft, areas: CollectionPointArea[], popupContainer?: string | HTMLElement }>()
const emit = defineEmits<{ (event: 'cancel'): void, (event: 'save', draft: CollectionPointDraft): void }>()
const draft = reactive<CollectionPointDraft & { responsiblePerson: string, contactPhone: string }>({
  id: props.point.id, pointName: props.point.pointName || '',
  townshipId: props.point.townshipId, villageId: props.point.villageId,
  containerCount: props.point.containerCount ?? 0, address: props.point.address || '',
  responsiblePerson: props.point.responsiblePerson || '', contactPhone: props.point.contactPhone || '',
  serviceRadius: props.point.serviceRadius ?? 100, status: props.point.status,
  longitude: props.point.longitude ?? Number.NaN, latitude: props.point.latitude ?? Number.NaN,
})
const townships = computed(() => [...new Map(props.areas.filter(area => area.townshipId > 0 && area.townshipName)
  .map(area => [area.townshipId, { id: area.townshipId, name: area.townshipName }])).values()])
const villages = computed(() => [...new Map(props.areas.filter(area => area.townshipId === draft.townshipId && area.villageId > 0 && area.villageName)
  .map(area => [area.villageId, { id: area.villageId, name: area.villageName }])).values()])
function changeTownship() { draft.villageId = undefined }
function submit() {
  const error = validateCollectionPointDraft(draft)
  if (error) { Message.warning(error); return false }
  if (!props.areas.some(area => area.townshipId === draft.townshipId && area.villageId === draft.villageId)) {
    Message.warning('请选择所属乡镇下的村庄'); return false
  }
  emit('save', { ...draft, pointName: draft.pointName.trim(), address: draft.address.trim(), responsiblePerson: draft.responsiblePerson?.trim() || '', contactPhone: draft.contactPhone?.trim() || '' })
  return true
}
const mapContainer = ref<HTMLDivElement>()
const mapError = ref('')
let map: AMapInstance | undefined
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let marker: AMapMarker | undefined
let radiusCircle: AMapCircle | undefined
let disposed = false
function validCoordinates() {
  return Number.isFinite(draft.longitude) && Number.isFinite(draft.latitude)
    && Math.abs(draft.longitude) <= 180 && Math.abs(draft.latitude) <= 90
}
function syncMap() {
  if (!map || !amap || !validCoordinates()) return
  const point = toGcj(draft.longitude, draft.latitude)
  if (!marker) {
    marker = new amap.Marker({ position: [point.lng, point.lat], draggable: true, title: '拖动修改收集点坐标', zIndex: 100 })
    marker.setMap(map)
    marker.on('dragend', () => {
      const position = marker!.getPosition()
      pickCoordinates(position.getLng(), position.getLat())
    })
  } else marker.setPosition([point.lng, point.lat])
  radiusCircle?.setMap(null)
  radiusCircle = undefined
  if (Number.isFinite(draft.serviceRadius) && draft.serviceRadius > 0) {
    radiusCircle = new amap.Circle({ center: [point.lng, point.lat], radius: draft.serviceRadius, strokeColor: '#165dff', strokeOpacity: 0.65, fillColor: '#165dff', fillOpacity: 0.12, zIndex: 10 })
    radiusCircle.setMap(map)
  }
}
function pickCoordinates(lng: number, lat: number) {
  const point = fromGcj(lng, lat)
  draft.longitude = Number(point.lng.toFixed(6))
  draft.latitude = Number(point.lat.toFixed(6))
}
function locateDraft() {
  if (!validCoordinates()) { Message.warning('请先输入有效经纬度'); return }
  const point = toGcj(draft.longitude, draft.latitude)
  map?.setZoomAndCenter(16, [point.lng, point.lat])
}
async function initializeMap() {
  if (map) return
  await nextTick()
  try {
    const api = await loadAmapJsApi()
    if (disposed || !mapContainer.value) return
    amap = api
    const point = validCoordinates() ? toGcj(draft.longitude, draft.latitude) : { lng: 114.13, lat: 36.04 }
    map = new api.Map(mapContainer.value, { center: [point.lng, point.lat], zoom: 16, resizeEnable: true, mapStyle: 'amap://styles/normal' })
    map.on('click', event => pickCoordinates(event.lnglat.getLng(), event.lnglat.getLat()))
    syncMap()
    map.resize()
  } catch (error) { mapError.value = error instanceof Error ? error.message : '地图加载失败' }
}
watch(() => [draft.longitude, draft.latitude, draft.serviceRadius], syncMap)
onBeforeUnmount(() => { disposed = true; radiusCircle?.setMap(null); marker?.setMap(null); map?.destroy() })
</script>

<style scoped>
.point-editor-note { margin-bottom: 16px; padding: 10px 12px; border: 1px solid rgb(var(--danger-3)); border-radius: 4px; background: var(--color-danger-light-1); color: rgb(var(--danger-6)); font-size: 13px; font-weight: 600; }
.point-editor-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; }
.point-editor-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.point-editor-form :deep(.arco-form-item) { margin-bottom: 14px; }
.point-editor-form :deep(.arco-input-number) { width: 100%; }
.point-editor-map-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: var(--color-text-1); }
.point-editor-map { height: 400px; border: 1px solid var(--color-border-2); border-radius: 6px; background: var(--color-fill-2); }
.point-editor-hint { margin-top: 10px; color: var(--color-text-3); font-size: 12px; line-height: 20px; }
@media (max-width: 760px) { .point-editor-layout { grid-template-columns: minmax(0, 1fr); gap: 12px; }.point-editor-map { height: 300px; } }
</style>

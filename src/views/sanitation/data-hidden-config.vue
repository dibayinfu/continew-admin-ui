<template>
  <div class="gi_page data-hidden-page">
    <div class="page-header">
      <div>
        <div class="page-title">业务参数配置</div>
        <div class="page-subtitle">统一维护展示范围与公司收集点排除规则；两类配置的业务影响不同。</div>
      </div>
      <a-space>
        <a-button type="primary" :loading="loading || excludedPointsLoading" @click="refreshAll">
          <template #icon><icon-sync /></template>
          更新
        </a-button>
        <a-dropdown position="br">
          <a-button>更多<icon-down /></a-button>
          <template #content>
            <a-doption @click="openLogin()">登录</a-doption>
            <a-doption @click="openTokenModal">Token</a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>

    <div v-if="daasAuth.expired" class="token-expired-banner">
      <icon-exclamation-circle-fill />
      <span>接口 Token 已过期或未登录。请</span>
      <a class="token-reset-link" @click="openLogin()">重新登录</a>
      <span>后重试。</span>
    </div>

    <a-card class="config-card" :bordered="false">
      <a-tabs v-model:active-key="activeTab" size="large">
        <!-- 箱体 -->
        <a-tab-pane key="boxes" title="箱体">
          <div class="toolbar">
            <a-input v-model="boxKeyword" allow-clear placeholder="搜索箱号/名称" style="width: 260px">
              <template #prefix><icon-search /></template>
            </a-input>
            <a-button size="small" @click="showAllBoxes">全部显示</a-button>
            <a-button size="small" status="danger" @click="hideAllBoxes">全部隐藏</a-button>
            <span class="toolbar-info">共 {{ boxes.length }} 个，已隐藏 {{ hiddenBoxIds.size }} 个</span>
          </div>
          <a-table :data="visibleBoxRows" :pagination="{ pageSize: 50, showTotal: true }" :scroll="{ y: 520 }" row-key="id" size="small">
            <template #columns>
              <a-table-column title="箱号" data-index="containerNo" :width="90" />
              <a-table-column title="名称" data-index="containerName" :min-width="200" />
              <a-table-column title="满溢率" :width="90">
                <template #cell="{ record }"><span :class="{ 'fill-high': (record.fillLevel ?? 0) >= 90 }">{{ record.fillLevel ?? 0 }}%</span></template>
              </a-table-column>
              <a-table-column title="是否显示" :width="110" align="center">
                <template #cell="{ record }">
                  <a-switch :model-value="!hiddenBoxIds.has(record.id)" @change="(v) => toggleBox(record.id, v)" />
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 收集点 -->
        <a-tab-pane key="points" title="收集点">
          <div class="toolbar">
            <a-input v-model="pointKeyword" allow-clear placeholder="搜索名称/乡镇/村庄" style="width: 260px">
              <template #prefix><icon-search /></template>
            </a-input>
            <a-button size="small" @click="showAllPoints">全部显示</a-button>
            <a-button size="small" status="danger" @click="hideAllPoints">全部隐藏</a-button>
            <span class="toolbar-info">共 {{ points.length }} 个，已隐藏 {{ hiddenPointIds.size }} 个</span>
          </div>
          <a-table :data="visiblePointRows" :pagination="{ pageSize: 50, showTotal: true }" :scroll="{ y: 520 }" row-key="id" size="small">
            <template #columns>
              <a-table-column title="名称" data-index="pointName" :min-width="200" />
              <a-table-column title="乡镇" data-index="townshipName" :width="110" />
              <a-table-column title="村庄" data-index="villageName" :width="110" />
              <a-table-column title="箱数" data-index="containerCount" :width="70" align="center" />
              <a-table-column title="是否显示" :width="110" align="center">
                <template #cell="{ record }">
                  <a-switch :model-value="!hiddenPointIds.has(record.id)" @change="(v) => togglePoint(record.id, v)" />
                </template>
              </a-table-column>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="excluded-points" title="公司收集点排除">
          <div class="parameter-tip warning">
            <icon-exclamation-circle />
            <span>已排除的公司收集点不参与换箱统计、满溢收运优先排名和 AI 清运建议；地图展示、原始采集数据及满溢告警不受影响。</span>
          </div>
          <div class="toolbar">
            <a-input v-model="excludedPointKeyword" allow-clear placeholder="搜索名称/乡镇/村庄" style="width: 260px">
              <template #prefix><icon-search /></template>
            </a-input>
            <a-button size="small" :loading="excludedPointsLoading" @click="loadExcludedPoints">更新配置</a-button>
            <span class="toolbar-info">共 {{ excludedPoints.length }} 个，已排除 {{ excludedPointIds.size }} 个</span>
          </div>
          <a-table :data="visibleExcludedPointRows" :loading="excludedPointsLoading" :pagination="{ pageSize: 50, showTotal: true }" :scroll="{ y: 520 }" row-key="pointId" size="small">
            <template #columns>
              <a-table-column title="收集点" data-index="pointName" :min-width="220" />
              <a-table-column title="乡镇" data-index="townshipName" :width="120" />
              <a-table-column title="村庄" data-index="villageName" :width="120" />
              <a-table-column title="是否排除" :width="120" align="center">
                <template #cell="{ record }"><a-switch :model-value="excludedPointIds.has(record.pointId)" checked-text="排除" unchecked-text="参与" @change="(v) => toggleExcludedPoint(record.pointId, v)" /></template>
              </a-table-column>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" :on-before-ok="saveToken">
      <p class="modal-tip">推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。</p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  daasAuth,
  collectorMapRequest,
  getHiddenBoxIds,
  getHiddenPointIds,
  saveDataVisibility,
  saveSharedDaasToken,
} from '@/utils/daas'
import { getCachedBoxes, getCachedPoints, saveCachedBoxes, saveCachedPoints, subscribeBoxesUpdated, subscribePointsUpdated } from './sbg-store'

defineOptions({ name: 'SanitationBusinessParameterConfig' })


interface Box {
  id: number
  containerNo: string
  containerName: string
  fillLevel: number
}
interface Point {
  id: number
  pointName: string
  townshipName: string
  villageName: string
  containerCount: number
}
interface ExcludedPoint { pointId: number, pointName: string, townshipName: string, villageName: string, excluded: boolean }

const activeTab = ref('boxes')
const loading = ref(false)
const boxes = ref<Box[]>([])
const points = ref<Point[]>([])
const hiddenBoxIds = ref<Set<number>>(new Set(getHiddenBoxIds()))
const hiddenPointIds = ref<Set<number>>(new Set(getHiddenPointIds()))
const boxKeyword = ref('')
const pointKeyword = ref('')
const excludedPointKeyword = ref('')
const excludedPointsLoading = ref(false)
const excludedPoints = ref<ExcludedPoint[]>([])
const excludedPointIds = ref<Set<number>>(new Set())
const collectorBaseUrl = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')

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
    void loadAll(true)
    return true
  } catch (error) {
    Message.error(`Token 保存失败：${error instanceof Error ? error.message : '请检查采集服务'}`)
    return false
  }
}
function openLogin() {
  daasAuth.visible = true
}

const visibleBoxRows = computed(() => {
  const q = boxKeyword.value.trim().toLowerCase()
  return boxes.value
    .filter((b) => !q || b.containerNo.toLowerCase().includes(q) || b.containerName.toLowerCase().includes(q))
    // 已隐藏项置顶，便于管理员快速核查；同一状态下维持接口原始顺序。
    .sort((a, b) => Number(hiddenBoxIds.value.has(b.id)) - Number(hiddenBoxIds.value.has(a.id)))
})
const visiblePointRows = computed(() => {
  const q = pointKeyword.value.trim().toLowerCase()
  return points.value
    .filter((p) => !q
      || p.pointName.toLowerCase().includes(q)
      || p.townshipName.toLowerCase().includes(q)
      || p.villageName.toLowerCase().includes(q))
    // 已隐藏项置顶，便于管理员快速核查；同一状态下维持接口原始顺序。
    .sort((a, b) => Number(hiddenPointIds.value.has(b.id)) - Number(hiddenPointIds.value.has(a.id)))
})
const visibleExcludedPointRows = computed(() => {
  const q = excludedPointKeyword.value.trim().toLowerCase()
  return excludedPoints.value
    .filter((point) => !q || [point.pointName, point.townshipName, point.villageName].some((value) => value?.toLowerCase().includes(q)))
    .sort((a, b) => Number(excludedPointIds.value.has(b.pointId)) - Number(excludedPointIds.value.has(a.pointId)))
})

let persistChain = Promise.resolve()
function persist() {
  // 开关连续点击时按触发顺序串行写入，避免较早请求晚返回而覆盖最新名单。
  const config = { hiddenBoxIds: Array.from(hiddenBoxIds.value), hiddenPointIds: Array.from(hiddenPointIds.value) }
  persistChain = persistChain.catch(() => undefined).then(() => saveDataVisibility(config)).catch((error) => {
    Message.error(error instanceof Error ? error.message : '保存全局隐藏配置失败')
  })
  return persistChain
}
function toggleBox(id: number, visible: boolean) {
  const next = new Set(hiddenBoxIds.value)
  if (visible) next.delete(id)
  else next.add(id)
  hiddenBoxIds.value = next
  void persist()
}
function togglePoint(id: number, visible: boolean) {
  const next = new Set(hiddenPointIds.value)
  if (visible) next.delete(id)
  else next.add(id)
  hiddenPointIds.value = next
  void persist()
}
function showAllBoxes() { hiddenBoxIds.value = new Set(); void persist(); Message.success('箱体已全部显示') }
function hideAllBoxes() { hiddenBoxIds.value = new Set(boxes.value.map((b) => b.id)); void persist(); Message.success('箱体已全部隐藏') }
function showAllPoints() { hiddenPointIds.value = new Set(); void persist(); Message.success('收集点已全部显示') }
function hideAllPoints() { hiddenPointIds.value = new Set(points.value.map((p) => p.id)); void persist(); Message.success('收集点已全部隐藏') }

let excludedPersistChain = Promise.resolve()
async function loadExcludedPoints() {
  excludedPointsLoading.value = true
  try {
    const response = await fetch(`${collectorBaseUrl}/api/collector/statistics/excluded-points`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    excludedPoints.value = await response.json() as ExcludedPoint[]
    excludedPointIds.value = new Set(excludedPoints.value.filter((point) => point.excluded).map((point) => point.pointId))
  } catch (error) {
    Message.error(`加载公司收集点排除配置失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { excludedPointsLoading.value = false }
}
function persistExcludedPoints() {
  const pointIds = Array.from(excludedPointIds.value)
  excludedPersistChain = excludedPersistChain.catch(() => undefined).then(async () => {
    const response = await fetch(`${collectorBaseUrl}/api/collector/statistics/excluded-points`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pointIds }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    Message.success('公司收集点排除配置已保存，后续统计和 AI 排名立即生效')
  }).catch((error) => Message.error(`保存公司收集点排除配置失败：${error instanceof Error ? error.message : '网络异常'}`))
  return excludedPersistChain
}
function toggleExcludedPoint(pointId: number, excluded: boolean) {
  const next = new Set(excludedPointIds.value)
  if (excluded) next.add(pointId)
  else next.delete(pointId)
  excludedPointIds.value = next
  void persistExcludedPoints()
}

async function loadAll(silent = false) {
  if (loading.value) return
  loading.value = true
  let ok = false
  try {
    const data = await collectorMapRequest<{ boxes?: Box[], points?: Point[] }>(false)
    // collectorMapRequest 已刷新后台全局名单；同步到本页响应式状态。
    hiddenBoxIds.value = new Set(getHiddenBoxIds())
    hiddenPointIds.value = new Set(getHiddenPointIds())
    if (Array.isArray(data.boxes)) { boxes.value = data.boxes; ok = true; saveCachedBoxes(data.boxes) }
    if (Array.isArray(data.points)) {
      points.value = data.points
      ok = true
      saveCachedPoints(points.value)
    }
  } catch { /* 保留共享缓存，取消登录不打断页面 */ }
  loading.value = false
  if (ok) { if (!silent) Message.success(`已加载 ${boxes.value.length} 个箱体、${points.value.length} 个收集点`) }
  else if (!silent) Message.warning('数据加载失败，请检查网络或稍后重试')
}
async function refreshAll() {
  await Promise.all([loadAll(), loadExcludedPoints()])
}

let offBoxes: () => void
let offPoints: () => void
onMounted(() => {
  // 先读共享缓存（其它页面已更新的数据），再静默刷新云端
  const cachedBoxes = getCachedBoxes<Box>()
  const cachedPoints = getCachedPoints<Point>()
  if (cachedBoxes.length) boxes.value = cachedBoxes
  if (cachedPoints.length) points.value = cachedPoints
  // 其它页面更新数据时，本页同步刷新
  offBoxes = subscribeBoxesUpdated((list) => {
    if (Array.isArray(list) && list.length) boxes.value = list as Box[]
  })
  offPoints = subscribePointsUpdated((list) => {
    if (Array.isArray(list) && list.length) points.value = list as Point[]
  })
  loadAll(true)
  void loadExcludedPoints()
})
onBeforeUnmount(() => {
  offBoxes?.()
  offPoints?.()
})
</script>

<style scoped lang="scss">
.data-hidden-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: #1d2129; font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle { color: #86909c; font-size: 13px; }
.token-expired-banner { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1px solid #fbaca3; border-radius: 4px; background: #ffece8; color: #f53f3f; font-size: 13px; }
.token-reset-link { color: #165dff; cursor: pointer; text-decoration: underline; }
.config-card :deep(.arco-card-body) { padding: 14px 16px; }
.toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.toolbar-info { color: #86909c; font-size: 13px; }
.parameter-tip { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 14px; padding: 10px 12px; border: 1px solid #ffe7ba; border-radius: 4px; background: #fffaf0; color: #8d5f08; font-size: 13px; line-height: 20px; }.parameter-tip :deep(.arco-icon) { flex: 0 0 auto; margin-top: 2px; color: #ff7d00; }
.modal-tip { margin-top: 0; color: #4e5969; }
.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
.fill-high { color: #f53f3f; font-weight: 600; }
</style>

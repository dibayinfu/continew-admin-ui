<template>
  <div class="gi_page data-hidden-page">
    <div class="page-header">
      <div>
        <div class="page-title">数据隐藏配置</div>
        <div class="page-subtitle">配置后，「箱体地图」「箱体收集点地图」将不显示被隐藏的箱体与收集点。</div>
      </div>
      <a-space>
        <a-tag :color="tokenStatusColor">{{ tokenStatusText }}</a-tag>
        <a-button type="primary" @click="openLogin()">登录</a-button>
        <a-button @click="openTokenModal">Token</a-button>
        <a-button :loading="loading" @click="loadAll()">从云端更新</a-button>
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
      </a-tabs>
    </a-card>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" @ok="saveToken">
      <p class="modal-tip">推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。</p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  daasAuth,
  daasRequest,
  getHiddenBoxIds,
  getHiddenPointIds,
  saveHiddenBoxIds,
  saveHiddenPointIds,
  setDaasToken,
} from '@/utils/daas'

defineOptions({ name: 'SanitationDataHiddenConfig' })

const BOX_MONITOR_PATH = '/domestic/waste/containers/sbgMonitoring'
const COLLECTION_POINTS_PATH = '/domestic/waste/v/collection-points/page'
const COLLECTION_POINTS_QUERY = { keyword: '', organizationId: 506, page: 0, size: 1000 }

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

const activeTab = ref('boxes')
const loading = ref(false)
const boxes = ref<Box[]>([])
const points = ref<Point[]>([])
const hiddenBoxIds = ref<Set<number>>(new Set(getHiddenBoxIds()))
const hiddenPointIds = ref<Set<number>>(new Set(getHiddenPointIds()))
const boxKeyword = ref('')
const pointKeyword = ref('')

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

const visibleBoxRows = computed(() => {
  const q = boxKeyword.value.trim().toLowerCase()
  return boxes.value.filter((b) => !q || b.containerNo.toLowerCase().includes(q) || b.containerName.toLowerCase().includes(q))
})
const visiblePointRows = computed(() => {
  const q = pointKeyword.value.trim().toLowerCase()
  return points.value.filter((p) => !q
    || p.pointName.toLowerCase().includes(q)
    || p.townshipName.toLowerCase().includes(q)
    || p.villageName.toLowerCase().includes(q))
})

function persistBoxes() { saveHiddenBoxIds(hiddenBoxIds.value) }
function persistPoints() { saveHiddenPointIds(hiddenPointIds.value) }
function toggleBox(id: number, visible: boolean) {
  const next = new Set(hiddenBoxIds.value)
  if (visible) next.delete(id)
  else next.add(id)
  hiddenBoxIds.value = next
  persistBoxes()
}
function togglePoint(id: number, visible: boolean) {
  const next = new Set(hiddenPointIds.value)
  if (visible) next.delete(id)
  else next.add(id)
  hiddenPointIds.value = next
  persistPoints()
}
function showAllBoxes() { hiddenBoxIds.value = new Set(); persistBoxes(); Message.success('箱体已全部显示') }
function hideAllBoxes() { hiddenBoxIds.value = new Set(boxes.value.map((b) => b.id)); persistBoxes(); Message.success('箱体已全部隐藏') }
function showAllPoints() { hiddenPointIds.value = new Set(); persistPoints(); Message.success('收集点已全部显示') }
function hideAllPoints() { hiddenPointIds.value = new Set(points.value.map((p) => p.id)); persistPoints(); Message.success('收集点已全部隐藏') }

async function loadAll(silent = false) {
  loading.value = true
  let ok = false
  try {
    const data = await daasRequest<{ list: Box[] }>(BOX_MONITOR_PATH, { body: { current: 1, size: 1000 } })
    if (Array.isArray(data?.list)) { boxes.value = data.list; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  try {
    const data = await daasRequest<{ list: Point[] }>(COLLECTION_POINTS_PATH, { method: 'GET', query: COLLECTION_POINTS_QUERY })
    if (Array.isArray(data?.list)) { points.value = data.list; ok = true }
  } catch { /* 单个失败不影响另一个 */ }
  loading.value = false
  if (ok) { if (!silent) Message.success(`已加载 ${boxes.value.length} 个箱体、${points.value.length} 个收集点`) }
  else if (!silent) Message.warning('数据加载失败，请检查网络或稍后重试')
}

onMounted(() => { loadAll(true) })
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
.modal-tip { margin-top: 0; color: #4e5969; }
.modal-tip code { padding: 1px 4px; background: #f2f3f5; }
.fill-high { color: #f53f3f; font-weight: 600; }
</style>

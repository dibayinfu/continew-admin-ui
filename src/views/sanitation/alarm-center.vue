<template>
  <div class="gi_page alarm-center-page">
    <ModuleHeader
      :title="isCreateMode ? '告警建任务单' : '告警中心'"
      :subtitle="isCreateMode ? '从告警消息或手动选择箱体快速创建收运任务单，支持自动补全箱体、驾驶员、目的地等信息。' : '实时查看箱体满溢、低电量和设备异常消息，支持对重要消息添加星标。'"
      phase="试运营"
      priority="P0"
      module="告警与消息"
    >
      <template #extra>
        <a-button @click="refreshFlash">
          <template #icon><icon-sync /></template>
          模拟新告警
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <PrdPanel v-if="isCreateMode" :sections="prdSections" />

    <div class="content-grid" :class="{ 'content-grid--full': !detailVisible }">
      <section class="table-panel">
        <div class="toolbar">
          <a-space wrap>
            <a-input-search v-model="keyword" placeholder="搜索箱体/地址/告警内容" allow-clear class="search-input" />
            <a-input
              v-if="isCreateMode"
              v-model="alarmIdKeyword"
              placeholder="告警编号"
              allow-clear
              class="alarm-id-input"
              @clear="focusedAlarmId = null"
            />
            <a-select v-model="typeFilter" class="filter-select">
              <a-option v-for="item in typeFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
            <a-range-picker
              v-if="isCreateMode"
              v-model="triggerTimeRange"
              class="time-range-picker"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :placeholder="['开始日期', '结束日期']"
              allow-clear
            />
            <a-select v-model="readStatusFilter" placeholder="阅读状态" class="filter-select">
              <a-option v-for="item in readStatusFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
            <a-select
              v-if="isCreateMode"
              v-model="taskStatusFilter"
              placeholder="任务单状态"
              class="filter-select task-status-select"
              :trigger-props="{ autoFitPopupWidth: false, popupStyle: { width: '180px' } }"
            >
              <a-option v-for="item in taskStatusFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
            <a-select v-model="starredFilter" placeholder="星标" class="filter-select" style="width: 120px;">
              <a-option v-for="item in starredFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
          </a-space>
          <a-tag v-if="flashNotice" color="red" class="flash-tag">新告警接入</a-tag>
        </div>

        <a-table
          row-key="id"
          :data="filteredAlarms"
          :columns="columns"
          :pagination="pagination"
          :scroll="{ x: 1500 }"
          stripe
          :row-class="getRowClass"
          @page-change="pagination.current = $event"
          @row-click="(record: any) => selectAlarm(record)"
        >
          <template #readStatus="{ record }">
            <StatusTag :value="record.readStatus" />
          </template>
          <template #starred="{ record }">
            <icon-star-fill v-if="record.starred" class="table-star table-star--active" />
            <icon-star v-else class="table-star" />
          </template>
          <template #cell="{ column, record }">
            <StatusTag v-if="['level', 'type', 'boxType'].includes(String(column.dataIndex))" :value="record[column.dataIndex]" />
            <span v-else-if="column.dataIndex === 'village'">{{ record.village || '-' }}</span>
            <span v-else-if="column.dataIndex === 'fillRate'">{{ record.fillRate != null ? `${Math.round(record.fillRate)}%` : '-' }}</span>
            <span v-else-if="column.dataIndex === 'battery'">{{ record.battery != null ? `${Math.round(record.battery)}%` : '-' }}</span>
            <span v-else-if="column.dataIndex === 'triggerTime'" class="cell-nowrap">{{ fmtTime(record.triggerTime) }}</span>
            <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
          </template>
          <template #action="{ record }">
            <div class="action-bar" @click.stop>
              <span class="action-cell">
                <a-tooltip content="查看详情">
                  <a-button size="small" type="text" @click="selectAlarm(record)">
                    <template #icon><icon-eye /></template>
                  </a-button>
                </a-tooltip>
              </span>
              <span v-if="record.linkedTaskId" class="action-cell">
                <a-tooltip :content="`查看任务单 ${record.linkedTaskId}`">
                  <a-button size="small" type="text" @click="openTaskNewWindow(record.linkedTaskId)">
                    <template #icon><icon-link /></template>
                  </a-button>
                </a-tooltip>
              </span>
            </div>
          </template>
        </a-table>
      </section>

      <aside v-if="detailVisible" class="detail-panel">
        <div class="panel-title">
          <span>告警详情</span>
          <a-space>
            <StatusTag :value="selectedAlarm?.readStatus" />
            <span v-if="selectedAlarm?.starred" class="detail-star"><icon-star-fill style="color: #f7ba1e;" /> 星标</span>
            <a-button size="mini" status="secondary" class="close-btn" @click="closeDetail">
              <template #icon><icon-close /></template>
            </a-button>
          </a-space>
        </div>
        <template v-if="selectedAlarm">
          <div class="alarm-card">
            <div class="alarm-main">
              <b>{{ selectedAlarm.boxName }}</b>
              <span>{{ selectedAlarm.content }}</span>
            </div>
            <a-descriptions :column="1" size="small" bordered>
              <a-descriptions-item label="告警编号">{{ selectedAlarm.id }}</a-descriptions-item>
              <a-descriptions-item label="触发规则">{{ selectedAlarm.ruleName }}</a-descriptions-item>
              <a-descriptions-item label="箱体编号">{{ selectedAlarm.boxNo }}</a-descriptions-item>
              <a-descriptions-item label="具体地址">{{ selectedAlarm.address }}</a-descriptions-item>
              <a-descriptions-item label="触发时间">{{ fmtTime(selectedAlarm.triggerTime) }}</a-descriptions-item>
              <a-descriptions-item label="处理说明">{{ selectedAlarm.offlineRemark || '暂无处理说明' }}</a-descriptions-item>
              <a-descriptions-item label="关联任务">
                <template v-if="selectedAlarm.linkedTaskId">
                  <a-link class="linked-task-icon" @click="openTaskNewWindow(selectedAlarm.linkedTaskId)">
                    <template #icon><icon-link /></template>
                    {{ selectedAlarm.linkedTaskId }}
                  </a-link>
                </template>
                <span v-else>暂未创建</span>
              </a-descriptions-item>
            </a-descriptions>
          </div>
          <div class="detail-actions">
            <a-button v-if="selectedAlarm.type === '满溢告警' && !selectedAlarm.linkedTaskId" type="primary" long @click="openCreate(selectedAlarm)">
              基于此消息快速创建收运任务单
            </a-button>
            <a-button :status="selectedAlarm?.starred ? undefined : 'warning'" long @click="toggleStar(selectedAlarm!)">
              <template #icon>
                <icon-star-fill v-if="selectedAlarm?.starred" />
                <icon-star v-else />
              </template>
              {{ selectedAlarm?.starred ? '取消星标' : '添加星标' }}
            </a-button>
          </div>
        </template>
      </aside>
    </div>

    <a-modal v-model:visible="createVisible" title="创建收运任务单" width="860px" @ok="submitTask">
      <div class="create-modal-body">
        <!-- 上半部分：有告警上下文 → 告警信息 + 箱体当前信息 / 无告警 → 选择箱体 -->
        <section v-if="creatingAlarm" class="create-alarm-info">
          <div class="section-title">告警信息</div>
          <div class="alarm-main">
            <b>{{ creatingAlarm.boxName }}</b>
            <span>{{ creatingAlarm.content }}</span>
          </div>
          <a-descriptions :column="2" size="small" bordered>
            <a-descriptions-item label="告警编号">{{ creatingAlarm.id }}</a-descriptions-item>
            <a-descriptions-item label="告警类型">{{ creatingAlarm.type }}</a-descriptions-item>
            <a-descriptions-item label="等级">{{ creatingAlarm.level }}</a-descriptions-item>
            <a-descriptions-item label="箱体编号">{{ creatingAlarm.boxNo }}</a-descriptions-item>
            <a-descriptions-item label="箱体类型">{{ creatingAlarm.boxType }}</a-descriptions-item>
            <a-descriptions-item label="乡镇村庄">{{ creatingTownVillage }}</a-descriptions-item>
            <a-descriptions-item label="具体地址" :span="2">{{ creatingAlarm.address }}</a-descriptions-item>
            <a-descriptions-item label="触发时间" :span="2">{{ fmtTime(creatingAlarm.triggerTime) }}</a-descriptions-item>
            <a-descriptions-item label="触发规则" :span="2">{{ creatingAlarm.ruleName }}</a-descriptions-item>
          </a-descriptions>

          <div class="section-title">箱体当前信息</div>
          <div class="box-info-line">
            <span><em>箱体编号</em>{{ creatingShortBoxNo }}</span>
            <span><em>箱体类型</em>{{ creatingAlarm.boxType }}</span>
            <span><em>收集点</em>{{ creatingCollectionPoint }}</span>
            <span><em>乡镇村庄</em>{{ creatingTownVillage }}</span>
            <span><em>满溢率</em><b :class="{ overtime: (creatingAlarm.fillRate ?? 0) >= 90 }">{{ creatingAlarm.fillRate != null ? creatingAlarm.fillRate + '%' : '—' }}</b></span>
            <span><em>电量</em>{{ creatingBattery }}</span>
          </div>
        </section>

        <!-- 上半部分（无告警）：选择箱体 -->
        <section v-else class="create-alarm-info">
          <div class="section-title">选择箱体</div>
          <a-form layout="vertical">
            <a-form-item label="箱体名称 / 编号">
              <a-auto-complete
                v-model="boxSearchKeyword"
                :data="filteredBoxes.map((b) => `${b.boxNo} - ${b.name}`)"
                placeholder="输入箱体编号或名称搜索"
                @select="onAutoCompleteSelect"
                @clear="selectedBox = null"
              />
            </a-form-item>
          </a-form>

          <template v-if="selectedBox">
            <div class="alarm-main" style="margin-bottom: 12px;">
              <b>{{ selectedBox.name }}</b>
              <span>{{ selectedBox.currentLocation }}</span>
            </div>
            <div class="box-info-line">
              <span><em>箱体编号</em>{{ selectedBoxShortNo }}</span>
              <span><em>箱体类型</em>{{ selectedBox.boxType }}</span>
              <span><em>收集点</em>{{ selectedBoxCollectionPoint }}</span>
              <span><em>乡镇村庄</em>{{ selectedBoxTownVillage }}</span>
              <span><em>满溢率</em><b :class="{ overtime: (selectedBox.fillRate ?? 0) >= 90 }">{{ selectedBox.fillRate != null ? selectedBox.fillRate + '%' : '—' }}</b></span>
              <span><em>电量</em>{{ selectedBoxBattery }}</span>
            </div>
          </template>
        </section>

        <!-- 下半部分：任务派单 -->
        <section class="create-operations">
          <div class="section-title">任务派单</div>
          <a-form :model="createForm" layout="vertical">
            <a-grid :cols="2" :col-gap="16">
              <a-grid-item>
                <a-form-item label="所属机构">
                  <a-select v-model="createForm.organization">
                    <a-option v-for="item in organizationOptions" :key="item" :value="item">{{ item }}</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="目的地">
                  <a-select v-model="createForm.destination">
                    <a-option v-for="item in destinationOptions" :key="item" :value="item">{{ item }}</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="驾驶员">
                  <a-select v-model="createForm.driver" @change="onDriverChange">
                    <a-option v-for="item in driverOptionList" :key="item.name" :value="item.name" :label="item.name">
                      {{ item.name }}
                    </a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="车辆">
                  <a-select
                    v-model="createForm.vehicle"
                    :options="currentDriverVehicleOptions"
                    placeholder="请选择绑定车辆"
                    allow-search
                    allow-clear
                    @change="onVehicleChange"
                  />
                  <div class="bind-hint" :class="{ unbound: !currentDriverBoundVehicle }">
                    <template v-if="currentDriverBoundVehicle">
                      <a-link @click="openVehicleArchive">去车辆档案调整</a-link>
                      <a-tooltip content="刷新绑定信息">
                        <a-link class="bind-refresh" @click="refreshBinding"><icon-refresh /></a-link>
                      </a-tooltip>
                    </template>
                    <template v-else>
                      <span class="bind-hint-text">该驾驶员暂无绑定车辆</span>
                      <a-link @click="openVehicleArchive">去车辆档案绑定</a-link>
                      <a-tooltip content="刷新绑定信息">
                        <a-link class="bind-refresh" @click="refreshBinding"><icon-refresh /></a-link>
                      </a-tooltip>
                    </template>
                  </div>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="时效要求">
                  <a-select v-model="createForm.sla">
                    <a-option :value="30">30分钟</a-option>
                    <a-option :value="60">60分钟</a-option>
                    <a-option :value="90">90分钟</a-option>
                    <a-option :value="120">120分钟</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="优先级">
                  <a-select v-model="createForm.priority">
                    <a-option value="普通">普通</a-option>
                    <a-option value="紧急">紧急</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
            </a-grid>
          </a-form>
        </section>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message as ArcoMessage } from '@arco-design/web-vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import PrdPanel from './components/PrdPanel.vue'
import type { PrdSection } from './data/pageConfigs'
import {
  createCollectionTaskFromAlarm,
  destinations,
  drivers,
  sanitationAlarms,
  type SanitationAlarm,
} from './data/alert-task'
import { boxes, getDriverVehicles, vehicles } from './data/mock'

const prdSections: PrdSection[] = [
  {
    title: '🎯 功能要点（开发 / 测试关注）',
    items: [
      { label: '业务流', value: '满溢告警 → 创建收运任务单 → 任务单监控 → 驾驶员接单 → 收运 → 完成' },
      { label: '数据关联', value: '人员档案（drivers）→ 驾驶员/车辆；中转站/焚烧厂（destinations）→ 目的地；箱体档案（boxes）→ 箱体信息/位置' },
      { label: '入口', value: '① 右侧详情「基于此消息创建」② 表格行「快速创建」图标（满溢告警行可见）' },
      { label: '任务单状态筛选', value: '支持“全部、未建任务单、已建任务单”；以告警是否存在 linkedTaskId 为判断依据。' },
      { label: '顶部铃铛联动', value: '点击未建任务单的满溢告警时携带告警 ID 进入本页，自动填入“告警编号”，列表仅显示该条数据并打开快速创建任务单弹窗；清空告警编号后恢复完整列表。' },
      { label: '详情操作', value: '未建任务单的满溢告警显示“基于此消息快速创建”；仅已建任务单的告警显示关联任务 ICON，点击新窗口打开任务详情。' },
      { label: '星标操作', value: '列表星标列仅用五角星展示状态（已星标高亮、未星标置灰）；操作列仅保留查看，添加/取消星标统一在告警详情中操作。' },
      { label: '弹窗布局', value: '上半：告警信息（标题+只读字段）+ 箱体当前信息（短编号/类型/收集点/乡镇村庄/满溢率/电量）| 下半：任务派单表单（可操作）' },
      { label: '表单字段', value: '所属机构、目的地、驾驶员（Select 联动车辆）、车辆、时效要求、优先级' },
      { label: '默认值', value: '驾驶员按箱体类型匹配（小勾臂→张师傅/豫E3G516，大勾臂→孙师傅/豫E6N109），目的地对应过滤，时效60min，优先级紧急' },
      { label: '提交映射', value: '→ CollectionTask，状态初始「待接单」，轨迹4个占位点，不修改告警星标状态' },
      { label: '模拟新告警', value: '列表最前插入一条满溢告警，整行闪烁3次，不打开详情面板' },
    ],
  },
  {
    title: '🔑 字段映射规则',
    items: [
      { label: 'taskName', value: '{boxName}满溢{boxType === \'小勾臂箱\' ? \'收运\' : \'转运\'}' },
      { label: 'driver / vehicle', value: '从 drivers 中按 name 匹配，联动填充 phone / vehicle / vehicleType' },
      { label: 'destination', value: '从 destinations 中按 name 匹配，自动填充 destinationType / destinationAddress' },
      { label: 'collectionStatus', value: '初始值 \'待接单\'' },
      { label: 'overtimeStatus', value: '初始值 \'未超时\'' },
    ],
  },
  {
    title: '⚠️ 边界 & 验收要点',
    items: [
      { label: '✓ 驾驶员切换', value: '车辆联动更新' },
      { label: '✓ 箱体类型 → 目的地', value: '小勾臂只选中转站，大勾臂只选焚烧厂' },
      { label: '✓ 提交后告警状态', value: '星标状态不变' },
      { label: '✓ 关联任务', value: '「看任务」跳转收运单监控页' },
      { label: '✓ 模拟新告警', value: '列表新增行闪烁，不打开详情面板' },
      { label: '✓ 数据来源', value: '当前为 mock 数据，对接后端后需走 API' },
    ],
  },
]

defineOptions({ name: 'SanitationAlarmCenter' })

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const alarmIdKeyword = ref('')
const typeFilter = ref('全部类型')
const triggerTimeRange = ref<string[]>([])
const readStatusFilter = ref('全部')
const taskStatusFilter = ref('全部')
const starredFilter = ref('全部')
const detailVisible = ref(false)
const flashNotice = ref(false)
const flashingRowId = ref<string | null>(null)
const focusedAlarmId = ref<string | null>(null)
const pagination = reactive({ current: 1, pageSize: 7, showTotal: true })
const selectedAlarm = ref<SanitationAlarm>(sanitationAlarms[0])
const createVisible = ref(false)
const creatingAlarm = ref<SanitationAlarm>()
const boxSearchKeyword = ref('')
const selectedBox = ref<(typeof boxes)[number] | null>(null)
// 操作员是否已手动选择过车辆（手动选择后，刷新/换驾驶员不再自动覆盖）
const manualVehicleOverride = ref(false)

const filteredBoxes = computed(() => {
  const kw = boxSearchKeyword.value.trim()
  if (!kw) return boxes.filter((b) => b.boxType === '小勾臂箱' || b.boxType === '大勾臂箱')
  return boxes.filter((b) => b.boxNo.includes(kw) || b.name.includes(kw))
})

function extractTownFromBox(box: (typeof boxes)[number]): string {
  if (box.currentLocation) {
    const m = box.currentLocation.match(/^([^\d]+?[镇乡村街道])/)
    if (m) return m[1].trim()
  }
  return '-'
}

// 从具体地址中提取村庄（如“马投涧镇牛家窑村文化广场” → 牛家窑村），无村庄返回 '-'
function extractVillage(address: string): string {
  if (!address) return '-'
  const matches = address.match(/([\u4e00-\u9fa5]{1,4}村)/g) || []
  const village = matches[matches.length - 1]
  return village ? village.replace(/^[镇乡街道]+/, '') : '-'
}

function fmtTime(t?: string): string {
  if (!t) return '-'
  return String(t).replace(/:\d{2}$/, '')
}

function onAutoCompleteSelect(value: string) {
  const boxNo = value.split(' - ')[0].trim()
  const box = boxes.find((b) => b.boxNo === boxNo)
  if (box) onBoxSelect(box)
}

function onBoxSelect(box: (typeof boxes)[number]) {
  selectedBox.value = box
  const town = extractTownFromBox(box)
  createForm.boxName = box.name
  createForm.taskType = box.boxType === '小勾臂箱' ? '小勾臂箱满溢收运' : '大勾臂箱满溢转运'
  const defaultDriver = drivers.find((d) => (box.boxType === '小勾臂箱' ? d.vehicleType === '小勾臂车' : d.vehicleType === '大勾臂车')) || drivers[0]
  createForm.driver = defaultDriver.name
  manualVehicleOverride.value = false
  const bound = getDriverVehicles(defaultDriver.name)
  createForm.vehicle = bound[0]?.plateNo || ''
  createForm.destination = box.boxType === '小勾臂箱' ? '马投涧中转站' : '龙安生活垃圾焚烧厂'
  createForm.priority = '紧急'
  createForm.sla = 60
  boxSearchKeyword.value = ''
}
const createForm = reactive({
  boxName: '',
  taskType: '',
  organization: '河南龙淼钧泽环卫有限公司',
  driver: '张师傅',
  vehicle: '',
  destination: '马投涧中转站',
  sla: 60,
  priority: '紧急',
})

const isCreateMode = computed(() => route.path.includes('workOrderCreate'))
const typeFilters = ['全部类型', '满溢告警', '低电量告警', '设备离线', '称重异常']
const readStatusFilters = ['全部', '未读', '已读']
const taskStatusFilters = ['全部', '未建任务单', '已建任务单']
const starredFilters = ['全部', '星标消息']
const driverOptions = computed(() => drivers.map((item) => item.name))
// 车辆下拉选项：仅展示当前驾驶员绑定的车辆（通常 0~2 条）
const currentDriverVehicleOptions = computed(() => getDriverVehicles(createForm.driver).map((v) => ({ label: `${v.plateNo} · ${v.vehicleType}`, value: v.plateNo })))
// 驾驶员下拉：仅展示名称
const driverOptionList = computed(() => drivers)
// 当前驾驶员绑定的车辆（提示行用）
const currentDriverBoundVehicle = computed(() => getDriverVehicles(createForm.driver)[0] || null)

function onDriverChange(name: string) {
  manualVehicleOverride.value = false
  const bound = getDriverVehicles(name)
  createForm.vehicle = bound[0]?.plateNo || ''
}

function onVehicleChange() {
  manualVehicleOverride.value = true
}

function openVehicleArchive() {
  const href = router.resolve({ path: '/sanitation/vehicleArchive' }).href
  window.open(href, '_blank')
}

function refreshBinding() {
  if (!manualVehicleOverride.value) {
    const bound = getDriverVehicles(createForm.driver)
    createForm.vehicle = bound[0]?.plateNo || ''
  }
  ArcoMessage.success('绑定信息已刷新')
}
// 所属机构下拉：仅当前机构
const organizationOptions = ['河南龙淼钧泽环卫有限公司']
const destinationOptions = computed(() => {
  if (creatingAlarm.value?.boxType === '大勾臂箱') return destinations.filter((item) => item.type === '焚烧厂').map((item) => item.name)
  return destinations.filter((item) => item.type === '中转站').map((item) => item.name)
})

type BoxRecord = (typeof boxes)[number] & {
  battery?: number | null
  locationMatches?: Array<{ type: string; name: string }>
}

function displayBoxNo(box: BoxRecord): string {
  return sanitationAlarms.find((a) => a.boxName === box.name)?.boxNo || box.boxNo
}

function getBoxCollectionPoints(box: BoxRecord): string[] {
  const matches = box.locationMatches
    ?.filter((m) => m.type === 'collectionPoint')
    .map((m) => m.name)
  if (matches && matches.length) return matches
  if (box.locationType === 'collectionPoint' && box.locationName) return [box.locationName]
  return []
}

function extractVillageFromBox(box: BoxRecord): string {
  // 小勾臂箱名称以村庄开头，如“牛家窑2号小勾臂箱”“南坡村1号小勾臂箱”
  const m = String(box.name || '').match(/^([\u4e00-\u9fa5]+?)(?=\d)/)
  return m ? m[1] : '-'
}

function boxTownVillage(box: BoxRecord | null): string {
  if (!box) return '-'
  const town = extractTownFromBox(box)
  const village = extractVillageFromBox(box)
  return [town, village].filter((v) => v !== '-').join(' ') || '-'
}

// 有告警上下文：箱体短编号 / 收集点 / 乡镇村庄 / 满溢率 / 电量
const creatingBox = computed<BoxRecord | null>(() => {
  if (!creatingAlarm.value) return null
  return (boxes.find((b) => b.name === creatingAlarm.value?.boxName) as BoxRecord) || null
})
const creatingShortBoxNo = computed(() => {
  if (creatingAlarm.value) return displayBoxNo({ ...creatingAlarm.value } as BoxRecord)
  return creatingBox.value ? displayBoxNo(creatingBox.value) : '-'
})
const creatingCollectionPoint = computed(() => {
  const points = creatingBox.value ? getBoxCollectionPoints(creatingBox.value) : []
  return points[0] || creatingAlarm.value?.address || '-'
})
const creatingTownVillage = computed(() => {
  // 优先取箱体档案的乡镇/村庄；箱体档案找不到时退回告警自带的乡镇 + 地址提取村庄
  const fromBox = boxTownVillage(creatingBox.value)
  if (fromBox !== '-') return fromBox
  const alarm = creatingAlarm.value
  if (!alarm) return '-'
  const village = extractVillage(alarm.address)
  return [alarm.town, village].filter((v) => v && v !== '-').join(' ') || '-'
})
const creatingBattery = computed(() => {
  const battery = creatingBox.value?.battery ?? creatingAlarm.value?.battery
  return battery != null ? `${battery}%` : '—'
})
// 无告警（选择箱体）：箱体短编号 / 收集点 / 乡镇村庄 / 电量
const selectedBoxShortNo = computed(() => (selectedBox.value ? displayBoxNo(selectedBox.value as BoxRecord) : '-'))
const selectedBoxCollectionPoint = computed(() => {
  if (!selectedBox.value) return '-'
  const points = getBoxCollectionPoints(selectedBox.value as BoxRecord)
  return points[0] || selectedBox.value.currentLocation || '-'
})
const selectedBoxTownVillage = computed(() => boxTownVillage(selectedBox.value as BoxRecord | null))
const selectedBoxBattery = computed(() => {
  const battery = (selectedBox.value as BoxRecord | null)?.battery
  return battery != null ? `${battery}%` : '—'
})

const metrics = computed(() => {
  const baseMetrics = [
    { label: '今日告警', value: sanitationAlarms.length, unit: '条', tone: 'danger' },
    { label: '星标', value: sanitationAlarms.filter((item) => item.starred).length, unit: '条', tone: 'warning' },
  ]
  return isCreateMode.value
    ? baseMetrics
    : [baseMetrics[0], { label: '未读', value: sanitationAlarms.filter((item) => item.readStatus === '未读').length, unit: '条', tone: 'danger' }, baseMetrics[1]]
})

const baseColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '阅读状态', dataIndex: 'readStatus', slotName: 'readStatus', width: 100 },
  { title: '告警编号', dataIndex: 'id', width: 150, ellipsis: true, tooltip: true },
  { title: '告警类型', dataIndex: 'type', width: 120 },
  { title: '等级', dataIndex: 'level', width: 90 },
  { title: '箱体类型', dataIndex: 'boxType', width: 110 },
  { title: '箱体名称', dataIndex: 'boxName', width: 190, ellipsis: true, tooltip: true },
  { title: '所属乡镇', dataIndex: 'town', width: 110 },
  { title: '满溢率', dataIndex: 'fillRate', width: 90 },
  { title: '电量', dataIndex: 'battery', width: 90 },
  { title: '触发时间', dataIndex: 'triggerTime', width: 180 },
  { title: '星标', dataIndex: 'starred', slotName: 'starred', width: 80, align: 'center' as const },
  { title: '操作', slotName: 'action', width: 80, align: 'center' as const, fixed: 'right' as const },
]

// “告警建任务单”列表列顺序：序号、箱体编号、乡镇、村庄、触发时间、满溢率、电量、告警类型、箱体类型、星标、告警编号、操作
const createModeColumns = [
  { title: '序号', width: 70, align: 'center' as const, fixed: 'left' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '箱体编号', dataIndex: 'boxNo', width: 90, fixed: 'left' as const, ellipsis: true, tooltip: true },
  { title: '乡镇', dataIndex: 'town', width: 110 },
  { title: '村庄', dataIndex: 'village', width: 120 },
  { title: '触发时间', dataIndex: 'triggerTime', width: 165 },
  { title: '满溢率', dataIndex: 'fillRate', width: 90 },
  { title: '电量', dataIndex: 'battery', width: 90 },
  { title: '告警类型', dataIndex: 'type', width: 120 },
  { title: '箱体类型', dataIndex: 'boxType', width: 110 },
  { title: '星标', dataIndex: 'starred', slotName: 'starred', width: 80, align: 'center' as const },
  { title: '告警编号', dataIndex: 'id', width: 150, ellipsis: true, tooltip: true },
  { title: '操作', slotName: 'action', width: 100, align: 'center' as const, fixed: 'right' as const },
]

// “告警建任务单”使用 createModeColumns；告警中心保持原有列不变。
const columns = computed(() => isCreateMode.value ? createModeColumns : baseColumns)

const filteredAlarms = computed(() => {
  let result = sanitationAlarms
  if (isCreateMode.value && alarmIdKeyword.value.trim()) {
    const alarmId = alarmIdKeyword.value.trim().toLowerCase()
    result = result.filter((item) => focusedAlarmId.value
      ? item.id.toLowerCase() === alarmId
      : item.id.toLowerCase().includes(alarmId))
  }
  if (keyword.value) {
    result = result.filter((item) => `${item.boxName}${item.address}${item.content}`.includes(keyword.value))
  }
  if (typeFilter.value !== '全部类型') result = result.filter((item) => item.type === typeFilter.value)
  if (isCreateMode.value && triggerTimeRange.value.length === 2) {
    const [startDate, endDate] = triggerTimeRange.value
    result = result.filter((item) => {
      const triggerDate = item.triggerTime.slice(0, 10).replaceAll('/', '-')
      return triggerDate >= startDate && triggerDate <= endDate
    })
  }
  if (readStatusFilter.value !== '全部') result = result.filter((item) => item.readStatus === readStatusFilter.value)
  if (taskStatusFilter.value === '未建任务单') result = result.filter((item) => !item.linkedTaskId)
  if (taskStatusFilter.value === '已建任务单') result = result.filter((item) => Boolean(item.linkedTaskId))
  if (starredFilter.value !== '全部') result = result.filter((item) => item.starred)
  // 默认未读排在前面
  result = [...result].sort((a, b) => {
    if (a.readStatus === '未读' && b.readStatus !== '未读') return -1
    if (a.readStatus !== '未读' && b.readStatus === '未读') return 1
    return 0
  })
  // 列表补充派生字段：村庄（从地址提取）
  return result.map((item) => ({ ...item, village: extractVillage(item.address) }))
})

function selectAlarm(record: SanitationAlarm) {
  if (focusedAlarmId.value !== record.id) focusedAlarmId.value = null
  selectedAlarm.value = record
  detailVisible.value = true
  if (record.readStatus === '未读') record.readStatus = '已读'
}

function closeDetail() {
  detailVisible.value = false
}

function openCreate(record: SanitationAlarm) {
  creatingAlarm.value = record
  selectedBox.value = null
  selectedAlarm.value = record
  createForm.boxName = record.boxName
  createForm.taskType = record.boxType === '小勾臂箱' ? '小勾臂箱满溢收运' : '大勾臂箱满溢转运'
  const defaultDriver = drivers.find((d) => (record.boxType === '小勾臂箱' ? d.vehicleType === '小勾臂车' : d.vehicleType === '大勾臂车')) || drivers[0]
  createForm.driver = defaultDriver.name
  manualVehicleOverride.value = false
  const bound = getDriverVehicles(defaultDriver.name)
  createForm.vehicle = bound[0]?.plateNo || ''
  createForm.destination = record.boxType === '小勾臂箱' ? '马投涧中转站' : '龙安生活垃圾焚烧厂'
  createForm.priority = '紧急'
  createForm.sla = 60
  createVisible.value = true
}

function openFirstPendingOverflow() {
  // 从顶部按钮创建：无告警上下文，直接打开弹窗让用户选择箱体
  creatingAlarm.value = undefined
  selectedBox.value = null
  boxSearchKeyword.value = ''
  createVisible.value = true
}

function submitTask() {
  const chosenVehicle = vehicles.find((v) => v.plateNo === createForm.vehicle)
  // 有告警上下文 → 基于告警创建；无告警 → 基于选中的箱体创建
  if (creatingAlarm.value) {
    const task = createCollectionTaskFromAlarm(creatingAlarm.value, createForm.driver, createForm.destination, createForm.vehicle || undefined, chosenVehicle?.vehicleType)
    selectedAlarm.value = creatingAlarm.value
    ArcoMessage.success(`已创建收运任务单 ${task.id}`)
  } else if (selectedBox.value) {
    const alarmStub: SanitationAlarm = {
      id: `STUB-${Date.now()}`,
      type: '满溢告警',
      level: '严重',
      boxType: selectedBox.value.boxType as '小勾臂箱' | '大勾臂箱',
      boxNo: selectedBox.value.boxNo,
      boxName: selectedBox.value.name,
      town: extractTownFromBox(selectedBox.value),
      address: selectedBox.value.currentLocation || '',
      ruleName: '手动创建',
      triggerTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      readStatus: '已读',
      handleStatus: '不需处理',
      starred: false,
      content: `${selectedBox.value.name} — 手动创建收运任务单。`,
    }
    const task = createCollectionTaskFromAlarm(alarmStub, createForm.driver, createForm.destination, createForm.vehicle || undefined, chosenVehicle?.vehicleType)
    ArcoMessage.success(`已创建收运任务单 ${task.id}`)
  } else {
    ArcoMessage.warning('请先选择箱体')
    return
  }
  createVisible.value = false
  selectedBox.value = null
}

function toggleStar(record: SanitationAlarm) {
  record.starred = !record.starred
  if (record.readStatus === '未读') record.readStatus = '已读'
  record.offlineRemark = record.starred ? '已添加星标。' : '已取消星标。'
  selectedAlarm.value = record
  ArcoMessage.success(record.starred ? '已添加星标' : '已取消星标')
}

function openTaskNewWindow(taskId?: string) {
  if (!taskId) return
  const href = router.resolve({ path: '/sanitation/workOrderMonitor', query: { taskId } }).href
  window.open(href, '_blank')
}

function getRowClass(record: SanitationAlarm) {
  return [
    record.id === flashingRowId.value ? 'row-flash' : '',
    record.id === focusedAlarmId.value ? 'row-focus' : '',
  ].filter(Boolean).join(' ')
}

async function focusAlarmFromNotification(alarmId: string) {
  const alarm = sanitationAlarms.find((item) => item.id === alarmId)
  if (!alarm) {
    ArcoMessage.warning('该告警不存在或无查看权限')
    return
  }

  focusedAlarmId.value = alarm.id
  // 顶部消息进入时使用告警编号精确查询，列表只展示目标告警。
  alarmIdKeyword.value = alarm.id
  keyword.value = ''
  typeFilter.value = '全部类型'
  triggerTimeRange.value = []
  readStatusFilter.value = '全部'
  taskStatusFilter.value = '全部'
  starredFilter.value = '全部'
  pagination.current = 1
  selectedAlarm.value = alarm
  detailVisible.value = true

  // 未建任务单的满溢告警自动打开创建弹窗；已建任务单只展示详情和关联任务入口。
  if (alarm.type === '满溢告警' && !alarm.linkedTaskId) openCreate(alarm)
  await nextTick()
  document.querySelector('.row-focus')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(
  () => route.query.focusAlarmId,
  async (value) => {
    const alarmId = Array.isArray(value) ? value[0] : value
    if (!alarmId) return
    await focusAlarmFromNotification(alarmId)

    // 参数仅用于触发一次回填；保留查询框中的 ID，同时清除 URL，确保重复点击同一告警仍可再次触发。
    const query = { ...route.query }
    delete query.focusAlarmId
    delete query.source
    await router.replace({ path: route.path, query })
  },
  { immediate: true },
)

function refreshFlash() {
  const newId = `AL${Date.now()}`
  const newAlarm: SanitationAlarm = {
    id: newId,
    type: '满溢告警',
    level: '严重',
    boxType: '小勾臂箱',
    boxNo: 'XB-FLASH-001',
    boxName: '模拟测试箱体',
    town: '马投涧镇',
    address: '模拟新增告警地址',
    fillRate: 92,
    battery: 68,
    ruleName: '模拟告警规则',
    triggerTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    readStatus: '未读',
    handleStatus: '不需处理',
    starred: false,
    content: '模拟新增告警 — 箱体满溢 92%，请及时处理。',
  }
  sanitationAlarms.unshift(newAlarm)
  flashNotice.value = true
  flashingRowId.value = newId
  window.setTimeout(() => {
    flashingRowId.value = null
    flashNotice.value = false
  }, 3000)
}
</script>

<style scoped lang="scss">
.alarm-center-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 14px;
  min-width: 0;
}

/* 车辆绑定提示行 */
.bind-hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex-basis: 100%;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-3);

  &.unbound .bind-hint-text {
    color: rgb(var(--orange-6));
  }

  .bind-refresh {
    font-size: 14px;
  }
}

.table-panel,
.detail-panel {
  min-width: 0;
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.table-panel {
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  margin-bottom: 14px;
}

.search-input {
  width: 260px;
}

.alarm-id-input {
  width: 190px;
}

.filter-select {
  width: 140px;
}

.task-status-select {
  width: 180px;
}

.flash-tag {
  animation: alarmPulse 1s ease-in-out infinite;
}

.table-star {
  color: #c9cdd4;
  font-size: 18px;
}

.cell-nowrap {
  white-space: nowrap;
}

.table-star--active {
  color: #f7ba1e;
}

.detail-star {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #f7ba1e;
  font-weight: 500;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-weight: 600;
  position: relative;
}

.alarm-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.alarm-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: var(--color-fill-1);
  border-radius: 4px;

  b {
    color: var(--color-text-1);
    font-size: 16px;
  }

  span {
    color: var(--color-text-2);
    line-height: 1.6;
  }
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

@keyframes alarmPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.content-grid--full {
  grid-template-columns: 1fr;
}

.close-btn {
  position: absolute;
  top: -6px;
  right: -6px;
}

.create-modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.create-alarm-info,
.create-operations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text-1);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-2);
}

/* 箱体当前信息：紧凑信息行（与收运单监控-快速创建任务一致） */
.box-info-line {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 20px;
  margin-top: 2px;
  padding: 5px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-1);
  background: var(--color-fill-1);
  border-radius: 4px;

  span {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;

    em {
      font-style: normal;
      color: var(--color-text-3);
    }
  }
}

.overtime {
  color: rgb(var(--danger-6));
}

:deep(.row-flash) {
  animation: rowFlash 1s ease-in-out 3;
}

:deep(.row-focus) {
  td {
    background: rgba(var(--arcoblue-2), 0.75) !important;
  }

  td:first-child {
    box-shadow: inset 4px 0 rgb(var(--arcoblue-6));
  }
}

@keyframes rowFlash {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(var(--danger-6), 0.15); }
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

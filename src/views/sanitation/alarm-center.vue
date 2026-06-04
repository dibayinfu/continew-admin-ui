<template>
  <div class="gi_page alarm-center-page">
    <ModuleHeader
      :title="isCreateMode ? '告警建任务单' : '告警中心'"
      :subtitle="isCreateMode ? '从告警消息或手动选择箱体快速创建收运任务单，支持自动补全箱体、驾驶员、目的地等信息。' : '实时查看箱体满溢、低电量和设备异常消息，支持手动标记待处理和已处理。'"
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

    <!-- 产品需求说明（仅任务单创建模式显示） -->
    <div v-if="isCreateMode" class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🎯 功能要点（开发 / 测试关注）</td></tr>
                  <tr><td class="prd-label">业务流</td><td class="prd-value">满溢告警 → 创建收运任务单 → 任务单监控 → 驾驶员接单 → 收运 → 完成</td></tr>
                  <tr><td class="prd-label">数据关联</td><td class="prd-value">人员档案（drivers）→ 驾驶员/车辆；中转站/焚烧厂（destinations）→ 目的地；箱体档案（boxes）→ 箱体信息/位置</td></tr>
                  <tr><td class="prd-label">入口</td><td class="prd-value">① 右侧详情「基于此消息创建」② 表格行「快速创建」图标（满溢告警行可见）</td></tr>
                  <tr><td class="prd-label">弹窗布局</td><td class="prd-value">上半：告警消息详情（只读）| 下半：任务配置表单（可操作）</td></tr>
                  <tr><td class="prd-label">表单字段</td><td class="prd-value">驾驶员（Select 联动车辆只读）、目的地（按箱体类型过滤）、起点（只读）、时效、优先级、备注</td></tr>
                  <tr><td class="prd-label">默认值</td><td class="prd-value">驾驶员按箱体类型匹配（小勾臂→张师傅/豫E3G516，大勾臂→孙师傅/豫E6N109），目的地对应过滤，时效60min，优先级紧急</td></tr>
                  <tr><td class="prd-label">提交映射</td><td class="prd-value">→ CollectionTask，状态初始「待接单」，轨迹4个占位点，不修改告警 handleStatus</td></tr>
                  <tr><td class="prd-label">模拟新告警</td><td class="prd-value">列表最前插入一条满溢告警，整行闪烁3次，不打开详情面板</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🔑 字段映射规则</td></tr>
                  <tr><td class="prd-label">taskName</td><td class="prd-value">{boxName}满溢{boxType === '小勾臂箱' ? '收运' : '转运'}</td></tr>
                  <tr><td class="prd-label">driver / vehicle</td><td class="prd-value">从 drivers 中按 name 匹配，联动填充 phone / vehicle / vehicleType</td></tr>
                  <tr><td class="prd-label">destination</td><td class="prd-value">从 destinations 中按 name 匹配，自动填充 destinationType / destinationAddress</td></tr>
                  <tr><td class="prd-label">collectionStatus</td><td class="prd-value">初始值 '待接单'</td></tr>
                  <tr><td class="prd-label">overtimeStatus</td><td class="prd-value">初始值 '未超时'</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 边界 & 验收要点</td></tr>
                  <tr><td class="prd-label">✓ 驾驶员切换</td><td class="prd-value">车辆联动更新</td></tr>
                  <tr><td class="prd-label">✓ 箱体类型 → 目的地</td><td class="prd-value">小勾臂只选中转站，大勾臂只选焚烧厂</td></tr>
                  <tr><td class="prd-label">✓ 提交后告警状态</td><td class="prd-value">handleStatus 不变</td></tr>
                  <tr><td class="prd-label">✓ 关联任务</td><td class="prd-value">「看任务」跳转收运单监控页</td></tr>
                  <tr><td class="prd-label">✓ 模拟新告警</td><td class="prd-value">列表新增行闪烁，不打开详情面板</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">当前为 mock 数据，对接后端后需走 API</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="content-grid" :class="{ 'content-grid--full': !detailVisible }">
      <section class="table-panel">
        <div class="toolbar">
          <a-space wrap>
            <a-input-search v-model="keyword" placeholder="搜索箱体/地址/告警内容" allow-clear class="search-input" />
            <a-select v-model="typeFilter" class="filter-select">
              <a-option v-for="item in typeFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
            <a-select v-model="readStatusFilter" placeholder="阅读状态" class="filter-select">
              <a-option v-for="item in readStatusFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
            <a-select v-model="handleStatusFilter" placeholder="处理状态" class="filter-select">
              <a-option v-for="item in handleStatusFilters" :key="item" :value="item">{{ item }}</a-option>
            </a-select>
          </a-space>
          <a-tag v-if="flashNotice" color="red" class="flash-tag">新告警接入</a-tag>
        </div>

        <a-table
          row-key="id"
          :data="filteredAlarms"
          :columns="columns"
          :pagination="{ pageSize: 7, showTotal: true }"
          :scroll="{ x: 1500 }"
          stripe
          :row-class="getRowClass"
          @row-click="(record: any) => selectAlarm(record)"
        >
          <template #readStatus="{ record }">
            <StatusTag :value="record.readStatus" />
          </template>
          <template #cell="{ column, record }">
            <StatusTag v-if="['handleStatus', 'level', 'type'].includes(String(column.dataIndex))" :value="record[column.dataIndex]" />
            <span v-else-if="column.dataIndex === 'fillRate'">{{ record.fillRate ? `${record.fillRate}%` : '-' }}</span>
            <span v-else-if="column.dataIndex === 'battery'">{{ record.battery ? `${record.battery}%` : '-' }}</span>
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
              <span class="action-cell">
                <a-tooltip v-if="record.handleStatus !== '待处理'" content="标记待处理">
                  <a-button size="small" type="text" status="warning" @click="markPending(record)">
                    <template #icon><icon-clock-circle /></template>
                  </a-button>
                </a-tooltip>
              </span>
              <span class="action-cell">
                <a-tooltip v-if="record.handleStatus !== '已处理'" content="标记已处理">
                  <a-button size="small" type="text" status="success" @click="markProcessed(record)">
                    <template #icon><icon-check-circle /></template>
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
            <StatusTag :value="selectedAlarm?.handleStatus" />
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
              <a-descriptions-item label="触发时间">{{ selectedAlarm.triggerTime }}</a-descriptions-item>
              <a-descriptions-item label="处理说明">{{ selectedAlarm.offlineRemark || '暂无处理说明' }}</a-descriptions-item>
              <a-descriptions-item label="关联任务">{{ selectedAlarm.linkedTaskId || '暂未创建' }}</a-descriptions-item>
            </a-descriptions>
          </div>
          <div class="detail-actions">
            <a-button v-if="selectedAlarm.type === '满溢告警'" type="primary" long @click="openCreate(selectedAlarm)">
              基于此消息快速创建收运任务单
            </a-button>
            <a-button status="warning" long @click="markPending(selectedAlarm)">标记待处理</a-button>
            <a-button type="primary" status="success" long @click="markProcessed(selectedAlarm)">标记已处理</a-button>
            <a-button v-if="selectedAlarm.linkedTaskId" long @click="goTask(selectedAlarm.linkedTaskId)">查看关联任务单</a-button>
          </div>
        </template>
      </aside>
    </div>

    <a-modal v-model:visible="createVisible" title="创建收运任务单" width="760px" @ok="submitTask">
      <div class="create-modal-body">
        <!-- 上半部分：有告警上下文 → 显示告警消息 / 无告警 → 选择箱体 -->
        <section v-if="creatingAlarm" class="create-alarm-info">
          <div class="section-title">告警消息</div>
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
            <a-descriptions-item label="所属乡镇">{{ creatingAlarm.town }}</a-descriptions-item>
            <a-descriptions-item label="具体地址" :span="2">{{ creatingAlarm.address }}</a-descriptions-item>
            <a-descriptions-item label="触发时间" :span="2">{{ creatingAlarm.triggerTime }}</a-descriptions-item>
            <a-descriptions-item label="触发规则" :span="2">{{ creatingAlarm.ruleName }}</a-descriptions-item>
          </a-descriptions>
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
            <a-descriptions :column="2" size="small" bordered>
              <a-descriptions-item label="箱体编号">{{ selectedBox.boxNo }}</a-descriptions-item>
              <a-descriptions-item label="箱体类型">{{ selectedBox.boxType }}</a-descriptions-item>
              <a-descriptions-item label="所在位置">{{ selectedBox.currentLocation }}</a-descriptions-item>
              <a-descriptions-item label="所属乡镇">{{ extractTownFromBox(selectedBox) }}</a-descriptions-item>
              <a-descriptions-item label="任务类型" :span="2">{{ selectedBox.boxType === '小勾臂箱' ? '小勾臂箱满溢收运' : '大勾臂箱满溢转运' }}</a-descriptions-item>
            </a-descriptions>
          </template>
        </section>

        <!-- 下半部分：操作区 -->
        <section class="create-operations">
          <div class="section-title">任务配置</div>
          <a-form :model="createForm" layout="vertical">
            <a-grid :cols="2" :col-gap="16">
              <a-grid-item>
                <a-form-item label="驾驶员">
                  <a-select v-model="createForm.driver" @change="onDriverChange">
                    <a-option v-for="item in driverOptionList" :key="item.name" :value="item.name" :label="`${item.name}（${item.vehicle}）`">
                      {{ item.name }}（{{ item.vehicle }}）
                    </a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="车辆">
                  <a-input :model-value="createForm.vehicle" readonly />
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
                <a-form-item label="起点地址">
                  <a-input :model-value="createForm.startAddress" readonly />
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="时效要求">
                  <a-select v-model="createForm.sla">
                    <a-option :value="60">1小时内完成</a-option>
                    <a-option :value="90">1.5小时内完成</a-option>
                    <a-option :value="120">2小时内完成</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item>
                <a-form-item label="优先级">
                  <a-select v-model="createForm.priority">
                    <a-option value="紧急">紧急</a-option>
                    <a-option value="普通">普通</a-option>
                  </a-select>
                </a-form-item>
              </a-grid-item>
              <a-grid-item :span="2">
                <a-form-item label="备注">
                  <a-textarea v-model="createForm.remark" placeholder="填写现场说明或调度要求" />
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
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import {
  createCollectionTaskFromAlarm,
  destinations,
  drivers,
  sanitationAlarms,
  type SanitationAlarm,
} from './data/alert-task'
import { boxes } from './data/mock'

defineOptions({ name: 'SanitationAlarmCenter' })

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const typeFilter = ref('全部类型')
const readStatusFilter = ref('全部')
const handleStatusFilter = ref('全部')
const detailVisible = ref(false)
const flashNotice = ref(false)
const flashingRowId = ref<string | null>(null)
const selectedAlarm = ref<SanitationAlarm>(sanitationAlarms[0])
const createVisible = ref(false)
const creatingAlarm = ref<SanitationAlarm>()
const boxSearchKeyword = ref('')
const selectedBox = ref<(typeof boxes)[number] | null>(null)

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
  createForm.vehicle = defaultDriver.vehicle
  createForm.destination = box.boxType === '小勾臂箱' ? '马投涧中转站' : '龙安生活垃圾焚烧厂'
  createForm.startAddress = box.currentLocation || box.locationName || ''
  createForm.priority = '紧急'
  createForm.sla = 60
  boxSearchKeyword.value = ''
}
const createForm = reactive({
  boxName: '',
  taskType: '',
  driver: '张师傅',
  vehicle: '豫E3G516',
  destination: '马投涧中转站',
  sla: 60,
  priority: '紧急',
  startAddress: '',
  remark: '',
})

const isCreateMode = computed(() => route.path.includes('workOrderCreate'))
const typeFilters = ['全部类型', '满溢告警', '低电量告警', '设备离线', '称重异常']
const readStatusFilters = ['全部', '未读', '已读']
const handleStatusFilters = ['全部', '不需处理', '待处理', '已处理']
const driverOptions = computed(() => drivers.map((item) => item.name))
const driverOptionList = computed(() => drivers)

function onDriverChange(name: string) {
  const driver = drivers.find((item) => item.name === name)
  if (driver) createForm.vehicle = driver.vehicle
}
const destinationOptions = computed(() => {
  if (creatingAlarm.value?.boxType === '大勾臂箱') return destinations.filter((item) => item.type === '焚烧厂').map((item) => item.name)
  return destinations.filter((item) => item.type === '中转站').map((item) => item.name)
})

const metrics = computed(() => [
  { label: '今日告警', value: sanitationAlarms.length, unit: '条', tone: 'danger' },
  { label: '未读', value: sanitationAlarms.filter((item) => item.readStatus === '未读').length, unit: '条', tone: 'danger' },
  { label: '待处理', value: sanitationAlarms.filter((item) => item.handleStatus === '待处理').length, unit: '条', tone: 'warning' },
  { label: '已处理', value: sanitationAlarms.filter((item) => item.handleStatus === '已处理').length, unit: '条', tone: 'success' },
])

const columns = [
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
  { title: '处理状态', dataIndex: 'handleStatus', width: 100 },
  { title: '操作', slotName: 'action', width: 130, align: 'center' as const, fixed: 'right' as const },
]

const filteredAlarms = computed(() => {
  let result = sanitationAlarms
  if (keyword.value) {
    result = result.filter((item) => `${item.boxName}${item.address}${item.content}`.includes(keyword.value))
  }
  if (typeFilter.value !== '全部类型') result = result.filter((item) => item.type === typeFilter.value)
  if (readStatusFilter.value !== '全部') result = result.filter((item) => item.readStatus === readStatusFilter.value)
  if (handleStatusFilter.value !== '全部') result = result.filter((item) => item.handleStatus === handleStatusFilter.value)
  // 默认未读排在前面
  result = [...result].sort((a, b) => {
    if (a.readStatus === '未读' && b.readStatus !== '未读') return -1
    if (a.readStatus !== '未读' && b.readStatus === '未读') return 1
    return 0
  })
  return result
})

function selectAlarm(record: SanitationAlarm) {
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
  createForm.vehicle = defaultDriver.vehicle
  createForm.destination = record.boxType === '小勾臂箱' ? '马投涧中转站' : '龙安生活垃圾焚烧厂'
  createForm.startAddress = record.address
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
  // 有告警上下文 → 基于告警创建；无告警 → 基于选中的箱体创建
  if (creatingAlarm.value) {
    const task = createCollectionTaskFromAlarm(creatingAlarm.value, createForm.driver, createForm.destination)
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
      content: `${selectedBox.value.name} — 手动创建收运任务单。`,
    }
    const task = createCollectionTaskFromAlarm(alarmStub, createForm.driver, createForm.destination)
    ArcoMessage.success(`已创建收运任务单 ${task.id}`)
  } else {
    ArcoMessage.warning('请先选择箱体')
    return
  }
  createVisible.value = false
  selectedBox.value = null
}

function markPending(record: SanitationAlarm) {
  record.handleStatus = '待处理'
  if (record.readStatus === '未读') record.readStatus = '已读'
  record.offlineRemark = '已手动标记为待处理。'
  selectedAlarm.value = record
  ArcoMessage.success('已标记为待处理')
}

function markProcessed(record: SanitationAlarm) {
  record.handleStatus = '已处理'
  if (record.readStatus === '未读') record.readStatus = '已读'
  record.offlineRemark = record.type === '满溢告警' ? '已手动标记为已处理。' : '已线下处理并手动标记为已处理。'
  selectedAlarm.value = record
  ArcoMessage.success('已标记为已处理')
}

function goTask(taskId?: string) {
  router.push({ path: '/sanitation/workOrderMonitor', query: { taskId } })
}

function getRowClass(record: SanitationAlarm) {
  return record.id === flashingRowId.value ? 'row-flash' : ''
}

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

.filter-select {
  width: 140px;
}

.flash-tag {
  animation: alarmPulse 1s ease-in-out infinite;
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

:deep(.row-flash) {
  animation: rowFlash 1s ease-in-out 3;
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

/* 产品需求说明折叠面板 */
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;

  :deep(.arco-collapse-item-header) {
    font-weight: 600;
    font-size: 14px;
  }
}

.prd-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  tr:nth-child(even) {
    background: var(--color-fill-1);
  }

  td {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    vertical-align: top;
    line-height: 1.6;
  }

  .prd-label {
    width: 140px;
    min-width: 140px;
    font-weight: 500;
    color: var(--color-text-2);
    white-space: nowrap;
  }

  .prd-section-row td {
    background: var(--color-fill-2);
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-1);
    padding: 8px 12px;
  }
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

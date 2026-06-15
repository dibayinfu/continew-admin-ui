<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="调度员端"
      subtitle="告警消息 | 运单管控 | 任务追踪。满溢告警一键派单、强制完成、转单操作。"
      phase="APP端"
      priority="P0"
      module="移动端"
    />

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>10:18</span>
          <span>🔋 87%</span>
        </div>

        <div class="phone-body">
          <!-- ===== Tab: 告警消息 ===== -->
          <div v-if="store.activeDispatcherTab === 'alert'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">运营消息</span>
              <span class="top-user">王调度</span>
            </div>
            <div class="alert-stats">
              <div class="astat" @click="alertTabFilter = 'unread'">
                <span class="as-val danger">{{ unreadCount }}</span>
                <span class="as-label">未读</span>
              </div>
              <div class="astat" @click="alertTabFilter = 'pending'">
                <span class="as-val warning">{{ pendingCount }}</span>
                <span class="as-label">待处理</span>
              </div>
              <div class="astat" @click="alertTabFilter = 'processed'">
                <span class="as-val success">{{ processedCount }}</span>
                <span class="as-label">已处理</span>
              </div>
            </div>

            <div class="section-label">告警消息</div>
            <div class="alert-list">
              <div class="alert-card" v-for="a in filteredAlerts" :key="a.id" @click="handleAlertClick(a)">
                <div class="ac-header">
                  <b>{{ a.boxName || a.title }}</b>
                  <a-space size="mini">
                    <span class="ac-tag" :class="'lvl-' + a.level">{{ a.type }}</span>
                    <span class="ac-tag" :class="{ 'tag-unread': a.readStatus === '未读', 'tag-pending': a.handleStatus === '待处理', 'tag-done': a.handleStatus === '已处理' }">{{ a.handleStatus }}</span>
                  </a-space>
                </div>
                <p class="ac-content">{{ a.content }}</p>
                <div class="ac-meta">
                  <span>{{ a.source }}</span>
                  <span>{{ a.time }}</span>
                </div>
                <div class="ac-actions">
                  <a-button v-if="a.handleStatus !== '已处理'" size="mini" @click.stop="markPending(a)">待处理</a-button>
                  <a-button v-if="a.handleStatus !== '已处理'" size="mini" status="success" @click.stop="markProcessed(a)">已处理</a-button>
                  <a-button v-if="a.type === '满溢告警' && !a.linkedTaskId" size="mini" type="primary" @click.stop="dispatchAlert(a)">派单</a-button>
                  <a-button v-if="a.linkedTaskId" size="mini" type="text" @click.stop="viewTask(a)">查看任务</a-button>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== Tab: 运单管控 ===== -->
          <div v-if="store.activeDispatcherTab === 'task'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">运单管控</span>
              <div class="top-actions">
                <span class="filter-btn" :class="{ active: taskFilter === 'all' }" @click="taskFilter = 'all'">全部</span>
                <span class="filter-btn" :class="{ active: taskFilter === 'active' }" @click="taskFilter = 'active'">进行中</span>
              </div>
            </div>

            <div class="wb-stats">
              <div class="wb-stat" v-for="ws in taskStats" :key="ws.label">
                <span class="ws-val" :style="{ color: ws.color }">{{ ws.value }}</span>
                <span class="ws-label">{{ ws.label }}</span>
              </div>
            </div>

            <div class="wb-list">
              <div class="wb-card" v-for="wb in filteredTasks" :key="wb.id" @click="handleTaskClick(wb)">
                <div class="wb-header">
                  <b>{{ wb.taskName }}</b>
                  <span class="wb-status" :class="'wb-' + wb.status">{{ wb.status }}</span>
                </div>
                <div class="wb-info">
                  <span>{{ wb.driver }} · {{ wb.vehicle }}</span>
                  <span class="wb-priority" :class="'pri-' + wb.priority">{{ wb.priority }}</span>
                </div>
                <div class="wb-route">
                  <span>{{ wb.startAddress }}</span>
                  <icon-right class="wb-arrow" />
                  <span>{{ wb.destination }}</span>
                </div>
                <div class="wb-steps">
                  <div v-for="(step, si) in wb.steps" :key="si" class="wb-step">
                    <span class="step-dot" :class="{ done: step.done, current: !step.done && wb.steps[si-1]?.done }"></span>
                    <span class="step-label" :class="{ done: step.done }">{{ step.label }}</span>
                  </div>
                </div>
                <div class="wb-meta-row">
                  <span>截止: {{ wb.deadline }}</span>
                  <span v-if="wb.overtimeStatus === '已超时'" class="overtime-tag">超时</span>
                </div>
                <div class="wb-actions">
                  <a-button v-if="wb.status === '待派发'" size="mini" type="primary" @click.stop="assignTask(wb)">指派</a-button>
                  <a-button v-if="['待接单','已接单','收运中'].includes(wb.status)" size="mini" status="danger" @click.stop="forceFinish(wb)">强制完成</a-button>
                  <a-button v-if="['待接单','已接单','收运中'].includes(wb.status)" size="mini" @click.stop="transferOrder(wb)">转单</a-button>
                  <a-button v-if="wb.weight" size="mini" type="text">称重: {{ wb.weight }}t</a-button>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== Tab: 地图监控 ===== -->
          <div v-if="store.activeDispatcherTab === 'map'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">地图监控</span>
            </div>
            <div class="map-placeholder" @click="handleMapClick">
              <icon-location class="map-icon" />
              <span>车辆 & 箱体实时位置</span>
              <span class="map-hint">共 {{ waybillList.filter(w => ['已接单','收运中'].includes(w.status)).length }} 辆车收运中</span>
            </div>
            <div class="vehicle-list">
              <div class="section-label">在线车辆</div>
              <div class="v-card" v-for="v in activeVehicles" :key="v.vehicle" @click="handleVehicleClick(v)">
                <span class="v-icon">🚛</span>
                <div class="v-info">
                  <span class="v-name">{{ v.driver }} · {{ v.vehicle }}</span>
                  <span class="v-desc">{{ v.taskName }} — {{ v.status }}</span>
                </div>
                <span class="v-status-dot" :class="'dot-' + v.dotColor"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-nav">
          <div v-for="nav in dispatcherNavs" :key="nav.key" class="nav-item" :class="{ active: store.activeDispatcherTab === nav.key }" @click="store.activeDispatcherTab = nav.key">
            <span class="ni-icon">{{ nav.icon }}</span>
            <span class="ni-label">{{ nav.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import {
  alertList,
  waybillList,
  useAppStore,
  type AlertItem,
  type WaybillItem,
} from './data/app-mock'

defineOptions({ name: 'SanitationAppDispatcher' })

const store = useAppStore
const alertTabFilter = ref<'all' | 'unread' | 'pending' | 'processed'>('all')
const taskFilter = ref<'all' | 'active'>('all')

const dispatcherNavs = [
  { key: 'alert', label: '告警消息', icon: '🔔' },
  { key: 'task', label: '运单管控', icon: '📋' },
  { key: 'map', label: '地图监控', icon: '🗺️' },
]

const unreadCount = computed(() => alertList.filter(a => a.readStatus === '未读').length)
const pendingCount = computed(() => alertList.filter(a => a.handleStatus === '待处理').length)
const processedCount = computed(() => alertList.filter(a => a.handleStatus === '已处理').length)

const filteredAlerts = computed(() => {
  if (alertTabFilter.value === 'unread') return alertList.filter(a => a.readStatus === '未读')
  if (alertTabFilter.value === 'pending') return alertList.filter(a => a.handleStatus === '待处理')
  if (alertTabFilter.value === 'processed') return alertList.filter(a => a.handleStatus === '已处理')
  return alertList
})

const taskStats = [
  { label: '全部', value: waybillList.length, color: '#1D2129' },
  { label: '进行中', value: waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status)).length, color: '#165DFF' },
  { label: '已完成', value: waybillList.filter(w => w.status === '已完成').length, color: '#00B42A' },
  { label: '超时', value: waybillList.filter(w => w.overtimeStatus === '已超时').length, color: '#F53F3F' },
]

const filteredTasks = computed(() => {
  if (taskFilter.value === 'active') return waybillList.filter(w => ['待接单','已接单','收运中','待派发'].includes(w.status))
  return waybillList
})

const activeVehicles = computed(() =>
  waybillList
    .filter(w => ['已接单','收运中'].includes(w.status))
    .map(w => ({ driver: w.driver, vehicle: w.vehicle, taskName: w.taskName, status: w.status, dotColor: w.status === '收运中' ? 'green' : 'blue' }))
)

function handleAlertClick(a: AlertItem) { a.readStatus = '已读'; ArcoMessage.info(`查看告警详情：${a.title}`) }
function markPending(a: AlertItem) { a.readStatus = '已读'; a.handleStatus = '待处理'; ArcoMessage.success('已标记待处理') }
function markProcessed(a: AlertItem) { a.readStatus = '已读'; a.handleStatus = '已处理'; ArcoMessage.success('已标记已处理') }
function dispatchAlert(a: AlertItem) {
  const defaultDriver = a.type.includes('大勾臂') ? '孙师傅' : '张师傅'
  a.linkedTaskId = 'WB_DISP_' + Date.now()
  a.handleStatus = '已处理'
  a.readStatus = '已读'
  ArcoMessage.success(`已派单：${a.title} → ${defaultDriver}`)
}
function viewTask(a: AlertItem) { store.activeDispatcherTab = 'task'; ArcoMessage.info(`查看关联任务: ${a.linkedTaskId}`) }
function handleTaskClick(wb: WaybillItem) { ArcoMessage.info(`查看运单详情：${wb.taskName}`) }
function assignTask(wb: WaybillItem) {
  wb.status = '待接单'
  wb.steps[0].done = true
  wb.steps[0].time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  ArcoMessage.success(`已指派：${wb.taskName} → ${wb.driver}`)
}
function forceFinish(wb: WaybillItem) {
  wb.status = '已完成'
  wb.steps.forEach(s => { s.done = true; if (!s.time) s.time = '--' })
  ArcoMessage.success(`已强制完成：${wb.taskName}`)
}
function transferOrder(wb: WaybillItem) {
  const drivers = ['张师傅', '李师傅', '孙师傅', '王师傅']
  const next = drivers.find(d => d !== wb.driver) || '备用司机'
  wb.driver = next
  ArcoMessage.success(`已转单至 ${next}`)
}
function handleMapClick() { ArcoMessage.info('正在加载实时地图监控...') }
function handleVehicleClick(v: { driver: string; vehicle: string }) { ArcoMessage.info(`查看 ${v.driver} (${v.vehicle}) 实时轨迹`) }
</script>

<style scoped lang="scss">
.sanitation-page { display: flex; flex-direction: column; gap: 14px; }
.phone-wrapper { display: flex; justify-content: center; padding: 12px 0; }
.phone-frame { width: 390px; min-height: 780px; background: #f0f2f5; border: 3px solid #1f2937; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.16); display: flex; flex-direction: column; }
.phone-status-bar { display: flex; justify-content: space-between; padding: 10px 20px 4px; background: #fff; font-size: 12px; color: #1d2129; font-weight: 600; }
.phone-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.phone-content { flex: 1; overflow-y: auto; padding: 0 14px 12px; background: #f0f2f5; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
.top-title { font-size: 18px; font-weight: 700; color: #1d2129; }
.top-user { font-size: 13px; color: rgb(var(--arcoblue-6)); font-weight: 600; }
.top-actions { display: flex; gap: 6px; }
.filter-btn { padding: 3px 10px; font-size: 12px; color: #86909c; background: #fff; border-radius: 12px; cursor: pointer; &.active { background: rgb(var(--arcoblue-6)); color: #fff; } }
.alert-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.astat { display: flex; flex-direction: column; align-items: center; padding: 12px 8px; background: #fff; border-radius: 10px; cursor: pointer; &:active { transform: scale(.97); } }
.as-val { font-size: 24px; font-weight: 700; } .as-label { font-size: 11px; color: #86909c; margin-top: 2px; }
.danger { color: #f53f3f; } .warning { color: #ff7d00; } .success { color: #00b42a; }
.section-label { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 8px; }
.alert-list { display: flex; flex-direction: column; gap: 8px; }
.alert-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.ac-header { display: flex; justify-content: space-between; align-items: center; b { font-size: 14px; color: #1d2129; } }
.ac-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.lvl-严重 { background: #fff0f0; color: #f53f3f; } .lvl-重要 { background: #fff7e8; color: #ff7d00; } .lvl-一般 { background: #f2f3f5; color: #86909c; }
.tag-unread { background: #e8f3ff; color: #165dff; font-weight: 600; }
.tag-pending { background: #fff7e8; color: #ff7d00; } .tag-done { background: #e8ffea; color: #00b42a; }
.ac-content { font-size: 12px; color: #4e5969; margin: 6px 0; }
.ac-meta { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; margin-bottom: 6px; }
.ac-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.wb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
.wb-stat { display: flex; flex-direction: column; align-items: center; padding: 8px; background: #fff; border-radius: 8px; }
.ws-val { font-size: 16px; font-weight: 700; } .ws-label { font-size: 10px; color: #86909c; }
.wb-list { display: flex; flex-direction: column; gap: 8px; }
.wb-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.wb-header { display: flex; justify-content: space-between; align-items: center; b { font-size: 13px; } }
.wb-status { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.wb-待派发 { background: #f2f3f5; color: #86909c; } .wb-待接单 { background: #fff7e8; color: #ff7d00; }
.wb-已接单, .wb-收运中 { background: #e8f3ff; color: #165dff; } .wb-已完成 { background: #e8ffea; color: #00b42a; }
.wb-info { display: flex; justify-content: space-between; font-size: 11px; color: #86909c; margin: 4px 0; }
.wb-priority { font-size: 10px; padding: 0 4px; border-radius: 3px; }
.pri-紧急 { background: #fff0f0; color: #f53f3f; } .pri-普通 { background: #f2f3f5; color: #86909c; }
.wb-route { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #4e5969; margin-bottom: 8px; }
.wb-arrow { font-size: 10px; color: #c9cdd4; }
.wb-steps { display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap; }
.wb-step { display: flex; align-items: center; gap: 2px; }
.step-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e6eb; }
.step-dot.done { background: #00b42a; } .step-dot.current { background: rgb(var(--arcoblue-6)); }
.step-label { font-size: 9px; color: #c9cdd4; } .step-label.done { color: #4e5969; }
.wb-meta-row { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; margin-bottom: 6px; }
.overtime-tag { color: #f53f3f; font-weight: 600; }
.wb-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.map-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 160px; background: linear-gradient(135deg, #e8f3ff, #d4e8ff); border-radius: 12px; cursor: pointer; margin-bottom: 12px; }
.map-icon { font-size: 36px; color: rgb(var(--arcoblue-6)); }
.map-placeholder span { font-size: 14px; color: #4e5969; margin-top:4px; } .map-hint { font-size:11px; color:#86909c; }
.vehicle-list { display:flex; flex-direction:column; gap:8px; }
.v-card { display:flex; align-items:center; gap:10px; padding:12px; background:#fff; border-radius:10px; cursor:pointer; &:active{background:#f7f8fa;} }
.v-icon { font-size:24px; } .v-info { flex:1; display:flex; flex-direction:column; }
.v-name { font-size:13px; color:#1d2129; font-weight:500; } .v-desc { font-size:11px; color:#86909c; }
.v-status-dot { width:10px; height:10px; border-radius:50%; }
.dot-green { background:#00b42a; } .dot-blue { background:#165dff; }
.bottom-nav { display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px 0 18px; background: #fff; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.ni-icon { font-size: 20px; } .ni-label { font-size: 10px; color: #86909c; }
.nav-item.active .ni-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
</style>

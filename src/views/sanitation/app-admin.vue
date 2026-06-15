<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="管理员端"
      subtitle="综合看板 | 箱体监控 | 运单监控 | 告警中心。所有模块可点击交互，含模拟数据。"
      phase="APP端"
      priority="P0"
      module="移动端"
    />

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>10:15</span>
          <span>🔋 95%</span>
        </div>

        <div class="phone-body">
          <!-- ===== Tab: 综合看板 ===== -->
          <div v-if="store.activeAdminTab === 'home'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">管理员端</span>
              <span class="top-user">李经理</span>
            </div>
            <div class="metrics-grid">
              <div class="metric-card" v-for="m in adminMetrics" :key="m.label" @click="handleMetricClick(m)">
                <span class="m-label">{{ m.label }}</span>
                <span class="m-value" :style="{ color: m.color }">{{ m.value }}</span>
                <span class="m-trend">{{ m.trend }}</span>
              </div>
            </div>
            <div class="card-panel">
              <div class="panel-title">今日运行</div>
              <div class="run-grid">
                <div class="run-item" v-for="r in todayRun" :key="r.label" @click="handleRunClick(r)">
                  <span class="r-label">{{ r.label }}</span>
                  <span class="r-value" :style="{ color: r.color }">{{ r.value }}</span>
                </div>
              </div>
            </div>
            <div class="card-panel">
              <div class="panel-title">
                箱体状态
                <span class="panel-action" @click="store.activeAdminTab = 'box'">查看全部 →</span>
              </div>
              <div class="box-summary">
                <div class="box-stat" v-for="bs in boxSummary" :key="bs.label" @click="handleBoxSummary(bs)">
                  <span class="bs-count" :style="{ color: bs.color }">{{ bs.count }}</span>
                  <span class="bs-label">{{ bs.label }}</span>
                </div>
              </div>
            </div>
            <div class="card-panel">
              <div class="panel-title">
                异常提醒
                <span class="panel-action" @click="store.activeAdminTab = 'alert'">查看全部 →</span>
              </div>
              <div class="alert-mini-list">
                <div class="alert-mini" v-for="a in alertList.slice(0, 3)" :key="a.id" @click="handleAlertClick(a)">
                  <span class="am-dot" :class="'dot-' + a.level"></span>
                  <div class="am-body">
                    <span class="am-title">{{ a.title }}</span>
                    <span class="am-time">{{ a.time }}</span>
                  </div>
                  <span v-if="a.handleStatus === '待处理'" class="am-tag tag-pending">待处理</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== Tab: 箱体监控 ===== -->
          <div v-if="store.activeAdminTab === 'box'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">箱体监控</span>
              <div class="top-actions">
                <span class="filter-btn" :class="{ active: boxFilter === 'all' }" @click="boxFilter = 'all'">全部</span>
                <span class="filter-btn" :class="{ active: boxFilter === 'overflow' }" @click="boxFilter = 'overflow'">满溢</span>
                <span class="filter-btn" :class="{ active: boxFilter === 'offline' }" @click="boxFilter = 'offline'">离线</span>
              </div>
            </div>
            <div class="box-list">
              <div class="box-card" v-for="box in filteredBoxes" :key="box.id" @click="handleBoxClick(box)">
                <div class="box-header">
                  <b>{{ box.boxName }}</b>
                  <span class="box-status-tag" :class="'status-' + box.status">{{ boxStatusMap[box.status] }}</span>
                </div>
                <div class="box-meta">
                  <span>{{ box.town }} · {{ box.village }}</span>
                  <span>{{ box.boxNo }}</span>
                </div>
                <div class="box-gauges">
                  <div class="gauge">
                    <span class="g-label">满溢率</span>
                    <div class="g-bar-bg"><div class="g-bar" :class="'bar-' + box.status" :style="{ width: box.fillRate + '%' }"></div></div>
                    <span class="g-val">{{ box.fillRate }}%</span>
                  </div>
                  <div class="gauge">
                    <span class="g-label">电量</span>
                    <div class="g-bar-bg"><div class="g-bar bar-battery" :class="box.battery < 20 ? 'bar-offline' : ''" :style="{ width: box.battery + '%' }"></div></div>
                    <span class="g-val">{{ box.battery }}%</span>
                  </div>
                </div>
                <div class="box-footer">
                  <span>锁状态: {{ box.lockStatus }}</span>
                  <span>{{ box.lastReport }}</span>
                </div>
                <div class="box-actions">
                  <a-button size="mini" type="primary" @click.stop="handleBoxAction(box, 'lock')">
                    {{ box.lockStatus === '关锁' ? '远程开锁' : '远程关锁' }}
                  </a-button>
                  <a-button size="mini" @click.stop="handleBoxAction(box, 'detail')">详情</a-button>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== Tab: 运单监控 ===== -->
          <div v-if="store.activeAdminTab === 'waybill'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">运单监控</span>
              <div class="top-actions">
                <span class="filter-btn" :class="{ active: wbFilter === 'all' }" @click="wbFilter = 'all'">全部</span>
                <span class="filter-btn" :class="{ active: wbFilter === 'active' }" @click="wbFilter = 'active'">进行中</span>
              </div>
            </div>
            <div class="wb-stats">
              <div class="wb-stat" v-for="ws in waybillStats" :key="ws.label">
                <span class="ws-val" :style="{ color: ws.color }">{{ ws.value }}</span>
                <span class="ws-label">{{ ws.label }}</span>
              </div>
            </div>
            <div class="wb-list">
              <div class="wb-card" v-for="wb in filteredWaybills" :key="wb.id" @click="handleWaybillClick(wb)">
                <div class="wb-header">
                  <b>{{ wb.taskName }}</b>
                  <span class="wb-status" :class="'wb-' + wb.status">{{ wbStatusMap[wb.status] || wb.status }}</span>
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
                    <span v-if="step.time" class="step-time">{{ step.time }}</span>
                  </div>
                </div>
                <div class="wb-actions">
                  <a-button v-if="wb.status === '待派发'" size="mini" type="primary" @click.stop="handleDispatch(wb)">派单</a-button>
                  <a-button v-if="['待接单','已接单','收运中'].includes(wb.status)" size="mini" status="danger" @click.stop="handleForceFinish(wb)">强制完成</a-button>
                  <a-button size="mini" @click.stop="handleWaybillDetail(wb)">详情</a-button>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== Tab: 告警中心 ===== -->
          <div v-if="store.activeAdminTab === 'alert'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">告警中心</span>
              <span class="top-badge">未处理 {{ unhandledAlertCount }}</span>
            </div>
            <div class="alert-full-list">
              <div class="alert-full-card" v-for="a in alertList" :key="a.id" @click="handleFullAlertClick(a)">
                <div class="af-header">
                  <span class="af-type" :class="'type-' + a.level">{{ a.type }}</span>
                  <span class="af-status" :class="{ pending: a.handleStatus === '待处理', done: a.handleStatus === '已处理' }">{{ a.handleStatus }}</span>
                </div>
                <b class="af-title">{{ a.title }}</b>
                <p class="af-content">{{ a.content }}</p>
                <div class="af-meta">
                  <span>{{ a.source }}</span>
                  <span>{{ a.time }}</span>
                </div>
                <div class="af-actions">
                  <a-button v-if="a.handleStatus === '待处理'" size="mini" type="primary" @click.stop="handleMarkProcessed(a)">标记已处理</a-button>
                  <a-button v-if="a.type === '满溢告警' && !a.linkedTaskId" size="mini" type="primary" status="success" @click.stop="handleAlertDispatch(a)">派单</a-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-nav">
          <div v-for="nav in adminNavs" :key="nav.key" class="nav-item" :class="{ active: store.activeAdminTab === nav.key }" @click="store.activeAdminTab = nav.key">
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
  adminMetricsData,
  alertList,
  boxMonitorList,
  waybillList,
  useAppStore,
  type BoxMonitorItem,
  type WaybillItem,
  type AlertItem,
} from './data/app-mock'

defineOptions({ name: 'SanitationAppAdmin' })

const store = useAppStore
const boxFilter = ref<'all' | 'overflow' | 'offline'>('all')
const wbFilter = ref<'all' | 'active'>('all')

const boxStatusMap: Record<string, string> = { normal: '正常', warning: '预警', overflow: '满溢', offline: '离线' }
const wbStatusMap: Record<string, string> = { '待派发': '待派发', '待接单': '待接单', '已接单': '已接单', '收运中': '收运中', '已完成': '已完成' }

const adminMetrics = [
  { label: '今日垃圾量', value: adminMetricsData.todayWaste, trend: '↑ 2.1%', color: '#165DFF' },
  { label: '车辆在线率', value: adminMetricsData.vehicleOnlineRate, trend: '正常', color: '#00B42A' },
  { label: '任务完成率', value: adminMetricsData.taskCompleteRate, trend: '↑ 1.5%', color: '#00B42A' },
  { label: '告警处理率', value: adminMetricsData.alertHandleRate, trend: '需关注', color: '#FF7D00' },
]

const todayRun = [
  { label: '在线车辆', value: adminMetricsData.onlineVehicles, color: '#00B42A' },
  { label: '设备离线', value: adminMetricsData.offlineDevices, color: '#FF7D00' },
  { label: '未处理告警', value: adminMetricsData.unhandledAlerts, color: '#F53F3F' },
  { label: '今日趟数', value: adminMetricsData.todayTrips, color: '#165DFF' },
]

const boxSummary = [
  { label: '正常', count: boxMonitorList.filter(b => b.status === 'normal').length, color: '#00B42A' },
  { label: '预警', count: boxMonitorList.filter(b => b.status === 'warning').length, color: '#FF7D00' },
  { label: '满溢', count: boxMonitorList.filter(b => b.status === 'overflow').length, color: '#F53F3F' },
  { label: '离线', count: boxMonitorList.filter(b => b.status === 'offline').length, color: '#86909C' },
]

const waybillStats = [
  { label: '全部', value: waybillList.length, color: '#1D2129' },
  { label: '进行中', value: waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status)).length, color: '#165DFF' },
  { label: '已完成', value: waybillList.filter(w => w.status === '已完成').length, color: '#00B42A' },
  { label: '超时', value: waybillList.filter(w => w.overtimeStatus === '已超时').length, color: '#F53F3F' },
]

const filteredBoxes = computed(() => {
  if (boxFilter.value === 'overflow') return boxMonitorList.filter(b => b.status === 'overflow')
  if (boxFilter.value === 'offline') return boxMonitorList.filter(b => b.status === 'offline')
  return boxMonitorList
})

const filteredWaybills = computed(() => {
  if (wbFilter.value === 'active') return waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status))
  return waybillList
})

const unhandledAlertCount = computed(() => alertList.filter(a => a.handleStatus === '待处理').length)

const adminNavs = [
  { key: 'home', label: '综合看板', icon: '📊' },
  { key: 'box', label: '箱体监控', icon: '📦' },
  { key: 'waybill', label: '运单监控', icon: '📋' },
  { key: 'alert', label: '告警中心', icon: '🔔' },
]

function handleMetricClick(m: typeof adminMetrics[0]) { ArcoMessage.info(`查看「${m.label}」详情：${m.value}，趋势：${m.trend}`) }
function handleRunClick(r: typeof todayRun[0]) { ArcoMessage.info(`查看「${r.label}」详情：${r.value}`) }
function handleBoxSummary(bs: typeof boxSummary[0]) { store.activeAdminTab = 'box'; boxFilter.value = bs.label === '正常' ? 'all' : bs.label === '满溢' ? 'overflow' : bs.label === '离线' ? 'offline' : 'all' }
function handleAlertClick(_a: AlertItem) { store.activeAdminTab = 'alert' }
function handleBoxClick(box: BoxMonitorItem) { ArcoMessage.info(`查看箱体详情：${box.boxName}`) }
function handleBoxAction(box: BoxMonitorItem, action: string) {
  if (action === 'lock') ArcoMessage.success(`已发送${box.lockStatus === '关锁' ? '开锁' : '关锁'}指令到 ${box.boxName}`)
  else ArcoMessage.info(`查看 ${box.boxName} 详细信息`)
}
function handleWaybillClick(wb: WaybillItem) { ArcoMessage.info(`查看运单详情：${wb.taskName}`) }
function handleDispatch(wb: WaybillItem) {
  wb.status = '待接单'; wb.steps[0].done = true
  wb.steps[0].time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  ArcoMessage.success(`已派单：${wb.taskName} → ${wb.driver}`)
}
function handleForceFinish(wb: WaybillItem) {
  wb.status = '已完成'
  wb.steps.forEach(s => { s.done = true; if (!s.time) s.time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
  ArcoMessage.success(`已强制完成：${wb.taskName}`)
}
function handleWaybillDetail(wb: WaybillItem) { ArcoMessage.info(`运单详情 - 司机: ${wb.driver}, 车辆: ${wb.vehicle}, 截止: ${wb.deadline}`) }
function handleFullAlertClick(a: AlertItem) { a.readStatus = '已读'; ArcoMessage.info(`查看告警详情：${a.title}`) }
function handleMarkProcessed(a: AlertItem) { a.handleStatus = '已处理'; a.readStatus = '已读'; ArcoMessage.success(`已标记处理：${a.title}`) }
function handleAlertDispatch(a: AlertItem) { a.linkedTaskId = 'WB007'; a.handleStatus = '已处理'; ArcoMessage.success(`已派单：${a.title}`) }
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
.top-badge { font-size: 12px; color: #f53f3f; font-weight: 600; }
.top-actions { display: flex; gap: 6px; }
.filter-btn { padding: 3px 10px; font-size: 12px; color: #86909c; background: #fff; border-radius: 12px; cursor: pointer; &.active { background: rgb(var(--arcoblue-6)); color: #fff; } }
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
.metric-card { display: flex; flex-direction: column; align-items: center; padding: 14px 8px; background: #fff; border-radius: 10px; cursor: pointer; &:active { transform: scale(.97); } }
.m-label { font-size: 11px; color: #86909c; } .m-value { font-size: 24px; font-weight: 700; margin: 4px 0; } .m-trend { font-size: 10px; color: #86909c; }
.card-panel { background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
.panel-title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 8px; display: flex; justify-content: space-between; }
.panel-action { font-size: 12px; color: rgb(var(--arcoblue-6)); cursor: pointer; font-weight: 400; }
.run-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.run-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 8px 4px; &:active { background: #f7f8fa; border-radius: 6px; } }
.r-label { font-size: 11px; color: #86909c; } .r-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
.box-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.box-stat { display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 8px 4px; &:active { background: #f7f8fa; border-radius: 6px; } }
.bs-count { font-size: 18px; font-weight: 700; } .bs-label { font-size: 10px; color: #86909c; }
.alert-mini-list { display: flex; flex-direction: column; gap: 6px; }
.alert-mini { display: flex; align-items: center; gap: 8px; padding: 8px; background: #f7f8fa; border-radius: 8px; cursor: pointer; &:active { background: #e8f3ff; } }
.am-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-严重 { background: #f53f3f; } .dot-重要 { background: #ff7d00; } .dot-一般 { background: #f7ba1e; }
.am-body { flex: 1; display: flex; flex-direction: column; }
.am-title { font-size: 12px; color: #1d2129; font-weight: 500; } .am-time { font-size: 10px; color: #c9cdd4; }
.am-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; } .tag-pending { background: #fff0f0; color: #f53f3f; }
.box-list { display: flex; flex-direction: column; gap: 8px; }
.box-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.box-header { display: flex; justify-content: space-between; align-items: center; b { font-size: 14px; color: #1d2129; } }
.box-status-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.status-normal { background: #e8ffea; color: #00b42a; } .status-warning { background: #fff7e8; color: #ff7d00; }
.status-overflow { background: #fff0f0; color: #f53f3f; } .status-offline { background: #f2f3f5; color: #86909c; }
.box-meta { display: flex; justify-content: space-between; font-size: 11px; color: #86909c; margin: 6px 0; }
.box-gauges { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
.gauge { display: flex; align-items: center; gap: 6px; }
.g-label { font-size: 10px; color: #86909c; width: 36px; flex-shrink: 0; }
.g-bar-bg { flex: 1; height: 6px; background: #e5e6eb; border-radius: 3px; overflow: hidden; }
.g-bar { height: 100%; border-radius: 3px; }
.bar-normal { background: #00b42a; } .bar-warning { background: #ff7d00; } .bar-overflow { background: #f53f3f; } .bar-offline { background: #86909c; }
.bar-battery { background: rgb(var(--arcoblue-6)); }
.g-val { font-size: 10px; color: #1d2129; width: 28px; text-align: right; }
.box-footer { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; margin-bottom: 6px; }
.box-actions { display: flex; gap: 6px; }
.wb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
.wb-stat { display: flex; flex-direction: column; align-items: center; padding: 8px; background: #fff; border-radius: 8px; }
.ws-val { font-size: 16px; font-weight: 700; } .ws-label { font-size: 10px; color: #86909c; }
.wb-list { display: flex; flex-direction: column; gap: 8px; }
.wb-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.wb-header { display: flex; justify-content: space-between; align-items: center; b { font-size: 13px; } }
.wb-status { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.wb-待派发 { background: #f2f3f5; color: #86909c; } .wb-待接单 { background: #fff7e8; color: #ff7d00; }
.wb-已接单, .wb-收运中 { background: #e8f3ff; color: #165dff; } .wb-已完成 { background: #e8ffea; color: #00b42a; }
.wb-info { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #86909c; margin: 4px 0; }
.wb-priority { font-size: 10px; padding: 0 4px; border-radius: 3px; }
.pri-紧急 { background: #fff0f0; color: #f53f3f; } .pri-普通 { background: #f2f3f5; color: #86909c; }
.wb-route { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #4e5969; margin-bottom: 8px; }
.wb-arrow { font-size: 10px; color: #c9cdd4; }
.wb-steps { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
.wb-step { display: flex; align-items: center; gap: 2px; }
.step-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e6eb; }
.step-dot.done { background: #00b42a; } .step-dot.current { background: rgb(var(--arcoblue-6)); }
.step-label { font-size: 9px; color: #c9cdd4; } .step-label.done { color: #4e5969; } .step-time { font-size: 8px; color: #86909c; }
.wb-actions { display: flex; gap: 6px; }
.alert-full-list { display: flex; flex-direction: column; gap: 8px; }
.alert-full-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.af-header { display: flex; justify-content: space-between; align-items: center; }
.af-type { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.type-严重 { background: #fff0f0; color: #f53f3f; } .type-重要 { background: #fff7e8; color: #ff7d00; } .type-一般 { background: #f2f3f5; color: #86909c; }
.af-status { font-size: 11px; } .af-status.pending { color: #ff7d00; font-weight: 600; } .af-status.done { color: #00b42a; }
b.af-title { font-size: 14px; color: #1d2129; display: block; margin: 6px 0 4px; }
p.af-content { font-size: 12px; color: #4e5969; margin: 0 0 6px; }
.af-meta { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; margin-bottom: 6px; }
.af-actions { display: flex; gap: 6px; }
.bottom-nav { display: grid; grid-template-columns: repeat(4, 1fr); padding: 8px 0 18px; background: #fff; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.ni-icon { font-size: 20px; } .ni-label { font-size: 10px; color: #86909c; }
.nav-item.active .ni-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
</style>

<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="管理员端"
      subtitle="收运看板 | 箱体监控。所有模块可点击交互，含模拟数据。"
      phase="APP端"
      priority="P0"
      module="移动端"
    />

    <!-- 产品需求说明 -->
    <div class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🎯 功能要点（开发 / 测试关注）</td></tr>
                  <tr><td class="prd-label">页面</td><td class="prd-value">管理员端 APP，单手机框 + 底部双 Tab（收运看板 / 箱体监控），覆盖管理员日常巡检和快速调度场景</td></tr>
                  <tr><td class="prd-label">目标用户</td><td class="prd-value">管理员（如李经理），负责整体运营态势感知、箱体设备巡检和异常告警关注</td></tr>
                  <tr><td class="prd-label">与调度员端关系</td><td class="prd-value">管理员也可拥有调度权限，通过权限开通后访问调度员端的「告警派单」和「运单监控」页面；管理员端聚焦看板和箱体巡检，避免与调度员端功能重复</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">📊 Tab 1：收运看板</td></tr>
                  <tr><td class="prd-label">核心指标</td><td class="prd-value">2 张卡片，今/昨对比：① 任务数（今日 X 单 / 昨日 Y 单）、② 垃圾量（今日 X t / 昨日 Y t）。今日数值蓝/绿色高亮，昨日灰色弱化，对比直观</td></tr>
                  <tr><td class="prd-label">今日运行</td><td class="prd-value">4 项实时状态：在线车辆、进行中（待接单+已接单+收运中）、超时任务、未处理告警；数据基于运单列表和告警列表实时计算</td></tr>
                  <tr><td class="prd-label">箱体状态</td><td class="prd-value">4 项统计：全部、正常、满溢、离线；点击可跳转箱体监控 Tab 并带入对应筛选条件</td></tr>
                  <tr><td class="prd-label">异常告警</td><td class="prd-value">过滤掉满溢告警（满溢由调度员处理），仅展示低电量、设备离线等非满溢类告警，最多 3 条，带「查看全部 →」链接</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">📦 Tab 2：箱体监控</td></tr>
                  <tr><td class="prd-label">箱体分类</td><td class="prd-value">顶部切换「小勾臂箱」/「大勾臂箱」，各 10 条模拟数据；标题显示当前类型和数量（如"小勾臂箱 · 10个"）</td></tr>
                  <tr><td class="prd-label">搜索</td><td class="prd-value">小勾臂箱 Tab 下显示搜索框，支持按箱体编号或名称模糊查询</td></tr>
                  <tr><td class="prd-label">状态筛选</td><td class="prd-value">全部 / 满溢 / 离线 三个筛选按钮，与类型筛选和搜索联合过滤</td></tr>
                  <tr><td class="prd-label">箱体卡片</td><td class="prd-value">展示箱体名称、状态标签、乡镇/村庄、编号、满溢率进度条、电量进度条</td></tr>
                  <tr><td class="prd-label">匹配对象</td><td class="prd-value">卡片中高亮显示匹配对象：小勾臂箱 → 对应中转站（如龙泉中转站），大勾臂箱 → 对应焚烧厂（如龙安焚烧厂），直观展示箱体去向</td></tr>
                  <tr><td class="prd-label">展开详情</td><td class="prd-value">点击「详情」按钮本条下拉展开更多信息：箱体编号、类型、乡镇、村庄、匹配对象、具体地址、锁状态、最后上报时间；展开时按钮变蓝高亮，再次点击收起</td></tr>
                  <tr><td class="prd-label">远程开锁</td><td class="prd-value">仅小勾臂箱显示「远程开锁/关锁」按钮，大勾臂箱无此功能</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 边界 & 验收要点</td></tr>
                  <tr><td class="prd-label">✓ 指标卡今/昨对比</td><td class="prd-value">任务数和垃圾量分别在一张卡内今/昨左右对比，今日高亮、昨日灰色</td></tr>
                  <tr><td class="prd-label">✓ 今日运行实时计算</td><td class="prd-value">在线车辆、进行中、超时任务、未处理告警基于 waybillList 和 alertList 实时计算</td></tr>
                  <tr><td class="prd-label">✓ 箱体状态联动</td><td class="prd-value">点击正常/满溢/离线可跳转箱体监控并带入筛选</td></tr>
                  <tr><td class="prd-label">✓ 异常告警过滤</td><td class="prd-value">仅展示非满溢类告警，满溢告警由调度员端处理</td></tr>
                  <tr><td class="prd-label">✓ 箱体类型切换</td><td class="prd-value">小勾臂/大勾臂切换流畅，数据独立过滤</td></tr>
                  <tr><td class="prd-label">✓ 搜索过滤</td><td class="prd-value">小勾臂箱搜索按编号/名称模糊匹配</td></tr>
                  <tr><td class="prd-label">✓ 匹配对象</td><td class="prd-value">小勾臂→中转站，大勾臂→焚烧厂，基于乡镇映射</td></tr>
                  <tr><td class="prd-label">✓ 展开详情</td><td class="prd-value">点击详情展开/收起，信息完整，按钮状态切换</td></tr>
                  <tr><td class="prd-label">✓ 远程开锁</td><td class="prd-value">仅小勾臂箱显示，大勾臂箱无此按钮</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">箱体数据为 generateBoxes() 生成，运单/告警来自 app-mock.ts；后续对接后端需走 API</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>10:15</span>
          <span>🔋 95%</span>
        </div>

        <div class="phone-body">
          <!-- ===== Tab: 收运看板 ===== -->
          <div v-if="store.activeAdminTab === 'home'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">管理员端</span>
              <span class="top-user">李经理</span>
            </div>
            <div class="metrics-grid">
              <div class="metric-card" v-for="m in adminMetrics" :key="m.label">
                <span class="m-label">{{ m.label }}</span>
                <div class="m-compare">
                  <div class="mc-item">
                    <span class="mc-num" :style="{ color: m.todayColor }">{{ m.today }}</span>
                    <span class="mc-tag">今日</span>
                  </div>
                  <div class="mc-item">
                    <span class="mc-num" :style="{ color: m.yesterdayColor }">{{ m.yesterday }}</span>
                    <span class="mc-tag">昨日</span>
                  </div>
                </div>
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
                异常告警
                <span class="panel-action" @click="handleAlertClick(nonOverflowAlerts[0])">查看全部 →</span>
              </div>
              <div class="alert-mini-list">
                <div class="alert-mini" v-for="a in nonOverflowAlerts.slice(0, 3)" :key="a.id" @click="handleAlertClick(a)">
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
              <span class="top-user">{{ boxTypeFilter === 'small' ? '小勾臂箱' : '大勾臂箱' }} · {{ filteredBoxes.length }}个</span>
            </div>
            <div class="top-actions" style="margin-bottom: 8px;">
              <span class="filter-btn" :class="{ active: boxTypeFilter === 'small' }" @click="boxTypeFilter = 'small'">小勾臂箱</span>
              <span class="filter-btn" :class="{ active: boxTypeFilter === 'large' }" @click="boxTypeFilter = 'large'">大勾臂箱</span>
            </div>
            <input v-if="boxTypeFilter === 'small'" v-model="boxKeyword" class="box-search" placeholder="输入箱体编号或名称搜索" />
            <div class="top-actions" style="margin-bottom: 8px;">
              <span class="filter-btn" :class="{ active: boxStatusFilter === 'all' }" @click="boxStatusFilter = 'all'">全部</span>
              <span class="filter-btn" :class="{ active: boxStatusFilter === 'overflow' }" @click="boxStatusFilter = 'overflow'">满溢</span>
              <span class="filter-btn" :class="{ active: boxStatusFilter === 'offline' }" @click="boxStatusFilter = 'offline'">离线</span>
            </div>
            <div class="box-list">
              <div class="box-card" v-for="box in filteredBoxes" :key="box.id">
                <div class="box-header" @click="toggleBoxDetail(box)">
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
                <div class="box-match">
                  <span class="bm-label">匹配对象</span>
                  <span class="bm-value">{{ getMatchTarget(box) }}</span>
                </div>
                <div class="box-footer">
                  <span>锁状态: {{ box.lockStatus }}</span>
                  <span>{{ box.lastReport }}</span>
                </div>

                <!-- 展开详情 -->
                <div v-if="expandedBoxId === box.id" class="box-expand" @click.stop>
                  <div class="bex-row"><span>箱体编号</span><b>{{ box.boxNo }}</b></div>
                  <div class="bex-row"><span>箱体类型</span><b>{{ box.boxType }}</b></div>
                  <div class="bex-row"><span>所在乡镇</span><b>{{ box.town }}</b></div>
                  <div class="bex-row"><span>所在村庄</span><b>{{ box.village }}</b></div>
                  <div class="bex-row"><span>匹配对象</span><b>{{ getMatchTarget(box) }}</b></div>
                  <div class="bex-row"><span>具体地址</span><b>{{ getBoxAddress(box) }}</b></div>
                  <div class="bex-row"><span>锁状态</span><b>{{ box.lockStatus }}</b></div>
                  <div class="bex-row"><span>最后上报</span><b>{{ box.lastReport }}</b></div>
                </div>

                <div class="box-actions">
                  <a-button v-if="box.boxType === '小勾臂箱'" size="mini" type="primary" @click.stop="handleBoxAction(box, 'lock')">
                    {{ box.lockStatus === '关锁' ? '远程开锁' : '远程关锁' }}
                  </a-button>
                  <a-button size="mini" :type="expandedBoxId === box.id ? 'primary' : 'outline'" @click.stop="toggleBoxDetail(box)">详情</a-button>
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
  alertList,
  waybillList,
  useAppStore,
  type BoxMonitorItem,
  type WaybillItem,
  type AlertItem,
} from './data/app-mock'

defineOptions({ name: 'SanitationAppAdmin' })

const store = useAppStore
const boxTypeFilter = ref<'small' | 'large'>('small')
const boxStatusFilter = ref<'all' | 'overflow' | 'offline'>('all')
const boxKeyword = ref('')
const expandedBoxId = ref<string | null>(null)
const wbFilter = ref<'all' | 'active'>('all')

const boxStatusMap: Record<string, string> = { normal: '正常', warning: '预警', overflow: '满溢', offline: '离线' }

// 生成模拟箱体数据：小勾臂箱 10 + 大勾臂箱 10
const smallBoxTowns = ['龙泉镇', '马投涧镇', '善应镇', '彰武街道', '田村街道']
const smallBoxVillages = ['西上庄村', '牛家窑村', '南坡村', '石岩村', '陈家庄', '盘龙寺村', '东上庄村', '北坡村', '大河村', '小河村', '张家庄', '李家庄', '王村', '赵村', '刘家沟']
const largeBoxNames = ['善应压缩箱', '龙泉转运箱', '马投涧转运箱', '彰武压缩箱', '田村压缩箱']

function generateBoxes(): BoxMonitorItem[] {
  const boxes: BoxMonitorItem[] = []
  // 小勾臂箱 10 个
  for (let i = 1; i <= 10; i++) {
    const town = smallBoxTowns[i % smallBoxTowns.length]
    const village = smallBoxVillages[i % smallBoxVillages.length]
    const fillRate = Math.floor(Math.random() * 100)
    const battery = Math.floor(Math.random() * 60) + 20
    const status: BoxMonitorItem['status'] = fillRate >= 90 ? 'overflow' : fillRate >= 75 ? 'warning' : battery < 20 ? 'offline' : 'normal'
    boxes.push({
      id: `XB${String(i).padStart(4, '0')}`,
      boxNo: `XB-${town.slice(0, 2)}-${String(i).padStart(3, '0')}`,
      boxName: `${village}${i % 3 + 1}号小勾臂箱`,
      boxType: '小勾臂箱',
      town, village,
      fillRate, battery, status,
      lastReport: `2026-06-16 ${String(8 + Math.floor(Math.random() * 6)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      lockStatus: Math.random() > 0.1 ? '关锁' : '开锁',
    })
  }
  // 大勾臂箱 10 个
  for (let i = 1; i <= 10; i++) {
    const name = largeBoxNames[i % largeBoxNames.length]
    const fillRate = Math.floor(Math.random() * 100)
    const battery = Math.floor(Math.random() * 40) + 60
    const status: BoxMonitorItem['status'] = fillRate >= 90 ? 'overflow' : fillRate >= 75 ? 'warning' : 'normal'
    boxes.push({
      id: `DB${String(i).padStart(4, '0')}`,
      boxNo: `DB-${['SY', 'LQ', 'MTJ', 'ZW', 'TC'][i % 5]}-${String(i).padStart(2, '0')}`,
      boxName: `${name}${String.fromCharCode(64 + i)}`,
      boxType: '大勾臂箱',
      town: smallBoxTowns[i % smallBoxTowns.length], village: '-',
      fillRate, battery, status,
      lastReport: `2026-06-16 ${String(8 + Math.floor(Math.random() * 6)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      lockStatus: '关锁',
    })
  }
  return boxes
}

const allBoxes = generateBoxes()
const wbStatusMap: Record<string, string> = { '待派发': '待派发', '待接单': '待接单', '已接单': '已接单', '收运中': '收运中', '已完成': '已完成' }

const adminMetrics = computed(() => {
  const todayTasks = waybillList.length
  const todayWaste = waybillList.filter(w => w.status === '已完成' && w.weight).reduce((s, w) => s + (w.weight || 0), 0)
  return [
    { label: '任务数', today: `${todayTasks} 单`, yesterday: `${todayTasks + 2} 单`, todayColor: '#165DFF', yesterdayColor: '#86909C' },
    { label: '垃圾量', today: `${todayWaste.toFixed(1)} t`, yesterday: `${(todayWaste + 0.8).toFixed(1)} t`, todayColor: '#00B42A', yesterdayColor: '#86909C' },
  ]
})

const todayRun = computed(() => {
  const inProgress = waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status)).length
  const overtime = waybillList.filter(w => w.overtimeStatus === '已超时').length
  const unhandledAlerts = alertList.filter(a => a.handleStatus === '待处理').length
  return [
    { label: '在线车辆', value: waybillList.length + ' 辆', color: '#00B42A' },
    { label: '进行中', value: inProgress + ' 单', color: '#165DFF' },
    { label: '超时任务', value: overtime + ' 单', color: '#F53F3F' },
    { label: '未处理告警', value: unhandledAlerts + ' 条', color: '#FF7D00' },
  ]
})

const boxSummary = [
  { label: '全部', count: allBoxes.length, color: '#165DFF' },
  { label: '正常', count: allBoxes.filter(b => b.status === 'normal').length, color: '#00B42A' },
  { label: '满溢', count: allBoxes.filter(b => b.status === 'overflow').length, color: '#F53F3F' },
  { label: '离线', count: allBoxes.filter(b => b.status === 'offline').length, color: '#86909C' },
]

const nonOverflowAlerts = computed(() => alertList.filter(a => a.type !== '满溢告警'))

const waybillStats = [
  { label: '全部', value: waybillList.length, color: '#1D2129' },
  { label: '进行中', value: waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status)).length, color: '#165DFF' },
  { label: '已完成', value: waybillList.filter(w => w.status === '已完成').length, color: '#00B42A' },
  { label: '超时', value: waybillList.filter(w => w.overtimeStatus === '已超时').length, color: '#F53F3F' },
]

const filteredBoxes = computed(() => {
  let list = allBoxes
  // 箱体类型筛选
  const type = boxTypeFilter.value === 'small' ? '小勾臂箱' : '大勾臂箱'
  list = list.filter(b => b.boxType === type)
  // 关键词搜索
  if (boxKeyword.value) {
    const kw = boxKeyword.value.toLowerCase()
    list = list.filter(b => b.boxNo.toLowerCase().includes(kw) || b.boxName.includes(kw))
  }
  // 状态筛选
  if (boxStatusFilter.value === 'overflow') list = list.filter(b => b.status === 'overflow')
  if (boxStatusFilter.value === 'offline') list = list.filter(b => b.status === 'offline')
  return list
})

const filteredWaybills = computed(() => {
  if (wbFilter.value === 'active') return waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status))
  return waybillList
})

const unhandledAlertCount = computed(() => alertList.filter(a => a.handleStatus === '待处理').length)

const adminNavs = [
  { key: 'home', label: '收运看板', icon: '📊' },
  { key: 'box', label: '箱体监控', icon: '📦' },
]

function handleMetricClick(_m: { label: string; today: string }) { ArcoMessage.info(`查看「${_m.label}」详情`) }
function handleRunClick(r: { label: string; value: string }) { ArcoMessage.info(`查看「${r.label}」详情：${r.value}`) }
function handleBoxSummary(bs: typeof boxSummary[0]) { store.activeAdminTab = 'box'; boxStatusFilter.value = bs.label === '全部' ? 'all' : bs.label === '满溢' ? 'overflow' : 'offline' }
function handleAlertClick(_a: AlertItem) { ArcoMessage.info(`查看告警详情：${_a.title}`) }
function toggleBoxDetail(box: BoxMonitorItem) {
  expandedBoxId.value = expandedBoxId.value === box.id ? null : box.id
}
function getMatchTarget(box: BoxMonitorItem): string {
  const transfers: Record<string, string> = { '龙泉镇': '龙泉中转站', '马投涧镇': '马投涧中转站', '善应镇': '善应中转站', '彰武街道': '彰武中转站', '田村街道': '田村中转站' }
  const incinerators: Record<string, string> = { '龙泉镇': '龙安生活垃圾焚烧厂', '马投涧镇': '龙安生活垃圾焚烧厂', '善应镇': '城北焚烧厂', '彰武街道': '城北焚烧厂', '田村街道': '城南焚烧厂' }
  return box.boxType === '大勾臂箱' ? (incinerators[box.town] || '城北焚烧厂') : (transfers[box.town] || '龙泉中转站')
}
function getBoxAddress(box: BoxMonitorItem): string {
  return box.boxType === '大勾臂箱' ? `${box.town}${box.boxName}停靠点` : `${box.town}${box.village}收集点`
}
function handleBoxClick(box: BoxMonitorItem) { ArcoMessage.info(`查看箱体详情：${box.boxName}`) }
function handleBoxAction(box: BoxMonitorItem, action: string) {
  if (action === 'lock') ArcoMessage.success(`已发送${box.lockStatus === '关锁' ? '开锁' : '关锁'}指令到 ${box.boxName}`)
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
/* 产品需求说明 */
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;
  :deep(.arco-collapse-item-header) { font-weight: 600; font-size: 14px; }
}
.prd-body { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
.prd-section-title { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--color-text-1); }
.prd-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  tr:nth-child(even) { background: var(--color-fill-1); }
  td { padding: 6px 12px; border: 1px solid var(--color-border-2); vertical-align: top; line-height: 1.6; }
  .prd-label { width: 140px; min-width: 140px; font-weight: 500; color: var(--color-text-2); white-space: nowrap; }
}
/* 手机框 */
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
.metric-card { display: flex; flex-direction: column; align-items: center; padding: 14px 8px; background: #fff; border-radius: 10px; }
.m-label { font-size: 12px; color: #86909c; font-weight: 500; margin-bottom: 8px; }
.m-compare { display: flex; gap: 16px; }
.mc-item { display: flex; flex-direction: column; align-items: center; }
.mc-num { font-size: 18px; font-weight: 700; }
.mc-tag { font-size: 10px; color: #c9cdd4; margin-top: 1px; }
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
.box-search { width: 100%; padding: 7px 10px; border: 1px solid #e5e6eb; border-radius: 8px; font-size: 12px; background: #fff; outline: none; margin-bottom: 8px; box-sizing: border-box; }
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
.box-match { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding: 4px 8px; background: #f7f8fa; border-radius: 6px; }
.bm-label { font-size: 10px; color: #86909c; flex-shrink: 0; }
.bm-value { font-size: 11px; color: rgb(var(--arcoblue-6)); font-weight: 500; }
.box-expand { margin-top: 4px; margin-bottom: 6px; padding: 10px; background: #f7f8fa; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; }
.bex-row { display: flex; justify-content: space-between; font-size: 12px; span { color: #86909c; } b { color: #1d2129; } }
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
.bottom-nav { display: grid; grid-template-columns: repeat(2, 1fr); padding: 8px 0 18px; background: #fff; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.ni-icon { font-size: 20px; } .ni-label { font-size: 10px; color: #86909c; }
.nav-item.active .ni-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
</style>

<template>
  <div class="command-page" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="resolution-switch">
      <button :class="{ active: resolutionMode === 'formal' }" @click="resolutionMode = 'formal'">正式分辨率</button>
      <button :class="{ active: resolutionMode === 'test' }" @click="resolutionMode = 'test'">测试分辨率</button>
      <button :class="{ active: animEnabled }" @click="animEnabled = !animEnabled">{{ animEnabled ? '动效开' : '动效关' }}</button>
      <button :class="{ active: showPrd }" @click="showPrd = !showPrd">产品需求</button>
      <button class="fullscreen-btn" :class="{ active: isFullscreen }" @click="toggleFullscreen">
        {{ isFullscreen ? '⛶ 退出全屏' : '⛶ 全屏' }}
      </button>
    </div>

    <div class="screen-shell" :class="[`mode-${resolutionMode}`, { 'anim-off': !animEnabled }]">
      <!-- HEADER -->
      <div class="screen-head" :class="animEnabled ? 'animate-slide-in-up' : ''">
        <div class="head-side">龙安区乡镇生活垃圾智慧环卫平台</div>
        <div class="head-title">数字大屏指挥中心</div>
        <div class="head-side right">{{ nowText }}</div>
      </div>

      <div v-if="showPrd" class="prd-board animate-fade-in">
        <div class="prd-title">页面产品需求说明</div>
        <div class="prd-grid">
          <p><b>定位：</b>区级运营指挥大屏，集全域态势感知、任务调度、箱体监控、主动安全告警、车辆轨迹于一体。</p>
          <p><b>核心用户：</b>运营主管、调度员、监管人员。</p>
          <p><b>核心流程：</b>全局态势查看 → 点击实体获取详情 → 告警识别 → 快速创建任务 → 任务轨迹跟踪 → SLA 复盘。</p>
        </div>
      </div>

      <!-- MAIN GRID -->
      <div class="screen-grid">
        <!-- LEFT KPI -->
        <section class="screen-panel kpi-panel" :class="animEnabled ? 'animate-slide-in-left' : ''" style="animation-delay:200ms">
          <PanelTitle title="全局运行指标" />
          <div class="screen-metrics">
            <div v-for="(item, idx) in commandMetrics" :key="item.label" class="screen-metric"
              :class="[`tone-${item.tone || 'normal'}`, animEnabled ? 'animate-kpi-count' : '']"
              :style="animEnabled ? { animationDelay: `${200 + idx * 80}ms` } : {}">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}<em>{{ item.unit }}</em></strong>
              <small>{{ item.trend }}</small>
            </div>
          </div>
        </section>

        <!-- LEFT CHARTS -->
        <section class="screen-panel left-mid" :class="animEnabled ? 'animate-slide-in-left' : ''" style="animation-delay:500ms">
          <PanelTitle title="乡镇垃圾量排行" />
          <VChartBox id="town-rank" :spec="townRankSpec" />
        </section>
        <section class="screen-panel left-bottom" :class="animEnabled ? 'animate-slide-in-left' : ''" style="animation-delay:550ms">
          <PanelTitle title="箱体状态分布" />
          <VChartBox id="box-status" :spec="boxStatusSpec" />
        </section>

        <!-- CENTER MAP -->
        <main class="screen-map" :class="animEnabled ? 'animate-scale-in' : ''" style="animation-delay:300ms">
          <div class="map-header-bar">
            <div class="map-title">全域告警与收运态势</div>
            <div class="map-legend">
              <span v-for="leg in mapLegend" :key="leg.label" class="legend-item">
                <i :style="{ background: leg.color }" /> {{ leg.label }} {{ leg.count }}
              </span>
            </div>
          </div>
          <div class="big-map-bg" @click.self="selectedEntity = null">
            <LonganMapFrame dark />
            <div v-if="animEnabled" class="scan-line animate-scan-line" />
            <div v-for="pt in allMapPoints" :key="pt.id" class="big-point"
              :class="[pt.type, `tone-${pt.status}`, {
                'animate-pulse-dot': animEnabled && pt.extraStatus === 'success',
                'animate-blink-danger': animEnabled && pt.extraStatus === 'danger',
                'animate-blink-warning': animEnabled && pt.extraStatus === 'warning',
              }]"
              :style="{ left: `${pt.x}%`, top: `${pt.y}%` }"
              @click.stop="selectEntity(pt)">
              <span />
              <p>{{ pt.name }}</p>
            </div>
          </div>
          <div class="map-bottom">
            <div>车辆在线 <b>{{ vehicleOnlineCount }}/{{ vehicles.length }}</b></div>
            <div>箱体点位 <b>{{ smallBoxes.length + largeBoxes.length }}</b></div>
            <div>收集点 <b>{{ collectionPoints.length }}</b></div>
            <div>中转站 <b>{{ transferStations.length }}</b></div>
            <div>待处理告警 <b class="text-red-400">{{ pendingAlarmCount }}</b></div>
            <div>焚烧厂 <b>1</b></div>
          </div>
        </main>

        <!-- RIGHT PANEL -->
        <section class="screen-panel right-panel" :class="animEnabled ? 'animate-slide-in-right' : ''" style="animation-delay:400ms">
          <div class="panel-tabs">
            <button v-for="tab in rightTabs" :key="tab.key" :class="{ active: rightTab === tab.key }" @click="rightTab = tab.key">
              {{ tab.label }} <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
          </div>
          <div class="panel-tab-content animate-fade-in" :key="rightTab">
            <!-- Alarm Tab -->
            <template v-if="rightTab === 'alarm'">
              <div class="tab-stats"><span class="text-red-400">未处理 {{ unhandledCount }}</span><span class="text-orange-400">严重 {{ severeCount }}</span></div>
              <div class="compact-table-wrap">
                <table class="compact-table">
                  <thead><tr><th>时间</th><th>类型</th><th>等级</th><th>车辆</th><th>状态</th></tr></thead>
                  <tbody>
                    <tr v-for="a in activeSafetyAlarms" :key="a.id" :class="{ 'animate-alert-flash': animEnabled && a.handleStatus === '未处理' }" @click="selectAlarm(a)">
                      <td>{{ a.triggerTime.slice(11, 19) }}</td><td>{{ a.type }}</td>
                      <td><span :class="levelClass(a.level)">{{ a.level }}</span></td>
                      <td>{{ a.vehiclePlate }}</td><td>{{ a.handleStatus }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <!-- Task Tab -->
            <template v-if="rightTab === 'task'">
              <div class="tab-filters"><button v-for="f in taskFilters" :key="f" :class="{ active: taskFilter === f }" @click="taskFilter = f">{{ f }}</button></div>
              <button class="create-task-btn" @click="showCreateTask = true">＋ 快速创建任务</button>
              <div class="compact-table-wrap">
                <table class="compact-table">
                  <thead><tr><th>任务名</th><th>箱体</th><th>车辆</th><th>状态</th><th>超时</th></tr></thead>
                  <tbody>
                    <tr v-for="task in filteredTaskList" :key="task.id" @click="focusTask(task)">
                      <td class="max-w-[100px] truncate">{{ task.taskName }}</td><td>{{ task.boxName }}</td><td>{{ task.vehicle }}</td>
                      <td>{{ task.collectionStatus }}</td><td :class="{ 'text-red-400': task.overtimeStatus === '已超时' }">{{ task.overtimeStatus }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <!-- Box Tab -->
            <template v-if="rightTab === 'box'">
              <div class="tab-filters"><button :class="{ active: boxTypeTab === 'small' }" @click="boxTypeTab = 'small'">小勾臂箱</button><button :class="{ active: boxTypeTab === 'large' }" @click="boxTypeTab = 'large'">大勾臂箱</button></div>
              <input v-model="boxKeyword" class="compact-search" placeholder="搜索编号/名称" />
              <div class="compact-table-wrap">
                <table class="compact-table">
                  <thead><tr><th>编号</th><th>名称</th><th>位置</th><th>满溢率</th><th>状态</th></tr></thead>
                  <tbody>
                    <tr v-for="box in filteredBoxList" :key="box.id" @click="focusBox(box)">
                      <td>{{ 'boxNo' in box ? (box as any).boxNo : (box as any).boxNo }}</td>
                      <td class="max-w-[80px] truncate">{{ 'boxName' in box ? (box as any).boxName : (box as any).boxName }}</td>
                      <td>{{ 'stationName' in box ? (box as any).stationName : (box as any).town }}</td>
                      <td :class="{ 'text-red-400': (box.fillRate ?? 0) >= 90 }">{{ box.fillRate ?? '-' }}%</td>
                      <td>{{ box.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <!-- Vehicle Tab -->
            <template v-if="rightTab === 'vehicle'">
              <input v-model="vehicleKeyword" class="compact-search" placeholder="搜索车牌/驾驶员" />
              <div class="compact-table-wrap">
                <table class="compact-table">
                  <thead><tr><th>车牌</th><th>车型</th><th>驾驶员</th><th>速度</th><th>状态</th></tr></thead>
                  <tbody>
                    <tr v-for="v in filteredVehicleList" :key="v.id" @click="focusVehicle(v)">
                      <td>{{ v.plateNo }}</td><td>{{ v.vehicleType }}</td><td>{{ v.driver }}</td>
                      <td>{{ v.speed }}km/h</td><td>{{ v.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </section>

        <!-- BOTTOM ANALYSIS -->
        <section class="screen-panel bottom-analysis" :class="animEnabled ? 'animate-slide-in-right' : ''" style="animation-delay:600ms">
          <div class="panel-tabs">
            <button v-for="tab in bottomTabs" :key="tab.key" :class="{ active: bottomTab === tab.key }" @click="bottomTab = tab.key">{{ tab.label }}</button>
          </div>
          <div class="panel-tab-content animate-fade-in" :key="bottomTab">
            <template v-if="bottomTab === 'analysis'">
              <div class="tab-filters"><button v-for="d in analysisDimensions" :key="d" :class="{ active: analysisDim === d }" @click="analysisDim = d">{{ d }}</button></div>
              <div class="compact-table-wrap">
                <table class="compact-table">
                  <thead><tr><th>{{ analysisDim }}</th><th>今日垃圾量</th><th>本月累计</th><th>趟次</th><th>平均载重</th><th>趋势</th></tr></thead>
                  <tbody>
                    <tr v-for="row in filteredAnalysisData" :key="row.name">
                      <td>{{ row.name }}</td><td>{{ row.dailyWaste }}</td><td>{{ row.monthlyWaste }}</td>
                      <td>{{ row.trips }}</td><td>{{ row.avgLoad }}</td>
                      <td :class="{ 'text-green-400': row.trend.startsWith('+'), 'text-red-400': row.trend.startsWith('-') }">{{ row.trend }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <template v-if="bottomTab === 'sla'">
              <div class="sla-row">
                <div class="sla-chart-wrap"><VChartBox id="sla-trend" :spec="slaTrendSpec" /></div>
                <div class="sla-info">
                  <div class="progress-item"><span>SLA 达标率</span><div class="progress-bar"><div class="progress-fill" :style="{ '--progress-width': `${slaRate}%`, width: `${slaRate}%` }" /><b>{{ slaRate }}%</b></div></div>
                  <div class="progress-item"><span>凭证完整率</span><div class="progress-bar"><div class="progress-fill" style="--progress-width:92%;width:92%" /><b>92%</b></div></div>
                  <div class="compact-table-wrap" style="margin-top:8px">
                    <table class="compact-table">
                      <thead><tr><th>超时任务</th><th>应完成</th><th>超时</th><th>驾驶员</th></tr></thead>
                      <tbody>
                        <tr v-for="ot in overtimeTaskList" :key="ot.taskName">
                          <td class="max-w-[80px] truncate">{{ ot.taskName }}</td><td>{{ ot.deadline }}</td>
                          <td class="text-red-400">{{ ot.overtimeMinutes }}min</td><td>{{ ot.driver }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
            <template v-if="bottomTab === 'vehicle'">
              <div class="vehicle-analysis-row">
                <div class="va-chart"><VChartBox id="vehicle-pie" :spec="vehiclePieSpec" /></div>
                <div class="va-chart"><VChartBox id="vehicle-mile" :spec="vehicleMileSpec" /></div>
                <div class="compact-table-wrap">
                  <table class="compact-table">
                    <thead><tr><th>车辆</th><th>车型</th><th>告警数</th></tr></thead>
                    <tbody>
                      <tr v-for="vr in vehicleAlarmRank" :key="vr.plateNo">
                        <td>{{ vr.plateNo }}</td><td>{{ vr.vehicleType }}</td>
                        <td :class="{ 'text-red-400': vr.alarmCount > 0 }">{{ vr.alarmCount }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>

      <!-- BOTTOM BAR -->
      <div class="bottom-bar" :class="animEnabled ? 'animate-slide-in-up' : ''" style="animation-delay:700ms">
        <button class="bar-btn" @click="showCreateTask = true">📋 快速创建任务</button>
        <button class="bar-btn" @click="startTrackReplay">📍 轨迹回放</button>
        <button class="bar-btn" @click="showVideo = true">📹 实时视频</button>
        <button class="bar-btn" @click="refreshAll">🔄 强制刷新</button>
        <span class="connection-status"><span class="status-dot animate-breathe" /> 数据连接正常 | {{ nowText }}</span>
      </div>
    </div>

    <!-- MODALS -->
    <Teleport to="body">
      <div v-if="selectedEntity" class="modal-overlay animate-fade-in" @click.self="selectedEntity = null">
        <div class="modal-content animate-scale-in">
          <button class="modal-close" @click="selectedEntity = null">✕</button>
          <DetailCard :entity="selectedEntity" />
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showCreateTask" class="modal-overlay animate-fade-in" @click.self="showCreateTask = false">
        <div class="modal-content-lg animate-modal-in">
          <button class="modal-close" @click="showCreateTask = false">✕</button>
          <h3 class="modal-title">快速创建收运任务</h3>
          <div class="create-task-form">
            <div class="form-row"><label>箱体编号</label><input v-model="createForm.boxNo" class="form-input" placeholder="输入编号搜索..." list="box-list" @input="onBoxSearch" /><datalist id="box-list"><option v-for="b in allBoxesForSearch" :key="b.id" :value="b.boxNo">{{ b.boxName || b.boxNo }}</option></datalist></div>
            <div v-if="selectedCreateBox" class="form-info"><span>{{ (selectedCreateBox as any).boxName || (selectedCreateBox as any).boxNo }}</span><span>满溢率 {{ selectedCreateBox.fillRate ?? '-' }}%</span></div>
            <div class="form-row"><label>驾驶员</label><select v-model="createForm.driver" class="form-input" @change="onDriverChange"><option value="">选择驾驶员</option><option v-for="d in availableDrivers" :key="d.name" :value="d.name">{{ d.name }} — {{ d.vehicle }}</option></select></div>
            <div class="form-row"><label>车辆</label><input :value="createForm.vehicle" class="form-input" readonly /></div>
            <div class="form-row"><label>目的地</label><select v-model="createForm.destination" class="form-input"><option v-for="dest in availableDestinations" :key="dest" :value="dest">{{ dest }}</option></select></div>
            <div class="form-row"><label>时效</label><select v-model="createForm.sla" class="form-input"><option :value="30">30 分钟</option><option :value="60">60 分钟</option><option :value="90">90 分钟</option><option :value="120">120 分钟</option></select></div>
            <div class="form-row"><label>优先级</label><select v-model="createForm.priority" class="form-input"><option value="紧急">紧急</option><option value="普通">普通</option></select></div>
            <button class="submit-btn" @click="submitCreateTask">确认创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showTrackReplay" class="modal-overlay animate-fade-in" @click.self="showTrackReplay = false">
        <div class="modal-content-xl animate-modal-in">
          <button class="modal-close" @click="showTrackReplay = false">✕</button>
          <h3 class="modal-title">车辆轨迹回放 — {{ replayVehicle?.plateNo || '选择车辆' }}</h3>
          <div class="track-replay-body">
            <div class="replay-map"><LonganMapFrame dark /><div v-for="(pt, i) in visibleTrackPoints" :key="i" class="trail-dot animate-trail-dot" :style="{ left: `${((pt.lng - 114.20) / 0.25) * 100}%`, top: `${((pt.lat - 35.95) / 0.17) * 100}%`, animationDelay: `${i * 200}ms` }" /></div>
            <div class="replay-controls">
              <select v-model="replayVehicleId" class="form-input" @change="selectReplayVehicle"><option v-for="v in vehicles.filter(x => x.trackHistory.length)" :key="v.id" :value="v.id">{{ v.plateNo }}</option></select>
              <button @click="toggleReplay">{{ replayPlaying ? '⏸ 暂停' : '▶ 播放' }}</button>
              <button @click="replaySpeed = replaySpeed === 1 ? 3 : replaySpeed === 3 ? 0.5 : 1">{{ replaySpeed }}x</button>
              <input type="range" :min="0" :max="replayMax" v-model.number="replayIndex" class="replay-slider" />
              <span>{{ replayIndex }}/{{ replayMax }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showVideo" class="modal-overlay animate-fade-in" @click.self="showVideo = false">
        <div class="modal-content-xl animate-modal-in">
          <button class="modal-close" @click="showVideo = false">✕</button>
          <h3 class="modal-title">实时车载视频 — {{ videoVehicle?.plateNo || '选择车辆' }}</h3>
          <div class="video-grid">
            <div v-for="cam in ['前摄像头', '后摄像头']" :key="cam" class="video-window">
              <div class="video-label">{{ cam }}</div>
              <svg class="video-svg" viewBox="0 0 400 225"><rect width="400" height="225" fill="#0a1628" /><rect x="0" y="0" width="400" height="80" fill="#1a2a3a" /><line v-for="i in 6" :key="i" :x1="i*70-20" y1="120" :x2="i*70+10" y2="115" stroke="#334155" stroke-width="2" /><rect x="20" y="60" width="360" height="2" fill="#475569" /><rect x="150" y="100" width="60" height="30" rx="4" fill="#334155" /><circle cx="170" cy="130" r="8" fill="#1e293b" stroke="#475569" stroke-width="1" /><circle cx="210" cy="130" r="8" fill="#1e293b" stroke="#475569" stroke-width="1" /></svg>
              <div class="video-scan-line animate-video-scan" />
              <div class="video-noise animate-video-noise" />
              <div class="video-osd"><span>● REC</span><span>{{ videoVehicle?.plateNo || '豫E3G516' }}</span><span>{{ videoVehicle?.speed || 46 }} km/h</span><span>{{ nowText }}</span></div>
            </div>
          </div>
          <div class="video-vehicle-select"><select v-model="videoVehicleId" class="form-input"><option v-for="v in vehicles.filter(x => x.status === '在线')" :key="v.id" :value="v.id">{{ v.plateNo }} — {{ v.driver }}</option></select></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LonganMapFrame from './components/LonganMapFrame.vue'
import {
  collectionPoints, transferStations, incinerationPlant,
  smallBoxes, largeBoxes, vehicles, activeSafetyAlarms,
  collectionTasks, townWasteRank, slaTrend, multiAnalysisData,
  vehicleAlarmRank, overtimeTaskList,
} from './data/command-center-july-mock'

defineOptions({ name: 'SanitationCommandCenterJuly' })

const resolutionMode = ref<'formal' | 'test'>('test')
const showPrd = ref(false)
const animEnabled = ref(true)
const now = ref(new Date())
const timer = window.setInterval(() => { now.value = new Date() }, 1000)
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.removeEventListener('keydown', onKeydown)
})
const nowText = computed(() => now.value.toLocaleString('zh-CN', { hour12: false }))

const rightTab = ref('alarm')
const rightTabs = [
  { key: 'alarm', label: '告警', badge: activeSafetyAlarms.filter(a => a.handleStatus === '未处理').length },
  { key: 'task', label: '任务', badge: collectionTasks.filter(t => t.collectionStatus === '收运中').length },
  { key: 'box', label: '箱体' }, { key: 'vehicle', label: '车辆' },
]
const bottomTab = ref('analysis')
const bottomTabs = [{ key: 'analysis', label: '多维分析' }, { key: 'sla', label: 'SLA质量' }, { key: 'vehicle', label: '车辆作业' }]

const selectedEntity = ref<any>(null)
const showCreateTask = ref(false)
const showTrackReplay = ref(false)
const showVideo = ref(false)

const createForm = ref({ boxNo: '', driver: '', vehicle: '', destination: '', sla: 60, priority: '紧急' })
const selectedCreateBox = ref<any>(null)
const allBoxesForSearch = computed(() => [...smallBoxes, ...largeBoxes])
const availableDrivers = [
  { name: '张师傅', vehicle: '豫E3G516' }, { name: '李师傅', vehicle: '豫E9C345' },
  { name: '孙师傅', vehicle: '豫E6N109' }, { name: '吴刚', vehicle: '豫E9C345' },
  { name: '郑伟', vehicle: '豫E0D789' }, { name: '曹德旺', vehicle: '豫E0P345' },
  { name: '彭建', vehicle: '豫E2R012' }, { name: '褚怀亮', vehicle: '豫E7G123' },
]
const availableDestinations = computed(() => {
  if (!selectedCreateBox.value) return transferStations.map(s => s.name).concat('龙安生活垃圾焚烧厂')
  if ('stationName' in selectedCreateBox.value) return ['龙安生活垃圾焚烧厂']
  return transferStations.map(s => s.name)
})

const taskFilter = ref('全部')
const taskFilters = ['全部', '待接单', '收运中', '已超时']
const boxTypeTab = ref<'small' | 'large'>('small')
const boxKeyword = ref('')
const vehicleKeyword = ref('')
const analysisDim = ref('乡镇')
const analysisDimensions = ['乡镇', '车辆', '中转站', '日期']

const replayVehicleId = ref(vehicles.find(v => v.trackHistory.length)?.id || '')
const replayIndex = ref(0)
const replayPlaying = ref(false)
const replaySpeed = ref(1)
let replayTimer: number | undefined
const videoVehicleId = ref(vehicles.find(v => v.status === '在线')?.id || '')

const vehicleOnlineCount = computed(() => vehicles.filter(v => v.status === '在线').length)
const pendingAlarmCount = computed(() => activeSafetyAlarms.filter(a => a.handleStatus === '未处理').length)
const runningTaskCount = computed(() => collectionTasks.filter(t => ['已接单', '收运中'].includes(t.collectionStatus)).length)
const completedTaskCount = computed(() => collectionTasks.filter(t => t.collectionStatus === '已完成').length)
const overtimeTaskCount = computed(() => collectionTasks.filter(t => t.overtimeStatus === '已超时').length)
const todayWasteTotal = computed(() => collectionTasks.filter(t => t.collectionStatus === '已完成').reduce((s, t) => s + (t.weight || 0), 0).toFixed(1))
const slaRate = computed(() => {
  const done = collectionTasks.filter(t => t.collectionStatus === '已完成')
  return done.length ? Math.round(done.filter(t => t.overtimeStatus === '未超时').length / done.length * 100) : 100
})
const boxAbnormalCount = computed(() => smallBoxes.filter(b => b.status !== '正常').length + largeBoxes.filter(b => b.status !== '正常').length)
const unhandledCount = computed(() => activeSafetyAlarms.filter(a => a.handleStatus === '未处理').length)
const severeCount = computed(() => activeSafetyAlarms.filter(a => a.level === '严重').length)

const commandMetrics = computed(() => [
  { label: '车辆在线率', value: `${Math.round(vehicleOnlineCount.value / vehicles.length * 100)}`, unit: '%', trend: `${vehicleOnlineCount.value}/${vehicles.length} 辆`, tone: 'success' as const },
  { label: '今日收运任务', value: collectionTasks.length, unit: '单', trend: `收运中 ${runningTaskCount.value}`, tone: 'processing' as const },
  { label: '已完成', value: completedTaskCount.value, unit: '单', trend: `SLA达标 ${slaRate.value}%`, tone: 'success' as const },
  { label: '今日垃圾量', value: todayWasteTotal.value, unit: '吨', trend: '车载称重估算', tone: 'warning' as const },
  { label: '未读告警', value: pendingAlarmCount.value, unit: '条', trend: `严重 ${severeCount.value} 条`, tone: 'danger' as const },
  { label: '箱体异常', value: boxAbnormalCount.value, unit: '个', trend: `满溢 ${smallBoxes.filter(b => b.status === '满溢').length + largeBoxes.filter(b => b.status === '满溢').length}`, tone: 'warning' as const },
  { label: 'SLA 达标率', value: slaRate.value, unit: '%', trend: `超时 ${overtimeTaskCount.value} 单`, tone: slaRate.value >= 90 ? 'success' as const : 'warning' as const },
  { label: '收运中任务', value: runningTaskCount.value, unit: '单', trend: '实时更新', tone: 'processing' as const },
])

const filteredTaskList = computed(() => {
  let list = [...collectionTasks]
  if (taskFilter.value === '待接单') list = list.filter(t => t.collectionStatus === '待接单')
  if (taskFilter.value === '收运中') list = list.filter(t => t.collectionStatus === '收运中')
  if (taskFilter.value === '已超时') list = list.filter(t => t.overtimeStatus === '已超时')
  return list
})

const filteredBoxList = computed(() => {
  const list = boxTypeTab.value === 'small' ? [...smallBoxes] : [...largeBoxes]
  const kw = boxKeyword.value.toLowerCase()
  if (!kw) return list
  return list.filter((b: any) => (b.boxNo || '').toLowerCase().includes(kw) || (b.boxName || '').toLowerCase().includes(kw))
})

const filteredVehicleList = computed(() => {
  const kw = vehicleKeyword.value.toLowerCase()
  if (!kw) return vehicles
  return vehicles.filter(v => v.plateNo.toLowerCase().includes(kw) || v.driver.toLowerCase().includes(kw))
})

const filteredAnalysisData = computed(() => multiAnalysisData.filter(r => r.dimension === analysisDim.value))

const allMapPoints = computed(() => {
  const pts: any[] = []
  vehicles.forEach(v => pts.push({ id: v.id, name: v.plateNo, type: 'vehicle', status: v.status === '在线' ? 'success' : v.status === '充电' ? 'warning' : 'offline', extraStatus: v.status === '在线' ? 'success' : 'normal', x: ((v.lng - 114.20) / 0.25) * 100, y: ((v.lat - 35.95) / 0.17) * 100, data: v }))
  smallBoxes.forEach(b => pts.push({ id: b.id, name: b.boxNo, type: 'box', status: b.status === '满溢' ? 'danger' : b.status === '预警' ? 'warning' : b.status === '离线' ? 'offline' : 'success', extraStatus: b.status === '满溢' ? 'danger' : b.status === '预警' ? 'warning' : 'success', x: ((b.lng - 114.20) / 0.25) * 100, y: ((b.lat - 35.95) / 0.17) * 100, data: b }))
  largeBoxes.forEach(b => pts.push({ id: b.id, name: b.boxNo, type: 'box', status: b.status === '满溢' ? 'danger' : b.status === '预警' ? 'warning' : b.status === '离线' ? 'offline' : 'success', extraStatus: b.status === '满溢' ? 'danger' : b.status === '预警' ? 'warning' : 'success', x: ((b.lng - 114.20) / 0.25) * 100, y: ((b.lat - 35.95) / 0.17) * 100, data: b }))
  collectionPoints.forEach(cp => pts.push({ id: cp.id, name: cp.name, type: 'point', status: cp.status === '预警' ? 'warning' : 'success', extraStatus: 'normal', x: ((cp.lng - 114.20) / 0.25) * 100, y: ((cp.lat - 35.95) / 0.17) * 100, data: cp }))
  transferStations.forEach(ts => pts.push({ id: ts.id, name: ts.name, type: 'station', status: ts.status === '满溢' ? 'danger' : ts.status === '预警' ? 'warning' : 'success', extraStatus: 'normal', x: ((ts.lng - 114.20) / 0.25) * 100, y: ((ts.lat - 35.95) / 0.17) * 100, data: ts }))
  pts.push({ id: incinerationPlant.id, name: incinerationPlant.name, type: 'plant', status: 'processing', extraStatus: 'normal', x: ((incinerationPlant.lng - 114.20) / 0.25) * 100, y: ((incinerationPlant.lat - 35.95) / 0.17) * 100, data: incinerationPlant })
  activeSafetyAlarms.filter(a => a.handleStatus === '未处理').forEach(a => pts.push({ id: a.id, name: a.type, type: 'alarm', status: a.level === '严重' ? 'danger' : 'warning', extraStatus: 'danger', x: ((a.lng - 114.20) / 0.25) * 100, y: ((a.lat - 35.95) / 0.17) * 100, data: a }))
  return pts
})

const mapLegend = computed(() => [
  { label: '车辆', color: '#22c55e', count: vehicleOnlineCount.value },
  { label: '箱体', color: '#f59e0b', count: smallBoxes.length + largeBoxes.length },
  { label: '收集点', color: '#3b82f6', count: collectionPoints.length },
  { label: '中转站', color: '#8b5cf6', count: transferStations.length },
  { label: '告警', color: '#ef4444', count: pendingAlarmCount.value },
])

const replayVehicle = computed(() => vehicles.find(v => v.id === replayVehicleId.value))
const replayMax = computed(() => (replayVehicle.value?.trackHistory.length || 1) - 1)
const visibleTrackPoints = computed(() => replayVehicle.value?.trackHistory.slice(0, replayIndex.value + 1) || [])
const videoVehicle = computed(() => vehicles.find(v => v.id === videoVehicleId.value))

function selectEntity(pt: any) { selectedEntity.value = pt }
function selectAlarm(alarm: any) { selectedEntity.value = { type: 'alarm', data: alarm, name: alarm.type } }
function focusTask(task: any) { selectedEntity.value = { type: 'task', data: task, name: task.taskName } }
function focusBox(box: any) { selectedEntity.value = { type: 'box', data: box, name: (box as any).boxName || (box as any).boxNo } }
function focusVehicle(v: any) { selectedEntity.value = { type: 'vehicle', data: v, name: v.plateNo } }
function levelClass(l: string) { return l === '严重' ? 'text-red-400 font-bold' : l === '重要' ? 'text-orange-400' : 'text-yellow-400' }
function onBoxSearch() { selectedCreateBox.value = allBoxesForSearch.value.find(b => b.boxNo === createForm.value.boxNo) || null }
function onDriverChange() { const d = availableDrivers.find(x => x.name === createForm.value.driver); createForm.value.vehicle = d?.vehicle || '' }
function submitCreateTask() { showCreateTask.value = false; createForm.value = { boxNo: '', driver: '', vehicle: '', destination: '', sla: 60, priority: '紧急' }; selectedCreateBox.value = null }
function startTrackReplay() { replayIndex.value = 0; replayPlaying.value = false; showTrackReplay.value = true }
function selectReplayVehicle() { replayIndex.value = 0; replayPlaying.value = false }
function toggleReplay() { replayPlaying.value = !replayPlaying.value; if (replayPlaying.value) runReplay(); else clearTimeout(replayTimer) }
function runReplay() { if (!replayPlaying.value) return; if (replayIndex.value < replayMax.value) { replayIndex.value++; replayTimer = window.setTimeout(runReplay, 600 / replaySpeed.value) } else replayPlaying.value = false }
function refreshAll() { now.value = new Date() }

// DetailCard component
const DetailCard = { props: { entity: Object }, setup(props: any) {
  return () => {
    const e = props.entity
    if (!e?.data) return h('div', '暂无详情')
    const d = e.data
    const rows: any[] = []
    if (e.type === 'vehicle') { rows.push(['车型', d.vehicleType], ['驾驶员', d.driver], ['电话', d.driverPhone], ['速度', `${d.speed} km/h`], ['载重', d.weight ? `${d.weight}t` : '-'], ['状态', d.status], ['告警', `${d.alarms}`]) }
    else if (e.type === 'box') { rows.push(['编号', d.boxNo], ['类型', 'village' in d ? '小勾臂箱' : '大勾臂箱'], ['满溢率', `${d.fillRate ?? '-'}%`]); if ('village' in d) rows.push(['电量', `${d.battery ?? '-'}%`], ['温度', d.temperature != null ? `${d.temperature}℃` : '-'], ['锁状态', d.lockStatus]); rows.push(['状态', d.status], ['上报', d.lastReport]) }
    else if (e.type === 'station') { rows.push(['地址', d.address], ['机位', `${d.slots}`], ['小勾臂箱', `${d.smallBoxCount}`], ['大勾臂箱', `${d.largeBoxCount}`], ['状态', d.status]) }
    else if (e.type === 'plant') { rows.push(['地址', d.address], ['日处理', `${d.dailyCapacity}吨`], ['今日处理', `${d.todayProcessed}吨`], ['状态', d.status]) }
    else if (e.type === 'point') { rows.push(['地址', d.address], ['乡镇', d.town], ['村庄', d.village], ['箱体数', `${d.boxCount}`], ['状态', d.status]) }
    else if (e.type === 'alarm') { rows.push(['等级', d.level], ['车辆', d.vehiclePlate], ['驾驶员', d.driver], ['位置', d.location], ['触发时间', d.triggerTime], ['速度', `${d.speed}km/h`], ['状态', d.handleStatus]) }
    else if (e.type === 'task') { rows.push(['箱体', d.boxName], ['车辆', d.vehicle], ['驾驶员', d.driver], ['状态', d.collectionStatus], ['超时', d.overtimeStatus], ['时效', `${d.durationText}`]) }
    return h('div', { class: 'detail-card' }, [
      h('h4', e.name || '详情'),
      h('div', { class: 'detail-grid' }, rows.map(([label, value]: string[]) => [h('span', label), h('b', value)]).flat()),
    ])
  }
}}

// PanelTitle
const PanelTitle = { props: { title: String }, setup(p: any) { return () => h('div', { class: 'panel-title' }, [h('span'), p.title]) } }

// VChartBox
const VChartBox = { props: { id: String, spec: Object }, setup(p: any) {
  const el = ref<HTMLElement>(); let chart: any, ro: ResizeObserver | undefined
  async function render() { if (!el.value) return; const { VChart } = await import('@visactor/vchart'); if (chart) chart.release(); chart = new VChart(p.spec, { dom: el.value }); chart.renderSync(); if (!ro) { ro = new ResizeObserver(() => chart?.resize?.()); ro.observe(el.value) } }
  onMounted(render); watch(() => p.spec, render, { deep: true }); onBeforeUnmount(() => { ro?.disconnect(); if (chart) chart.release() })
  return () => h('div', { ref: el, id: p.id, class: 'vchart-box' })
}}

// Chart specs
const axisS = { label: { style: { fill: '#9fc7ff', fontSize: 12 } }, grid: { style: { stroke: 'rgba(91,143,249,0.16)' } }, domainLine: { visible: false }, tick: { visible: false } }
const townRankSpec = computed(() => ({ type: 'bar', data: [{ id: 'town', values: townWasteRank }], direction: 'horizontal', xField: 'value', yField: 'town', padding: [12, 24, 24, 80], background: 'transparent', axes: [{ orient: 'bottom', ...axisS }, { orient: 'left', ...axisS }], bar: { style: { fill: 'linear-gradient(90deg, #1d4ed8, #22d3ee)', cornerRadius: 3 } } }))
const boxStatusData = computed(() => ['正常', '预警', '满溢', '离线'].map(s => ({ status: s, small: smallBoxes.filter(b => b.status === s).length, large: largeBoxes.filter(b => b.status === s).length })))
const boxStatusSpec = computed(() => ({ type: 'bar', data: [{ id: 'box', values: boxStatusData.value }], xField: 'status', yField: ['small', 'large'], padding: [18, 18, 28, 34], background: 'transparent', legends: { visible: true, orient: 'bottom', item: { label: { style: { fill: '#b9d8ff' } } } }, axes: [{ orient: 'bottom', ...axisS }, { orient: 'left', ...axisS }] }))
const slaTrendSpec = computed(() => ({ type: 'line', data: [{ id: 'sla', values: slaTrend }], xField: 'time', yField: 'value', padding: [18, 20, 28, 42], background: 'transparent', axes: [{ orient: 'bottom', ...axisS }, { orient: 'left', ...axisS }], line: { style: { stroke: '#a3e635', lineWidth: 3 } }, point: { style: { fill: '#ecfccb', stroke: '#84cc16', size: 7 } } }))
const vehiclePieSpec = computed(() => ({ type: 'pie', data: [{ id: 'vp', values: [{ status: '在线', value: vehicleOnlineCount.value }, { status: '离线', value: vehicles.filter(v => v.status === '离线').length }, { status: '充电', value: vehicles.filter(v => v.status === '充电').length }] }], categoryField: 'status', valueField: 'value', innerRadius: 0.68, background: 'transparent', color: ['#22c55e', '#64748b', '#f59e0b'], legends: { visible: true, orient: 'bottom', item: { label: { style: { fill: '#b9d8ff' } } } } }))
const vehicleMileSpec = computed(() => ({ type: 'bar', data: [{ id: 'vm', values: vehicles.slice(0, 8).map(v => ({ vehicle: v.plateNo, value: +(v.trackHistory.length * (v.speed || 1) / 60 * 10 / 10).toFixed(1) || +(5 + Math.random() * 20).toFixed(1) })) }], direction: 'horizontal', xField: 'value', yField: 'vehicle', padding: [12, 24, 24, 76], background: 'transparent', axes: [{ orient: 'bottom', ...axisS }, { orient: 'left', ...axisS }], bar: { style: { fill: 'linear-gradient(90deg, #9333ea, #22d3ee)', cornerRadius: 3 } } }))
</script>

<style scoped lang="scss">
.command-page { position: relative; overflow: auto; min-height: calc(100vh - 84px); padding: 48px 16px 16px; background: #050b18;
  &.is-fullscreen {
    position: fixed; inset: 0; z-index: 9999; overflow: hidden;
    padding: 8px 12px;
    .resolution-switch { top: 0; margin: 0 0 6px; }
    .screen-shell { width: 100%; height: calc(100vh - 48px); max-height: 100vh; }
  }
}
.fullscreen-btn {
  background: rgba(34, 211, 238, 0.12) !important;
  border-color: rgba(34, 211, 238, 0.4) !important;
  &.active { background: #67e8f9 !important; }
}
.resolution-switch { position: sticky; z-index: 20; top: 0; display: flex; justify-content: flex-end; gap: 10px; margin: -36px 0 12px;
  button { height: 32px; padding: 0 18px; color: #bfdbfe; cursor: pointer; background: rgba(15,23,42,0.88); border: 1px solid rgba(56,189,248,0.32); border-radius: 4px;
    &.active { color: #020617; background: #67e8f9; box-shadow: 0 0 18px rgba(34,211,238,0.45); } } }
.screen-shell { position: relative; margin: 0 auto; color: #dbeafe; display: flex; flex-direction: column; overflow: hidden; background: linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), radial-gradient(circle at 50% 38%, rgba(14,165,233,0.28), transparent 34%), #06101f; background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%; }
.mode-formal { width: 4810px; height: 1568px; }
.mode-test { width: min(100%, 1680px); min-width: 1280px; height: calc(100vh - 120px); min-height: 720px; max-height: calc(100vh - 80px); }
.anim-off { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
.screen-head { display: grid; grid-template-columns: 1fr 1.4fr 1fr; align-items: center; height: 60px; padding: 0 28px; flex-shrink: 0; background: linear-gradient(180deg, rgba(29,78,216,0.38), rgba(8,47,73,0)); }
.head-title { color: #eff6ff; font-size: 28px; font-weight: 800; text-align: center; text-shadow: 0 0 18px rgba(34,211,238,0.8); }
.head-side { color: #93c5fd; font-size: 14px; &.right { text-align: right; font-variant-numeric: tabular-nums; } }
.prd-board { margin: 8px 28px 0; padding: 14px 20px; background: rgba(30,58,138,0.2); border: 1px solid rgba(56,189,248,0.18); border-radius: 6px; .prd-title { color: #67e8f9; font-weight: 700; margin-bottom: 8px; } .prd-grid p { margin: 3px 0; font-size: 13px; line-height: 1.6; b { color: #a5f3fc; } } }
.screen-grid { display: grid; grid-template-columns: 140px 180px 1fr 280px; grid-template-rows: 1fr 1fr auto; gap: 8px; padding: 8px 12px; flex: 1; min-height: 0; }
.screen-panel { background: rgba(15,23,42,0.7); border: 1px solid rgba(56,189,248,0.15); border-radius: 6px; padding: 8px; overflow: hidden; display: flex; flex-direction: column; }
.kpi-panel { grid-column: 1; grid-row: 1 / span 2; }
.left-mid { grid-column: 2; grid-row: 1; }
.left-bottom { grid-column: 2; grid-row: 2; }
.screen-map { grid-column: 3; grid-row: 1 / span 2; display: flex; flex-direction: column; }
.right-panel { grid-column: 4; grid-row: 1 / span 2; }
.bottom-analysis { grid-column: 3 / span 2; grid-row: 3; max-height: 180px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #67e8f9; font-size: 14px; font-weight: 700; span { display: inline-block; width: 4px; height: 14px; background: #22d3ee; border-radius: 2px; } }
.screen-metrics { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.screen-metric { padding: 8px 10px; background: rgba(30,58,138,0.25); border-left: 3px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; &:hover { background: rgba(30,58,138,0.45); transform: translateX(2px); } span { display: block; font-size: 11px; color: #94a3b8; } strong { display: block; font-size: 22px; font-weight: 800; em { font-size: 12px; font-style: normal; margin-left: 2px; color: #94a3b8; } } small { font-size: 10px; color: #64748b; }
  &.tone-success { border-left-color: #22c55e; strong { color: #4ade80; } }
  &.tone-danger { border-left-color: #ef4444; strong { color: #f87171; } }
  &.tone-warning { border-left-color: #eab308; strong { color: #facc15; } }
  &.tone-processing { border-left-color: #3b82f6; strong { color: #60a5fa; } } }
.map-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-shrink: 0; }
.map-title { color: #67e8f9; font-size: 14px; font-weight: 700; }
.map-legend { display: flex; gap: 12px; }
.legend-item { font-size: 10px; color: #94a3b8; display: flex; align-items: center; gap: 4px; i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; } }
.big-map-bg { position: relative; flex: 1; overflow: hidden; border-radius: 4px; background: #06101f;
  :deep(iframe) { pointer-events: none; }
  :deep(.map-mask) { z-index: 1; }
}
.big-point { position: absolute; transform: translate(-50%, -50%); cursor: pointer; z-index: 10; transition: transform 0.2s, filter 0.2s;
  &:hover { transform: translate(-50%, -50%) scale(1.4); filter: brightness(1.5); z-index: 20; }
  span { display: block; width: 12px; height: 12px; border-radius: 50%; margin: 0 auto; }
  p { margin-top: 3px; font-size: 9px; font-weight: 600; text-align: center; white-space: nowrap; color: #f1f5f9; text-shadow: 0 0 6px rgba(0,0,0,0.9); background: rgba(0,0,0,0.55); padding: 1px 5px; border-radius: 3px; }
  &.vehicle span { width: 14px; height: 14px; border-radius: 3px; }
  &.station span { width: 16px; height: 16px; border-radius: 3px; }
  &.plant span { width: 18px; height: 18px; border-radius: 4px; background: #f97316 !important; }
  &.alarm span { width: 14px; height: 14px; }
  &.tone-success span { background: #22c55e; box-shadow: 0 0 8px #22c55e, 0 0 3px #22c55e; }
  &.tone-warning span { background: #eab308; box-shadow: 0 0 10px #eab308, 0 0 4px #eab308; }
  &.tone-danger span { background: #ef4444; box-shadow: 0 0 12px #ef4444, 0 0 5px #ef4444; }
  &.tone-offline span { background: #64748b; }
  &.tone-processing span { background: #3b82f6; box-shadow: 0 0 8px #3b82f6, 0 0 3px #3b82f6; } }
.scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent); pointer-events: none; z-index: 8; }
.map-bottom { display: flex; gap: 16px; padding: 6px 10px; background: rgba(15,23,42,0.8); border-top: 1px solid rgba(56,189,248,0.15); font-size: 11px; color: #94a3b8; flex-shrink: 0; b { color: #e2e8f0; margin-left: 2px; } }
.panel-tabs { display: flex; gap: 2px; margin-bottom: 6px; flex-shrink: 0;
  button { flex: 1; height: 28px; font-size: 11px; color: #94a3b8; background: rgba(15,23,42,0.5); border: 1px solid rgba(56,189,248,0.12); border-radius: 4px; cursor: pointer; position: relative;
    &.active { color: #67e8f9; background: rgba(34,211,238,0.12); border-color: rgba(34,211,238,0.3); } }
  .tab-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 9px; padding: 0 4px; border-radius: 8px; min-width: 16px; text-align: center; } }
.panel-tab-content { flex: 1; overflow: auto; display: flex; flex-direction: column; }
.tab-stats { display: flex; gap: 16px; font-size: 11px; margin-bottom: 6px; padding: 0 2px; flex-shrink: 0; }
.tab-filters { display: flex; gap: 4px; margin-bottom: 6px; flex-shrink: 0;
  button { height: 22px; padding: 0 8px; font-size: 10px; color: #94a3b8; background: rgba(15,23,42,0.5); border: 1px solid rgba(56,189,248,0.1); border-radius: 3px; cursor: pointer;
    &.active { color: #67e8f9; border-color: rgba(34,211,238,0.3); } } }
.create-task-btn { width: 100%; height: 30px; margin-bottom: 6px; color: #67e8f9; background: rgba(34,211,238,0.1); border: 1px dashed rgba(34,211,238,0.3); border-radius: 4px; cursor: pointer; font-size: 12px; flex-shrink: 0; }
.compact-search { width: 100%; height: 26px; padding: 0 8px; margin-bottom: 6px; font-size: 11px; color: #e2e8f0; background: rgba(15,23,42,0.6); border: 1px solid rgba(56,189,248,0.15); border-radius: 4px; outline: none; flex-shrink: 0; &::placeholder { color: #64748b; } }
.compact-table-wrap { flex: 1; overflow: auto; }
.compact-table { width: 100%; border-collapse: collapse; font-size: 10px;
  th, td { padding: 4px 6px; text-align: left; white-space: nowrap; border-bottom: 1px solid rgba(56,189,248,0.08); }
  th { color: #67e8f9; font-weight: 600; position: sticky; top: 0; background: rgba(15,23,42,0.95); }
  tr { cursor: pointer; &:hover { background: rgba(30,58,138,0.25); } } }
.sla-row { display: flex; gap: 8px; flex: 1; overflow: hidden; }
.sla-chart-wrap { width: 50%; }
.sla-info { width: 50%; overflow: auto; }
.progress-item { margin-bottom: 8px; span { font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px; } .progress-bar { display: flex; align-items: center; gap: 8px; } .progress-fill { height: 8px; background: linear-gradient(90deg, #22d3ee, #4ade80); border-radius: 4px; } b { font-size: 14px; color: #4ade80; } }
.vehicle-analysis-row { display: flex; gap: 6px; flex: 1; overflow: hidden; }
.va-chart { width: 35%; }
.bottom-bar { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 16px; flex-shrink: 0; background: rgba(15,23,42,0.9); border-top: 1px solid rgba(56,189,248,0.2); }
.bar-btn { height: 28px; padding: 0 14px; font-size: 12px; color: #bfdbfe; background: rgba(30,58,138,0.4); border: 1px solid rgba(56,189,248,0.2); border-radius: 4px; cursor: pointer; transition: all 0.3s; &:hover { background: rgba(34,211,238,0.2); box-shadow: 0 0 12px rgba(34,211,238,0.3); } }
.connection-status { margin-left: auto; font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 6px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
.modal-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }
.modal-content { position: relative; width: 420px; max-height: 80vh; overflow-y: auto; padding: 24px; background: rgba(15,23,42,0.96); border: 1px solid rgba(56,189,248,0.25); border-radius: 12px; box-shadow: 0 0 40px rgba(34,211,238,0.15); }
.modal-content-lg { position: relative; width: 520px; max-height: 80vh; overflow-y: auto; padding: 24px; background: rgba(15,23,42,0.96); border: 1px solid rgba(56,189,248,0.25); border-radius: 12px; box-shadow: 0 0 40px rgba(34,211,238,0.15); }
.modal-content-xl { position: relative; width: 800px; max-height: 80vh; overflow-y: auto; padding: 24px; background: rgba(15,23,42,0.96); border: 1px solid rgba(56,189,248,0.25); border-radius: 12px; box-shadow: 0 0 40px rgba(34,211,238,0.15); }
.modal-close { position: absolute; top: 10px; right: 14px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #94a3b8; background: none; border: none; cursor: pointer; font-size: 18px; &:hover { color: #fff; } }
.modal-title { color: #67e8f9; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.detail-card { h4 { color: #67e8f9; font-size: 16px; margin-bottom: 12px; } .detail-grid { display: grid; grid-template-columns: 80px 1fr; gap: 8px 12px; font-size: 13px; span { color: #94a3b8; } b { color: #e2e8f0; } } }
.create-task-form { display: flex; flex-direction: column; gap: 12px;
  .form-row { display: flex; align-items: center; gap: 10px; label { width: 60px; font-size: 13px; color: #94a3b8; flex-shrink: 0; } }
  .form-input { flex: 1; height: 34px; padding: 0 10px; font-size: 13px; color: #e2e8f0; background: rgba(15,23,42,0.8); border: 1px solid rgba(56,189,248,0.2); border-radius: 4px; outline: none; &:focus { border-color: #22d3ee; } option { background: #0f172a; color: #e2e8f0; } }
  .form-info { display: flex; gap: 12px; padding: 8px 12px; background: rgba(30,58,138,0.25); border-radius: 4px; font-size: 12px; color: #94a3b8; }
  .submit-btn { height: 38px; color: #020617; font-weight: 700; background: linear-gradient(90deg, #22d3ee, #67e8f9); border: none; border-radius: 6px; cursor: pointer; &:hover { box-shadow: 0 0 20px rgba(34,211,238,0.5); } } }
.track-replay-body { display: flex; flex-direction: column; gap: 12px; }
.replay-map { position: relative; width: 100%; height: 400px; border-radius: 6px; overflow: hidden; }
.trail-dot { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; transform: translate(-50%, -50%); box-shadow: 0 0 8px rgba(34,211,238,0.8); }
.replay-controls { display: flex; align-items: center; gap: 10px; button { height: 32px; padding: 0 14px; color: #bfdbfe; background: rgba(30,58,138,0.4); border: 1px solid rgba(56,189,248,0.2); border-radius: 4px; cursor: pointer; } .form-input { height: 32px; padding: 0 8px; font-size: 12px; color: #e2e8f0; background: rgba(15,23,42,0.8); border: 1px solid rgba(56,189,248,0.2); border-radius: 4px; outline: none; option { background: #0f172a; } } .replay-slider { flex: 1; accent-color: #22d3ee; } span { font-size: 12px; color: #94a3b8; min-width: 50px; } }
.video-grid { display: flex; gap: 12px; margin-bottom: 12px; }
.video-window { flex: 1; position: relative; aspect-ratio: 16/9; background: #020617; border-radius: 8px; overflow: hidden; border: 1px solid rgba(56,189,248,0.15); .video-label { position: absolute; top: 8px; right: 10px; z-index: 3; font-size: 11px; color: #94a3b8; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: 3px; } .video-svg { width: 100%; height: 100%; } .video-scan-line { position: absolute; inset-x: 0; height: 1px; background: rgba(34,211,238,0.18); pointer-events: none; } .video-noise { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E"); background-size: 128px; opacity: 0.04; pointer-events: none; } .video-osd { position: absolute; bottom: 6px; left: 10px; right: 10px; display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.8); background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 3px; font-family: 'Courier New', monospace; z-index: 3; } }
.video-vehicle-select { display: flex; justify-content: center; select { height: 32px; padding: 0 10px; font-size: 13px; color: #e2e8f0; background: rgba(15,23,42,0.8); border: 1px solid rgba(56,189,248,0.2); border-radius: 4px; outline: none; min-width: 200px; option { background: #0f172a; } } }
.vchart-box { flex: 1; min-height: 0; }
</style>

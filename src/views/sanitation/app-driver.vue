<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="驾驶员端"
      subtitle="查看收运任务，接单、上报到达、补传凭证。"
      phase="APP端"
      priority="P0"
      module="移动端"
    >
      <template #extra>
        <a-button type="primary" @click="showPrdPanel">产品需求说明</a-button>
      </template>
    </ModuleHeader>

    <div ref="prdPanelRef" class="prd-panel">
      <a-collapse v-model:active-key="prdActiveKeys" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🎯 功能要点（开发 / 测试关注）</td></tr>
                  <tr><td class="prd-label">页面</td><td class="prd-value">驾驶员端「任务列表 → 收运任务详情」，用于驾驶员查看任务、接单、确认路线、理解系统自动流转结果，并在完成后补传凭证照片</td></tr>
                  <tr><td class="prd-label">目标用户</td><td class="prd-value">小勾臂车 / 大勾臂车驾驶员，主要在车内、收集点、中转站、焚烧厂等移动现场使用</td></tr>
                  <tr><td class="prd-label">业务流</td><td class="prd-value">任务列表点击任务 → 进入详情 → 查看下一步动作和路线 → 待接单时驾驶员接单 → 系统识别进入始发点围栏并开始收运 → 系统识别到达目的地并自动完成 → 已完成后补传车辆照片</td></tr>
                  <tr><td class="prd-label">信息优先级</td><td class="prd-value">顶部优先展示状态、任务类型、任务名称和下一步动作；路线摘要、核心指标和地图优先于关键事件；单据信息作为下方辅助核对信息</td></tr>
                  <tr><td class="prd-label">顶部状态区</td><td class="prd-value">根据待接单 / 已接单 / 收运中 / 已完成 / 已超时显示不同状态色；“下一步”是轻量提示条，不表现为按钮，避免误导驾驶员点击</td></tr>
                  <tr><td class="prd-label">路线摘要</td><td class="prd-value">展示「收运点 → 目的地」，小勾臂为收集点到中转站，大勾臂为中转站到焚烧厂</td></tr>
                  <tr><td class="prd-label">地图轨迹</td><td class="prd-value">详情页地图复用收运单监控的轨迹展示能力，显示车辆实际轨迹、未完成路段、始发点和目的地电子围栏及称重信息</td></tr>
                  <tr><td class="prd-label">查看始发点</td><td class="prd-value">点击“查看始发点”后，地图聚焦并放大到轨迹始发点，帮助驾驶员快速确认起点位置</td></tr>
                  <tr><td class="prd-label">关键事件</td><td class="prd-value">关键事件不平铺完整大时间线，只展示当前进度附近事件和完成进度，减少详情页占用空间</td></tr>
                  <tr><td class="prd-label">单据信息</td><td class="prd-value">完整展示任务单号、关联运单、任务类型、状态、驾驶员、车辆、箱体、收运点、目的地、截止时间、满溢率、称重、创建/接单/装车/完成时间和凭证状态</td></tr>
                  <tr><td class="prd-label">凭证上传</td><td class="prd-value">已完成且未上传凭证时，底部显示补传凭证入口；进入上传页后提示上传收运完车辆照片，支持水印相机拍照和从相册选择</td></tr>
                  <tr><td class="prd-label">底部操作</td><td class="prd-value">底部操作区始终浮在地图图层之上；待接单显示接单按钮，已接单/收运中显示系统自动识别说明，已完成未传凭证显示补传入口</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🔑 状态设计</td></tr>
                  <tr><td class="prd-label">收运状态</td><td class="prd-value">待接单 / 已接单 / 收运中 / 已完成，四个状态互斥；超时状态独立展示</td></tr>
                  <tr><td class="prd-label">待接单 → 已接单</td><td class="prd-value">驾驶员手动点击接单，记录 acceptTime，任务进入“已接单”</td></tr>
                  <tr><td class="prd-label">已接单 → 收运中</td><td class="prd-value">驾驶员无需点击到达；系统识别车辆进入始发点围栏并完成装车后，自动设置 startTime 并变为“收运中”</td></tr>
                  <tr><td class="prd-label">收运中 → 已完成</td><td class="prd-value">驾驶员无需点击卸车完成；系统识别车辆进入中转站 / 焚烧厂目的地围栏并完成卸车后，自动设置 finishTime 并变为“已完成”</td></tr>
                  <tr><td class="prd-label">已完成</td><td class="prd-value">任务不可再推进；如果 proofUploaded=false，引导驾驶员补传收运完车辆照片</td></tr>
                  <tr><td class="prd-label">原型模拟</td><td class="prd-value">为演示自动识别流程，原型保留“模拟系统识别 / 模拟系统完成”入口，真实 APP 中由定位、电子围栏和作业事件自动触发</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 边界 & 验收要点</td></tr>
                  <tr><td class="prd-label">✓ 列表进详情</td><td class="prd-value">任务列表点击任一任务后进入详情，详情内容与所选任务一致</td></tr>
                  <tr><td class="prd-label">✓ 状态引导</td><td class="prd-value">不同状态展示不同颜色和下一步动作；“下一步”不应像按钮</td></tr>
                  <tr><td class="prd-label">✓ 地图优先级</td><td class="prd-value">地图展示顺序高于关键事件，驾驶员可先看路线和始发点</td></tr>
                  <tr><td class="prd-label">✓ 始发点放大</td><td class="prd-value">点击“查看始发点”后，地图中心切到始发点并放大</td></tr>
                  <tr><td class="prd-label">✓ 自动开始收运</td><td class="prd-value">已接单状态不出现“到达收集点/开始装车”手动按钮，由系统自动切换到收运中</td></tr>
                  <tr><td class="prd-label">✓ 自动完成</td><td class="prd-value">收运中状态不出现“到达中转站/卸车完成”手动按钮，由系统自动完成任务</td></tr>
                  <tr><td class="prd-label">✓ 单据信息完整</td><td class="prd-value">单据信息必须覆盖任务、司机、车辆、箱体、地址、时效、称重、时间和凭证状态，不能缺失关键字段</td></tr>
                  <tr><td class="prd-label">✓ 凭证上传</td><td class="prd-value">点击补传凭证后进入上传页，页面明确提示上传收运完车辆照片，可模拟水印相机拍照、相册选择、照片预览和提交</td></tr>
                  <tr><td class="prd-label">✓ 图层遮挡</td><td class="prd-value">底部操作区层级高于地图，不被 Leaflet 地图控件或图层遮挡</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">当前为 mock 数据；后续对接后端时，任务状态、轨迹点、围栏事件、称重和凭证需走 API 同步</td></tr>
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
          <span>10:22</span>
          <span>🔋 91%</span>
        </div>

        <div class="phone-body">
          <!-- ===== 全屏运单详情 ===== -->
          <div v-if="detailTask" class="detail-overlay">
            <div class="detail-header">
              <span class="back-btn" @click="detailTask = null">返回</span>
              <span class="detail-id">{{ detailTask.id }}</span>
              <a-space size="mini">
                <span class="dt-tag" :class="'dt-' + detailTask.status">{{ detailTask.status }}</span>
                <span v-if="detailTask.overtimeStatus === '已超时'" class="dt-tag dt-overtime-tag">超时</span>
              </a-space>
            </div>

            <div class="detail-body">
              <div class="dt-hero" :class="{ danger: detailTask.overtimeStatus === '已超时' }">
                <div class="dt-title-row">
                  <span class="dt-pri" :class="'pri-' + detailTask.priority">{{ detailTask.priority }}</span>
                  <span>{{ detailTask.taskType }}</span>
                </div>
                <h3>{{ detailTask.taskName }}</h3>
                <div class="dt-next">
                  <span class="dt-next-label">下一步</span>
                  <b>{{ getNextActionText(detailTask) }}</b>
                </div>
              </div>

              <div class="dt-route-card">
                <div class="route-point">
                  <span class="route-dot start"></span>
                  <div>
                    <span>收运点</span>
                    <b>{{ detailTask.startAddress }}</b>
                  </div>
                </div>
                <div class="route-line"></div>
                <div class="route-point">
                  <span class="route-dot end"></span>
                  <div>
                    <span>目的地</span>
                    <b>{{ detailTask.destination }}</b>
                  </div>
                </div>
              </div>

              <div class="dt-metric-grid">
                <div class="dm-item" :class="{ danger: detailTask.overtimeStatus === '已超时' }">
                  <span>截止</span>
                  <b>{{ getShortDeadline(detailTask.deadline) }}</b>
                  <em>SLA {{ detailTask.slaMinutes }}min</em>
                </div>
                <div class="dm-item" :class="{ danger: (detailTask.fillRate ?? 0) >= 90 }">
                  <span>满溢率</span>
                  <b>{{ detailTask.fillRate != null ? `${detailTask.fillRate}%` : '-' }}</b>
                  <em>{{ (detailTask.fillRate ?? 0) >= 90 ? '需优先处理' : '正常' }}</em>
                </div>
                <div class="dm-item">
                  <span>称重</span>
                  <b>{{ detailTask.weight != null ? `${detailTask.weight}t` : '待采集' }}</b>
                  <em>{{ detailTask.status === '收运中' ? '卸车后确认' : '系统记录' }}</em>
                </div>
                <div class="dm-item">
                  <span>箱体</span>
                  <b>{{ detailTask.boxNo }}</b>
                  <em>{{ detailTask.vehicle }}</em>
                </div>
              </div>

              <div class="dt-map-card">
                <div class="dt-section-head">
                  <span>路线轨迹</span>
                  <button class="start-point-btn" type="button" @click="showStartPoint(detailTask)">查看始发点</button>
                </div>
                <TaskTrackMap ref="detailMapRef" :track="detailTask.track" :weight="detailTask.weight" />
              </div>

              <!-- ===== 关键事件 ===== -->
              <div class="dt-section-head">
                <span>关键事件</span>
                <b>{{ getDoneStepCount(detailTask) }}/{{ detailTask.steps.length }}</b>
              </div>
              <div class="dt-events">
                <div v-for="step in getCompactSteps(detailTask)" :key="step.label" class="event-row" :class="{ done: step.done }">
                  <span class="event-dot"></span>
                  <div>
                    <b>{{ step.label }}</b>
                    <span>{{ step.time || (step.done ? '已完成' : '待处理') }}</span>
                  </div>
                </div>
              </div>

              <!-- ===== 辅助信息 ===== -->
              <div class="dt-section-head">
                <span>单据信息</span>
              </div>
              <a-descriptions class="dt-desc" :column="1" size="small" bordered>
                <a-descriptions-item label="任务单号">{{ detailTask.id }}</a-descriptions-item>
                <a-descriptions-item label="关联运单">{{ detailTask.waybillId }}</a-descriptions-item>
                <a-descriptions-item label="任务类型">{{ detailTask.taskType }}</a-descriptions-item>
                <a-descriptions-item label="任务状态">{{ detailTask.status }} / {{ detailTask.overtimeStatus }}</a-descriptions-item>
                <a-descriptions-item label="驾驶员">{{ detailTask.driver }}</a-descriptions-item>
                <a-descriptions-item label="车辆">{{ detailTask.vehicle }}</a-descriptions-item>
                <a-descriptions-item label="箱体编号">{{ detailTask.boxNo }}</a-descriptions-item>
                <a-descriptions-item label="收运点">{{ detailTask.startAddress }}</a-descriptions-item>
                <a-descriptions-item label="目的地">{{ detailTask.destination }}</a-descriptions-item>
                <a-descriptions-item label="截止时间">{{ detailTask.deadline }}</a-descriptions-item>
                <a-descriptions-item label="满溢率">{{ detailTask.fillRate != null ? `${detailTask.fillRate}%` : '—' }}</a-descriptions-item>
                <a-descriptions-item label="称重">{{ detailTask.weight != null ? `${detailTask.weight} 吨` : '待采集' }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ detailTask.createTime }}</a-descriptions-item>
                <a-descriptions-item label="接单/装车/完成">{{ detailTask.acceptTime || '—' }} / {{ detailTask.startTime || '—' }} / {{ detailTask.finishTime || '—' }}</a-descriptions-item>
                <a-descriptions-item label="凭证状态">{{ detailTask.proofUploaded ? '已上传' : '待上传' }}</a-descriptions-item>
              </a-descriptions>

              <!-- 凭证 -->
              <div v-if="detailTask.proofUploaded" class="dt-section-head">
                <span>凭证照片</span>
              </div>
              <div v-if="detailTask.proofUploaded" class="dt-proof-imgs">
                <div class="dpi-card"><span>装车照</span></div>
                <div class="dpi-card"><span>卸车照</span></div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="dt-actions">
              <a-button v-if="detailTask.status === '待接单'" type="primary" long size="large" @click="confirmAccept(detailTask)">接单</a-button>
              <div v-if="detailTask.status === '已接单'" class="dt-auto-state">
                <b>等待系统自动识别到达始发点</b>
                <span>进入收集点或中转站围栏后，状态自动变为收运中。</span>
                <button type="button" @click="simulateAutoStart(detailTask)">模拟系统识别</button>
              </div>
              <div v-if="detailTask.status === '收运中'" class="dt-auto-state">
                <b>等待系统自动识别到达目的地</b>
                <span>进入中转站或焚烧厂围栏并完成卸车后，任务自动完成。</span>
                <button type="button" @click="simulateAutoFinish(detailTask)">模拟系统完成</button>
              </div>
              <a-button v-if="detailTask.status === '已完成' && !detailTask.proofUploaded" type="primary" status="success" long size="large" @click="openProofUpload(detailTask)">补传凭证照片</a-button>
              <div v-if="detailTask.status === '已完成' && detailTask.proofUploaded" class="dt-done">任务已完成，凭证已上传</div>
            </div>
          </div>

          <div v-if="proofUploadTask" class="proof-upload-overlay">
            <div class="proof-upload-header">
              <span class="back-btn" @click="closeProofUpload">返回</span>
              <b>补传凭证照片</b>
              <span>{{ proofPhotos.length }}/2</span>
            </div>

            <div class="proof-upload-body">
              <div class="proof-tip">
                <b>请上传收运完车辆的照片</b>
                <span>建议包含车牌、箱体或卸车现场。照片会自动叠加任务水印。</span>
              </div>

              <div class="watermark-camera">
                <div class="camera-frame">
                  <div class="camera-crosshair"></div>
                  <div class="camera-watermark">
                    <b>{{ proofUploadTask.vehicle }}</b>
                    <span>{{ proofUploadTask.taskName }}</span>
                    <span>{{ proofUploadTask.destination }} · {{ nowTime() }}</span>
                  </div>
                </div>
                <div class="camera-caption">水印相机预览</div>
              </div>

              <div class="proof-actions-grid">
                <button type="button" @click="addProofPhoto('camera')">
                  <b>打开水印相机</b>
                  <span>拍照上传</span>
                </button>
                <button type="button" @click="addProofPhoto('album')">
                  <b>从相册选择</b>
                  <span>支持历史照片</span>
                </button>
              </div>

              <div class="proof-preview-list">
                <div v-for="photo in proofPhotos" :key="photo" class="proof-preview-item">
                  <span>{{ photo }}</span>
                </div>
                <div v-if="proofPhotos.length === 0" class="proof-preview-empty">暂无照片</div>
              </div>
            </div>

            <div class="dt-actions proof-submit-actions">
              <a-button type="primary" status="success" long size="large" :disabled="proofPhotos.length === 0" @click="submitProofUpload">提交凭证</a-button>
            </div>
          </div>

          <!-- ===== 任务列表 ===== -->
          <div v-else-if="store.activeDriverTab === 'task'" class="phone-content">
            <div class="top-bar">
              <span class="top-title">我的收运任务</span>
              <span class="top-user">张师傅 · 豫E3G516</span>
            </div>

            <!-- 状态筛选 -->
            <div class="filter-tabs">
              <div
                v-for="tab in statusTabs"
                :key="tab.key"
                class="ft-item"
                :class="{ active: taskStatFilter === tab.key }"
                @click="taskStatFilter = tab.key"
              >
                <span class="ft-label">{{ tab.label }}</span>
                <span class="ft-count">{{ tab.count }}</span>
              </div>
            </div>

            <!-- 卡片列表 -->
            <div class="task-list">
              <div v-if="filteredDriverTasks.length === 0" class="empty-state">
                <span class="empty-icon">📋</span><span>暂无任务</span>
              </div>
              <div v-for="task in filteredDriverTasks" :key="task.id" class="task-card" @click="detailTask = task">
                <div class="tc-head">
                  <b>{{ task.taskName }}</b>
                  <span class="tc-st" :class="'ts-' + task.status">{{ task.status }}</span>
                </div>
                <div class="tc-addr">📍 {{ task.startAddress }} → {{ task.destination }}</div>
                <div class="tc-row">
                  <span class="tc-pri" :class="'pri-' + task.priority">{{ task.priority }}</span>
                  <span v-if="task.fillRate != null" class="tc-fill" :class="{ 'tc-fill-high': task.fillRate >= 90 }">
                    满溢 {{ task.fillRate }}%
                  </span>
                  <span class="tc-deadline">{{ task.deadline }} 截止</span>
                  <span v-if="task.overtimeStatus === '已超时'" class="tc-ot">超时</span>
                </div>
                <div class="tc-steps-dots">
                  <span v-for="(s, i) in task.steps" :key="i" class="tsd" :class="{ done: s.done }"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 路线 ===== -->
          <div v-if="store.activeDriverTab === 'route'" class="phone-content">
            <div class="top-bar"><span class="top-title">路线导航</span></div>
            <div class="map-placeholder" @click="handleNavigate">
              <span class="mp-icon">🗺️</span>
              <span>当前任务路线</span>
              <span class="mp-hint">点击开始导航</span>
            </div>
            <div v-if="currentTask" class="route-card">
              <b>{{ currentTask.taskName }}</b>
              <div class="rc-points">
                <span class="rc-dot done"></span><span>{{ currentTask.startAddress }}</span>
              </div>
              <div class="rc-line"></div>
              <div class="rc-points">
                <span class="rc-dot" :class="{ done: currentTask.status !== '待接单' }"></span><span>{{ currentTask.destination }}</span>
              </div>
              <div class="rc-info"><span>{{ currentTask.slaMinutes }}min</span><span>{{ Math.round(currentTask.slaMinutes * 0.6) }}km</span></div>
            </div>
          </div>

          <!-- ===== 凭证 ===== -->
          <div v-if="store.activeDriverTab === 'proof'" class="phone-content">
            <div class="top-bar"><span class="top-title">凭证中心</span></div>
            <div class="proof-list">
              <div v-for="t in proofTasks" :key="t.id" class="proof-card" @click="handleProofClick(t)">
                <div class="pc-head"><b>{{ t.taskName }}</b><span :class="t.proofUploaded ? 'pc-yes' : 'pc-no'">{{ t.proofUploaded ? '已上传' : '待上传' }}</span></div>
                <p>{{ t.destination }}</p>
                <div v-if="t.proofUploaded" class="pc-previews"><span>📸</span><span>📸</span></div>
                <a-button v-if="!t.proofUploaded" size="mini" type="primary" @click.stop="openProofUpload(t)">上传凭证</a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部导航 -->
        <div class="bottom-nav">
          <div v-for="nav in driverNavs" :key="nav.key" class="nav-item" :class="{ active: store.activeDriverTab === nav.key }" @click="store.activeDriverTab = nav.key">
            <span class="ni-icon">{{ nav.icon }}</span><span class="ni-label">{{ nav.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Modal, Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import TaskTrackMap from './components/TaskTrackMap.vue'
import { driverTaskList, useAppStore, type DriverTask } from './data/app-mock'

defineOptions({ name: 'SanitationAppDriver' })

const store = useAppStore
const taskStatFilter = ref<'all' | 'pending' | 'accepted' | 'running' | 'done' | 'proof'>('all')
const detailTask = ref<DriverTask | null>(null)
const detailMapRef = ref<{ focusStartPoint: () => void } | null>(null)
const prdPanelRef = ref<HTMLElement | null>(null)
const prdActiveKeys = ref<string[]>(['prd'])
const proofUploadTask = ref<DriverTask | null>(null)
const proofPhotos = ref<string[]>([])

const driverNavs = [
  { key: 'task', label: '任务', icon: '📋' },
  { key: 'route', label: '路线', icon: '🧭' },
  { key: 'proof', label: '凭证', icon: '📸' },
]

const currentTask = computed(() => driverTaskList.find(t => ['已接单','收运中'].includes(t.status)))
const proofTasks = computed(() => driverTaskList.filter(t => t.status === '已完成'))

const statusStepMap: Record<string, string> = {
  '待接单': '等待驾驶员接单', '已接单': '已接单，前往始发点',
  '收运中': '已装车，正在转运', '已完成': '已卸车完成',
}

const statusTabs = computed(() => [
  { key: 'all', label: '全部', count: driverTaskList.length },
  { key: 'pending', label: '待接单', count: driverTaskList.filter(t => t.status === '待接单').length },
  { key: 'accepted', label: '已接单', count: driverTaskList.filter(t => t.status === '已接单').length },
  { key: 'running', label: '收运中', count: driverTaskList.filter(t => t.status === '收运中').length },
  { key: 'done', label: '已完成', count: driverTaskList.filter(t => t.status === '已完成').length },
  { key: 'proof', label: '待补传', count: driverTaskList.filter(t => t.status === '已完成' && !t.proofUploaded).length },
])

const filteredDriverTasks = computed(() => {
  const map: Record<string, DriverTask[]> = {
    pending: driverTaskList.filter(t => t.status === '待接单'),
    accepted: driverTaskList.filter(t => t.status === '已接单'),
    running: driverTaskList.filter(t => t.status === '收运中'),
    done: driverTaskList.filter(t => t.status === '已完成'),
    proof: driverTaskList.filter(t => t.status === '已完成' && !t.proofUploaded),
  }
  return map[taskStatFilter.value] || driverTaskList
})

function nowTime() { return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }

function showPrdPanel() {
  prdActiveKeys.value = ['prd']
  prdPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function getShortDeadline(deadline: string) {
  return deadline.split(' ').pop() || deadline
}

function getDoneStepCount(t: DriverTask) {
  return t.steps.filter(s => s.done).length
}

function getCompactSteps(t: DriverTask) {
  const lastDoneIndex = t.steps.map(s => s.done).lastIndexOf(true)
  const nextIndex = t.steps.findIndex(s => !s.done)
  const start = Math.max(0, Math.min(lastDoneIndex >= 0 ? lastDoneIndex : 0, nextIndex >= 0 ? nextIndex : t.steps.length - 1) - 1)
  return t.steps.slice(start, start + 3)
}

function getNextActionText(t: DriverTask) {
  if (t.status === '待接单') return '确认接单'
  if (t.status === '已接单') return '前往始发点，系统自动开始收运'
  if (t.status === '收运中') return '前往目的地，系统自动完成'
  if (!t.proofUploaded) return '补传车辆照片'
  return '任务闭环完成'
}

function confirmAccept(t: DriverTask) {
  Modal.confirm({ title: '确认接单', content: `确认接单「${t.taskName}」？`, okText: '确认接单', onOk: () => {
    t.status = '已接单'; t.acceptTime = nowTime()
    const s = t.steps.find(x => x.label === '接单'); if (s) { s.done = true; s.time = nowTime() }
    const tp = t.track.find(x => x.label === '接单位置'); if (tp) tp.done = true
    ArcoMessage.success('已接单'); detailTask.value = null
  }})
}

function simulateAutoStart(t: DriverTask) {
  t.status = '收运中'; t.startTime = nowTime()
  t.steps.filter(s => s.label.includes('到达') || s.label === '装车').forEach(s => { s.done = true; if (!s.time) s.time = nowTime() })
  t.track.forEach(p => { if (!p.done && p.label === '装车点') p.done = true })
  t.weight = +(Math.random() * 3 + 1.5).toFixed(1)
  ArcoMessage.success('系统已识别进入始发点围栏，任务变更为收运中')
}

function simulateAutoFinish(t: DriverTask) {
  t.status = '已完成'; t.finishTime = nowTime()
  t.steps.forEach(s => { if (!s.done) { s.done = true; s.time = nowTime() } })
  t.track.forEach(p => { if (!p.done) p.done = true })
  ArcoMessage.success('系统已识别到达目的地并卸车完成，任务自动完成')
}

function showStartPoint(t: DriverTask) {
  detailMapRef.value?.focusStartPoint()
  ArcoMessage.info(`始发点：${t.startAddress}`)
}

function openProofUpload(t: DriverTask) {
  proofUploadTask.value = t
  proofPhotos.value = []
}

function closeProofUpload() {
  proofUploadTask.value = null
  proofPhotos.value = []
}

function addProofPhoto(source: 'camera' | 'album') {
  if (proofPhotos.value.length >= 2) {
    ArcoMessage.info('最多模拟上传 2 张凭证照片')
    return
  }
  proofPhotos.value.push(source === 'camera' ? `水印相机照片 ${proofPhotos.value.length + 1}` : `相册照片 ${proofPhotos.value.length + 1}`)
  ArcoMessage.success(source === 'camera' ? '已拍摄水印照片' : '已选择相册照片')
}

function submitProofUpload() {
  if (!proofUploadTask.value || proofPhotos.value.length === 0) return
  proofUploadTask.value.proofUploaded = true
  if (detailTask.value?.id === proofUploadTask.value.id) detailTask.value.proofUploaded = true
  ArcoMessage.success('凭证照片已上传')
  closeProofUpload()
}

function handleNavigate() { ArcoMessage.info('正在启动导航...') }
function handleProofClick(t: DriverTask) { detailTask.value = t }
</script>

<style scoped lang="scss">
.sanitation-page { display: flex; flex-direction: column; gap: 14px; }
.prd-panel {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
}
.prd-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 4px 10px;
}
.prd-section-title {
  padding: 8px 12px;
  color: #165dff;
  background: #e8f3ff;
  font-weight: 700;
}
.prd-table {
  width: 100%;
  overflow: hidden;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e5e6eb;
  border-radius: 6px;

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #f2f3f5;
    font-size: 13px;
    line-height: 1.5;
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .prd-label {
    width: 140px;
    color: #1d2129;
    background: #f7f8fa;
    font-weight: 600;
    white-space: nowrap;
  }

  .prd-value {
    color: #4e5969;
  }
}
.phone-wrapper { display: flex; justify-content: center; padding: 12px 0; }
.phone-frame { width: 390px; min-height: 780px; background: #f0f2f5; border: 3px solid #1f2937; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.16); display: flex; flex-direction: column; }
.phone-status-bar { display: flex; justify-content: space-between; padding: 10px 20px 4px; background: #fff; font-size: 12px; color: #1d2129; font-weight: 600; }
.phone-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative; }
.phone-content { flex: 1; overflow-y: auto; padding: 0 14px 12px; background: #f0f2f5; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
.top-title { font-size: 17px; font-weight: 700; color: #1d2129; }
.top-user { font-size: 12px; color: rgb(var(--arcoblue-6)); font-weight: 600; }

// ===== 状态筛选 =====
.filter-tabs {
  display: flex; gap: 0; margin-bottom: 10px;
  background: #fff; border-radius: 8px; overflow: hidden;
}
.ft-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 7px 2px; cursor: pointer; border-bottom: 2px solid transparent;
  transition: all .15s; min-width: 0;
  &.active { border-bottom-color: rgb(var(--arcoblue-6)); background: #e8f3ff; }
  .ft-label { font-size: 11px; color: #86909c; white-space: nowrap; }
  .ft-count { font-size: 15px; font-weight: 700; color: #1d2129; line-height: 1.3; }
  &.active .ft-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
  &.active .ft-count { color: rgb(var(--arcoblue-6)); }
}

// ===== 任务卡片 =====
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.tc-head { display: flex; justify-content: space-between; align-items: center; b { font-size: 14px; color: #1d2129; } }
.tc-st { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.ts-待接单 { background: #fff7e8; color: #ff7d00; } .ts-已接单, .ts-收运中 { background: #e8f3ff; color: #165dff; } .ts-已完成 { background: #e8ffea; color: #00b42a; }
.tc-addr { font-size: 12px; color: #4e5969; margin: 4px 0; }
.tc-row { display: flex; align-items: center; gap: 6px; font-size: 11px; flex-wrap: wrap; }
.tc-pri { padding: 0 4px; border-radius: 3px; font-size: 10px; }
.pri-紧急 { background:#fff0f0; color:#f53f3f; } .pri-普通 { background:#f2f3f5; color:#86909c; }
.tc-fill { color: #ff7d00; font-weight: 500; }
.tc-fill-high { color: #f53f3f; font-weight: 700; }
.tc-deadline { color: #86909c; }
.tc-ot { color: #f53f3f; font-weight: 700; }
.tc-steps-dots { display: flex; gap: 3px; margin-top: 6px; }
.tsd { width: 6px; height: 6px; border-radius: 50%; background: #e5e6eb; }
.tsd.done { background: #00b42a; }

.empty-state { display:flex; flex-direction:column; align-items:center; padding:40px; gap:8px; color:#c9cdd4; .empty-icon{font-size:36px;}}

// ===== 全屏详情 =====
.detail-overlay { position: absolute; inset: 0; z-index: 10; background: #f3f5f8; display: flex; flex-direction: column; }
.detail-header { display: grid; grid-template-columns: 64px 1fr auto; align-items: center; gap: 8px; padding: 10px 14px; background: #fff; border-bottom: 1px solid #e5e6eb; flex-shrink: 0; }
.back-btn { font-size: 14px; color: rgb(var(--arcoblue-6)); font-weight: 600; cursor: pointer; &:active { opacity: .7; } }
.detail-id { overflow: hidden; color: #86909c; font-size: 12px; font-weight: 600; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.dt-tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.dt-待接单 { background: #fff7e8; color: #ff7d00; } .dt-已接单, .dt-收运中 { background: #e8f3ff; color: #165dff; } .dt-已完成 { background: #e8ffea; color: #00b42a; }
.dt-overtime-tag { background: #fff0f0; color: #f53f3f !important; }

.detail-body { flex: 1; overflow-y: auto; padding: 12px 12px 88px; display: flex; flex-direction: column; gap: 10px; }

.dt-hero {
  padding: 10px 12px;
  color: #fff;
  background: linear-gradient(135deg, #165dff 0%, #0e42d2 100%);
  border-radius: 8px;
  box-shadow: 0 6px 14px rgba(22, 93, 255, .18);
  &.danger { background: linear-gradient(135deg, #f53f3f 0%, #cb272d 100%); box-shadow: 0 6px 14px rgba(245, 63, 63, .16); }
  h3 { margin: 6px 0 8px; font-size: 17px; line-height: 1.3; letter-spacing: 0; }
}
.dt-title-row { display: flex; align-items: center; gap: 8px; font-size: 12px; opacity: .9; }
.dt-pri { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.dt-hero .dt-pri { color: #fff; background: rgba(255,255,255,.2); }
.dt-next {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.22);
  b { font-size: 13px; line-height: 1.3; text-align: left; }
}
.dt-next-label { flex-shrink: 0; padding: 1px 5px; color: rgba(255,255,255,.9); background: rgba(255,255,255,.14); border-radius: 3px; font-size: 11px; }

.dt-route-card,
.dt-map-card,
.dt-events,
.dt-desc,
.dt-proof-imgs {
  background: #fff;
  border-radius: 8px;
}
.dt-route-card { padding: 12px; }
.route-point { display: grid; grid-template-columns: 16px 1fr; gap: 8px; align-items: flex-start; }
.route-point span:not(.route-dot) { display: block; margin-bottom: 2px; color: #86909c; font-size: 11px; }
.route-point b { display: block; color: #1d2129; font-size: 13px; line-height: 1.35; }
.route-dot { width: 10px; height: 10px; margin-top: 4px; border-radius: 50%; }
.route-dot.start { background: #165dff; }
.route-dot.end { background: #00b42a; }
.route-line { width: 1px; height: 16px; margin: 2px 0 2px 4px; background: #c9cdd4; }

.dt-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.dm-item {
  min-width: 0;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  span, em { display: block; color: #86909c; font-size: 11px; font-style: normal; line-height: 1.3; }
  b { display: block; overflow: hidden; margin: 3px 0; color: #1d2129; font-size: 16px; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
  &.danger b, &.danger em { color: #f53f3f; }
}

.dt-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 2px 0;
  color: #1d2129;
  font-size: 14px;
  font-weight: 700;
  b { overflow: hidden; color: #86909c; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
}
.dt-events { padding: 4px 12px; }
.event-row {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  border-bottom: 1px solid #f2f3f5;
  &:last-child { border-bottom: 0; }
  b { display: block; color: #1d2129; font-size: 13px; line-height: 1.25; }
  span:not(.event-dot) { color: #86909c; font-size: 11px; }
  &.done .event-dot { background: #00b42a; }
}
.event-dot { width: 8px; height: 8px; border-radius: 50%; background: #c9cdd4; }
.dt-map-card { padding: 10px; }
.dt-map-card :deep(.map-container) { height: 180px; border-radius: 6px; }
.dt-map-card :deep(.map-legend) { gap: 6px 10px; padding-top: 8px; font-size: 11px; }
.dt-map-card :deep(.legend-line) { width: 18px; border-top-width: 3px; }
.dt-map-card :deep(.legend-weight) { padding: 1px 6px; }
.start-point-btn {
  flex-shrink: 0;
  height: 24px;
  padding: 0 8px;
  color: #165dff;
  background: #e8f3ff;
  border: 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.dt-desc { overflow: hidden; }
.dt-desc :deep(.arco-descriptions-item-label),
.dt-desc :deep(.arco-descriptions-item-value) { font-size: 12px; }

// 凭证
.dt-proof-imgs { display: flex; gap: 8px; }
.dpi-card { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 56px; background: #f7f8fa; border: 1px dashed #c9cdd4; border-radius: 6px; span { font-size: 12px; color: #4e5969; } }

.dt-actions { position: absolute; right: 0; bottom: 0; left: 0; z-index: 5000; padding: 10px 14px 18px; background: rgba(255,255,255,.98); border-top: 1px solid #e5e6eb; box-shadow: 0 -6px 16px rgba(29, 33, 41, .08); }
.dt-done { text-align: center; padding: 12px; background: #e8ffea; border-radius: 8px; font-size: 14px; color: #00b42a; font-weight: 600; }
.dt-auto-state {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 10px;
  align-items: center;
  padding: 10px;
  background: #f7f8fa;
  border-radius: 8px;
  b { color: #1d2129; font-size: 13px; line-height: 1.3; }
  span { color: #86909c; font-size: 11px; line-height: 1.35; }
  button { grid-row: 1 / span 2; grid-column: 2; height: 30px; padding: 0 10px; color: #165dff; background: #e8f3ff; border: 0; border-radius: 5px; font-size: 12px; font-weight: 600; cursor: pointer; }
}

.proof-upload-overlay {
  position: absolute;
  inset: 0;
  z-index: 6000;
  display: flex;
  flex-direction: column;
  background: #f3f5f8;
}
.proof-upload-header {
  display: grid;
  grid-template-columns: 64px 1fr 40px;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
  b { color: #1d2129; font-size: 15px; text-align: center; }
  span:last-child { color: #86909c; font-size: 12px; font-weight: 600; text-align: right; }
}
.proof-upload-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 88px;
}
.proof-tip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #fff7e8;
  border: 1px solid #ffe4ba;
  border-radius: 8px;
  b { color: #1d2129; font-size: 14px; }
  span { color: #86909c; font-size: 12px; line-height: 1.45; }
}
.watermark-camera {
  margin-top: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
}
.camera-frame {
  position: relative;
  height: 260px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(22,93,255,.16), rgba(0,180,42,.12)),
    linear-gradient(180deg, #dfe8f2, #f7f8fa);
  border-radius: 8px;
}
.camera-crosshair {
  position: absolute;
  inset: 28px;
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 8px;
  &::before,
  &::after { position: absolute; content: ''; background: rgba(255,255,255,.7); }
  &::before { top: 50%; right: 0; left: 0; height: 1px; }
  &::after { top: 0; bottom: 0; left: 50%; width: 1px; }
}
.camera-watermark {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  color: #fff;
  background: rgba(0,0,0,.42);
  border-radius: 6px;
  b { font-size: 15px; }
  span { font-size: 11px; line-height: 1.35; }
}
.camera-caption { margin-top: 8px; color: #86909c; font-size: 12px; text-align: center; }
.proof-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
  button {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-height: 62px;
    padding: 10px;
    background: #fff;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    cursor: pointer;
    b { color: #1d2129; font-size: 13px; }
    span { color: #86909c; font-size: 11px; }
  }
}
.proof-preview-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.proof-preview-item,
.proof-preview-empty {
  padding: 10px;
  color: #4e5969;
  background: #fff;
  border-radius: 8px;
  font-size: 12px;
}
.proof-preview-item { border-left: 3px solid #00b42a; }
.proof-preview-empty { color: #c9cdd4; text-align: center; }
.proof-submit-actions { z-index: 6100; }

// 路线 / 凭证 Tab
.map-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; height:180px; background:linear-gradient(135deg,#e8fff0,#d4ffe8); border-radius:12px; cursor:pointer; margin-bottom:12px; .mp-icon{font-size:36px;} span{font-size:14px; color:#4e5969; margin-top:4px;} .mp-hint{font-size:11px; color:#86909c;} }
.route-card { background:#fff; border-radius:10px; padding:12px; b{font-size:14px;} }
.rc-points { display:flex; align-items:center; gap:8px; margin:6px 0; font-size:12px; color:#86909c; }
.rc-dot { width:10px; height:10px; border-radius:50%; background:#e5e6eb; flex-shrink:0; }
.rc-dot.done { background:#00b42a; }
.rc-line { width:2px; height:18px; background:#e5e6eb; margin-left:4px; }
.rc-info { display:flex; justify-content:space-between; font-size:11px; color:#86909c; margin-top:6px; }

.proof-list { display:flex; flex-direction:column; gap:8px; }
.proof-card { background:#fff; border-radius:10px; padding:12px; cursor:pointer; &:active{background:#f7f8fa;} b{font-size:14px;} }
.pc-head { display:flex; justify-content:space-between; align-items:center; }
.pc-yes { font-size:11px; color:#00b42a; font-weight:600; } .pc-no { font-size:11px; color:#ff7d00; }
.proof-card p { font-size:12px; color:#86909c; margin:4px 0; }
.pc-previews { display:flex; gap:6px; margin:8px 0; span { font-size:14px; padding:14px 18px; background:#f0f2f5; border-radius:8px; } }

// 底部导航
.bottom-nav { display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px 0 18px; background: #fff; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.ni-icon { font-size: 20px; } .ni-label { font-size: 10px; color: #86909c; }
.nav-item.active .ni-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
</style>

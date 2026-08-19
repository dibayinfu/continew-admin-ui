<template>
  <div class="gi_page task-monitor-page">
    <ModuleHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
      phase="试运营"
      priority="P0"
      module="收运任务单"
    >
      <template #extra>
        <a-button type="primary" @click="goCreate">
          <template #icon><icon-plus /></template>
          快速创建任务
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <PrdPanel :sections="prdSections" />

    <div class="monitor-layout">
      <section class="task-list-panel">
        <div class="toolbar">
          <a-input-search v-model="keyword" placeholder="搜索任务/司机/车辆/箱体" allow-clear class="toolbar-search" />
          <div class="toolbar-filters">
            <a-select v-model="collectionFilter" placeholder="收运状态" style="width: 110px;">
              <a-option value="全部">全部</a-option>
              <a-option value="待接单">待接单</a-option>
              <a-option value="已接单">已接单</a-option>
              <a-option value="收运中">收运中</a-option>
              <a-option value="已完成">已完成</a-option>
            </a-select>
            <a-select v-model="overtimeFilter" placeholder="超时状态" style="width: 110px;">
              <a-option value="全部">全部</a-option>
              <a-option value="未超时">未超时</a-option>
              <a-option value="已超时">已超时</a-option>
            </a-select>
          </div>
        </div>
        <div class="task-list">
          <button
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
            :class="{ active: task.id === selectedTask.id }"
            type="button"
            @click="selectedTask = task"
          >
            <div class="task-item-head">
              <b>{{ taskTitle(task) }}</b>
              <a-space :size="2">
                <StatusTag :value="task.collectionStatus" />
                <a-tooltip v-if="task.overtimeStatus === '已超时'" content="已超时">
                  <icon-clock-circle class="status-icon overtime" />
                </a-tooltip>
                <a-tooltip v-if="task.priority === '紧急'" content="紧急">
                  <icon-thunderbolt class="status-icon urgent" />
                </a-tooltip>
                <a-tooltip v-if="task.forceCompleted" content="强制完成">
                  <icon-exclamation-circle-fill class="status-icon force" />
                </a-tooltip>
              </a-space>
            </div>
            <div class="task-route">
              <div>
                <b>{{ task.startAddress }}</b>
              </div>
              <div class="route-arrow">→</div>
              <div>
                <b>{{ task.destinationName }}</b>
              </div>
            </div>
            <div class="task-item-meta">
              <span>{{ task.vehicle }}</span>
              <span>{{ task.driver }}</span>
              <span class="task-sla">{{ task.slaMinutes }}分钟</span>
            </div>
          </button>
        </div>
      </section>

      <section class="map-panel">
        <div class="map-header">
          <div>
            <h3>{{ taskTitle(selectedTask) }}</h3>
          </div>
          <a-space :size="2">
            <StatusTag :value="selectedTask.collectionStatus" />
            <a-tooltip v-if="selectedTask.overtimeStatus === '已超时'" content="已超时">
              <icon-clock-circle class="status-icon overtime" />
            </a-tooltip>
            <a-tooltip v-if="selectedTask.priority === '紧急'" content="紧急">
              <icon-thunderbolt class="status-icon urgent" />
            </a-tooltip>
            <a-tooltip v-if="selectedTask.forceCompleted" content="强制完成">
              <icon-exclamation-circle-fill class="status-icon force" />
            </a-tooltip>
          </a-space>
        </div>

        <div class="route-map">
          <TaskTrackMap :track="selectedTask.track" :weight="selectedTask.weight" />
        </div>

        <div class="ops-summary">
          <div>
            <span>始发点</span>
            <b>{{ startPointName }}</b>
            <em>{{ selectedTask.startAddress }}</em>
          </div>
          <div>
            <span>目的地</span>
            <b>{{ selectedTask.destinationName }}</b>
            <em>{{ selectedTask.destinationAddress }}</em>
          </div>
          <div>
            <span>时效</span>
            <b :class="{ overtime: selectedTask.overtimeStatus === '已超时' }">{{ selectedTask.durationText || '待开始' }}</b>
            <em>要求 {{ selectedTask.slaMinutes }} 分钟内</em>
          </div>
          <div>
            <span>驾驶员/车辆</span>
            <b>{{ selectedTask.driver }}</b>
            <b>{{ selectedTask.vehicle }}</b>
            <em>{{ selectedTask.vehicleType }}</em>
          </div>
          <div v-if="selectedTask.weight">
            <span>称重</span>
            <b>{{ selectedTask.weight }} t</b>
            <em>{{ selectedTask.boxType === '小勾臂箱' ? '收集点垃圾量' : '转运箱重量' }}</em>
          </div>
        </div>

      </section>

      <aside class="timeline-panel">
        <template v-if="showPanelActions">
          <div class="panel-title">操作</div>
          <div class="panel-actions">
            <a-button
              v-if="['已接单', '收运中'].includes(selectedTask.collectionStatus)"
              status="danger"
              @click="forceComplete"
            >
              强制完成
            </a-button>
            <a-button
              v-if="selectedTask.collectionStatus === '待接单'"
              type="primary"
              @click="reassign"
            >
              重新派单
            </a-button>
          </div>
        </template>

        <div class="panel-title timeline-title">关键事件</div>
        <a-timeline>
          <a-timeline-item
            v-for="point in eventPoints"
            :key="point.label"
            :dot-color="point.done ? 'green' : 'gray'"
          >
            <div class="event-row">
              <b class="event-title">{{ point.label }}</b>
              <span class="event-time">{{ point.time }}</span>
            </div>
            <div v-if="point.address" class="event-addr">{{ point.address }}</div>
          </a-timeline-item>
        </a-timeline>

        <div class="panel-title timeline-title">辅助信息</div>
        <a-descriptions :column="1" size="small">
          <a-descriptions-item label="任务单号">{{ selectedTask.id }}</a-descriptions-item>
          <a-descriptions-item label="来源告警">{{ selectedTask.alarmId }}</a-descriptions-item>
          <a-descriptions-item label="箱体名称">{{ selectedTask.boxName }}（{{ selectedTask.boxNo }}）</a-descriptions-item>
          <a-descriptions-item label="满溢率">
            <span :class="{ overtime: (selectedTask.fillRate ?? 0) >= 90 }">{{ selectedTask.fillRate != null ? selectedTask.fillRate + '%' : '—' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="箱体位置">{{ boxAddress }}</a-descriptions-item>
          <a-descriptions-item label="乡镇村庄">{{ selectedTask.town }}</a-descriptions-item>
          <a-descriptions-item label="完成凭证">
            <template v-if="selectedTask.proofImages?.length">
              <p style="margin-bottom: 8px;">{{ selectedTask.proof }}</p>
              <div class="proof-gallery">
                <a-image
                  v-for="(url, idx) in selectedTask.proofImages"
                  :key="idx"
                  :src="url"
                  :preview="true"
                  width="100%"
                  :style="{ aspectRatio: '4/3', borderRadius: '4px', overflow: 'hidden' }"
                />
              </div>
            </template>
            <template v-else>{{ selectedTask.proof }}</template>
          </a-descriptions-item>
        </a-descriptions>
      </aside>
    </div>

    <!-- 快速创建任务弹窗 -->
    <a-modal v-model:visible="createVisible" title="创建收运任务单" width="860px" @ok="submitTask">
      <div class="create-modal-body">
        <section class="create-alarm-info">
          <div class="section-title">选择箱体</div>
          <a-form layout="vertical">
            <a-form-item class="box-select-item" label="选择箱体编号">
              <div class="box-select-row">
                <a-select
                  v-model="selectedBoxKey"
                  placeholder="选择箱体编号"
                  allow-search
                  :filter-option="false"
                  allow-clear
                  @change="onBoxOptionChange"
                  @search="boxSearchKeyword = $event"
                  @clear="clearBoxSelection"
                >
                  <a-option v-for="opt in filteredBoxOptions" :key="opt.key" :value="opt.key" :label="opt.boxNo">
                    <div class="box-opt">
                      <span class="box-opt-no">{{ opt.boxNo }}</span>
                      <span v-if="opt.collectionPoint" class="box-opt-point">{{ opt.collectionPoint }}</span>
                      <span v-if="opt.fillRate != null" class="box-opt-rate" :class="rateTone(opt.fillRate)">{{ opt.fillRate }}%</span>
                    </div>
                  </a-option>
                </a-select>
                <a-tooltip content="刷新箱体数据">
                  <a-button class="box-refresh-btn" @click="refreshBoxData"><icon-refresh /></a-button>
                </a-tooltip>
              </div>
            </a-form-item>
          </a-form>

          <div v-if="selectedBox && !selectedCollectionPoint" class="box-no-point-hint">
            <a-link class="box-no-point-link" @click="openCollectionPointArchive">去收集点档案中添加收集点</a-link>
          </div>

          <template v-if="selectedBox && selectedCollectionPoint">
            <div class="box-info-line">
              <span><em>箱体编号</em>{{ selectedBoxDisplayNo }}</span>
              <span><em>箱体类型</em>{{ selectedBox.boxType }}</span>
              <span><em>收集点</em>{{ selectedCollectionPoint }}</span>
              <span><em>乡镇村庄</em>{{ selectedBoxTownVillage }}</span>
              <span><em>满溢率</em><b :class="{ overtime: (selectedBox.fillRate ?? 0) >= 90 }">{{ selectedBox.fillRate != null ? selectedBox.fillRate + '%' : '—' }}</b></span>
              <span><em>电量</em>{{ selectedBoxBattery }}</span>
            </div>
          </template>

          <div v-if="selectedBox && selectedBoxAlarm" class="box-alarm-line">
            <span><em>告警时间</em>{{ formatAlarmTime(selectedBoxAlarm.triggerTime) }}</span>
          </div>
        </section>
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import TaskTrackMap from './components/TaskTrackMap.vue'
import PrdPanel from './components/PrdPanel.vue'
import type { PrdSection } from './data/pageConfigs'
import {
  acceptCollectionTask,
  autoCompleteCollectionTask,
  collectionTasks,
  createCollectionTaskFromAlarm,
  destinations,
  drivers,
  sanitationAlarms,
  startCollectionTask,
  type CollectionTask,
  type SanitationAlarm,
} from './data/alert-task'
import { boxes, getDriverVehicles, vehicles } from './data/mock'

const prdSections: PrdSection[] = [
  {
    title: '🎯 功能要点（开发 / 测试关注）',
    items: [
      { label: '页面', value: '「收运单监控」和「全部任务单」共用同一组件，根据 URL 路径动态切换标题/副标题' },
      { label: '业务流', value: '派单（创建任务单）→ 驾驶员手动接单（必须步骤，不可跳过）→ 系统自动识别进入始发点电子围栏 → 装车（始发地+称重变化判断）→ 发车离开始发地 → 到达目的地电子围栏 → 卸车完成（目的地围栏+称重变化判断）→ 驾驶员补传凭证照片。未接单时即使车辆进入围栏也不会变为收运中，防止路过车辆误触发' },
      { label: '数据关联', value: '一个收运单必须有始发点、目的地、时效要求和八个关键事件；小勾臂为收集点→中转站，大勾臂为中转站→焚烧厂' },
      { label: '快速创建任务', value: '顶部按钮 → 本页弹出创建弹窗，选箱体后自动填充驾驶员/车辆/目的地，提交后追加到列表' },
      { label: '创建弹窗', value: '上半：箱体选择器（AutoComplete，搜索编号/名称）→ 展示位置/类型/乡镇 | 下半：任务配置表单' },
      { label: '布局', value: '三栏布局：左侧运单卡片（运营筛选）| 中间地图轨迹（调度判断）| 右侧关键详情（核查与复盘）' },
      { label: '左侧列表', value: '卡片第一层展示「箱体编号+任务类型」与状态标签；第二层用箭头展示「始发点 → 目的地」内容；第三层展示车牌、司机、SLA、优先级，弱化箱体名称等辅助信息' },
      { label: '中间面板', value: '地图按车辆实际轨迹点绘制平滑线路，实线表示已行驶、虚线表示待完成；始发点和目的地电子围栏按业务半径显示' },
      { label: '右侧面板', value: '顶部为操作按钮（已接单/收运中显示「强制完成」，待接单显示「重新派单」）；中部展示八个关键事件时间线和围栏规则；底部辅助信息区展示箱体编号、满溢率、告警号、电话等' },
      { label: '称重数据', value: '装车后称重设备读取垃圾重量（吨），收运中/已完成时在地图面板和右侧详情中展示，模拟推进/强制完成时自动生成随机重量' },
      { label: '满溢率', value: '箱体当前满溢百分比（来自满溢传感器），在右侧辅助信息区展示，≥90% 红色高亮标记「满溢」' },
      { label: '模拟推进', value: '点击按状态机推进：待接单→（接单）→已接单→（车辆入栏）→收运中→已完成，实时计算耗时、超时和称重，同步点亮对应关键事件步骤。待接单状态时「模拟推进」执行接单操作，已接单状态时才可推进至收运中' },
      { label: '完成凭证', value: '已完成任务显示证明图片（SVG 占位图），可预览放大' },
      { label: '强制完成', value: '右侧面板顶部按钮，已接单/收运中任务可强制设为已完成，自动计算耗时/超时/称重，当前步骤标记「已强制完成」。强制完成的任务会打上「强制完成」图标，关键事件可能不完整' },
      { label: '重新派单', value: '右侧面板顶部按钮，仅待接单任务可操作，点击协同打开「快速创建任务」弹层（弹层优化见后续需求）' },
      { label: '状态拆分', value: '收运状态（待接单/已接单/收运中/已完成）与超时状态（未超时/已超时）独立显示和筛选' },
      { label: '统计卡', value: '今日总任务 / 待接单 / 收运中 / 已完成 / 收运垃圾量(小勾臂完成总和) / 已超时，6 个指标卡片' },
      { label: '历史任务', value: '过往历史中未完成的任务单（如昨天创建仍未完成的）也会显示在列表中，不限定仅当日数据' },
    ],
  },
  {
    title: '🔑 状态设计',
    items: [
      { label: '收运状态', value: '待接单 / 已接单 / 收运中 / 已完成，四个值互斥按序流转' },
      { label: '待接单', value: '创建任务单后的初始状态' },
      { label: '已接单', value: '驾驶员手动接单后变为已接单' },
      { label: '收运中', value: '驾驶员手动接单后，车辆进入任务单中的始发点电子围栏后变为收运中；必须手动接单，未接单时即使进入围栏也不会自动开始收运，防止路过车辆误触发状态变更' },
      { label: '已完成', value: '卸货完成，根据目的地电子围栏 + 称重变化判断卸货' },
      { label: '超时状态', value: '未超时 / 已超时，独立于收运状态显示和筛选' },
      { label: '未超时', value: '默认状态，收运时长未超过任务时效要求' },
      { label: '已超时', value: '收运过程中，时长已超过任务时效要求，变为已超时' },
      { label: '关键事件（过程步骤）', value: '共 8 步：① 派单（任务单创建）→ ② 接单（驾驶员接单，必须步骤不可跳过）→ ③ 到达始发地（进入始发电子围栏）→ ④ 装车（始发地+称重变化判断）→ ⑤ 发车（离开始发地）→ ⑥ 到达目的地（进入目的地电子围栏）→ ⑦ 卸车完成（目的地围栏+称重变化判断）→ ⑧ 上传照片（驾驶员补传凭证）' },
    ],
  },
  {
    title: '⚠️ 边界 & 验收要点',
    items: [
      { label: '✓ 快速创建', value: '本页弹窗创建任务，选箱体后自动填充，提交后追加到列表' },
      { label: '✓ 选中切换', value: '左侧点击任务 → 中间/右侧联动刷新' },
      { label: '✓ 箱体位置', value: '小勾臂箱显示收集点地址，大勾臂箱显示中转站地址' },
      { label: '✓ 两种状态独立', value: '收运状态和超时状态各自独立显示标签，可分别筛选' },
      { label: '✓ 八事件上图', value: '派单、接单、到达始发地、装车、发车、到达目的地、卸车完成、上传照片八个关键事件必须在地图和右侧时间线上同步显示' },
      { label: '✓ 围栏半径', value: '小勾臂始发收集点 500m、目的中转站 500m；大勾臂始发中转站 500m、目的焚烧厂 1000m' },
      { label: '✓ 模拟推进', value: '按状态机推进，关键事件步骤同步点亮，最终计算实际耗时' },
      { label: '✓ 强制完成', value: '已接单/收运中任务可强制完成，自动计算耗时/超时/称重，track 全部点亮' },
      { label: '✓ 称重显示', value: '收运中/已完成状态显示称重数据（地图面板 + 右侧详情），完成后统计卡更新垃圾量' },
      { label: '✓ 重新派单', value: '待接单任务可重新派单，点击协同打开快速创建任务弹层' },
      { label: '✓ 超时判定', value: '实际耗时 > SLA 时 overtimeStatus=已超时，显示红色标记' },
      { label: '✓ 完成凭证', value: '已完成任务显示图片证明，可预览' },
      { label: '✓ 历史任务', value: '过往未完成的任务单正常显示在列表中，不受日期限制' },
      { label: '✓ 搜索/筛选', value: '关键字搜索（任务名/司机/车牌/箱体）+ 收运状态下拉 + 超时状态下拉' },
      { label: '✓ URL 参数', value: '?taskId=xxx 自动定位到指定任务' },
      { label: '✓ 数据来源', value: '当前为 mock 数据，对接后端后需走 API' },
    ],
  },
]

defineOptions({ name: 'SanitationTaskMonitor' })

const router = useRouter()
const route = useRoute()
const keyword = ref('')
const collectionFilter = ref('全部')
const overtimeFilter = ref('全部')
const selectedTask = ref<CollectionTask>(collectionTasks[0])
const showPanelActions = computed(() => ['待接单', '已接单', '收运中'].includes(selectedTask.value.collectionStatus))

const isAllTasks = computed(() => route.path.includes('workOrderStats'))
const pageTitle = computed(() => isAllTasks.value ? '全部任务单' : '收运单监控')
const pageSubtitle = computed(() => isAllTasks.value
  ? '查看全部收运任务单（含已完成和未完成），支持快速创建、重新派单、强制完成和状态跟踪。'
  : '围绕始发点、目的地、时效和四个关键事件监控收运单，支持轨迹核查、围栏判断和调度处置。')

const metrics = computed(() => {
  const smallBoxWeight = collectionTasks
    .filter((item) => item.collectionStatus === '已完成' && item.boxType === '小勾臂箱' && item.weight)
    .reduce((sum, item) => sum + (item.weight || 0), 0)
  return [
    { label: '今日总任务', value: collectionTasks.length, unit: '单' },
    { label: '待接单', value: collectionTasks.filter((item) => item.collectionStatus === '待接单').length, unit: '单', tone: 'warning' },
    { label: '收运中', value: collectionTasks.filter((item) => item.collectionStatus === '收运中' || item.collectionStatus === '已接单').length, unit: '单', tone: 'processing' },
    { label: '已完成', value: collectionTasks.filter((item) => item.collectionStatus === '已完成').length, unit: '单', tone: 'success' },
    { label: '收运垃圾量', value: smallBoxWeight.toFixed(1), unit: 't', tone: 'normal' },
    { label: '已超时', value: collectionTasks.filter((item) => item.overtimeStatus === '已超时').length, unit: '单', tone: 'danger' },
  ]
})

// 快速创建任务弹窗状态
const createVisible = ref(false)
const boxSearchKeyword = ref('')
const selectedBox = ref<(typeof boxes)[number] | null>(null)
const selectedBoxKey = ref<string | undefined>()
const selectedCollectionPoint = ref<string | null>(null)
const createForm = reactive({
  boxName: '',
  taskType: '',
  organization: '河南龙淼钧泽环卫有限公司',
  driver: '张师傅',
  vehicle: '',
  destination: '马投涧中转站',
  sla: 60,
  priority: '普通',
})

// 操作员是否已手动选择过车辆（手动选择后，刷新/换驾驶员不再自动覆盖）
const manualVehicleOverride = ref(false)
// 车辆下拉选项：仅展示当前驾驶员绑定的车辆（通常 0~2 条）
const currentDriverVehicleOptions = computed(() => getDriverVehicles(createForm.driver).map((v) => ({ label: `${v.plateNo} · ${v.vehicleType}`, value: v.plateNo })))
// 驾驶员下拉：仅展示名称
const driverOptionList = computed(() => drivers)
// 当前驾驶员绑定的车辆（提示行用）
const currentDriverBoundVehicle = computed(() => getDriverVehicles(createForm.driver)[0] || null)
// 所属机构下拉：仅当前机构
const organizationOptions = ['河南龙淼钧泽环卫有限公司']
const destinationOptions = computed(() => {
  if (selectedBox.value?.boxType === '大勾臂箱') return destinations.filter((item) => item.type === '焚烧厂').map((item) => item.name)
  return destinations.filter((item) => item.type === '中转站').map((item) => item.name)
})
interface BoxCollectionPointMatch {
  type: string
  name: string
}

type BoxRecord = (typeof boxes)[number] & {
  battery?: number | null
  locationMatches?: BoxCollectionPointMatch[]
}

interface BoxOption {
  key: string
  boxNo: string
  fillRate: number | null
  collectionPoint: string | null
  box: BoxRecord
}

function getBoxCollectionPoints(box: BoxRecord): string[] {
  const matches = box.locationMatches
    ?.filter((m) => m.type === 'collectionPoint')
    .map((m) => m.name)
  if (matches && matches.length) return matches
  if (box.locationType === 'collectionPoint' && box.locationName) return [box.locationName]
  return []
}

function displayBoxNo(box: BoxRecord): string {
  return sanitationAlarms.find((a) => a.boxName === box.name)?.boxNo || box.boxNo
}

const boxOptions = computed<BoxOption[]>(() => {
  const list: BoxOption[] = []
  ;(boxes as BoxRecord[]).forEach((box) => {
    if (box.boxType !== '小勾臂箱' && box.boxType !== '大勾臂箱') return
    const points = getBoxCollectionPoints(box)
    if (points.length === 0) {
      list.push({ key: `${box.id}::none`, boxNo: displayBoxNo(box), fillRate: box.fillRate, collectionPoint: null, box })
    } else {
      points.forEach((point, index) => {
        list.push({ key: `${box.id}::${index}`, boxNo: displayBoxNo(box), fillRate: box.fillRate, collectionPoint: point, box })
      })
    }
  })
  return list.sort((a, b) => (b.fillRate ?? -1) - (a.fillRate ?? -1))
})

const filteredBoxOptions = computed(() => {
  const kw = boxSearchKeyword.value.trim()
  if (!kw) return boxOptions.value
  return boxOptions.value.filter((opt) => `${opt.boxNo}${opt.collectionPoint ?? ''}${opt.box.name}`.includes(kw))
})

const selectedBoxDisplayNo = computed(() => (selectedBox.value ? displayBoxNo(selectedBox.value as BoxRecord) : '-'))

const selectedBoxTownVillage = computed(() => {
  const box = selectedBox.value
  if (!box) return '-'
  const town = extractTownFromBox(box)
  const village = extractVillageFromBox(box as BoxRecord)
  return [town, village].filter((v) => v !== '-').join(' ') || '-'
})

const selectedBoxBattery = computed(() => {
  const battery = (selectedBox.value as BoxRecord | null)?.battery
  return battery != null ? `${battery}%` : '—'
})

/** 选中箱体近 12 小时、且未关联运单的最新一条告警 */
const selectedBoxAlarm = computed(() => {
  const box = selectedBox.value
  if (!box) return null
  const cutoff = Date.now() - 12 * 3600 * 1000
  const candidates = sanitationAlarms
    .filter((a) => a.boxName === box.name && !a.linkedTaskId)
    .map((a) => ({ alarm: a, time: new Date(a.triggerTime.replace(' ', 'T')).getTime() }))
    .filter((x) => Number.isFinite(x.time) && x.time >= cutoff)
    .sort((x, y) => y.time - x.time)
  return candidates[0]?.alarm ?? null
})

function formatAlarmTime(t: string): string {
  return t.length >= 16 ? t.slice(0, 16) : t
}

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

function extractTownFromBox(box: (typeof boxes)[number]): string {
  if (box.currentLocation) {
    const m = box.currentLocation.match(/^([^\d]+?[镇乡村街道])/)
    if (m) return m[1].trim()
  }
  return '-'
}

function extractVillageFromBox(box: BoxRecord): string {
  // 小勾臂箱名称以村庄开头，如“牛家窑2号小勾臂箱”“南坡村1号小勾臂箱”
  const m = String(box.name || '').match(/^([\u4e00-\u9fa5]+?)(?=\d)/)
  return m ? m[1] : '-'
}

function applyBoxToForm(box: BoxRecord) {
  createForm.boxName = box.name
  createForm.taskType = box.boxType === '小勾臂箱' ? '小勾臂箱满溢收运' : '大勾臂箱满溢转运'
  const defaultDriver = drivers.find((d) => (box.boxType === '小勾臂箱' ? d.vehicleType === '小勾臂车' : d.vehicleType === '大勾臂车')) || drivers[0]
  createForm.driver = defaultDriver.name
  manualVehicleOverride.value = false
  const bound = getDriverVehicles(defaultDriver.name)
  createForm.vehicle = bound[0]?.plateNo || ''
  createForm.destination = box.boxType === '小勾臂箱' ? '马投涧中转站' : '龙安生活垃圾焚烧厂'
  createForm.priority = '普通'
  createForm.sla = 60
}

function onBoxOptionChange(key: string | undefined) {
  const opt = boxOptions.value.find((o) => o.key === key)
  if (!opt) {
    selectedBox.value = null
    selectedCollectionPoint.value = null
    return
  }
  selectedBox.value = opt.box
  selectedCollectionPoint.value = opt.collectionPoint
  applyBoxToForm(opt.box)
}

function clearBoxSelection() {
  selectedBoxKey.value = undefined
  selectedBox.value = null
  selectedCollectionPoint.value = null
  boxSearchKeyword.value = ''
}

function openCollectionPointArchive() {
  const href = router.resolve({ path: '/sanitation/collectionPoint' }).href
  window.open(href, '_blank')
}

function refreshBoxData() {
  boxSearchKeyword.value = ''
  ArcoMessage.success('箱体数据已刷新')
}

function rateTone(rate: number): string {
  if (rate >= 90) return 'danger'
  if (rate >= 80) return 'warning'
  return 'normal'
}

function submitTask() {
  if (!selectedBox.value) {
    ArcoMessage.warning('请先选择箱体')
    return
  }
  if (!selectedCollectionPoint.value) {
    ArcoMessage.warning('请先添加收集点')
    return
  }
  const box = selectedBox.value
  const realAlarm = selectedBoxAlarm.value
  const alarmStub: SanitationAlarm = realAlarm ?? {
    id: `STUB-${Date.now()}`,
    type: '满溢告警',
    level: '严重',
    boxType: box.boxType as '小勾臂箱' | '大勾臂箱',
    boxNo: box.boxNo,
    boxName: box.name,
    town: extractTownFromBox(box),
    address: selectedCollectionPoint.value || box.currentLocation || '',
    ruleName: '手动创建',
    triggerTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    readStatus: '已读',
    handleStatus: '不需处理',
    starred: false,
    content: `${box.name} — 手动创建收运任务单。`,
  }
  const chosenVehicle = vehicles.find((v) => v.plateNo === createForm.vehicle)
  const task = createCollectionTaskFromAlarm(alarmStub, createForm.driver, createForm.destination, createForm.vehicle || undefined, chosenVehicle?.vehicleType)
  ArcoMessage.success(`已创建收运任务单 ${task.id}`)
  createVisible.value = false
  clearBoxSelection()
}

const boxAddress = computed(() => {
  const box = boxes.find((b) => b.boxNo === selectedTask.value.boxNo)
  if (!box) return '-'
  return box.currentLocation
})

const eventPoints = computed(() => {
  const t = selectedTask.value
  const events: Array<{ label: string; time: string; done: boolean; address?: string; fenceRadius?: number }> = []

  // 时间统一显示到分钟：YYYY-MM-DD HH:mm
  const taskDate = (t.createTime || '').slice(0, 10)
  const toMinute = (v: string | undefined) => (v && v.length >= 16 ? v.slice(0, 16) : v || '-')
  const trackTime = (p: { time?: string; done?: boolean } | undefined) => {
    if (!p) return '-'
    if (p.time && /^\d{2}:\d{2}$/.test(p.time) && taskDate) return `${taskDate} ${p.time}`
    return p.time || '-'
  }

  // 根据收运状态决定展示到第几个关键事件
  let maxEvents = 2 // 待接单：派单、接单
  if (t.collectionStatus === '已接单') maxEvents = 3
  else if (t.collectionStatus === '收运中') maxEvents = 6
  else if (t.collectionStatus === '已完成') maxEvents = 8

  // ① 派单
  events.push({ label: '派单', time: toMinute(t.createTime), done: true })

  // ② 接单
  events.push({ label: '接单', time: toMinute(t.acceptTime), done: !!t.acceptTime })

  if (maxEvents >= 3) {
    // ③ 到达始发地（收集点名称 + 时间）
    const startPt = t.track.find((p) => p.eventType === 'start')
    events.push({ label: '到达始发地', time: trackTime(startPt), done: startPt?.done || false, address: startPt?.address, fenceRadius: startPt?.fenceRadius })

    // ④ 装车
    const loadPt = t.track.find((p) => p.eventType === 'load')
    events.push({ label: '装车', time: trackTime(loadPt), done: loadPt?.done || false })

    // ⑤ 发车
    events.push({ label: '发车', time: toMinute(t.startTime), done: !!t.startTime })
  }

  if (maxEvents >= 6) {
    // ⑥ 到达目的地（中转站名称 + 时间）
    const destPt = t.track.find((p) => p.eventType === 'arrive')
    events.push({ label: '到达目的地', time: trackTime(destPt), done: destPt?.done || false, address: destPt?.address, fenceRadius: destPt?.fenceRadius })

    // ⑦ 卸车完成
    const unloadPt = t.track.find((p) => p.eventType === 'unload')
    events.push({ label: '卸车完成', time: trackTime(unloadPt), done: unloadPt?.done || false })
  }

  if (maxEvents >= 8) {
    // ⑧ 上传照片
    const proofDone = !!t.proofImages?.length
    events.push({ label: '上传照片', time: proofDone ? toMinute(t.finishTime) : '-', done: proofDone })
  }

  return events
})
const startPointName = computed(() => {
  const startPt = selectedTask.value.track.find((p) => p.eventType === 'start')
  return startPt?.address || selectedTask.value.startAddress
})
function taskTitle(task: CollectionTask): string {
  const suffix = task.taskName.startsWith(task.boxName)
    ? task.taskName.slice(task.boxName.length)
    : task.taskName
  const boxNo = sanitationAlarms.find((item) => item.boxName === task.boxName)?.boxNo || task.boxNo
  return `${boxNo}${suffix}`
}

const filteredTasks = computed(() => {
  let result = collectionTasks
  if (keyword.value) {
    result = result.filter((item) => `${item.taskName}${item.driver}${item.vehicle}${item.boxName}`.includes(keyword.value))
  }
  if (collectionFilter.value !== '全部') result = result.filter((item) => item.collectionStatus === collectionFilter.value)
  if (overtimeFilter.value !== '全部') result = result.filter((item) => item.overtimeStatus === overtimeFilter.value)
  return result
})

watch(
  () => route.query.taskId,
  (taskId) => {
    const task = collectionTasks.find((item) => item.id === taskId)
    if (task) selectedTask.value = task
  },
  { immediate: true },
)

function goCreate() {
  clearBoxSelection()
  createVisible.value = true
}

function reassign() {
  goCreate()
}

function advanceSelected() {
  const task = selectedTask.value
  if (task.collectionStatus === '已完成') {
    ArcoMessage.info('当前任务已完成')
    return
  }
  if (task.collectionStatus === '待接单') {
    acceptCollectionTask(task)
  } else if (task.collectionStatus === '已接单') {
    startCollectionTask(task)
  } else if (task.collectionStatus === '收运中') {
    autoCompleteCollectionTask(task)
  }
  ArcoMessage.success('任务状态已推进')
}

function forceComplete() {
  autoCompleteCollectionTask(selectedTask.value, 'force')
  ArcoMessage.success('已强制完成')
}

</script>

<style scoped lang="scss">
.task-monitor-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.monitor-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 14px;
}

.task-list-panel {
  padding: 12px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.map-panel,
.timeline-panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.toolbar-search {
  width: 100%;
}

.toolbar-filters {
  display: flex;
  gap: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 640px;
  overflow: auto;
}

.task-item {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  background: var(--color-fill-1);
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;

  &.active {
    background: rgba(var(--arcoblue-1), 0.55);
    border-color: rgb(var(--arcoblue-6));
  }
}

.task-item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
}

.status-icon {
  font-size: 14px;

  &.overtime {
    color: rgb(var(--danger-6));
  }

  &.urgent {
    color: rgb(var(--orange-6));
  }

  &.force {
    color: rgb(var(--arcoblue-6));
  }
}

.task-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-3);

  .task-sla {
    color: var(--color-text-2);
  }
}

.create-modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.box-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.box-opt-no {
  font-weight: 600;
  color: var(--color-text-1);
}

.box-opt-rate {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  border-radius: 999px;
  color: #fff;
  background: rgb(var(--arcoblue-6));

  &.warning {
    background: rgb(var(--orange-6));
  }

  &.danger {
    background: rgb(var(--danger-6));
  }
}

.box-opt-point {
  overflow: hidden;
  color: var(--color-text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.box-select-item {
  margin-bottom: 6px;
}

.box-select-row {
  display: flex;
  gap: 8px;
  width: 100%;

  .arco-select {
    flex: 1;
    min-width: 0;
    width: 100%;
  }
}

.box-refresh-btn {
  color: var(--color-text-2);
}

.box-no-point-hint {
  display: flex;
  align-items: center;
  margin-top: 2px;

  .box-no-point-link {
    font-size: 14px;
  }
}

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

.box-alarm-line {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 20px;
  margin-top: 4px;
  padding: 5px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: rgb(var(--danger-6));
  background: rgba(var(--danger-6), 0.06);
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

.overtime-tag {
  margin-left: 4px;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.proof-gallery {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .a-image {
    flex: 1;
    min-width: 120px;
    max-width: 160px;
  }
}

.task-item-box {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-4);
}

.task-route {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22px minmax(0, 1fr);
  gap: 6px;
  align-items: center;
  padding: 8px;
  background: var(--color-bg-2);
  border-radius: 4px;

  span {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    color: var(--color-text-4);
  }

  b {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-text-1);
    font-size: 12px;
    line-height: 1.35;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

.route-arrow {
  color: rgb(var(--arcoblue-6));
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: var(--color-text-3);
  }
}

.route-map {
  position: relative;
  min-height: 280px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  overflow: hidden;
}

.ops-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;

  div {
    padding: 10px 12px;
    background: var(--color-fill-1);
    border-radius: 4px;
  }

  span {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--color-text-3);
  }

  b {
    display: block;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-1);
  }

  em {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    font-style: normal;
    line-height: 1.4;
    color: var(--color-text-4);
  }
}

.panel-title {
  margin-bottom: 14px;
  font-weight: 600;
}

.timeline-title {
  margin-top: 18px;
}

:deep(.arco-timeline-item) {
  min-height: 0;
}

:deep(.arco-timeline-item-content) {
  padding-bottom: 8px;
}

.event-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.event-title {
  font-size: 13px;
  color: var(--color-text-1);
}

.event-time {
  font-size: 12px;
  color: var(--color-text-3);
  white-space: nowrap;
}

.event-addr {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-4);
}

@media (max-width: 1280px) {
  .monitor-layout {
    grid-template-columns: 1fr;
  }

  .ops-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

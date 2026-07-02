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
        <a-button @click="advanceSelected">
          <template #icon><icon-play-arrow /></template>
          模拟推进
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <!-- 产品需求说明 -->
    <div class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🎯 功能要点（开发 / 测试关注）</td></tr>
                  <tr><td class="prd-label">页面</td><td class="prd-value">「收运单监控」和「全部任务单」共用同一组件，根据 URL 路径动态切换标题/副标题</td></tr>
                  <tr><td class="prd-label">业务流</td><td class="prd-value">派单（创建任务单）→ 驾驶员手动接单（必须步骤，不可跳过）→ 系统自动识别进入始发点电子围栏 → 装车（始发地+称重变化判断）→ 发车离开始发地 → 到达目的地电子围栏 → 卸车完成（目的地围栏+称重变化判断）→ 驾驶员补传凭证照片。未接单时即使车辆进入围栏也不会变为收运中，防止路过车辆误触发</td></tr>
                  <tr><td class="prd-label">数据关联</td><td class="prd-value">一个收运单必须有始发点、目的地、时效要求和八个关键事件；小勾臂为收集点→中转站，大勾臂为中转站→焚烧厂</td></tr>
                  <tr><td class="prd-label">快速创建任务</td><td class="prd-value">顶部按钮 → 本页弹出创建弹窗，选箱体后自动填充驾驶员/车辆/目的地，提交后追加到列表</td></tr>
                  <tr><td class="prd-label">创建弹窗</td><td class="prd-value">上半：箱体选择器（AutoComplete，搜索编号/名称）→ 展示位置/类型/乡镇 | 下半：任务配置表单</td></tr>
                  <tr><td class="prd-label">布局</td><td class="prd-value">三栏布局：左侧运单卡片（运营筛选）| 中间地图轨迹（调度判断）| 右侧关键详情（核查与复盘）</td></tr>
                  <tr><td class="prd-label">左侧列表</td><td class="prd-value">卡片第一层展示运单名称、状态、车牌司机、SLA；第二层用箭头明确「始发点 → 目的地」，弱化箱体编号等辅助信息</td></tr>
                  <tr><td class="prd-label">中间面板</td><td class="prd-value">地图按车辆实际轨迹点绘制平滑线路，实线表示已行驶、虚线表示待完成；始发点和目的地电子围栏按业务半径显示</td></tr>
                  <tr><td class="prd-label">右侧面板</td><td class="prd-value">优先展示时效、始发/目的地、八个关键事件时间和围栏规则；箱体编号、告警号、电话等放在辅助信息区</td></tr>
                  <tr><td class="prd-label">称重数据</td><td class="prd-value">装车后称重设备读取垃圾重量（吨），收运中/已完成时在地图面板和右侧详情中展示，模拟推进/强制完成时自动生成随机重量</td></tr>
                  <tr><td class="prd-label">满溢率</td><td class="prd-value">箱体当前满溢百分比（来自满溢传感器），在运单重点区域展示，≥90% 红色高亮标记「满溢」</td></tr>
                  <tr><td class="prd-label">模拟推进</td><td class="prd-value">点击按状态机推进：待接单→（接单）→已接单→（车辆入栏）→收运中→已完成，实时计算耗时、超时和称重，同步点亮对应关键事件步骤。待接单状态时「模拟推进」执行接单操作，已接单状态时才可推进至收运中</td></tr>
                  <tr><td class="prd-label">完成凭证</td><td class="prd-value">已完成任务显示证明图片（SVG 占位图），可预览放大</td></tr>
                  <tr><td class="prd-label">强制完成</td><td class="prd-value">中间面板底部按钮，未完成的任务可强制设为已完成，自动计算耗时/超时/称重，当前步骤标记「已强制完成」</td></tr>
                  <tr><td class="prd-label">转单</td><td class="prd-value">中间面板底部按钮，未完成的任务可转给其他驾驶员，弹窗选目标驾驶员后更新 driver/phone/vehicle，当前步骤标记「已转单至 XXX」</td></tr>
                  <tr><td class="prd-label">状态拆分</td><td class="prd-value">收运状态（待接单/已接单/收运中/已完成）与超时状态（未超时/已超时）独立显示和筛选</td></tr>
                  <tr><td class="prd-label">统计卡</td><td class="prd-value">今日总任务 / 待接单 / 收运中 / 已完成 / 收运垃圾量(小勾臂完成总和) / 已超时，6 个指标卡片</td></tr>
                  <tr><td class="prd-label">历史任务</td><td class="prd-value">过往历史中未完成的任务单（如昨天创建仍未完成的）也会显示在列表中，不限定仅当日数据</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🔑 状态设计</td></tr>
                  <tr><td class="prd-label">收运状态</td><td class="prd-value">待接单 / 已接单 / 收运中 / 已完成，四个值互斥按序流转</td></tr>
                  <tr><td class="prd-label">待接单</td><td class="prd-value">创建任务单后的初始状态</td></tr>
                  <tr><td class="prd-label">已接单</td><td class="prd-value">驾驶员手动接单后变为已接单</td></tr>
                  <tr><td class="prd-label">收运中</td><td class="prd-value">驾驶员手动接单后，车辆进入任务单中的始发点电子围栏后变为收运中；必须手动接单，未接单时即使进入围栏也不会自动开始收运，防止路过车辆误触发状态变更</td></tr>
                  <tr><td class="prd-label">已完成</td><td class="prd-value">卸货完成，根据目的地电子围栏 + 称重变化判断卸货</td></tr>
                  <tr><td class="prd-label">超时状态</td><td class="prd-value">未超时 / 已超时，独立于收运状态显示和筛选</td></tr>
                  <tr><td class="prd-label">未超时</td><td class="prd-value">默认状态，收运时长未超过任务时效要求</td></tr>
                  <tr><td class="prd-label">已超时</td><td class="prd-value">收运过程中，时长已超过任务时效要求，变为已超时</td></tr>
                  <tr><td class="prd-label">关键事件（过程步骤）</td><td class="prd-value">共 8 步：① 派单（任务单创建）→ ② 接单（驾驶员接单，必须步骤不可跳过）→ ③ 到达始发地（进入始发电子围栏）→ ④ 装车（始发地+称重变化判断）→ ⑤ 发车（离开始发地）→ ⑥ 到达目的地（进入目的地电子围栏）→ ⑦ 卸车完成（目的地围栏+称重变化判断）→ ⑧ 上传照片（驾驶员补传凭证）</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 边界 & 验收要点</td></tr>
                  <tr><td class="prd-label">✓ 快速创建</td><td class="prd-value">本页弹窗创建任务，选箱体后自动填充，提交后追加到列表</td></tr>
                  <tr><td class="prd-label">✓ 选中切换</td><td class="prd-value">左侧点击任务 → 中间/右侧联动刷新</td></tr>
                  <tr><td class="prd-label">✓ 箱体位置</td><td class="prd-value">小勾臂箱显示收集点地址，大勾臂箱显示中转站地址</td></tr>
                  <tr><td class="prd-label">✓ 两种状态独立</td><td class="prd-value">收运状态和超时状态各自独立显示标签，可分别筛选</td></tr>
                  <tr><td class="prd-label">✓ 八事件上图</td><td class="prd-value">派单、接单、到达始发地、装车、发车、到达目的地、卸车完成、上传照片八个关键事件必须在地图和右侧时间线上同步显示</td></tr>
                  <tr><td class="prd-label">✓ 围栏半径</td><td class="prd-value">小勾臂始发收集点 500m、目的中转站 500m；大勾臂始发中转站 500m、目的焚烧厂 1000m</td></tr>
                  <tr><td class="prd-label">✓ 模拟推进</td><td class="prd-value">按状态机推进，关键事件步骤同步点亮，最终计算实际耗时</td></tr>
                  <tr><td class="prd-label">✓ 强制完成</td><td class="prd-value">未完成任务可强制完成，自动计算耗时/超时/称重，track 全部点亮</td></tr>
                  <tr><td class="prd-label">✓ 称重显示</td><td class="prd-value">收运中/已完成状态显示称重数据（地图面板 + 右侧详情），完成后统计卡更新垃圾量</td></tr>
                  <tr><td class="prd-label">✓ 转单</td><td class="prd-value">未完成任务可选目标驾驶员转单，driver/phone/vehicle 同步更新，不能选相同驾驶员</td></tr>
                  <tr><td class="prd-label">✓ 超时判定</td><td class="prd-value">实际耗时 > SLA 时 overtimeStatus=已超时，显示红色标记</td></tr>
                  <tr><td class="prd-label">✓ 完成凭证</td><td class="prd-value">已完成任务显示图片证明，可预览</td></tr>
                  <tr><td class="prd-label">✓ 历史任务</td><td class="prd-value">过往未完成的任务单正常显示在列表中，不受日期限制</td></tr>
                  <tr><td class="prd-label">✓ 搜索/筛选</td><td class="prd-value">关键字搜索（任务名/司机/车牌/箱体）+ 收运状态下拉 + 超时状态下拉</td></tr>
                  <tr><td class="prd-label">✓ URL 参数</td><td class="prd-value">?taskId=xxx 自动定位到指定任务</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">当前为 mock 数据，对接后端后需走 API</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

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
              <b>{{ task.taskName }}</b>
              <a-space :size="2">
                <StatusTag :value="task.collectionStatus" />
                <StatusTag :value="task.overtimeStatus" />
              </a-space>
            </div>
            <div class="task-item-meta">
              <span>{{ task.vehicle }}</span>
              <span>{{ task.driver }}</span>
              <span class="task-sla">SLA {{ task.slaMinutes }}min</span>
              <StatusTag :value="task.priority" />
            </div>
            <div class="task-route">
              <div>
                <span>始发</span>
                <b>{{ task.startAddress }}</b>
              </div>
              <div class="route-arrow">→</div>
              <div>
                <span>目的地</span>
                <b>{{ task.destinationName }}</b>
              </div>
            </div>
            <div class="task-item-box">{{ task.boxType }} · {{ task.boxName }}</div>
          </button>
        </div>
      </section>

      <section class="map-panel">
        <div class="map-header">
          <div>
            <h3>{{ selectedTask.taskName }}</h3>
            <p>{{ selectedTask.currentStep }}</p>
          </div>
          <a-space>
            <StatusTag :value="selectedTask.collectionStatus" />
            <StatusTag :value="selectedTask.overtimeStatus" />
            <StatusTag :value="selectedTask.priority" />
          </a-space>
        </div>

        <div class="route-map">
          <TaskTrackMap :track="selectedTask.track" :weight="selectedTask.weight" />
        </div>

        <div class="ops-summary">
          <div>
            <span>始发点</span>
            <b>{{ selectedTask.startAddress }}</b>
            <em>{{ startFenceText }}</em>
          </div>
          <div>
            <span>目的地</span>
            <b>{{ selectedTask.destinationName }}</b>
            <em>{{ destFenceText }}</em>
          </div>
          <div>
            <span>时效</span>
            <b :class="{ overtime: selectedTask.overtimeStatus === '已超时' }">{{ selectedTask.durationText || '待开始' }}</b>
            <em>要求 {{ selectedTask.slaMinutes }} 分钟内</em>
          </div>
          <div>
            <span>驾驶员/车辆</span>
            <b>{{ selectedTask.driver }} / {{ selectedTask.vehicle }}</b>
            <em>{{ selectedTask.vehicleType }}</em>
          </div>
          <div v-if="selectedTask.weight">
            <span>称重</span>
            <b>{{ selectedTask.weight }} t</b>
            <em>{{ selectedTask.boxType === '小勾臂箱' ? '收集点垃圾量' : '转运箱重量' }}</em>
          </div>
        </div>

        <div class="map-actions">
          <a-button
            v-if="selectedTask.collectionStatus !== '已完成'"
            status="danger"
            @click="forceComplete"
          >
            强制完成
          </a-button>
          <a-button
            v-if="selectedTask.collectionStatus !== '已完成'"
            @click="transferVisible = true"
          >
            转单
          </a-button>
        </div>
      </section>

      <aside class="timeline-panel">
        <div class="panel-title">运单重点</div>
        <div class="focus-card">
          <div>
            <span>当前状态</span>
            <b>{{ selectedTask.currentStep }}</b>
          </div>
          <div>
            <span>满溢率</span>
            <b :class="{ overtime: (selectedTask.fillRate ?? 0) >= 90 }">{{ selectedTask.fillRate != null ? selectedTask.fillRate + '%' : '—' }}</b>
          </div>
          <div>
            <span>时效要求</span>
            <b :class="{ overtime: selectedTask.overtimeStatus === '已超时' }">{{ selectedTask.slaMinutes }} 分钟 / {{ selectedTask.durationText || '待开始' }}</b>
          </div>
          <div>
            <span>作业规则</span>
            <b>{{ routeRuleText }}</b>
          </div>
        </div>

        <div class="panel-title timeline-title">关键事件</div>
        <a-timeline>
          <a-timeline-item
            v-for="point in eventPoints"
            :key="point.label"
            :label="point.time"
            :dot-color="point.done ? 'green' : 'gray'"
          >
            <b>{{ point.label }}</b>
            <p>{{ point.address }}</p>
            <p v-if="point.fenceRadius">电子围栏 {{ point.fenceRadius }}m</p>
          </a-timeline-item>
        </a-timeline>

        <div class="panel-title timeline-title">辅助信息</div>
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="任务单号">{{ selectedTask.id }}</a-descriptions-item>
          <a-descriptions-item label="来源告警">{{ selectedTask.alarmId }}</a-descriptions-item>
          <a-descriptions-item label="箱体">{{ selectedTask.boxName }}（{{ selectedTask.boxNo }}）</a-descriptions-item>
          <a-descriptions-item label="箱体位置">{{ boxAddress }}</a-descriptions-item>
          <a-descriptions-item label="所属乡镇">{{ selectedTask.town }}</a-descriptions-item>
          <a-descriptions-item label="司机电话">{{ selectedTask.driverPhone }}</a-descriptions-item>
          <a-descriptions-item label="创建/接单">{{ selectedTask.createTime }} / {{ selectedTask.acceptTime || '待接单' }}</a-descriptions-item>
          <a-descriptions-item label="装车/完成">{{ selectedTask.startTime || '待装车' }} / {{ selectedTask.finishTime || '待完成' }}</a-descriptions-item>
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

    <!-- 转单弹窗 -->
    <a-modal v-model:visible="transferVisible" title="转单" width="400px" @ok="doTransfer">
      <a-form layout="vertical">
        <a-form-item label="当前驾驶员">
          <a-input :model-value="selectedTask.driver" readonly />
        </a-form-item>
        <a-form-item label="目标驾驶员">
          <a-select v-model="transferDriver">
            <a-option v-for="item in driverOptionList" :key="item.name" :value="item.name" :label="`${item.name}（${item.vehicle}）`">
              {{ item.name }}（{{ item.vehicle }}）
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 快速创建任务弹窗 -->
    <a-modal v-model:visible="createVisible" title="创建收运任务单" width="760px" @ok="submitTask">
      <div class="create-modal-body">
        <section class="create-alarm-info">
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import TaskTrackMap from './components/TaskTrackMap.vue'
import {
  acceptCollectionTask,
  autoCompleteCollectionTask,
  collectionTasks,
  createCollectionTaskFromAlarm,
  destinations,
  drivers,
  startCollectionTask,
  type CollectionTask,
  type SanitationAlarm,
} from './data/alert-task'
import { boxes } from './data/mock'

defineOptions({ name: 'SanitationTaskMonitor' })

const router = useRouter()
const route = useRoute()
const keyword = ref('')
const collectionFilter = ref('全部')
const overtimeFilter = ref('全部')
const selectedTask = ref<CollectionTask>(collectionTasks[0])

const isAllTasks = computed(() => route.path.includes('workOrderStats'))
const pageTitle = computed(() => isAllTasks.value ? '全部任务单' : '收运单监控')
const pageSubtitle = computed(() => isAllTasks.value
  ? '查看全部收运任务单（含已完成和未完成），支持快速创建、转单、强制完成和状态跟踪。'
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
const transferVisible = ref(false)
const transferDriver = ref('')
const boxSearchKeyword = ref('')
const selectedBox = ref<(typeof boxes)[number] | null>(null)
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

const driverOptionList = computed(() => drivers)
const destinationOptions = computed(() => {
  if (selectedBox.value?.boxType === '大勾臂箱') return destinations.filter((item) => item.type === '焚烧厂').map((item) => item.name)
  return destinations.filter((item) => item.type === '中转站').map((item) => item.name)
})
const filteredBoxes = computed(() => {
  const kw = boxSearchKeyword.value.trim()
  if (!kw) return boxes.filter((b) => b.boxType === '小勾臂箱' || b.boxType === '大勾臂箱')
  return boxes.filter((b) => b.boxNo.includes(kw) || b.name.includes(kw))
})

function onDriverChange(name: string) {
  const driver = drivers.find((item) => item.name === name)
  if (driver) createForm.vehicle = driver.vehicle
}

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
  if (box) {
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
}

function submitTask() {
  if (!selectedBox.value) {
    ArcoMessage.warning('请先选择箱体')
    return
  }
  const box = selectedBox.value
  const alarmStub: SanitationAlarm = {
    id: `STUB-${Date.now()}`,
    type: '满溢告警',
    level: '严重',
    boxType: box.boxType as '小勾臂箱' | '大勾臂箱',
    boxNo: box.boxNo,
    boxName: box.name,
    town: extractTownFromBox(box),
    address: box.currentLocation || '',
    ruleName: '手动创建',
    triggerTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    readStatus: '已读',
    handleStatus: '不需处理',
    content: `${box.name} — 手动创建收运任务单。`,
  }
  const task = createCollectionTaskFromAlarm(alarmStub, createForm.driver, createForm.destination)
  ArcoMessage.success(`已创建收运任务单 ${task.id}`)
  createVisible.value = false
  selectedBox.value = null
}

const boxAddress = computed(() => {
  const box = boxes.find((b) => b.boxNo === selectedTask.value.boxNo)
  if (!box) return '-'
  return box.currentLocation
})

const eventPoints = computed(() => {
  const t = selectedTask.value
  const events: Array<{ label: string; time: string; done: boolean; address?: string; fenceRadius?: number }> = []

  // 根据收运状态决定展示到第几个关键事件
  let maxEvents = 2 // 待接单：派单、接单
  if (t.collectionStatus === '已接单') maxEvents = 3
  else if (t.collectionStatus === '收运中') maxEvents = 6
  else if (t.collectionStatus === '已完成') maxEvents = 8

  // ① 派单
  const dispatchTime = t.createTime?.slice(11, 16) || '-'
  events.push({ label: '派单', time: dispatchTime, done: true })

  // ② 接单
  const acceptTime = t.acceptTime?.slice(11, 16) || '-'
  events.push({ label: '接单', time: acceptTime, done: !!t.acceptTime })

  if (maxEvents >= 3) {
    // ③ 到达始发地
    const startPt = t.track.find((p) => p.eventType === 'start')
    events.push({ label: '到达始发地', time: startPt?.time || '-', done: startPt?.done || false, address: startPt?.address, fenceRadius: startPt?.fenceRadius })

    // ④ 装车
    const loadPt = t.track.find((p) => p.eventType === 'load')
    events.push({ label: '装车', time: loadPt?.time || '-', done: loadPt?.done || false, address: loadPt?.address })

    // ⑤ 发车
    const departTime = t.startTime?.slice(11, 16) || '-'
    events.push({ label: '发车', time: departTime, done: !!t.startTime })
  }

  if (maxEvents >= 6) {
    // ⑥ 到达目的地
    const destPt = t.track.find((p) => p.eventType === 'arrive')
    events.push({ label: '到达目的地', time: destPt?.time || '-', done: destPt?.done || false, address: destPt?.address, fenceRadius: destPt?.fenceRadius })

    // ⑦ 卸车完成
    const unloadPt = t.track.find((p) => p.eventType === 'unload')
    events.push({ label: '卸车完成', time: unloadPt?.time || '-', done: unloadPt?.done || false, address: unloadPt?.address })
  }

  if (maxEvents >= 8) {
    // ⑧ 上传照片
    const proofDone = !!t.proofImages?.length
    events.push({ label: '上传照片', time: proofDone ? '已上传' : '-', done: proofDone })
  }

  return events
})
const startEvent = computed(() => selectedTask.value.track.find((point) => point.eventType === 'start'))
const destEvent = computed(() => selectedTask.value.track.find((point) => point.eventType === 'arrive'))
const startFenceText = computed(() => `${selectedTask.value.boxType === '小勾臂箱' ? '收集点' : '中转站'}围栏 ${startEvent.value?.fenceRadius || 500}m`)
const destFenceText = computed(() => `${selectedTask.value.destinationType}围栏 ${destEvent.value?.fenceRadius || 500}m`)
const routeRuleText = computed(() => {
  if (selectedTask.value.boxType === '小勾臂箱') return '收集点 500m 内装车，中转站 500m 内卸车'
  return '中转站 500m 内装车，焚烧厂 1000m 内卸车'
})

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
  selectedBox.value = null
  boxSearchKeyword.value = ''
  createVisible.value = true
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

function doTransfer() {
  if (!transferDriver.value || transferDriver.value === selectedTask.value.driver) {
    ArcoMessage.warning('请选择不同的目标驾驶员')
    return
  }
  const task = selectedTask.value
  const driver = drivers.find((d) => d.name === transferDriver.value)
  if (!driver) return
  task.driver = driver.name
  task.driverPhone = driver.phone
  task.vehicle = driver.vehicle
  task.vehicleType = driver.vehicleType
  task.currentStep = `已转单至 ${driver.name}`
  transferVisible.value = false
  transferDriver.value = ''
  ArcoMessage.success(`已转单至 ${driver.name}`)
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
  grid-template-columns: 280px minmax(0, 1fr) 360px;
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

.task-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--color-text-3);

  .task-sla {
    color: var(--color-text-2);
  }
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

.prd-section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
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

.overtime {
  color: rgb(var(--danger-6));
}

.overtime-tag {
  margin-left: 4px;
}

.map-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
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
  min-height: 280px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  overflow: hidden;
}

.ops-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;

  div {
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 4px;
  }

  span {
    display: block;
    margin-bottom: 8px;
    color: var(--color-text-3);
    font-size: 12px;
  }

  b {
    display: block;
    line-height: 1.5;
  }

  em {
    display: block;
    margin-top: 6px;
    color: var(--color-text-4);
    font-size: 12px;
    font-style: normal;
    line-height: 1.4;
  }
}

.panel-title {
  margin-bottom: 14px;
  font-weight: 600;
}

.focus-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 4px;

  span {
    display: block;
    margin-bottom: 5px;
    color: var(--color-text-3);
    font-size: 12px;
  }

  b {
    line-height: 1.5;
  }
}

.timeline-title {
  margin-top: 18px;
}

:deep(.arco-timeline-item-content) {
  p {
    margin: 6px 0 0;
    color: var(--color-text-3);
    font-size: 12px;
  }
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

<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="调度员端"
      subtitle="告警派单 | 运单监控。满溢告警一键派单、强制完成、转单操作。"
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
                  <tr><td class="prd-label">页面</td><td class="prd-value">调度员端，双手机框并排布局：左侧「告警派单」+ 右侧「运单监控」，覆盖调度员核心工作流</td></tr>
                  <tr><td class="prd-label">目标用户</td><td class="prd-value">调度员，负责接收告警、派发任务、监控运单执行状态、处理异常（强制完成/转单）</td></tr>
                  <tr><td class="prd-label">业务流</td><td class="prd-value">告警接收 → 告警处理 → 满溢告警派单（底部弹出层配置任务） → 运单监控跟踪执行 → 异常时强制完成或转单</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">📱 左侧：告警派单</td></tr>
                  <tr><td class="prd-label">头部汇总</td><td class="prd-value">4 列统计卡：今日告警（红）/ 未读（红）/ 待处理（橙）/ 已处理（绿），每项可点击筛选</td></tr>
                  <tr><td class="prd-label">告警列表</td><td class="prd-value">卡片展示告警标题、类型标签、处理状态标签、内容摘要、来源和时间。「不需处理」状态不显示标签</td></tr>
                  <tr><td class="prd-label">处理状态</td><td class="prd-value">三种：不需处理 / 待处理 / 已处理。「不需处理」时额外显示「标待处理」入口；可标记为待处理或已处理</td></tr>
                  <tr><td class="prd-label">展开详情</td><td class="prd-value">点击卡片本条下拉展开详情（告警编号、等级、来源、阅读状态、处理状态、关联任务），不跳新页；再次点击收起</td></tr>
                  <tr><td class="prd-label">派单入口</td><td class="prd-value">仅「满溢告警」且尚未关联任务时显示「派单」按钮</td></tr>
                  <tr><td class="prd-label">派单流程</td><td class="prd-value">点击派单 → 底部弹出层（遮罩+圆角面板从下往上滑入）。上半展示告警消息详情（只读），下半任务配置表单：驾驶员 Select、目的地 Select、时效 Select（30/60/90/120min）、优先级 Select（紧急/普通）→ 点击「创建任务单」提交，自动生成 linkedTaskId 并标记已处理</td></tr>
                  <tr><td class="prd-label">查看任务</td><td class="prd-value">已关联任务时显示「查看任务」按钮，点击提示跳转至具体收运任务单信息</td></tr>
                  <tr><td class="prd-label">数据来源</td><td class="prd-value">告警列表来自 app-mock.ts 的 alertList，含满溢告警、低电量告警、设备离线等类型</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">📋 右侧：运单监控</td></tr>
                  <tr><td class="prd-label">双 Tab</td><td class="prd-value">顶部切换「运单监控」（今日未完成任务）和「全部运单」（全量查询）</td></tr>
                  <tr><td class="prd-label">运单监控 Tab</td><td class="prd-value">3 列统计卡（进行中 / 已完成 / 超时）；卡片列表展示未完成任务，含任务名称、状态、司机/车辆、优先级、始发→目的地路线、步骤进度圆点、截止时间和超时标记；每张卡片可快捷「强制完成」或「转单」</td></tr>
                  <tr><td class="prd-label">全部运单 Tab</td><td class="prd-value">搜索框 + 状态下拉（全部/待接单/已接单/收运中/已完成）+ 超时下拉（全部/未超时/已超时）+ 自定义日期范围（起始日期 → 至 → 结束日期）+ 卡片列表；列表展示任务名称、状态、司机/车辆、创建时间、路线、截止时间和称重</td></tr>
                  <tr><td class="prd-label">运单详情</td><td class="prd-value">点击列表条目 → 全屏浮层，监控视角展示：优先级+任务名称、收运点→目的地路线、地图轨迹（起/终视觉化）、四指标（SLA/称重/箱体/司机）、任务进度时间线、单据信息（任务单号/类型/创建/截止/超时状态）；未完成任务底部显示「强制完成」+「转单」按钮</td></tr>
                  <tr><td class="prd-label">强制完成</td><td class="prd-value">列表或详情中点击「强制完成」 → 运单状态变为已完成，所有步骤点亮，提示成功</td></tr>
                  <tr><td class="prd-label">转单</td><td class="prd-value">点击「转单」→ 底部弹出层：显示当前司机和车辆，下拉选择目标司机（自动排除当前司机），点击「确认转单」完成，driver 字段更新</td></tr>
                  <tr><td class="prd-label">数据来源</td><td class="prd-value">运单列表来自 app-mock.ts 的 waybillList，状态仅包含待接单/已接单/收运中/已完成（无待派发）</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 边界 & 验收要点</td></tr>
                  <tr><td class="prd-label">✓ 告警统计筛选</td><td class="prd-value">点击统计卡切换筛选，计数准确；今日告警=总数，未读/待处理/已处理各自准确</td></tr>
                  <tr><td class="prd-label">✓ 不需处理</td><td class="prd-value">状态标签隐藏，但仍可标记为待处理或已处理</td></tr>
                  <tr><td class="prd-label">✓ 展开/收起</td><td class="prd-value">点击卡片展开详情，再次点击收起；展开时标记已读</td></tr>
                  <tr><td class="prd-label">✓ 派单弹层</td><td class="prd-value">底部弹出层 slideUp 动画；遮罩点击关闭；表单字段完整；提交后 linkedTaskId 生成，状态变已处理</td></tr>
                  <tr><td class="prd-label">✓ 双 Tab 切换</td><td class="prd-value">运单监控/全部运单切换流畅，列表独立过滤</td></tr>
                  <tr><td class="prd-label">✓ 全部运单筛选</td><td class="prd-value">搜索 + 状态 + 超时 + 日期范围，联合过滤正确</td></tr>
                  <tr><td class="prd-label">✓ 运单详情</td><td class="prd-value">全屏浮层展示完整信息；地图轨迹可视化；未完成显示操作按钮</td></tr>
                  <tr><td class="prd-label">✓ 强制完成</td><td class="prd-value">状态变为已完成，所有步骤 done=true，超时标记不可操作</td></tr>
                  <tr><td class="prd-label">✓ 转单</td><td class="prd-value">底部弹层选择目标司机（不能是当前司机），确认后 driver 和提示正确更新</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">当前为 mock 数据；后续对接后端时告警状态、运单状态、派单创建、转单和强制完成需走 API 同步</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="phones-wrapper">
      <!-- 手机框 1：告警派单 -->
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>10:18</span>
          <span>🔋 87%</span>
        </div>
        <div class="phone-body">
          <!-- 派单底部弹出层 -->
          <div v-if="dispatchAlarm" class="dispatch-backdrop" @click="closeDispatch">
            <div class="dispatch-sheet" @click.stop>
              <div class="dispatch-sheet-handle"></div>
              <div class="dispatch-sheet-header">
                <b>创建收运任务单</b>
                <span class="dispatch-close" @click="closeDispatch">✕</span>
              </div>
              <div class="dispatch-sheet-body">
                <div class="dispatch-section">
                  <div class="ds-label">告警消息</div>
                  <div class="ds-alarm-info">
                    <b>{{ dispatchAlarm.title }}</b>
                    <p>{{ dispatchAlarm.content }}</p>
                    <div class="ds-alarm-meta">
                      <span>来源：{{ dispatchAlarm.source }}</span>
                      <span>时间：{{ dispatchAlarm.time }}</span>
                    </div>
                  </div>
                </div>
                <div class="dispatch-section">
                  <div class="ds-label">任务配置</div>
                  <div class="ds-form">
                    <div class="ds-field">
                      <label>驾驶员</label>
                      <select v-model="createForm.driver">
                        <option v-for="d in driverList" :key="d" :value="d">{{ d }}</option>
                      </select>
                    </div>
                    <div class="ds-field">
                      <label>目的地</label>
                      <select v-model="createForm.destination">
                        <option v-for="d in destList" :key="d" :value="d">{{ d }}</option>
                      </select>
                    </div>
                    <div class="ds-field">
                      <label>时效</label>
                      <select v-model="createForm.deadline">
                        <option value="30">30分钟</option>
                        <option value="60">60分钟</option>
                        <option value="90">90分钟</option>
                        <option value="120">120分钟</option>
                      </select>
                    </div>
                    <div class="ds-field">
                      <label>优先级</label>
                      <select v-model="createForm.priority">
                        <option value="紧急">紧急</option>
                        <option value="普通">普通</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div class="dispatch-sheet-footer">
                <a-button type="primary" long size="large" @click="submitDispatch">创建任务单</a-button>
              </div>
            </div>
          </div>

          <div class="phone-content">
            <div class="top-bar">
              <span class="top-title">告警派单</span>
              <span class="top-user">王调度</span>
            </div>
            <div class="alert-stats">
              <div class="astat" @click="alertTabFilter = 'all'">
                <span class="as-val" style="color:#f53f3f">{{ alertList.length }}</span>
                <span class="as-label">今日告警</span>
              </div>
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
              <div class="alert-card" v-for="a in filteredAlerts" :key="a.id" @click="toggleExpand(a)">
                <div class="ac-header">
                  <b>{{ a.title }}</b>
                  <a-space size="mini">
                    <span class="ac-tag" :class="'lvl-' + a.level">{{ a.type }}</span>
                    <span v-if="a.handleStatus !== '不需处理'" class="ac-tag" :class="{ 'tag-pending': a.handleStatus === '待处理', 'tag-done': a.handleStatus === '已处理' }">{{ a.handleStatus }}</span>
                  </a-space>
                </div>
                <p class="ac-content">{{ a.content }}</p>
                <div class="ac-meta">
                  <span>{{ a.source }}</span>
                  <span>{{ a.time }}</span>
                </div>

                <!-- 展开详情 -->
                <div v-if="expandedAlertId === a.id" class="ac-expand" @click.stop>
                  <div class="ace-row"><span>告警编号</span><b>{{ a.id }}</b></div>
                  <div class="ace-row"><span>告警等级</span><b :class="'lvl-' + a.level">{{ a.level }}</b></div>
                  <div class="ace-row"><span>来源</span><b>{{ a.source }}</b></div>
                  <div class="ace-row"><span>阅读状态</span><b>{{ a.readStatus }}</b></div>
                  <div class="ace-row"><span>处理状态</span><b>{{ a.handleStatus }}</b></div>
                  <div class="ace-row" v-if="a.linkedTaskId"><span>关联任务</span><b>{{ a.linkedTaskId }}</b></div>
                </div>

                <div class="ac-actions" @click.stop>
                  <a-button v-if="a.handleStatus === '不需处理'" size="mini" @click="markPending(a)">标待处理</a-button>
                  <a-button v-if="a.handleStatus !== '已处理'" size="mini" @click="markPending(a)">待处理</a-button>
                  <a-button v-if="a.handleStatus !== '已处理'" size="mini" status="success" @click="markProcessed(a)">已处理</a-button>
                  <a-button v-if="a.type === '满溢告警' && !a.linkedTaskId" size="mini" type="primary" @click="openDispatch(a)">派单</a-button>
                  <a-button v-if="a.linkedTaskId" size="mini" type="text" @click="viewTask(a)">查看任务</a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 手机框 2：运单监控 -->
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>10:18</span>
          <span>🔋 87%</span>
        </div>
        <div class="phone-body">
          <!-- 运单详情浮层（监控视角） -->
          <div v-if="detailWaybill" class="detail-overlay">
            <div class="detail-header">
              <span class="back-btn" @click="detailWaybill = null">返回</span>
              <span class="detail-id">{{ detailWaybill.id }}</span>
              <a-space size="mini">
                <span class="dt-tag" :class="'dt-' + detailWaybill.status">{{ detailWaybill.status }}</span>
                <span v-if="detailWaybill.overtimeStatus === '已超时'" class="dt-tag dt-overtime-tag">超时</span>
              </a-space>
            </div>
            <div class="detail-body">
              <div class="dt-hero" :class="{ danger: detailWaybill.overtimeStatus === '已超时' }">
                <span class="dt-pri" :class="'pri-' + detailWaybill.priority">{{ detailWaybill.priority }}</span>
                <h3>{{ detailWaybill.taskName }}</h3>
              </div>
              <div class="dt-route-card">
                <div class="route-point"><span class="route-dot start"></span><div><span>收运点</span><b>{{ detailWaybill.startAddress }}</b></div></div>
                <div class="route-line"></div>
                <div class="route-point"><span class="route-dot end"></span><div><span>目的地</span><b>{{ detailWaybill.destination }}</b></div></div>
              </div>
              <div class="dt-map-card">
                <div class="dt-section-head"><span>地图轨迹</span></div>
                <div class="map-area">
                  <div class="map-route-visual">
                    <div class="map-pin start">起</div>
                    <div class="map-track-line"></div>
                    <div class="map-pin end">终</div>
                  </div>
                  <div class="map-labels">
                    <span>{{ detailWaybill.startAddress }}</span>
                    <icon-right class="wb-arrow" />
                    <span>{{ detailWaybill.destination }}</span>
                  </div>
                  <div class="map-footer">
                    <span>{{ detailWaybill.vehicle }}</span>
                    <span>{{ detailWaybill.driver }}</span>
                  </div>
                </div>
              </div>
              <div class="dt-metric-grid">
                <div class="dm-item"><span>SLA</span><b>{{ detailWaybill.slaMinutes }}min</b><em>{{ detailWaybill.deadline }}</em></div>
                <div class="dm-item"><span>称重</span><b>{{ detailWaybill.weight != null ? detailWaybill.weight + 't' : '待采集' }}</b><em>卸车后确认</em></div>
                <div class="dm-item"><span>箱体</span><b>{{ detailWaybill.boxNo }}</b><em>{{ detailWaybill.vehicle }}</em></div>
                <div class="dm-item"><span>司机</span><b>{{ detailWaybill.driver }}</b><em>{{ detailWaybill.driverPhone }}</em></div>
              </div>
              <div class="dt-section-head"><span>任务进度</span></div>
              <div class="dt-events">
                <div v-for="step in detailWaybill.steps" :key="step.label" class="event-row" :class="{ done: step.done }">
                  <span class="event-dot"></span><div><b>{{ step.label }}</b><span>{{ step.time || '待完成' }}</span></div>
                </div>
              </div>
              <div class="dt-section-head"><span>单据信息</span></div>
              <a-descriptions :column="1" size="small" bordered>
                <a-descriptions-item label="任务单号">{{ detailWaybill.id }}</a-descriptions-item>
                <a-descriptions-item label="任务类型">{{ detailWaybill.taskType }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ detailWaybill.createTime }}</a-descriptions-item>
                <a-descriptions-item label="截止时间">{{ detailWaybill.deadline }}</a-descriptions-item>
                <a-descriptions-item label="超时状态">{{ detailWaybill.overtimeStatus }}</a-descriptions-item>
              </a-descriptions>
            </div>
            <div class="dt-actions" v-if="['待接单','已接单','收运中'].includes(detailWaybill.status)">
              <a-button status="danger" long @click="forceFinishWb(detailWaybill)">强制完成</a-button>
              <a-button long @click="openTransfer(detailWaybill)">转单</a-button>
            </div>
          </div>

          <!-- 转单弹层 -->
          <div v-if="transferTarget" class="transfer-backdrop" @click="closeTransfer">
            <div class="transfer-sheet" @click.stop>
              <div class="transfer-sheet-handle"></div>
              <div class="transfer-sheet-header">
                <b>转单</b>
                <span class="transfer-close" @click="closeTransfer">✕</span>
              </div>
              <div class="transfer-sheet-body">
                <div class="ts-field"><label>当前司机</label><b>{{ transferTarget.driver }}</b></div>
                <div class="ts-field"><label>当前车辆</label><b>{{ transferTarget.vehicle }}</b></div>
                <div class="ts-field">
                  <label>转给</label>
                  <select v-model="transferToDriver">
                    <option v-for="d in transferDriverList" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
              </div>
              <div class="transfer-sheet-footer">
                <a-button type="primary" long size="large" @click="doTransfer">确认转单</a-button>
              </div>
            </div>
          </div>

          <div class="phone-content">
            <div class="top-bar">
              <span class="top-title">运单监控</span>
              <div class="top-actions">
                <span class="filter-btn" :class="{ active: wbTab === 'monitor' }" @click="wbTab = 'monitor'">运单监控</span>
                <span class="filter-btn" :class="{ active: wbTab === 'all' }" @click="wbTab = 'all'">全部运单</span>
              </div>
            </div>

            <!-- Tab: 运单监控（今日/未完成） -->
            <template v-if="wbTab === 'monitor'">
              <div class="wb-stats">
                <div class="wb-stat" v-for="ws in monitorStats" :key="ws.label">
                  <span class="ws-val" :style="{ color: ws.color }">{{ ws.value }}</span>
                  <span class="ws-label">{{ ws.label }}</span>
                </div>
              </div>
              <div class="wb-list">
                <div class="wb-card" v-for="wb in monitorWaybills" :key="wb.id" @click="detailWaybill = wb">
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
                  <div class="wb-actions" @click.stop>
                    <a-button v-if="['待接单','已接单','收运中'].includes(wb.status)" size="mini" status="danger" @click="forceFinishWb(wb)">强制完成</a-button>
                    <a-button v-if="['待接单','已接单','收运中'].includes(wb.status)" size="mini" @click="openTransfer(wb)">转单</a-button>
                    <a-button v-if="wb.weight" size="mini" type="text">称重: {{ wb.weight }}t</a-button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Tab: 全部运单 -->
            <template v-if="wbTab === 'all'">
              <div class="all-search">
                <input v-model="wbKeyword" class="all-search-input" placeholder="搜索任务/驾驶员/车牌" />
              </div>
              <div class="all-selects">
                <select v-model="wbStatusFilter" class="all-sel">
                  <option v-for="f in wbStatusFilters" :key="f" :value="f">{{ f === '全部' ? '状态:全部' : f }}</option>
                </select>
                <select v-model="wbOvertimeFilter" class="all-sel">
                  <option v-for="f in overtimeFilters" :key="f" :value="f">{{ f === '全部' ? '超时:全部' : f }}</option>
                </select>
              </div>
              <div class="all-date-row">
                <input type="date" v-model="wbDateFrom" class="all-date" />
                <span class="all-date-sep">至</span>
                <input type="date" v-model="wbDateTo" class="all-date" />
              </div>
              <div class="wb-list">
                <div v-if="filteredAllWaybills.length === 0" class="empty-state"><span>📋</span><span>暂无运单</span></div>
                <div class="wb-card" v-for="wb in filteredAllWaybills" :key="wb.id" @click="detailWaybill = wb">
                  <div class="wb-header">
                    <b>{{ wb.taskName }}</b>
                    <span class="wb-status" :class="'wb-' + wb.status">{{ wb.status }}</span>
                  </div>
                  <div class="wb-info"><span>{{ wb.driver }} · {{ wb.vehicle }}</span><span>{{ wb.createTime }}</span></div>
                  <div class="wb-route">
                    <span>{{ wb.startAddress }}</span>
                    <icon-right class="wb-arrow" />
                    <span>{{ wb.destination }}</span>
                  </div>
                  <div class="wb-meta-row">
                    <span>截止: {{ wb.deadline }}</span>
                    <span v-if="wb.overtimeStatus === '已超时'" class="overtime-tag">超时</span>
                    <span v-if="wb.weight">称重: {{ wb.weight }}t</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import {
  alertList,
  waybillList,
  type AlertItem,
  type WaybillItem,
} from './data/app-mock'

defineOptions({ name: 'SanitationAppDispatcher' })

// ===== 告警派单 =====
const alertTabFilter = ref<'all' | 'unread' | 'pending' | 'processed'>('all')
const expandedAlertId = ref<string | null>(null)
const dispatchAlarm = ref<AlertItem | null>(null)

const createForm = reactive({
  driver: '张师傅',
  destination: '龙泉镇中转站',
  deadline: '60',
  priority: '紧急' as '紧急' | '普通',
})

const driverList = ['张师傅', '李师傅', '孙师傅', '王师傅']
const destList = ['龙泉镇中转站', '马投涧中转站', '城北焚烧厂', '城南焚烧厂']

const unreadCount = computed(() => alertList.filter(a => a.readStatus === '未读').length)
const pendingCount = computed(() => alertList.filter(a => a.handleStatus === '待处理').length)
const processedCount = computed(() => alertList.filter(a => a.handleStatus === '已处理').length)

const filteredAlerts = computed(() => {
  if (alertTabFilter.value === 'unread') return alertList.filter(a => a.readStatus === '未读')
  if (alertTabFilter.value === 'pending') return alertList.filter(a => a.handleStatus === '待处理')
  if (alertTabFilter.value === 'processed') return alertList.filter(a => a.handleStatus === '已处理')
  return alertList
})

function toggleExpand(a: AlertItem) {
  a.readStatus = '已读'
  expandedAlertId.value = expandedAlertId.value === a.id ? null : a.id
}
function markPending(a: AlertItem) { a.readStatus = '已读'; a.handleStatus = '待处理'; ArcoMessage.success('已标记待处理') }
function markProcessed(a: AlertItem) { a.readStatus = '已读'; a.handleStatus = '已处理'; ArcoMessage.success('已标记已处理') }
function openDispatch(a: AlertItem) { dispatchAlarm.value = a }
function closeDispatch() { dispatchAlarm.value = null }
function submitDispatch() {
  const a = dispatchAlarm.value!
  a.linkedTaskId = 'WB_DISP_' + Date.now()
  a.handleStatus = '已处理'
  a.readStatus = '已读'
  ArcoMessage.success(`已派单：${a.title} → ${createForm.driver}，目的地：${createForm.destination}`)
  closeDispatch()
}
function viewTask(a: AlertItem) {
  ArcoMessage.info(`跳转至收运任务单「${a.linkedTaskId}」— ${a.title}，驾驶员：${createForm.driver}，目的地：${createForm.destination}`)
}

// ===== 运单监控 =====
const wbTab = ref<'monitor' | 'all'>('monitor')
const wbKeyword = ref('')
const wbStatusFilter = ref('全部')
const wbStatusFilters = ['全部', '待接单', '已接单', '收运中', '已完成']
const wbOvertimeFilter = ref('全部')
const overtimeFilters = ['全部', '未超时', '已超时']
const wbDateFrom = ref('')
const wbDateTo = ref('')
const detailWaybill = ref<WaybillItem | null>(null)
const transferTarget = ref<WaybillItem | null>(null)
const transferToDriver = ref('')
const transferDriverList = ['李师傅', '孙师傅', '王师傅', '赵师傅']

const monitorWaybills = computed(() =>
  waybillList.filter(w => ['待接单', '已接单', '收运中'].includes(w.status))
)

const monitorStats = computed(() => [
  { label: '进行中', value: waybillList.filter(w => ['待接单','已接单','收运中'].includes(w.status)).length, color: '#165DFF' },
  { label: '已完成', value: waybillList.filter(w => w.status === '已完成').length, color: '#00B42A' },
  { label: '超时', value: waybillList.filter(w => w.overtimeStatus === '已超时').length, color: '#F53F3F' },
])

const filteredAllWaybills = computed(() => {
  let list = waybillList
  if (wbKeyword.value) {
    const kw = wbKeyword.value.toLowerCase()
    list = list.filter(w => w.taskName.includes(kw) || w.driver.includes(kw) || w.vehicle.includes(kw))
  }
  if (wbStatusFilter.value !== '全部') {
    list = list.filter(w => w.status === wbStatusFilter.value)
  }
  if (wbOvertimeFilter.value !== '全部') {
    list = list.filter(w => w.overtimeStatus === wbOvertimeFilter.value)
  }
  return list
})

function forceFinishWb(wb: WaybillItem) {
  wb.status = '已完成'
  wb.steps.forEach(s => { s.done = true; if (!s.time) s.time = '--' })
  ArcoMessage.success(`已强制完成：${wb.taskName}`)
}
function openTransfer(wb: WaybillItem) {
  transferTarget.value = wb
  transferToDriver.value = transferDriverList.find(d => d !== wb.driver) || transferDriverList[0]
}
function closeTransfer() { transferTarget.value = null }
function doTransfer() {
  const wb = transferTarget.value!
  const oldDriver = wb.driver
  wb.driver = transferToDriver.value
  ArcoMessage.success(`已转单：${wb.taskName}，${oldDriver} → ${transferToDriver.value}`)
  closeTransfer()
}
</script>

<style scoped lang="scss">
.sanitation-page { display: flex; flex-direction: column; gap: 14px; }
/* 产品需求说明 */
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;
  margin-bottom: 8px;
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
.phones-wrapper { display: flex; justify-content: center; gap: 24px; padding: 12px 0; flex-wrap: wrap; }
.phone-frame { width: 390px; min-height: 780px; background: #f0f2f5; border: 3px solid #1f2937; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.16); display: flex; flex-direction: column; position: relative; }
.phone-status-bar { display: flex; justify-content: space-between; padding: 10px 20px 4px; background: #fff; font-size: 12px; color: #1d2129; font-weight: 600; }
.phone-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative; }
.phone-content { flex: 1; overflow-y: auto; padding: 0 14px 12px; background: #f0f2f5; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
.top-title { font-size: 18px; font-weight: 700; color: #1d2129; }
.top-user { font-size: 13px; color: rgb(var(--arcoblue-6)); font-weight: 600; }
.top-actions { display: flex; gap: 6px; }
.filter-btn { padding: 3px 10px; font-size: 12px; color: #86909c; background: #fff; border-radius: 12px; cursor: pointer; &.active { background: rgb(var(--arcoblue-6)); color: #fff; } }
.alert-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px; }
.astat { display: flex; flex-direction: column; align-items: center; padding: 12px 8px; background: #fff; border-radius: 10px; cursor: pointer; &:active { transform: scale(.97); } }
.as-val { font-size: 24px; font-weight: 700; } .as-label { font-size: 11px; color: #86909c; margin-top: 2px; }
.danger { color: #f53f3f; } .warning { color: #ff7d00; } .success { color: #00b42a; }
.section-label { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 8px; }
.alert-list { display: flex; flex-direction: column; gap: 8px; }
.alert-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.ac-header { display: flex; justify-content: space-between; align-items: center; b { font-size: 14px; color: #1d2129; } }
.ac-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.lvl-严重 { background: #fff0f0; color: #f53f3f; } .lvl-重要 { background: #fff7e8; color: #ff7d00; } .lvl-一般 { background: #f2f3f5; color: #86909c; }
.tag-pending { background: #fff7e8; color: #ff7d00; } .tag-done { background: #e8ffea; color: #00b42a; }
.ac-content { font-size: 12px; color: #4e5969; margin: 6px 0; }
.ac-meta { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; margin-bottom: 6px; }
.ac-expand { margin-top: 8px; padding: 10px; background: #f7f8fa; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; }
.ace-row { display: flex; justify-content: space-between; font-size: 12px; span { color: #86909c; } b { color: #1d2129; } .lvl-严重 { color: #f53f3f; } .lvl-重要 { color: #ff7d00; } .lvl-一般 { color: #86909c; } }
.ac-actions { display: flex; gap: 6px; flex-wrap: wrap; }
/* 底部弹出层 */
.dispatch-backdrop, .transfer-backdrop { position: absolute; inset: 0; z-index: 20; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; }
.dispatch-sheet, .transfer-sheet { width: 100%; max-height: 75%; background: #fff; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; animation: slideUp .25s ease; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.dispatch-sheet-handle, .transfer-sheet-handle { width: 36px; height: 4px; background: #d9d9d9; border-radius: 2px; margin: 10px auto 6px; }
.dispatch-sheet-header, .transfer-sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 16px 10px; b { font-size: 16px; color: #1d2129; } }
.dispatch-close, .transfer-close { font-size: 18px; color: #86909c; cursor: pointer; padding: 4px; }
.dispatch-sheet-body, .transfer-sheet-body { overflow-y: auto; padding: 0 16px 12px; display: flex; flex-direction: column; gap: 14px; }
.dispatch-sheet-footer, .transfer-sheet-footer { padding: 10px 16px 20px; border-top: 1px solid #f2f3f5; flex-shrink: 0; }
.ds-label { font-size: 13px; font-weight: 600; color: #1d2129; }
.ds-alarm-info { background: #f7f8fa; border-radius: 8px; padding: 10px; b { font-size: 13px; color: #1d2129; } p { font-size: 12px; color: #4e5969; margin: 4px 0; } }
.ds-alarm-meta { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; }
.ds-form { display: flex; flex-direction: column; gap: 8px; }
.ds-field { display: flex; align-items: center; justify-content: space-between; background: #f7f8fa; border-radius: 8px; padding: 10px 12px; label { font-size: 13px; color: #1d2129; font-weight: 500; } select { font-size: 13px; color: #4e5969; border: 1px solid #e5e6eb; border-radius: 4px; padding: 4px 8px; background: #fff; } }
.dispatch-section { display: flex; flex-direction: column; gap: 8px; }
/* 转单 */
.ts-field { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f7f8fa; border-radius: 8px; label { font-size: 13px; color: #86909c; } b { font-size: 13px; color: #1d2129; } select { font-size: 13px; border: 1px solid #e5e6eb; border-radius: 4px; padding: 4px 8px; } }
/* 运单 */
.wb-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
.wb-stat { display: flex; flex-direction: column; align-items: center; padding: 8px; background: #fff; border-radius: 8px; }
.ws-val { font-size: 16px; font-weight: 700; } .ws-label { font-size: 10px; color: #86909c; }
.wb-list { display: flex; flex-direction: column; gap: 8px; }
.wb-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.wb-header { display: flex; justify-content: space-between; align-items: center; b { font-size: 13px; } }
.wb-status { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.wb-待接单 { background: #fff7e8; color: #ff7d00; }
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
.wb-meta-row { display: flex; justify-content: space-between; font-size: 10px; color: #c9cdd4; margin-bottom: 6px; gap: 6px; }
.overtime-tag { color: #f53f3f; font-weight: 600; }
.wb-actions { display: flex; gap: 6px; flex-wrap: wrap; }
/* 全部运单 */
.all-search { margin-bottom: 8px; }
.all-search-input { width: 100%; padding: 8px 12px; border: 1px solid #e5e6eb; border-radius: 8px; font-size: 13px; background: #fff; outline: none; box-sizing: border-box; }
.all-selects { display: flex; gap: 6px; margin-bottom: 6px; }
.all-sel { flex: 1; padding: 6px 8px; font-size: 12px; color: #4e5969; border: 1px solid #e5e6eb; border-radius: 6px; background: #fff; outline: none; min-width: 0; }
.all-date-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.all-date { flex: 1; padding: 6px 8px; font-size: 12px; color: #4e5969; border: 1px solid #e5e6eb; border-radius: 6px; background: #fff; outline: none; min-width: 0; }
.all-date-sep { font-size: 12px; color: #86909c; flex-shrink: 0; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 30px; color: #86909c; font-size: 13px; span:first-child { font-size: 28px; } }
/* 运单详情浮层 */
.detail-overlay { position: absolute; inset: 0; z-index: 10; background: #f0f2f5; display: flex; flex-direction: column; }
.detail-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #fff; border-bottom: 1px solid #e5e6eb; }
.back-btn { font-size: 13px; color: rgb(var(--arcoblue-6)); cursor: pointer; }
.detail-id { font-size: 11px; color: #86909c; flex: 1; }
.detail-body { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 12px; }
.dt-tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.dt-待接单 { background: #fff7e8; color: #ff7d00; } .dt-已接单, .dt-收运中 { background: #e8f3ff; color: #165dff; } .dt-已完成 { background: #e8ffea; color: #00b42a; }
.dt-overtime-tag { background: #fff0f0; color: #f53f3f; }
.dt-hero { padding: 12px; border-radius: 8px; background: #fff; &.danger { border-left: 3px solid #f53f3f; } h3 { font-size: 15px; margin: 4px 0 0; color: #1d2129; } }
.dt-pri { font-size: 11px; padding: 1px 6px; border-radius: 3px; }
.dt-route-card { background: #fff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 0; }
.route-point { display: flex; align-items: center; gap: 10px; div { display: flex; flex-direction: column; span { font-size: 10px; color: #86909c; } b { font-size: 13px; color: #1d2129; } } }
.route-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; &.start { background: #00b42a; } &.end { background: #f53f3f; } }
.route-line { width: 2px; height: 16px; background: #e5e6eb; margin-left: 4px; }
.dt-metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.dm-item { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; span { font-size: 10px; color: #86909c; } b { font-size: 15px; color: #1d2129; } em { font-size: 10px; color: #c9cdd4; margin-top: 2px; } }
.dt-section-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: #1d2129; margin-top: 4px; }
.dt-events { display: flex; flex-direction: column; gap: 6px; }
.event-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; div { display: flex; flex-direction: column; b { color: #c9cdd4; font-weight: 400; } span { font-size: 10px; color: #c9cdd4; } } &.done { div b { color: #1d2129; } } }
.event-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e6eb; margin-top: 3px; flex-shrink: 0; .done & { background: #00b42a; } }
.dt-actions { display: flex; gap: 8px; padding: 10px 14px 18px; background: #fff; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.dt-map-card { background: #fff; border-radius: 8px; padding: 10px 12px; }
.map-area { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.map-route-visual { display: flex; align-items: center; gap: 0; width: 100%; }
.map-pin { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; font-weight: 700; flex-shrink: 0; &.start { background: #00b42a; } &.end { background: #f53f3f; } }
.map-track-line { flex: 1; height: 3px; background: linear-gradient(to right, #00b42a 40%, #e5e6eb 40%); border-radius: 2px; margin: 0 4px; }
.map-labels { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #4e5969; width: 100%; justify-content: space-between; }
.map-footer { display: flex; justify-content: space-between; width: 100%; font-size: 10px; color: #86909c; }
</style>
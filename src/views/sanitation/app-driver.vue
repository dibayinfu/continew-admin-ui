<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="驾驶员端"
      subtitle="查看收运任务，接单、上报到达、补传凭证。"
      phase="APP端"
      priority="P0"
      module="移动端"
    />

    <!-- ========== 产品需求说明 ========== -->
    <div class="prd-panel">
      <a-collapse :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🎯 功能要点</td></tr>
                  <tr><td class="prd-label">目标用户</td><td class="prd-value">驾驶员，在车内使用 APP 查看收运任务、接单、确认路线、补传凭证</td></tr>
                  <tr><td class="prd-label">页面结构</td><td class="prd-value">2 个底部 Tab：「任务」「我的」。默认进入「任务」Tab</td></tr>
                  <tr><td class="prd-label">Tab 1：任务</td><td class="prd-value">6 个状态筛选 Tab（全部/待接单/已接单/收运中/已完成/待补传），卡片列表展示筛选结果，点击卡片进入全屏详情</td></tr>
                  <tr><td class="prd-label">Tab 2：我的</td><td class="prd-value">驾驶员信息（头像+姓名+车辆），「我的运单」标题+日期选择（日历网格含每日运单数），当日统计（总运单/正常完成/超时，三色区分），运单列表</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">📱 任务详情页结构</td></tr>
                  <tr><td class="prd-label">顶部栏</td><td class="prd-value">「返回」按钮 + 任务单号 + 状态标签（待接单/已接单/收运中/已完成）+ 超时标签（红色）</td></tr>
                  <tr><td class="prd-label">标题区</td><td class="prd-value">优先级（紧急红色/普通灰色）+ 任务类型 + 任务名称 + 「下一步」文字提示（仅引导，非按钮）</td></tr>
                  <tr><td class="prd-label">路线卡片</td><td class="prd-value">收运点（绿点）→ 目的地（红点），中间竖线连接</td></tr>
                  <tr><td class="prd-label">核心指标</td><td class="prd-value">2×2 网格：截止时间/SLA、满溢率（≥90%红色）、称重（吨）、箱体编号/车辆</td></tr>
                  <tr><td class="prd-label">地图轨迹</td><td class="prd-value">Leaflet 地图（实线已行驶/虚线未完成，围栏圆圈标注），顶部「查看始发点」按钮聚焦放大到起点</td></tr>
                  <tr><td class="prd-label">关键事件</td><td class="prd-value">a-timeline 时间线，8 步：派单→接单→到达始发地→装车→发车→到达目的地→卸车完成→上传照片。仅显示已完成步骤+当前第一步未完成步骤，隐藏未来步骤避免空时间。进度计数如 5/8</td></tr>
                  <tr><td class="prd-label">单据信息</td><td class="prd-value">a-descriptions 表格 15 字段：任务单号、关联运单、任务类型、任务状态、驾驶员、车辆、箱体编号、收运点、目的地、截止时间、满溢率、称重、创建时间、接单/装车/完成时间、凭证状态</td></tr>
                  <tr><td class="prd-label">凭证照片</td><td class="prd-value">已上传时显示单张全宽凭证照片（SVG 模拟），含车辆号、目的地、完成时间水印</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🔑 状态流转与操作</td></tr>
                  <tr><td class="prd-label">收运状态</td><td class="prd-value">待接单 / 已接单 / 收运中 / 已完成，四状态互斥按序流转</td></tr>
                  <tr><td class="prd-label">待接单</td><td class="prd-value">创建任务单后的初始状态</td></tr>
                  <tr><td class="prd-label">已接单</td><td class="prd-value">驾驶员手动接单后变为已接单</td></tr>
                  <tr><td class="prd-label">收运中</td><td class="prd-value">驾驶员手动接单后，车辆进入任务单中的始发点电子围栏后变为收运中；必须手动接单，未接单时即使进入围栏也不会自动开始收运，防止路过车辆误触发状态变更</td></tr>
                  <tr><td class="prd-label">已完成</td><td class="prd-value">卸货完成，根据目的地电子围栏 + 称重变化判断卸货</td></tr>
                  <tr><td class="prd-label">超时状态</td><td class="prd-value">未超时（默认）/ 已超时，独立于收运状态展示</td></tr>
                  <tr><td class="prd-label">已超时</td><td class="prd-value">收运过程中，时长已超过任务时效要求，变为已超时</td></tr>
                  <tr><td class="prd-label">待接单 → 已接单</td><td class="prd-value">底部「接单」按钮 → Modal.confirm 二次确认 → 记录 acceptTime → 点亮「接单」步骤 → 状态变为已接单</td></tr>
                  <tr><td class="prd-label">已接单 → 收运中</td><td class="prd-value">底部"等待系统自动识别到达始发点"文字 + 原型「模拟系统识别」按钮。点击后点亮「到达始发地」「装车」「发车」三步，随机生成称重，状态变为收运中。真实 APP 由 GPS+电子围栏自动触发。必须先手动接单，未接单状态时即使车辆进入围栏也不会变为收运中，防止路过车辆误触发</td></tr>
                  <tr><td class="prd-label">收运中 → 已完成</td><td class="prd-value">底部"等待系统自动识别到达目的地"文字 + 原型「模拟系统完成」按钮。点击后点亮「到达目的地」「卸车完成」两步，记录 finishTime，计算耗时并判定超时。真实 APP 由目的地电子围栏+称重变化自动触发</td></tr>
                  <tr><td class="prd-label">已完成 + 未上传</td><td class="prd-value">底部「补传凭证照片」按钮 → 进入上传页（水印相机/相册选择，1 张）→ 提交后点亮「上传照片」步骤，proofUploaded=true</td></tr>
                  <tr><td class="prd-label">已完成 + 已上传</td><td class="prd-value">底部绿色提示"任务已完成，凭证已上传"，不可再操作</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🔑 关键事件（过程步骤）</td></tr>
                  <tr><td class="prd-label">① 派单</td><td class="prd-value">任务单创建</td></tr>
                  <tr><td class="prd-label">② 接单</td><td class="prd-value">驾驶员接单（必须手动接单，不可跳过；未接单则无法进入收运中状态）</td></tr>
                  <tr><td class="prd-label">③ 到达始发地</td><td class="prd-value">进入始发电子围栏</td></tr>
                  <tr><td class="prd-label">④ 装车</td><td class="prd-value">通过始发地+称重变化判断</td></tr>
                  <tr><td class="prd-label">⑤ 发车</td><td class="prd-value">离开始发地</td></tr>
                  <tr><td class="prd-label">⑥ 到达目的地</td><td class="prd-value">进入目的地电子围栏</td></tr>
                  <tr><td class="prd-label">⑦ 卸车完成</td><td class="prd-value">目的地电子围栏+称重变化判断</td></tr>
                  <tr><td class="prd-label">⑧ 上传照片</td><td class="prd-value">驾驶员补传凭证</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 验收要点</td></tr>
                  <tr><td class="prd-label">✓ 状态筛选</td><td class="prd-value">6 Tab 切换过滤，计数实时；待接单置顶，超时红色标记</td></tr>
                  <tr><td class="prd-label">✓ 列表进详情</td><td class="prd-value">点击卡片进入全屏详情，返回不刷新</td></tr>
                  <tr><td class="prd-label">✓ 接单确认</td><td class="prd-value">Modal.confirm 二次确认，确认后状态即时变更</td></tr>
                  <tr><td class="prd-label">✓ 8 步骤时间线</td><td class="prd-value">已完成绿点、当前蓝点、未来步骤隐藏；进度计数与实际显示一致。8 步：派单→接单→到达始发地→装车→发车→到达目的地→卸车完成→上传照片</td></tr>
                  <tr><td class="prd-label">✓ 满溢率展示</td><td class="prd-value">核心指标中显示，≥90% 红色高亮</td></tr>
                  <tr><td class="prd-label">✓ 地图轨迹</td><td class="prd-value">实线已行驶/虚线未完成，始发点目的地围栏标注</td></tr>
                  <tr><td class="prd-label">✓ 原型模拟</td><td class="prd-value">模拟系统识别/完成按钮可用，真实 APP 由 GPS+电子围栏+称重变化自动触发</td></tr>
                  <tr><td class="prd-label">✓ 凭证上传</td><td class="prd-value">水印相机+相册，1 张照片，提交后详情页显示凭证照片</td></tr>
                  <tr><td class="prd-label">✓ 我的运单</td><td class="prd-value">日历日期附带当日运单数，统计三色区分（总蓝/正常绿/超时红）</td></tr>
                  <tr><td class="prd-label">✓ 图层遮挡</td><td class="prd-value">底部操作区 z-index 高于 Leaflet 地图控件</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">当前为 mock 数据，后续对接后端 API</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <!-- ========== 手机外框 ========== -->
    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-status-bar"><span>10:22</span><span>🔋 91%</span></div>

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
                <div class="dt-title-row"><span class="dt-pri" :class="'pri-' + detailTask.priority">{{ detailTask.priority }}</span><span>{{ detailTask.taskType }}</span></div>
                <h3>{{ detailTask.taskName }}</h3>
                <div class="dt-next"><span class="dt-next-label">下一步</span><b>{{ getNextActionText(detailTask) }}</b></div>
              </div>
              <div class="dt-route-card">
                <div class="route-point"><span class="route-dot start"></span><div><span>收运点</span><b>{{ detailTask.startAddress }}</b></div></div>
                <div class="route-line"></div>
                <div class="route-point"><span class="route-dot end"></span><div><span>目的地</span><b>{{ detailTask.destination }}</b></div></div>
              </div>
              <div class="dt-metric-grid">
                <div class="dm-item" :class="{ danger: detailTask.overtimeStatus === '已超时' }"><span>截止</span><b>{{ getShortDeadline(detailTask.deadline) }}</b><em>SLA {{ detailTask.slaMinutes }}min</em></div>
                <div class="dm-item" :class="{ danger: (detailTask.fillRate ?? 0) >= 90 }"><span>满溢率</span><b>{{ detailTask.fillRate != null ? detailTask.fillRate + '%' : '-' }}</b><em>{{ (detailTask.fillRate ?? 0) >= 90 ? '需优先处理' : '正常' }}</em></div>
                <div class="dm-item"><span>称重</span><b>{{ detailTask.weight != null ? detailTask.weight + 't' : '待采集' }}</b><em>{{ detailTask.status === '收运中' ? '卸车后确认' : '系统记录' }}</em></div>
                <div class="dm-item"><span>箱体</span><b>{{ detailTask.boxNo }}</b><em>{{ detailTask.vehicle }}</em></div>
              </div>
              <div class="dt-map-card">
                <div class="dt-section-head"><span>路线轨迹</span><button class="start-point-btn" type="button" @click="showStartPoint(detailTask)">查看始发点</button></div>
                <TaskTrackMap ref="detailMapRef" :track="(detailTask.track as any)" :weight="detailTask.weight" />
              </div>
              <!-- ===== 关键事件 ===== -->
              <div class="dt-section-head"><span>关键事件</span><b>{{ getDoneStepCount(detailTask) }}/{{ detailTask.steps.length }}</b></div>
              <div class="dt-events-compact">
                <a-timeline>
                  <a-timeline-item v-for="step in visibleSteps(detailTask)" :key="step.label" :dot-color="step.done ? 'green' : 'gray'">
                    <b>{{ step.label }}</b>
                    <p v-if="step.time">{{ step.time }}</p>
                  </a-timeline-item>
                </a-timeline>
              </div>
              <div class="dt-section-head"><span>单据信息</span></div>
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
                <a-descriptions-item label="满溢率">{{ detailTask.fillRate != null ? detailTask.fillRate + '%' : '—' }}</a-descriptions-item>
                <a-descriptions-item label="称重">{{ detailTask.weight != null ? detailTask.weight + ' 吨' : '待采集' }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ detailTask.createTime }}</a-descriptions-item>
                <a-descriptions-item label="接单/装车/完成">{{ detailTask.acceptTime || '—' }} / {{ detailTask.startTime || '—' }} / {{ detailTask.finishTime || '—' }}</a-descriptions-item>
                <a-descriptions-item label="凭证状态">{{ detailTask.proofUploaded ? '已上传' : '待上传' }}</a-descriptions-item>
              </a-descriptions>
              <div v-if="detailTask.proofUploaded" class="dt-section-head"><span>凭证照片</span></div>
              <div v-if="detailTask.proofUploaded" class="dt-proof-photos">
                <div class="dpp-img">
                  <svg viewBox="0 0 320 180"><rect width="320" height="180" fill="#e8f3ff"/><text x="160" y="60" text-anchor="middle" fill="#165DFF" font-size="18" font-weight="700">完成任务凭证</text><text x="160" y="85" text-anchor="middle" fill="#86909c" font-size="12">{{ detailTask.vehicle }}</text><text x="160" y="105" text-anchor="middle" fill="#4e5969" font-size="11">{{ detailTask.destination }}</text><rect x="0" y="155" width="320" height="25" fill="rgba(0,0,0,.3)"/><text x="160" y="172" text-anchor="middle" fill="#fff" font-size="11">{{ detailTask.vehicle }} · {{ detailTask.finishTime || detailTask.acceptTime || detailTask.createTime }}</text></svg>
                </div>
              </div>
            </div>
            <div class="dt-actions">
              <a-button v-if="detailTask.status === '待接单'" type="primary" long size="large" @click="confirmAccept(detailTask)">接单</a-button>
              <div v-if="detailTask.status === '待接单' || detailTask.status === '已接单'" class="dt-auto-state"><b>等待系统自动识别到达始发点</b><span>进入收集点或中转站围栏后自动变为收运中。</span><button type="button" @click="simulateAutoStart(detailTask)">模拟系统识别</button></div>
              <div v-if="detailTask.status === '收运中'" class="dt-auto-state"><b>等待系统自动识别到达目的地</b><span>进入中转站或焚烧厂围栏并卸车后自动完成。</span><button type="button" @click="simulateAutoFinish(detailTask)">模拟系统完成</button></div>
              <a-button v-if="detailTask.status === '已完成' && !detailTask.proofUploaded" type="primary" status="success" long size="large" @click="openProofUpload(detailTask)">补传凭证照片</a-button>
              <div v-if="detailTask.status === '已完成' && detailTask.proofUploaded" class="dt-done">任务已完成，凭证已上传</div>
            </div>
          </div>

          <!-- ===== 凭证上传弹层 ===== -->
          <div v-if="proofUploadTask" class="proof-upload-overlay">
            <div class="proof-upload-header"><span class="back-btn" @click="closeProofUpload">返回</span><b>上传完成凭证</b></div>
            <div class="proof-upload-body">
              <div class="proof-tip"><b>请上传完成任务时的现场照片</b><span>建议包含车牌、卸车现场。</span></div>
              <div class="watermark-camera"><div class="camera-frame"><div class="camera-crosshair"></div><div class="camera-watermark"><b>{{ proofUploadTask.vehicle }}</b><span>{{ proofUploadTask.taskName }}</span><span>{{ proofUploadTask.destination }} · {{ nowTime() }}</span></div></div><div class="camera-caption">水印相机预览</div></div>
              <div class="proof-actions-grid"><button type="button" @click="addProofPhoto('camera')"><b>打开水印相机</b><span>拍照上传</span></button><button type="button" @click="addProofPhoto('album')"><b>从相册选择</b><span>支持历史照片</span></button></div>
              <div class="proof-preview-list"><div v-for="photo in proofPhotos" :key="photo" class="proof-preview-item"><span>{{ photo }}</span></div><div v-if="proofPhotos.length === 0" class="proof-preview-empty">暂无照片</div></div>
            </div>
            <div class="dt-actions proof-submit-actions"><a-button type="primary" status="success" long size="large" :disabled="proofPhotos.length === 0" @click="submitProofUpload">提交凭证</a-button></div>
          </div>

          <!-- ===== 任务列表 ===== -->
          <div v-else-if="store.activeDriverTab === 'task'" class="phone-content">
            <div class="top-bar"><span class="top-title">我的收运任务</span><span class="top-user">张师傅 · 豫E3G516</span></div>
            <div class="filter-tabs">
              <div v-for="tab in statusTabs" :key="tab.key" class="ft-item" :class="{ active: taskStatFilter === tab.key }" @click="taskStatFilter = tab.key as any">
                <span class="ft-label">{{ tab.label }}</span><span class="ft-count">{{ tab.count }}</span>
              </div>
            </div>
            <div class="task-list">
              <div v-if="filteredDriverTasks.length === 0" class="empty-state"><span class="empty-icon">📋</span><span>暂无任务</span></div>
              <div v-for="task in filteredDriverTasks" :key="task.id" class="task-card" @click="detailTask = task">
                <div class="tc-head"><b>{{ task.taskName }}</b><span class="tc-st" :class="'ts-' + task.status">{{ task.status }}</span></div>
                <div class="tc-addr">📍 {{ task.startAddress }} → {{ task.destination }}</div>
                <div class="tc-row">
                  <span class="tc-pri" :class="'pri-' + task.priority">{{ task.priority }}</span>
                  <span v-if="task.fillRate != null" class="tc-fill" :class="{ 'tc-fill-high': task.fillRate >= 90 }">满溢 {{ task.fillRate }}%</span>
                  <span class="tc-deadline">{{ task.deadline }} 截止</span>
                  <span v-if="task.overtimeStatus === '已超时'" class="tc-ot">超时</span>
                </div>
                <div class="tc-steps-dots"><span v-for="(s, i) in task.steps" :key="i" class="tsd" :class="{ done: s.done }"></span></div>
              </div>
            </div>
          </div>

          <!-- ===== 路线 ===== -->
          <div v-if="store.activeDriverTab === 'route'" class="phone-content">
          </div>

          <!-- ===== 凭证 ===== -->
          <div v-if="store.activeDriverTab === 'proof'" class="phone-content">
          </div>

          <!-- ===== 我的 ===== -->
          <div v-if="store.activeDriverTab === 'mine'" class="phone-content">
            <!-- 驾驶员信息 -->
            <div class="mine-profile">
              <div class="mp-avatar">张</div>
              <div class="mp-info"><b>张师傅</b><span>豫E3G516 · 小勾臂车</span></div>
            </div>

            <!-- 日期选择 -->
            <div class="mine-date-header" @click="showDatePicker = !showDatePicker">
              <div class="mdh-left">
                <span class="mdh-title">我的运单</span>
                <span class="mdh-date">{{ mineDate }}</span>
                <span class="mdh-arrow">▾</span>
              </div>
            </div>

            <div v-if="showDatePicker" class="mine-date-picker">
              <div class="mdp-grid">
                <span v-for="d in recentDates" :key="d.value" class="mdp-day" :class="{ active: mineDate === d.value, today: d.isToday }" @click="selectDate(d.value)">
                  {{ d.label }}<em>{{ d.count || '' }}</em>
                </span>
              </div>
            </div>

            <!-- 统计 -->
            <div class="mine-day-stats">
              <div class="mds-card"><span class="mds-val" style="color:#165DFF">{{ mineDateTasks.length }}</span><span class="mds-label">总运单</span></div>
              <div class="mds-card"><span class="mds-val success">{{ mineDateNormal }}</span><span class="mds-label">正常完成</span></div>
              <div class="mds-card"><span class="mds-val danger">{{ mineDateOvertime }}</span><span class="mds-label">超时</span></div>
            </div>

            <!-- 运单列表 -->
            <div class="mine-history">
              <div v-if="mineDateTasks.length === 0" class="empty-state"><span class="empty-icon">📋</span><span>该日暂无运单</span></div>
              <div v-for="t in mineDateTasks" :key="t.id" class="mh-item" @click="detailTask = t">
                <div class="mh-head"><b>{{ t.taskName }}</b><span class="tc-st" :class="'ts-' + t.status">{{ t.status }}</span></div>
                <div class="mh-meta"><span>{{ t.createTime }}</span><span v-if="t.overtimeStatus === '已超时'" class="tc-ot">超时</span><span v-if="t.weight">⚖️{{ t.weight }}t</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部导航 -->
        <div class="bottom-nav">
          <div v-for="nav in driverNavs" :key="nav.key" class="nav-item" :class="{ active: store.activeDriverTab === nav.key }" @click="store.activeDriverTab = nav.key as any">
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
const proofUploadTask = ref<DriverTask | null>(null)
const proofPhotos = ref<string[]>([])

const driverNavs = [
  { key: 'task', label: '任务', icon: '📋' },
  { key: 'mine', label: '我的', icon: '👤' },
]

const currentTask = computed(() => driverTaskList.find(t => ['已接单', '收运中'].includes(t.status)))
const allDriverTasks = computed(() => [...driverTaskList].sort((a, b) => b.createTime.localeCompare(a.createTime)))

const todayStr = '2026-06-15'
const mineDate = ref(todayStr)
const showDatePicker = ref(false)

function selectDate(d: string) { mineDate.value = d; showDatePicker.value = false }

const recentDates = computed(() => {
  const dates: { value: string; label: string; isToday: boolean; count: number }[] = []
  for (let i = 14; i >= 0; i--) {
    const d = new Date('2026-06-15'); d.setDate(d.getDate() - i)
    const val = d.toISOString().split('T')[0]
    const count = driverTaskList.filter(t => t.createTime.startsWith(val)).length
    dates.push({ value: val, label: `${d.getMonth() + 1}/${d.getDate()}`, isToday: val === todayStr, count })
  }
  return dates
})

const mineDateTasks = computed(() => allDriverTasks.value.filter(t => t.createTime.startsWith(mineDate.value)))
const mineDateNormal = computed(() => mineDateTasks.value.filter(t => t.status === '已完成' && t.overtimeStatus === '未超时').length)
const mineDateOvertime = computed(() => mineDateTasks.value.filter(t => t.overtimeStatus === '已超时').length)

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
function getShortDeadline(d: string) { return d.split(' ').pop() || d }
function getDoneStepCount(t: DriverTask) { return t.steps.filter(s => s.done).length }
function visibleSteps(t: DriverTask) {
  const idx = t.steps.findIndex(s => !s.done)
  return idx === -1 ? t.steps : t.steps.slice(0, idx + 1)
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
  if (t.status !== '已接单') {
    ArcoMessage.warning('请先点击「接单」按钮接单，未接单状态无法开始收运')
    return
  }
  t.status = '收运中'; t.startTime = nowTime()
  t.steps.filter(s => s.label === '到达始发地' || s.label === '装车' || s.label === '发车').forEach(s => { s.done = true; if (!s.time) s.time = nowTime() })
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
function openProofUpload(t: DriverTask) { proofUploadTask.value = t; proofPhotos.value = [] }
function closeProofUpload() { proofUploadTask.value = null; proofPhotos.value = [] }
function addProofPhoto(source: 'camera' | 'album') {
  if (proofPhotos.value.length >= 1) { ArcoMessage.info('仅需上传 1 张凭证照片'); return }
  proofPhotos.value.push(source === 'camera' ? `水印相机照片` : `相册照片`)
  ArcoMessage.success(source === 'camera' ? '已拍摄' : '已选择')
}
function submitProofUpload() {
  if (!proofUploadTask.value || proofPhotos.value.length === 0) return
  proofUploadTask.value.proofUploaded = true
  if (detailTask.value?.id === proofUploadTask.value.id) detailTask.value.proofUploaded = true
  ArcoMessage.success('凭证已上传'); closeProofUpload()
}
function handleNavigate() { ArcoMessage.info('正在启动导航...') }
function handleProofClick(t: DriverTask) { detailTask.value = t }
</script>

<style scoped lang="scss">
.sanitation-page { display: flex; flex-direction: column; gap: 14px; }

// ====== PRD 面板 ======
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;
  :deep(.arco-collapse-item-header) { font-weight: 600; font-size: 14px; }
}
.prd-body { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
.prd-section-title { font-size: 14px; font-weight: 600; color: var(--color-text-1); margin: 0 0 8px; }
.prd-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  tr:nth-child(even) { background: var(--color-fill-1); }
  td { padding: 6px 12px; border: 1px solid var(--color-border-2); vertical-align: top; line-height: 1.6; }
  .prd-label { width: 140px; min-width: 140px; font-weight: 500; color: var(--color-text-2); white-space: nowrap; }
}

// ====== 手机外框 ======
.phone-wrapper { display: flex; justify-content: center; padding: 12px 0; }
.phone-frame { width: 390px; min-height: 780px; background: #f0f2f5; border: 3px solid #1f2937; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.16); display: flex; flex-direction: column; }
.phone-status-bar { display: flex; justify-content: space-between; padding: 10px 20px 4px; background: #fff; font-size: 12px; color: #1d2129; font-weight: 600; }
.phone-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative; }
.phone-content { flex: 1; overflow-y: auto; padding: 0 14px 12px; background: #f0f2f5; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
.top-title { font-size: 17px; font-weight: 700; color: #1d2129; }
.top-user { font-size: 12px; color: rgb(var(--arcoblue-6)); font-weight: 600; }

// ====== 状态筛选 ======
.filter-tabs { display: flex; gap: 0; margin-bottom: 10px; background: #fff; border-radius: 8px; overflow: hidden; }
.ft-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 7px 2px; cursor: pointer; border-bottom: 2px solid transparent; transition: all .15s; min-width: 0;
  &.active { border-bottom-color: rgb(var(--arcoblue-6)); background: #e8f3ff; }
  .ft-label { font-size: 11px; color: #86909c; white-space: nowrap; }
  .ft-count { font-size: 15px; font-weight: 700; color: #1d2129; line-height: 1.3; }
  &.active .ft-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
  &.active .ft-count { color: rgb(var(--arcoblue-6)); }
}

// ====== 任务卡片 ======
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-card { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.tc-head { display: flex; justify-content: space-between; align-items: center; b { font-size: 14px; color: #1d2129; } }
.tc-st { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.ts-待接单 { background: #fff7e8; color: #ff7d00; } .ts-已接单, .ts-收运中 { background: #e8f3ff; color: #165dff; } .ts-已完成 { background: #e8ffea; color: #00b42a; }
.tc-addr { font-size: 12px; color: #4e5969; margin: 4px 0; }
.tc-row { display: flex; align-items: center; gap: 6px; font-size: 11px; flex-wrap: wrap; }
.tc-pri { padding: 0 4px; border-radius: 3px; font-size: 10px; }
.pri-紧急 { background: #fff0f0; color: #f53f3f; } .pri-普通 { background: #f2f3f5; color: #86909c; }
.tc-fill { color: #ff7d00; font-weight: 500; } .tc-fill-high { color: #f53f3f; font-weight: 700; }
.tc-deadline { color: #86909c; } .tc-ot { color: #f53f3f; font-weight: 700; }
.tc-steps-dots { display: flex; gap: 3px; margin-top: 6px; }
.tsd { width: 6px; height: 6px; border-radius: 50%; background: #e5e6eb; } .tsd.done { background: #00b42a; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 8px; color: #c9cdd4; .empty-icon { font-size: 36px; } }

// ====== 全屏详情 ======
.detail-overlay { position: absolute; inset: 0; z-index: 10; background: var(--color-bg-1); display: flex; flex-direction: column; }
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--color-bg-2); border-bottom: 1px solid var(--color-border-2); flex-shrink: 0; }
.back-btn { font-size: 15px; color: rgb(var(--arcoblue-6)); font-weight: 600; cursor: pointer; &:active { opacity: .7; } }
.detail-id { font-size: 12px; color: #86909c; }
.dt-tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.dt-待接单 { background: #fff7e8; color: #ff7d00; } .dt-已接单, .dt-收运中 { background: #e8f3ff; color: #165dff; } .dt-已完成 { background: #e8ffea; color: #00b42a; }
.dt-overtime-tag { background: #fff0f0; color: #f53f3f !important; }
.detail-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }

// Hero
.dt-hero { padding: 12px; background: #f7f8fa; border-radius: 10px; border-left: 4px solid rgb(var(--arcoblue-6));
  &.danger { border-left-color: #f53f3f; background: #fff0f0; }
  .dt-title-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #86909c; margin-bottom: 6px; }
  .dt-pri { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
  h3 { margin: 0 0 8px; font-size: 17px; color: #1d2129; }
  .dt-next { display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .dt-next-label { color: #86909c; font-size: 11px; }
  .dt-next b { color: rgb(var(--arcoblue-6)); }
}

// Route
.dt-route-card { background: #fff; border-radius: 10px; padding: 14px; }
.route-point { display: flex; gap: 10px; align-items: flex-start;
  .route-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .route-dot.start { background: #00b42a; } .route-dot.end { background: #f53f3f; }
  div { span { font-size: 10px; color: #86909c; display: block; } b { font-size: 13px; color: #1d2129; } }
}
.route-line { width: 2px; height: 28px; background: #e5e6eb; margin-left: 5px; }

// Metrics
.dt-metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.dm-item { display: flex; flex-direction: column; gap: 2px; padding: 10px; background: #fff; border-radius: 8px;
  &.danger { background: #fff0f0; b { color: #f53f3f; } }
  span { font-size: 10px; color: #86909c; } b { font-size: 15px; color: #1d2129; font-weight: 700; } em { font-size: 10px; color: #86909c; font-style: normal; }
}

// Map
.dt-map-card { background: #fff; border-radius: 10px; padding: 12px; }
.dt-section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
  > span { font-size: 14px; font-weight: 600; color: #1d2129; }
  > b { font-size: 13px; color: var(--color-text-3); }
}
.start-point-btn { font-size: 12px; padding: 4px 10px; background: #e8f3ff; color: rgb(var(--arcoblue-6)); border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
.dt-desc { margin-bottom: 8px; }

// 紧凑时间线
.dt-events-compact {
  :deep(.arco-timeline) { padding: 0; }
  :deep(.arco-timeline-item) { padding-bottom: 4px; min-height: auto; }
  :deep(.arco-timeline-item-content) { padding-bottom: 0; }
  :deep(.arco-timeline-item-content b) { font-size: 13px; display: block; }
  :deep(.arco-timeline-item-content p) { font-size: 11px; color: #86909c; margin: 1px 0 0; }
}

// Proof photo
.dt-proof-photos { .dpp-img { border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); svg { display: block; width: 100%; height: auto; } } }
.dpp-item { display: none; } /* unused */
.dpp-label { display: none; } /* unused */

// Proof imgs (old - keep for compatibility)
.dt-proof-imgs { display: flex; gap: 8px; .dpi-card { flex: 1; text-align: center; padding: 14px; background: var(--color-fill-1); border-radius: 6px; font-size: 13px; color: var(--color-text-3); } }

// Actions
.dt-actions { position: sticky; bottom: 0; padding: 12px 14px; background: var(--color-bg-2); border-top: 1px solid var(--color-border-2); flex-shrink: 0; z-index: 20; }
.dt-auto-state { padding: 10px 12px; background: #e8f3ff; border-radius: 8px; text-align: center;
  b { display: block; font-size: 13px; color: rgb(var(--arcoblue-6)); margin-bottom: 4px; }
  span { font-size: 11px; color: #86909c; }
  button { margin-top: 6px; font-size: 11px; padding: 3px 12px; background: #fff; color: rgb(var(--arcoblue-6)); border: 1px solid rgb(var(--arcoblue-6)); border-radius: 4px; cursor: pointer; }
}
.dt-done { text-align: center; padding: 12px; background: #e8ffea; border-radius: 8px; color: #00b42a; font-weight: 600; font-size: 14px; }

// ====== 凭证上传弹层 ======
.proof-upload-overlay { position: absolute; inset: 0; z-index: 30; background: var(--color-bg-1); display: flex; flex-direction: column; }
.proof-upload-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--color-bg-2); border-bottom: 1px solid var(--color-border-2); flex-shrink: 0; b { font-size: 15px; } }
.proof-upload-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.proof-tip { b { display: block; font-size: 14px; color: #1d2129; margin-bottom: 4px; } span { font-size: 12px; color: #86909c; } }
.watermark-camera { .camera-frame { height: 180px; background: #1d2129; border-radius: 10px; position: relative; display: flex; align-items: flex-end; justify-content: center; padding: 14px; overflow: hidden; }
  .camera-crosshair { position: absolute; inset: 30px; border: 2px dashed rgba(255,255,255,.3); }
  .camera-watermark { text-align: center; color: rgba(255,255,255,.7); b { display: block; font-size: 14px; } span { display: block; font-size: 10px; } }
  .camera-caption { text-align: center; font-size: 11px; color: #86909c; margin-top: 6px; }
}
.proof-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; button { padding: 14px; background: #f7f8fa; border: 1px solid #e5e6eb; border-radius: 8px; cursor: pointer; text-align: center; b { display: block; font-size: 13px; color: #1d2129; } span { font-size: 11px; color: #86909c; } } }
.proof-preview-list { display: flex; gap: 8px; flex-wrap: wrap; .proof-preview-item { padding: 10px 14px; background: #f0f2f5; border-radius: 6px; font-size: 12px; color: #4e5969; } .proof-preview-empty { padding: 20px; text-align: center; color: #c9cdd4; font-size: 12px; width: 100%; } }
.proof-submit-actions { position: sticky; bottom: 0; }

// ====== 我的 Tab ======
.mine-profile { display: flex; align-items: center; gap: 12px; padding: 12px 0 8px; }
.mp-avatar { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgb(var(--arcoblue-6)); color: #fff; font-size: 17px; font-weight: 700; border-radius: 50%; }
.mp-info { display: flex; flex-direction: column; b { font-size: 15px; color: #1d2129; } span { font-size: 11px; color: #86909c; } }

.mine-date-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 10px; cursor: pointer; }
.mdh-left { display: flex; align-items: center; gap: 6px; }
.mdh-title { font-size: 16px; font-weight: 700; color: #1d2129; }
.mdh-date { font-size: 12px; color: #86909c; background: #f0f2f5; padding: 2px 8px; border-radius: 4px; }
.mdh-arrow { font-size: 12px; color: #86909c; }
.mdh-sub { font-size: 13px; color: #86909c; }

.mine-date-picker { margin-bottom: 10px; }
.mdp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.mdp-day { text-align: center; padding: 8px 2px; font-size: 11px; color: #4e5969; background: #fff; border-radius: 6px; cursor: pointer;
  em { display: block; font-size: 9px; color: #c9cdd4; font-style: normal; margin-top: 2px; }
  &.active { background: rgb(var(--arcoblue-6)); color: #fff; font-weight: 600; em { color: rgba(255,255,255,.7); } }
  &.today:not(.active) { color: rgb(var(--arcoblue-6)); font-weight: 600; }
}

.mine-day-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.mds-card { display: flex; flex-direction: column; align-items: center; padding: 14px 4px; background: #fff; border-radius: 10px; }
.mds-val { font-size: 20px; font-weight: 700; color: #1d2129; } .mds-label { font-size: 11px; color: #86909c; margin-top: 2px; }
.mds-val.success { color: #00b42a !important; }
.mds-val.danger { color: #f53f3f !important; }

.mine-history { display: flex; flex-direction: column; gap: 8px; }
.mh-item { background: #fff; border-radius: 10px; padding: 12px; cursor: pointer; &:active { background: #f7f8fa; } }
.mh-head { display: flex; justify-content: space-between; align-items: center; b { font-size: 14px; color: #1d2129; } }
.mh-meta { display: flex; gap: 8px; font-size: 11px; color: #86909c; margin-top: 4px; align-items: center; }

// ====== 底部导航 ======
.bottom-nav { display: grid; grid-template-columns: repeat(2, 1fr); padding: 8px 0 18px; background: #fff; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
.ni-icon { font-size: 20px; } .ni-label { font-size: 10px; color: #86909c; }
.nav-item.active .ni-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
</style>

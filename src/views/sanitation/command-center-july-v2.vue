<template>
  <div class="command-v2-page">
    <div class="resolution-switch">
      <button :class="{ active: resolutionMode === 'formal' }" @click="resolutionMode = 'formal'">正式分辨率</button>
      <button :class="{ active: resolutionMode === 'test' }" @click="resolutionMode = 'test'">测试分辨率</button>
      <button :class="{ active: showPrd }" @click="showPrd = !showPrd">产品需求</button>
      <button :class="{ active: showLayoutMetrics }" @click="showLayoutMetrics = !showLayoutMetrics">布局标注</button>
      <span v-if="showLayoutMetrics" class="layout-spacing-note">
        外边距 14px × 2 + 区间距 14px × 3 = <strong>{{ layoutSpacingMetric.width }}px</strong> · {{ layoutSpacingMetric.ratio }}%
      </span>
    </div>

    <div v-if="showPrd" class="prd-mask" @click.self="showPrd = false">
      <section class="prd-board" role="dialog" aria-modal="true" aria-label="数字大屏指挥中心V2产品需求文档">
        <header class="prd-head">
          <div><span>产品需求文档 · PRD</span><h2>数字大屏指挥中心 V2</h2><p>生活垃圾收运监控、告警处置与调度指挥一体化大屏</p></div>
          <button class="prd-close" aria-label="关闭产品需求文档" @click="showPrd = false">×</button>
        </header>
        <div class="prd-meta"><span>文档版本：开发数据口径版 V2.0</span><span>适用角色：产品、前端、后端、测试、运营</span><span>数据形态：当前 Mock / 生产聚合接口</span><span>页面目标：发现风险 → 快速研判 → 调度处置 → 过程追踪 → 闭环复盘</span></div>
        <div class="prd-body">
          <section v-for="section in prdSections" :key="section.title" class="prd-section">
            <h3>{{ section.title }}</h3>
            <p v-if="section.desc" class="prd-desc">{{ section.desc }}</p>
            <div class="prd-table-wrap">
              <table class="prd-table">
                <colgroup><col class="prd-col-name" /><col class="prd-col-source" /><col class="prd-col-logic" /><col class="prd-col-acceptance" /></colgroup>
                <thead><tr><th scope="col">数据 / 功能</th><th scope="col">数据来源与关联键</th><th scope="col">计算、筛选与排序逻辑</th><th scope="col">展示及验收口径</th></tr></thead>
                <tbody><tr v-for="item in section.items" :key="item.label"><th scope="row">{{ item.label }}</th><td>{{ item.source }}</td><td>{{ item.logic }}</td><td>{{ item.acceptance }}</td></tr></tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>

    <div ref="stageViewportRef" class="stage-viewport" :class="`mode-${resolutionMode}`" :style="stageViewportStyle">
      <div class="screen-shell" :style="{ transform: `scale(${screenScale})` }">
        <header class="screen-header">
          <div class="header-left">
            <span>2025-06-25</span>
            <span>10:31:28</span>
            <span>星期三</span>
            <span class="weather">☁ 28°C 多云转晴</span>
            <span>东风2级</span>
            <span>湿度 56%</span>
          </div>
          <h1>安阳龙安区生活垃圾收运监控指挥中心</h1>
          <div class="header-actions">
            <button class="ai-btn" @click="notifyHeader('AI小犀正在成长中，智能助手即将上线，敬请期待！')" title="AI小犀智能体"><i class="ai-orbit"><b /><b /><b /></i><span>AI小犀</span></button>
            <button class="header-icon-btn" title="全屏" @click="toggleFullscreen">⛶</button>
            <button class="header-icon-btn" title="刷新" @click="refreshDashboard">↻</button>
            <button class="header-icon-btn" title="设置" @click="settingsOpen = !settingsOpen">⚙</button>
            <div v-if="settingsOpen" class="header-settings"><label>当前机构<select v-model="selectedOrganization"><option v-for="item in organizations" :key="item" :value="item">{{ item }}</option></select></label><button @click="saveOrganization">保存</button></div>
          </div>
          <div v-if="headerNotice" class="header-notice">✓ {{ headerNotice }}</div>
        </header>

        <div class="dashboard-grid" :style="dashboardLayoutStyle">
          <aside class="left-rail">
            <PanelCard title="基础档案" class="archive-card">
              <div class="archive-list">
                <div v-for="item in archiveStats" :key="item.label" class="archive-row">
                  <span class="row-icon">{{ item.icon }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </PanelCard>

            <PanelCard title="累计数据" class="result-card">
              <div class="operation-list">
                <div v-for="item in operationStats" :key="item.label" class="operation-row">
                  <span class="row-icon">{{ item.icon }}</span>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                </div>
              </div>
            </PanelCard>

            <PanelCard title="资产设备监控" class="asset-health-card">
              <div class="asset-health-grid">
                <div v-for="item in assetHealthStats" :key="item.key" class="asset-health-row">
                  <img class="asset-art" :class="item.key" :src="item.asset" :alt="`${item.label}图标`" />
                  <span class="asset-copy"><strong>{{ item.label }}</strong><em>{{ item.count }}{{ item.unit }}</em><b :class="item.tone">健康度 <i>{{ item.health }}%</i></b></span>
                </div>
              </div>
            </PanelCard>
          </aside>

          <section class="analysis-column">
            <PanelCard title="昨日垃圾量乡镇排行（吨）" class="chart-card">
              <VChart :key="`town-${resolutionMode}`" class="analysis-chart" :option="townWasteChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="近7日清运走势（吨）" class="chart-card">
              <VChart :key="`trend-${resolutionMode}`" class="analysis-chart" :option="wasteTrendChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="昨日司机排行（按任务量）" class="chart-card">
              <VChart :key="`driver-${resolutionMode}`" class="analysis-chart" :option="driverRankChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="任务准点率（单/日）" class="chart-card">
              <VChart :key="`ontime-${resolutionMode}`" class="analysis-chart" :option="ontimeTaskChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
          </section>

          <main class="map-panel">
            <div class="map-stage" :class="`map-theme-${activeMapTheme}`" @wheel.prevent="onMapWheel">
              <div ref="v2MapBaseRef" class="v2-map-base" />
              <div v-if="mapEngineError" class="map-engine-error">{{ mapEngineError }}</div>

              <div class="map-kpis">
                <div v-for="item in mapKpis" :key="item.label" class="map-kpi">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.unit }}</em>
                </div>
              </div>

              <div class="map-zoom-controls">
                <button @click="zoomMap(0.2)">+</button>
                <button @click="zoomMap(-0.2)">−</button>
                <button @click="resetMapZoom">1:1</button>
              </div>

              <div class="map-theme-switcher" :class="{ open: mapThemeMenuOpen }" aria-label="地图主题切换">
                <button class="theme-trigger" :title="`当前底图：${currentMapTheme.label}`" @click.stop="mapThemeMenuOpen = !mapThemeMenuOpen">
                  <i :style="{ background: currentMapTheme.color }" />
                  <span>{{ currentMapTheme.label }}</span>
                  <b>⌄</b>
                </button>
                <div v-if="mapThemeMenuOpen" class="theme-menu">
                  <button
                    v-for="theme in mapThemes"
                    :key="theme.key"
                    :class="{ active: activeMapTheme === theme.key }"
                    :title="`切换为${theme.label}`"
                    @click.stop="selectMapTheme(theme.key)"
                  >
                    <i :style="{ background: theme.color }" />
                    {{ theme.label }}
                  </button>
                </div>
              </div>
              <div class="map-zoom-layer" :style="{ transform: `scale(${mapZoom})` }">
                <div class="region-shape">
                  <span class="town-label town-a">安阳县</span>
                  <span class="town-label town-b">龙泉镇</span>
                  <span class="town-label town-c">马家乡</span>
                  <span class="town-label town-d">东风乡</span>
                  <span class="town-label town-e">文明大道街道</span>
                  <span class="town-label town-f">殷都区</span>
                </div>

                <button
                  v-for="point in visibleMapEntities"
                  :key="point.id"
                  class="map-entity"
                  :class="[point.kind, point.status, { pulse: point.pulse }]"
                  :style="mapEntityStyle(point)"
                  @click="selectMapEntity(point)"
                >
                  <span class="entity-icon">
                    <img :src="mapEntityIcon(point)" :alt="`${point.type}图标`" />
                  </span>
                  <i v-if="point.alarm && activeLayers.includes('alarm')" class="alarm-dot" :class="{ pulse: point.pulse }">!</i>
                  <em>{{ point.name }}</em>
                </button>
              </div>

              <div class="map-layer-bar">
                <span>图层 · {{ visibleMapEntities.length }}/{{ mapEntities.length }}</span>
                <button v-for="layer in mapLayers" :key="layer.key" :class="{ active: activeLayers.includes(layer.key) }" @click="toggleLayer(layer.key)">
                  <img class="layer-icon" :src="layer.icon" :alt="`${layer.label}图标`" />{{ layer.label }}
                </button>
              </div>
            </div>

            <aside v-if="detailPanelVisible" class="detail-panel">
              <div class="panel-title">
                {{ selectedEntity.name === '豫E606' ? selectedEntity.name : `${selectedProfile.title}详情` }}
                <button class="detail-close" @click="detailPanelVisible = false">×</button>
              </div>
              <div class="entity-summary" :class="{ 'has-image': Boolean(selectedEntity.image) && selectedEntity.type !== '车辆' }">
                <p v-if="entityStatusInfo" class="entity-status-line">
                  <i :class="entityStatusInfo.tone" />
                  <strong>{{ entityStatusInfo.label }}</strong>
                  <em v-for="tag in entityStatusInfo.tags" :key="tag" :class="tag">{{ tag }}</em>
                </p>
                <img v-if="selectedEntity.image && selectedEntity.type !== '车辆'" :src="selectedEntity.image" alt="" />
              </div>
              <section class="detail-section">
                <div class="section-title">基本信息</div>
                <div class="detail-list">
                  <div v-for="item in selectedProfile.basic" :key="item.label" :class="{ wide: ['当前位置', '具体地址'].includes(item.label) }">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                </div>
              </section>
              <div v-if="selectedProfile.actions.length" class="quick-actions action-row">
                <button v-for="action in selectedProfile.actions" :key="action" @click="openEntityAction(action)">{{ action }}</button>
              </div>
              <section v-if="selectedProfile.task" class="relation-card task-card">
                <div class="section-title">任务信息</div>
                <div class="task-name">{{ selectedProfile.task.name }}</div>
                <div class="task-route">
                  <div class="task-stop start"><span>始发地</span><strong>{{ taskInfoValue('始发地') }}</strong></div>
                  <i>→</i>
                  <div class="task-stop end"><span>目的地</span><strong>{{ taskInfoValue('目的地') }}</strong></div>
                </div>
                <div class="task-meta">
                  <span>时效 <strong>{{ taskInfoValue('时效') }}</strong></span>
                  <span>状态 <em>{{ taskInfoValue('当前状态') }}</em></span>
                </div>
                <button class="task-detail-btn" @click="openEntityAction('查看任务详情')">查看任务详情</button>
              </section>
              <section v-if="selectedProfile.statistics.length" class="statistics-card">
                <div class="section-title">统计信息</div>
                <div class="statistics-grid">
                  <div v-for="item in selectedProfile.statistics" :key="item.label">
                    <strong>{{ item.value }}</strong><span>{{ item.label }}</span>
                  </div>
                </div>
              </section>
            </aside>

            <aside v-if="activeEntityAction" class="entity-action-panel">
              <div class="panel-title">{{ activeEntityAction }} · {{ selectedEntity.name }}<button class="detail-close" @click="activeEntityAction = ''">×</button></div>
              <template v-if="activeEntityAction === '查看任务详情'">
                <div class="action-task-title">{{ selectedProfile.task?.name }}</div>
                <div class="detail-list action-content">
                  <div v-for="item in selectedProfile.task?.items" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
                  <div><span>任务编号</span><strong>RW-20260616-{{ selectedEntity.id.toUpperCase() }}</strong></div>
                  <div><span>执行进度</span><strong>65%</strong></div>
                </div>
              </template>
              <template v-else-if="activeEntityAction === '轨迹' || activeEntityAction === '跟踪'">
                <div class="track-map" :class="{ live: activeEntityAction === '跟踪' }">
                  <div class="track-map-label start">起</div><div class="track-map-label end">终</div>
                  <svg viewBox="0 0 620 300" preserveAspectRatio="none" aria-label="车辆模拟轨迹">
                    <path class="track-route-shadow" d="M52 236 L124 236 L124 72 L258 72 L258 150 L388 150 L388 52 L540 52 L540 242 L446 242 L446 190 L320 190 L320 258 L180 258" />
                    <path class="track-route" :style="trackRouteStyle" d="M52 236 L124 236 L124 72 L258 72 L258 150 L388 150 L388 52 L540 52 L540 242 L446 242 L446 190 L320 190 L320 258 L180 258" />
                    <circle class="track-car-glow" :cx="trackPosition.x" :cy="trackPosition.y" r="16" />
                    <circle class="track-car" :cx="trackPosition.x" :cy="trackPosition.y" r="8" />
                  </svg>
                  <span class="track-place a">文明大道</span><span class="track-place b">龙泉镇</span><span class="track-place c">马家乡</span>
                </div>
                <template v-if="activeEntityAction === '轨迹'">
                  <div class="track-toolbar">
                    <span>播放速度：</span>
                    <button v-for="speed in trackSpeeds" :key="speed" :class="{ active: trackSpeed === speed }" @click="selectTrackSpeed(speed)">{{ speed === 1 ? '正常' : `${speed}X` }}</button>
                    <strong>里程: <em>{{ (trackProgress * 61).toFixed(2) }}km</em></strong>
                  </div>
                  <div class="track-player">
                    <button class="track-play" @click="toggleTrackPlayback">{{ trackPlaying ? 'Ⅱ' : '▶' }}</button>
                    <div class="track-timeline" @click="seekTrack"><i :style="{ width: `${trackProgress * 100}%` }"><b /></i></div>
                  </div>
                  <div class="track-time"><span>开始时间: {{ trackDay }} 00:00:00</span><strong>{{ trackCurrentTime }}</strong><span>结束时间: {{ trackDay }} 23:59:59</span></div>
                </template>
                <template v-else>
                  <div class="live-track-info"><span><i />实时跟踪中</span><strong>速度 42km/h</strong><em>定位 {{ liveLocationTime }}</em></div>
                  <p class="action-hint">车辆位置与尾部轨迹每 2 秒自动刷新，展示最近一段行驶路径。</p>
                </template>
              </template>
              <template v-else-if="activeEntityAction === '视频'">
                <div class="video-grid">
                  <article v-for="camera in vehicleCameras" :key="camera.id" class="video-camera" :class="{ main: camera.id === 1 }">
                    <div class="video-feed"><i /><span>● LIVE</span><b>{{ camera.id === 1 ? '▶' : '▣' }}</b></div>
                    <footer><strong>{{ camera.name }}</strong><em>{{ camera.quality }} · 在线</em></footer>
                  </article>
                </div>
                <p class="action-hint">{{ selectedEntity.name }} · 5 路车载摄像头 · 4G 在线 · 实时预览</p>
              </template>
              <template v-else-if="activeEntityAction === '对讲'">
                <div class="video-placeholder" :class="{ connected: intercomConnected }">{{ intercomConnected ? '◉  正在与驾驶员对讲' : '◉  车辆对讲待接通' }}</div>
                <p class="action-hint">{{ intercomConnected ? `已接通 ${selectedProfile.driver || '驾驶员'}，语音通话中。` : `点击下方“对讲”接通 ${selectedProfile.driver || '驾驶员'}。` }}</p>
                <button class="talk-button" :class="{ connected: intercomConnected }" @click="toggleIntercom">{{ intercomConnected ? '结束对讲' : '对讲' }}</button>
              </template>
              <template v-else>
                <p class="action-hint">通过设备向 {{ selectedEntity.name }} 下发调度指令。</p>
                <div class="command-list"><button>立即前往任务点</button><button>更新任务状态</button><button>返回所属站点</button></div>
              </template>
            </aside>

            <aside v-if="selectedAlarmRow" class="alarm-detail-panel">
              <div class="panel-title">告警详细信息<button class="detail-close" @click="selectedAlarmRow = null">×</button></div>
              <div class="alarm-detail-head"><i :class="selectedAlarmRow.level" />{{ selectedAlarmRow.name }}<em>{{ selectedAlarmRow.read ? '已读' : '未读' }}</em></div>
              <div class="alarm-detail-grid">
                <div><span>告警时间</span><strong>{{ trackDay }} {{ selectedAlarmRow.time }}:00</strong></div><div><span>告警等级</span><strong>{{ selectedAlarmRow.level === 'danger' ? '严重' : '一般' }}</strong></div>
                <div><span>告警位置</span><strong>{{ selectedAlarmRow.place }}</strong></div><div><span>关联任务</span><strong>{{ selectedAlarmRow.taskNo || '暂未创建' }}</strong></div>
                <div><span>告警对象</span><strong>{{ selectedAlarmRow.boxNo }}</strong></div><div><span>触发规则</span><strong>{{ selectedAlarmRow.rule }}</strong></div>
                <div class="wide"><span>告警描述</span><strong>{{ selectedAlarmRow.description }}</strong></div>
              </div>
              <div class="alarm-detail-actions"><button @click="alarmTaskFormVisible = true">基于此快速创建收运单</button><button @click="toggleAlarmStar">{{ selectedAlarmRow.star ? '取消星标' : '添加星标' }}</button></div>
            </aside>

            <aside v-if="alarmTaskFormVisible && selectedAlarmRow" class="alarm-task-panel">
              <div class="panel-title">基于此消息快速创建任务单<button class="detail-close" @click="alarmTaskFormVisible = false">×</button></div>
              <div class="task-form-grid">
                <label>驾驶员<select v-model="alarmTaskForm.driver"><option v-for="driver in alarmDrivers" :key="driver" :value="driver">{{ driver }}</option></select></label>
                <label>车辆<select v-model="alarmTaskForm.vehicle"><option v-for="vehicle in alarmVehicles" :key="vehicle" :value="vehicle">{{ vehicle }}</option></select></label>
                <label>目的地<select v-model="alarmTaskForm.destination"><option v-for="destination in alarmDestinations" :key="destination" :value="destination">{{ destination }}</option></select></label>
                <label>时效要求<select v-model="alarmTaskForm.sla"><option v-for="sla in [30, 60, 90, 120]" :key="sla" :value="sla">{{ sla }}分钟</option></select></label>
                <label>优先级<select v-model="alarmTaskForm.priority"><option value="一般">一般</option><option value="紧急">紧急</option></select></label>
              </div>
              <button class="create-task-btn" @click="createTaskFromAlarm">确认创建收运单</button>
            </aside>
            <div v-if="taskCreatedNotice" class="task-created-toast">✓ 任务单创建好了：{{ taskCreatedNotice }}</div>

            <aside v-if="selectedTaskMonitor" class="task-detail-panel">
              <div class="panel-title">收运任务详情<button class="detail-close" @click="selectedTaskMonitor = null">×</button></div>
              <div class="task-detail-header">
                <div><strong>{{ selectedTaskMonitor.name }}</strong><span>{{ selectedTaskMonitor.id }} · {{ selectedTaskMonitor.orderNo }}</span></div>
                <em :class="selectedTaskMonitor.tone">{{ selectedTaskMonitor.status }}</em>
              </div>
              <section class="task-route-map">
                <svg viewBox="0 0 480 122" preserveAspectRatio="none" aria-label="任务收运路线">
                  <template v-if="selectedTaskMonitor.status === '收运中'">
                    <path class="completed" d="M54 92 C125 25, 197 108, 250 61" />
                    <path class="pending" d="M250 61 S360 24, 427 48" />
                  </template>
                  <path v-else :class="selectedTaskMonitor.status === '已完成' ? 'completed' : 'pending'" d="M54 92 C125 25, 197 108, 250 61 S360 24, 427 48" />
                  <circle class="route-start-dot" cx="54" cy="92" r="9" /><circle v-if="selectedTaskMonitor.status !== '收运中'" class="route-mid-dot" cx="250" cy="61" r="7" /><circle class="route-end-dot" cx="427" cy="48" r="10" />
                  <g v-if="selectedTaskMonitor.status === '收运中'" class="route-live-vehicle" transform="translate(250 61) rotate(-15)">
                    <rect class="truck-box" x="-18" y="-10" width="19" height="16" rx="2" /><rect class="truck-cab" x="1" y="-7" width="13" height="13" rx="2" />
                    <rect class="truck-window" x="8" y="-4" width="5" height="4" rx="1" /><circle cx="-12" cy="8" r="3" /><circle cx="11" cy="8" r="3" />
                  </g>
                </svg>
                <span class="route-start">始发地<br><b>{{ selectedTaskMonitor.origin }}</b></span>
                <span class="route-end">目的地<br><b>{{ selectedTaskMonitor.destination }}</b></span>
              </section>
              <section class="task-info-cards">
                <div><span>始发地</span><strong>{{ selectedTaskMonitor.origin }}</strong></div>
                <div><span>目的地</span><strong>{{ selectedTaskMonitor.destination }}</strong></div>
                <div><span>时效</span><strong>{{ selectedTaskMonitor.duration }}分钟 <em>要求 {{ selectedTaskMonitor.sla }}分钟</em></strong></div>
                <div><span>驾驶员 / 车辆</span><strong>{{ selectedTaskMonitor.driver }} / {{ selectedTaskMonitor.vehicle }}</strong></div>
                <div><span>称重</span><strong>{{ selectedTaskMonitor.weight }} 吨</strong></div>
              </section>
              <section class="task-detail-section">
                <h4>运单重点</h4>
                <div class="task-focus"><span>当前状态<b>{{ selectedTaskMonitor.status }}</b></span><span>满溢率<b class="danger">{{ selectedTaskMonitor.fillRate }}%</b></span><span>时效要求<b>{{ selectedTaskMonitor.sla }}分钟 / {{ selectedTaskMonitor.duration }}分钟</b></span></div>
              </section>
              <section class="task-detail-section">
                <h4>关键事件</h4>
                <ol class="task-timeline"><li v-for="event in selectedTaskMonitor.events" :key="event.time"><b>{{ event.name }}</b><span>{{ event.place }}</span><em>{{ event.time }}</em></li></ol>
              </section>
              <section class="task-detail-section">
                <h4>辅助信息</h4>
                <div class="task-assist-grid"><span>来源告警<strong>{{ selectedTaskMonitor.alarmNo }}</strong></span><span>箱体<strong>{{ selectedTaskMonitor.box }}</strong></span><span>所属乡镇<strong>{{ selectedTaskMonitor.town }}</strong></span><span>司机电话<strong>{{ selectedTaskMonitor.phone }}</strong></span></div>
              </section>
              <section v-if="selectedTaskMonitor.status !== '已完成'" class="task-operation-section">
                <button class="force-complete-btn" @click="forceCompleteTask">强制完成</button>
                <button class="transfer-task-btn" @click="openTaskTransfer">转单</button>
              </section>
              <section v-if="taskTransferVisible" class="task-transfer-form">
                <span>转交至</span><select v-model="taskTransferTarget"><option v-for="item in taskTransferTargets" :key="item.name" :value="item.name">{{ item.name }} · {{ item.vehicle }}</option></select>
                <button @click="confirmTaskTransfer">确认转单</button><button class="cancel" @click="taskTransferVisible = false">取消</button>
              </section>
            </aside>
            <div v-if="taskActionNotice" class="task-action-toast">✓ {{ taskActionNotice }}</div>
            <aside v-if="selectedBoxMonitor" class="box-detail-panel">
              <div class="panel-title">{{ selectedBoxMonitor.type === 'small' ? '小勾臂箱' : '大勾臂箱' }}详情<button class="detail-close" @click="selectedBoxMonitor = null">×</button></div>
              <div class="box-detail-title"><strong>{{ selectedBoxMonitor.name }}</strong><span>{{ selectedBoxMonitor.code }}</span></div>
              <div class="box-detail-grid">
                <div><span>在线状态</span><strong :class="selectedBoxMonitor.online === '在线' ? 'success' : 'danger'">{{ selectedBoxMonitor.online }}</strong></div><div><span>满溢状态</span><strong :class="selectedBoxMonitor.overflow === '满溢' ? 'danger' : 'success'">{{ selectedBoxMonitor.overflow }}</strong></div>
                <div v-if="selectedBoxMonitor.type === 'small'"><span>电量状态</span><strong :class="selectedBoxMonitor.batteryStatus === '低电量' ? 'warning' : 'success'">{{ selectedBoxMonitor.batteryStatus }}</strong></div><div v-if="selectedBoxMonitor.type === 'small'"><span>温度状态</span><strong :class="selectedBoxMonitor.temperatureStatus === '高温' ? 'danger' : 'success'">{{ selectedBoxMonitor.temperatureStatus }}</strong></div>
                <div class="wide"><span>匹配对象</span><strong>{{ selectedBoxMonitor.match }}</strong></div><div class="wide"><span>当前位置</span><strong>{{ selectedBoxMonitor.location }}</strong></div>
                <div><span>垃圾占比</span><strong :class="{ danger: selectedBoxMonitor.fillRate >= 90 }">{{ selectedBoxMonitor.fillRate }}%</strong></div><div v-if="selectedBoxMonitor.type === 'small'"><span>温度 / 电量</span><strong>{{ selectedBoxMonitor.temperature }}℃ / {{ selectedBoxMonitor.battery }}%</strong></div>
              </div>
            </aside>
            <aside v-if="selectedSafetyMonitor" class="safety-detail-panel">
              <div class="panel-title">主动安全告警详情<button class="detail-close" @click="selectedSafetyMonitor = null">×</button></div>
              <div class="safety-detail-title"><strong>{{ selectedSafetyMonitor.type }}</strong><span>{{ selectedSafetyMonitor.time }} · {{ selectedSafetyMonitor.vehicle }} · {{ selectedSafetyMonitor.driver }}</span></div>
              <section class="safety-location-map"><i>●</i><span>{{ selectedSafetyMonitor.place }}</span><em>告警位置</em></section>
              <section class="safety-attachment"><div class="attachment-title">告警附件 <span>{{ activeSafetyAttachment.kind === 'video' ? '视频' : '图片' }} · {{ safetyAttachmentIndex + 1 }}/{{ safetyAttachments.length }}</span></div><div class="attachment-stage" :class="[activeSafetyAttachment.kind, { playing: safetyVideoPlaying }]"><button class="attachment-nav prev" @click="changeSafetyAttachment(-1)">‹</button><div class="attachment-content" @click="activeSafetyAttachment.kind === 'video' && (safetyVideoPlaying = !safetyVideoPlaying)"><span>{{ activeSafetyAttachment.kind === 'video' ? (safetyVideoPlaying ? '▮▮ 视频播放中' : '▶ 点击播放视频') : '▣ 现场抓拍图片' }}</span><b>{{ activeSafetyAttachment.label }}</b></div><button class="attachment-nav next" @click="changeSafetyAttachment(1)">›</button></div><div class="attachment-dots"><i v-for="(item, index) in safetyAttachments" :key="`${item.kind}-${index}`" :class="{ active: index === safetyAttachmentIndex }" @click="safetyAttachmentIndex = index" /></div></section>
              <div class="safety-detail-grid"><div><span>车速</span><strong>{{ selectedSafetyMonitor.speed }} km/h</strong></div><div><span>告警等级</span><strong :class="selectedSafetyMonitor.tone">{{ selectedSafetyMonitor.level }}</strong></div><div class="wide"><span>告警地址</span><strong>{{ selectedSafetyMonitor.place }}</strong></div></div>
            </aside>
          </main>

          <aside class="right-rail">
            <div class="right-tabs">
              <button v-for="tab in rightTabs" :key="tab.key" :class="{ active: activeRightTab === tab.key }" @click="activeRightTab = tab.key">
                {{ tab.label }}
              </button>
            </div>

            <PanelCard v-if="activeRightTab === 'alarm'" title="" class="right-card">
              <div class="alarm-stats">
                <button v-for="item in alarmStats" :key="item.label" :class="{ active: activeAlarmFilter === item.key }" @click="activeAlarmFilter = item.key">
                  <span>{{ item.label }}</span>
                  <strong :class="item.tone">{{ item.value }}</strong>
                </button>
              </div>
              <div class="alarm-table">
                <div class="table-head">
                  <span>时间</span><span>类型</span><span>位置</span><span>星标</span><span>关联任务</span>
                </div>
                <div v-for="item in filteredAlarmRows" :key="item.id" class="alarm-row clickable" @click="openAlarmDetail(item)">
                  <span><i :class="item.level" />{{ formatAlarmTime(item) }}</span>
                  <span>{{ item.name }}</span>
                  <span>{{ item.place }}</span>
                  <em>{{ item.star ? '★' : '☆' }}</em>
                  <span>{{ item.taskNo || '-' }}</span>
                </div>
              </div>
            </PanelCard>

            <PanelCard v-else title="" class="right-card">
              <template v-if="activeRightTab === 'task'">
                <div class="tab-stats-grid">
                  <button v-for="item in taskMonitorStats" :key="item.key" :class="{ active: activeTaskFilter === item.key }" @click="activeTaskFilter = item.key">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </button>
                </div>
                <div class="monitor-list">
                  <button v-for="item in filteredTaskMonitorRows" :key="item.id" class="monitor-row task-monitor-row clickable" @click="openTaskMonitorDetail(item)">
                    <div><strong>{{ item.name }}</strong><div class="task-row-second"><span>{{ item.route }}</span><span class="task-row-meta">{{ item.vehicle }} · {{ item.vehicleType }} · {{ item.driver }}</span></div></div>
                    <div class="task-row-tags"><em :class="item.tone">{{ item.status }}</em><em v-if="item.overtimeStatus === '已超时'" :class="item.overtimeTone">{{ item.overtimeStatus }}</em></div>
                  </button>
                </div>
              </template>
              <template v-else-if="activeRightTab === 'box'">
                <div class="tab-stats-grid box-stats-grid">
                  <button v-for="item in boxMonitorStats" :key="item.key" :class="{ active: activeBoxType === item.key }" @click="activeBoxType = item.key">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </button>
                </div>
                <div class="box-monitor-table" :class="activeBoxType">
                  <div class="box-table-head"><span>箱体名称</span><span>编号</span><span>在线</span><span>满溢</span><span v-if="activeBoxType === 'small'">电量</span><span v-if="activeBoxType === 'small'">温度</span><span>垃圾占比</span></div>
                  <button v-for="item in filteredBoxMonitorRows" :key="item.id" class="box-table-row" @click="openBoxMonitorDetail(item)">
                    <span>{{ item.name }}</span><span>{{ item.code }}</span><em :class="item.online === '在线' ? 'success' : 'danger'">{{ item.online }}</em><em :class="item.overflow === '满溢' ? 'danger' : 'success'">{{ item.overflow }}</em><em v-if="activeBoxType === 'small'" :class="item.batteryStatus === '低电量' ? 'warning' : 'success'">{{ item.batteryStatus }}</em><em v-if="activeBoxType === 'small'" :class="item.temperatureStatus === '高温' ? 'danger' : 'success'">{{ item.temperatureStatus }}</em><strong :class="{ danger: item.fillRate >= 90 }">{{ item.fillRate }}%</strong>
                  </button>
                </div>
              </template>
              <template v-else-if="activeRightTab === 'vehicle'">
                <div class="vehicle-plate-search"><span>车牌号</span><input v-model="vehiclePlateSearch" list="vehicle-plate-options" placeholder="输入或选择车牌号" /><datalist id="vehicle-plate-options"><option v-for="item in vehicleMonitorRows" :key="item.id" :value="item.plate" /></datalist></div>
                <div class="tab-stats-grid vehicle-type-stats">
                  <button v-for="item in vehicleTypeStats" :key="item.key" :class="{ active: activeVehicleType === item.key }" @click="activeVehicleType = item.key">
                    <span>{{ item.label }}</span>
                    <strong :class="item.tone">{{ item.value }}</strong>
                  </button>
                </div>
                <div class="vehicle-status-filters">
                  <button v-for="item in vehicleStatusFilters" :key="item.key" :class="{ active: activeVehicleStatus === item.key }" @click="activeVehicleStatus = item.key">{{ item.label }}</button>
                </div>
                <div class="monitor-list">
                  <button v-for="item in filteredVehicleMonitorRows" :key="item.id" class="monitor-row vehicle-monitor-row clickable" @click="openVehicleMonitorDetail(item)">
                    <div><strong>{{ item.plate }}</strong><span class="vehicle-row-meta"> · {{ item.driver }} · {{ item.type }}</span></div>
                    <div class="vehicle-row-tags"><em :class="item.tone">{{ item.status }}</em><em v-if="item.collecting" class="collecting">收运中</em></div>
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="safety-table">
                  <div class="safety-table-head"><span>告警类型</span><span>时间</span><span>车牌号</span><span>地址</span><span>驾驶员</span><span>车速</span></div>
                  <button v-for="item in safetyMonitorRows" :key="item.id" class="safety-table-row" @click="openSafetyDetail(item)"><span><i :class="item.tone" />{{ item.type }}</span><span>{{ item.time }}</span><span>{{ item.vehicle }}</span><span>{{ item.place }}</span><span>{{ item.driver }}</span><strong>{{ item.speed }}km/h</strong></button>
                </div>
              </template>
            </PanelCard>
          </aside>

          <div v-if="showLayoutMetrics" class="layout-guide-layer" aria-hidden="true">
            <div v-for="(item, index) in layoutMetrics" :key="item.key" class="layout-guide-cell">
              <span><b>{{ index + 1 }}</b>{{ item.label }} · {{ item.width }}px · {{ item.ratio }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type EChartsOption, graphic } from 'echarts'
import { type CSSProperties, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { longanVillageArchives, wgs84ToGcj02 } from './data/longan-archive'
import { commandCenterPrdSections } from './data/command-center-july-v2-prd'
import assetHealthBox from '@/assets/images/command-center/asset-health-box.png'
import assetHealthVehicle from '@/assets/images/command-center/asset-health-vehicle.png'
import assetHealthTricycle from '@/assets/images/command-center/asset-health-tricycle.png'

defineOptions({ name: 'SanitationCommandCenterJulyV2' })

interface MapEntity {
  id: string
  type: '车辆' | '箱体' | '告警' | '任务' | '收集点' | '中转站' | '焚烧厂'
  layer: string
  kind: string
  status: string
  icon: string
  name: string
  lng: number
  lat: number
  alarm?: boolean
  pulse?: boolean
  onlineText: string
  statusTags?: Array<'满溢' | '低电量' | '高温'>
  image?: string
  details: Array<{ label: string, value: string }>
  relations: Array<{ label: string, value: string }>
}

const DESIGN_WIDTH = 4784
const DESIGN_HEIGHT = 1560
const LAYOUT_PADDING = 14
const LAYOUT_GAP = 14
const LAYOUT_STATISTICS_WIDTH = 520
const LAYOUT_CHARTS_WIDTH = 800
const LAYOUT_DISPATCH_WIDTH = 900
const LAYOUT_FIXED_WIDTH = LAYOUT_STATISTICS_WIDTH + LAYOUT_CHARTS_WIDTH + LAYOUT_DISPATCH_WIDTH
const LAYOUT_SPACING_WIDTH = LAYOUT_PADDING * 2 + LAYOUT_GAP * 3
const LAYOUT_MAP_WIDTH = DESIGN_WIDTH - LAYOUT_FIXED_WIDTH - LAYOUT_SPACING_WIDTH
const formatLayoutRatio = (width: number) => ((width / DESIGN_WIDTH) * 100).toFixed(2)
const resolutionMode = ref<'formal' | 'test'>('test')
const showPrd = ref(false)
const showLayoutMetrics = ref(true)
const layoutMetrics = [
  { key: 'statistics', label: '最左侧数据统计区', width: LAYOUT_STATISTICS_WIDTH, ratio: formatLayoutRatio(LAYOUT_STATISTICS_WIDTH) },
  { key: 'charts', label: '左中侧图表区', width: LAYOUT_CHARTS_WIDTH, ratio: formatLayoutRatio(LAYOUT_CHARTS_WIDTH) },
  { key: 'map', label: '中间地图区', width: LAYOUT_MAP_WIDTH, ratio: formatLayoutRatio(LAYOUT_MAP_WIDTH) },
  { key: 'dispatch', label: '右侧调度区', width: LAYOUT_DISPATCH_WIDTH, ratio: formatLayoutRatio(LAYOUT_DISPATCH_WIDTH) },
]
const layoutSpacingMetric = { width: LAYOUT_SPACING_WIDTH, ratio: formatLayoutRatio(LAYOUT_SPACING_WIDTH) }
const dashboardLayoutStyle = {
  '--layout-statistics-width': `${LAYOUT_STATISTICS_WIDTH}px`,
  '--layout-charts-width': `${LAYOUT_CHARTS_WIDTH}px`,
  '--layout-dispatch-width': `${LAYOUT_DISPATCH_WIDTH}px`,
} as CSSProperties
const prdSections = commandCenterPrdSections
const settingsOpen = ref(false)
const organizations = ['龙安区环卫中心', '马投涧镇环卫站', '龙泉镇环卫站', '文明大道街道办']
const selectedOrganization = ref(organizations[0])
const headerNotice = ref('')
function notifyHeader(message: string) { headerNotice.value = message; window.setTimeout(() => { headerNotice.value = '' }, 2200) }
async function toggleFullscreen() { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.() }
function refreshDashboard() { notifyHeader('数据已刷新') }
function saveOrganization() { settingsOpen.value = false; notifyHeader(`已切换至${selectedOrganization.value}`) }
const stageViewportRef = ref<HTMLElement>()
const autoTestScale = ref(0.35)
const screenScale = computed(() => resolutionMode.value === 'formal' ? 1 : autoTestScale.value)
const stageViewportStyle = computed(() => ({
  width: `${DESIGN_WIDTH * screenScale.value}px`,
  height: `${DESIGN_HEIGHT * screenScale.value}px`,
}))

type MapThemeKey = 'darkblue' | 'dark' | 'blue'
interface MapTheme {
  key: MapThemeKey
  label: string
  color: string
}

const activeMapTheme = ref<MapThemeKey>('blue')
const mapThemeMenuOpen = ref(false)
const mapThemes: MapTheme[] = [
  { key: 'darkblue', label: '极夜蓝', color: 'linear-gradient(135deg, #031525, #075b91)' },
  { key: 'dark', label: '幻影黑', color: 'linear-gradient(135deg, #02050a, #293543)' },
  { key: 'blue', label: '靛青蓝', color: 'linear-gradient(135deg, #062849, #1686c7)' },
]
const currentMapTheme = computed(() => mapThemes.find((theme) => theme.key === activeMapTheme.value) || mapThemes[0])

function selectMapTheme(theme: MapThemeKey) {
  activeMapTheme.value = theme
  mapThemeMenuOpen.value = false
}

interface AMapInstance {
  destroy: () => void
  getZoom: () => number
  setMapStyle: (style: string) => void
  setZoom: (zoom: number, immediately?: boolean) => void
}

interface AMapNamespace {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapInstance
}

let resizeObserver: ResizeObserver | undefined
const v2MapBaseRef = ref<HTMLDivElement>()
const mapEngineError = ref('')
let v2BaseMap: AMapInstance | null = null
let wheelZoomTimer: number | undefined
let pendingWheelZoom = 0
let amapLoader: Promise<AMapNamespace> | undefined

function amapStyle(theme: MapThemeKey) {
  return `amap://styles/${theme}`
}

function getAmapNamespace() {
  return window as typeof window & {
    AMap?: AMapNamespace
    _AMapSecurityConfig?: { securityJsCode?: string }
  }
}

function loadAmapJsApi() {
  const amapWindow = getAmapNamespace()
  if (amapWindow.AMap) return Promise.resolve(amapWindow.AMap)
  if (amapLoader) return amapLoader

  const env = import.meta.env as Record<string, string | undefined>
  const key = env.VITE_AMAP_JS_KEY || env.VITE_AMAP_KEY
  if (!key) return Promise.reject(new Error('缺少 VITE_AMAP_JS_KEY 高德 JS API Key'))

  if (env.VITE_AMAP_SECURITY_JS_CODE) {
    amapWindow._AMapSecurityConfig = { securityJsCode: env.VITE_AMAP_SECURITY_JS_CODE }
  }

  amapLoader = new Promise<AMapNamespace>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = window.setTimeout(() => reject(new Error('高德 JS API 加载超时')), 12000)
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.async = true
    script.onload = () => {
      window.clearTimeout(timeout)
      const amap = getAmapNamespace().AMap
      if (amap) resolve(amap)
      else reject(new Error('高德 JS API 未初始化'))
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error('高德 JS API 加载失败'))
    }
    document.head.appendChild(script)
  })

  return amapLoader
}

async function initV2BaseMap() {
  if (!v2MapBaseRef.value) return
  try {
    const AMap = await loadAmapJsApi()
    v2BaseMap?.destroy()
    v2BaseMap = new AMap.Map(v2MapBaseRef.value, {
      center: [114.30, 36.07],
      zoom: 13,
      zooms: [11, 18],
      viewMode: '2D',
      mapStyle: amapStyle(activeMapTheme.value),
      animateEnable: false,
      jogEnable: false,
      resizeEnable: true,
      zoomEnable: false,
      doubleClickZoom: false,
      keyboardEnable: false,
      scrollWheel: false,
      showIndoorMap: false,
    })
    mapEngineError.value = ''
  } catch {
    mapEngineError.value = '高德官方主题加载失败：请配置 JS API Key，并在控制台绑定当前访问域名。'
  }
}

function updateTestScale() {
  if (!stageViewportRef.value || resolutionMode.value !== 'test') return
  const parent = stageViewportRef.value.parentElement
  if (!parent) return
  const availableWidth = parent.clientWidth - 16
  const availableHeight = Math.max(520, window.innerHeight - 132)
  autoTestScale.value = Math.min(1, availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT)
}

onMounted(() => {
  nextTick(updateTestScale)
  window.setTimeout(initV2BaseMap, 100)
  resizeObserver = new ResizeObserver(updateTestScale)
  if (stageViewportRef.value?.parentElement) {
    resizeObserver.observe(stageViewportRef.value.parentElement)
  }
  window.addEventListener('resize', updateTestScale)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateTestScale)
  if (wheelZoomTimer !== undefined) {
    window.clearTimeout(wheelZoomTimer)
  }
  if (trackTimer !== undefined) {
    window.clearInterval(trackTimer)
  }
  if (v2BaseMap) {
    v2BaseMap.destroy()
    v2BaseMap = null
  }
})

watch(resolutionMode, () => nextTick(updateTestScale))

const archiveStats = [
  { icon: '▥', value: '8', unit: '个', label: '乡镇' },
  { icon: '⌂', value: '157', unit: '个', label: '村庄' },
  { icon: '▣', value: '370', unit: '个', label: '小勾臂箱' },
  { icon: '▤', value: '12', unit: '个', label: '大勾臂箱' },
  { icon: '♙', value: '540', unit: '辆', label: '小三轮车' },
  { icon: '♜', value: '20', unit: '台', label: '小勾臂车' },
  { icon: '▰', value: '6', unit: '台', label: '大勾臂车' },
  { icon: '☷', value: '约 19 万', unit: '人', label: '覆盖人口' },
]

const operationStats = [
  { icon: '◫', label: '累计清运', value: '285.6', unit: '吨' },
  { icon: '▣', label: '累计趟次', value: '642', unit: '趟' },
  { icon: '◉', label: '累计里程', value: '3,856', unit: '公里' },
  { icon: '◷', label: '平均响应', value: '18.6', unit: '分钟' },
  { icon: '◇', label: '安全运行', value: '128', unit: '天' },
]
const assetHealthStats = [
  { key: 'box', asset: assetHealthBox, label: '箱体', count: 382, unit: '个', health: 98, abnormal: 8, tone: 'success', exceptions: [{ name: '徐家口村小勾臂箱', code: 'XB-DF-008', location: '东风乡徐家口村', lastOnline: '2026-07-10 08:16', days: 3 }, { name: '马投涧大勾臂箱', code: 'DB-MTJ-005', location: '马投涧镇工业路', lastOnline: '2026-07-09 19:42', days: 4 }] },
  { key: 'vehicle', asset: assetHealthVehicle, label: '车辆', count: 26, unit: '台', health: 97, abnormal: 1, tone: 'warning', exceptions: [{ name: '豫E5Q381', code: 'ADAS-E5Q381', location: '龙泉镇南街', lastOnline: '2026-07-10 07:32', days: 3 }] },
  { key: 'tricycle', asset: assetHealthTricycle, label: '小三轮', count: 540, unit: '辆', health: 95, abnormal: 27, tone: 'danger', exceptions: [{ name: '豫E9T266', code: 'TRI-E9T266', location: '善应镇北村', lastOnline: '2026-07-09 16:20', days: 4 }, { name: '豫E7L126', code: 'TRI-E7L126', location: '文明大道街道', lastOnline: '2026-07-10 09:55', days: 3 }] },
]
const townWasteRank = [
  { name: '龙泉镇', value: 186 },
  { name: '马家乡', value: 168 },
  { name: '彰武街道', value: 151 },
  { name: '东风乡', value: 136 },
  { name: '罗庄镇', value: 118 },
  { name: '善应镇', value: 96 },
  { name: '太行街道', value: 84 },
  { name: '文明大道街道', value: 72 },
]

const wasteTrend = [
  { date: '06-19', value: 210 },
  { date: '06-20', value: 238 },
  { date: '06-21', value: 196 },
  { date: '06-22', value: 265 },
  { date: '06-23', value: 228 },
  { date: '06-24', value: 252 },
  { date: '06-25', value: 241 },
]

const driverRank = [
  { name: '张师傅', tasks: 42, rate: 98 },
  { name: '李师傅', tasks: 39, rate: 97 },
  { name: '王师傅', tasks: 36, rate: 96 },
  { name: '赵师傅', tasks: 34, rate: 95 },
  { name: '陈师傅', tasks: 31, rate: 94 },
  { name: '郑师傅', tasks: 28, rate: 93 },
  { name: '孙师傅', tasks: 26, rate: 92 },
]

const ontimeTaskTrend = [
  { date: '06-19', tasks: 188, rate: 94 },
  { date: '06-20', tasks: 205, rate: 96 },
  { date: '06-21', tasks: 176, rate: 93 },
  { date: '06-22', tasks: 232, rate: 98 },
  { date: '06-23', tasks: 218, rate: 95 },
  { date: '06-24', tasks: 246, rate: 99 },
  { date: '06-25', tasks: 226, rate: 96 },
]

const chartTextColor = '#b8d8f2'
const chartGridColor = 'rgba(72, 174, 255, 0.14)'
const axisLabel = {
  color: chartTextColor,
  fontSize: 11,
}
const formalAxisLabel = {
  color: chartTextColor,
  fontSize: 18,
}

function chartFontSize(testSize: number, formalSize: number) {
  return resolutionMode.value === 'formal' ? formalSize : testSize
}

function chartSpace(testSize: number, formalSize: number) {
  return resolutionMode.value === 'formal' ? formalSize : testSize
}

const townWasteChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(12, 22),
    right: chartSpace(52, 170),
    bottom: chartSpace(8, 20),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: '{b}<br/>昨日垃圾量：{c} 吨',
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...(resolutionMode.value === 'formal' ? formalAxisLabel : axisLabel) },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: townWasteRank.map((item) => item.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#d7ecff', fontSize: chartFontSize(12, 24), margin: 10, interval: 0 },
  },
  series: [{
    type: 'bar',
    data: townWasteRank.map((item) => item.value),
    barWidth: '48%',
    showBackground: true,
    backgroundStyle: { color: 'rgba(55, 126, 180, 0.14)', borderRadius: 8 },
    itemStyle: {
      borderRadius: [0, 8, 8, 0],
      color: new graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: 'rgba(36, 107, 255, 0.72)' },
        { offset: 0.55, color: '#24d6ff' },
        { offset: 1, color: '#83fff1' },
      ]),
      shadowBlur: 14,
      shadowColor: 'rgba(36, 214, 255, 0.35)',
    },
    label: {
      show: true,
      position: 'right',
      color: '#e5fbff',
      fontSize: chartFontSize(11, 22),
      formatter: '{c} 吨',
    },
  }],
  animation: false,
}))

const wasteTrendChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(22, 38),
    right: chartSpace(28, 70),
    bottom: chartSpace(14, 28),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: '{b}<br/>清运量：{c} 吨',
  },
  xAxis: {
    type: 'category',
    // 给首尾数据点留出半个类目宽度，避免正式分辨率下数值标签与纵轴、右边界相撞。
    boundaryGap: true,
    data: wasteTrend.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(96, 164, 220, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  series: [{
    type: 'line',
    data: wasteTrend.map((item) => item.value),
    smooth: true,
    symbol: 'circle',
    symbolSize: chartFontSize(7, 14),
    lineStyle: {
      width: chartFontSize(3, 6),
      color: '#38f58b',
      shadowBlur: 14,
      shadowColor: 'rgba(56, 245, 139, 0.45)',
    },
    itemStyle: { color: '#eafff2', borderColor: '#38f58b', borderWidth: 2 },
    areaStyle: {
      color: new graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(56, 245, 139, 0.34)' },
        { offset: 1, color: 'rgba(56, 245, 139, 0.02)' },
      ]),
    },
    label: {
      show: true,
      color: '#c8ffd9',
      fontSize: chartFontSize(10, 19),
      formatter: '{c}',
    },
  }],
  animation: false,
}))

const driverRankChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(12, 22),
    right: chartSpace(76, 220),
    bottom: chartSpace(10, 22),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: (params: any) => {
      const point = Array.isArray(params) ? params[0] : params
      const item = driverRank[point?.dataIndex ?? 0]
      return `${item.name}<br/>任务量：${item.tasks} 单<br/>准点率：${item.rate}%`
    },
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: driverRank.map((item) => item.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#d7ecff', fontSize: chartFontSize(12, 24), margin: 10, interval: 0 },
  },
  series: [
    {
      name: '任务量',
      type: 'bar',
      data: driverRank.map((item) => item.tasks),
      barWidth: '46%',
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: new graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(22, 103, 255, 0.68)' },
          { offset: 1, color: '#20e7ff' },
        ]),
        shadowBlur: 14,
        shadowColor: 'rgba(32, 231, 255, 0.35)',
      },
      label: {
        show: true,
        position: 'right',
        distance: chartSpace(6, 12),
        formatter: (params: any) => {
          const item = driverRank[params.dataIndex]
          return `{tasks|${item.tasks} 单}  {rate|${item.rate}%}`
        },
        rich: {
          tasks: { color: '#e7f7ff', fontSize: chartFontSize(11, 22) },
          rate: { color: '#43f08f', fontSize: chartFontSize(11, 22) },
        },
      },
    },
  ],
  animation: false,
}))

const ontimeTaskChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(32, 62),
    right: chartSpace(46, 86),
    bottom: chartSpace(16, 30),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  legend: {
    top: 0,
    right: 4,
    itemWidth: chartFontSize(12, 22),
    itemHeight: chartFontSize(8, 14),
    textStyle: { color: '#aac9e5', fontSize: chartFontSize(10, 20) },
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
  },
  xAxis: {
    type: 'category',
    data: ontimeTaskTrend.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(96, 164, 220, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20), interval: 0 },
  },
  yAxis: [
    {
      type: 'value',
      name: '单',
      splitLine: { lineStyle: { color: chartGridColor } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
      nameTextStyle: { color: chartTextColor, fontSize: chartFontSize(10, 18) },
    },
    {
      type: 'value',
      min: 90,
      max: 100,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20), formatter: '{value}%' },
      nameTextStyle: { color: chartTextColor, fontSize: chartFontSize(10, 18) },
    },
  ],
  series: [
    {
      name: '任务数',
      type: 'bar',
      data: ontimeTaskTrend.map((item) => item.tasks),
      barWidth: '32%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2ee7ff' },
          { offset: 1, color: 'rgba(27, 99, 255, 0.38)' },
        ]),
        shadowBlur: 14,
        shadowColor: 'rgba(46, 231, 255, 0.32)',
      },
    },
    {
      name: '准点率',
      type: 'line',
      yAxisIndex: 1,
      data: ontimeTaskTrend.map((item) => item.rate),
      smooth: true,
      symbol: 'circle',
      symbolSize: chartFontSize(7, 14),
      lineStyle: { width: chartFontSize(3, 6), color: '#43f08f' },
      itemStyle: { color: '#f4fff7', borderColor: '#43f08f', borderWidth: 2 },
      label: {
        show: true,
        color: '#caffdc',
        fontSize: chartFontSize(10, 18),
        formatter: '{c}%',
      },
    },
  ],
  animation: false,
}))

const mapKpis = [
  { label: '今日垃圾量', value: '1,280', unit: '吨' },
  { label: '今日任务', value: '256', unit: '单' },
  { label: '待接单', value: '32', unit: '单' },
  { label: '收运中', value: '128', unit: '单' },
  { label: '已完成', value: '108', unit: '单' },
  { label: '已超时', value: '20', unit: '单' },
]

// 使用 Vite 的基础路径，兼容 GitHub Pages 在 /continew-admin-ui/ 子路径下部署。
const MAP_ICON_BASE = `${import.meta.env.BASE_URL}static/images/command-center-v2/map-icons`
const mapLayerIconMap: Record<string, string> = {
  smallTruck: `${MAP_ICON_BASE}/tricycle.png`,
  hookTruck: `${MAP_ICON_BASE}/hook-truck.png`,
  largeTruck: `${MAP_ICON_BASE}/large-hook-truck.png`,
  smallBox: `${MAP_ICON_BASE}/small-box.png`,
  largeBox: `${MAP_ICON_BASE}/large-box.png`,
  collectionPoint: `${MAP_ICON_BASE}/collection-point.png`,
  station: `${MAP_ICON_BASE}/transfer-station.png`,
  plant: `${MAP_ICON_BASE}/incineration-plant.png`,
  alarm: `${MAP_ICON_BASE}/alarm-beacon.png`,
}

watch(activeMapTheme, (theme) => {
  v2BaseMap?.setMapStyle(amapStyle(theme))
})

const chartInitOptions = computed(() => ({
  renderer: 'canvas' as const,
  // 测试模式会整体缩放 4784px 画布，降低像素比可显著减少四张图表的绘制面积。
  devicePixelRatio: resolutionMode.value === 'test' ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
}))

const LONGAN_BOUNDS = {
  west: 113.985,
  east: 114.365,
  south: 35.955,
  north: 36.115,
}

const vehicleImage
  = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 130"><rect x="32" y="45" width="128" height="48" rx="8" fill="%23dff7ef" stroke="%2325d36f" stroke-width="5"/><rect x="150" y="60" width="38" height="33" rx="5" fill="%23e8fff7" stroke="%2325d36f" stroke-width="5"/><rect x="48" y="56" width="34" height="20" fill="%239bd7ff"/><rect x="92" y="56" width="36" height="20" fill="%239bd7ff"/><circle cx="66" cy="98" r="14" fill="%2320262e"/><circle cx="160" cy="98" r="14" fill="%2320262e"/><path d="M36 42h122l-10-18H52z" fill="%2325d36f"/></svg>'

const mapEntities = ref<MapEntity[]>([
  {
    id: 'v1',
    type: '车辆',
    layer: 'smallTruck',
    kind: 'truck-small',
    status: 'online',
    icon: '▣',
    name: '豫E01622D',
    lng: 114.2986,
    lat: 36.0952,
    onlineText: '在线  运行中',
    image: vehicleImage,
    details: [
      { label: '车辆类型', value: '小三轮车' },
      { label: '车牌号', value: '豫E01622D' },
      { label: '司机', value: '张师傅 138****6622' },
      { label: '速度', value: '35 km/h' },
      { label: '方向', value: '东北' },
      { label: '任务', value: '乡镇A-村庄3-收运' },
      { label: '位置', value: '文明大道与龙安路交叉口' },
      { label: '上报时间', value: '10:30:30' },
    ],
    relations: [
      { label: '正在服务箱体', value: '2 个' },
      { label: '附近告警', value: '1 条未处理' },
      { label: '当前任务进度', value: '65%' },
    ],
  },
  { id: 'v2', type: '车辆', layer: 'hookTruck', kind: 'truck-hook', status: 'online', icon: '▣', name: '豫E3G516', lng: 114.3268, lat: 36.0724, onlineText: '在线  收运中', details: [{ label: '车辆类型', value: '小勾臂车' }, { label: '司机', value: '李师傅' }, { label: '速度', value: '42 km/h' }, { label: '任务', value: '箱体满溢收运' }], relations: [{ label: '关联箱体', value: 'XB-龙泉-008' }] },
  { id: 'v3', type: '车辆', layer: 'largeTruck', kind: 'truck-large', status: 'online', icon: '▣', name: '豫E6N109', lng: 114.2442, lat: 36.0648, onlineText: '在线  转运中', details: [{ label: '车辆类型', value: '大勾臂车' }, { label: '司机', value: '孙师傅' }, { label: '速度', value: '48 km/h' }, { label: '载重', value: '13.8 吨' }], relations: [{ label: '目的地', value: '焚烧厂' }] },
  { id: 'b1', type: '箱体', layer: 'smallBox', kind: 'small-box', status: 'warning', icon: '▥', name: 'XB-012', lng: 114.3098, lat: 36.0872, alarm: true, onlineText: '在线  满溢预警', details: [{ label: '箱体类型', value: '小勾臂箱' }, { label: '满溢率', value: '92%' }, { label: '电量', value: '68%' }, { label: '位置', value: '马投涧镇牛家窑村' }], relations: [{ label: '待处理告警', value: '满溢告警' }] },
  { id: 'b2', type: '箱体', layer: 'largeBox', kind: 'large-box', status: 'danger', icon: '▤', name: 'DB-005', lng: 114.2796, lat: 36.0544, alarm: true, onlineText: '在线  严重满溢', details: [{ label: '箱体类型', value: '大勾臂箱' }, { label: '满溢率', value: '96%' }, { label: '所属站点', value: '马投涧中转站' }], relations: [{ label: '建议任务', value: '大勾臂车转运' }] },
  { id: 'c1', type: '任务', layer: 'collectionPoint', kind: 'collection', status: 'online', icon: '●', name: '收集点', lng: 114.3568, lat: 36.0676, onlineText: '运行正常', details: [{ label: '收集点', value: '文明大道收集点' }, { label: '服务范围', value: '3 个村庄' }, { label: '今日投放', value: '4.8 吨' }], relations: [{ label: '附近车辆', value: '2 辆' }] },
  { id: 's1', type: '箱体', layer: 'station', kind: 'station', status: 'online', icon: '⌂', name: '中转站', lng: 114.3245, lat: 36.0462, onlineText: '运行正常', details: [{ label: '站点名称', value: '文明大道中转站' }, { label: '在站箱体', value: '4 个' }, { label: '今日进站', value: '28 趟' }], relations: [{ label: '关联车辆', value: '6 辆' }] },
  { id: 'p1', type: '任务', layer: 'plant', kind: 'plant', status: 'online', icon: '▰', name: '焚烧厂', lng: 114.3842, lat: 36.0265, onlineText: '运行正常', details: [{ label: '今日处理', value: '218.5 吨' }, { label: '日处理能力', value: '600 吨' }], relations: [{ label: '入厂车辆', value: '12 辆' }] },
  { id: 'a1', type: '告警', layer: 'alarm', kind: 'alarm', status: 'danger', icon: '!', name: '告警', lng: 114.3475, lat: 36.0928, alarm: true, onlineText: '严重  未处理', details: [{ label: '告警类型', value: '箱体满溢' }, { label: '位置', value: '龙泉镇白龙庙村' }, { label: '触发时间', value: '10:28' }], relations: [{ label: '关联任务', value: '待派单' }] },
  { id: 'a2', type: '告警', layer: 'alarm', kind: 'alarm', status: 'warning', icon: '!', name: '告警', lng: 114.2278, lat: 36.0302, alarm: true, onlineText: '重要  处理中', details: [{ label: '告警类型', value: '车辆超速' }, { label: '位置', value: '马家乡北街' }, { label: '触发时间', value: '10:12' }], relations: [{ label: '关联车辆', value: '豫E3G516' }] },
])

const villageGeoArchives = longanVillageArchives.map((item) => {
  const point = wgs84ToGcj02(item.lng, item.lat)
  return { ...item, amapLng: point.lng, amapLat: point.lat }
})
const driverNames = ['张师傅', '李师傅', '王师傅', '赵师傅', '陈师傅', '郑师傅', '孙师傅', '刘师傅', '周师傅', '郭师傅']

function padCode(value: number) {
  return String(value).padStart(3, '0')
}

function seededRatio(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function pickVillage(index: number, offset: number) {
  const village = villageGeoArchives[Math.abs(index * 17 + offset * 7) % villageGeoArchives.length]
  // 档案尚未返回时也要保证地图点位可生成，不能让单个空值阻断整张大屏。
  return village || { town: '龙安区', name: '默认点位', amapLng: 114.3, amapLat: 36.07, wasteTons: 0 }
}

function simulatedLngLat(index: number, offset: number, jitterScale = 1) {
  const village = pickVillage(index, offset)
  const lngJitter = (seededRatio(index + offset) - 0.5) * 0.006 * jitterScale
  const latJitter = (seededRatio(index * 1.37 + offset * 2.11) - 0.5) * 0.004 * jitterScale
  const lng = village.amapLng + lngJitter
  const lat = village.amapLat + latJitter
  return {
    lng: +Math.min(LONGAN_BOUNDS.east - 0.004, Math.max(LONGAN_BOUNDS.west + 0.004, lng)).toFixed(6),
    lat: +Math.min(LONGAN_BOUNDS.north - 0.004, Math.max(LONGAN_BOUNDS.south + 0.004, lat)).toFixed(6),
  }
}

function createMapEntity(entity: Omit<MapEntity, 'lng' | 'lat'>, index: number, offset: number, jitterScale = 1): MapEntity {
  return {
    ...entity,
    ...simulatedLngLat(index, offset, jitterScale),
  }
}

function createGeneratedMapEntities(): MapEntity[] {
  const list: MapEntity[] = []

  for (let i = 1; i <= 20; i += 1) {
    const village = pickVillage(i, 10)
    const town = village.town
    list.push(createMapEntity({
      id: `hook-${i}`,
      type: '车辆',
      layer: 'hookTruck',
      kind: 'truck-hook',
      status: i % 13 === 0 ? 'charging' : i % 9 === 0 ? 'offline' : 'online',
      icon: '▣',
      name: `小勾臂${padCode(i)}`,
      onlineText: i % 13 === 0 ? '充电中' : i % 9 === 0 ? '离线' : '在线  收运中',
      image: i === 1 ? vehicleImage : undefined,
      details: [
        { label: '车辆类型', value: '小勾臂车' },
        { label: '车牌号', value: `豫E${padCode(600 + i)}` },
        { label: '司机', value: driverNames[i % driverNames.length] },
        { label: '当前乡镇', value: town },
        { label: '速度', value: `${28 + (i % 18)} km/h` },
        { label: '任务', value: `${town}箱体收运` },
      ],
      relations: [
        { label: '关联箱体', value: `${2 + (i % 4)} 个` },
        { label: '今日任务', value: `${6 + (i % 7)} 单` },
      ],
    }, i, 10, 1.3))
  }

  for (let i = 1; i <= 6; i += 1) {
    const village = pickVillage(i, 30)
    const town = village.town
    list.push(createMapEntity({
      id: `large-truck-${i}`,
      type: '车辆',
      layer: 'largeTruck',
      kind: 'truck-large',
      status: 'online',
      icon: '▣',
      name: `大勾臂${padCode(i)}`,
      onlineText: '在线  转运中',
      details: [
        { label: '车辆类型', value: '大勾臂车' },
        { label: '车牌号', value: `豫E${padCode(800 + i)}` },
        { label: '司机', value: driverNames[(i + 3) % driverNames.length] },
        { label: '当前乡镇', value: town },
        { label: '载重', value: `${10 + i}.6 吨` },
        { label: '目的地', value: '龙安生活垃圾焚烧厂' },
      ],
      relations: [
        { label: '关联中转站', value: `${town}中转站` },
        { label: '今日转运', value: `${4 + i} 趟` },
      ],
    }, i, 30, 1.6))
  }

  for (let i = 1; i <= 30; i += 1) {
    const village = pickVillage(i, 60)
    const town = village.town
    list.push(createMapEntity({
      id: `tricycle-${i}`,
      type: '车辆',
      layer: 'smallTruck',
      kind: 'truck-small',
      status: i % 17 === 0 ? 'offline' : 'online',
      icon: '▣',
      name: `三轮${padCode(i)}`,
      onlineText: i % 17 === 0 ? '离线' : '在线  巡回清运',
      details: [
        { label: '车辆类型', value: '小三轮车' },
        { label: '车辆编号', value: `TR-${padCode(i)}` },
        { label: '驾驶员', value: driverNames[i % driverNames.length] },
        { label: '服务区域', value: town },
        { label: '今日里程', value: `${18 + (i % 24)} 公里` },
        { label: '今日任务', value: `${3 + (i % 6)} 单` },
      ],
      relations: [
        { label: '服务村庄', value: village.name },
        { label: '附近收集点', value: `${1 + (i % 3)} 个` },
      ],
    }, i, 60, 1.2))
  }

  for (let i = 1; i <= 12; i += 1) {
    const village = pickVillage(i, 110)
    const town = village.town
    const alarm = i <= 3
    list.push(createMapEntity({
      id: `large-box-${i}`,
      type: '箱体',
      layer: 'largeBox',
      kind: 'large-box',
      status: i % 11 === 0 ? 'offline' : 'online',
      icon: '▤',
      name: `大箱${padCode(i)}`,
      alarm,
      onlineText: alarm ? '在线  严重告警' : '在线  正常',
      statusTags: i % 11 === 0 ? [] : alarm ? ['满溢'] : i % 7 === 0 ? ['高温'] : [],
      details: [
        { label: '箱体类型', value: '大勾臂箱' },
        { label: '箱体编号', value: `DB-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: town },
        { label: '邻近村庄', value: village.name },
        { label: '满溢率', value: `${alarm ? 91 + (i % 8) : 42 + (i % 35)}%` },
        { label: '称重', value: `${6 + (i % 5)}.${i % 9} 吨` },
      ],
      relations: [
        { label: '关联任务', value: alarm ? '待派大勾臂车' : '暂无待办' },
        { label: '最近中转站', value: `${town}中转站` },
      ],
    }, i, 110, 0.45))
  }

  for (let i = 1; i <= 24; i += 1) {
    const village = pickVillage(i, 150)
    const town = village.town
    const alarm = i <= 10
    list.push(createMapEntity({
      id: `small-box-${i}`,
      type: '箱体',
      layer: 'smallBox',
      kind: 'small-box',
      status: i % 13 === 0 ? 'offline' : 'online',
      icon: '▥',
      name: `小箱${padCode(i)}`,
      alarm,
      onlineText: alarm ? '在线  满溢预警' : '在线  正常',
      statusTags: i % 13 === 0 ? [] : alarm ? ['满溢'] : i % 11 === 0 ? ['低电量'] : i % 7 === 0 ? ['高温'] : [],
      details: [
        { label: '箱体类型', value: '小勾臂箱' },
        { label: '箱体编号', value: `XB-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: town },
        { label: '所在村庄', value: village.name },
        { label: '满溢率', value: `${alarm ? 82 + (i % 15) : 24 + (i % 48)}%` },
        { label: '电量', value: `${58 + (i % 39)}%` },
      ],
      relations: [
        { label: '建议车辆', value: `小勾臂${padCode((i % 20) + 1)}` },
        { label: '最近任务', value: alarm ? '待派单' : '正常巡检' },
      ],
    }, i, 150, 0.4))
  }

  for (let i = 1; i <= 18; i += 1) {
    const village = pickVillage(i, 210)
    const town = village.town
    list.push(createMapEntity({
      id: `collection-${i}`,
      type: '收集点',
      layer: 'collectionPoint',
      kind: 'collection',
      status: 'online',
      icon: '●',
      name: `收集点${padCode(i)}`,
      onlineText: '运行正常',
      details: [
        { label: '点位类型', value: '收集点' },
        { label: '点位名称', value: `${town}${village.name}收集点` },
        { label: '服务范围', value: `${2 + (i % 5)} 个村庄` },
        { label: '昨日垃圾量', value: `${Math.max(0.3, village.wasteTons).toFixed(2)} 吨` },
      ],
      relations: [
        { label: '附近车辆', value: `${2 + (i % 5)} 辆` },
        { label: '关联箱体', value: `${1 + (i % 4)} 个` },
      ],
    }, i, 210, 0.25))
  }

  for (let i = 1; i <= 12; i += 1) {
    const village = pickVillage(i, 280)
    const town = village.town
    list.push(createMapEntity({
      id: `station-${i}`,
      type: '中转站',
      layer: 'station',
      kind: 'station',
      status: i % 6 === 0 ? 'warning' : 'online',
      icon: '⌂',
      name: `${town}中转站`,
      onlineText: i % 6 === 0 ? '运行中  接近满载' : '运行正常',
      details: [
        { label: '站点类型', value: '垃圾中转站' },
        { label: '在站箱体', value: `${2 + (i % 6)} 个` },
        { label: '今日进站', value: `${18 + (i % 19)} 趟` },
        { label: '压缩量', value: `${18 + i}.5 吨` },
      ],
      relations: [
        { label: '关联车辆', value: `${4 + (i % 7)} 辆` },
        { label: '出站去向', value: '龙安生活垃圾焚烧厂' },
      ],
    }, i, 280, 0.85))
  }

  for (let i = 1; i <= 8; i += 1) {
    const village = pickVillage(i, 340)
    const town = village.town
    const tone = i <= 3 ? 'danger' : 'warning'
    list.push(createMapEntity({
      id: `alarm-${i}`,
      type: '告警',
      layer: 'alarm',
      kind: 'alarm',
      status: tone,
      icon: '!',
      name: i <= 3 ? '严重告警' : '重要告警',
      alarm: true,
      pulse: i <= 3,
      onlineText: i <= 3 ? '严重  未处理' : '重要  处理中',
      details: [
        { label: '告警类型', value: i % 2 === 0 ? '箱体高温告警' : '箱体满溢告警' },
        { label: '箱体名称', value: `${village.name}${i % 2 === 0 ? '大勾臂箱' : '小勾臂箱'}` },
        { label: '箱体编号', value: `${i % 2 === 0 ? 'DB' : 'XB'}-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: village.town },
        { label: '所在村庄', value: village.name },
        { label: '触发时间', value: `10:${String(10 + i * 2).padStart(2, '0')}` },
      ],
      relations: [
        { label: '处置状态', value: i <= 3 ? '待派单' : '处置中' },
        { label: '附近车辆', value: `${1 + (i % 4)} 辆` },
      ],
    }, i, 340, 0.55))
  }

  list.push({
    id: 'plant-1',
    type: '焚烧厂',
    layer: 'plant',
    kind: 'plant',
    status: 'online',
    icon: '▰',
    name: '龙安生活垃圾焚烧厂',
    lng: 114.3892,
    lat: 36.0238,
    onlineText: '运行正常',
    details: [
      { label: '设施类型', value: '焚烧厂' },
      { label: '今日入厂', value: '218.5 吨' },
      { label: '处理能力', value: '600 吨/日' },
      { label: '排队车辆', value: '4 辆' },
    ],
    relations: [
      { label: '关联中转站', value: '12 个' },
      { label: '今日转运任务', value: '46 单' },
    ],
  })

  return list
}

// 完整保留地图对象数据：20 小勾臂车、6 大勾臂车、30 小三轮、36 箱体、
// 18 收集点、12 中转站、8 告警和 1 焚烧厂。
try {
  mapEntities.value = createGeneratedMapEntities()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  mapEngineError.value = `地图点位生成失败：${message}`
  console.error('[command-center-v2] 地图点位生成失败：', error)
}

const selectedEntity = ref<MapEntity>(mapEntities.value[0])
const detailPanelVisible = ref(false)
const activeEntityAction = ref('')
const intercomConnected = ref(false)
const trackPlaying = ref(false)
const trackSpeed = ref(1)
const trackProgress = ref(0.38)
const trackSpeeds = [1, 5, 10, 15, 20, 25, 30]
const vehicleCameras = [
  { id: 1, name: '前视摄像头', quality: '1080P' },
  { id: 2, name: '左侧摄像头', quality: '720P' },
  { id: 3, name: '右侧摄像头', quality: '720P' },
  { id: 4, name: '后视摄像头', quality: '1080P' },
  { id: 5, name: '驾驶室摄像头', quality: '720P' },
]
let trackTimer: number | undefined
const trackDay = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('/', '-')
const simulatedTrackPoints = [
  { x: 52, y: 236 }, { x: 124, y: 236 }, { x: 124, y: 72 }, { x: 258, y: 72 }, { x: 258, y: 150 },
  { x: 388, y: 150 }, { x: 388, y: 52 }, { x: 540, y: 52 }, { x: 540, y: 242 }, { x: 446, y: 242 },
  { x: 446, y: 190 }, { x: 320, y: 190 }, { x: 320, y: 258 }, { x: 180, y: 258 },
]
const trackPosition = computed(() => {
  const point = trackProgress.value * (simulatedTrackPoints.length - 1)
  const index = Math.min(simulatedTrackPoints.length - 2, Math.floor(point))
  const ratio = point - index
  const from = simulatedTrackPoints[index]
  const to = simulatedTrackPoints[index + 1]
  return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }
})
const trackCurrentTime = computed(() => {
  const seconds = Math.floor(trackProgress.value * (24 * 60 * 60 - 1))
  const hours = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return `${trackDay} ${hours}:${minutes}:${secs}`
})
const liveLocationTime = computed(() => trackCurrentTime.value.slice(-8))
const trackRouteStyle = computed(() => {
  const offset = 1090 - trackProgress.value * 1090
  return activeEntityAction.value === '跟踪'
    ? { strokeDasharray: '150 940', strokeDashoffset: offset }
    : { strokeDasharray: '1090', strokeDashoffset: offset }
})

function stopTrackPlayback() {
  trackPlaying.value = false
  if (trackTimer !== undefined) window.clearInterval(trackTimer)
  trackTimer = undefined
}

function toggleTrackPlayback() {
  if (trackPlaying.value) return stopTrackPlayback()
  trackPlaying.value = true
  if (trackProgress.value >= 1) trackProgress.value = 0
  trackTimer = window.setInterval(() => {
    trackProgress.value = Math.min(1, trackProgress.value + 0.0025 * trackSpeed.value)
    if (trackProgress.value >= 1) stopTrackPlayback()
  }, 180)
}

function selectTrackSpeed(speed: number) {
  trackSpeed.value = speed
}

function startLiveTracking() {
  stopTrackPlayback()
  trackPlaying.value = true
  trackTimer = window.setInterval(() => {
    trackProgress.value += 0.008
    if (trackProgress.value > 1) trackProgress.value = 0
  }, 420)
}

function seekTrack(event: MouseEvent) {
  const timeline = event.currentTarget as HTMLElement
  const bounds = timeline.getBoundingClientRect()
  trackProgress.value = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
}

watch(activeEntityAction, (action) => {
  if (action !== '轨迹' && action !== '跟踪') stopTrackPlayback()
})

const entityStatusInfo = computed(() => {
  const entity = selectedEntity.value
  // 收集点、中转站、焚烧厂不展示运行状态。
  if (entity.kind === 'collection' || entity.kind === 'station' || entity.kind === 'plant') return null

  if (entity.kind === 'small-box' || entity.kind === 'large-box') {
    const offline = entity.status === 'offline'
    const tags = offline ? [] : (entity.statusTags || (entity.alarm ? ['满溢'] : []))
    return { label: offline ? '离线' : '在线', tone: offline ? 'offline' : 'online', tags }
  }

  if (entity.kind === 'truck-small') {
    const offline = entity.status === 'offline'
    return { label: offline ? '离线' : '在线', tone: offline ? 'offline' : 'online', tags: [] }
  }

  if (entity.kind === 'truck-hook' || entity.kind === 'truck-large') {
    const label = entity.status === 'charging' ? '充电' : entity.status === 'offline' ? '离线' : '在线'
    return { label, tone: entity.status === 'charging' ? 'charging' : entity.status === 'offline' ? 'offline' : 'online', tags: [] }
  }

  return null
})

type InfoItem = { label: string, value: string }
interface EntityProfile {
  title: string
  basic: InfoItem[]
  actions: string[]
  task?: { name: string, items: InfoItem[] }
  statistics: InfoItem[]
  relations: InfoItem[]
  driver?: string
}

function detailValue(entity: MapEntity, label: string, fallback = '—') {
  return entity.details.find((item) => item.label === label)?.value || fallback
}

function entityTask(entity: MapEntity) {
  const taskName = detailValue(entity, '任务', `${entity.name}收运任务`)
  return {
    name: taskName,
    items: [
      { label: '任务名称', value: taskName },
      { label: '始发地', value: detailValue(entity, '所在村庄', detailValue(entity, '当前乡镇', '龙安区收集点')) },
      { label: '目的地', value: detailValue(entity, '目的地', '龙安生活垃圾焚烧厂') },
      { label: '时效', value: '120 分钟' },
      { label: '当前状态', value: entity.onlineText.replace('在线', '').trim() || '收运中' },
    ],
  }
}

function taskInfoValue(label: string) {
  return selectedProfile.value.task?.items.find((item) => item.label === label)?.value || '—'
}

const selectedProfile = computed<EntityProfile>(() => {
  const entity = selectedEntity.value
  const commonRelations = entity.relations
  const driver = detailValue(entity, '驾驶员', detailValue(entity, '司机', '张师傅'))
  const location = detailValue(entity, '位置', `${detailValue(entity, '当前乡镇', detailValue(entity, '所属乡镇', '龙安区'))}${detailValue(entity, '所在村庄', '')}`)

  if (entity.kind === 'truck-small') {
    return {
      title: '小三轮', driver,
      basic: [
        { label: '车牌号', value: detailValue(entity, '车牌号', entity.name) }, { label: '所属机构', value: detailValue(entity, '服务区域', '龙安区环卫中心') },
        { label: '设备号', value: detailValue(entity, '车辆编号', `TR-${entity.id}`) }, { label: '车型', value: '小三轮' },
        { label: '详细车型', value: '电动密闭保洁三轮车' }, { label: '定位时间', value: '2026-06-16 10:30:30' },
        { label: '当前位置', value: location }, { label: '今日里程', value: detailValue(entity, '今日里程', '26 公里') },
        { label: '驾驶员', value: driver }, { label: '联系方式', value: '138****6622' },
      ], actions: ['轨迹', '跟踪'], statistics: [], relations: commonRelations,
    }
  }
  if (entity.kind === 'truck-hook' || entity.kind === 'truck-large') {
    const isLarge = entity.kind === 'truck-large'
    return {
      title: isLarge ? '大勾臂车' : '小勾臂车', driver,
      basic: [
        { label: '车牌号', value: detailValue(entity, '车牌号', entity.name) }, { label: '所属机构', value: '龙安区环卫中心' },
        { label: 'VIN码', value: `LAA${entity.id.toUpperCase()}20260616` }, { label: '设备号', value: `GPS-${entity.id.toUpperCase()}` },
        { label: '车型', value: isLarge ? '大勾臂车' : '小勾臂车' }, { label: '详细车型', value: isLarge ? '18 吨勾臂式垃圾车' : '8 吨勾臂式垃圾车' },
        { label: '定位时间', value: '2026-06-16 10:30:30' }, { label: '当前位置', value: location },
        { label: '今日里程', value: `${42 + Number(entity.id.match(/\d+/)?.[0] || 0)} 公里` }, { label: '电量', value: isLarge ? '82%' : '76%' },
        { label: '称重', value: detailValue(entity, '载重', isLarge ? '13.8 吨' : '4.6 吨') }, { label: '驾驶员', value: driver }, { label: '联系方式', value: '138****6622' },
      ],
      actions: ['轨迹', '视频', '对讲', '跟踪'], task: entityTask(entity),
      statistics: [{ label: '今日完成单', value: `${6 + Number(entity.id.match(/\d+/)?.[0] || 0) % 8} 单` }, { label: '超时单', value: `${Number(entity.id.match(/\d+/)?.[0] || 0) % 2} 单` }, { label: '运输垃圾', value: isLarge ? '38.6 吨' : '16.8 吨' }], relations: commonRelations,
    }
  }
  if (entity.kind === 'small-box') {
    return {
      title: '小勾臂箱',
      basic: [
        { label: '箱体名称', value: entity.name }, { label: '箱体编号', value: detailValue(entity, '箱体编号', entity.id) }, { label: '在线状态', value: entity.onlineText },
        { label: '上报时间', value: '2026-06-16 10:29:38' }, { label: '满溢状态', value: detailValue(entity, '满溢率') }, { label: '电量状态', value: '正常' },
        { label: '温度状态', value: '正常' }, { label: '匹配对象', value: detailValue(entity, '建议车辆', '小勾臂001') }, { label: '当前位置', value: location },
        { label: '垃圾占比', value: detailValue(entity, '满溢率') }, { label: '温度', value: '28℃' }, { label: '电量', value: detailValue(entity, '电量') },
      ], actions: [], statistics: [], relations: commonRelations,
    }
  }
  if (entity.kind === 'large-box') {
    return {
      title: '大勾臂箱',
      basic: [
        { label: '箱体名称', value: entity.name }, { label: '箱体编号', value: detailValue(entity, '箱体编号', entity.id) }, { label: '在线状态', value: entity.onlineText },
        { label: '上报时间', value: '2026-06-16 10:29:38' }, { label: '满溢状态', value: detailValue(entity, '满溢率') }, { label: '匹配对象', value: detailValue(entity, '最近中转站', '龙安生活垃圾焚烧厂') }, { label: '当前位置', value: location }, { label: '垃圾占比', value: detailValue(entity, '满溢率') },
      ], actions: [], task: entityTask(entity), statistics: [{ label: '今日完成单', value: '4 单' }, { label: '运输垃圾', value: detailValue(entity, '称重', '12.4 吨') }], relations: commonRelations,
    }
  }
  if (entity.kind === 'collection') {
    return {
      title: '收集点',
      basic: [{ label: '点位名称', value: detailValue(entity, '点位名称', entity.name) }, { label: '所属乡镇', value: detailValue(entity, '当前乡镇', '龙安区') }, { label: '所属村庄', value: detailValue(entity, '所在村庄', '—') }, { label: '联系人', value: '王建国' }, { label: '联系电话', value: '139****2688' }, { label: '容量数量', value: detailValue(entity, '关联箱体', '3 个') }, { label: '具体地址', value: location }, { label: '服务半径', value: '2.5 公里' }],
      actions: [], statistics: [{ label: '今日完成单', value: '8 单' }, { label: '运输垃圾', value: '5.8 吨' }], relations: commonRelations,
    }
  }
  if (entity.kind === 'station' || entity.kind === 'plant') {
    const plant = entity.kind === 'plant'
    return {
      title: plant ? '焚烧厂' : '中转站',
      basic: [{ label: plant ? '焚烧厂名称' : '站点名称', value: entity.name }, { label: '编号', value: `${plant ? 'FC' : 'ZZ'}-${entity.id.toUpperCase()}` }, { label: '所属乡镇', value: plant ? '龙安区' : detailValue(entity, '当前乡镇', '龙安区') }, { label: '联系人', value: '刘建军' }, { label: '联系电话', value: '137****8910' }, { label: '机位数量', value: plant ? '6 个' : '4 个' }, { label: '具体地址', value: location }, { label: '服务半径', value: plant ? '30 公里' : '8 公里' }],
      actions: [], statistics: [{ label: '今日完成单', value: plant ? '46 单' : '18 单' }, { label: '运输垃圾', value: plant ? '218.5 吨' : '36.8 吨' }], relations: commonRelations,
    }
  }
  return {
    title: '箱体告警',
    basic: [{ label: '箱体名称', value: detailValue(entity, '箱体名称', '龙泉镇白龙庙村小勾臂箱') }, { label: '告警描述', value: detailValue(entity, '告警类型', '箱体满溢告警') }, { label: '箱体编号', value: detailValue(entity, '箱体编号', 'XB-LQ-008') }, { label: '触发规则', value: detailValue(entity, '告警类型').includes('高温') ? '箱体温度 ≥ 65℃' : '垃圾占比 ≥ 90%' }, { label: '具体地址', value: location }, { label: '触发时间', value: detailValue(entity, '触发时间', '2026-06-16 10:28:00') }, { label: '关联任务', value: detailValue(entity, '处置状态', '待派单') }],
    actions: [], statistics: [], relations: commonRelations,
  }
})

const mapLayers = [
  { key: 'largeTruck', label: '大勾臂车', icon: mapLayerIconMap.largeTruck },
  { key: 'hookTruck', label: '小勾臂车', icon: mapLayerIconMap.hookTruck },
  { key: 'smallTruck', label: '小三轮车', icon: mapLayerIconMap.smallTruck },
  { key: 'largeBox', label: '大勾臂箱', icon: mapLayerIconMap.largeBox },
  { key: 'smallBox', label: '小勾臂箱', icon: mapLayerIconMap.smallBox },
  { key: 'collectionPoint', label: '收集点', icon: mapLayerIconMap.collectionPoint },
  { key: 'station', label: '中转站', icon: mapLayerIconMap.station },
  { key: 'plant', label: '焚烧厂', icon: mapLayerIconMap.plant },
  { key: 'alarm', label: '告警', icon: mapLayerIconMap.alarm },
]
const activeLayers = ref(mapLayers.map((layer) => layer.key))
const mapZoom = ref(1)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function zoomMap(delta: number) {
  mapZoom.value = +clamp(mapZoom.value + delta, 0.7, 2.4).toFixed(2)
  if (v2BaseMap) {
    const nextZoom = Math.round(clamp(13 + (mapZoom.value - 1) * 3, 11, 18))
    if (v2BaseMap.getZoom() !== nextZoom) {
      v2BaseMap.setZoom(nextZoom, { animate: false })
    }
  }
}

function resetMapZoom() {
  mapZoom.value = 1
}

function onMapWheel(event: WheelEvent) {
  pendingWheelZoom += event.deltaY > 0 ? -1 : 1
  if (wheelZoomTimer !== undefined) return

  wheelZoomTimer = window.setTimeout(() => {
    const direction = pendingWheelZoom >= 0 ? 1 : -1
    pendingWheelZoom = 0
    wheelZoomTimer = undefined
    zoomMap(direction * 0.2)
  }, 110)
}

const visibleMapEntities = computed(() => {
  const densityStep = mapZoom.value >= 1.55 ? 1 : mapZoom.value >= 1.2 ? 2 : 3
  const alwaysVisibleLayers = new Set(['alarm', 'plant', 'station', 'hookTruck', 'largeTruck', 'largeBox'])

  return mapEntities.value.filter((item, index) => {
    if (!activeLayers.value.includes(item.layer)) return false
    if (alwaysVisibleLayers.has(item.layer)) return true
    return index % densityStep === 0
  })
})

function lngLatToPercent(entity: Pick<MapEntity, 'lng' | 'lat'>) {
  const x = ((entity.lng - LONGAN_BOUNDS.west) / (LONGAN_BOUNDS.east - LONGAN_BOUNDS.west)) * 100
  const y = ((LONGAN_BOUNDS.north - entity.lat) / (LONGAN_BOUNDS.north - LONGAN_BOUNDS.south)) * 100
  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(92, Math.max(8, y)),
  }
}

function mapEntityStyle(entity: MapEntity) {
  const point = lngLatToPercent(entity)
  return { left: `${point.x}%`, top: `${point.y}%` }
}

function mapEntityIcon(entity: MapEntity) {
  return mapLayerIconMap[entity.layer] || mapLayerIconMap.alarm
}

function selectMapEntity(entity: MapEntity) {
  selectedEntity.value = entity
  activeEntityAction.value = ''
  detailPanelVisible.value = true
}

function openEntityAction(action: string) {
  activeEntityAction.value = action
  if (action === '对讲') intercomConnected.value = false
  if (action === '跟踪') startLiveTracking()
  else if (action !== '轨迹') stopTrackPlayback()
}

function toggleIntercom() {
  intercomConnected.value = !intercomConnected.value
}

function selectAlarmFromList(name: string) {
  const alarms = mapEntities.value.filter((entity) => entity.kind === 'alarm')
  const alarm = alarms[name.length % Math.max(alarms.length, 1)] || alarms[0]
  if (alarm) selectMapEntity(alarm)
}

function toggleLayer(key: string) {
  if (activeLayers.value.includes(key)) {
    activeLayers.value = activeLayers.value.filter((item) => item !== key)
  } else {
    activeLayers.value = [...activeLayers.value, key]
  }
}

const rightTabs = [
  { key: 'alarm', label: '实时告警' },
  { key: 'task', label: '任务监控' },
  { key: 'box', label: '箱体监控' },
  { key: 'vehicle', label: '车辆监控' },
  { key: 'safety', label: '主动安全' },
]
const activeRightTab = ref('alarm')
const activeRightTitle = computed(() => rightTabs.find((tab) => tab.key === activeRightTab.value)?.label || '监控')

type AlarmFilter = 'today' | 'recent3Days' | 'starred'
interface AlarmRow { id: string, date: string, time: string, name: string, place: string, level: string, star: boolean, read: boolean, taskNo: string, boxNo: string, rule: string, description: string }
const activeAlarmFilter = ref<AlarmFilter>('today')
const selectedAlarmRow = ref<AlarmRow | null>(null)
const alarmTaskFormVisible = ref(false)
const taskCreatedNotice = ref('')
const alarmDrivers = ['张师傅（豫E3G516）', '李师傅（豫E6N109）', '孙师傅（豫E8K270）']
const alarmVehicles = ['豫E3G516 · 小勾臂车', '豫E6N109 · 大勾臂车', '豫E8K270 · 小勾臂车']
const alarmDestinations = ['马投涧中转站', '龙泉镇中转站', '龙安生活垃圾焚烧厂']
const alarmTaskForm = ref({ driver: alarmDrivers[0], vehicle: alarmVehicles[0], destination: alarmDestinations[0], sla: 120, priority: '紧急' })
function dateBefore(days: number) {
  const date = new Date(`${trackDay}T00:00:00`)
  date.setDate(date.getDate() - days)
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replaceAll('/', '-')
}
const alarmRows = ref<AlarmRow[]>([
  { id: 'AL-001', date: trackDay, time: '10:31', name: '箱体满溢', place: '马投涧镇牛家窑村', level: 'danger', star: false, read: false, taskNo: 'RW-20260713-001', boxNo: 'XB-MT-012', rule: '垃圾占比 ≥ 90%', description: '小勾臂箱垃圾占比达到 96%，请及时安排车辆清运。' },
  { id: 'AL-002', date: trackDay, time: '10:28', name: '箱体高温', place: '龙泉镇白龙庙村', level: 'danger', star: true, read: false, taskNo: '', boxNo: 'DB-LQ-003', rule: '箱体温度 ≥ 65℃', description: '大勾臂箱温度持续升高，当前温度 68℃，请优先处置。' },
  { id: 'AL-003', date: trackDay, time: '10:25', name: '箱体低电量', place: '善应镇南善应村', level: 'warning', star: false, read: false, taskNo: '', boxNo: 'XB-SY-021', rule: '设备电量 ≤ 15%', description: '箱体设备电量仅剩 12%，请安排巡检或更换电池。' },
  { id: 'AL-004', date: trackDay, time: '10:19', name: '箱体满溢', place: '东风乡徐家口村', level: 'danger', star: true, read: true, taskNo: 'RW-20260713-004', boxNo: 'XB-DF-008', rule: '垃圾占比 ≥ 90%', description: '箱体已满溢，关联收运单正在执行。' },
  { id: 'AL-005', date: trackDay, time: '10:12', name: '箱体高温', place: '马家乡李家庄村', level: 'warning', star: false, read: true, taskNo: 'RW-20260713-005', boxNo: 'DB-MJ-005', rule: '箱体温度 ≥ 65℃', description: '箱体温度异常，等待现场核查。' },
  { id: 'AL-006', date: trackDay, time: '09:58', name: '箱体满溢', place: '文明大道街道文明村', level: 'warning', star: true, read: true, taskNo: '', boxNo: 'XB-WM-018', rule: '垃圾占比 ≥ 90%', description: '箱体满溢告警已确认，尚未创建收运单。' },
  { id: 'AL-007', date: dateBefore(1), time: '16:42', name: '箱体低电量', place: '马家乡西高平村', level: 'warning', star: false, read: true, taskNo: '', boxNo: 'XB-MJ-016', rule: '设备电量 ≤ 15%', description: '箱体设备电量低于阈值，请安排巡检。' },
  { id: 'AL-008', date: dateBefore(2), time: '08:17', name: '箱体满溢', place: '善应镇北善应村', level: 'danger', star: true, read: true, taskNo: 'RW-20260711-008', boxNo: 'DB-SY-006', rule: '垃圾占比 ≥ 90%', description: '大勾臂箱满溢，已关联收运任务。' },
])
const alarmStats = computed(() => [
  { key: 'today' as const, label: '今日告警', value: alarmRows.value.filter((row) => row.date === trackDay).length, tone: 'danger' },
  { key: 'recent3Days' as const, label: '近3日告警', value: alarmRows.value.filter((row) => row.date >= dateBefore(2) && row.date <= trackDay).length, tone: 'warning' },
  { key: 'starred' as const, label: '星标', value: alarmRows.value.filter((row) => row.star).length, tone: 'info' },
])
const filteredAlarmRows = computed(() => alarmRows.value.filter((row) => {
  if (activeAlarmFilter.value === 'today') return row.date === trackDay
  if (activeAlarmFilter.value === 'recent3Days') return row.date >= dateBefore(2) && row.date <= trackDay
  return row.star
}))

function formatAlarmTime(row: AlarmRow) {
  return activeAlarmFilter.value === 'today' ? row.time : `${row.date.slice(5)} ${row.time}`
}

function openAlarmDetail(row: AlarmRow) {
  row.read = true
  selectedAlarmRow.value = row
  alarmTaskFormVisible.value = false
  taskCreatedNotice.value = ''
}

function toggleAlarmStar() {
  if (selectedAlarmRow.value) selectedAlarmRow.value.star = !selectedAlarmRow.value.star
}

function createTaskFromAlarm() {
  if (!selectedAlarmRow.value) return
  selectedAlarmRow.value.taskNo ||= `RW-${trackDay.replaceAll('-', '')}-${selectedAlarmRow.value.id.slice(-3)}`
  alarmTaskFormVisible.value = false
  taskCreatedNotice.value = selectedAlarmRow.value.taskNo
  window.setTimeout(() => { taskCreatedNotice.value = '' }, 2600)
}

const taskMonitorStats = [
  { key: 'all', label: '今日总任务', value: '256', tone: 'info' },
  { key: 'pending', label: '待接单', value: '32', tone: 'warning' },
  { key: 'collecting', label: '收运中', value: '128', tone: 'success' },
  { key: 'overtime', label: '已超时', value: '20', tone: 'danger' },
]

const taskMonitorRows = [
  { id: 'T001', name: '牛家窑2号小勾臂箱收运', route: '马投涧镇 -> 马投涧中转站', vehicle: '豫E3G516', vehicleType: '小勾臂车', driver: '张师傅', status: '收运中', tone: 'success', overtimeStatus: '未超时', overtimeTone: 'info' },
  { id: 'T002', name: '龙泉压缩箱C转运', route: '龙泉中转站 -> 焚烧厂', vehicle: '豫E1R782', vehicleType: '大勾臂车', driver: '王师傅', status: '待接单', tone: 'warning', overtimeStatus: '未超时', overtimeTone: 'info' },
  { id: 'T003', name: '文明大道收集点清运', route: '文明大道街道 -> 中转站', vehicle: '豫E6N109', vehicleType: '大勾臂车', driver: '李师傅', status: '已完成', tone: 'info', overtimeStatus: '未超时', overtimeTone: 'info' },
  { id: 'T004', name: '东风乡箱体满溢处置', route: '东风乡 -> 东风中转站', vehicle: '豫E8K270', vehicleType: '小勾臂车', driver: '孙师傅', status: '收运中', tone: 'success', overtimeStatus: '已超时', overtimeTone: 'danger' },
  { id: 'T005', name: '善应镇日常巡回清运', route: '善应镇 -> 善应中转站', vehicle: '豫E2M883', vehicleType: '小勾臂车', driver: '赵师傅', status: '收运中', tone: 'success', overtimeStatus: '已超时', overtimeTone: 'danger' },
]

type TaskMonitorFilter = 'all' | 'pending' | 'collecting' | 'overtime'
const activeTaskFilter = ref<TaskMonitorFilter>('all')
const filteredTaskMonitorRows = computed(() => taskMonitorRows.filter((task) => {
  if (activeTaskFilter.value === 'all') return true
  if (activeTaskFilter.value === 'pending') return task.status === '待接单'
  if (activeTaskFilter.value === 'collecting') return task.status === '收运中'
  return task.overtimeStatus === '已超时'
}))

type TaskMonitorDetail = (typeof taskMonitorRows)[number] & {
  orderNo: string
  origin: string
  destination: string
  duration: number
  sla: number
  driver: string
  vehicle: string
  weight: string
  fillRate: number
  alarmNo: string
  box: string
  town: string
  phone: string
  events: Array<{ name: string; place: string; time: string }>
}

const selectedTaskMonitor = ref<TaskMonitorDetail | null>(null)
const taskTransferVisible = ref(false)
const taskActionNotice = ref('')
const taskTransferTargets = [
  { name: '王师傅', vehicle: '豫E5Q381' },
  { name: '赵师傅', vehicle: '豫E2M883' },
  { name: '陈师傅', vehicle: '豫E7L126' },
]
const taskTransferTarget = ref(taskTransferTargets[0].name)
function openTaskMonitorDetail(task: (typeof taskMonitorRows)[number]) {
  const details: Record<string, Omit<TaskMonitorDetail, keyof (typeof taskMonitorRows)[number]>> = {
    T001: { orderNo: 'ST202607130001', origin: '牛家窑村文化广场收集点', destination: '马投涧中转站', duration: 48, sla: 60, weight: '2.4', fillRate: 91, alarmNo: 'AL202607130001', box: '牛家窑2号小勾臂箱（XB-MTJ-002）', town: '马投涧镇', phone: '139****1001', events: [{ name: '派单', place: '系统自动派发', time: '08:28' }, { name: '接单', place: '张师傅 · 豫E3G516', time: '08:33' }, { name: '到达始发地', place: '牛家窑村文化广场收集点', time: '08:41' }, { name: '装车', place: '牛家窑村文化广场收集点', time: '08:48' }, { name: '发车', place: '前往马投涧中转站', time: '08:52' }] },
    T002: { orderNo: 'ST202607130008', origin: '龙泉镇中转站', destination: '龙安生活垃圾焚烧厂', duration: 0, sla: 90, weight: '0.0', fillRate: 76, alarmNo: 'AL202607130008', box: '龙泉压缩箱C（DB-LQ-003）', town: '龙泉镇', phone: '138****8172', events: [{ name: '创建任务', place: '龙泉镇中转站', time: '09:12' }, { name: '等待接单', place: '王师傅 · 豫E1R782 待接单', time: '09:12' }] },
    T003: { orderNo: 'ST202607130015', origin: '文明大道东段收集点', destination: '马投涧中转站', duration: 52, sla: 60, weight: '1.8', fillRate: 88, alarmNo: 'AL202607130015', box: '文明大道收集点箱体（XB-WM-018）', town: '文明大道街道', phone: '138****6218', events: [{ name: '派单', place: '系统自动派发', time: '07:21' }, { name: '接单', place: '李师傅 · 豫E6N109', time: '07:25' }, { name: '到达始发地', place: '文明大道东段收集点', time: '07:33' }, { name: '装车', place: '文明大道东段收集点', time: '07:41' }, { name: '发车', place: '前往马投涧中转站', time: '07:49' }, { name: '到达目的地', place: '马投涧中转站', time: '08:06' }, { name: '卸车完成', place: '马投涧中转站卸料区', time: '08:13' }, { name: '上传照片', place: '完成凭证已上传 1 张', time: '08:15' }] },
    T004: { orderNo: 'ST202607130021', origin: '东风乡西岗村收集点', destination: '东风中转站', duration: 138, sla: 120, weight: '3.1', fillRate: 96, alarmNo: 'AL202607130021', box: '西岗村大勾臂箱（DB-DF-011）', town: '东风乡', phone: '137****3770', events: [{ name: '派单', place: '系统自动派发', time: '06:40' }, { name: '接单', place: '孙师傅 · 豫E8K270', time: '06:48' }, { name: '到达始发地', place: '东风乡西岗村收集点', time: '07:36' }, { name: '装车', place: '东风乡西岗村收集点', time: '07:52' }] },
    T005: { orderNo: 'ST202607130030', origin: '善应镇北村收集点', destination: '善应中转站', duration: 35, sla: 60, weight: '1.2', fillRate: 72, alarmNo: 'AL202607130030', box: '善应镇巡回箱体（XB-SY-021）', town: '善应镇', phone: '136****5098', events: [{ name: '派单', place: '系统自动派发', time: '10:06' }, { name: '接单', place: '赵师傅 · 豫E2M883', time: '10:11' }, { name: '装车', place: '善应镇北村收集点', time: '10:25' }] },
  }
  selectedTaskMonitor.value = { ...task, ...details[task.id] }
  selectedAlarmRow.value = null
  alarmTaskFormVisible.value = false
  detailPanelVisible.value = false
  taskTransferVisible.value = false
}

function showTaskActionNotice(message: string) {
  taskActionNotice.value = message
  window.setTimeout(() => { taskActionNotice.value = '' }, 2600)
}

function forceCompleteTask() {
  if (!selectedTaskMonitor.value || selectedTaskMonitor.value.status === '已完成') return
  const task = selectedTaskMonitor.value
  task.status = '已完成'
  task.tone = 'info'
  task.events.push({ name: '强制完成', place: '运营人员手动强制完成，待补充凭证', time: new Date().toTimeString().slice(0, 5) })
  const source = taskMonitorRows.find((item) => item.id === task.id)
  if (source) { source.status = '已完成'; source.tone = 'info' }
  taskTransferVisible.value = false
  showTaskActionNotice(`任务 ${task.orderNo} 已强制完成`)
}

function openTaskTransfer() {
  if (!selectedTaskMonitor.value || selectedTaskMonitor.value.status === '已完成') return
  const candidate = taskTransferTargets.find((item) => item.name !== selectedTaskMonitor.value?.driver) || taskTransferTargets[0]
  taskTransferTarget.value = candidate.name
  taskTransferVisible.value = true
}

function confirmTaskTransfer() {
  if (!selectedTaskMonitor.value) return
  const target = taskTransferTargets.find((item) => item.name === taskTransferTarget.value)
  if (!target) return
  const task = selectedTaskMonitor.value
  task.driver = target.name
  task.vehicle = target.vehicle
  task.events.push({ name: '转单', place: `已转交 ${target.name} · ${target.vehicle}`, time: new Date().toTimeString().slice(0, 5) })
  taskTransferVisible.value = false
  showTaskActionNotice(`任务已转单至 ${target.name}（${target.vehicle}）`)
}

const boxMonitorStats = [
  { key: 'small', label: '小勾臂箱', value: '370', tone: 'success' },
  { key: 'large', label: '大勾臂箱', value: '12', tone: 'info' },
]

const boxMonitorRows = [
  { id: 'B001', type: 'small', name: '牛家窑2号小勾臂箱', code: 'XB-MTJ-002', online: '在线', overflow: '满溢', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 96, battery: 78, temperature: 32, match: '豫E3G516 · 牛家窑村文化广场收集点', location: '马投涧镇牛家窑村文化广场' },
  { id: 'B002', type: 'small', name: '善应北村1号小勾臂箱', code: 'XB-SY-021', online: '在线', overflow: '正常', batteryStatus: '低电量', temperatureStatus: '正常', fillRate: 71, battery: 12, temperature: 29, match: '善应北村收集点', location: '善应镇北村村委会东侧' },
  { id: 'B003', type: 'small', name: '徐家口村小勾臂箱', code: 'XB-DF-008', online: '离线', overflow: '正常', batteryStatus: '低电量', temperatureStatus: '高温', fillRate: 48, battery: 8, temperature: 66, match: '豫E8K270 · 徐家口村收集点', location: '东风乡徐家口村文化广场' },
  { id: 'B004', type: 'large', name: '龙泉压缩箱C', code: 'DB-LQ-003', online: '在线', overflow: '正常', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 82, battery: 0, temperature: 0, match: '豫E1R782 · 龙泉镇中转站 · 龙安生活垃圾焚烧厂', location: '龙泉镇中转站卸料区' },
  { id: 'B005', type: 'large', name: '西岗村大勾臂箱', code: 'DB-DF-011', online: '在线', overflow: '满溢', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 94, battery: 0, temperature: 0, match: '豫E8K270 · 东风中转站 · 龙安生活垃圾焚烧厂', location: '东风乡西岗村收集点' },
  { id: 'B006', type: 'large', name: '马投涧大勾臂箱', code: 'DB-MTJ-005', online: '离线', overflow: '正常', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 39, battery: 0, temperature: 0, match: '马投涧中转站 · 龙安生活垃圾焚烧厂', location: '马投涧镇工业路北侧' },
]
type BoxType = 'small' | 'large'
const activeBoxType = ref<BoxType>('small')
const selectedBoxMonitor = ref<(typeof boxMonitorRows)[number] | null>(null)
const filteredBoxMonitorRows = computed(() => boxMonitorRows.filter((box) => box.type === activeBoxType.value).sort((a, b) => b.fillRate - a.fillRate))
function openBoxMonitorDetail(box: (typeof boxMonitorRows)[number]) {
  selectedBoxMonitor.value = box
  selectedTaskMonitor.value = null
  detailPanelVisible.value = false
}

const vehicleMonitorRows = [
  { id: 'V000', plate: '豫E606', driver: '孙师傅', type: '小勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V001', plate: '豫E3G516', driver: '张师傅', type: '小勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V002', plate: '豫E8K270', driver: '孙师傅', type: '小勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V003', plate: '豫E2M883', driver: '赵师傅', type: '小勾臂车', status: '充电', tone: 'warning', collecting: false },
  { id: 'V004', plate: '豫E5Q381', driver: '王师傅', type: '小勾臂车', status: '离线', tone: 'danger', collecting: false },
  { id: 'V005', plate: '豫E6N109', driver: '李师傅', type: '大勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V006', plate: '豫E1R782', driver: '陈师傅', type: '大勾臂车', status: '在线', tone: 'success', collecting: false },
  { id: 'V007', plate: '豫E9T266', driver: '周师傅', type: '小三轮车', status: '在线', tone: 'success', collecting: true },
  { id: 'V008', plate: '豫E7L126', driver: '刘师傅', type: '小三轮车', status: '离线', tone: 'danger', collecting: false },
]
const vehicleTypeStats = [{ key: '小勾臂车', label: '小勾臂车', value: '370', tone: 'success' }, { key: '大勾臂车', label: '大勾臂车', value: '6', tone: 'info' }, { key: '小三轮车', label: '小三轮车', value: '540', tone: 'warning' }]
const vehicleStatusFilters = [{ key: 'all', label: '全部' }, { key: '在线', label: '在线' }, { key: '充电', label: '充电' }, { key: '离线', label: '离线' }]
const activeVehicleType = ref('小勾臂车')
const activeVehicleStatus = ref('all')
const vehiclePlateSearch = ref('')
const filteredVehicleMonitorRows = computed(() => vehicleMonitorRows.filter((row) => row.type === activeVehicleType.value && (activeVehicleStatus.value === 'all' || row.status === activeVehicleStatus.value) && (!vehiclePlateSearch.value || row.plate.includes(vehiclePlateSearch.value))))
function openVehicleMonitorDetail(row: (typeof vehicleMonitorRows)[number]) {
  const fallback = mapEntities.value.find((item) => item.kind.startsWith('truck')) || mapEntities.value[0]
  const entity = mapEntities.value.find((item) => item.name === row.plate) || { ...fallback, name: row.plate, onlineText: `${row.status}${row.collecting ? '  收运中' : ''}`, details: [{ label: '车辆类型', value: row.type }, { label: '司机', value: row.driver }, { label: '车辆状态', value: row.status }, { label: '当前任务', value: row.collecting ? '收运任务执行中' : '暂无未完成任务' }] }
  selectMapEntity(entity)
  selectedTaskMonitor.value = null
}

const safetyMonitorRows = [
  { id: 'S001', type: '分神驾驶', time: '10:31:22', vehicle: '豫E3G516', place: '龙泉镇南街', driver: '张师傅', speed: 42, level: '一级', tone: 'danger' },
  { id: 'S002', type: '疲劳驾驶', time: '10:18:45', vehicle: '豫E6N109', place: '马投涧工业路', driver: '李师傅', speed: 38, level: '二级', tone: 'danger' },
  { id: 'S003', type: '接打电话', time: '09:56:12', vehicle: '豫E01622D', place: '文明大道', driver: '王师傅', speed: 35, level: '三级', tone: 'warning' },
  { id: 'S004', type: '车道偏离', time: '09:42:08', vehicle: '豫E2R012', place: '龙泉镇陈家庄', driver: '赵师傅', speed: 51, level: '四级', tone: 'success' },
  { id: 'S005', type: '行人碰撞预警', time: '09:28:36', vehicle: '豫E0D789', place: '善应镇中城村', driver: '周师傅', speed: 28, level: '二级', tone: 'info' },
]
const selectedSafetyMonitor = ref<(typeof safetyMonitorRows)[number] | null>(null)
const safetyVideoPlaying = ref(false)
const safetyAttachments = [{ kind: 'video', label: '驾驶室监控视频' }, { kind: 'video', label: '前向道路监控视频' }, { kind: 'image', label: '驾驶员抓拍图片' }, { kind: 'image', label: '道路环境抓拍图片' }]
const safetyAttachmentIndex = ref(0)
const activeSafetyAttachment = computed(() => safetyAttachments[safetyAttachmentIndex.value])
function changeSafetyAttachment(direction: number) { safetyAttachmentIndex.value = (safetyAttachmentIndex.value + direction + safetyAttachments.length) % safetyAttachments.length; safetyVideoPlaying.value = false }
function openSafetyDetail(item: (typeof safetyMonitorRows)[number]) { selectedSafetyMonitor.value = item; safetyVideoPlaying.value = false; safetyAttachmentIndex.value = 0; detailPanelVisible.value = false }

const PanelCard = {
  props: { title: String },
  setup(props: { title: string }, { slots }: any) {
    return () => h('section', { class: 'panel-card' }, [
      props.title ? h('div', { class: 'panel-title' }, props.title) : null,
      slots.default?.(),
    ])
  },
}
</script>

<style scoped lang="scss">
.command-v2-page {
  position: relative;
  min-height: calc(100vh - 84px);
  overflow: auto;
  padding: 48px 8px 12px;
  background: #020813;
}

.resolution-switch {
  position: absolute;
  z-index: 50;
  top: 8px;
  right: auto;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;

  button {
    height: 24px;
    padding: 0 8px;
    color: #bfdbfe;
    cursor: pointer;
    font-size: 12px;
    background: rgba(15, 31, 52, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.34);
    border-radius: 4px;

    &.active {
      color: #031321;
      background: #67e8f9;
      box-shadow: 0 0 18px rgba(34, 211, 238, 0.45);
    }
  }
}

.layout-spacing-note {
  display: inline-flex;
  align-items: center;
  height: 24px;
  margin-left: 4px;
  padding: 0 9px;
  color: #9fc7dc;
  font-size: 11px;
  white-space: nowrap;
  background: rgba(7, 28, 47, 0.94);
  border: 1px solid rgba(80, 190, 231, 0.34);
  border-radius: 4px;

  strong {
    margin: 0 3px;
    color: #68e6ff;
  }
}

.prd-mask {
  position: fixed;
  z-index: 120;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 28px;
  background: rgba(1, 8, 19, 0.72);
  backdrop-filter: blur(5px);
}

.prd-board {
  display: flex;
  flex-direction: column;
  width: min(1560px, 96vw);
  max-height: min(880px, calc(100vh - 56px));
  overflow: hidden;
  color: #d8e9f8;
  background: linear-gradient(145deg, rgba(7, 29, 48, 0.99), rgba(3, 16, 30, 0.99));
  border: 1px solid rgba(71, 212, 255, 0.62);
  border-radius: 10px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.58), inset 0 0 36px rgba(38, 170, 229, 0.08);
}

.prd-head {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 28px 18px;
  background: linear-gradient(90deg, rgba(14, 86, 122, 0.38), rgba(4, 25, 43, 0));
  border-bottom: 1px solid rgba(75, 185, 231, 0.25);

  span {
    color: #65dfff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
  }

  h2 {
    margin: 5px 0 3px;
    color: #effaff;
    font-size: 28px;
    letter-spacing: 1px;
  }

  p {
    margin: 0;
    color: #94b9cf;
    font-size: 13px;
  }
}

.prd-close {
  width: 34px;
  height: 34px;
  color: #b9d9e9;
  cursor: pointer;
  font-size: 26px;
  line-height: 1;
  background: rgba(28, 79, 108, 0.38);
  border: 1px solid rgba(87, 196, 238, 0.35);
  border-radius: 4px;

  &:hover { color: #fff; background: rgba(51, 133, 172, 0.65); }
}

.prd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 28px;
  color: #a6c8db;
  font-size: 12px;
  background: rgba(4, 20, 35, 0.72);
  border-bottom: 1px solid rgba(75, 185, 231, 0.16);

  span {
    padding: 4px 8px;
    background: rgba(25, 85, 115, 0.26);
    border: 1px solid rgba(83, 173, 214, 0.22);
    border-radius: 3px;
  }
}

.prd-body {
  flex: 1;
  overflow: auto;
  padding: 18px 28px 28px;
}

.prd-section {
  margin-bottom: 22px;

  &:last-child { margin-bottom: 0; }

  h3 {
    margin: 0 0 6px;
    color: #62dcff;
    font-size: 17px;
    font-weight: 800;
  }
}

.prd-desc {
  margin: 0 0 9px;
  color: #a9c7d9;
  font-size: 13px;
  line-height: 1.7;
}

.prd-table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(85, 176, 217, 0.3);
  border-radius: 5px;
}

.prd-table {
  width: 100%;
  min-width: 1220px;
  font-size: 13px;
  line-height: 1.7;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;

  .prd-col-name { width: 15%; }
  .prd-col-source { width: 24%; }
  .prd-col-logic { width: 34%; }
  .prd-col-acceptance { width: 27%; }

  th,
  td {
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
    border-right: 1px solid rgba(85, 176, 217, 0.18);
    border-bottom: 1px solid rgba(85, 176, 217, 0.18);
  }

  th {
    color: #a9ddec;
    font-weight: 700;
    background: rgba(17, 66, 91, 0.7);
  }

  tbody th {
    color: #dff7ff;
    font-weight: 700;
    background: rgba(13, 53, 76, 0.38);
  }

  td { color: #b8d2e2; }
  th:last-child,
  td:last-child { border-right: 0; }
  tbody tr:last-child th,
  tbody tr:last-child td { border-bottom: 0; }
}

@media (max-width: 720px) {
  .prd-mask { padding: 12px; }
  .prd-head, .prd-meta, .prd-body { padding-right: 16px; padding-left: 16px; }
  .prd-head h2 { font-size: 21px; }
  .prd-table { font-size: 12px; }
  .prd-table { min-width: 1080px; }
}

.stage-viewport {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  transition: width 0.28s ease, height 0.28s ease;

  &.mode-formal {
    overflow: auto;
  }
}

.screen-shell {
  position: relative;
  width: 4784px;
  height: 1560px;
  transform-origin: left top;
  color: #dbeeff;
  background:
    radial-gradient(circle at 50% 30%, rgba(0, 164, 255, 0.18), transparent 38%),
    linear-gradient(90deg, rgba(23, 95, 145, 0.13) 1px, transparent 1px),
    linear-gradient(rgba(23, 95, 145, 0.12) 1px, transparent 1px),
    #04101e;
  background-size: 100% 100%, 48px 48px, 48px 48px, 100% 100%;
  transition: transform 0.28s ease;

  &::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(180deg, transparent 0, rgba(67, 214, 255, 0.08) 48%, transparent 100%);
    opacity: 0.48;
  }
}

.screen-header {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.45fr 1fr;
  align-items: center;
  height: 92px;
  padding: 0 34px;
  border-bottom: 1px solid rgba(31, 175, 255, 0.25);

  &::before {
    position: absolute;
    inset: 8px 33.5% auto;
    height: 42px;
    content: "";
    border: 1px solid rgba(31, 175, 255, 0.55);
    border-top: 0;
    transform: skewX(-28deg);
    box-shadow: 0 0 20px rgba(31, 175, 255, 0.22) inset;
  }

  h1 {
    position: relative;
    margin: 0;
    color: #f2fbff;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: 0;
    text-align: center;
    text-shadow: 0 0 18px rgba(57, 215, 255, 0.88);
  }
}

.header-left,
.header-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  color: #a8c8e8;
  font-size: 20px;
  white-space: nowrap;
}

.header-actions {
  position: relative;
  justify-content: flex-end;
  gap: 8px;

  button {
    height: 30px;
    padding: 0 8px;
    color: #bcd8f5;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .ai-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 116px;
    height: 34px;
    margin-right: 28px;
    padding: 0 11px;
    color: #e9f8ff;
    font-weight: 700;
    background: linear-gradient(100deg, rgba(50, 73, 187, .72), rgba(22, 177, 220, .62));
    border: 1px solid rgba(119, 229, 255, .78);
    font-size: 15px;
    line-height: 1;
    border-radius: 17px;
    box-shadow: 0 0 16px rgba(48, 189, 255, .4), 0 0 13px rgba(92, 95, 255, .28) inset;
  }

  .header-icon-btn { width: 30px; padding: 0; color: #a9d6ec; font-size: 19px; background: rgba(11, 53, 79, .68); border: 1px solid rgba(75, 167, 210, .34); border-radius: 4px; }
}

.ai-orbit { position: relative; display: inline-block; flex: 0 0 16px; width: 16px; height: 16px; border: 1px solid #a6f5ff; border-radius: 50%; box-shadow: 0 0 7px #72e8ff; }.ai-orbit::before { position: absolute; inset: 4px; background: #d7ffff; border-radius: 50%; box-shadow: 0 0 6px #fff; content: ''; }.ai-orbit b { position: absolute; width: 4px; height: 4px; background: #73f3ff; border-radius: 50%; box-shadow: 0 0 5px #73f3ff; }.ai-orbit b:nth-child(1) { top: -2px; left: 6px; }.ai-orbit b:nth-child(2) { right: -2px; bottom: 2px; }.ai-orbit b:nth-child(3) { bottom: -2px; left: 2px; }.header-settings { position: absolute; z-index: 50; top: 38px; right: 0; display: grid; grid-template-columns: 1fr auto; gap: 7px; align-items: end; width: 250px; padding: 10px; background: rgba(5, 25, 41, .98); border: 1px solid rgba(77, 204, 246, .55); box-shadow: 0 8px 24px rgba(0, 0, 0, .4); }.header-settings label { display: grid; gap: 4px; color: #9ec3d8; font-size: 11px; }.header-settings select { height: 28px; color: #e4f6ff; background: #10364f; border: 1px solid rgba(84, 160, 224, .38); }.header-settings button { height: 28px !important; color: #06212e !important; background: #62e7ff !important; border-radius: 3px; }.header-notice { position: absolute; z-index: 51; top: 42px; right: 0; padding: 7px 10px; color: #e7fff2; font-size: 12px; background: rgba(16, 91, 65, .96); border: 1px solid rgba(78, 238, 147, .64); border-radius: 4px; }

.weather {
  color: #f7d77f;
}

.dashboard-grid {
  position: relative;
  display: grid;
  grid-template-columns: var(--layout-statistics-width) var(--layout-charts-width) minmax(0, 1fr) var(--layout-dispatch-width);
  gap: 14px;
  height: calc(100% - 92px);
  padding: 14px;
}

.layout-guide-layer {
  position: absolute;
  z-index: 45;
  inset: 14px;
  display: grid;
  grid-template-columns: var(--layout-statistics-width) var(--layout-charts-width) minmax(0, 1fr) var(--layout-dispatch-width);
  gap: 14px;
  pointer-events: none;
}

.layout-guide-cell {
  position: relative;
  min-width: 0;
  border-top: 2px dashed rgba(99, 231, 255, 0.88);

  &::before,
  &::after {
    position: absolute;
    top: -7px;
    width: 2px;
    height: 14px;
    background: #63e7ff;
    content: '';
    box-shadow: 0 0 7px rgba(99, 231, 255, 0.8);
  }

  &::before { left: 0; }
  &::after { right: 0; }

  span {
    position: absolute;
    top: 8px;
    left: 50%;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: calc(100% - 20px);
    height: 38px;
    padding: 0 14px;
    overflow: hidden;
    color: #dffaff;
    font-size: 22px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: rgba(5, 35, 55, 0.94);
    border: 1px solid rgba(99, 231, 255, 0.72);
    border-radius: 4px;
    transform: translateX(-50%);
    box-shadow: 0 0 18px rgba(44, 201, 255, 0.26);
  }

  b {
    display: inline-grid;
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
    color: #032338;
    font-size: 16px;
    place-items: center;
    background: #63e7ff;
    border-radius: 50%;
  }

  &:nth-child(2) {
    border-color: rgba(85, 238, 176, 0.88);
    &::before, &::after, b { background: #55eeb0; }
    span { border-color: rgba(85, 238, 176, 0.72); }
  }

  &:nth-child(3) {
    border-color: rgba(255, 209, 115, 0.9);
    &::before, &::after, b { background: #ffd173; }
    span { border-color: rgba(255, 209, 115, 0.72); }
  }

  &:nth-child(4) {
    border-color: rgba(157, 143, 255, 0.9);
    &::before, &::after, b { background: #9d8fff; }
    span { border-color: rgba(157, 143, 255, 0.72); }
  }
}

:deep(.panel-card),
.map-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(11, 31, 48, 0.88), rgba(7, 23, 37, 0.92));
  border: 1px solid rgba(58, 145, 206, 0.38);
  box-shadow: 0 0 0 1px rgba(8, 39, 62, 0.8) inset, 0 0 28px rgba(0, 149, 255, 0.08);

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(90deg, rgba(36, 198, 255, 0.18), transparent 24%, transparent 76%, rgba(36, 198, 255, 0.12));
    opacity: 0.45;
  }
}

:deep(.panel-title),
.panel-title {
  position: relative;
  z-index: 1;
  height: 34px;
  padding: 8px 12px 0;
  color: #66dcff;
  font-size: 15px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(61, 206, 255, 0.42);
}

.left-rail,
.analysis-column {
  display: grid;
  gap: 8px;
  min-height: 0;
}

.left-rail {
  grid-column: 1;
  // 保持基础档案高度，压缩资产区并把空间补给累计数据，避免底部模块拥挤或大面积留白。
  grid-template-rows: 1.8fr 1.05fr 0.45fr;
  animation: panelEnterLeft 0.7s ease both;
}

.analysis-column {
  grid-column: 2;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  animation: panelEnterLeft 0.82s ease 0.05s both;
}

.archive-list,
.operation-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  padding: 4px 14px 14px;
}

.archive-row,
.operation-row {
  display: grid;
  grid-template-columns: 24px 70px 30px 1fr;
  align-items: center;
  min-height: 32px;
  color: #c8dcf2;
  border-bottom: 1px solid rgba(120, 180, 230, 0.1);

  strong {
    color: #e7f5ff;
    font-size: 18px;
    font-family: DINPro, Arial, sans-serif;
    font-weight: 800;
  }

  em {
    color: #a4bdd4;
    font-style: normal;
  }
}

.asset-health-card { min-height: 0; }.asset-health-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; height: calc(100% - 38px); padding: 8px 14px 14px; }.asset-health-row { display: grid; grid-template-columns: 30px 1fr; grid-template-rows: 32px 1fr 24px; gap: 5px 7px; align-items: center; min-height: 0; padding: 12px 10px; color: #dff3ff; cursor: pointer; text-align: left; background: linear-gradient(145deg, rgba(18, 65, 88, .62), rgba(7, 35, 55, .54)); border: 1px solid rgba(84, 160, 224, .34); border-radius: 6px; }.asset-health-row:hover { background: rgba(24, 87, 120, .7); border-color: rgba(87, 221, 255, .62); }.asset-icon { position: relative; display: block; width: 28px; height: 28px; filter: drop-shadow(0 0 5px rgba(75, 222, 255, .72)); }.asset-icon::before, .asset-icon::after, .asset-icon i, .asset-icon b { position: absolute; box-sizing: border-box; content: ''; }.asset-icon.box::before { inset: 4px 3px 3px 4px; border: 2px solid #67e5ff; transform: skewY(-25deg); }.asset-icon.box::after { top: 2px; left: 8px; width: 15px; height: 8px; border: 2px solid #a3f5ff; transform: skewX(35deg); }.asset-icon.box i { top: 8px; left: 14px; width: 2px; height: 15px; background: #67e5ff; transform: skewY(-25deg); }.asset-icon.vehicle::before { top: 9px; left: 2px; width: 24px; height: 11px; border: 2px solid #6fe7ff; border-radius: 3px 5px 2px 2px; }.asset-icon.vehicle::after { bottom: 2px; left: 4px; width: 5px; height: 5px; background: #aaf7ff; border-radius: 50%; box-shadow: 14px 0 #aaf7ff; }.asset-icon.vehicle i { top: 4px; left: 13px; width: 9px; height: 7px; border: 2px solid #6fe7ff; border-bottom: 0; transform: skewX(-18deg); }.asset-icon.tricycle::before { top: 9px; left: 6px; width: 14px; height: 10px; border: 2px solid #76f0bd; border-radius: 2px; }.asset-icon.tricycle::after { bottom: 2px; left: 3px; width: 5px; height: 5px; background: #bdffe1; border-radius: 50%; box-shadow: 14px 0 #bdffe1, 20px 0 #bdffe1; }.asset-icon.tricycle i { top: 5px; left: 1px; width: 9px; height: 8px; border: 2px solid #76f0bd; border-right: 0; transform: skewY(-22deg); }.asset-health-row strong { font-size: 13px; }.asset-health-row em { grid-column: 1 / -1; align-self: end; color: #f0fbff; font-size: 22px; font-style: normal; }.asset-health-row b { grid-column: 1 / -1; align-self: start; padding-top: 5px; color: #67eea6; font-size: 12px; border-top: 1px solid rgba(93, 175, 214, .2); }.asset-health-row b.warning { color: #ffd173; }.asset-health-row b.danger { color: #ff7a70; }
.asset-health-grid { gap: 12px; padding: 10px 14px 14px; }.asset-health-row { grid-template-columns: 78px minmax(0, 1fr); grid-template-rows: 1fr; min-height: 0; padding: 12px 14px; background: linear-gradient(145deg, rgba(18, 72, 102, .76), rgba(5, 29, 49, .72)); border-color: rgba(73, 203, 249, .5); border-radius: 7px; box-shadow: inset 0 0 18px rgba(29, 166, 229, .08); }.asset-health-row .asset-icon { align-self: center; width: 56px; height: 56px; transform: scale(1.65); transform-origin: left center; }.asset-health-row .asset-icon b { display: block !important; grid-column: auto !important; align-self: auto !important; padding: 0 !important; font-size: 0 !important; background: transparent !important; border: 0 !important; border-radius: 0 !important; }.asset-copy { display: grid; grid-template-columns: 1fr auto; align-content: center; gap: 4px 7px; min-width: 0; }.asset-copy strong { color: #d7f4ff; font-size: 15px; }.asset-copy em { color: #f4fbff; font-size: 30px; font-style: normal; font-family: DINPro, Arial, sans-serif; }.asset-copy b { grid-column: 1 / -1; display: flex; align-items: center; gap: 5px; padding: 5px 7px; color: #aee6dc; font-size: 11px; font-weight: 500; background: rgba(38, 173, 148, .12); border: 1px solid rgba(80, 232, 184, .26); border-radius: 3px; }.asset-copy b::before { width: 8px; height: 8px; background: #55eaaa; border-radius: 50%; box-shadow: 0 0 7px #55eaaa; content: ''; }.asset-copy b i { color: #62f0a9; font-size: 15px; font-style: normal; font-weight: 800; }.asset-copy b.warning i { color: #ffd173; }.asset-copy b.danger i { color: #ff7a70; }

// 资产设备监控：使用独立透明 PNG，构图与方案一一致，避免 CSS 图标在不同分辨率下变形。
.asset-health-card {
  min-height: 0;
  margin-top: 10px;
}

.asset-health-card .asset-health-grid {
  display: grid;
  box-sizing: border-box;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  height: calc(100% - 72px);
  padding: 2px 12px 8px;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.asset-health-card .asset-health-row {
  position: relative;
  display: grid;
  // 图标列固定，避免百分比网格在大屏缩放后挤压右侧数字区。
  grid-template-columns: 58px minmax(0, 1fr);
  grid-template-rows: 1fr;
  min-width: 0;
  min-height: 0;
  padding: 5px 12px;
  overflow: visible;
  color: #dff3ff;
  cursor: default;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;

  &:not(:last-child) { border-right: 1px solid rgba(78, 186, 226, 0.42); }
}

.asset-health-card .asset-art {
  z-index: 1;
  align-self: center;
  justify-self: start;
  width: 46px;
  height: min(44px, calc(100% - 4px));
  max-width: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(73, 224, 255, 0.34));
}

.asset-health-card .asset-art.box {
  width: 50px;
  height: min(48px, calc(100% - 4px));
  margin-left: 0;
}

.asset-health-card .asset-art.vehicle {
  width: 48px;
  height: min(40px, calc(100% - 4px));
  margin-left: 0;
}

.asset-health-card .asset-art.tricycle {
  width: 44px;
  height: min(38px, calc(100% - 4px));
  margin-left: 0;
  filter: drop-shadow(0 0 8px rgba(100, 248, 189, 0.34));
}

.asset-health-card .asset-copy {
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr;
  align-content: center;
  gap: 2px;
  min-width: 0;
  padding: 0;
}

.asset-health-card .asset-copy strong {
  color: #e3f7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}

.asset-health-card .asset-copy em {
  color: #f3fbff;
  font-family: DINPro, Arial, sans-serif;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 1px;
  white-space: nowrap;
}

.asset-health-card .asset-copy b {
  display: flex;
  grid-column: auto;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
  margin-top: 1px;
  padding: 0;
  color: #67eca9;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.15;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.asset-health-card .asset-copy b::before {
  display: none;
}

.asset-health-card .asset-copy b i {
  color: inherit;
  font-size: 17px;
  font-style: normal;
  font-weight: 800;
}

.asset-health-card .asset-copy b.warning { color: #ffc65d; border-color: rgba(255, 194, 84, 0.42); }
.asset-health-card .asset-copy b.danger { color: #ff7c78; border-color: rgba(255, 111, 104, 0.42); }

.operation-row {
  grid-template-columns: 24px 1fr 70px 40px;

  strong {
    text-align: right;
  }
}

.screen-shell .result-card .operation-list {
  gap: 8px;
  padding-bottom: 18px;
}

.screen-shell .result-card .operation-row {
  min-height: 60px;
}

.row-icon {
  color: #bde7ff;
  font-size: 18px;
  text-align: center;
  text-shadow: 0 0 10px rgba(59, 204, 255, 0.38);
}

.chart-card {
  min-height: 0;
}

.analysis-chart {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - 36px);
  padding: 4px 8px 8px;
}

.rank-chart,
.driver-chart,
.trend-chart,
.ontime-chart {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - 36px);
  padding: 6px 12px 12px;
}

.rank-chart,
.driver-chart {
  display: grid;
  align-content: space-evenly;
  gap: 3px;
}

.rank-row,
.driver-row {
  display: grid;
  grid-template-columns: 22px 78px 1fr 54px;
  align-items: center;
  gap: 8px;
  min-height: 22px;
  color: #b7d3ec;
  font-size: 12px;
}

.driver-row {
  grid-template-columns: 22px 64px 1fr 50px 38px;

  em {
    color: #45df85;
    font-style: normal;
    text-align: right;
  }
}

.rank-index {
  color: #7fa4c1;
  font-family: DINPro, Arial, sans-serif;
  text-align: center;
}

.rank-name {
  overflow: hidden;
  color: #d7ebff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-track {
  height: 10px;
  overflow: hidden;
  background: rgba(57, 118, 174, 0.22);
  border-radius: 999px;

  i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #486dff, #22ddff);
    border-radius: inherit;
    box-shadow: 0 0 12px rgba(37, 201, 255, 0.36);
  }
}

.driver-row .rank-track i {
  background: linear-gradient(90deg, #1588ff, #19e4ff);
}

.rank-row strong,
.driver-row strong {
  color: #e2f4ff;
  font-size: 12px;
  font-family: DINPro, Arial, sans-serif;
  font-weight: 700;
  text-align: right;
}

.trend-chart {
  display: grid;
  grid-template-rows: 1fr 20px;
  gap: 2px;

  svg {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  text {
    fill: #c8f7d9;
    font-size: 10px;
  }
}

.ontime-chart {
  display: grid;
  grid-template-rows: 1fr 18px 18px;
  gap: 0;

  svg {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  text {
    font-size: 10px;
  }
}

.trend-grid {
  stroke: rgba(74, 162, 255, 0.14);
  stroke-width: 1;
}

.trend-area {
  fill: rgba(46, 221, 118, 0.13);
}

.trend-line {
  fill: none;
  stroke: #32de79;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 5px rgba(50, 222, 121, 0.42));
}

.trend-dot {
  fill: #32de79;
  stroke: #dfffe8;
  stroke-width: 1.4;
}

.ontime-bar {
  fill: url("#ontimeBarGradient");
}

.ontime-chart svg {
  .ontime-bar {
    fill: #166dd6;
    filter: drop-shadow(0 0 5px rgba(25, 133, 255, 0.45));
  }
}

.ontime-line {
  fill: none;
  stroke: #42f08f;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 5px rgba(66, 240, 143, 0.42));
}

.ontime-dot {
  fill: #42f08f;
  stroke: #e6fff0;
  stroke-width: 1.3;
}

.ontime-task-label {
  fill: #cfe8ff;
}

.ontime-rate-label {
  fill: #bfffd5;
}

.ontime-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: #9db9d5;
  font-size: 11px;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  i {
    display: inline-block;
    width: 14px;
    height: 7px;
    border-radius: 2px;
  }

  .bar-mark {
    background: #166dd6;
  }

  .line-mark {
    height: 2px;
    background: #42f08f;
  }
}

.trend-axis {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  color: #9db9d5;
  font-size: 11px;
  text-align: center;
}

.map-panel {
  grid-column: 3;
  display: flex;
  flex-direction: column;
  padding: 4px;
  animation: mapEnter 0.86s ease 0.08s both;
}

.map-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #081220;

  // 雷达扫描装饰环 — 仅边缘微弱光晕，不遮挡地图
  &::after {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    content: "";
    background:
      radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(10, 40, 64, 0.35) 84%, rgba(4, 20, 36, 0.65) 100%);
  }
}

.v2-map-base {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 50% 42%, #0b2d42, #040c17 68%);

  :deep(.amap-container) {
    width: 100%;
    height: 100%;
    background: #050d18 !important;
  }

}

.map-engine-error {
  position: absolute;
  z-index: 11;
  top: 50%;
  left: 50%;
  max-width: 58%;
  padding: 14px 20px;
  color: #ffd4ca;
  font-size: 18px;
  text-align: center;
  background: rgba(44, 9, 10, 0.92);
  border: 1px solid rgba(255, 106, 88, 0.55);
  border-radius: 8px;
  transform: translate(-50%, -50%);
}

.map-zoom-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  transform-origin: center center;
  transition: transform 0.22s ease;
  pointer-events: none;

  &::before,
  &::after {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    content: "";
  }

  &::before {
    background:
      linear-gradient(90deg, rgba(64, 212, 255, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(64, 212, 255, 0.08) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(circle at 50% 50%, #000 0 56%, transparent 78%);
  }

  &::after {
    background:
      radial-gradient(circle at 28% 32%, rgba(51, 230, 255, 0.16), transparent 12%),
      radial-gradient(circle at 68% 58%, rgba(65, 255, 169, 0.12), transparent 14%);
  }

  > * {
    pointer-events: auto;
  }
}

.map-zoom-controls {
  position: absolute;
  z-index: 12;
  bottom: 42px;
  left: 42px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  color: rgba(196, 223, 243, 0.78);
  font-size: 12px;
  background: rgba(4, 18, 31, 0.72);
  border: 1px solid rgba(86, 170, 230, 0.28);
  border-radius: 4px;

  button {
    min-width: 28px;
    height: 24px;
    padding: 0 7px;
    color: rgba(215, 240, 255, 0.86);
    cursor: pointer;
    background: rgba(20, 57, 82, 0.72);
    border: 1px solid rgba(94, 174, 232, 0.24);
    border-radius: 3px;
  }

  span {
    min-width: 38px;
    text-align: center;
  }
}

.map-theme-switcher {
  position: absolute;
  z-index: 12;
  bottom: 142px;
  left: 42px;

  .theme-trigger,
  .theme-menu button {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 82px;
    padding: 0 18px;
    color: rgba(182, 211, 232, 0.72);
    font-size: 30px;
    white-space: nowrap;
    cursor: pointer;
    background: rgba(4, 22, 37, 0.9);
    border: 1px solid rgba(81, 157, 211, 0.24);
    border-radius: 5px;
    transition: color 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s;

    i {
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      border: 1px solid rgba(181, 226, 255, 0.44);
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(48, 186, 255, 0.3);
    }

    &:hover {
      color: #e3f7ff;
      border-color: rgba(73, 197, 255, 0.55);
    }

    &.active {
      color: #e9fbff;
      background: rgba(15, 102, 157, 0.58);
      border-color: rgba(74, 213, 255, 0.7);
      box-shadow: 0 0 10px rgba(37, 191, 255, 0.18) inset;
    }
  }

  .theme-trigger {
    color: #d4efff;
    border-color: rgba(72, 188, 245, 0.5);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.32);

    span { min-width: 88px; }

    b {
      color: #78d9ff;
      font-size: 30px;
      font-weight: 500;
      line-height: 1;
      transform: translateY(-2px);
      transition: transform 0.2s;
    }
  }

  &.open .theme-trigger b {
    transform: translateY(1px) rotate(180deg);
  }

  .theme-menu {
    position: absolute;
    bottom: 94px;
    left: 0;
    display: grid;
    gap: 5px;
    min-width: 196px;
    padding: 10px;
    background: rgba(3, 16, 28, 0.94);
    border: 1px solid rgba(78, 169, 232, 0.34);
    border-radius: 6px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.42);
  }
}

.region-shape {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.town-label {
  position: absolute;
  color: rgba(222, 244, 255, 0.75);
  font-size: 15px;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.9);
}

.town-a { left: 10%; top: 25%; }
.town-b { left: 58%; top: 19%; }
.town-c { left: 28%; top: 31%; }
.town-d { left: 40%; top: 53%; }
.town-e { left: 57%; top: 64%; }
.town-f { right: 7%; bottom: 11%; color: rgba(222, 244, 255, 0.42); }

.map-entity {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 8px rgba(31, 211, 255, 0.34));
  box-shadow: none;
  animation: mapPointIn 0.5s ease both, mapPointBreath 2.4s ease-in-out infinite;

  .entity-icon {
    position: relative;
    display: block;
    width: 24px;
    height: 24px;
    color: currentColor;

    &::before,
    &::after {
      position: absolute;
      content: "";
    }
  }

  em {
    position: absolute;
    top: 30px;
    left: 50%;
    display: none;
    padding: 1px 6px;
    color: #e6f6ff;
    font-size: 10px;
    font-style: normal;
    white-space: nowrap;
    background: rgba(0, 10, 18, 0.72);
    border-radius: 3px;
    transform: translateX(-50%);
  }

  &:hover {
    z-index: 10;
    transform: translate(-50%, -50%) scale(1.18);

    em {
      display: block;
    }
  }

  &.truck-small { color: #22aaff; }

  &.truck-hook,
  &.small-box { color: #36e889; }

  &.truck-large,
  &.large-box { color: #ffca38; }

  &.collection { color: #b487ff; }

  &.station { color: #20d5d2; }

  &.plant,
  &.alarm { color: #ff6647; }

  &.truck-small,
  &.truck-hook,
  &.truck-large {
    .entity-icon {
      &::before {
        left: 2px;
        top: 7px;
        width: 17px;
        height: 10px;
        background: linear-gradient(135deg, color-mix(in srgb, currentColor 85%, white 15%), currentColor);
        border-radius: 4px 5px 3px 3px;
        box-shadow: 0 0 10px currentColor;
      }

      &::after {
        right: 1px;
        top: 10px;
        width: 8px;
        height: 7px;
        background: linear-gradient(135deg, rgba(235, 253, 255, 0.95), currentColor);
        border-radius: 2px 4px 3px 1px;
        box-shadow:
          -12px 7px 0 -4px #07121e,
          -12px 7px 0 -2px currentColor,
          0 7px 0 -4px #07121e,
          0 7px 0 -2px currentColor;
      }
    }
  }

  &.truck-large .entity-icon {
    transform: scale(1.14);
  }

  &.small-box,
  &.large-box {
    .entity-icon {
      &::before {
        inset: 4px;
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), currentColor 34%, color-mix(in srgb, currentColor 72%, #042138 28%));
        border-radius: 4px;
        transform: rotate(45deg);
        box-shadow: 0 0 13px currentColor;
      }

      &::after {
        left: 9px;
        top: 5px;
        width: 7px;
        height: 14px;
        border-right: 1px solid rgba(255, 255, 255, 0.45);
        border-left: 1px solid rgba(3, 18, 31, 0.45);
        transform: rotate(45deg);
      }
    }
  }

  &.large-box .entity-icon {
    transform: scale(1.16);
  }

  &.collection {
    .entity-icon {
      width: 18px;
      height: 18px;
      background: radial-gradient(circle at 38% 34%, #fff, currentColor 42%, rgba(45, 20, 90, 0.95));
      border-radius: 50%;
      box-shadow: 0 0 16px currentColor;

      &::before {
        inset: -5px;
        border: 1px solid currentColor;
        border-radius: 50%;
        opacity: 0.42;
      }
    }
  }

  &.station {
    .entity-icon {
      &::before {
        left: 4px;
        top: 8px;
        width: 16px;
        height: 12px;
        background: linear-gradient(180deg, rgba(240, 255, 255, 0.92), currentColor);
        clip-path: polygon(50% 0, 100% 38%, 100% 100%, 0 100%, 0 38%);
        box-shadow: 0 0 13px currentColor;
      }

      &::after {
        left: 9px;
        top: 13px;
        width: 6px;
        height: 7px;
        background: rgba(4, 20, 34, 0.72);
        border-radius: 1px 1px 0 0;
      }
    }
  }

  &.plant {
    .entity-icon {
      &::before {
        left: 4px;
        bottom: 4px;
        width: 17px;
        height: 11px;
        background: linear-gradient(145deg, rgba(255, 245, 224, 0.92), currentColor);
        clip-path: polygon(0 36%, 24% 56%, 46% 30%, 66% 54%, 100% 20%, 100% 100%, 0 100%);
        box-shadow: 0 0 14px currentColor;
      }

      &::after {
        right: 3px;
        top: 3px;
        width: 5px;
        height: 14px;
        background: currentColor;
        border-radius: 3px 3px 0 0;
        box-shadow: -7px -2px 0 -2px rgba(255, 255, 255, 0.72);
      }
    }
  }

  &.online { filter: drop-shadow(0 0 8px rgba(40, 226, 113, 0.42)); }
  &.offline { opacity: 0.52; filter: grayscale(0.65); }
  &.charging { filter: drop-shadow(0 0 10px rgba(85, 183, 255, 0.68)); }
  &.warning { filter: drop-shadow(0 0 11px rgba(255, 191, 54, 0.58)); }
  &.danger { filter: drop-shadow(0 0 13px rgba(255, 76, 65, 0.68)); }
}

/* ImageGen 生成的业务对象直接作为地图点位，保留真实轮廓而非抽象几何标记。 */
.map-entity {
  width: 52px;
  height: 52px;
  overflow: visible;

  .entity-icon,
  &.collection .entity-icon,
  &.station .entity-icon,
  &.plant .entity-icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    background: none;
    border-radius: 0;
    box-shadow: none;

    &::before,
    &::after {
      display: none;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
      filter: drop-shadow(0 3px 4px rgba(0, 5, 12, 0.82)) drop-shadow(0 0 5px currentColor);
      transform: translateZ(0);
    }
  }

  &.truck-small .entity-icon { transform: scale(1.02); }
  &.truck-hook .entity-icon { transform: scale(1.08); }
  &.truck-large .entity-icon { transform: scale(1.2); }
  &.small-box .entity-icon { transform: scale(0.92); }
  &.large-box .entity-icon { transform: scale(1.08); }
  &.collection .entity-icon { transform: scale(1.02); }
  &.station .entity-icon { transform: scale(1.12); }
  &.plant .entity-icon { transform: scale(1.28); }
  &.alarm .entity-icon { transform: scale(0.84); }

  em {
    top: 54px;
  }
}

.alarm-dot {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 15px;
  height: 15px;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  line-height: 15px;
  text-align: center;
  background: #ff4a36;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(255, 74, 54, 0.8);

  &.pulse {
    animation: alarmPulse 1.2s ease-in-out infinite;
  }
}

.map-kpis {
  position: absolute;
  z-index: 8;
  top: 10px;
  left: 50%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  width: 74%;
  min-width: 640px;
  overflow: hidden;
  background: rgba(7, 20, 34, 0.78);
  border: 1px solid rgba(84, 165, 229, 0.38);
  border-radius: 6px;
  transform: translateX(-50%);
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.5), 0 0 24px rgba(16, 149, 255, 0.2);
}

.map-kpi {
  padding: 10px 8px;
  text-align: center;
  border-right: 1px solid rgba(116, 165, 205, 0.18);

  &:last-child {
    border-right: 0;
  }

  span {
    display: block;
    color: #9db9d5;
    font-size: 12px;
  }

  strong {
    color: #e5f6ff;
    font-size: 22px;
    font-family: DINPro, Arial, sans-serif;
  }

  em {
    margin-left: 4px;
    color: #9ab5cf;
    font-size: 12px;
    font-style: normal;
  }

  &:last-child strong {
    color: #ff594f;
  }
}

.map-layer-bar {
  position: absolute;
  z-index: 8;
  bottom: 12px;
  left: 50%;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  padding: 8px 18px;
  color: rgba(190, 214, 232, 0.72);
  font-size: 12px;
  background: rgba(5, 18, 30, 0.82);
  border: 1px solid rgba(84, 165, 229, 0.32);
  border-radius: 8px;
  transform: translateX(-50%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

  > span {
    color: rgba(140, 200, 240, 0.6);
    margin-right: 4px;
  }

  button {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 7px;
    color: rgba(190, 214, 232, 0.64);
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s;

    &:hover {
      color: rgba(220, 240, 255, 0.9);
      background: rgba(45, 135, 210, 0.18);
    }

    &.active {
      color: #d7f0ff;
      background: rgba(45, 135, 210, 0.28);
      text-shadow: 0 0 8px rgba(120, 210, 255, 0.5);
    }
  }

  i {
    font-size: 16px;
    font-style: normal;
  }

  .layer-icon {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    object-fit: contain;
    filter: drop-shadow(0 0 5px rgba(80, 210, 255, 0.42));
    opacity: 0.46;
    transition: opacity 0.2s, filter 0.2s, transform 0.2s;
  }

  button:hover .layer-icon,
  button.active .layer-icon {
    opacity: 1;
    filter: drop-shadow(0 0 7px rgba(95, 221, 255, 0.72));
  }

  button:hover .layer-icon {
    transform: translateY(-1px) scale(1.08);
  }
}

.detail-panel {
  position: absolute;
  z-index: 10;
  // 避开地图顶部汇总指标与底部图层图例，始终保持地图操作区域可见。
  // 顶部从汇总指标下方开始，底部停在图层图例上方。
  top: 215px;
  right: 0;
  bottom: 190px;
  width: 500px;
  overflow-y: auto;
  padding: 0 7px 7px;
  background: linear-gradient(180deg, rgba(11, 31, 48, 0.94), rgba(7, 23, 37, 0.96));
  border: 1px solid rgba(58, 145, 206, 0.42);
  border-right: 0;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5), 0 0 28px rgba(0, 149, 255, 0.1);
  animation: slideInDetail 0.24s ease both;

  &::before {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: "";
    background: linear-gradient(90deg, rgba(36, 198, 255, 0.18), transparent 60%);
    opacity: 0.35;
  }
}

.right-rail {
  grid-column: 4;
  min-width: 0;
  animation: panelEnterRight 0.78s ease 0.08s both;
}

.left-rail,
.analysis-column,
.map-panel,
.right-rail {
  contain: layout style;
}

.detail-close {
  position: absolute;
  top: 6px;
  right: 8px;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #9fc7e6;
  cursor: pointer;
  font-size: 0;
  line-height: 1;
  background: rgba(10, 34, 52, 0.9);
  border: 1px solid rgba(84, 160, 224, 0.34);
  border-radius: 4px;
  transition: border-color 0.18s ease, background 0.18s ease;

  &::before,
  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 15px;
    height: 2px;
    background: #a9d4f1;
    border-radius: 2px;
    transform-origin: center;
    content: "";
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }

  &:hover {
    background: rgba(20, 70, 98, 0.94);
    border-color: rgba(103, 215, 255, 0.72);
  }
}

.entity-tabs,
.right-tabs {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 0;

  button {
    height: 30px;
    color: #b7ccea;
    cursor: pointer;
    background: rgba(16, 40, 63, 0.86);
    border: 1px solid rgba(88, 154, 220, 0.32);
    border-radius: 3px;

    &.active {
      color: #55ff91;
      background: rgba(18, 94, 70, 0.56);
      border-color: rgba(65, 225, 134, 0.42);
    }
  }
}

.entity-summary {
  position: relative;
  z-index: 1;
  min-height: 0;
  padding: 4px 0 5px;
  border-bottom: 1px solid rgba(84, 158, 213, 0.18);

  div {
    color: #a7bfd7;
    font-size: 13px;
  }

  strong {
    color: #e9f6ff;
    font-size: 16px;
  }

  p {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #56e985;
    margin: 5px 0;
    font-size: 12px;
  }

  .entity-status-line {
    strong { color: #dff7ff; font-size: 13px; }

    em {
      padding: 1px 5px;
      color: #ffcf72;
      font-size: 11px;
      font-style: normal;
      line-height: 18px;
      background: rgba(255, 166, 56, 0.12);
      border: 1px solid rgba(255, 184, 77, 0.34);
      border-radius: 3px;

      &.低电量 { color: #ffd25a; }
      &.高温 { color: #ff8a72; background: rgba(255, 81, 67, 0.12); border-color: rgba(255, 105, 85, 0.34); }
    }
  }

  i {
    width: 9px;
    height: 9px;
    background: #32e676;
    border-radius: 50%;
    box-shadow: 0 0 10px #32e676;

    &.danger {
      background: #ff4a36;
      box-shadow: 0 0 10px #ff4a36;
    }

    &.offline { background: #8295a8; box-shadow: none; }
    &.charging { background: #55b7ff; box-shadow: 0 0 10px #55b7ff; }
  }

  img {
    position: absolute;
    right: 6px;
    bottom: 2px;
    width: 56px;
    height: auto;
  }

  &.has-image {
    min-height: 60px;
  }
}

.detail-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 7px;
  padding: 14px 0;

  div {
    display: grid;
    grid-template-columns: 74px 1fr;
    gap: 8px;
    font-size: 13px;
  }

  span {
    color: #8ea9c2;
  }

  strong {
    color: #dceeff;
    font-weight: 600;
  }
}

// 基础资料以信息卡呈现，优先扫读关键字段；地址类字段独占一行。
.detail-section .detail-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  padding: 8px 0 2px;

  > div {
    display: block;
    min-width: 0;
    padding: 4px 6px;
    background: rgba(24, 69, 98, 0.26);
    border: 1px solid rgba(84, 158, 213, 0.16);
    border-radius: 3px;

    &.wide { grid-column: 1 / -1; }
  }

  span,
  strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { margin-bottom: 2px; font-size: 11px; }
  strong { color: #e4f5ff; font-size: 12px; font-weight: 600; }
}

.detail-section,
.statistics-card {
  position: relative;
  z-index: 1;
  padding: 6px 0;
  border-bottom: 1px solid rgba(84, 158, 213, 0.18);
}

.task-card {
  margin-top: 8px;
}

.task-name {
  margin-top: 6px;
  overflow: hidden;
  color: #e8f8ff;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-route {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  margin-top: 7px;

  > i { color: #4bcfff; font-size: 14px; font-style: normal; text-align: center; }
}

.task-stop {
  min-width: 0;
  padding: 5px 6px;
  background: rgba(26, 83, 115, 0.24);
  border: 1px solid rgba(85, 165, 215, 0.2);
  border-radius: 3px;

  span,
  strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span { color: #83a9c5; font-size: 10px; }
  strong { margin-top: 2px; color: #d8f1ff; font-size: 11px; font-weight: 500; }

  &.start { border-left: 2px solid #39d7ff; }
  &.end { border-left: 2px solid #5ce898; }
}

.task-meta {
  display: flex;
  gap: 12px;
  margin-top: 7px;
  color: #90aec6;
  font-size: 11px;

  strong { margin-left: 3px; color: #e1f2fb; }
  em {
    margin-left: 3px;
    padding: 1px 5px;
    color: #5ff0a4;
    font-style: normal;
    background: rgba(37, 188, 111, 0.12);
    border: 1px solid rgba(63, 226, 141, 0.24);
    border-radius: 3px;
  }
}

.task-detail-btn,
.talk-button,
.command-list button {
  width: 100%;
  height: 28px;
  margin-top: 6px;
  font-size: 12px;
  color: #d8f5ff;
  cursor: pointer;
  background: rgba(16, 85, 128, 0.5);
  border: 1px solid rgba(74, 211, 255, 0.48);
  border-radius: 4px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 6px;

  > div {
    padding: 5px 4px;
    text-align: center;
    background: rgba(23, 73, 104, 0.3);
    border: 1px solid rgba(83, 163, 210, 0.2);
  }

  strong,
  span { display: block; }
  strong { color: #62f3c6; font-size: 14px; }
  span { margin-top: 3px; color: #8ea9c2; font-size: 11px; }
}

.relation-card {
  position: relative;
  z-index: 1;
  padding: 7px 0;
  border-top: 1px solid rgba(84, 158, 213, 0.18);
  border-bottom: 1px solid rgba(84, 158, 213, 0.18);
}

.section-title,
.table-title {
  color: #59d8ff;
  font-size: 14px;
  font-weight: 800;
}

.relation-row {
  display: grid;
  grid-template-columns: 1fr auto 18px;
  align-items: center;
  min-height: 25px;
  color: #9cb8d3;
  font-size: 12px;

  strong {
    color: #e3f1ff;
  }

  i {
    color: #6baed9;
    font-style: normal;
    text-align: right;
  }
}

.quick-actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding-top: 8px;

  button {
    height: 28px;
    font-size: 12px;
    color: #bbdcff;
    cursor: pointer;
    background: rgba(18, 47, 76, 0.86);
    border: 1px solid rgba(84, 160, 224, 0.34);
    border-radius: 4px;
  }
}

.action-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 8px 0 0;

  button { height: 28px; padding: 0 3px; font-size: 11px; }
}

.entity-action-panel {
  position: absolute;
  z-index: 12;
  top: 190px;
  right: 518px;
  width: 620px;
  min-height: 0;
  padding: 0 12px 12px;
  background: linear-gradient(180deg, rgba(9, 36, 57, 0.97), rgba(5, 20, 34, 0.98));
  border: 1px solid rgba(74, 211, 255, 0.55);
  box-shadow: 0 0 28px rgba(0, 149, 255, 0.26), -8px 8px 26px rgba(0, 0, 0, 0.42);
  animation: slideInDetail 0.2s ease both;
}

.action-task-title { position: relative; z-index: 1; padding: 12px 0 4px; color: #63e7ff; font-size: 15px; font-weight: 700; }
.action-content { padding-bottom: 2px; }
.action-hint { position: relative; z-index: 1; color: #a9c9df; font-size: 13px; line-height: 1.7; }

.track-map {
  position: relative;
  height: 260px;
  margin-top: 8px;
  overflow: hidden;
  background:
    linear-gradient(rgba(120, 183, 233, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 183, 233, 0.08) 1px, transparent 1px),
    #0a2232;
  background-size: 30px 30px;
  border: 1px solid rgba(90, 179, 228, 0.38);

  svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .track-route-shadow { stroke: rgba(83, 146, 219, 0.24); stroke-width: 11; }
  .track-route { stroke: #6099f6; stroke-width: 7; stroke-dasharray: 1090; transition: stroke-dashoffset 0.18s linear; filter: drop-shadow(0 0 4px rgba(84, 145, 255, 0.6)); }
  .track-car-glow { fill: rgba(47, 244, 159, 0.28); }
  .track-car { fill: #35ee92; stroke: #eafff4; stroke-width: 3; filter: drop-shadow(0 0 6px #35ee92); }
}

.track-map.live {
  .track-route { stroke: #21cde3; stroke-width: 8; transition: stroke-dashoffset 0.42s linear; }
  .track-car-glow { animation: liveCarPulse 1.1s ease-in-out infinite; }
}

.track-map-label {
  position: absolute;
  z-index: 1;
  display: grid;
  width: 25px;
  height: 25px;
  color: #fff;
  font-size: 12px;
  place-items: center;
  border-radius: 50%;

  &.start { bottom: 12px; left: 35px; background: #38bdf8; }
  &.end { top: 35px; right: 65px; background: #ff5a50; }
}

.track-place { position: absolute; z-index: 1; color: rgba(199, 228, 255, 0.62); font-size: 11px; }
.track-place.a { bottom: 32px; left: 31%; }.track-place.b { top: 26px; left: 43%; }.track-place.c { bottom: 80px; right: 12%; }

.track-toolbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 8px;
  color: #a8c5d9;
  font-size: 11px;

  button { height: 23px; min-width: 34px; padding: 0 6px; color: #bbd5e9; cursor: pointer; background: rgba(26, 66, 95, 0.64); border: 1px solid rgba(101, 159, 206, 0.3); border-radius: 12px; }
  button.active { color: #fff; background: #235dff; border-color: #5b8aff; }
  strong { margin-left: auto; color: #d9efff; font-size: 11px; font-weight: 500; }
  em { color: #39e6ff; font-style: normal; }
}

.track-player { position: relative; z-index: 1; display: flex; align-items: center; gap: 9px; margin-top: 9px; }
.track-play { display: grid; width: 30px; height: 30px; padding-left: 2px; color: #fff; cursor: pointer; font-size: 13px; place-items: center; background: #1957eb; border: 0; border-radius: 50%; }
.track-timeline { flex: 1; height: 4px; cursor: pointer; background: rgba(176, 205, 230, 0.24); border-radius: 4px; }
.track-timeline i { position: relative; display: block; height: 100%; background: #4e8aff; border-radius: inherit; }
.track-timeline b { position: absolute; top: 50%; right: -5px; width: 10px; height: 10px; background: #fff; border: 2px solid #3b7bff; border-radius: 50%; transform: translateY(-50%); }
.track-time { position: relative; z-index: 1; display: flex; justify-content: space-between; gap: 8px; margin-top: 7px; color: #9ab8cf; font-size: 10px; }
.track-time strong { color: #59d8ff; font-weight: 500; }
.live-track-info { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; padding-top: 9px; color: #9dbbd1; font-size: 11px; }
.live-track-info span { display: flex; align-items: center; gap: 5px; color: #57f0ad; }.live-track-info span i { width: 7px; height: 7px; background: #3aec95; border-radius: 50%; box-shadow: 0 0 8px #3aec95; }.live-track-info strong { color: #e2f3ff; font-size: 11px; font-weight: 500; }.live-track-info em { margin-left: auto; color: #74cfff; font-style: normal; }

.video-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 8px;
}

.video-camera {
  overflow: hidden;
  background: #07131d;
  border: 1px solid rgba(73, 162, 212, 0.35);
  border-radius: 3px;

  &.main { grid-column: span 2; }
  footer { display: flex; justify-content: space-between; gap: 4px; padding: 4px 6px; background: rgba(16, 47, 70, 0.88); }
  footer strong { overflow: hidden; color: #dcefff; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  footer em { flex: 0 0 auto; color: #59e89a; font-size: 10px; font-style: normal; }
}

.video-feed {
  position: relative;
  display: grid;
  height: 86px;
  overflow: hidden;
  color: rgba(207, 238, 255, 0.55);
  font-size: 22px;
  place-items: center;
  background:
    linear-gradient(135deg, transparent 46%, rgba(86, 183, 238, 0.16) 47% 49%, transparent 50%),
    repeating-linear-gradient(90deg, rgba(86, 183, 238, 0.08) 0 1px, transparent 1px 24px),
    linear-gradient(160deg, #153d57, #07131d 72%);

  &::after { position: absolute; inset: 0; pointer-events: none; content: ''; background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.4)); }
  i { position: absolute; top: 6px; left: 6px; width: 5px; height: 5px; background: #ff504d; border-radius: 50%; box-shadow: 0 0 6px #ff504d; }
  span { position: absolute; top: 4px; left: 14px; color: #ff8279; font-size: 9px; }
  b { position: relative; z-index: 1; font-weight: 400; }
}

.video-camera.main .video-feed { height: 132px; }
.video-placeholder { position: relative; z-index: 1; display: grid; height: 130px; margin-top: 10px; color: #bde9ff; font-size: 15px; place-items: center; background: radial-gradient(circle, #174d73, #06131e 72%); border: 1px solid rgba(71, 201, 255, 0.28); }
.video-placeholder.connected { color: #71ffb0; background: radial-gradient(circle, #175d48, #061a1b 72%); border-color: rgba(81, 234, 156, 0.45); }
.talk-button { position: relative; z-index: 1; height: 42px; color: #031b2a; font-weight: 700; background: #5ce9ff; }
.talk-button.connected { color: #fff; background: #e65551; }
.command-list { position: relative; z-index: 1; display: grid; gap: 4px; margin-top: 14px; }
.command-list button { margin: 0; text-align: left; padding-left: 14px; }

.right-rail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.right-tabs {
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  padding: 0;

  button {
    height: 42px;
    border-radius: 0;
  }
}

.right-card {
  flex: 1;
  min-height: 0;
}

.alarm-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px 12px;

  button {
    height: 72px;
    color: inherit;
    cursor: pointer;
    padding-top: 12px;
    text-align: center;
    background: rgba(13, 34, 55, 0.86);
    border: 1px solid rgba(84, 160, 224, 0.25);
    border-radius: 5px;

    &.active { background: rgba(20, 90, 137, 0.58); border-color: rgba(78, 205, 255, 0.65); box-shadow: 0 0 12px rgba(44, 185, 255, 0.18) inset; }
  }

  span {
    display: block;
    color: #aec4d8;
    font-size: 13px;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-size: 30px;
    font-family: DINPro, Arial, sans-serif;
  }
}

.danger { color: #ff5b56 !important; }
.warning { color: #ffbe38 !important; }
.info { color: #55a8ff !important; }
.success { color: #45df85 !important; }

.alarm-filters {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 12px 12px;

  button {
    height: 28px;
    color: #a9c0d8;
    cursor: pointer;
    background: rgba(16, 39, 62, 0.86);
    border: 1px solid rgba(75, 147, 214, 0.35);
    border-radius: 4px;

    &.active {
      color: #d8eeff;
      background: rgba(21, 84, 137, 0.72);
    }
  }
}

.table-title {
  position: relative;
  z-index: 1;
  padding: 0 12px 8px;
}

.alarm-table {
  position: relative;
  z-index: 1;
  overflow-x: auto;
  padding: 0 12px 12px;

  &::-webkit-scrollbar { height: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(80, 175, 235, 0.55); border-radius: 4px; }
}

.table-head,
.alarm-row {
  display: grid;
  grid-template-columns: 56px 76px minmax(160px, 1fr) 40px 30px 110px;
  min-width: 690px;
  align-items: center;
  min-height: 34px;
  gap: 8px;
  font-size: 12px;
}

.alarm-detail-panel,
.alarm-task-panel {
  position: absolute;
  z-index: 16;
  // 与车辆详情弹层一致，避开顶部汇总和底部图层图例。
  top: 215px;
  // 已置于地图容器内，右侧与车辆详情弹层共用地图右边缘。
  right: 0;
  bottom: 190px;
  width: 500px;
  overflow-y: auto;
  padding: 0 14px 14px;
  background: linear-gradient(180deg, rgba(9, 36, 57, 0.98), rgba(5, 20, 34, 0.99));
  border: 1px solid rgba(74, 211, 255, 0.58);
  box-shadow: 0 0 28px rgba(0, 149, 255, 0.25), -8px 8px 24px rgba(0, 0, 0, 0.45);
  animation: slideInDetail 0.2s ease both;
}

// 快速建单从告警详情左边展开，保留 14px 间距。
.alarm-task-panel { right: 514px; width: 460px; }
.alarm-detail-head { display: flex; align-items: center; gap: 8px; padding: 9px 0; color: #e5f7ff; font-size: 15px; font-weight: 700; border-bottom: 1px solid rgba(84, 158, 213, 0.18); }
.alarm-detail-head > i { width: 8px; height: 8px; background: #ff4b3d; border-radius: 50%; }.alarm-detail-head > i.warning { background: #ffbe38; }.alarm-detail-head em { margin-left: auto; padding: 2px 5px; color: #ffcf72; font-size: 11px; font-style: normal; background: rgba(255, 190, 56, 0.1); border-radius: 3px; }
.alarm-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 10px 0; }.alarm-detail-grid > div { min-width: 0; padding: 6px 7px; background: rgba(24, 69, 98, 0.28); border: 1px solid rgba(84, 158, 213, 0.16); border-radius: 3px; }.alarm-detail-grid > div.wide { grid-column: 1 / -1; }.alarm-detail-grid span, .alarm-detail-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.alarm-detail-grid span { color: #88a9c2; font-size: 11px; }.alarm-detail-grid strong { margin-top: 3px; color: #e0f2ff; font-size: 12px; font-weight: 500; }
.alarm-detail-actions { display: grid; grid-template-columns: 1.5fr 1fr; gap: 7px; }.alarm-detail-actions button, .create-task-btn { height: 31px; color: #dff6ff; cursor: pointer; font-size: 12px; background: rgba(20, 91, 133, 0.62); border: 1px solid rgba(81, 208, 255, 0.45); border-radius: 3px; }.create-task-btn { width: 100%; margin-top: 2px; color: #03202d; font-weight: 700; background: #60e8ff; }
.task-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px 10px; padding: 14px 0; }.task-form-grid label { display: grid; gap: 5px; color: #9fbdd2; font-size: 12px; }.task-form-grid select { width: 100%; height: 31px; padding: 0 8px; color: #e1f4ff; font-size: 12px; background: rgba(17, 56, 82, 0.72); border: 1px solid rgba(85, 165, 215, 0.38); border-radius: 3px; outline: 0; }
.task-created-toast { position: absolute; z-index: 30; top: 220px; left: 50%; padding: 12px 20px; color: #e7fff2; font-size: 15px; background: rgba(16, 91, 65, 0.96); border: 1px solid rgba(78, 238, 147, 0.64); border-radius: 5px; transform: translateX(-50%); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }

.task-detail-panel { position: absolute; z-index: 18; top: 215px; right: 0; bottom: 190px; width: 500px; overflow-y: auto; padding: 0 14px 14px; background: linear-gradient(180deg, rgba(9, 36, 57, 0.98), rgba(5, 20, 34, 0.99)); border: 1px solid rgba(74, 211, 255, 0.58); box-shadow: -8px 8px 24px rgba(0, 0, 0, 0.45); animation: slideInDetail 0.2s ease both; }
.task-detail-header { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0 10px; border-bottom: 1px solid rgba(84, 158, 213, 0.18); }.task-detail-header strong, .task-detail-header span { display: block; }.task-detail-header strong { color: #e5f7ff; font-size: 15px; }.task-detail-header span { margin-top: 3px; color: #88a9c2; font-size: 11px; }.task-detail-header > em { align-self: start; padding: 3px 6px; color: #70f3b0; font-size: 11px; font-style: normal; background: rgba(40, 205, 125, 0.13); border-radius: 3px; }.task-detail-header > em.warning { color: #ffcf72; background: rgba(255, 190, 56, 0.12); }.task-detail-header > em.danger { color: #ff8077; background: rgba(255, 75, 61, 0.12); }
.task-route-map { position: relative; height: 126px; margin: 10px 0; overflow: hidden; background: linear-gradient(135deg, rgba(13, 63, 83, 0.6), rgba(11, 34, 57, 0.35)); border: 1px solid rgba(84, 160, 224, 0.24); border-radius: 4px; }.task-route-map::before { position: absolute; inset: 0; opacity: 0.22; background-image: linear-gradient(rgba(81, 174, 210, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(81, 174, 210, 0.35) 1px, transparent 1px); background-size: 18px 18px; content: ''; }.task-route-map svg { position: absolute; inset: 0; width: 100%; height: 100%; }.task-route-map path { fill: none; stroke-linecap: round; }.task-route-map path.completed { stroke: #39c7ff; stroke-width: 6; filter: drop-shadow(0 0 4px rgba(61, 209, 255, 0.78)); }.task-route-map path.pending { stroke: #8094a7; stroke-width: 4; stroke-dasharray: 7 5; }.task-route-map .route-start-dot, .task-route-map .route-mid-dot, .task-route-map .route-end-dot { stroke: #b8efff; stroke-width: 3; }.task-route-map .route-start-dot { fill: #ff8c2a; }.task-route-map .route-mid-dot { fill: #1c9ce9; }.task-route-map .route-end-dot { fill: #8958ec; }.task-route-map .route-live-vehicle { filter: drop-shadow(0 0 7px rgba(84, 245, 191, 0.95)); }.task-route-map .route-live-vehicle .truck-cab { fill: #42e89e; stroke: #d5fff0; stroke-width: 1.5; }.task-route-map .route-live-vehicle .truck-box { fill: #27b878; stroke: #d5fff0; stroke-width: 1.5; }.task-route-map .route-live-vehicle .truck-window { fill: #082f42; }.task-route-map .route-live-vehicle circle { fill: #102331; stroke: #caf7ea; stroke-width: 1.4; }.task-route-map span { position: absolute; z-index: 1; color: #a8c8d9; font-size: 10px; line-height: 1.35; }.task-route-map b { color: #e4f8ff; font-weight: 500; }.route-start { left: 9px; bottom: 8px; }.route-end { top: 8px; right: 9px; text-align: right; }
.task-info-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }.task-info-cards div { min-width: 0; padding: 6px 7px; background: rgba(24, 69, 98, 0.28); border: 1px solid rgba(84, 158, 213, 0.16); border-radius: 3px; }.task-info-cards span, .task-info-cards strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.task-info-cards span { color: #88a9c2; font-size: 10px; }.task-info-cards strong { margin-top: 3px; color: #e0f2ff; font-size: 12px; font-weight: 500; }.task-info-cards em { color: #94aec1; font-size: 10px; font-style: normal; }
.task-detail-section { padding-top: 10px; }.task-detail-section h4 { margin: 0 0 6px; color: #61dfff; font-size: 13px; }.task-focus { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }.task-focus span { padding: 6px; color: #88a9c2; font-size: 10px; background: rgba(24, 69, 98, 0.25); border-radius: 3px; }.task-focus b { display: block; margin-top: 2px; color: #dff6ff; font-size: 12px; }.task-focus b.danger { color: #ff756b; }.task-timeline { display: grid; gap: 5px; margin: 0; padding: 0 0 0 15px; border-left: 1px solid rgba(88, 188, 229, 0.3); list-style: none; }.task-timeline li { position: relative; padding-left: 8px; }.task-timeline li::before { position: absolute; top: 4px; left: -19px; width: 7px; height: 7px; background: #35dd82; border: 2px solid #0d3148; border-radius: 50%; content: ''; }.task-timeline b, .task-timeline span, .task-timeline em { display: inline-block; font-size: 11px; }.task-timeline b { color: #e2f5ff; min-width: 78px; }.task-timeline span { color: #8daac0; }.task-timeline em { float: right; color: #75a1bb; font-style: normal; }.task-assist-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }.task-assist-grid span { padding: 5px 6px; color: #88a9c2; font-size: 10px; background: rgba(24, 69, 98, 0.25); border-radius: 3px; }.task-assist-grid strong { display: block; margin-top: 2px; color: #dff6ff; font-size: 11px; font-weight: 500; }
.task-operation-section { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; padding-top: 12px; }.task-operation-section button, .task-transfer-form button { height: 30px; color: #def6ff; cursor: pointer; font-size: 12px; border: 1px solid rgba(81, 208, 255, 0.45); border-radius: 3px; }.force-complete-btn { color: #ffe4df !important; background: rgba(154, 49, 43, 0.56); border-color: rgba(255, 110, 99, 0.65) !important; }.transfer-task-btn { background: rgba(20, 91, 133, 0.62); }.task-transfer-form { display: grid; grid-template-columns: 48px minmax(0, 1fr) 70px 50px; gap: 5px; align-items: center; margin-top: 8px; padding: 8px; background: rgba(20, 68, 93, 0.4); border: 1px solid rgba(84, 158, 213, 0.24); border-radius: 3px; }.task-transfer-form span { color: #a9c4d6; font-size: 11px; }.task-transfer-form select { width: 100%; min-width: 0; height: 30px; padding: 0 4px; color: #e1f4ff; font-size: 11px; background: rgba(17, 56, 82, 0.9); border: 1px solid rgba(85, 165, 215, 0.38); border-radius: 3px; outline: 0; }.task-transfer-form button { background: #59dff5; color: #053041; font-weight: 700; }.task-transfer-form .cancel { color: #b8d3e2; background: transparent; }.task-action-toast { position: absolute; z-index: 30; top: 220px; left: 50%; padding: 12px 20px; color: #e7fff2; font-size: 14px; background: rgba(16, 91, 65, 0.96); border: 1px solid rgba(78, 238, 147, 0.64); border-radius: 5px; transform: translateX(-50%); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4); }
.box-monitor-table { position: relative; z-index: 1; margin: 0 24px 24px; overflow-x: auto; border: 1px solid rgba(84, 160, 224, 0.25); border-radius: 5px; }.box-table-head, .box-table-row { display: grid; min-width: 820px; grid-template-columns: 170px 120px 76px 76px 76px 76px 88px; gap: 8px; align-items: center; padding: 0 12px; text-align: left; }.box-monitor-table.large .box-table-head, .box-monitor-table.large .box-table-row { min-width: 700px; grid-template-columns: 190px 130px 90px 90px 100px; }.box-table-head { height: 42px; color: #94b5cc; font-size: 18px; background: rgba(15, 54, 78, 0.82); }.box-table-row { width: 100%; min-height: 58px; color: #dff3ff; cursor: pointer; background: rgba(11, 37, 58, 0.58); border: 0; border-top: 1px solid rgba(84, 160, 224, 0.16); }.box-table-row:hover { background: rgba(24, 87, 120, 0.62); }.box-table-row span { overflow: hidden; font-size: 17px; text-align: left; text-overflow: ellipsis; white-space: nowrap; }.box-table-row em { justify-self: start; padding: 3px 6px; font-size: 15px; font-style: normal; border-radius: 3px; }.box-table-row strong { font-size: 18px; }.box-table-row .success { color: #65eea4; }.box-table-row .warning { color: #ffd173; }.box-table-row .danger, .box-table-row strong.danger { color: #ff7a70; }
.box-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
.vehicle-type-stats { grid-template-columns: repeat(3, 1fr) !important; }.vehicle-plate-search { display: grid; grid-template-columns: 58px 1fr; gap: 8px; align-items: center; padding: 0 24px 12px; color: #9ec1d5; font-size: 16px; }.vehicle-plate-search input { width: 100%; height: 34px; padding: 0 9px; color: #e4f7ff; font-size: 16px; background: rgba(13, 47, 69, 0.78); border: 1px solid rgba(84, 160, 224, 0.3); border-radius: 3px; outline: 0; }.vehicle-status-filters { display: flex; gap: 8px; padding: 0 24px 14px; }.vehicle-status-filters button { flex: 1; height: 34px; color: #9fc5da; cursor: pointer; font-size: 16px; background: rgba(13, 47, 69, 0.7); border: 1px solid rgba(84, 160, 224, 0.24); border-radius: 3px; }.vehicle-status-filters button.active { color: #e5fbff; background: rgba(21, 119, 159, 0.52); border-color: #4bd6ff; }.vehicle-monitor-row { grid-template-columns: minmax(0, 1fr) auto; width: 100%; min-height: 62px; color: inherit; cursor: pointer; text-align: left; }.vehicle-monitor-row strong { display: inline !important; font-size: 22px !important; }.vehicle-monitor-row .vehicle-row-meta { display: inline !important; margin: 0 !important; color: #87aabe; font-size: 16px !important; }.vehicle-row-tags { display: flex; align-items: center; justify-content: flex-end; gap: 7px; }.vehicle-row-tags em { display: inline-flex; align-items: center; justify-content: center; height: 28px; padding: 0 7px; font-size: 16px !important; font-style: normal; text-align: center !important; border-radius: 3px; }.vehicle-row-tags .collecting { color: #65e7ff; background: rgba(38, 183, 221, 0.15); border: 1px solid rgba(70, 209, 247, 0.3); }
.safety-table { position: relative; z-index: 1; margin: 0 24px 24px; overflow-x: auto; border: 1px solid rgba(84, 160, 224, 0.25); border-radius: 5px; }.safety-table-head, .safety-table-row { display: grid; grid-template-columns: 130px 96px 110px minmax(140px, 1fr) 90px 76px; min-width: 720px; gap: 8px; align-items: center; padding: 0 12px; text-align: left; }.safety-table-head { height: 42px; color: #94b5cc; font-size: 16px; background: rgba(15, 54, 78, 0.82); }.safety-table-row { width: 100%; min-height: 58px; color: #dff3ff; cursor: pointer; background: rgba(11, 37, 58, 0.58); border: 0; border-top: 1px solid rgba(84, 160, 224, 0.16); }.safety-table-row:hover { background: rgba(24, 87, 120, 0.62); }.safety-table-row span { overflow: hidden; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }.safety-table-row i { display: inline-block; width: 7px; height: 7px; margin-right: 5px; background: #ff665d; border-radius: 50%; }.safety-table-row i.warning { background: #ffce6f; }.safety-table-row i.success { background: #5be9a0; }.safety-table-row strong { font-size: 16px; }
.safety-detail-panel { position: absolute; z-index: 19; top: 215px; right: 0; bottom: 190px; width: 500px; overflow-y: auto; padding: 0 14px 14px; background: linear-gradient(180deg, rgba(9, 36, 57, 0.98), rgba(5, 20, 34, 0.99)); border: 1px solid rgba(74, 211, 255, 0.58); box-shadow: -8px 8px 24px rgba(0, 0, 0, 0.45); }.safety-detail-title { padding: 9px 0; border-bottom: 1px solid rgba(84, 158, 213, 0.18); }.safety-detail-title strong, .safety-detail-title span { display: block; }.safety-detail-title strong { color: #e6f8ff; font-size: 16px; }.safety-detail-title span { margin-top: 3px; color: #82aec8; font-size: 12px; }.safety-location-map { position: relative; height: 130px; margin: 10px 0; overflow: hidden; background: repeating-linear-gradient(0deg, rgba(66, 161, 198, .18) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(66, 161, 198, .18) 0 1px, transparent 1px 22px), #0c3048; border: 1px solid rgba(84, 160, 224, .28); }.safety-location-map i { position: absolute; top: 48px; left: 48%; color: #ff625a; font-size: 26px; font-style: normal; text-shadow: 0 0 10px #ff625a; }.safety-location-map span { position: absolute; top: 78px; left: 34%; color: #effbff; font-size: 13px; }.safety-location-map em { position: absolute; right: 8px; bottom: 7px; color: #9cc4d9; font-size: 11px; font-style: normal; }.safety-media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }.safety-photo, .safety-video { display: grid; align-content: center; height: 100px; color: #dff6ff; text-align: center; background: linear-gradient(135deg, #183c56, #071d31); border: 1px solid rgba(84, 160, 224, .28); }.safety-photo span, .safety-video span { color: #71dfff; font-size: 14px; }.safety-photo b, .safety-video b { margin-top: 8px; color: #a8c7d8; font-size: 11px; font-weight: 400; }.safety-video { cursor: pointer; }.safety-video.playing { background: linear-gradient(135deg, #155953, #0a2538); border-color: #53e4b1; }.safety-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 10px; }.safety-detail-grid div { padding: 7px; background: rgba(24, 69, 98, .28); border: 1px solid rgba(84, 158, 213, .16); }.safety-detail-grid .wide { grid-column: 1 / -1; }.safety-detail-grid span, .safety-detail-grid strong { display: block; }.safety-detail-grid span { color: #88a9c2; font-size: 11px; }.safety-detail-grid strong { margin-top: 3px; color: #e0f2ff; font-size: 13px; }.safety-detail-grid strong.danger { color: #ff7e74; }
.safety-attachment { margin-top: 10px; }.attachment-title { display: flex; justify-content: space-between; margin-bottom: 6px; color: #66dcff; font-size: 13px; }.attachment-title span { color: #8aaec3; font-size: 11px; }.attachment-stage { position: relative; height: 132px; overflow: hidden; background: linear-gradient(135deg, #173c54, #071d31); border: 1px solid rgba(84, 160, 224, .3); }.attachment-stage.video { background: linear-gradient(135deg, #153d4b, #071c2d); }.attachment-stage.playing { border-color: #54e5b4; box-shadow: 0 0 14px rgba(56, 229, 166, .25) inset; }.attachment-content { display: grid; height: 100%; align-content: center; color: #dff6ff; cursor: pointer; text-align: center; }.attachment-content span { color: #72e1ff; font-size: 15px; }.attachment-content b { margin-top: 8px; color: #aac8d9; font-size: 11px; font-weight: 400; }.attachment-nav { position: absolute; z-index: 1; top: 50%; width: 28px; height: 42px; color: #e6f8ff; cursor: pointer; font-size: 31px; line-height: 32px; background: rgba(4, 20, 34, .66); border: 0; border-radius: 3px; transform: translateY(-50%); }.attachment-nav.prev { left: 6px; }.attachment-nav.next { right: 6px; }.attachment-dots { display: flex; justify-content: center; gap: 5px; padding-top: 6px; }.attachment-dots i { width: 6px; height: 6px; cursor: pointer; background: #527a93; border-radius: 50%; }.attachment-dots i.active { width: 16px; background: #60dfff; border-radius: 4px; }
.asset-health-detail-panel { position: absolute; z-index: 19; top: 215px; right: 0; bottom: 190px; width: 500px; overflow-y: auto; padding: 0 14px 14px; background: linear-gradient(180deg, rgba(9, 36, 57, .98), rgba(5, 20, 34, .99)); border: 1px solid rgba(74, 211, 255, .58); }.asset-health-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; padding: 12px 0; }.asset-health-summary strong, .asset-health-summary span, .asset-health-summary em { padding: 8px; font-style: normal; background: rgba(24, 69, 98, .3); border: 1px solid rgba(84, 158, 213, .16); }.asset-health-summary strong { color: #e8f8ff; font-size: 22px; }.asset-health-summary span { color: #6befa7; }.asset-health-summary em { grid-column: 1 / -1; color: #ffcf72; font-size: 12px; }.asset-exception-list { display: grid; gap: 7px; }.asset-exception-list div { padding: 9px; background: rgba(24, 69, 98, .28); border-left: 3px solid #ff8c70; }.asset-exception-list strong, .asset-exception-list span, .asset-exception-list em { display: block; }.asset-exception-list strong { color: #e3f6ff; font-size: 13px; }.asset-exception-list span, .asset-exception-list em { margin-top: 4px; color: #91b3c8; font-size: 11px; font-style: normal; }
.box-detail-panel { position: absolute; z-index: 19; top: 215px; right: 0; bottom: 190px; width: 500px; overflow-y: auto; padding: 0 14px 14px; background: linear-gradient(180deg, rgba(9, 36, 57, 0.98), rgba(5, 20, 34, 0.99)); border: 1px solid rgba(74, 211, 255, 0.58); box-shadow: -8px 8px 24px rgba(0, 0, 0, 0.45); animation: slideInDetail 0.2s ease both; }.box-detail-title { padding: 9px 0; border-bottom: 1px solid rgba(84, 158, 213, 0.18); }.box-detail-title strong, .box-detail-title span { display: block; }.box-detail-title strong { color: #e6f8ff; font-size: 16px; }.box-detail-title span { margin-top: 3px; color: #82aec8; font-size: 12px; }.box-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding-top: 10px; }.box-detail-grid > div { min-width: 0; padding: 7px; background: rgba(24, 69, 98, 0.28); border: 1px solid rgba(84, 158, 213, 0.16); border-radius: 3px; }.box-detail-grid > div.wide { grid-column: 1 / -1; }.box-detail-grid span, .box-detail-grid strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.box-detail-grid span { color: #88a9c2; font-size: 11px; }.box-detail-grid strong { margin-top: 4px; color: #e0f2ff; font-size: 13px; font-weight: 500; }.box-detail-grid strong.success { color: #69f0aa; }.box-detail-grid strong.warning { color: #ffd072; }.box-detail-grid strong.danger { color: #ff7e74; }

.table-head {
  color: #8ca7bf;
  border-bottom: 1px solid rgba(99, 159, 209, 0.16);
}

.alarm-row {
  color: #b7cbe0;

  span,
  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 8px;
    border-radius: 50%;

    &.danger { background: #ff4b3d; }
    &.warning { background: #ffbe38; }
    &.info { background: #4a9dff; }
  }

  em {
    color: #4a9dff;
    font-style: normal;
    text-align: center;
  }
}

.tab-placeholder {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 12px;
}

.tab-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  height: 54px;
  padding: 0 14px;
  color: #a9c1d9;
  background: rgba(13, 34, 55, 0.74);
  border: 1px solid rgba(84, 160, 224, 0.2);
  border-radius: 4px;

  strong {
    color: #e9f8ff;
    font-size: 20px;
    font-family: DINPro, Arial, sans-serif;
  }
}

.screen-shell {
  .panel-title {
    height: 72px;
    padding: 18px 28px 0;
    font-size: 34px;
  }

  .archive-list,
  .operation-list {
    gap: 12px;
    padding: 8px 30px 28px;
  }

  .archive-row,
  .operation-row {
    grid-template-columns: 56px 150px 70px 1fr;
    min-height: 68px;
    font-size: 28px;

    strong {
      font-size: 40px;
    }
  }

  .operation-row {
    grid-template-columns: 56px 1fr 150px 80px;
  }

  .row-icon {
    font-size: 38px;
  }

  .rank-chart,
  .driver-chart,
  .trend-chart,
  .ontime-chart {
    height: calc(100% - 72px);
    padding: 16px 30px 24px;
  }

  .analysis-chart {
    height: calc(100% - 72px);
    padding: 14px 24px 22px;
  }

  .rank-row,
  .driver-row {
    grid-template-columns: 48px 180px 1fr 128px;
    min-height: 46px;
    gap: 18px;
    font-size: 28px;
  }

  .driver-row {
    grid-template-columns: 48px 150px 1fr 120px 84px;
  }

  .rank-track {
    height: 22px;
  }

  .rank-row strong,
  .driver-row strong,
  .driver-row em {
    font-size: 26px;
  }

  .trend-axis,
  .ontime-legend {
    font-size: 24px;
  }

  .trend-chart text,
  .ontime-chart text {
    font-size: 24px;
  }

  .map-kpis {
    width: 62%;
    min-width: 1450px;
    margin-top: 18px;
  }

  .map-kpi {
    padding: 20px 10px;

    span,
    em {
      font-size: 26px;
    }

    strong {
      font-size: 48px;
    }
  }

  .town-label {
    font-size: 34px;
  }

  .map-zoom-controls {
    top: auto;
    right: auto;
    bottom: 42px;
    left: 42px;
    gap: 12px;
    padding: 10px;
    font-size: 26px;

    button {
      min-width: 58px;
      height: 48px;
      padding: 0 16px;
      font-size: 26px;
    }

    span {
      min-width: 86px;
    }
  }

  .map-entity {
    width: 46px;
    height: 46px;

    .entity-icon {
      width: 38px;
      height: 38px;
    }

    em {
      top: 52px;
      font-size: 22px;
    }
  }

  .alarm-dot {
    top: -13px;
    right: -13px;
    width: 30px;
    height: 30px;
    font-size: 20px;
    line-height: 30px;
  }

  .map-layer-bar {
    bottom: 24px;
    gap: 12px;
    padding: 16px 32px;
    font-size: 26px;
    border-radius: 14px;

    > span {
      margin-right: 8px;
    }

    button {
      height: 52px;
      padding: 0 14px;
      gap: 12px;
      font-size: 24px;
      white-space: nowrap;
    }

    i {
      font-size: 32px;
    }
  }

  .entity-tabs button,
  .right-tabs button {
    height: 58px;
    font-size: 26px;
  }

  .entity-summary,
  .detail-list,
  .relation-row,
  .quick-actions button {
    font-size: 26px;
  }

  .entity-summary {
    min-height: 0;

    strong {
      font-size: 30px;
    }

    img {
      width: 260px;
    }

    &.has-image {
      min-height: 250px;
    }
  }

  .detail-list div {
    grid-template-columns: 150px 1fr;
    gap: 18px;
  }

  .quick-actions button {
    height: 78px;
  }

  .alarm-stats {
    gap: 18px;
    padding: 18px 24px;

    button {
      height: 138px;
      padding-top: 26px;
      font: inherit;
    }

    span {
      font-size: 26px;
    }

    strong {
      font-size: 58px;
    }
  }

  .alarm-filters {
    gap: 14px;
    padding: 0 24px 22px;

    button {
      height: 52px;
      font-size: 24px;
    }
  }

  .table-title {
    padding: 0 24px 16px;
    font-size: 28px;
  }

  .alarm-table {
    padding: 0 24px 24px;
  }

  .table-head,
  .alarm-row {
    grid-template-columns: 110px 150px minmax(240px, 1fr) 90px 70px 180px;
    min-width: 840px;
    min-height: 62px;
    gap: 16px;
    font-size: 24px;
  }

  .tab-stats-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    padding: 20px 24px;

    div,
    button {
      height: 120px;
      padding-top: 22px;
      text-align: center;
      background: rgba(13, 34, 55, 0.86);
      border: 1px solid rgba(84, 160, 224, 0.25);
      border-radius: 5px;
    }

    button {
      cursor: pointer;

      &.active {
        background: rgba(25, 112, 154, 0.56);
        border-color: rgba(88, 218, 255, 0.78);
        box-shadow: 0 0 16px rgba(41, 189, 255, 0.18) inset;
      }
    }

    span {
      display: block;
      color: #aec4d8;
      font-size: 24px;
    }

    strong {
      display: block;
      margin-top: 8px;
      font-size: 46px;
      font-family: DINPro, Arial, sans-serif;
    }
  }

  .monitor-list {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 14px;
    padding: 0 24px 24px;
  }

  .monitor-row {
    display: grid;
    grid-template-columns: 1fr 130px;
    align-items: center;
    min-height: 78px;
    padding: 0 18px;
    background: rgba(13, 34, 55, 0.62);
    border: 1px solid rgba(84, 160, 224, 0.18);
    border-radius: 6px;

    strong,
    span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: #e9f8ff;
      font-size: 26px;
    }

    span {
      margin-top: 6px;
      color: #8faac4;
      font-size: 22px;
    }

    em {
      font-size: 24px;
      font-style: normal;
      text-align: right;
    }
  }

  .task-monitor-row {
    grid-template-columns: minmax(0, 1fr) 190px;
    width: 100%;
    min-height: 78px;
    color: inherit;
    cursor: pointer;
    text-align: left;

    &:hover {
      background: rgba(25, 89, 122, 0.62);
      border-color: rgba(83, 207, 247, 0.52);
    }

    .task-row-tags {
      display: flex;
      justify-content: flex-start;
      gap: 8px;
      box-sizing: border-box;
      padding-left: 34px;
    }

    .task-row-second {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: center;
      min-width: 0;

      > span:first-child {
        overflow: visible;
        color: #a8c1d1;
        font-size: 18px;
        text-overflow: clip;
      }
    }

    .task-row-meta {
      grid-column: 2;
      transform: none;
      color: #69cfee;
      font-size: 18px;
    }

    em {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 74px;
      height: 28px;
      padding: 0 8px;
      color: #a8d9ff;
      font-size: 18px;
      text-align: left;
      background: rgba(44, 134, 194, 0.18);
      border: 1px solid rgba(81, 185, 237, 0.24);
      border-radius: 3px;

      &.success { color: #75f0ac; background: rgba(37, 196, 115, 0.12); }
      &.warning { color: #ffd073; background: rgba(255, 185, 55, 0.12); }
      &.danger { color: #ff8278; background: rgba(255, 78, 67, 0.12); }
    }
  }
}

.rank-track i,
.ontime-bar {
  animation: chartGrow 0.8s ease both;
  transform-origin: left center;
}

.trend-line,
.ontime-line {
  animation: lineDraw 1.4s ease both;
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
}

.trend-dot,
.ontime-dot {
  animation: mapPointBreath 2s ease-in-out infinite;
}

/* 4784×1560 设计画布在测试模式会整体缩放，ICON 需保留足够的物理像素才能识别车型。 */
.screen-shell .map-entity {
  width: 72px;
  height: 72px;
  filter: none;
  animation: mapPointIn 0.5s ease both;

  .entity-icon,
  &.collection .entity-icon,
  &.station .entity-icon,
  &.plant .entity-icon {
    width: 64px;
    height: 64px;
  }

  .entity-icon img {
    filter: none;
  }

  em {
    top: 70px;
  }
}

.screen-shell .map-entity.collection { z-index: 3; }
.screen-shell .map-entity.small-box,
.screen-shell .map-entity.large-box { z-index: 4; }
.screen-shell .map-entity.station,
.screen-shell .map-entity.plant { z-index: 5; }
.screen-shell .map-entity.truck-small,
.screen-shell .map-entity.truck-hook,
.screen-shell .map-entity.truck-large { z-index: 6; }
.screen-shell .map-entity.alarm { z-index: 7; }

.screen-shell .map-entity.warning,
.screen-shell .map-entity.danger,
.screen-shell .map-entity.alarm {
  filter: none;
  animation: none;
}

.screen-shell .map-entity.pulse {
  animation: mapPointIn 0.5s ease both, mapPointBreath 2.2s ease-in-out infinite;
}

.screen-shell .map-layer-bar .layer-icon {
  width: 42px;
  height: 42px;
}

@keyframes chartGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes lineDraw {
  to { stroke-dashoffset: 0; }
}

@keyframes mapPointIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.45);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes mapPointBreath {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
}

@keyframes slideInDetail {
  from {
    opacity: 0;
    transform: translateX(32px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes panelEnterLeft {
  from {
    opacity: 0;
    transform: translateX(-18px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes panelEnterRight {
  from {
    opacity: 0;
    transform: translateX(18px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes mapEnter {
  from {
    opacity: 0;
    transform: scale(0.985);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes screenScan {
  from {
    transform: translateY(-100%);
  }

  to {
    transform: translateY(100%);
  }
}

@keyframes alarmPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(255, 74, 54, 0.75);
  }

  50% {
    transform: scale(1.2);
    box-shadow: 0 0 22px rgba(255, 74, 54, 0.95);
  }
}

// 右侧监控页签局部留白：搜索区保持紧凑，主动安全表格不再紧贴页签。
.vehicle-plate-search {
  grid-template-columns: max-content minmax(260px, 420px);
  justify-content: start;
  gap: 14px;
  padding: 16px 24px 0;
  white-space: nowrap;
}

.vehicle-plate-search input {
  box-sizing: border-box;
  min-width: 0;
}

.safety-table {
  margin: 20px 24px 24px;
}

// 右侧地图弹层可读性优化：提升文字层级，保持原有高度边界与紧凑按钮。
.detail-panel,
.alarm-detail-panel,
.task-detail-panel,
.safety-detail-panel,
.asset-health-detail-panel,
.box-detail-panel {
  width: 540px;
}

.detail-panel {
  padding-right: 10px;
  padding-left: 10px;
}

.alarm-task-panel {
  right: 554px;
}

.entity-summary {
  div { font-size: 14px; }
  strong { font-size: 18px; }
  p { font-size: 13px; }
  .entity-status-line strong { font-size: 15px; }
}

.detail-section .detail-list {
  span { font-size: 12px; }
  strong { font-size: 14px; }
}

.task-name { font-size: 15px; }
.task-stop {
  span { font-size: 11px; }
  strong { font-size: 13px; }
}
.task-meta { font-size: 12px; }

.alarm-detail-head { font-size: 18px; }
.alarm-detail-head em { font-size: 12px; }
.alarm-detail-grid {
  span { font-size: 12px; }
  strong { font-size: 14px; }
}

.task-detail-header {
  strong { font-size: 18px; }
  span { font-size: 12px; }
  > em { font-size: 12px; }
}
.task-route-map span { font-size: 11px; }
.task-info-cards {
  span { font-size: 11px; }
  strong { font-size: 14px; }
  em { font-size: 11px; }
}
.task-detail-section h4 { font-size: 14px; }
.task-focus {
  span { font-size: 11px; }
  b { font-size: 14px; }
}
.task-timeline {
  b, span, em { font-size: 12px; }
}
.task-assist-grid {
  span { font-size: 11px; }
  strong { font-size: 12px; }
}

.safety-detail-title {
  strong { font-size: 19px; }
  span { font-size: 13px; }
}
.safety-location-map {
  span { font-size: 14px; }
  em { font-size: 12px; }
}
.attachment-title {
  font-size: 14px;
  span { font-size: 12px; }
}
.attachment-content {
  span { font-size: 16px; }
  b { font-size: 12px; }
}
.safety-detail-grid {
  span { font-size: 12px; }
  strong { font-size: 14px; }
}

.box-detail-title {
  strong { font-size: 19px; }
  span { font-size: 13px; }
}
.box-detail-grid {
  span { font-size: 12px; }
  strong { font-size: 14px; }
}

@keyframes liveCarPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.82); }
  50% { opacity: 0.7; transform: scale(1.2); }
}
</style>

<template>
  <div ref="pageRootRef" class="command-v2-page" :class="{ 'is-fullscreen': isFullscreen }">
    <div ref="stageViewportRef" class="stage-viewport" :style="stageViewportStyle">
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
              <VChart class="analysis-chart" :option="townWasteChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="近7日清运走势（吨）" class="chart-card">
              <VChart class="analysis-chart" :option="wasteTrendChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="昨日司机排行（按任务量）" class="chart-card">
              <VChart class="analysis-chart" :option="driverRankChartOption" :autoresize="false" :init-options="chartInitOptions" />
            </PanelCard>
            <PanelCard title="任务准点率（单/日）" class="chart-card">
              <VChart class="analysis-chart" :option="ontimeTaskChartOption" :autoresize="false" :init-options="chartInitOptions" />
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
                <button @click="zoomMap(1)">+</button>
                <button @click="zoomMap(-1)">−</button>
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
              <button v-for="tab in rightTabs" :key="tab.key" :class="{ active: activeRightTab === tab.key }" @click.stop="activeRightTab = tab.key">
                {{ tab.label }}
              </button>
            </div>

            <PanelCard v-show="activeRightTab === 'alarm'" title="" class="right-card">
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

            <PanelCard v-show="activeRightTab !== 'alarm'" title="" class="right-card">
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
                  <button v-for="item in liveBoxMonitorStats" :key="item.key" :class="{ active: activeBoxType === item.key }" @click="activeBoxType = item.key">
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

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type CSSProperties, computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import assetHealthBox from '@/assets/images/command-center/asset-health-box.png'
import assetHealthVehicle from '@/assets/images/command-center/asset-health-vehicle.png'
import assetHealthTricycle from '@/assets/images/command-center/asset-health-tricycle.png'
import { useCommandCenterCharts } from './data/command-center-v2-charts'
import { createGeneratedMapEntities, initialMapEntities, LONGAN_BOUNDS, mapLayerIconMap, type MapEntity } from './data/command-center-v2-map-data'
import { alarmDestinations, alarmDrivers, alarmVehicles, boxMonitorRows, rightTabs, safetyAttachments, safetyMonitorRows, simulatedTrackPoints, taskMonitorDetailMap, taskMonitorRows, taskMonitorStats, taskTransferTargets, trackSpeeds, vehicleCameras, vehicleMonitorRows, vehicleStatusFilters, vehicleTypeStats, type BoxType, type SafetyMonitorRow, type TaskMonitorDetail, type TaskMonitorRow, type VehicleMonitorRow } from './data/command-center-v2-panel-data'
import { getHiddenBoxIds, getHiddenPointIds } from '@/utils/daas'

defineOptions({ name: 'SanitationTempCommandCenter' })


const DESIGN_WIDTH = 4784
const DESIGN_HEIGHT = 1560
const LAYOUT_STATISTICS_WIDTH = 520
const LAYOUT_CHARTS_WIDTH = 800
const LAYOUT_DISPATCH_WIDTH = 900
// 图表模块保留现有紧凑排版；不对外提供分辨率切换。
const chartDisplayMode = ref<'formal' | 'test'>('test')
const dashboardLayoutStyle = {
  '--layout-statistics-width': `${LAYOUT_STATISTICS_WIDTH}px`,
  '--layout-charts-width': `${LAYOUT_CHARTS_WIDTH}px`,
  '--layout-dispatch-width': `${LAYOUT_DISPATCH_WIDTH}px`,
} as CSSProperties
const settingsOpen = ref(false)
const organizations = ['龙安区环卫中心', '马投涧镇环卫站', '龙泉镇环卫站', '文明大道街道办']
const selectedOrganization = ref(organizations[0])
const headerNotice = ref('')
const COLLECTOR_API_BASE_URL = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
const LARGE_SCREEN_ORGANIZATION_ID = 506
function notifyHeader(message: string) { headerNotice.value = message; window.setTimeout(() => { headerNotice.value = '' }, 2200) }
const pageRootRef = ref<HTMLElement>()
const isFullscreen = ref(false)
async function toggleFullscreen() {
  const page = pageRootRef.value
  if (!page) return
  if (document.fullscreenElement === page) {
    await document.exitFullscreen?.()
    return
  }
  await page.requestFullscreen?.()
}
function syncFullscreenState() {
  isFullscreen.value = document.fullscreenElement === pageRootRef.value
}
function refreshDashboard() { notifyHeader('数据已刷新') }
function saveOrganization() { settingsOpen.value = false; notifyHeader(`已切换至${selectedOrganization.value}`) }
const stageViewportRef = ref<HTMLElement>()
const autoTestScale = ref(0.35)
const screenScale = computed(() => autoTestScale.value)
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
  setCenter: (center: [number, number]) => void
  setFitView: (markers: AMapMarker[], immediately?: boolean, padding?: [number, number, number, number]) => void
}

interface AMapMarker {
  setMap: (map: AMapInstance | null) => void
  on: (event: 'click', handler: () => void) => void
}

interface AMapNamespace {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapInstance
  Marker: new (options: Record<string, unknown>) => AMapMarker
  Pixel: new (x: number, y: number) => unknown
}

let resizeObserver: ResizeObserver | undefined
let largeScreenRefreshTimer: number | undefined
const v2MapBaseRef = ref<HTMLDivElement>()
const mapEngineError = ref('')
let v2BaseMap: AMapInstance | null = null
let amap: AMapNamespace | null = null
let largeScreenMarkers: AMapMarker[] = []
let hasReceivedLargeScreenData = false
let hasFittedLargeScreenMap = false
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
    amap = AMap
    v2BaseMap?.destroy()
    v2BaseMap = new AMap.Map(v2MapBaseRef.value, {
      center: [114.30, 36.07],
      zoom: 13,
      zooms: [8, 20],
      viewMode: '2D',
      mapStyle: amapStyle(activeMapTheme.value),
      animateEnable: false,
      jogEnable: false,
      resizeEnable: true,
      zoomEnable: true,
      doubleClickZoom: false,
      keyboardEnable: false,
      scrollWheel: true,
      showIndoorMap: false,
    })
    if (hasReceivedLargeScreenData && !hasFittedLargeScreenMap) {
      drawLargeScreenMarkers(true)
      hasFittedLargeScreenMap = true
    } else {
      drawLargeScreenMarkers(false)
    }
    mapEngineError.value = ''
  } catch {
    mapEngineError.value = '高德官方主题加载失败：请配置 JS API Key，并在控制台绑定当前访问域名。'
  }
}

function updateScreenScale() {
  if (!stageViewportRef.value) return
  const parent = stageViewportRef.value.parentElement
  if (!parent) return
  const availableWidth = parent.clientWidth - 16
  const availableHeight = Math.max(520, window.innerHeight - 132)
  autoTestScale.value = Math.min(1, availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT)
}

onMounted(() => {
  nextTick(updateScreenScale)
  window.setTimeout(initV2BaseMap, 100)
  void loadLargeScreenData()
  largeScreenRefreshTimer = window.setInterval(() => { void loadLargeScreenData() }, 60_000)
  resizeObserver = new ResizeObserver(updateScreenScale)
  if (stageViewportRef.value?.parentElement) {
    resizeObserver.observe(stageViewportRef.value.parentElement)
  }
  window.addEventListener('resize', updateScreenScale)
  document.addEventListener('fullscreenchange', syncFullscreenState)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateScreenScale)
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  if (wheelZoomTimer !== undefined) {
    window.clearTimeout(wheelZoomTimer)
  }
  if (trackTimer !== undefined) {
    window.clearInterval(trackTimer)
  }
  if (v2BaseMap) {
    largeScreenMarkers.forEach((marker) => marker.setMap(null))
    largeScreenMarkers = []
    v2BaseMap.destroy()
    v2BaseMap = null
  }
  if (largeScreenRefreshTimer !== undefined) {
    window.clearInterval(largeScreenRefreshTimer)
  }
})


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

const { townWasteChartOption, wasteTrendChartOption, driverRankChartOption, ontimeTaskChartOption, chartInitOptions } = useCommandCenterCharts(chartDisplayMode)


const mapKpis = ref([
  { label: '今日垃圾量', value: '1,280', unit: '吨' },
  { label: '今日任务', value: '256', unit: '单' },
  { label: '待接单', value: '32', unit: '单' },
  { label: '收运中', value: '128', unit: '单' },
  { label: '已完成', value: '108', unit: '单' },
  { label: '已超时', value: '20', unit: '单' },
])


watch(activeMapTheme, (theme) => {
  v2BaseMap?.setMapStyle(amapStyle(theme))
})




const mapEntities = ref<MapEntity[]>([...initialMapEntities])

// 完整保留地图对象数据：20 小勾臂车、6 大勾臂车、30 小三轮、36 箱体、
// 18 收集点、12 中转站、8 告警和 1 焚烧厂。
try {
  mapEntities.value = createGeneratedMapEntities()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  mapEngineError.value = `地图点位生成失败：${message}`
  console.error('[command-center-v2] 地图点位生成失败：', error)
}

interface LargeScreenInfo {
  id: number | string
  name: string | null
  lat: number | string | null
  lng: number | string | null
}

interface LargeScreenCenterData {
  [key: string]: LargeScreenInfo[] | null | undefined
  dGbVehicles?: LargeScreenInfo[] | null
  xGbVehicles?: LargeScreenInfo[] | null
  xslVehicles?: LargeScreenInfo[] | null
  dGbxInfos?: LargeScreenInfo[] | null
  xGbxInfos?: LargeScreenInfo[] | null
  collectionPoints?: LargeScreenInfo[] | null
  transferStations?: LargeScreenInfo[] | null
  IncinerationPlants?: LargeScreenInfo[] | null
  alarmInfos?: LargeScreenInfo[] | null
}

interface LargeScreenStatistics {
  totalTasks?: number | null
  pendingCount?: number | null
  collectingCount?: number | null
  completedCount?: number | null
  timeoutCount?: number | null
  todayWeight?: number | string | null
}

interface LargeScreenResponse<T> { code?: number, message?: string, data?: T }
interface SmallHookBox {
  id: number | string
  containerNo?: string | null
  containerName?: string | null
  onlineStatus?: number | null
  overflowStatus?: number | null
  fillLevel?: number | string | null
  longitude?: number | string | null
  latitude?: number | string | null
  temperature?: number | string | null
  voltage?: number | string | null
}

const largeScreenGroups: Array<{ key: keyof LargeScreenCenterData, type: MapEntity['type'], layer: string, kind: string, label: string }> = [
  { key: 'dGbVehicles', type: '车辆', layer: 'largeTruck', kind: 'truck-large', label: '大勾臂车' },
  { key: 'xGbVehicles', type: '车辆', layer: 'hookTruck', kind: 'truck-hook', label: '小勾臂车' },
  { key: 'xslVehicles', type: '车辆', layer: 'smallTruck', kind: 'truck-small', label: '小三轮车' },
  { key: 'dGbxInfos', type: '箱体', layer: 'largeBox', kind: 'large-box', label: '大勾臂箱' },
  { key: 'xGbxInfos', type: '箱体', layer: 'smallBox', kind: 'small-box', label: '小勾臂箱' },
  { key: 'collectionPoints', type: '收集点', layer: 'collectionPoint', kind: 'collection', label: '收集点' },
  { key: 'transferStations', type: '中转站', layer: 'station', kind: 'station', label: '中转站' },
  { key: 'IncinerationPlants', type: '焚烧厂', layer: 'plant', kind: 'plant', label: '焚烧厂' },
  { key: 'alarmInfos', type: '告警', layer: 'alarm', kind: 'alarm', label: '告警' },
]

const centerDataAliases: Partial<Record<keyof LargeScreenCenterData, string[]>> = {
  // 云端不同版本曾使用 xGbInfos / xGbxInfos；小勾臂箱额外兼容两种命名。
  xGbxInfos: ['xGbxInfos', 'xGbInfos', 'smallBoxInfos', 'smallBoxes'],
}

function centerDataList(data: LargeScreenCenterData | undefined, key: keyof LargeScreenCenterData) {
  if (!data) return []
  const keys = centerDataAliases[key] || [String(key)]
  for (const candidate of keys) {
    const list = data[candidate]
    if (Array.isArray(list)) return list
  }
  return []
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function toMapEntity(info: LargeScreenInfo, group: typeof largeScreenGroups[number]): MapEntity | null {
  const lng = toNumber(info.lng, Number.NaN)
  const lat = toNumber(info.lat, Number.NaN)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  const isAlarm = group.kind === 'alarm'
  return {
    id: `${group.key}-${info.id}`,
    type: group.type,
    layer: group.layer,
    kind: group.kind,
    status: isAlarm ? 'danger' : 'online',
    icon: isAlarm ? '!' : '●',
    name: info.name || `${group.label}-${info.id}`,
    lng,
    lat,
    alarm: isAlarm,
    pulse: isAlarm,
    onlineText: isAlarm ? '告警  待处理' : '在线',
    details: [{ label: '类型', value: group.label }, { label: '经纬度', value: `${lng.toFixed(6)}, ${lat.toFixed(6)}` }],
    relations: [],
  }
}

function smallHookBoxToMapEntity(box: SmallHookBox): MapEntity | null {
  const lng = toNumber(box.longitude, Number.NaN)
  const lat = toNumber(box.latitude, Number.NaN)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  const overflow = toNumber(box.overflowStatus) === 1
  return {
    id: `small-hook-box-${box.id}`,
    type: '箱体', layer: 'smallBox', kind: 'small-box', status: overflow ? 'danger' : toNumber(box.fillLevel) >= 70 ? 'warning' : 'online', icon: '●',
    name: box.containerName || box.containerNo || `小勾臂箱-${box.id}`, lng, lat, alarm: overflow, pulse: overflow,
    onlineText: toNumber(box.onlineStatus) === 1 ? '在线' : '离线',
    details: [{ label: '箱体编号', value: box.containerNo || String(box.id) }, { label: '满溢率', value: `${toNumber(box.fillLevel)}%` }, { label: '经纬度', value: `${lng.toFixed(6)}, ${lat.toFixed(6)}` }],
    relations: [],
  }
}

function smallHookBoxToMonitorRow(box: SmallHookBox): DashboardBoxMonitorRow {
  const fillRate = toNumber(box.fillLevel)
  const temperature = toNumber(box.temperature)
  const voltage = toNumber(box.voltage)
  return {
    id: String(box.id), type: 'small', name: box.containerName || box.containerNo || `小勾臂箱-${box.id}`, code: box.containerNo || String(box.id),
    online: toNumber(box.onlineStatus) === 1 ? '在线' : '离线', overflow: toNumber(box.overflowStatus) === 1 ? '满溢' : '正常',
    batteryStatus: voltage > 0 && voltage < 20 ? '低电量' : '正常', temperatureStatus: temperature >= 60 ? '高温' : '正常',
    fillRate, battery: voltage, temperature, match: '—', location: `${toNumber(box.longitude).toFixed(6)}, ${toNumber(box.latitude).toFixed(6)}`,
  }
}

async function loadLargeScreenData() {
  if (!COLLECTOR_API_BASE_URL) return
  try {
    const query = new URLSearchParams({ organizationId: String(LARGE_SCREEN_ORGANIZATION_ID), options: '0' })
    const [centerResponse, statisticsResponse, smallHookBoxesResponse] = await Promise.all([
      fetch(`${COLLECTOR_API_BASE_URL}/api/collector/large-screen/center-data?${query}`),
      fetch(`${COLLECTOR_API_BASE_URL}/api/collector/large-screen/statistics?organizationId=${LARGE_SCREEN_ORGANIZATION_ID}`),
      fetch(`${COLLECTOR_API_BASE_URL}/api/collector/large-screen/small-hook-boxes`),
    ])
    if (!centerResponse.ok || !statisticsResponse.ok) throw new Error(`HTTP ${!centerResponse.ok ? centerResponse.status : statisticsResponse.status}`)
    const center = await centerResponse.json() as LargeScreenResponse<LargeScreenCenterData>
    const statistics = await statisticsResponse.json() as LargeScreenResponse<LargeScreenStatistics>
    if (center.code !== 200 || statistics.code !== 200) throw new Error(center.message || statistics.message || '云端接口返回失败')

    // options=0 的部分云端版本不会完整返回小勾臂箱，按接口定义再用 options=5 兜底。
    if (!centerDataList(center.data, 'xGbxInfos').length) {
      const smallBoxQuery = new URLSearchParams({ organizationId: String(LARGE_SCREEN_ORGANIZATION_ID), options: '5' })
      const smallBoxResponse = await fetch(`${COLLECTOR_API_BASE_URL}/api/collector/large-screen/center-data?${smallBoxQuery}`)
      if (smallBoxResponse.ok) {
        const smallBoxCenter = await smallBoxResponse.json() as LargeScreenResponse<LargeScreenCenterData>
        if (smallBoxCenter.code === 200 && centerDataList(smallBoxCenter.data, 'xGbxInfos').length) {
          center.data = { ...center.data, xGbxInfos: centerDataList(smallBoxCenter.data, 'xGbxInfos') }
        }
      }
    }

    const hiddenBoxIds = getHiddenBoxIds()
    const hiddenPointIds = getHiddenPointIds()
    const smallHookBoxes = smallHookBoxesResponse.ok ? await smallHookBoxesResponse.json() as SmallHookBox[] : []
    const visibleSmallHookBoxes = Array.isArray(smallHookBoxes) ? smallHookBoxes.filter((box) => !hiddenBoxIds.has(toNumber(box.id))) : []
    const smallHookRows = visibleSmallHookBoxes.map(smallHookBoxToMonitorRow)
    // 右侧箱体监控的小勾臂箱与地图使用同一独立数据源；大勾臂箱先保留现有展示数据。
    liveBoxMonitorRows.value = [...liveBoxMonitorRows.value.filter((item) => item.type === 'large'), ...smallHookRows]

    const entities = largeScreenGroups.filter((group) => group.key !== 'xGbxInfos').flatMap((group) => centerDataList(center.data, group.key)
      .filter((item) => group.key !== 'collectionPoints' || !hiddenPointIds.has(toNumber(item.id)))
      .map((item) => toMapEntity(item, group)).filter((item): item is MapEntity => item !== null))
    entities.push(...visibleSmallHookBoxes.map(smallHookBoxToMapEntity).filter((item): item is MapEntity => item !== null))
    mapEntities.value = entities
    if (entities.length) selectedEntity.value = entities[0]
    hasReceivedLargeScreenData = true
    if (!hasFittedLargeScreenMap && v2BaseMap) {
      drawLargeScreenMarkers(true)
      hasFittedLargeScreenMap = true
    } else {
      drawLargeScreenMarkers(false)
    }

    const data = statistics.data || {}
    mapKpis.value = [
      { label: '今日垃圾量', value: toNumber(data.todayWeight).toLocaleString('zh-CN', { maximumFractionDigits: 2 }), unit: '吨' },
      { label: '今日任务', value: toNumber(data.totalTasks).toLocaleString(), unit: '单' },
      { label: '待接单', value: toNumber(data.pendingCount).toLocaleString(), unit: '单' },
      { label: '收运中', value: toNumber(data.collectingCount).toLocaleString(), unit: '单' },
      { label: '已完成', value: toNumber(data.completedCount).toLocaleString(), unit: '单' },
      { label: '已超时', value: toNumber(data.timeoutCount).toLocaleString(), unit: '单' },
    ]
  } catch (error) {
    console.warn('[temp-command-center] 大屏接口加载失败，保留当前页面数据：', error)
  }
}

const selectedEntity = ref<MapEntity>(mapEntities.value[0])
const detailPanelVisible = ref(false)
const activeEntityAction = ref('')
const intercomConnected = ref(false)
const trackPlaying = ref(false)
const trackSpeed = ref(1)
const trackProgress = ref(0.38)
let trackTimer: number | undefined
const trackDay = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('/', '-')
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
// 小三轮车、收集点数量较大，首屏默认不加载 Marker，按需由图例开启。
const activeLayers = ref(mapLayers.filter((layer) => !['smallTruck', 'collectionPoint', 'alarm'].includes(layer.key)).map((layer) => layer.key))
const mapZoom = ref(1)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function zoomMap(delta: number) {
  if (v2BaseMap) {
    const nextZoom = clamp(v2BaseMap.getZoom() + delta, 8, 20)
    v2BaseMap.setZoom(nextZoom, true)
    mapZoom.value = +clamp(1 + (nextZoom - 13) * 0.2, 0.4, 3.4).toFixed(2)
    return
  }
  mapZoom.value = +clamp(mapZoom.value + delta, 0.4, 3.4).toFixed(2)
}

function resetMapZoom() {
  mapZoom.value = 1
  v2BaseMap?.setZoom(13, true)
}

function onMapWheel(event: WheelEvent) {
  pendingWheelZoom += event.deltaY > 0 ? -1 : 1
  if (wheelZoomTimer !== undefined) return

  wheelZoomTimer = window.setTimeout(() => {
    const direction = pendingWheelZoom >= 0 ? 1 : -1
    pendingWheelZoom = 0
    wheelZoomTimer = undefined
    zoomMap(direction)
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

watch(visibleMapEntities, () => drawLargeScreenMarkers(false))

function fitMapToEntities(entities: MapEntity[]) {
  if (!v2BaseMap || !entities.length) return
  const lngs = entities.map((item) => item.lng)
  const lats = entities.map((item) => item.lat)
  const center: [number, number] = [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ]
  const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats))
  const zoom = span > 0.24 ? 11 : span > 0.1 ? 12 : span > 0.04 ? 13 : 14
  v2BaseMap.setCenter(center)
  v2BaseMap.setZoom(zoom, true)
  mapZoom.value = +clamp(1 + (zoom - 13) * 0.2, 0.7, 2.4).toFixed(2)
}

function toGcj(lng: number, lat: number) {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35); const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}

function drawLargeScreenMarkers(fit = true) {
  largeScreenMarkers.forEach((marker) => marker.setMap(null))
  largeScreenMarkers = []
  if (!amap || !v2BaseMap) return
  largeScreenMarkers = visibleMapEntities.value.map((entity, index) => {
    const point = toGcj(entity.lng, entity.lat)
    const fillRate = Number.parseFloat(entity.details.find((item) => item.label === '满溢率')?.value || '0') || 0
    const color = entity.kind === 'alarm'
      ? '#f53f3f'
      : entity.kind === 'small-box'
        ? entity.alarm ? '#f53f3f' : fillRate >= 70 ? '#ff7d00' : '#00b42a'
        : entity.kind.includes('truck') ? '#165dff' : entity.kind.includes('box') ? '#ff7d00' : '#00b42a'
    const label = entity.kind === 'small-box'
      ? entity.details.find((item) => item.label === '箱体编号')?.value || entity.name
      : entity.name
    const marker = new amap.Marker({
      position: [point.lng, point.lat],
      offset: new amap.Pixel(-18, -34),
      content: `<div style="position:relative;min-width:36px;height:26px;padding:0 8px;display:flex;align-items:center;justify-content:center;border:1px solid #fff;border-radius:4px;background:${color};box-shadow:0 2px 6px rgb(0 0 0 / 28%);color:#fff;font-size:12px;font-weight:600;white-space:nowrap">${escapeHtml(label)}</div>`,
      title: label,
      zIndex: entity.alarm ? 1000 : 10 + index,
    })
    marker.on('click', () => selectMapEntity(entity))
    marker.setMap(v2BaseMap!)
    return marker
  })
  if (fit && largeScreenMarkers.length) v2BaseMap.setFitView(largeScreenMarkers, false, [60, 60, 60, 360])
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
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

const activeRightTab = ref('alarm')
const activeRightTitle = computed(() => rightTabs.find((tab) => tab.key === activeRightTab.value)?.label || '监控')

type AlarmFilter = 'today' | 'recent3Days' | 'starred'
interface AlarmRow { id: string, date: string, time: string, name: string, place: string, level: string, star: boolean, read: boolean, taskNo: string, boxNo: string, rule: string, description: string }
const activeAlarmFilter = ref<AlarmFilter>('today')
const selectedAlarmRow = ref<AlarmRow | null>(null)
const alarmTaskFormVisible = ref(false)
const taskCreatedNotice = ref('')
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



type TaskMonitorFilter = 'all' | 'pending' | 'collecting' | 'overtime'
const activeTaskFilter = ref<TaskMonitorFilter>('all')
const filteredTaskMonitorRows = computed(() => taskMonitorRows.filter((task) => {
  if (activeTaskFilter.value === 'all') return true
  if (activeTaskFilter.value === 'pending') return task.status === '待接单'
  if (activeTaskFilter.value === 'collecting') return task.status === '收运中'
  return task.overtimeStatus === '已超时'
}))


const selectedTaskMonitor = ref<TaskMonitorDetail | null>(null)
const taskTransferVisible = ref(false)
const taskActionNotice = ref('')
const taskTransferTarget = ref(taskTransferTargets[0].name)
function openTaskMonitorDetail(task: TaskMonitorRow) {
  selectedTaskMonitor.value = { ...task, ...taskMonitorDetailMap[task.id] }
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


interface DashboardBoxMonitorRow {
  id: string
  type: BoxType
  name: string
  code: string
  online: string
  overflow: string
  batteryStatus: string
  temperatureStatus: string
  fillRate: number
  battery: number
  temperature: number
  match: string
  location: string
}

const liveBoxMonitorRows = ref<DashboardBoxMonitorRow[]>(boxMonitorRows.map((item) => ({ ...item })))
const liveBoxMonitorStats = computed(() => [
  { key: 'small', label: '小勾臂箱', value: String(liveBoxMonitorRows.value.filter((item) => item.type === 'small').length), tone: 'success' },
  { key: 'large', label: '大勾臂箱', value: String(liveBoxMonitorRows.value.filter((item) => item.type === 'large').length), tone: 'info' },
])
const activeBoxType = ref<BoxType>('small')
const selectedBoxMonitor = ref<DashboardBoxMonitorRow | null>(null)
const filteredBoxMonitorRows = computed(() => liveBoxMonitorRows.value.filter((box) => box.type === activeBoxType.value).sort((a, b) => b.fillRate - a.fillRate))
function openBoxMonitorDetail(box: DashboardBoxMonitorRow) {
  selectedBoxMonitor.value = box
  selectedTaskMonitor.value = null
  detailPanelVisible.value = false
}

const activeVehicleType = ref('小勾臂车')
const activeVehicleStatus = ref('all')
const vehiclePlateSearch = ref('')
const filteredVehicleMonitorRows = computed(() => vehicleMonitorRows.filter((row) => row.type === activeVehicleType.value && (activeVehicleStatus.value === 'all' || row.status === activeVehicleStatus.value) && (!vehiclePlateSearch.value || row.plate.includes(vehiclePlateSearch.value))))
function openVehicleMonitorDetail(row: VehicleMonitorRow) {
  const fallback = mapEntities.value.find((item) => item.kind.startsWith('truck')) || mapEntities.value[0]
  const entity = mapEntities.value.find((item) => item.name === row.plate) || { ...fallback, name: row.plate, onlineText: `${row.status}${row.collecting ? '  收运中' : ''}`, details: [{ label: '车辆类型', value: row.type }, { label: '司机', value: row.driver }, { label: '车辆状态', value: row.status }, { label: '当前任务', value: row.collecting ? '收运任务执行中' : '暂无未完成任务' }] }
  selectMapEntity(entity)
  selectedTaskMonitor.value = null
}

const selectedSafetyMonitor = ref<SafetyMonitorRow | null>(null)
const safetyVideoPlaying = ref(false)
const safetyAttachmentIndex = ref(0)
const activeSafetyAttachment = computed(() => safetyAttachments[safetyAttachmentIndex.value])
function changeSafetyAttachment(direction: number) { safetyAttachmentIndex.value = (safetyAttachmentIndex.value + direction + safetyAttachments.length) % safetyAttachments.length; safetyVideoPlaying.value = false }
function openSafetyDetail(item: SafetyMonitorRow) { selectedSafetyMonitor.value = item; safetyVideoPlaying.value = false; safetyAttachmentIndex.value = 0; detailPanelVisible.value = false }

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
@import './temp-command-center.scss';
</style>

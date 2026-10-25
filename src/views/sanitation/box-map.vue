<template>
  <div ref="pageFullscreenRef" class="gi_page box-map-page" :class="{ 'ai-open': aiVisible, 'ai-docked': aiVisible && aiLayout === 'docked', 'fullscreen-fallback': pageFallbackFullscreen }" :style="aiOverlayStyle">
    <div class="page-header">
      <div>
        <div class="page-title">箱体地图</div>
        <div class="page-subtitle">查看箱体实时位置、满溢状态及设备运行信息</div>
      </div>
      <a-space wrap aria-live="polite">
        <a-tag v-if="pointsLoading" color="blue">收集点更新中</a-tag>
        <a-tag v-else-if="pointsError" color="orange">收集点未更新</a-tag>
        <a-tag v-if="transportTasksLoading" color="blue">运单更新中</a-tag>
        <a-tag v-else-if="transportTasksError" color="orange">运单未更新</a-tag>
        <a-tag v-if="vehicleLoading" color="blue">车辆更新中</a-tag>
        <a-tag v-else-if="vehicleError" color="orange">车辆未更新</a-tag>
        <a-tag v-if="vehicleTypesLoading" color="blue">车型更新中</a-tag>
        <a-tag v-else-if="vehicleTypesError" color="orange">车型未更新</a-tag>
        <a-button type="primary" :loading="cloudLoading" @click="refreshMapData()">
          <template #icon><icon-sync /></template>
          更新
        </a-button>
        <a-tooltip :content="isPageFullscreen ? '退出全屏' : '主体全屏'">
          <a-button :type="isPageFullscreen ? 'primary' : 'secondary'" @click="togglePageFullscreen">
            <template #icon>
              <icon-fullscreen-exit v-if="isPageFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
        <a-dropdown position="br">
          <a-button>更多<icon-down /></a-button>
          <template #content>
            <a-doption @click="openLogin()">登录</a-doption>
            <a-doption @click="openAiQueryLogs"><template #icon><icon-file /></template>AI 使用记录</a-doption>
            <a-doption @click="openTokenModal">Token</a-doption>
            <a-doption @click="openRefreshSettings">刷新设置</a-doption>
            <a-doption @click="importVisible = true">导入 JSON</a-doption>
            <a-doption :disabled="!selectedBox" @click="copyLocationLink">复制定位链接</a-doption>
          </template>
        </a-dropdown>
      </a-space>
    </div>

    <a-tooltip v-if="!aiVisible && !metricHistoryTarget && !historyVisible" content="打开 AI助手" position="right">
      <a-button class="ai-floating-trigger" type="primary" shape="circle" aria-label="打开 AI助手" @click="openAiAssistant">
        <template #icon><icon-robot /></template>
      </a-button>
    </a-tooltip>
    <section v-if="aiVisible" class="ai-assistant" :class="`ai-assistant--${aiLayout}`" aria-label="AI助手">
      <div v-if="aiLayout === 'docked'" class="ai-resize-handle" role="separator" aria-label="调整 AI助手宽度" aria-orientation="vertical" @mousedown.prevent="startAiResize"></div>
      <header class="ai-header">
        <div><span class="ai-avatar"><icon-robot /></span><span><b>AI助手</b></span></div>
        <a-space :size="2">
          <a-tooltip :content="aiLayout === 'docked' ? '缩小为地图浮窗' : '放大为右侧常驻面板'">
            <a-button type="text" size="mini" :aria-label="aiLayout === 'docked' ? '缩小为地图浮窗' : '放大为右侧常驻面板'" @click="toggleAiLayout"><template #icon><icon-fullscreen-exit v-if="aiLayout === 'docked'" /><icon-fullscreen v-else /></template></a-button>
          </a-tooltip>
          <a-tooltip content="清空当前会话">
            <a-button type="text" size="mini" aria-label="清空当前会话" @click="clearAiConversation"><template #icon><icon-delete /></template></a-button>
          </a-tooltip>
          <a-tooltip content="关闭 AI 助手">
            <a-button type="text" size="mini" aria-label="关闭 AI 助手" @click="aiVisible = false"><template #icon><icon-close /></template></a-button>
          </a-tooltip>
        </a-space>
      </header>
      <div class="ai-context" aria-label="当前分析范围">
        <span class="ai-context-title">当前范围</span>
        <span v-for="item in aiContextLabels" :key="item">{{ item }}</span>
      </div>
      <div class="ai-shortcuts">
        <button v-for="item in aiShortcuts" :key="item.label" type="button" @click="askAi(item.question, item.intent)">{{ item.label }}</button>
      </div>
      <div ref="aiMessagesRef" class="ai-messages">
        <template v-for="message in aiMessages" :key="message.id">
          <div class="ai-message" :class="message.role">
            <span v-if="message.role === 'assistant'" class="ai-mini-avatar"><icon-robot /></span>
            <div class="ai-bubble">
              <a-spin v-if="message.loading" size="small" />
              <template v-else>
                <p v-if="message.progress" class="ai-progress">{{ message.progress }}</p>
                <p v-if="message.reply?.answer || message.content">{{ displayAiAnswer(message) }}</p>
                <WeatherCard v-if="message.reply?.weather" :weather="message.reply.weather" />
                <BoxMetricCard v-if="message.reply?.boxAnalysis?.metric" :analysis="message.reply.boxAnalysis" />
                <BoxAnalysisCard v-else-if="message.reply?.boxAnalysis" :analysis="message.reply.boxAnalysis" />
                <details v-if="message.reply?.boxAnalysis && aiAnalysisText(message)" class="ai-text-analysis">
                  <summary>查看文字分析</summary>
                  <p>{{ aiAnalysisText(message) }}</p>
                </details>
                <section v-if="message.reply?.dispatchGuide" class="ai-dispatch-guide">
                  <header><div><b>{{ message.reply.dispatchGuide.title }}</b><span>仅供人工决策参考，不会创建或修改业务单据</span></div><a-tag color="orange">需人工执行</a-tag></header>
                  <div v-if="message.reply.dispatchGuide.targetBoxes.length" class="ai-guide-row"><span>处理对象</span><div><button v-for="boxNo in message.reply.dispatchGuide.targetBoxes" :key="boxNo" type="button" @click="focusAiBox(boxNo)">{{ boxNo }} 号箱</button></div></div>
                  <div v-if="message.reply.dispatchGuide.suggestedOrder.length" class="ai-guide-row"><span>建议顺序</span><p>{{ message.reply.dispatchGuide.suggestedOrder.join(' → ') }}</p></div>
                  <div v-if="message.reply.dispatchGuide.suggestedVehicles.length" class="ai-guide-row"><span>建议资源</span><p>{{ message.reply.dispatchGuide.suggestedVehicles.join('；') }}</p></div>
                  <div v-if="message.reply.dispatchGuide.rationale.length" class="ai-guide-row"><span>建议依据</span><p>{{ message.reply.dispatchGuide.rationale.join('；') }}</p></div>
                  <div v-if="message.reply.dispatchGuide.risks.length" class="ai-guide-risks"><b>核查提示</b><ul><li v-for="item in message.reply.dispatchGuide.risks" :key="item">{{ item }}</li></ul></div>
                  <footer>{{ message.reply.dispatchGuide.nextStep }}</footer>
                </section>
                <section v-if="message.reply?.priorityRanking?.length" class="ai-priority-ranking">
                  <header><div><b>{{ message.reply.visualization?.title || '优先清运排名' }}</b><span>由满溢率、满溢时长、停留时长三项综合评分得出</span></div><em>满分 100</em></header>
                  <div v-if="message.reply.visualization?.type !== 'bar'" class="ai-priority-table-wrap">
                    <table class="ai-priority-table">
                      <thead><tr><th>排名</th><th>箱体</th><th>收集点</th><th>综合评分</th></tr></thead>
                      <tbody>
                        <tr v-for="(item, index) in message.reply.priorityRanking" :key="item.boxNo" class="ai-focus-row" @click="focusAiBox(item.boxNo)">
                          <td><span class="ai-priority-rank">{{ index + 1 }}</span></td>
                          <td><b>{{ item.boxNo }} 号箱</b></td>
                          <td :title="[item.townshipName, item.villageName, item.pointName].filter(Boolean).join(' · ')">{{ [item.townshipName, item.villageName, item.pointName].filter(Boolean).join(' · ') || '未匹配收集点' }}</td>
                          <td><strong>{{ formatPriorityScore(item.priorityScore) }}<em>分</em></strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="ai-priority-bar-chart">
                    <div v-for="item in message.reply.priorityRanking" :key="item.boxNo" class="ai-priority-bar-row ai-focus-row" @click="focusAiBox(item.boxNo)">
                      <span>{{ item.boxNo }}号</span><i><b :style="{ width: `${Math.max(0, Math.min(100, Number(item.priorityScore) || 0))}%` }"></b></i><em>{{ formatPriorityScore(item.priorityScore) }}</em>
                    </div>
                  </div>
                </section>
                <section v-if="message.reply?.boxList?.items?.length" class="ai-transport-visualization">
                  <header><div><b>{{ message.reply.visualization?.title || '箱体明细' }}</b><span>按乡镇、村庄、箱号排列；不含综合评分</span></div><span>共 {{ message.reply.boxList.totalCount ?? message.reply.boxList.items.length }} 个</span></header>
                  <div class="ai-transport-table-wrap">
                    <table class="ai-transport-table ai-box-list-table"><thead><tr><th>乡镇</th><th>村庄</th><th>箱号</th><th>收集点</th><th>满溢率</th></tr></thead><tbody>
                      <tr v-for="item in message.reply.boxList.items" :key="item.boxNo" class="ai-focus-row" @click="focusAiBox(item.boxNo)"><td>{{ item.townshipName || '未归属' }}</td><td>{{ item.villageName || '未归属' }}</td><td><b>{{ item.boxNo }}号</b></td><td>{{ item.pointName || '未匹配收集点' }}</td><td>{{ Math.round(item.fillLevel) }}%</td></tr>
                    </tbody></table>
                  </div>
                  <div v-if="message.reply.boxList.truncated" class="ai-data-unavailable"><b>明细仅展示 {{ message.reply.boxList.returnedCount }} / {{ message.reply.boxList.totalCount }} 个</b><span>请缩小乡镇、村庄范围后继续查询。</span></div>
                </section>
                <section v-if="message.reply?.transportMetrics" class="ai-transport-visualization">
                  <header><b>{{ message.reply.visualization?.title || '运单指标' }}</b><span>{{ message.reply.transportMetrics.startDate }} ～ {{ message.reply.transportMetrics.endDate }}</span></header>
                  <div v-if="message.reply.visualization?.type === 'metric'" class="ai-transport-metrics">
                    <span><small>运单数量</small><b>{{ message.reply.transportMetrics.taskCount }}<em>单</em></b></span>
                    <span><small>收运量</small><b>{{ formatTransportValue(message.reply.transportMetrics.garbageWeightTon, 'garbageWeightTon') }}<em>吨</em></b></span>
                  </div>
                  <div v-else-if="message.reply.visualization?.type === 'table'" class="ai-transport-table-wrap">
                    <table class="ai-transport-table"><thead><tr><th>{{ transportDimensionLabel(message.reply.transportMetrics.groupBy) }}</th><th>运单数量</th><th>收运量</th></tr></thead><tbody>
                      <tr v-for="item in message.reply.transportMetrics.rows" :key="item.dimension"><td>{{ item.dimension }}</td><td>{{ item.taskCount }} 单</td><td>{{ formatTransportValue(item.garbageWeightTon, 'garbageWeightTon') }} 吨</td></tr>
                    </tbody></table>
                  </div>
                  <div v-else-if="message.reply.visualization?.type === 'line'" class="ai-transport-line-chart">
                    <svg viewBox="0 0 300 96" preserveAspectRatio="none" role="img" :aria-label="message.reply.visualization.title"><polyline :points="transportLinePoints(message.reply.transportMetrics.rows, message.reply.visualization.valueField)" /></svg>
                    <div class="ai-transport-line-labels"><span>{{ message.reply.transportMetrics.rows[0]?.dimension }}</span><span>{{ message.reply.transportMetrics.rows[message.reply.transportMetrics.rows.length - 1]?.dimension }}</span></div>
                  </div>
                  <div v-else class="ai-transport-bars">
                    <div v-for="item in message.reply.transportMetrics.rows" :key="item.dimension" class="ai-transport-bar-row"><span>{{ item.dimension }}</span><i><b :style="{ width: `${transportBarWidth(item, message.reply.transportMetrics.rows, message.reply.visualization?.valueField)}%` }"></b></i><em>{{ formatTransportValue(transportMetricValue(item, message.reply.visualization?.valueField), message.reply.visualization?.valueField) }}</em></div>
                  </div>
                </section>
                <section v-if="message.reply?.residenceDuration" class="ai-transport-visualization">
                  <header><b>停留较久的箱体</b><span>按停留时长降序<span v-if="message.reply.residenceDuration.minDurationHours"> · 至少 {{ message.reply.residenceDuration.minDurationHours }} 小时</span></span></header>
                  <div v-if="message.reply.residenceDuration.items?.length" class="ai-transport-table-wrap">
                    <table class="ai-transport-table ai-residence-table"><thead><tr><th>箱号</th><th>收集点</th><th>停留时长</th><th>垃圾占比</th></tr></thead><tbody>
                      <tr v-for="item in message.reply.residenceDuration.items" :key="item.boxId" class="ai-focus-row" @click="focusAiBox(item.boxNo)"><td><b>{{ item.boxNo }}号</b></td><td :title="[item.townshipName, item.villageName, item.pointName].filter(Boolean).join(' · ')">{{ item.pointName || '未匹配' }}</td><td>{{ formatResidenceDuration(item.durationMinutes) }}</td><td>{{ item.fillLevel == null ? '未知' : `${Number(item.fillLevel.toFixed(2))}%` }}</td></tr>
                    </tbody></table>
                  </div>
                  <p v-else class="ai-progress">{{ message.reply.residenceDuration.message || '当前区域没有符合条件且停留起点已知的箱体。' }}</p>
                  <div v-if="message.reply.residenceDuration.unknownCount" class="ai-data-unavailable"><span>{{ message.reply.residenceDuration.unknownCount }} 个箱体的停留起点缺失，未参与排序。</span></div>
                  <span class="ai-progress" v-if="message.reply.residenceDuration.truncated">展示前 {{ message.reply.residenceDuration.returnedCount }} / {{ message.reply.residenceDuration.totalCount }} 个箱体。</span>
                  <span class="ai-progress">停留时间长不直接代表异常或需要清运。</span>
                </section>
                <section v-if="message.reply?.boxStatistics" class="ai-transport-visualization">
                  <header><b>{{ message.reply.visualization?.title || '箱体数量统计' }}</b><span>{{ message.reply.boxStatistics.scope || 'all' }}</span></header>
                  <div class="ai-transport-metrics"><span><small>精确数量</small><b>{{ message.reply.boxStatistics.totalCount ?? 0 }}<em>个</em></b></span></div>
                  <div v-if="message.reply.boxStatistics.groups?.length" class="ai-transport-bars"><div v-for="item in message.reply.boxStatistics.groups" :key="item.dimension" class="ai-transport-bar-row"><span>{{ item.dimension }}</span><i><b :style="{ width: `${statisticsBarWidth(item.count, message.reply.boxStatistics.groups)}%` }"></b></i><em>{{ item.count }}</em></div></div>
                </section>
                <section v-if="message.reply?.overflowDuration" class="ai-transport-visualization">
                  <header><b>持续满溢箱体</b><span>按满溢时长降序</span></header>
                  <div v-if="hasOverflowDurationData(message.reply)" class="ai-transport-table-wrap">
                    <table class="ai-transport-table ai-residence-table"><thead><tr><th>箱号</th><th>收集点</th><th>满溢时长</th><th>垃圾占比</th></tr></thead><tbody>
                      <tr v-for="item in overflowDurationRows(message.reply)" :key="item.boxNo" class="ai-focus-row" @click="focusAiBox(item.boxNo)"><td><b>{{ item.boxNo }}号</b></td><td :title="overflowLocation(item)">{{ item.pointName || '未匹配' }}</td><td>{{ formatResidenceDuration(item.durationMinutes!) }}</td><td>{{ item.fillLevel == null ? '未知' : `${Number(item.fillLevel.toFixed(2))}%` }}</td></tr>
                    </tbody></table>
                  </div>
                  <p v-else class="ai-progress">{{ message.reply.overflowDuration.message || '当前区域没有满溢起点已知且符合条件的箱体。' }}</p>
                </section>
                <ul v-if="message.reply?.evidence?.length && !message.reply.boxAnalysis" class="ai-evidence"><li v-for="item in message.reply.evidence" :key="item">{{ item }}</li></ul>
                <ul v-if="message.reply?.sources?.length" class="ai-sources">
                  <li v-for="item in message.reply.sources" :key="item.url"><a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title || item.url }}</a></li>
                </ul>
                <div v-if="message.reply" class="ai-message-footer"><span v-if="message.reply.totalDurationMs !== undefined">查询 {{ formatAiSeconds(message.reply.queryDurationMs) }} · AI {{ formatAiSeconds(message.reply.aiDurationMs) }} · 总计 {{ formatAiSeconds(message.reply.totalDurationMs) }}</span><div class="ai-message-actions"><a-tooltip content="复制结果"><a-button size="mini" type="text" aria-label="复制结果" @click="copyAiResult(message)"><template #icon><icon-copy /></template></a-button></a-tooltip><a-button v-if="message.reply.mapActions?.length" size="mini" type="text" @click="applyAiActions(message.reply.mapActions)">在地图查看</a-button></div></div>
              </template>
            </div>
          </div>
        </template>
      </div>
      <form class="ai-input" @submit.prevent="askAi(aiQuestion)">
        <div class="ai-textarea-wrap">
          <a-textarea v-model="aiQuestion" :auto-size="{ minRows: 1, maxRows: 3 }" placeholder="例如：哪些箱体需要优先清运？" @keydown.enter.exact="submitAiOnEnter" />
          <a-button class="ai-send-btn" type="primary" shape="circle" :html-type="aiLoading ? 'button' : 'submit'" :disabled="!aiLoading && !aiQuestion.trim()" :aria-label="aiLoading ? '停止生成' : '发送提问'" @click="aiLoading && stopAiResponse()">
            <template #icon><i v-if="aiLoading" class="ai-stop-icon" aria-hidden="true"></i><icon-arrow-up v-else /></template>
          </a-button>
        </div>
      </form>
    </section>

    <a-card class="filter-card" :bordered="false">
      <div class="filter-block locate-block">
        <span class="filter-label">快速定位</span>
        <a-auto-complete v-model="keyword" class="locate-input" :data="locateSuggestions.slice(0, 8)" :filter-option="false" allow-clear aria-label="箱号或勾臂车车牌号" placeholder="输入箱号车牌号" @select="onLocateSelect" @press-enter="onLocateEnter">
          <template #prefix><icon-search /></template>
          <template v-if="locateSuggestions.length > 8" #footer>
            <div class="locate-suggestions-footer">请输入更完整的箱号或车牌</div>
          </template>
        </a-auto-complete>
      </div>
      <div class="filter-block">
        <span class="filter-label">乡镇</span>
        <button type="button" class="chip" :class="{ active: !townshipFilter }" @click="selectTownship('')">全部</button>
        <button v-for="t in townshipOptions" :key="t" type="button" class="chip" :class="{ active: townshipFilter === t }" @click="selectTownship(t)">{{ t }}</button>
        <button type="button" class="chip unmatched" :class="{ active: townshipFilter === UNMATCHED }" @click="selectTownship(UNMATCHED)">未匹配 {{ unmatchedTownshipCount }}</button>
      </div>
      <div class="filter-block">
        <span class="filter-label">村庄</span>
        <button type="button" class="chip" :class="{ active: !villageFilter }" @click="villageFilter = ''">全部</button>
        <button v-for="v in visibleVillageOptions" :key="v" type="button" class="chip" :class="{ active: villageFilter === v }" @click="villageFilter = v">{{ v }}</button>
        <button v-if="villageOptions.length > VILLAGE_COLLAPSED" type="button" class="chip chip-more" @click="villageCollapsed = !villageCollapsed">
          {{ villageCollapsed ? `更多 ${villageOptions.length - VILLAGE_COLLAPSED}` : '收起' }}
        </button>
        <button type="button" class="chip unmatched" :class="{ active: villageFilter === UNMATCHED }" @click="villageFilter = UNMATCHED">未匹配 {{ unmatchedVillageCount }}</button>
      </div>
      <div class="filter-block status-block">
        <span class="filter-label">状态</span>
        <a-checkbox v-model="overflowOnly" class="status-filter-checkbox danger" :class="{ selected: overflowOnly }">满溢</a-checkbox>
        <a-checkbox v-model="highTemperatureOnly" class="status-filter-checkbox danger" :class="{ selected: highTemperatureOnly }">高温</a-checkbox>
        <a-checkbox v-model="offlineOnly" class="status-filter-checkbox" :class="{ selected: offlineOnly }">离线</a-checkbox>
        <a-checkbox v-model="lowBatteryOnly" class="status-filter-checkbox" :class="{ selected: lowBatteryOnly }">低电量</a-checkbox>
        <a-checkbox v-model="transportingOnly" class="status-filter-checkbox" :class="{ selected: transportingOnly }">收运中</a-checkbox>
      </div>
    </a-card>

    <div v-if="daasAuth.expired" class="token-expired-banner">
      <icon-exclamation-circle-fill />
      <span>接口 Token 已过期或未登录。请</span>
      <a class="token-reset-link" @click="openLogin()">重新登录</a>
      <span>后重试。</span>
    </div>

    <div class="map-layout">
      <div ref="mapFullscreenRef" class="map-card-wrap" :class="{ 'fullscreen-fallback': mapFallbackFullscreen }">
        <a-card class="map-card" :bordered="false">
          <div ref="mapRef" class="amap-container"></div>
          <div class="map-stats">
            <div class="map-stat"><span>箱体总数</span><b>{{ visibleBoxes.length }}</b></div>
            <div class="map-stat danger"><span>满溢预警</span><b>{{ overflowCount }}</b></div>
            <div class="map-stat warning"><span>接近满溢</span><b>{{ nearOverflowCount }}</b></div>
          </div>
          <div class="map-controls">
            <div class="map-theme-picker">
              <span>主题</span>
              <a-select v-model="mapTheme" size="small" :allow-clear="false">
                <a-option v-for="theme in mapThemes" :key="theme.value" :value="theme.value">{{ theme.label }}</a-option>
              </a-select>
            </div>
            <a-tooltip :content="isMapFullscreen ? '退出全屏' : '全屏放大'">
              <a-button class="map-fullscreen-btn" :class="{ active: isMapFullscreen }" size="small" @click="toggleMapFullscreen">
                <template #icon>
                  <icon-fullscreen-exit v-if="isMapFullscreen" />
                  <icon-fullscreen v-else />
                </template>
              </a-button>
            </a-tooltip>
          </div>
          <div class="vehicle-legend">
            <a-checkbox-group v-model="enabledVehicleTypes" aria-label="车辆图层筛选">
              <a-checkbox v-for="type in vehicleTypes" :key="type" :value="type">
                <i class="vehicle-legend-dot" :class="vehicleTypeClass(type)"></i>{{ type }}（{{ vehicleTypeCounts.get(type) || 0 }}）
              </a-checkbox>
            </a-checkbox-group>
          </div>
          <div v-if="mapError" class="map-error">
            <icon-exclamation-circle-fill />
            <span>{{ mapError }}</span>
          </div>
        </a-card>

        <a-card v-if="selectedBox" class="detail-card" :bordered="false">
          <div class="detail-panel-header">
            <div class="detail-title"><span class="box-no">箱体编号</span><h2>{{ selectedBox.containerNo }}</h2></div>
            <a-space size="mini">
              <a-button type="text" size="mini" class="detail-close-btn" @click="selectedBox = undefined">
                <template #icon><icon-close /></template>
              </a-button>
            </a-space>
          </div>
          <div class="detail-scroll">
          <div class="detail-heading">
            <a-tag :color="statusColor(selectedBox)">{{ statusText(selectedBox) }}</a-tag>
            <a-tag v-if="selectedBox.onlineStatus === 1" color="red">设备离线</a-tag>
            <div class="box-detail-actions">
              <a-tooltip content="创建运单"><a-button class="create-task-action" type="primary" status="warning" size="mini" aria-label="创建运单" @click="openCreateTask"><template #icon><icon-plus-circle /></template></a-button></a-tooltip>
              <a-tooltip content="垃圾占比曲线"><a-button type="primary" size="mini" aria-label="垃圾占比曲线" @click="openMetricHistory('fillLevel')"><template #icon><BoxHistoryIcon type="fillLevel" /></template></a-button></a-tooltip>
              <a-tooltip content="温度曲线"><a-button type="primary" size="mini" aria-label="温度曲线" @click="openMetricHistory('temperature')"><template #icon><BoxHistoryIcon type="temperature" /></template></a-button></a-tooltip>
              <a-tooltip content="电量曲线"><a-button type="primary" size="mini" aria-label="电量曲线" @click="openMetricHistory('battery')"><template #icon><BoxHistoryIcon type="battery" /></template></a-button></a-tooltip>
              <a-tooltip content="历史轨迹"><a-button type="primary" size="mini" aria-label="历史轨迹" @click="openHistoryTrack()"><template #icon><BoxHistoryIcon type="track" /></template></a-button></a-tooltip>
            </div>
            <span class="report-time">上报时间：{{ selectedBox.reportTime }}</span>
          </div>
          <div class="fill-summary" :class="markerTone(selectedBox)">
            <span>垃圾占比</span>
            <strong>{{ formatFillLevel(selectedBox) }}%</strong>
            <div class="fill-track"><i :style="{ width: `${fillLevelPercent(selectedBox)}%` }"></i></div>
            <div v-if="selectedBox.overflowStatus === 1 && currentOverflow" class="overflow-duration-summary"><span>满溢时长</span><b>{{ currentOverflowDuration }}</b></div>
            <div v-else-if="selectedBox.overflowStatus === 1 && overflowLoading" class="overflow-duration-summary"><span>满溢时长</span><b>加载中…</b></div>
            <div v-else-if="selectedBox.overflowStatus === 1 && overflowError" class="overflow-duration-summary"><span>满溢时长</span><b>暂未获取，请重新点击箱体重试</b></div>
          </div>
          <div class="location-summary">
            <span class="section-label">乡镇村庄</span>
            <b>{{ selectedArea.township || '未匹配乡镇' }} · {{ selectedArea.village || '未匹配村庄' }}</b>
            <span class="matched-point">{{ selectedArea.pointName || '未匹配收集点' }}</span>
            <div v-if="currentResidence" class="residence-summary"><span>停留时长</span><b>{{ currentResidenceDuration }}</b></div>
            <div v-else-if="residenceLoading" class="residence-summary"><span>停留时长</span><b>加载中…</b></div>
            <div v-else-if="residenceError" class="residence-summary"><span>停留时长</span><b>暂未获取，请重新点击箱体重试</b></div>
          </div>
          <div v-if="matchedVehiclePlates.length" class="vehicle-summary">
            <span class="section-label">运输车辆</span>
            <a-tag v-for="vehicle in matchedVehiclePlates" :key="vehicle.name" color="arcoblue">{{ vehicle.name }}</a-tag>
          </div>
          <div v-if="selectedTransportTask" class="transport-task-summary">
            <div class="transport-task-title"><span class="transport-task-icon">运</span><span>正在运输</span></div>
            <div class="transport-task-grid">
              <span>任务状态</span><b>{{ transportTaskStatusText(selectedTransportTask) }}</b>
              <span>创建时间</span><b>{{ transportTaskValue(selectedTransportTask, 'createTime', 'startTime', 'taskTime') }}</b>
              <span>运输车辆</span><b>{{ transportTaskValue(selectedTransportTask, 'plateNum', 'vehicleNo', 'vehiclePlate', 'plateNo', 'vehicleName') }}</b>
              <span>驾驶员</span><b>{{ transportTaskValue(selectedTransportTask, 'driverName', 'driver', 'driverRealName') }}</b>
            </div>
          </div>
          <details class="more-details">
            <summary>更多设备信息</summary>
            <div class="detail-grid">
              <div class="detail-grid-item full"><span>箱体名称</span><b>{{ selectedBox.containerName }}</b></div>
              <div class="detail-grid-item"><span>容量</span><b>{{ selectedBox.capacity }} 吨</b></div>
              <div class="detail-grid-item"><span>温度</span><b>{{ selectedBox.temperature }} ℃</b></div>
              <div class="detail-grid-item"><span>电量</span><b>{{ selectedBox.voltage }}%</b></div>
              <div class="detail-grid-item"><span>开关状态</span><b>{{ selectedBox.switchStatus === '0' ? '关' : '开' }}</b></div>
              <div class="detail-grid-item full"><span>设备号</span><b>{{ selectedBox.deviceNo }}</b></div>
            </div>
            <div class="coordinate-block">
              <span>原始坐标（WGS84）</span><code>{{ selectedBox.longitude }}, {{ selectedBox.latitude }}</code>
              <div class="coordinate-title">
                <span>地图坐标（GCJ-02）</span>
                <a-button size="mini" type="outline" @click="openAmap">高德打开</a-button>
              </div>
              <code>{{ selectedGcj ? `${selectedGcj.lng.toFixed(6)}, ${selectedGcj.lat.toFixed(6)}` : '-' }}</code>
            </div>
            <div class="matched-block">
              <span class="section-label">全部匹配对象</span>
              <a-empty v-if="!matchedObjects.length" description="未匹配" :image-style="{ height: '30px' }" />
              <div v-for="item in matchedObjects" v-else :key="item.name" class="matched-item">
                <b>{{ item.name }}</b><span v-if="item.longitude !== undefined && item.latitude !== undefined">{{ item.longitude }}, {{ item.latitude }}</span>
              </div>
            </div>
          </details>
          </div>
        </a-card>

        <a-card v-if="selectedVehicle" class="detail-card vehicle-detail-card" :bordered="false">
          <div class="detail-panel-header">
            <div class="detail-title"><span class="box-no">车牌号</span><h2>{{ selectedVehicle.plateNumber || selectedVehicle.id }}</h2></div>
            <a-button type="text" size="mini" class="detail-close-btn" aria-label="关闭车辆详情" @click="closeVehicleInfo">
              <template #icon><icon-close /></template>
            </a-button>
          </div>
          <div class="detail-scroll">
            <div class="detail-heading">
              <a-tag :color="vehicleStatus(selectedVehicle) === 'charging' ? 'arcoblue' : vehicleStatus(selectedVehicle) === 'online' ? 'green' : 'gray'">{{ vehicleStatusText(selectedVehicle) }}</a-tag>
              <a-tag>{{ vehicleTypeOf(selectedVehicle) || '未分类' }}</a-tag>
            </div>
            <div class="location-summary vehicle-location-summary">
              <span class="section-label">当前位置</span>
              <b>{{ selectedVehicleLocation }}</b>
            </div>
            <div class="detail-grid vehicle-detail-grid">
              <div class="detail-grid-item full"><span>驾驶员</span><b>{{ selectedVehicleDriver || (vehicleDriverState === 'loading' ? '加载中…' : vehicleDriverState === 'error' ? '获取失败，请重新点击车辆重试' : '未绑定驾驶员') }}</b></div>
            </div>
            <details v-if="vehicleTypeOf(selectedVehicle) === '小勾臂车'" :key="selectedVehicle.id" class="more-details vehicle-orders" :open="vehicleTasksExpanded" @toggle="vehicleTasksExpanded = ($event.target as HTMLDetailsElement).open">
              <summary>今日运单（{{ selectedVehicleTasks.length }}）</summary>
              <div v-if="selectedVehicleTasks.length" class="vehicle-order-list">
                <div v-for="(task, index) in selectedVehicleTasks" :key="String(task.id ?? index)" class="vehicle-order">
                  <div class="vehicle-order-heading">
                    <b>箱 {{ transportTaskValue(task, 'boxNo', 'containerNo') }}</b>
                    <a-tag size="small" :color="transportTaskStatusText(task) === '已完成' ? 'green' : transportTaskStatusText(task) === '已取消' ? 'gray' : 'arcoblue'">{{ transportTaskStatusText(task) }}</a-tag>
                  </div>
                  <span class="report-time">创建时间：{{ transportTaskValue(task, 'createTime') }}</span>
                  <div class="vehicle-order-route"><span>起点</span><b>{{ vehicleTaskOrigin(task) }}</b><span>终点</span><b>{{ vehicleTaskDestination(task) }}</b></div>
                </div>
              </div>
              <a-empty v-else description="今日暂无运单" :image-style="{ height: '40px' }" />
            </details>
            <details class="more-details">
              <summary>更多车辆信息</summary>
              <div class="detail-grid">
                <div class="detail-grid-item full"><span>车辆 ID</span><b>{{ selectedVehicle.id }}</b></div>
              </div>
              <div class="coordinate-block">
                <span>原始坐标（WGS84）</span><code>{{ selectedVehicle.longitude }}, {{ selectedVehicle.latitude }}</code>
                <span>地图坐标（GCJ-02）</span><code>{{ vehiclePoint(selectedVehicle).lng.toFixed(6) }}, {{ vehiclePoint(selectedVehicle).lat.toFixed(6) }}</code>
              </div>
            </details>
          </div>
        </a-card>

        <BoxHistoryCurves v-if="metricHistoryTarget" :key="metricHistoryTarget.boxId" class="history-overlay" :box-id="metricHistoryTarget.boxId" :box-no="metricHistoryTarget.boxNo" :initial-metric="metricHistoryTarget.metric" :initial-days="metricHistoryTarget.days" @track="openHistoryTrack" @close="metricHistoryTarget = undefined" />

        <section v-if="historyVisible" class="history-overlay">
          <BoxHistoryToolbar v-model:days="historyRange" :box-no="selectedBox?.containerNo || ''" view="track" :loading="historyLoading" @range-change="loadHistoryTrack" @refresh="loadHistoryTrack" @view-change="switchHistoryView" @close="closeHistoryTrack" />
          <div v-if="historyLoading" class="history-state"><a-spin tip="正在加载历史数据" /></div>
          <div v-else-if="historyError" class="history-state"><a-result status="error" title="轨迹加载失败" :subtitle="historyError"><template #extra><a-button @click="loadHistoryTrack">重试</a-button></template></a-result></div>
          <template v-else>
          <div v-if="historyData" class="history-facts"><span>有效位置采集 <b>{{ historyData.summary.snapshotCount }}</b> 个点</span><span><b>{{ historyData.summary.uniquePointCount }}</b> 个收集点 · <b>{{ historyData.summary.visitCount }}</b> 次停靠</span><span v-if="historyData.from && historyData.to">{{ formatTrackTime(historyData.from) }} ～ {{ formatTrackTime(historyData.to) }}</span></div>
          <a-empty v-if="historyData && !historyData.track.length" class="history-state" :description="`近${historyRange}天暂无有效位置数据`" />
          <div v-else class="history-layout">
            <div class="history-map-wrap"><div ref="historyMapRef" class="history-map"></div></div>
            <aside class="history-visits">
              <div class="history-visits-title">经过收集点</div>
              <a-empty v-if="!historyData?.pointVisits.length" description="该时段未识别到收集点停留" />
              <button v-for="(visit, index) in historyData?.pointVisits || []" :key="`${visit.pointId}-${visit.arrivalTime}`" type="button" class="history-visit" @click="focusHistoryVisit(visit)">
                <b>{{ index + 1 }}</b><span><strong>{{ visit.pointName }}</strong><em>{{ visit.townshipName || '未匹配乡镇' }} · {{ visit.villageName || '未匹配村庄' }}</em><em>{{ formatTrackTime(visit.arrivalTime) }} ～ {{ formatTrackTime(visit.departureTime) }}</em><small>停留 {{ formatStayDuration(visit.stayMinutes) }}</small></span>
              </button>
            </aside>
          </div>
          </template>
        </section>
      </div>
    </div>

    <BoxCreateTaskDialog v-if="createTaskTarget" :box="createTaskTarget" @close="createTaskTarget = undefined" />

    <a-modal v-model:visible="importVisible" title="导入最新箱体数据" :width="680" @before-ok="importBoxes">
      <p class="modal-tip">粘贴接口完整 JSON，格式需包含 <code>data.list</code> 数组（云端格式为 <code>data.points</code>）。导入后仅更新当前页面数据。</p>
      <a-textarea v-model="importText" :auto-size="{ minRows: 12, maxRows: 18 }" placeholder="粘贴完整接口 JSON" />
    </a-modal>

    <a-modal v-model:visible="tokenModalVisible" title="手动配置 Token（兜底）" :width="640" :on-before-ok="saveToken">
      <p class="modal-tip">
        用于调用真实接口 <code>/domestic/waste/containers/sbgMonitoring</code>（<code>size=1000</code> 一次性拉取全部箱体）。
        推荐使用「登录」自动获取；此处可手动粘贴 daas-api 登录返回的原始 JWT，无需 <code>Bearer </code> 前缀。
      </p>
      <a-textarea v-model="tokenInput" :auto-size="{ minRows: 4, maxRows: 8 }" placeholder="粘贴 Bearer Token（JWT）" />
    </a-modal>

    <a-modal v-model:visible="refreshSettingsVisible" title="地图刷新设置" :width="420" :on-before-ok="saveRefreshSettings">
      <p class="modal-tip">设置仅在当前浏览器生效。车辆位置和箱体数据分别按设定时间自动刷新，最小间隔为 1 分钟。</p>
      <a-form :model="refreshSettingsDraft" layout="vertical">
        <a-form-item field="boxMinutes" label="箱体刷新间隔">
          <a-space><a-input-number v-model="refreshSettingsDraft.boxMinutes" :min="1" :precision="0" :hide-button="false" /><span>分钟</span></a-space>
        </a-form-item>
        <a-form-item field="vehicleMinutes" label="车辆刷新间隔">
          <a-space><a-input-number v-model="refreshSettingsDraft.vehicleMinutes" :min="1" :precision="0" :hide-button="false" /><span>分钟</span></a-space>
        </a-form-item>
      </a-form>
    </a-modal>
    <a-drawer v-model:visible="aiQueryLogsVisible" title="AI 使用记录" :width="960" unmount-on-close>
      <a-space wrap class="ai-log-filters">
        <a-input v-model="aiLogKeyword" allow-clear placeholder="搜索提问内容" style="width: 220px" @press-enter="loadAiQueryLogs(0)" />
        <a-select v-model="aiLogStatus" allow-clear placeholder="全部状态" style="width: 130px" @change="loadAiQueryLogs(0)">
          <a-option value="SUCCESS">成功</a-option><a-option value="FAILED">失败</a-option>
        </a-select>
        <a-button type="primary" :loading="aiQueryLogsLoading" @click="loadAiQueryLogs(0)"><template #icon><icon-search /></template>查询</a-button>
      </a-space>
      <a-table class="ai-query-log-table" row-key="id" :data="aiQueryLogs" :loading="aiQueryLogsLoading" :columns="aiQueryLogColumns" :scroll="{ x: 1080 }" :pagination="{ current: aiLogPage + 1, pageSize: 20, total: aiLogTotal, showTotal: true }" @page-change="onAiLogPageChange">
        <template #createdAt="{ record }"><span class="ai-log-time">{{ record.createdAt || '-' }}</span></template>
        <template #question="{ record }"><a-tooltip :content="record.question || '-'"><span class="ai-log-ellipsis ai-log-two-lines">{{ record.question || '-' }}</span></a-tooltip></template>
        <template #answer="{ record }"><a-tooltip :content="record.answer || '-'"><span class="ai-log-ellipsis ai-log-two-lines">{{ record.answer || '-' }}</span></a-tooltip></template>
        <template #quality="{ record }"><a-tooltip :content="record.toolAudit || '-'"><a-tag :color="aiQualityColor(record.answerQuality)">{{ aiQualityLabel(record.answerQuality) }}</a-tag></a-tooltip></template>
        <template #status="{ record }"><a-tag :color="record.status === '成功' ? 'green' : 'red'">{{ record.status || '-' }}</a-tag></template>
        <template #duration="{ record }"><span class="ai-log-duration">{{ record.duration || '-' }}</span></template>
      </a-table>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useFullscreen } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, toRaw, watch } from 'vue'
import { useDevice } from '@/hooks'
import { beijingDate, beijingDateTime, parseBeijingDateTime } from '@/utils/beijing-time'
import { useAppStore, useUserStore } from '@/stores'
import { type AMapInstance, type AMapMarker, type AMapMarkerCluster, type AMapMassMarks, loadAmapJsApi, loadAmapMarkerClusterer } from '@/utils/amap'
import { daasAuth, collectorDaasFetch, collectorMapBoxesRequest, collectorMapPointsRequest, collectorMapTransportTasksRequest, collectorVehicleRuntimeRequest, collectorVehicleBasicInfoRequest, collectorVehicleTypesRequest, getHiddenBoxIds, saveSharedDaasToken } from '@/utils/daas'
import { getCachedBoxes, getCachedPoints, saveCachedBoxes, saveCachedPoints, subscribeBoxesUpdated, subscribePointsUpdated } from './sbg-store'
import { createAiConversationId, formatBoxAnalysisSummary, type AiMapAction, type AiShortcutIntent, type AiOverflowDurationItem, type AiQueryContext, type AiReply, type AiTransportMetricRow, queryBoxMapAssistantStream } from './box-map-ai'

import BoxAnalysisCard from './components/BoxAnalysisCard.vue'
import BoxMetricCard from './components/BoxMetricCard.vue'
import BoxHistoryCurves from './components/BoxHistoryCurves.vue'
import BoxHistoryToolbar from './components/BoxHistoryToolbar.vue'
import BoxHistoryIcon from './components/BoxHistoryIcon.vue'
import BoxCreateTaskDialog from './components/BoxCreateTaskDialog.vue'
import type { BoxHistoryMetric, BoxHistoryDays, BoxHistoryView } from './box-history-metrics'
import WeatherCard from './components/WeatherCard.vue'

defineOptions({ name: 'SanitationBoxMap' })

/** DAAS 状态：pending/accepted/collecting/completed；前三种显示“运”角标。 */
const TRANSPORTING_STATUSES = new Set(['pending', 'accepted', 'collecting'])
const COLLECTOR_API_BASE_URL = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')

interface GcjPoint { lng: number, lat: number }
type MapTheme = 'normal' | 'light' | 'blue'
interface Box {
  id: number
  deviceNo: string
  containerNo: string
  containerName: string
  onlineStatus: number
  overflowStatus: number
  matchObject: string
  fillLevel: number
  capacity: number
  longitude: number
  latitude: number
  reportTime: string
  temperature: number
  voltage: number
  switchStatus: string
}
interface CollectionPoint {
  id: number
  pointName: string
  pointCode: string
  townshipName: string
  villageName: string
  longitude: number
  latitude: number
}
interface MatchedObject {
  name: string
  longitude?: number
  latitude?: number
}
interface TransportTask extends Record<string, unknown> {
  boxNo?: string
  containerNo?: string
  status?: string
  taskStatus?: string
  statusName?: string
  taskStatusName?: string
  createTime?: string
  startTime?: string
  taskTime?: string
}
interface HistoryTrackPoint { time: string, longitude: number, latitude: number, pointId?: number, pointName?: string }
interface HistoryPointVisit { pointId: number, pointName: string, townshipName: string, villageName: string, arrivalTime: string, departureTime: string, stayMinutes: number, snapshotCount: number }
interface HistoryTrackResponse { from?: string, to?: string, track: HistoryTrackPoint[], pointVisits: HistoryPointVisit[], summary: { snapshotCount: number, uniquePointCount: number, visitCount: number } }
interface CurrentResidence { boxId: number, pointId: number, pointName: string, townshipName: string, villageName: string, arrivalTime: string, lastSeenTime: string }
interface CurrentOverflow { boxId: number, overflowing: boolean, overflowStartedAt: string | null, lastSeenTime: string }
interface AiRequestContext extends AiQueryContext {}
type VehicleType = '小勾臂车' | '大勾臂车' | '小三轮'
interface VehicleRuntime {
  id: number
  plateNumber: string
  longitude: number
  latitude: number
  onlineState?: number | null
  chargingState?: number | null
  organizationName?: string | null
  vehicleModelId?: number | null
}
interface VehicleTypeItem { id?: number | string }
interface VehicleTypeGroup { modelName?: string, vehicleList?: VehicleTypeItem[] }
interface VehicleOrganization { modelVehicleList?: VehicleTypeGroup[], children?: VehicleOrganization[] }
type VehicleStatus = 'online' | 'offline' | 'charging'
interface VehicleAddressCacheItem { coordinate: string, address: string }
interface TricycleClusterPoint extends Record<string, unknown> { lnglat: [number, number], vehicle: VehicleRuntime }

const VEHICLE_TYPES: VehicleType[] = ['小勾臂车', '大勾臂车', '小三轮']
// 箱体每两分钟、车辆每一分钟刷新，旧版设置不覆盖新的默认周期。
const REFRESH_SETTINGS_KEY = 'sbg-monitor:box-map-refresh-settings:v3'
const AI_LAYOUT_SETTINGS_KEY = 'sbg-monitor:box-map-ai-layout'
const DEFAULT_BOX_REFRESH_MINUTES = 2
const DEFAULT_VEHICLE_REFRESH_MINUTES = 1

function readRefreshMinutes(key: 'boxMinutes' | 'vehicleMinutes', fallback: number) {
  try {
    const value = Number(JSON.parse(localStorage.getItem(REFRESH_SETTINGS_KEY) || '{}')[key])
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback
  } catch { return fallback }
}

const initialBoxes: Box[] = [
  { id: 48, deviceNo: '13820260721000000026', containerNo: '132', containerName: '小勾臂箱132号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368},"6225420055":{"latitude":36.068728,"longitude":114.242248},"6226170009":{"latitude":36.068764,"longitude":114.242648}}', fillLevel: 0, capacity: 1.5, longitude: 114.242817, latitude: 36.069452, reportTime: '2026-08-06 18:56:04', temperature: 34.37, voltage: 40, switchStatus: '0' },
  { id: 34, deviceNo: '13820260721000000121', containerNo: '148', containerName: '小勾臂箱148号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 60.8, capacity: 1.5, longitude: 114.045902, latitude: 36.039724, reportTime: '2026-08-06 18:56:03', temperature: 30, voltage: 80, switchStatus: '0' },
  { id: 62, deviceNo: '13820260721000000059', containerNo: '323', containerName: '小勾臂箱323号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"马家乡北齐":{"latitude":36.055297,"longitude":114.026639},"431":{"latitude":36.056207,"longitude":114.026885},"435":{"latitude":36.055823,"longitude":114.026455}}', fillLevel: 0, capacity: 1.5, longitude: 114.025919, latitude: 36.055901, reportTime: '2026-08-06 18:56:03', temperature: 30.62, voltage: 80, switchStatus: '0' },
  { id: 80, deviceNo: '13820260721000000002', containerNo: '358', containerName: '小勾臂箱358号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368}}', fillLevel: 0, capacity: 1.5, longitude: 114.242314, latitude: 36.06946, reportTime: '2026-08-06 18:56:03', temperature: 34.31, voltage: 60, switchStatus: '0' },
  { id: 65, deviceNo: '13820260721000000031', containerNo: '274', containerName: '小勾臂箱274号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"马家乡横岭三仓线":{"latitude":35.995262,"longitude":114.038768},"马家乡岭头":{"latitude":35.992369,"longitude":114.045606}}', fillLevel: 69.87, capacity: 1.5, longitude: 114.038736, latitude: 35.995271, reportTime: '2026-08-06 18:56:03', temperature: 31.31, voltage: 80, switchStatus: '0' },
  { id: 25, deviceNo: '13820260721000000020', containerNo: '150', containerName: '小勾臂箱150号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"416":{"latitude":36.035347,"longitude":114.022102}}', fillLevel: 0, capacity: 1.5, longitude: 114.022643, latitude: 36.03506, reportTime: '2026-08-06 18:56:03', temperature: 31.62, voltage: 40, switchStatus: '0' },
  { id: 67, deviceNo: '13820260721000000014', containerNo: '161', containerName: '小勾臂箱161号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"豫AE9509":{"latitude":36.067728,"longitude":114.242184},"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368},"豫AE9505":{"latitude":36.067772,"longitude":114.242472}}', fillLevel: 0, capacity: 1.5, longitude: 114.242216, latitude: 36.067765, reportTime: '2026-08-06 18:56:03', temperature: 32.06, voltage: 50, switchStatus: '0' },
  { id: 70, deviceNo: '13820260721000000010', containerNo: '285', containerName: '小勾臂箱285号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '{"龙泉镇中转站（临时）":{"latitude":36.064611,"longitude":114.247368}}', fillLevel: 0, capacity: 1.5, longitude: 114.242581, latitude: 36.069468, reportTime: '2026-08-06 18:56:03', temperature: 33.37, voltage: 40, switchStatus: '0' },
  { id: 47, deviceNo: '13820260721000000028', containerNo: '143', containerName: '小勾臂箱143号设备', onlineStatus: 0, overflowStatus: 0, matchObject: '', fillLevel: 57.6, capacity: 1.5, longitude: 114.023128, latitude: 36.056029, reportTime: '2026-08-06 18:56:03', temperature: 30.81, voltage: 80, switchStatus: '0' },
  { id: 76, deviceNo: '13820260721000000070', containerNo: '176', containerName: '小勾臂箱176号设备', onlineStatus: 0, overflowStatus: 1, matchObject: '{"马家乡北齐":{"latitude":36.055297,"longitude":114.026639},"430":{"latitude":36.055177,"longitude":114.026652},"435":{"latitude":36.055823,"longitude":114.026455}}', fillLevel: 75.6, capacity: 1.5, longitude: 114.026696, latitude: 36.055253, reportTime: '2026-08-06 18:56:03', temperature: 30.68, voltage: 70, switchStatus: '0' },
]

const mapRef = ref<HTMLDivElement>()
const pageFullscreenRef = ref<HTMLElement | null>(null)
const mapFullscreenRef = ref<HTMLElement | null>(null)
const appStore = useAppStore()
const userStore = useUserStore()
const { isDesktop } = useDevice()
const { isFullscreen: isNativePageFullscreen, toggle: toggleNativePageFullscreen } = useFullscreen(pageFullscreenRef, {
  onFullscreenChange: () => { nextTick(() => map?.resize()) },
})
const { isFullscreen: isNativeMapFullscreen, toggle: toggleNativeMapFullscreen } = useFullscreen(mapFullscreenRef, {
  // 进入/退出全屏后地图容器尺寸变化，通知高德地图重算视口
  onFullscreenChange: () => { nextTick(() => map?.resize()) },
})
// iOS Safari 和部分内嵌手机浏览器不支持元素 Fullscreen API。保留原生全屏，
// 不可用时降级为 CSS 沉浸全屏，避免点击按钮没有任何反馈。
const pageFallbackFullscreen = ref(false)
const mapFallbackFullscreen = ref(false)
const isPageFullscreen = computed(() => isNativePageFullscreen.value || pageFallbackFullscreen.value)
const isMapFullscreen = computed(() => isNativeMapFullscreen.value || mapFallbackFullscreen.value)

function supportsNativeFullscreen() {
  return typeof document !== 'undefined' && document.fullscreenEnabled === true
}

async function resizeMapAfterLayout() {
  await nextTick()
  requestAnimationFrame(() => map?.resize())
}

async function togglePageFullscreen() {
  if (!supportsNativeFullscreen()) {
    pageFallbackFullscreen.value = !pageFallbackFullscreen.value
    await resizeMapAfterLayout()
    return
  }
  try {
    await toggleNativePageFullscreen()
  } catch {
    pageFallbackFullscreen.value = !pageFallbackFullscreen.value
    await resizeMapAfterLayout()
  }
}

async function toggleMapFullscreen() {
  if (!supportsNativeFullscreen()) {
    mapFallbackFullscreen.value = !mapFallbackFullscreen.value
    await resizeMapAfterLayout()
    return
  }
  try {
    await toggleNativeMapFullscreen()
  } catch {
    mapFallbackFullscreen.value = !mapFallbackFullscreen.value
    await resizeMapAfterLayout()
  }
}
/** 侧栏展开 230px、折叠 48px；全屏/移动端没有侧栏，助手贴内容区边缘。 */
const aiOverlayStyle = computed(() => ({
  '--ai-left': `${isPageFullscreen.value || !isDesktop.value ? 10 : appStore.menuCollapse ? 72 : 254}px`,
  '--ai-panel-width': `${aiPanelWidth.value}px`,
}))
const keyword = ref('')
const overflowOnly = ref(false)
const highTemperatureOnly = ref(false)
const offlineOnly = ref(false)
const lowBatteryOnly = ref(false)
const transportingOnly = ref(false)
const mapTheme = ref<MapTheme>('light')
const boxes = ref<Box[]>(initialBoxes)
const points = ref<CollectionPoint[]>([])
const townshipFilter = ref('')
const villageFilter = ref('')
/** 「未匹配」筛选值：无收集点归属（无乡镇/村庄）的箱体专用 sentinel，不会与真实乡镇/村庄名冲突 */
const UNMATCHED = '__unmatched__'
const selectedBox = ref<Box>()
const mapError = ref('')
const cloudLoading = ref(false)
const vehicleLoading = ref(false)
const vehicleError = ref(false)
const vehicleTypesLoading = ref(false)
const vehicleTypesError = ref(false)
const importVisible = ref(false)
const importText = ref('')
const aiVisible = ref(false)
type AiLayout = 'floating' | 'docked'
function readAiLayout(): AiLayout {
  try { return JSON.parse(localStorage.getItem(AI_LAYOUT_SETTINGS_KEY) || '{}').layout === 'docked' ? 'docked' : 'floating' } catch { return 'floating' }
}
function readAiPanelWidth() {
  try {
    const width = Number(JSON.parse(localStorage.getItem(AI_LAYOUT_SETTINGS_KEY) || '{}').width)
    return Number.isFinite(width) ? Math.min(680, Math.max(380, Math.round(width))) : 460
  } catch { return 460 }
}
const aiLayout = ref<AiLayout>(readAiLayout())
const aiPanelWidth = ref(readAiPanelWidth())
let aiResizing = false
const aiQuestion = ref('')
const aiLoading = ref(false)
let aiConversationId = createAiConversationId()
let activeAiRequest: AbortController | undefined
const aiMessagesRef = ref<HTMLElement>()
const aiShortcuts = computed<Array<{ label: string, question: string, intent?: AiShortcutIntent }>>(() => selectedBox.value
  ? [
      { label: `分析 ${selectedBox.value.containerNo} 号箱`, question: `分析 ${selectedBox.value.containerNo} 号箱当前状态、垃圾占比变化、停留时长和运输任务。`, intent: 'analyze_box' },
      { label: '温度', question: `分析 ${selectedBox.value.containerNo} 号箱温度及近3天变化，展示温度曲线。`, intent: 'box_temperature' },
      { label: '电量', question: `分析 ${selectedBox.value.containerNo} 号箱电量及近3天变化，展示电量曲线。`, intent: 'box_battery' },
    ]
  : [
      { label: '满溢箱体', question: '当前区域有哪些已满溢箱体？', intent: 'overflow_boxes' },
      { label: '停留超长', question: '列出当前区域的箱体，按停留时长由大到小排序，不使用综合评分。', intent: 'long_residence' },
      { label: '满溢超长', question: '列出当前区域已满溢的箱体，按连续满溢时长由大到小排序，不使用综合评分。', intent: 'long_overflow' },
      { label: '优先清运', question: '当前区域哪些箱体需要优先清运？按综合评分排序。', intent: 'priority_cleanup' },
    ])
const aiContextLabels = computed(() => {
  const labels = [townshipFilter.value === UNMATCHED ? '未匹配乡镇' : townshipFilter.value || '全部区域']
  if (villageFilter.value) labels.push(villageFilter.value === UNMATCHED ? '未匹配村庄' : villageFilter.value)
  if (overflowOnly.value) labels.push('仅满溢')
  if (highTemperatureOnly.value) labels.push('仅高温')
  if (offlineOnly.value) labels.push('仅离线')
  if (lowBatteryOnly.value) labels.push('仅低电量')
  if (transportingOnly.value) labels.push('仅收运中')
  if (selectedBox.value) labels.push(`已选 ${selectedBox.value.containerNo} 号箱`)
  labels.push(`${visibleBoxes.value.length} 个箱体`)
  return labels
})
type AiMessage = { id: number, role: 'user' | 'assistant', content: string, loading?: boolean, progress?: string, reply?: AiReply }
function initialAiMessages(): AiMessage[] {
  return [{ id: Date.now(), role: 'assistant', content: '我是 AI助手。可分析箱体调度，也可回答通用问题；实时公开信息会附上来源。' }]
}
const aiMessages = ref<AiMessage[]>(initialAiMessages())
function displayAiAnswer(message: AiMessage) {
  if (message.reply?.boxAnalysis) return formatBoxAnalysisSummary(message.reply.boxAnalysis)
  return message.reply?.structured?.conclusion || message.reply?.answer || message.content
}
function formatResidenceDuration(minutes: number) {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}天${Math.floor(minutes % 1440 / 60)}小时`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`
  return `${minutes}分钟`
}
function aiAnalysisText(message: AiMessage) {
  return message.reply?.answer || message.reply?.structured?.conclusion || ''
}
function aiResultText(message: AiMessage) {
  const reply = message.reply
  if (!reply) return message.content
  const lines = [displayAiAnswer(message)]
  if (reply.boxList?.items?.length) {
    lines.push(`箱体明细（共 ${reply.boxList.totalCount ?? reply.boxList.items.length} 个）：`)
    reply.boxList.items.forEach(item => lines.push(`${item.townshipName || '未归属'}｜${item.villageName || '未归属'}｜${item.boxNo}号｜${item.pointName || '未匹配收集点'}｜满溢率 ${Math.round(item.fillLevel)}%`))
  }
  if (reply.residenceDuration?.items?.length) {
    lines.push(`停留时长降序${reply.residenceDuration.minDurationHours ? `（至少 ${reply.residenceDuration.minDurationHours} 小时）` : ''}（共 ${reply.residenceDuration.totalCount} 个）：`)
    reply.residenceDuration.items.forEach(item => lines.push(`${item.boxNo}号｜${item.pointName || '未匹配'}｜${formatResidenceDuration(item.durationMinutes)}`))
  }
  if (reply.priorityRanking?.length) {
    lines.push('综合评分排名：')
    reply.priorityRanking.forEach((item, index) => lines.push(`${index + 1}. ${item.boxNo}号｜${[item.townshipName, item.villageName, item.pointName].filter(Boolean).join('｜')}｜${formatPriorityScore(item.priorityScore)}分`))
  }
  if (reply.evidence?.length && !reply.boxAnalysis) lines.push('数据说明：', ...reply.evidence.map(item => `- ${item}`))
  return lines.filter(Boolean).join('\n')
}
async function copyAiResult(message: AiMessage) {
  const text = aiResultText(message)
  try { await navigator.clipboard.writeText(text); Message.success('结果已复制') }
  catch { window.prompt('复制以下结果：', text) }
}
interface AiQueryLog { id: number, question: string, answer?: string, questionDomain?: string, status: string, answerQuality?: string, toolAudit?: string, totalDurationMs: number | null, duration?: string, createdAt: string }
const aiQueryLogsVisible = ref(false)
const aiQueryLogsLoading = ref(false)
const aiQueryLogs = ref<AiQueryLog[]>([])
const aiLogKeyword = ref('')
const aiLogStatus = ref<string>()
const aiLogPage = ref(0)
const aiLogTotal = ref(0)
const aiQueryLogColumns = [
  { title: '提问时间', dataIndex: 'createdAt', slotName: 'createdAt', width: 140 }, { title: '问题', dataIndex: 'question', slotName: 'question', width: 230 },
  { title: '回答', dataIndex: 'answer', slotName: 'answer', width: 360 }, { title: '回答质量', dataIndex: 'answerQuality', slotName: 'quality', width: 100 }, { title: '状态', dataIndex: 'status', slotName: 'status', width: 72 }, { title: '耗时', dataIndex: 'duration', slotName: 'duration', width: 76 },
]
function aiQualityLabel(value?: string) { return ({ SUPPORTED: '已支持', PARTIAL: '部分支持', UNSUPPORTED: '未支持', NO_DATA: '暂无数据', AMBIGUOUS: '待确认' } as Record<string, string>)[value || ''] || '-' }
function aiQualityColor(value?: string) { return ({ SUPPORTED: 'green', PARTIAL: 'orange', UNSUPPORTED: 'red', NO_DATA: 'gray', AMBIGUOUS: 'orangered' } as Record<string, string>)[value || ''] || 'gray' }
const tokenModalVisible = ref(false)
const tokenInput = ref(daasAuth.token)
const refreshSettingsVisible = ref(false)
const boxRefreshMinutes = ref(readRefreshMinutes('boxMinutes', DEFAULT_BOX_REFRESH_MINUTES))
const vehicleRefreshMinutes = ref(readRefreshMinutes('vehicleMinutes', DEFAULT_VEHICLE_REFRESH_MINUTES))
const refreshSettingsDraft = ref({ boxMinutes: boxRefreshMinutes.value, vehicleMinutes: vehicleRefreshMinutes.value })
const vehicles = ref<VehicleRuntime[]>([])
const vehicleTypeById = ref<Map<number, VehicleType>>(new Map())
const enabledVehicleTypes = ref<VehicleType[]>([])
const currentResidence = ref<CurrentResidence>()
const currentOverflow = ref<CurrentOverflow>()
const residenceLoading = ref(false)
const residenceError = ref(false)
const overflowLoading = ref(false)
const overflowError = ref(false)
const residenceNow = ref(Date.now())
const residenceCache = new Map<string, CurrentResidence>()
let residenceRequestVersion = 0
const historyVisible = ref(false)
const historyRange = ref<BoxHistoryDays>(2)
const historyError = ref('')
let historyRequestVersion = 0
let historyAbort: AbortController | undefined
const historyLoading = ref(false)
const historyMapRef = ref<HTMLDivElement>()
const historyData = ref<HistoryTrackResponse>()
const metricHistoryTarget = shallowRef<{ boxId: number, boxNo: string, metric: BoxHistoryMetric, days: BoxHistoryDays }>()
function openMetricHistory(metric: BoxHistoryMetric, days: BoxHistoryDays = 2) {
  if (!selectedBox.value) return
  if (historyVisible.value) closeHistoryTrack()
  metricHistoryTarget.value = { boxId: selectedBox.value.id, boxNo: selectedBox.value.containerNo, metric, days }
}
function switchHistoryView(view: BoxHistoryView) {
  if (view !== 'track') openMetricHistory(view, historyRange.value)
}
watch(() => selectedBox.value?.id, (id, previousId) => {
  if (metricHistoryTarget.value && metricHistoryTarget.value.boxId !== id) metricHistoryTarget.value = undefined
  if (historyVisible.value && id !== previousId) closeHistoryTrack()
})
/** boxNo -> 最近一条临时视为“正在运输”的任务单 */
const transportTasksByBoxNo = ref<Map<string, TransportTask>>(new Map())
const todayTransportTasks = ref<TransportTask[]>([])
const transportTasksLoading = ref(false)
const transportTasksError = ref(false)
const pointsLoading = ref(false)
const pointsError = ref(false)
let pointsLoadedAt = 0
/** 当前收集点停留不足一小时的箱体；由地图数据接口批量返回。 */
const newBoxIds = ref<Set<number>>(new Set())
let newBoxIdsLoading = false
let map: AMapInstance | undefined
let markers: AMapMarker[] = []
let vehicleMarkers: AMapMarker[] = []
let tricycleCluster: AMapMarkerCluster | undefined
let massMarks: AMapMassMarks | undefined
let selectedMassMarker: AMapMarker | undefined
let markerMode: 'mass' | 'label' | undefined
let amap: Awaited<ReturnType<typeof loadAmapJsApi>> | undefined
let vehicleTypesLoadedAt = 0
let activeVehicleInfoKey = ''
let selectedVehicleMarker: AMapMarker | undefined
let resetSelectedVehicleMarker: (() => void) | undefined
const VEHICLE_FOCUSED_Z_INDEX = 2_000
const vehicleAddressCache = new Map<number, VehicleAddressCacheItem>()
let gcjPoints = new WeakMap<Box, GcjPoint>()
let historyMap: AMapInstance | undefined
let historyOverlays: Array<AMapMarker | { setMap: (map: AMapInstance | null) => void }> = []
const mapThemes: Array<{ label: string, value: MapTheme }> = [
  { label: '标准', value: 'light' },
  { label: '默认', value: 'normal' },
  { label: '靛青蓝', value: 'blue' },
]

function openTokenModal() {
  tokenInput.value = daasAuth.token
  tokenModalVisible.value = true
}
async function saveToken() {
  try {
    await saveSharedDaasToken(tokenInput.value)
    Message.success('Token 已保存到采集服务')
    tokenModalVisible.value = false
    void loadFromCloud(true)
    void loadVehicles(true, true)
    return true
  } catch (error) {
    Message.error(`Token 保存失败：${error instanceof Error ? error.message : '请检查采集服务'}`)
    return false
  }
}
function openLogin() {
  daasAuth.visible = true
}
function normalizeRefreshMinutes(value: unknown, fallback: number) {
  const minutes = Math.floor(Number(value))
  return Number.isFinite(minutes) && minutes >= 1 ? minutes : fallback
}
function openRefreshSettings() {
  refreshSettingsDraft.value = { boxMinutes: boxRefreshMinutes.value, vehicleMinutes: vehicleRefreshMinutes.value }
  refreshSettingsVisible.value = true
}
function saveRefreshSettings() {
  const boxMinutes = normalizeRefreshMinutes(refreshSettingsDraft.value.boxMinutes, boxRefreshMinutes.value)
  const vehicleMinutes = normalizeRefreshMinutes(refreshSettingsDraft.value.vehicleMinutes, vehicleRefreshMinutes.value)
  boxRefreshMinutes.value = boxMinutes
  vehicleRefreshMinutes.value = vehicleMinutes
  try { localStorage.setItem(REFRESH_SETTINGS_KEY, JSON.stringify({ boxMinutes, vehicleMinutes })) } catch { /* 本地存储不可用时仍应用本次设置。 */ }
  setupBoxRefreshTimer()
  setupVehicleRefreshTimer()
  Message.success('刷新设置已保存')
  return true
}

/** 箱体 -> 所属乡镇/村庄（仅以收集点名称关联，不能使用车辆/箱体编号） */
const boxAreas = reactive(new Map<number, { township: string, village: string, pointName: string, pointId?: number }>())
function isCollectionPointNameKey(key: string) {
  return !/^\d+$/.test(key) && !/^[\u4E00-\u9FFF][A-Z][A-Z0-9]{5,6}$/.test(key)
}
function isVehiclePlate(value: string) { return /^[\u4E00-\u9FFF][A-Z][A-Z0-9]{5,6}$/.test(value) }

// matchObject 同时含收集点、车辆等对象。只接受非纯数字的收集点名称；
// 不能把 190、164 等车辆标识按收集点 ID/编码关联。
function assignBoxAreas(boxList: Box[], pointList: CollectionPoint[]) {
  boxAreas.clear()
  for (const box of boxList) {
    try {
      const keys = Object.keys(JSON.parse(box.matchObject || '{}'))
      const candidates = pointList.filter((point) => keys.some((key) =>
        isCollectionPointNameKey(key) && point.pointName === key,
      ))
      // 多个收集点命中时按坐标最近者确定归属，不依赖 JSON 键顺序。
      const hit = candidates.reduce<CollectionPoint | undefined>((nearest, point) => {
        if (!nearest) return point
        const distance = (point.longitude - box.longitude) ** 2 + (point.latitude - box.latitude) ** 2
        const nearestDistance = (nearest.longitude - box.longitude) ** 2 + (nearest.latitude - box.latitude) ** 2
        return distance < nearestDistance ? point : nearest
      }, undefined)
      if (hit) boxAreas.set(box.id, { township: hit.townshipName, village: hit.villageName || '', pointName: hit.pointName, pointId: hit.id })
    } catch { /* 忽略 */ }
  }
}

const townshipOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    const a = boxAreas.get(b.id)
    if (a?.township) s.add(a.township)
  }
  return Array.from(s).sort()
})
const villageOptions = computed(() => {
  const s = new Set<string>()
  for (const b of boxes.value) {
    const a = boxAreas.get(b.id)
    if (!a?.village) continue
    if (townshipFilter.value && a.township !== townshipFilter.value) continue
    s.add(a.village)
  }
  return Array.from(s).sort()
})
/** 村庄 chips 折叠：默认只显示前 N 个（约两行），点击「更多」展开 */
const VILLAGE_COLLAPSED = 10
const villageCollapsed = ref(true)
const visibleVillageOptions = computed(() => {
  const list = villageCollapsed.value ? villageOptions.value.slice(0, VILLAGE_COLLAPSED) : villageOptions.value
  // 保证当前选中的村庄始终可见（即使超出折叠数量）
  if (villageFilter.value && villageFilter.value !== UNMATCHED && !list.includes(villageFilter.value) && villageOptions.value.includes(villageFilter.value)) {
    return [...list, villageFilter.value]
  }
  return list
})
function selectTownship(val: string) {
  townshipFilter.value = val
  villageFilter.value = ''
}

function aiContext(singleBox = false): AiRequestContext {
  const snapshots = (singleBox ? [] : visibleBoxes.value).map((box) => {
    const area = boxAreas.get(box.id)
    return { id: box.id, containerNo: box.containerNo, containerName: box.containerName, fillLevel: box.fillLevel, overflowStatus: box.overflowStatus, onlineStatus: box.onlineStatus, township: area?.township || '', village: area?.village || '', reportTime: box.reportTime }
  })
  return {
    selectedBoxNo: selectedBox.value?.containerNo,
    scope: {
      township: townshipFilter.value === UNMATCHED ? '未匹配' : townshipFilter.value || undefined,
      village: villageFilter.value === UNMATCHED ? '未匹配' : villageFilter.value || undefined,
      overflowOnly: overflowOnly.value || undefined,
      transportingOnly: transportingOnly.value || undefined,
      visibleBoxCount: visibleBoxes.value.length,
    },
    boxes: snapshots,
    operatorName: userStore.nickname || userStore.username || undefined,
  }
}
async function openAiQueryLogs() {
  aiQueryLogsVisible.value = true
  await loadAiQueryLogs(0)
}
async function loadAiQueryLogs(page = aiLogPage.value) {
  aiQueryLogsLoading.value = true
  try {
    const base = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
    const params = new URLSearchParams({ page: String(page), size: '20' })
    if (aiLogKeyword.value.trim()) params.set('keyword', aiLogKeyword.value.trim())
    if (aiLogStatus.value) params.set('status', aiLogStatus.value)
    const response = await fetch(`${base}/api/ai/query-logs?${params}`)
    if (!response.ok) throw new Error(await response.text() || '加载 AI 使用记录失败')
    const data = await response.json() as { items: AiQueryLog[], total: number, page: number }
    aiQueryLogs.value = data.items || []; aiLogTotal.value = data.total || 0; aiLogPage.value = data.page || 0
  } catch (error) { Message.error(error instanceof Error ? error.message : '加载 AI 使用记录失败') }
  finally { aiQueryLogsLoading.value = false }
}
function onAiLogPageChange(page: number) { void loadAiQueryLogs(page - 1) }
function formatPriorityScore(value: number) {
  return String(Math.round(Number(value || 0)))
}
function transportDimensionLabel(groupBy: string) {
  return ({ DAY: '日期', TOWNSHIP: '乡镇', VEHICLE: '车辆' } as Record<string, string>)[groupBy] || '指标'
}
function transportMetricValue(row: AiTransportMetricRow, field?: string) {
  return Number(field === 'garbageWeightTon' ? row.garbageWeightTon : row.taskCount) || 0
}
function formatTransportValue(value: number, field?: string) {
  const numeric = Number(value) || 0
  return field === 'garbageWeightTon' ? numeric.toFixed(2).replace(/\.00$/, '') : String(Math.round(numeric))
}
function statisticsBarWidth(value: number, rows?: Array<{ count: number }>) { const max = Math.max(...(rows || []).map(item => item.count), 1); return Math.max(4, Math.round(value / max * 100)) }
function formatMinutes(value?: number) { if (value === undefined || value === null) return '起始时间待补齐'; const hours = Math.floor(value / 60); return hours ? `${hours}小时${value % 60}分` : `${value}分` }
function formatAiSeconds(milliseconds?: number) { return `${((Number(milliseconds) || 0) / 1000).toFixed(1)} 秒` }
function overflowDurationRows(reply: AiReply) { return (reply.overflowDuration?.items || []).filter(item => item.durationMinutes !== undefined && item.durationMinutes !== null) }
function hasOverflowDurationData(reply: AiReply) { return overflowDurationRows(reply).length > 0 }
function overflowLocation(item: AiOverflowDurationItem) { return [item.townshipName, item.villageName, item.pointName].filter(Boolean).join(' · ') || '未匹配收集点' }
function transportBarWidth(row: AiTransportMetricRow, rows: AiTransportMetricRow[], field?: string) {
  const maximum = Math.max(...rows.map((item) => transportMetricValue(item, field)), 1)
  return Math.max(4, Math.round(transportMetricValue(row, field) / maximum * 100))
}
function transportLinePoints(rows: AiTransportMetricRow[], field?: string) {
  if (!rows.length) return ''
  if (rows.length === 1) return '0,48 300,48'
  const values = rows.map((row) => transportMetricValue(row, field))
  const maximum = Math.max(...values, 1)
  return values.map((value, index) => `${index / (values.length - 1) * 300},${88 - value / maximum * 76}`).join(' ')
}
function submitAiOnEnter(event: KeyboardEvent) {
  // 中文输入法确认候选词同样会触发 Enter，不能当作发送。
  if (event.isComposing) return
  event.preventDefault()
  void askAi(aiQuestion.value)
}
function openAiAssistant() {
  aiVisible.value = true
  void nextTick(() => aiMessagesRef.value?.scrollTo({ top: aiMessagesRef.value.scrollHeight }))
}
function persistAiLayout() {
  localStorage.setItem(AI_LAYOUT_SETTINGS_KEY, JSON.stringify({ layout: aiLayout.value, width: aiPanelWidth.value }))
}
function toggleAiLayout() {
  // 小屏幕保持浮窗，防止右栏压缩地图至不可操作的宽度。
  if (!isDesktop.value) return
  aiLayout.value = aiLayout.value === 'docked' ? 'floating' : 'docked'
  persistAiLayout()
  void resizeMapAfterLayout()
}
function onAiResize(event: MouseEvent) {
  if (!aiResizing) return
  aiPanelWidth.value = Math.min(680, Math.max(380, Math.round(window.innerWidth - event.clientX)))
}
function stopAiResize() {
  if (!aiResizing) return
  aiResizing = false
  document.body.classList.remove('ai-panel-resizing')
  window.removeEventListener('mousemove', onAiResize)
  window.removeEventListener('mouseup', stopAiResize)
  persistAiLayout()
  void resizeMapAfterLayout()
}
function startAiResize() {
  if (aiLayout.value !== 'docked' || !isDesktop.value) return
  aiResizing = true
  document.body.classList.add('ai-panel-resizing')
  window.addEventListener('mousemove', onAiResize)
  window.addEventListener('mouseup', stopAiResize)
}
function clearAiConversation() {
  // 清空时同步中止未完成请求，避免旧响应在新会话中继续写入。
  stopAiResponse()
  activeAiRequest = undefined
  aiLoading.value = false
  aiQuestion.value = ''
  aiMessages.value = initialAiMessages()
  // 新会话使用新 ID，旧会话的短期筛选条件不会串入。
  aiConversationId = createAiConversationId()
}
async function askAi(question: string, intent?: AiShortcutIntent) {
  const text = question.trim()
  if (!text || aiLoading.value) return
  // 点击时固定目标，后续地图选中态变化不会改变本轮分析对象。
  const context = aiContext(Boolean(intent))
  if (intent) { context.intent = intent; if (['analyze_box', 'box_temperature', 'box_battery'].includes(intent)) context.targetBoxNo = context.selectedBoxNo }
  aiQuestion.value = ''
  aiMessages.value.push({ id: Date.now(), role: 'user', content: text })
  // 必须是 reactive：流式事件到来时才能立即刷新同一个气泡，而非停留在 loading 状态。
  const pending = reactive({ id: Date.now() + 1, role: 'assistant' as const, content: '', loading: true, progress: '' })
  aiMessages.value.push(pending)
  aiLoading.value = true
  const request = new AbortController()
  activeAiRequest = request
  await nextTick()
  aiMessagesRef.value?.scrollTo({ top: aiMessagesRef.value.scrollHeight, behavior: 'smooth' })
  try {
    Object.assign(pending, { loading: false, progress: '正在理解问题并选择数据工具…' })
    const reply = await queryBoxMapAssistantStream(text, context, aiConversationId, {
        onProgress: (progress) => { pending.progress = progress },
        onAnswerDelta: (delta) => { pending.progress = '正在流式生成回答…'; pending.content += delta },
      }, request.signal)
    Object.assign(pending, { loading: false, progress: '', content: '', reply })
  } catch (error) {
    if (request.signal.aborted) {
      Object.assign(pending, { loading: false, progress: pending.content ? '已停止生成，已保留当前内容。' : '已停止生成。' })
    } else {
      const message = error instanceof Error ? error.message : '生成失败，请重试。'
      Object.assign(pending, { loading: false, progress: message })
    }
  } finally {
    if (activeAiRequest === request) {
      activeAiRequest = undefined
      aiLoading.value = false
    }
    await nextTick()
    aiMessagesRef.value?.scrollTo({ top: aiMessagesRef.value.scrollHeight, behavior: 'smooth' })
  }
}
function stopAiResponse() {
  activeAiRequest?.abort()
}
function applyAiActions(actions: AiMapAction[]) {
  const focus = actions.find((action) => action.type === 'focusBox' && action.boxNo)
  if (actions.some((action) => action.type === 'showOverflow')) overflowOnly.value = true
  if (focus?.boxNo) {
    const box = boxes.value.find((item) => item.containerNo === focus.boxNo)
    if (box) selectBox(box)
  }
}
function focusAiBox(boxNo: string) {
  const box = boxes.value.find((item) => item.containerNo === boxNo)
  if (box) selectBox(box)
}

/** 「未匹配」箱体数量：乡镇=无乡镇归属；村庄=无村庄归属（跟随乡镇筛选级联，同 villageOptions） */
const unmatchedTownshipCount = computed(() => boxes.value.filter((b) => !boxAreas.get(b.id)?.township).length)
const unmatchedVillageCount = computed(() => boxes.value.filter((b) => {
  if (boxAreas.get(b.id)?.village) return false
  if (townshipFilter.value && townshipFilter.value !== UNMATCHED) return false
  return true
}).length)
function matchTownship(box: Box) {
  if (!townshipFilter.value) return true
  const township = boxAreas.get(box.id)?.township
  if (townshipFilter.value === UNMATCHED) return !township
  return township === townshipFilter.value
}
function matchVillage(box: Box) {
  if (!villageFilter.value) return true
  const village = boxAreas.get(box.id)?.village
  if (villageFilter.value === UNMATCHED) return !village
  return village === villageFilter.value
}

// 与临时指挥中心保持相同的温度、电量判定口径。
function isHighTemperature(box: Box) { return box.temperature >= 60 }
function isLowBattery(box: Box) { return box.voltage > 0 && box.voltage < 20 }

const visibleBoxes = computed(() => {
  const hidden = getHiddenBoxIds()
  return boxes.value.filter((box) => Number.isFinite(box.longitude) && Number.isFinite(box.latitude)
    && !hidden.has(box.id)
    && (!overflowOnly.value || box.overflowStatus === 1)
    && (!highTemperatureOnly.value || isHighTemperature(box))
    && (!offlineOnly.value || box.onlineStatus === 1)
    && (!lowBatteryOnly.value || isLowBattery(box))
    && (!transportingOnly.value || hasTransportTask(box))
    && matchTownship(box)
    && matchVillage(box))
})
const vehicleTypes = VEHICLE_TYPES
const vehicleTypeCounts = computed(() => {
  const counts = new Map<VehicleType, number>()
  for (const vehicle of vehicles.value) {
    const type = vehicleTypeById.value.get(vehicle.id)
    if (type) counts.set(type, (counts.get(type) || 0) + 1)
  }
  return counts
})
const visibleVehicles = computed(() => vehicles.value.filter((vehicle) => {
  const type = vehicleTypeById.value.get(vehicle.id)
  return Boolean(type && enabledVehicleTypes.value.includes(type)
    && Number.isFinite(Number(vehicle.longitude)) && Number.isFinite(Number(vehicle.latitude)))
}))
// 汇总卡片与地图保持同一筛选范围；橙色箱体沿用既有判定：非满溢且垃圾占比 >= 70%。
const overflowCount = computed(() => visibleBoxes.value.filter((box) => box.overflowStatus === 1).length)
const nearOverflowCount = computed(() => visibleBoxes.value.filter((box) => box.overflowStatus !== 1 && box.fillLevel >= 70).length)
const matchedBoxes = computed<Set<Box> | null>(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return null
  return new Set(boxes.value.filter((box) => box.containerNo.toLowerCase().includes(query) || box.containerName.toLowerCase().includes(query)))
})
const matchedVehicles = computed(() => {
  const query = keyword.value.trim().toUpperCase()
  if (!query) return []
  return vehicles.value.filter((vehicle) => {
    const type = vehicleTypeById.value.get(vehicle.id)
    return (type === '小勾臂车' || type === '大勾臂车')
      && vehicle.plateNumber?.trim().toUpperCase().includes(query)
      && Number.isFinite(Number(vehicle.longitude)) && Number.isFinite(Number(vehicle.latitude))
  })
})
function getLocateSuggestions() {
  const query = keyword.value.trim().toUpperCase()
  if (!query) return []
  const values = new Set([
    ...[...(matchedBoxes.value || [])].map(box => box.containerNo.trim()),
    ...matchedVehicles.value.map(vehicle => vehicle.plateNumber.trim()),
  ])
  return [...values].filter(Boolean).sort((a, b) => {
    const exact = Number(b.toUpperCase() === query) - Number(a.toUpperCase() === query)
    return exact || a.localeCompare(b, 'zh-CN', { numeric: true })
  })
}
const locateSuggestions = computed(getLocateSuggestions)
const selectedGcj = computed(() => selectedBox.value ? getGcjPoint(selectedBox.value) : undefined)
const createTaskTarget = ref<{ boxNo: string, pointId?: number, pointName: string, townshipName: string, villageName: string }>()
function openCreateTask() {
  const box = selectedBox.value
  if (!box) return
  const area = boxAreas.get(box.id)
  // 冻结打开弹窗时的箱体和始发地，后台刷新不改变正在配置的任务。
  createTaskTarget.value = { boxNo: box.containerNo, pointId: area?.pointId, pointName: area?.pointName || '', townshipName: area?.township || '', villageName: area?.village || '' }
}
const selectedArea = computed(() => selectedBox.value ? (boxAreas.get(selectedBox.value.id) || { township: '', village: '', pointName: '' }) : { township: '', village: '', pointName: '' })
const currentResidenceDuration = computed(() => {
  if (!currentResidence.value) return ''
  const arrival = parseBeijingDateTime(currentResidence.value.arrivalTime).getTime()
  return formatStayDuration(Math.floor((residenceNow.value - arrival) / 60_000))
})
const currentOverflowDuration = computed(() => {
  if (!currentOverflow.value?.overflowing) return '0分钟'
  if (!currentOverflow.value.overflowStartedAt) return '开始时间未知'
  const startedAt = parseBeijingDateTime(currentOverflow.value.overflowStartedAt).getTime()
  return formatStayDuration(Math.max(0, Math.floor((residenceNow.value - startedAt) / 60_000)))
})
const selectedTransportTask = computed(() => selectedBox.value ? transportTasksByBoxNo.value.get(normalizeBoxNo(selectedBox.value.containerNo)) : undefined)
const matchedObjects = computed<MatchedObject[]>(() => {
  if (!selectedBox.value?.matchObject) return []
  try {
    return Object.entries(JSON.parse(selectedBox.value.matchObject) as Record<string, { longitude?: number, latitude?: number }>)
      .map(([name, point]) => ({ name, ...point }))
  } catch { return [] }
})
const matchedVehiclePlates = computed(() => matchedObjects.value.filter((item) => isVehiclePlate(item.name)))

function toGcj(lng: number, lat: number): GcjPoint {
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return { lng, lat }
  const pi = Math.PI; const a = 6378245; const ee = 0.00669342162296594323
  const transformLat = (x: number, y: number) => -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(y * pi) + 40 * Math.sin(y / 3 * pi)) * 2 / 3 + (160 * Math.sin(y / 12 * pi) + 320 * Math.sin(y * pi / 30)) * 2 / 3
  const transformLng = (x: number, y: number) => 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3 + (20 * Math.sin(x * pi) + 40 * Math.sin(x / 3 * pi)) * 2 / 3 + (150 * Math.sin(x / 12 * pi) + 300 * Math.sin(x / 30 * pi)) * 2 / 3
  const dLat = transformLat(lng - 105, lat - 35); const dLng = transformLng(lng - 105, lat - 35)
  const radLat = lat / 180 * pi; const magic = 1 - ee * Math.sin(radLat) ** 2; const sqrtMagic = Math.sqrt(magic)
  return { lng: lng + dLng * 180 / (a / sqrtMagic * Math.cos(radLat) * pi), lat: lat + dLat * 180 / (a * (1 - ee) / (magic * sqrtMagic) * pi) }
}

function markerTone(box: Box) { return box.overflowStatus === 1 ? 'overflow' : box.fillLevel >= 70 ? 'warning' : '' }
function isNewBox(box: Box) { return box.overflowStatus !== 1 && newBoxIds.value.has(box.id) }
function markerClass(box: Box) {
  const classes = ['box-map-marker', markerTone(box)]
  if (isNewBox(box)) classes.push('new')
  if (hasTransportTask(box)) classes.push('transporting')
  if (box === selectedBox.value) classes.push('selected')
  if (matchedBoxes.value?.has(box)) classes.push('matched')
  return classes.filter(Boolean).join(' ')
}
async function loadNewBoxIds() {
  // “新”角标为增强信息；独立请求失败时保留当前角标，不干扰箱体地图主数据。
  if (newBoxIdsLoading) return
  newBoxIdsLoading = true
  try {
    const response = await collectorDaasFetch('/api/collector/box-map/new-box-ids', { timeoutMs: 10000, maxAttempts: 1 })
    const result = await response.json() as { newBoxIds?: unknown }
    if (!Array.isArray(result.newBoxIds)) return
    newBoxIds.value = new Set(result.newBoxIds.map(Number).filter(Number.isSafeInteger))
    drawMarkers(false)
  } catch { /* 角标服务异常不影响地图主流程。 */ }
  finally { newBoxIdsLoading = false }
}
function normalizeBoxNo(value: unknown) { return String(value ?? '').trim() }
function taskStatus(task: TransportTask) { return String(task.status ?? task.taskStatus ?? task.statusName ?? task.taskStatusName ?? '').trim() }
function transportTaskStatusText(task: TransportTask) {
  const labels: Record<string, string> = {
    pending: '待接单', accepted: '已接单', collecting: '运输中', transporting: '运输中',
    completed: '已完成', finished: '已完成', cancelled: '已取消', canceled: '已取消',
  }
  const status = taskStatus(task)
  return labels[status.toLowerCase()] || (/\p{Script=Han}/u.test(status) ? status : '状态未知')
}
function taskTimestamp(task: TransportTask) {
  const value = task.createTime ?? task.startTime ?? task.taskTime ?? task.updateTime
  const timestamp = typeof value === 'string' ? parseBeijingDateTime(value).getTime() : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}
function hasTransportTask(box: Box) { return transportTasksByBoxNo.value.has(normalizeBoxNo(box.containerNo)) }
function transportTaskValue(task: TransportTask, ...keys: string[]) {
  const value = keys.map((key) => task[key]).find((item) => item !== undefined && item !== null && item !== '')
  return value === undefined ? '-' : String(value)
}
function indexTransportTasks(tasks: TransportTask[]) {
  const indexed = new Map<string, TransportTask>()
  for (const task of tasks) {
    const boxNo = normalizeBoxNo(task.boxNo ?? task.containerNo)
    if (!boxNo || !TRANSPORTING_STATUSES.has(taskStatus(task))) continue
    const current = indexed.get(boxNo)
    if (!current || taskTimestamp(task) > taskTimestamp(current)) indexed.set(boxNo, task)
  }
  transportTasksByBoxNo.value = indexed
}
function getGcjPoint(box: Box) {
  const cached = gcjPoints.get(box)
  if (cached) return cached
  const point = toGcj(box.longitude, box.latitude)
  gcjPoints.set(box, point)
  return point
}
function toTrackGcj(point: HistoryTrackPoint): GcjPoint { return toGcj(Number(point.longitude), Number(point.latitude)) }
function formatTrackTime(value: string) { return value ? value.replace('T', ' ').slice(5, 16) : '-' }
function formatStayDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.floor(Number(totalMinutes) || 0))
  const days = Math.floor(minutes / 1440), hours = Math.floor((minutes % 1440) / 60), remaining = minutes % 60
  if (days > 0) return `${days} 天 ${hours} 小时 ${remaining} 分钟`
  if (hours > 0) return `${hours} 小时 ${remaining} 分钟`
  return `${remaining} 分钟`
}
function historyContent(label: string, tone: string) { return `<div class="history-track-pin ${tone}">${escapeHtml(label)}</div>` }
function clearHistoryOverlays() { historyOverlays.forEach((overlay) => overlay.setMap(null)); historyOverlays = [] }
function destroyHistoryMap() { clearHistoryOverlays(); historyMap?.destroy(); historyMap = undefined }
async function openHistoryTrack(days: BoxHistoryDays = 2) {
  if (!selectedBox.value) return
  metricHistoryTarget.value = undefined
  historyRange.value = days
  historyVisible.value = true
  await nextTick()
  await loadHistoryTrack()
}
function closeHistoryTrack() {
  historyRequestVersion++
  historyAbort?.abort()
  historyAbort = undefined
  historyVisible.value = false
  historyLoading.value = false
  historyData.value = undefined
  historyError.value = ''
  destroyHistoryMap()
}
async function loadHistoryTrack() {
  const box = selectedBox.value
  if (!box || !historyVisible.value) return
  const version = ++historyRequestVersion
  historyAbort?.abort()
  const abort = new AbortController()
  historyAbort = abort
  const timeout = window.setTimeout(() => abort.abort(), 25000)
  destroyHistoryMap()
  historyLoading.value = true
  historyError.value = ''
  historyData.value = undefined
  try {
    const end = new Date()
    const start = new Date(end.getTime() - historyRange.value * 24 * 60 * 60 * 1000)
    const query = new URLSearchParams({ from: beijingDateTime(start), to: beijingDateTime(end) })
    const response = await fetch(`${COLLECTOR_API_BASE_URL}/api/collector/boxes/${box.id}/history-track?${query}`, { signal: abort.signal })
    if (!response.ok) throw new Error(`请求失败（${response.status}）`)
    const result = await response.json() as HistoryTrackResponse
    if (!Array.isArray(result.track) || !Array.isArray(result.pointVisits) || !result.summary) throw new Error('历史数据格式不正确')
    if (version !== historyRequestVersion || !historyVisible.value) return
    historyData.value = result
    historyLoading.value = false
    await nextTick()
    if (version === historyRequestVersion && historyVisible.value) await renderHistoryTrack()
  } catch (error) {
    if (version !== historyRequestVersion) return
    historyData.value = undefined
    historyError.value = abort.signal.aborted ? '请求超时，请重试' : error instanceof Error ? error.message : '网络异常，请重试'
  } finally {
    window.clearTimeout(timeout)
    if (version === historyRequestVersion) historyLoading.value = false
  }
}
async function renderHistoryTrack() {
  if (!historyMapRef.value || !historyData.value) return
  const historyAmap = amap || await loadAmapJsApi()
  if (!historyVisible.value || !historyMapRef.value || !historyData.value) return
  if (!historyMap) historyMap = new historyAmap.Map(historyMapRef.value, { zoom: 13, center: [114.1, 36.04], viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true })
  clearHistoryOverlays()
  const points = historyData.value.track.filter((point) => Number.isFinite(Number(point.longitude)) && Number.isFinite(Number(point.latitude)))
  const segments: GcjPoint[][] = []; let segment: GcjPoint[] = []; let previousTime = 0
  for (const point of points) {
    const timestamp = parseBeijingDateTime(point.time).getTime()
    if (segment.length && timestamp - previousTime > 30 * 60 * 1000) { segments.push(segment); segment = [] }
    segment.push(toTrackGcj(point)); previousTime = timestamp
  }
  if (segment.length) segments.push(segment)
  for (const path of segments.filter((item) => item.length > 1)) {
    const polyline = new historyAmap.Polyline({ path: path.map((point) => [point.lng, point.lat]), strokeColor: '#165dff', strokeWeight: 5, strokeOpacity: 0.86, zIndex: 20 })
    polyline.setMap(historyMap); historyOverlays.push(polyline)
  }
  if (points.length) {
    const start = toTrackGcj(points[0]); const end = toTrackGcj(points[points.length - 1])
    const startMarker = new historyAmap.Marker({ position: [start.lng, start.lat], content: historyContent('起', 'start'), offset: new historyAmap.Pixel(-14, -28), zIndex: 40 })
    const endMarker = new historyAmap.Marker({ position: [end.lng, end.lat], content: historyContent('终', 'end'), offset: new historyAmap.Pixel(-14, -28), zIndex: 40 })
    startMarker.setMap(historyMap); endMarker.setMap(historyMap); historyOverlays.push(startMarker, endMarker)
  }
  historyData.value.pointVisits.forEach((visit, index) => {
    const point = points.find((item) => item.pointId === visit.pointId && item.time >= visit.arrivalTime && item.time <= visit.departureTime)
    if (!point) return
    const position = toTrackGcj(point); const marker = new historyAmap.Marker({ position: [position.lng, position.lat], content: historyContent(String(index + 1), 'visit'), offset: new historyAmap.Pixel(-14, -28), zIndex: 35 })
    marker.setMap(historyMap); marker.on('click', () => focusHistoryVisit(visit)); historyOverlays.push(marker)
  })
  const markerOverlays = historyOverlays.filter((overlay): overlay is AMapMarker => 'on' in overlay)
  if (markerOverlays.length) historyMap.setFitView(markerOverlays, true, [60, 60, 60, 60])
}
function focusHistoryVisit(visit: HistoryPointVisit) {
  const point = historyData.value?.track.find((item) => item.pointId === visit.pointId && item.time >= visit.arrivalTime && item.time <= visit.departureTime)
  if (!point || !historyMap) return
  const position = toTrackGcj(point)
  historyMap.setZoomAndCenter(17, [position.lng, position.lat])
}
function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

const BOX_LABEL_ZOOM = 11
type MassBoxPoint = { lnglat: [number, number], style: number, box: Box }
function massPointStyle(box: Box) { return box.overflowStatus === 1 ? 2 : box.fillLevel >= 70 ? 1 : 0 }
function makeMassPointIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
function createMassPointStyles() {
  return [
    { url: makeMassPointIcon('#165dff'), anchor: new amap!.Pixel(7, 7), size: new amap!.Size(14, 14), zIndex: 10 },
    { url: makeMassPointIcon('#ff7d00'), anchor: new amap!.Pixel(7, 7), size: new amap!.Size(14, 14), zIndex: 20 },
    { url: makeMassPointIcon('#f53f3f'), anchor: new amap!.Pixel(7, 7), size: new amap!.Size(14, 14), zIndex: 30 },
  ]
}
function shouldShowBoxLabels() { return (map?.getZoom() ?? 0) >= BOX_LABEL_ZOOM }
function clearBoxOverlays() {
  massMarks?.setMap(null); massMarks = undefined
  selectedMassMarker?.setMap(null); selectedMassMarker = undefined
  markers.forEach((marker) => marker.setMap(null)); markers = []
}
function vehicleTypeClass(type: VehicleType) {
  return type === '小勾臂车' ? 'hook' : type === '大勾臂车' ? 'large' : 'tricycle'
}
function vehicleTypeOf(vehicle: VehicleRuntime) { return vehicleTypeById.value.get(vehicle.id) }
function vehicleStatus(vehicle: VehicleRuntime): VehicleStatus {
  // DAAS 的 chargingState=1 表示充电，充电状态优先于在线状态展示。
  if (Number(vehicle.chargingState) === 1) return 'charging'
  return Number(vehicle.onlineState) === 1 ? 'online' : 'offline'
}
function vehicleStatusText(vehicle: VehicleRuntime) {
  const status = vehicleStatus(vehicle)
  return status === 'charging' ? '充电' : status === 'online' ? '在线' : '离线'
}
function vehiclePoint(vehicle: VehicleRuntime): GcjPoint {
  return toGcj(Number(vehicle.longitude), Number(vehicle.latitude))
}
function vehicleCoordinateKey(vehicle: VehicleRuntime) {
  return `${Number(vehicle.longitude).toFixed(6)},${Number(vehicle.latitude).toFixed(6)}`
}
function vehicleInfoKey(vehicle: VehicleRuntime) {
  return `${vehicle.id}:${vehicleCoordinateKey(vehicle)}`
}
const AMAP_REVERSE_URL = 'https://restapi.amap.com/v3/geocode/regeo'
function getAmapKey() {
  return import.meta.env.VITE_AMAP_JS_KEY || import.meta.env.VITE_AMAP_KEY || ''
}
async function reverseGeocode(lng: number, lat: number): Promise<string | undefined> {
  const key = getAmapKey()
  if (!key) return undefined
  try {
    const url = `${AMAP_REVERSE_URL}?key=${encodeURIComponent(key)}&location=${lng.toFixed(6)},${lat.toFixed(6)}&extensions=all`
    const response = await fetch(url)
    if (!response.ok) return undefined
    const data = await response.json() as { status?: string, regeocode?: { formatted_address?: string } }
    return data.status === '1' ? data.regeocode?.formatted_address : undefined
  } catch { return undefined }
}
function clearVehicleOverlays() {
  selectedVehicleMarker = undefined; resetSelectedVehicleMarker = undefined
  vehicleMarkers.forEach((marker) => marker.setMap(null)); vehicleMarkers = []
  tricycleCluster?.setMap(null); tricycleCluster = undefined
}
function vehicleMarkerContent(vehicle: VehicleRuntime, selected = false) {
  const type = vehicleTypeOf(vehicle)
  return `<div class="vehicle-map-marker ${vehicleTypeClass(type || '小三轮')} ${vehicleStatus(vehicle)}${selected ? ' selected' : ''}"><i></i><span>${escapeHtml(vehicle.plateNumber || String(vehicle.id))}</span></div>`
}
function tricycleMarkerContent(vehicle: VehicleRuntime, selected = false) {
  return `<div class="vehicle-map-marker tricycle compact ${vehicleStatus(vehicle)}${selected ? ' selected' : ''}"><i></i><svg width="22" height="22" viewBox="0 0 40 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7" cy="25" r="2.7"/><circle cx="26" cy="25" r="2.7"/><circle cx="33" cy="25" r="2.7"/><path d="M7 22h27M4 22l2-11q.5-3 4-3h7l2 14M9 9l5 13M17 10h18l-2 12H18zM18 8h17l1 2H17zM20 14h12M4 15h5"/></svg></div>`
}
function focusVehicleMarker(marker: AMapMarker, normalContent: string, selectedContent: string, normalZIndex = 300) {
  // 与选中的箱体一致，将刚点击的车辆提高到其它地图覆盖物之上。
  if (selectedVehicleMarker !== marker) resetSelectedVehicleMarker?.()
  marker.setContent(selectedContent)
  marker.setzIndex(VEHICLE_FOCUSED_Z_INDEX)
  selectedVehicleMarker = marker
  resetSelectedVehicleMarker = () => {
    marker.setContent(normalContent)
    marker.setzIndex(normalZIndex)
  }
}
function clusterMarkerContent(count: number) {
  return `<div class="vehicle-cluster-marker">${count}</div>`
}
type VehicleBasicInfo = Record<string, unknown>
function vehicleTasks(vehicle: VehicleRuntime) {
  const plate = String(vehicle.plateNumber || '').trim().toUpperCase()
  const today = beijingDate()
  return todayTransportTasks.value.filter((task) => {
    if (typeof task.createTime !== 'string') return false
    const createdAt = parseBeijingDateTime(task.createTime)
    if (!Number.isFinite(createdAt.getTime()) || beijingDate(createdAt) !== today) return false
    const taskPlate = transportTaskValue(task, 'plateNum', 'vehicleNo', 'vehiclePlate', 'plateNo', 'vehicleNumber', 'carNo').trim().toUpperCase()
    if (plate && taskPlate !== '-') return taskPlate === plate
    const taskId = Number(task.vehicleId ?? task.carId)
    return Number.isSafeInteger(taskId) && taskId > 0 && taskId === vehicle.id
  }).sort((a, b) => taskTimestamp(b) - taskTimestamp(a))
}
function vehicleDriverName(vehicle: VehicleRuntime, info?: VehicleBasicInfo) {
  const data = info?.data as { content?: Array<{ vehicleId?: number, plateNum?: string, driverName?: string }> } | undefined
  const plate = vehicle.plateNumber.trim().toUpperCase()
  const record = data?.content?.find((item) => item.plateNum?.trim().toUpperCase() === plate || item.vehicleId === vehicle.id)
  if (record?.driverName?.trim()) return record.driverName.trim()
  // 今日运单按时间倒序排列，档案缺失时使用最近一单的驾驶员。
  for (const task of vehicleTasks(vehicle)) {
    const name = transportTaskValue(task, 'driverName', 'driverRealName', 'driver').trim()
    if (name && name !== '-') return name
  }
  return ''
}
const selectedVehicleId = ref<number>()
const selectedVehicle = computed(() => visibleVehicles.value.find(vehicle => vehicle.id === selectedVehicleId.value))
const selectedVehicleLocation = ref('')
const selectedVehicleBasicInfo = shallowRef<VehicleBasicInfo>()
const vehicleDriverState = ref<'loading' | 'ready' | 'error'>('ready')
const selectedVehicleDriver = computed(() => selectedVehicle.value ? vehicleDriverName(selectedVehicle.value, selectedVehicleBasicInfo.value) : '')
const selectedVehicleTasks = computed(() => selectedVehicle.value ? vehicleTasks(selectedVehicle.value) : [])
const vehicleTasksExpanded = ref(false)
function vehicleTaskOrigin(task: TransportTask) {
  return transportTaskValue(task, 'originCollectionPointName', 'originTransferStationName', 'originPointName', 'startPointName', 'startAddress', 'originName', 'sourceName')
}
function vehicleTaskDestination(task: TransportTask) {
  return transportTaskValue(task, 'destinationPlantName', 'destinationTransferStationName', 'destinationPointName', 'destinationName', 'endPointName', 'destination', 'targetName')
}
function closeVehicleInfo() {
  selectedVehicleId.value = undefined
  activeVehicleInfoKey = ''
  selectedVehicleBasicInfo.value = undefined
  vehicleDriverState.value = 'ready'
  resetSelectedVehicleMarker?.()
  selectedVehicleMarker = undefined
  resetSelectedVehicleMarker = undefined
}
function loadSelectedVehicleDetails(vehicle: VehicleRuntime) {
  const infoKey = vehicleInfoKey(vehicle)
  activeVehicleInfoKey = infoKey
  const cached = vehicleAddressCache.get(vehicle.id)
  selectedVehicleLocation.value = cached?.coordinate === vehicleCoordinateKey(vehicle) ? cached.address : '位置解析中…'
  vehicleDriverState.value = 'loading'
  void collectorVehicleBasicInfoRequest<VehicleBasicInfo>(vehicle.plateNumber).then((response) => {
    if (activeVehicleInfoKey !== infoKey) return
    selectedVehicleBasicInfo.value = response
    vehicleDriverState.value = 'ready'
  }).catch(() => {
    if (activeVehicleInfoKey === infoKey) vehicleDriverState.value = 'error'
  })
  if (selectedVehicleLocation.value !== '位置解析中…') return
  const point = vehiclePoint(vehicle)
  void reverseGeocode(point.lng, point.lat).then((address) => {
    const location = address || '位置暂未获取'
    vehicleAddressCache.set(vehicle.id, { coordinate: vehicleCoordinateKey(vehicle), address: location })
    if (activeVehicleInfoKey === infoKey) selectedVehicleLocation.value = location
  })
}
function openVehicleInfo(vehicle: VehicleRuntime) {
  if (historyVisible.value) closeHistoryTrack()
  if (selectedBox.value) {
    selectedBox.value = undefined
    drawMarkers(false)
  }
  const changed = selectedVehicleId.value !== vehicle.id
  selectedVehicleId.value = vehicle.id
  if (changed) {
    selectedVehicleBasicInfo.value = undefined
    vehicleTasksExpanded.value = false
  }
  if (changed || activeVehicleInfoKey !== vehicleInfoKey(vehicle) || vehicleDriverState.value === 'error') loadSelectedVehicleDetails(vehicle)
  // 与箱体详情一致，将当前车辆放到地图中心，避免右侧面板遮挡。
  const point = vehiclePoint(vehicle)
  map?.setZoomAndCenter(Math.max(map.getZoom(), 16), [point.lng, point.lat])
}
watch(selectedVehicle, (vehicle) => {
  if (!vehicle) { closeVehicleInfo(); return }
  if (activeVehicleInfoKey !== vehicleInfoKey(vehicle)) loadSelectedVehicleDetails(vehicle)
})
function drawVehicleMarkers() {
  if (!map || !amap || !amap.MarkerCluster) return
  clearVehicleOverlays()
  // 车辆接口返回 WGS84 坐标，高德底图使用 GCJ-02。
  const hookAndLargeVehicles = visibleVehicles.value.filter((vehicle) => vehicleTypeOf(vehicle) !== '小三轮')
  const tricycles = visibleVehicles.value.filter((vehicle) => vehicleTypeOf(vehicle) === '小三轮')
  vehicleMarkers = hookAndLargeVehicles.map((vehicle, index) => {
    const point = vehiclePoint(vehicle)
    const marker = new amap!.Marker({
      position: [point.lng, point.lat],
      offset: new amap!.Pixel(-28, -28),
      content: vehicleMarkerContent(vehicle),
      title: `${vehicle.plateNumber || vehicle.id} · ${vehicleTypeOf(vehicle) || '未分类'} · ${vehicleStatusText(vehicle)}`,
      zIndex: 300 + index,
    })
    marker.on('click', () => {
      focusVehicleMarker(marker, vehicleMarkerContent(vehicle), vehicleMarkerContent(vehicle, true), 300 + index)
      openVehicleInfo(vehicle)
    })
    marker.setMap(map!)
    if (selectedVehicleId.value === vehicle.id) focusVehicleMarker(marker, vehicleMarkerContent(vehicle), vehicleMarkerContent(vehicle, true), 300 + index)
    return marker
  })
  const tricyclePoints: TricycleClusterPoint[] = tricycles.map((vehicle) => {
    const point = vehiclePoint(vehicle)
    return { lnglat: [point.lng, point.lat], vehicle }
  })
  if (tricyclePoints.length) {
    // 聚合插件会复用 Marker；每个 Marker 只绑定一次，并始终读取本轮车辆。
    const markerVehicles = new WeakMap<AMapMarker, VehicleRuntime | undefined>()
    const boundMarkers = new WeakSet<AMapMarker>()
    const bindMarkerClick = (marker: AMapMarker) => {
      if (boundMarkers.has(marker)) return
      boundMarkers.add(marker)
      marker.on('click', () => {
        const vehicle = markerVehicles.get(marker)
        if (vehicle) {
          focusVehicleMarker(marker, tricycleMarkerContent(vehicle), tricycleMarkerContent(vehicle, true))
          openVehicleInfo(vehicle)
          return
        }
        // 数字聚合点：以当前标记的位置为中心，放大至停止聚合的级别。
        const position = marker.getPosition()
        map?.setZoomAndCenter(Math.max(map.getZoom(), 17), [position.getLng(), position.getLat()])
      })
    }
    tricycleCluster = new amap.MarkerCluster(map, tricyclePoints, {
      gridSize: 80,
      maxZoom: 16,
      averageCenter: true,
      renderClusterMarker: (context: { count: number, marker: AMapMarker }) => {
        markerVehicles.delete(context.marker)
        if (selectedVehicleMarker === context.marker) {
          selectedVehicleMarker = undefined
          resetSelectedVehicleMarker = undefined
        }
        context.marker.setOffset(new amap!.Pixel(-22, -22))
        context.marker.setzIndex(300)
        context.marker.setContent(clusterMarkerContent(context.count))
        bindMarkerClick(context.marker)
      },
      renderMarker: (context: { marker: AMapMarker, data?: TricycleClusterPoint | TricycleClusterPoint[] }) => {
        // 聚合插件复用标记时，不能用旧车辆的回调恢复新标记内容。
        if (selectedVehicleMarker === context.marker) {
          selectedVehicleMarker = undefined
          resetSelectedVehicleMarker = undefined
        }
        const point = Array.isArray(context.data) ? context.data[0] : context.data
        markerVehicles.set(context.marker, point?.vehicle)
        context.marker.setOffset(new amap!.Pixel(-18, -18))
        if (point?.vehicle) {
          const vehicle = point.vehicle
          context.marker.setContent(tricycleMarkerContent(vehicle))
          context.marker.setzIndex(300)
          if (selectedVehicleId.value === vehicle.id) focusVehicleMarker(context.marker, tricycleMarkerContent(vehicle), tricycleMarkerContent(vehicle, true))
        }
        bindMarkerClick(context.marker)
      },
    })
  }
}
function createBoxMarker(box: Box, index: number, selected = false) {
  const point = getGcjPoint(box)
  const newBadge = isNewBox(box) ? '<span class="box-marker-new-badge">新</span>' : ''
  const marker = new amap!.Marker({ position: [point.lng, point.lat], offset: new amap!.Pixel(-18, -34), content: `<div class="${markerClass(box)}${selected ? ' selected' : ''}">${escapeHtml(box.containerNo)}${newBadge}</div>`, title: box.containerName, zIndex: selected ? 1000 : 10 + index })
  marker.on('click', () => selectBox(box))
  marker.setMap(map!)
  return marker
}
function drawMarkers(fit = true) {
  if (!map || !amap) return
  clearBoxOverlays()
  const showLabels = shouldShowBoxLabels()
  markerMode = showLabels ? 'label' : 'mass'
  if (showLabels) {
    markers = visibleBoxes.value.map((box, index) => createBoxMarker(box, index))
  } else {
    const points: MassBoxPoint[] = visibleBoxes.value.map((box) => {
      const point = getGcjPoint(box)
      return { lnglat: [point.lng, point.lat], style: massPointStyle(box), box }
    })
    massMarks = new amap.MassMarks(points, { opacity: 1, zIndex: 110, cursor: 'pointer', style: createMassPointStyles() })
    massMarks.on('click', (event) => {
      const point = event.data as MassBoxPoint
      if (point?.box) selectBox(point.box)
    })
    massMarks.setMap(map)
    // Canvas 点位下只保留一个普通 Marker 给已选箱体显示箱号，避免恢复全量 DOM。
    if (selectedBox.value && visibleBoxes.value.includes(selectedBox.value)) selectedMassMarker = createBoxMarker(selectedBox.value, 0, true)
  }
  if (fit && markers.length) map.setFitView(markers, false, [60, 60, 60, 360])
  // 辅助数据晚返回或状态变化时保留正在查看的详情；主动筛选和隐藏操作仍可关闭。
  if (selectedBox.value && (getHiddenBoxIds().has(selectedBox.value.id)
    || (fit && !visibleBoxes.value.includes(selectedBox.value)))) selectedBox.value = undefined
}

function syncMarkerMode() {
  const nextMode = shouldShowBoxLabels() ? 'label' : 'mass'
  if (nextMode !== markerMode) drawMarkers(false)
}

function selectBox(box: Box) {
  closeVehicleInfo()
  const requestVersion = ++residenceRequestVersion
  selectedBox.value = box
  currentResidence.value = undefined
  currentOverflow.value = undefined
  residenceLoading.value = false
  residenceError.value = false
  overflowLoading.value = false
  overflowError.value = false
  drawMarkers(false)
  const point = getGcjPoint(box)
  if (map) map.setZoomAndCenter(Math.max(map.getZoom(), 16), [point.lng, point.lat])
  void loadCurrentResidence(box, requestVersion)
  if (box.overflowStatus === 1) void loadCurrentOverflow(box, requestVersion)
}
function hasMatchedArea(box: Box) {
  const area = boxAreas.get(box.id)
  return Boolean(area?.township && area.village && area.pointName)
}
async function loadCurrentResidence(box: Box, requestVersion: number) {
  // 仅由用户点击箱体触发；页面加载、手动刷新和定时刷新均不会调用此接口。
  if (!hasMatchedArea(box)) return
  const area = boxAreas.get(box.id)!
  const cacheKey = `${box.id}:${area.pointName}`
  const cached = residenceCache.get(cacheKey)
  if (cached) { if (requestVersion === residenceRequestVersion) currentResidence.value = cached; return }
  residenceLoading.value = true
  residenceError.value = false
  try {
    const response = await collectorDaasFetch(`/api/collector/boxes/${box.id}/current-residence`, { timeoutMs: 10000, maxAttempts: 1 })
    const residence = await response.json() as CurrentResidence
    residenceCache.set(cacheKey, residence)
    if (requestVersion === residenceRequestVersion && selectedBox.value?.id === box.id) currentResidence.value = residence
  } catch {
    if (requestVersion === residenceRequestVersion) residenceError.value = true
  } finally {
    if (requestVersion === residenceRequestVersion) residenceLoading.value = false
  }
}
async function loadCurrentOverflow(box: Box, requestVersion: number) {
  overflowLoading.value = true
  overflowError.value = false
  try {
    const response = await collectorDaasFetch(`/api/collector/boxes/${box.id}/current-overflow-duration`, { timeoutMs: 10000, maxAttempts: 1 })
    const overflow = await response.json() as CurrentOverflow
    if (requestVersion === residenceRequestVersion && selectedBox.value?.id === box.id) currentOverflow.value = overflow
  } catch {
    if (requestVersion === residenceRequestVersion) overflowError.value = true
  } finally {
    if (requestVersion === residenceRequestVersion) overflowLoading.value = false
  }
}
/** 箱体列表刷新会产生新对象；按稳定的箱体 ID 延续详情选中态，避免异步刷新造成卡片闪退。 */
function syncSelectedBox(nextBoxes: Box[]) {
  const selected = selectedBox.value
  if (!selected) return
  const replacement = nextBoxes.find((box) => box.id === selected.id)
  selectedBox.value = replacement
  if (!replacement || !hasMatchedArea(replacement)) currentResidence.value = undefined
  if (!replacement) currentOverflow.value = undefined
  if (!replacement && historyVisible.value) closeHistoryTrack()
}
async function onLocateSelect(value: string) {
  // AutoComplete 的 select 先于 v-model 更新触发，先同步输入再定位。
  keyword.value = value
  await nextTick()
  await focusMatchedTarget()
}
async function onLocateEnter(event: KeyboardEvent) {
  if (event.isComposing) return
  // 下拉会处理回车选中项并 preventDefault；等事件结束，避免重复定位。
  await nextTick()
  if (!event.defaultPrevented) await focusMatchedTarget(event)
}
async function focusMatchedTarget(event?: KeyboardEvent) {
  if (event?.isComposing) return
  const boxes = [...(matchedBoxes.value || [])]
  const vehicles = matchedVehicles.value
  const query = keyword.value.trim().toUpperCase()
  if (!query) return
  const exactBoxes = boxes.filter((box) => box.containerNo.trim().toUpperCase() === query)
  const exactVehicles = vehicles.filter((vehicle) => vehicle.plateNumber.trim().toUpperCase() === query)
  const exactCount = exactBoxes.length + exactVehicles.length
  const targetBox = exactCount === 1 ? exactBoxes[0] : boxes.length + vehicles.length === 1 ? boxes[0] : undefined
  const targetVehicle = exactCount === 1 ? exactVehicles[0] : boxes.length + vehicles.length === 1 ? vehicles[0] : undefined
  if (targetBox) {
    if (!Number.isFinite(targetBox.longitude) || !Number.isFinite(targetBox.latitude)) {
      Message.info('该箱体暂无有效定位')
      return
    }
    if (getHiddenBoxIds().has(targetBox.id)) {
      Message.info('该箱体已被隐藏，请先在数据隐藏配置中取消隐藏')
      return
    }
    // 全局定位只解除与目标冲突的条件，保留仍然符合目标的筛选。
    const changed: string[] = []
    if (!matchTownship(targetBox)) {
      townshipFilter.value = ''
      villageFilter.value = ''
      changed.push('区域')
    } else if (!matchVillage(targetBox)) {
      villageFilter.value = ''
      changed.push('村庄')
    }
    if (overflowOnly.value && targetBox.overflowStatus !== 1) {
      overflowOnly.value = false
      changed.push('满溢')
    }
    if (highTemperatureOnly.value && !isHighTemperature(targetBox)) {
      highTemperatureOnly.value = false
      changed.push('高温')
    }
    if (offlineOnly.value && targetBox.onlineStatus !== 1) {
      offlineOnly.value = false
      changed.push('离线')
    }
    if (lowBatteryOnly.value && !isLowBattery(targetBox)) {
      lowBatteryOnly.value = false
      changed.push('低电量')
    }
    if (transportingOnly.value && !hasTransportTask(targetBox)) {
      transportingOnly.value = false
      changed.push('收运中')
    }
    // 等筛选 watcher 重绘完成后再定位，避免 fitView 覆盖目标的中心和缩放。
    await nextTick()
    selectBox(targetBox)
    if (changed.length) Message.info(`已解除${changed.join('、')}筛选，定位到${targetBox.containerNo}号箱`)
    return
  }
  if (!targetVehicle) {
    Message.info(boxes.length + vehicles.length ? '匹配到多个目标，请输入更完整的箱号或车牌号' : '未找到匹配的箱体或勾臂车')
    return
  }
  const type = vehicleTypeOf(targetVehicle)
  if (type && !enabledVehicleTypes.value.includes(type)) {
    enabledVehicleTypes.value = [...enabledVehicleTypes.value, type]
    await nextTick()
  }
  selectedBox.value = undefined
  drawMarkers(false)
  const point = vehiclePoint(targetVehicle)
  map?.setZoomAndCenter(Math.max(map.getZoom(), 16), [point.lng, point.lat])
  openVehicleInfo(targetVehicle)
  drawVehicleMarkers()
}
function statusText(box: Box) { return box.overflowStatus === 1 ? '满溢' : box.fillLevel >= 70 ? '接近满溢' : '正常' }
function statusColor(box: Box) { return box.overflowStatus === 1 ? 'red' : box.fillLevel >= 70 ? 'orange' : 'green' }
function fillLevelPercent(box: Box) { return Math.min(100, Math.max(0, box.fillLevel)) }
function formatFillLevel(box: Box) { return Math.round(box.fillLevel) }
function locationUrl() {
  const box = selectedBox.value
  if (!box) return ''
  const point = getGcjPoint(box)
  return `https://uri.amap.com/marker?position=${point.lng.toFixed(6)},${point.lat.toFixed(6)}&name=${encodeURIComponent(box.containerName)}&coordinate=gaode&callnative=1`
}
async function copyLocationLink() {
  const url = locationUrl(); if (!url) return
  try { await navigator.clipboard.writeText(url); Message.success('高德定位链接已复制') } catch { window.prompt('复制此链接发送给客户：', url) }
}
function openAmap() { const url = locationUrl(); if (url) window.open(url, '_blank', 'noopener') }
function importBoxes() {
  try {
    const list = JSON.parse(importText.value)?.data?.list
    if (!Array.isArray(list)) throw new Error()
    boxes.value = list as Box[]; gcjPoints = new WeakMap<Box, GcjPoint>(); selectedBox.value = undefined; importText.value = ''
    if (points.value.length) assignBoxAreas(boxes.value, points.value)
    Message.success(`已导入 ${list.length} 个箱体`)
    return true
  } catch { Message.error('JSON 格式不正确：需要包含 data.list 数组'); return false }
}

watch(keyword, () => drawMarkers(false))
watch([overflowOnly, highTemperatureOnly, offlineOnly, lowBatteryOnly, transportingOnly, townshipFilter, villageFilter], () => drawMarkers())
// 刷新箱体列表时仅重绘标记，保留用户当前的中心点和缩放比例。
watch([boxes, points, transportTasksByBoxNo, () => [...getHiddenBoxIds()]], () => drawMarkers(false))
watch([vehicles, enabledVehicleTypes, vehicleTypeById], () => drawVehicleMarkers(), { deep: true })
watch(mapTheme, (theme) => map?.setMapStyle(`amap://styles/${theme}`))
watch(aiLayout, () => { void resizeMapAfterLayout() })
async function loadFromCloud(silent = false) {
  // 手动刷新与定时刷新重叠时复用正在进行的请求，避免短时间重复请求。
  if (cloudLoading.value) return
  cloudLoading.value = true
  // 收集点和运单独立补齐；主按钮只等待实时箱体。
  void loadCollectionPoints(silent)
  void loadTransportTasks(silent)
  void loadNewBoxIds()
  try {
    const boxList = await collectorMapBoxesRequest<Box[]>()
    if (!Array.isArray(boxList)) throw new Error('箱体数据格式不正确')
    // 先分配箱体归属，再赋值 boxes（避免渲染时 boxAreas 为空导致筛选选项缓存为空）
    assignBoxAreas(boxList, points.value)
    residenceCache.clear()
    boxes.value = boxList
    gcjPoints = new WeakMap<Box, GcjPoint>()
    syncSelectedBox(boxList)
    saveCachedBoxes(boxList)
    if (!silent) Message.success(`已从云端更新 ${boxList.length} 个箱体`)
  } catch (error) {
    if (!silent) Message.warning(`云端数据加载失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { cloudLoading.value = false }
}

async function loadCollectionPoints(silent = false) {
  if (pointsLoading.value || (pointsLoadedAt > 0 && Date.now() - pointsLoadedAt < 5 * 60_000)) return
  pointsLoading.value = true
  pointsError.value = false
  try {
    const pointList = await collectorMapPointsRequest<CollectionPoint[]>()
    if (!Array.isArray(pointList)) throw new Error('收集点数据格式不正确')
    points.value = pointList
    assignBoxAreas(boxes.value, pointList)
    pointsLoadedAt = Date.now()
    saveCachedPoints(pointList)
    // 用户可能在收集点返回前已经点开箱体；此时补取该箱体的驻留详情。
    if (selectedBox.value && !currentResidence.value && !residenceLoading.value) {
      void loadCurrentResidence(selectedBox.value, residenceRequestVersion)
    }
  } catch (error) {
    pointsError.value = true
    if (!silent) Message.warning('收集点更新失败，暂用上次数据')
    console.warn('地图收集点更新失败：', error)
  } finally { pointsLoading.value = false }
}

async function loadTransportTasks(silent = false) {
  if (transportTasksLoading.value) return
  transportTasksLoading.value = true
  transportTasksError.value = false
  try {
    const tasks = await collectorMapTransportTasksRequest<TransportTask[]>()
    if (!Array.isArray(tasks)) throw new Error('运单数据格式不正确')
    todayTransportTasks.value = tasks
    indexTransportTasks(tasks)
  } catch (error) {
    // 保留上一轮成功数据，避免一次上游异常清空运输状态。
    transportTasksError.value = true
    if (!silent) Message.warning('箱体与运单独立更新：运单更新失败，保留上次数据')
    console.warn('地图运单更新失败：', error)
  } finally { transportTasksLoading.value = false }
}

function responseDataArray<T>(response: unknown): T[] {
  const data = (response as { data?: unknown })?.data
  return Array.isArray(data) ? data as T[] : []
}
function isVehicleType(value: string | undefined): value is VehicleType {
  return VEHICLE_TYPES.includes(value as VehicleType)
}
function indexVehicleTypes(organizations: VehicleOrganization[]) {
  const indexed = new Map<number, VehicleType>()
  const walk = (items: VehicleOrganization[]) => {
    for (const organization of items) {
      for (const group of organization.modelVehicleList || []) {
        if (!isVehicleType(group.modelName)) continue
        for (const vehicle of group.vehicleList || []) {
          const id = Number(vehicle.id)
          if (Number.isFinite(id)) indexed.set(id, group.modelName)
        }
      }
      walk(organization.children || [])
    }
  }
  walk(organizations)
  vehicleTypeById.value = indexed
}
async function loadVehicleTypes(force = false) {
  // 车型档案变化频率低；自动刷新只更新位置，手动更新或半小时后才重新读取档案。
  if (!force && vehicleTypeById.value.size && Date.now() - vehicleTypesLoadedAt < 30 * 60 * 1000) return
  if (vehicleTypesLoading.value) return
  vehicleTypesLoading.value = true
  vehicleTypesError.value = false
  try {
    const response = await collectorVehicleTypesRequest<unknown>()
    if (!Array.isArray((response as { data?: unknown } | null)?.data)) throw new Error('车型数据格式不正确')
    indexVehicleTypes(responseDataArray<VehicleOrganization>(response))
    vehicleTypesLoadedAt = Date.now()
  } catch (error) {
    vehicleTypesError.value = true
    console.warn('车辆档案加载失败，暂保留已有车型：', error)
  } finally { vehicleTypesLoading.value = false }
}
async function loadVehicles(silent = false, refreshTypes = false) {
  if (vehicleLoading.value) return
  vehicleLoading.value = true
  vehicleError.value = false
  void loadVehicleTypes(refreshTypes)
  try {
    // 车辆档案只用于车型显示，不能因它的偶发失败而丢弃已经获取到的实时位置。
    const runtimeResponse = await collectorVehicleRuntimeRequest<unknown>()
    if (!Array.isArray((runtimeResponse as { data?: unknown } | null)?.data)) throw new Error('车辆位置数据格式不正确')
    vehicles.value = responseDataArray<VehicleRuntime>(runtimeResponse)
    if (!silent) Message.success(`已更新 ${vehicles.value.length} 辆车辆位置`)
  } catch (error) {
    vehicleError.value = true
    if (!silent) Message.warning(`车辆位置加载失败：${error instanceof Error ? error.message : '网络异常'}`)
  } finally { vehicleLoading.value = false }
}
async function refreshMapData() {
  // 车辆与箱体同时发起，避免先等箱体再等待车辆接口。
  const boxRefresh = loadFromCloud()
  void loadVehicles(true, true)
  await boxRefresh
}
let offBoxes: () => void
let offPoints: () => void
let boxRefreshTimer: ReturnType<typeof window.setInterval> | undefined
let vehicleRefreshTimer: ReturnType<typeof window.setInterval> | undefined
let residenceClockTimer: ReturnType<typeof window.setInterval> | undefined
function setupBoxRefreshTimer() {
  if (boxRefreshTimer) window.clearInterval(boxRefreshTimer)
  boxRefreshTimer = window.setInterval(() => { void loadFromCloud(true) }, boxRefreshMinutes.value * 60_000)
}
function setupVehicleRefreshTimer() {
  if (vehicleRefreshTimer) window.clearInterval(vehicleRefreshTimer)
  vehicleRefreshTimer = window.setInterval(() => { void loadVehicles(true) }, vehicleRefreshMinutes.value * 60_000)
}
onMounted(async () => {
  // 先读共享缓存（其它页面已更新的数据），再静默刷新云端
  const cachedBoxes = getCachedBoxes<Box>()
  const cachedPoints = getCachedPoints<CollectionPoint>()
  if (cachedBoxes.length || cachedPoints.length) {
    if (cachedBoxes.length) boxes.value = cachedBoxes
    if (cachedPoints.length) { points.value = cachedPoints; assignBoxAreas(boxes.value, points.value) }
  }
  // 其它页面更新数据时，本页同步刷新
  offBoxes = subscribeBoxesUpdated((list) => {
    // 写入共享缓存时也会收到自身广播；同一批数据交给 boxes watcher 统一重绘。
    if (list === toRaw(boxes.value)) return
    if (Array.isArray(list) && list.length) {
      boxes.value = list as Box[]
      gcjPoints = new WeakMap<Box, GcjPoint>()
      if (points.value.length) assignBoxAreas(boxes.value, points.value)
      syncSelectedBox(boxes.value)
    }
  })
  offPoints = subscribePointsUpdated((list) => {
    if (list === toRaw(points.value)) return
    if (Array.isArray(list)) {
      points.value = list as CollectionPoint[]
      assignBoxAreas(boxes.value, points.value)
      pointsLoadedAt = Date.now()
      pointsError.value = false
    }
  })
  if (!mapRef.value) return
  try {
    // 地图脚本与云端数据相互独立，提前发起数据请求，避免串行等待。
    void loadFromCloud(true)
    void loadVehicles(true)
    amap = await loadAmapMarkerClusterer()
    map = new amap.Map(mapRef.value, { zoom: 13, center: [114.1, 36.04], viewMode: '2D', mapStyle: `amap://styles/${mapTheme.value}`, resizeEnable: true, animateEnable: false, jogEnable: false })
    map.on('zoomend', syncMarkerMode)
    drawMarkers()
    // 实时车辆请求可能早于地图初始化完成；地图就绪后主动绘制默认勾臂车图层。
    drawVehicleMarkers()
  } catch (error) { mapError.value = error instanceof Error ? error.message : '高德地图加载失败，请检查地图配置' }
  // 箱体与车辆位置分别按用户设置静默同步，地图视野与当前详情选中态均保持不变。
  setupBoxRefreshTimer()
  setupVehicleRefreshTimer()
  // 仅更新已加载驻留时间的显示，不会请求后端。
  residenceClockTimer = window.setInterval(() => { residenceNow.value = Date.now() }, 60 * 1000)
})
onBeforeUnmount(() => { stopAiResize(); offBoxes?.(); offPoints?.(); if (boxRefreshTimer) window.clearInterval(boxRefreshTimer); if (vehicleRefreshTimer) window.clearInterval(vehicleRefreshTimer); if (residenceClockTimer) window.clearInterval(residenceClockTimer); closeVehicleInfo(); clearBoxOverlays(); clearVehicleOverlays(); map?.destroy(); closeHistoryTrack() })
</script>

<style scoped lang="scss">
.box-map-page { min-height: calc(100vh - 112px); display: flex; flex-direction: column; gap: 16px; transition: padding-right .2s ease; }
.box-map-page.ai-docked { padding-right: calc(var(--ai-panel-width) + 16px); }
.box-map-page:fullscreen { width: 100%; height: 100%; min-height: 0; padding: 16px; overflow: auto; box-sizing: border-box; background: var(--color-bg-1); }
.box-map-page.fullscreen-fallback { position: fixed; inset: 0; z-index: 1000; width: 100%; height: 100dvh; min-height: 0; padding: 16px; overflow: auto; box-sizing: border-box; background: var(--color-bg-1); }
.page-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
.page-title { color: var(--color-text-1); font-size: 20px; font-weight: 600; line-height: 30px; }
.page-subtitle { color: var(--color-text-3); font-size: 13px; }
.filter-card :deep(.arco-card-body) { padding: 14px 16px; }
.filter-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.filter-block:last-child { margin-bottom: 0; }
.locate-block { padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--color-border-2); }
.locate-block :deep(.locate-input) { flex: 0 1 240px; width: 240px; max-width: 100%; min-width: 0; }
.locate-suggestions-footer { padding: 8px 12px; border-top: 1px solid var(--color-border-2); color: var(--color-text-3); font-size: 12px; }
.filter-label { color: var(--color-text-2); font-size: 13px; white-space: nowrap; }
.status-filter-checkbox { margin: 0; padding: 4px 8px; border: 1px solid var(--color-border-2); border-radius: 4px; background: var(--color-bg-2); color: var(--color-text-2); line-height: 22px; transition: all .15s; }
.status-filter-checkbox:hover { border-color: #165dff; color: rgb(var(--primary-6)); }
.status-filter-checkbox.selected { border-color: #165dff; background: var(--color-primary-light-1); color: rgb(var(--primary-6)); }
.status-filter-checkbox.danger.selected { border-color: #f53f3f; background: var(--color-danger-light-1); color: rgb(var(--danger-6)); }
.chip { padding: 2px 13px; border: 1px solid var(--color-border-2); border-radius: 14px; background: var(--color-bg-2); color: var(--color-text-2); font-size: 13px; line-height: 22px; cursor: pointer; transition: all .15s; }
.chip:hover { border-color: #165dff; color: rgb(var(--primary-6)); }
.chip.active { background: #165dff; border-color: #165dff; color: #fff; }
.chip.unmatched { border-style: dashed; color: var(--color-text-3); }
.chip.unmatched:hover { border-color: var(--color-text-3); color: var(--color-text-2); }
.chip.unmatched.active { background: var(--color-fill-4); border-color: var(--color-border-4); color: var(--color-text-1); }
.chip-more { border-style: dashed; color: rgb(var(--primary-6)); }.chip-more:hover { border-color: #165dff; color: rgb(var(--primary-6)); }
.map-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); overflow: hidden; }
.map-card-wrap { position: relative; min-height: 0; overflow: hidden; display: flex; }.map-card-wrap .map-card { flex: 1; min-height: 0; }.map-card-wrap:fullscreen, .map-card-wrap.fullscreen-fallback { position: fixed; inset: 0; z-index: 1001; background: var(--color-bg-1); }
.map-card { min-height: 0; overflow: hidden; }
.map-card :deep(.arco-card-body) { height: 100%; padding: 0; }
/* 高德信息窗由 SDK 创建，需同时适配容器、尖角和关闭按钮。 */
.map-card-wrap :deep(.amap-info-content) { background: var(--color-bg-2); color: var(--color-text-1); border: 1px solid var(--color-border-2); }
.map-card-wrap :deep(.amap-info-sharp) { border-top-color: var(--color-bg-2); }
.map-card-wrap :deep(.amap-info-close) { color: var(--color-text-2); }
.detail-card { position: absolute; top: 16px; right: 16px; z-index: 2; width: 304px; max-height: calc(100% - 32px); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 24px rgb(29 33 41 / 18%); }
.detail-card :deep(.arco-card-body) { min-height: 0; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.detail-panel-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px; border-bottom: 1px solid var(--color-fill-2); }.detail-title { display: flex; align-items: baseline; gap: 8px; }.detail-panel-header h2 { margin: 0; color: var(--color-text-1); font-size: 28px; line-height: 34px; }
.detail-card .detail-scroll { flex: 1; min-height: 0; padding: 14px; overflow-y: auto; }
.amap-container { width: 100%; height: 100%; background: var(--color-fill-2); }
.map-stats { position: absolute; top: 16px; left: 16px; display: flex; gap: 8px; z-index: 1; }
.map-controls { position: absolute; z-index: 1; top: 16px; right: 16px; display: flex; align-items: center; gap: 8px; }
.map-theme-picker { height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 9px; border-radius: 4px; background: var(--color-bg-2); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: var(--color-text-2); font-size: 12px; }.map-theme-picker :deep(.arco-select) { width: 88px; }
.map-fullscreen-btn { height: 32px; border-radius: 4px; background: var(--color-bg-2); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: var(--color-text-2); }.map-fullscreen-btn.active { color: rgb(var(--primary-6)); border-color: #165dff; }
.map-stat { min-width: 82px; padding: 7px 8px; border-radius: 4px; background: var(--color-bg-2); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); color: var(--color-text-2); font-size: 12px; white-space: nowrap; }
.map-stat b { display: block; color: rgb(var(--primary-6)); font-size: 20px; line-height: 25px; }.map-stat.danger b { color: rgb(var(--danger-6)); }.map-stat.warning b { color: rgb(var(--warning-6)); }
.vehicle-legend { position: absolute; z-index: 1; bottom: 16px; left: 50%; display: flex; align-items: center; max-width: calc(100% - 48px); padding: 8px 12px; overflow-x: auto; border-radius: 6px; background: var(--color-bg-2); box-shadow: 0 3px 10px rgb(0 0 0 / 10%); transform: translateX(-50%); }.vehicle-legend :deep(.arco-checkbox-group) { display: flex; flex: 0 0 auto; gap: 12px; }.vehicle-legend :deep(.arco-checkbox) { margin: 0; color: var(--color-text-2); font-size: 12px; white-space: nowrap; }.vehicle-legend-dot { width: 8px; height: 8px; display: inline-block; margin-right: 5px; border-radius: 50%; background: #165dff; }.vehicle-legend-dot.large { background: #722ed1; }.vehicle-legend-dot.tricycle { background: #00b42a; }
.map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: rgb(var(--danger-6)); background: var(--color-bg-1); }
.detail-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }.box-no, .section-label { color: var(--color-text-3); font-size: 12px; }.box-detail-actions { display: flex; gap: 4px; margin-left: auto; }.create-task-action { min-width: 30px; box-shadow: 0 2px 6px rgba(255, 125, 0, .28); } .create-task-action :deep(svg) { font-size: 18px; } .report-time { flex-basis: 100%; overflow: hidden; color: var(--color-text-3); font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
.detail-card :deep(.arco-card-header) { align-items: center; }.detail-close-btn { color: var(--color-text-3); }.detail-close-btn:hover { color: var(--color-text-1); }
.fill-summary { padding: 12px; border-radius: 6px; background: var(--color-fill-2); }.fill-summary > span { color: var(--color-text-2); font-size: 13px; }.fill-summary strong { display: block; margin: 2px 0 9px; color: rgb(var(--primary-6)); font-size: 28px; line-height: 34px; }.fill-summary.warning strong { color: rgb(var(--warning-6)); }.fill-summary.overflow strong { color: rgb(var(--danger-6)); }.fill-track { height: 6px; overflow: hidden; border-radius: 3px; background: var(--color-border-2); }.fill-track i { display: block; height: 100%; border-radius: inherit; background: #165dff; }.fill-summary.warning .fill-track i { background: #ff7d00; }.fill-summary.overflow .fill-track i { background: #f53f3f; }.overflow-duration-summary { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 10px; padding-top: 9px; border-top: 1px solid rgb(245 63 63 / 20%); }.overflow-duration-summary span { color: var(--color-text-2); font-size: 13px; }.overflow-duration-summary b { color: rgb(var(--danger-6)); font-size: 13px; line-height: 20px; }
.location-summary { display: grid; gap: 5px; padding: 16px 0 12px; }.location-summary b { color: var(--color-text-1); font-size: 14px; }.matched-point { color: var(--color-text-2); font-size: 13px; }.vehicle-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 0 0 16px; }.vehicle-summary .section-label { flex-basis: 100%; }.transport-task-summary { margin-bottom: 16px; padding: 10px; border: 1px solid var(--color-primary-light-3); border-radius: 6px; background: var(--color-primary-light-1); }.transport-task-title { display: flex; align-items: center; gap: 6px; margin-bottom: 9px; color: rgb(var(--primary-6)); font-size: 13px; font-weight: 600; }.transport-task-icon { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #165dff; color: #fff; font-size: 11px; }.transport-task-grid { display: grid; grid-template-columns: 62px minmax(0, 1fr); gap: 6px 8px; font-size: 12px; }.transport-task-grid span { color: var(--color-text-3); }.transport-task-grid b { overflow: hidden; color: var(--color-text-2); font-weight: 500; white-space: nowrap; text-overflow: ellipsis; }.more-details { border-top: 1px solid var(--color-fill-2); }.more-details summary { padding: 12px 0; color: var(--color-text-2); font-size: 13px; cursor: pointer; }.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }.detail-grid-item { display: grid; gap: 3px; min-width: 0; }.detail-grid-item.full { grid-column: 1 / -1; }.detail-grid-item span { color: var(--color-text-3); font-size: 12px; white-space: nowrap; }.detail-grid-item b { overflow: hidden; color: var(--color-text-2); font-size: 13px; font-weight: 500; white-space: nowrap; text-overflow: ellipsis; }.coordinate-block { display: grid; gap: 5px; margin: 12px 0; }.coordinate-block span { color: var(--color-text-3); font-size: 12px; }.coordinate-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.coordinate-title :deep(.arco-btn) { flex-shrink: 0; }.coordinate-block code { margin-bottom: 4px; padding: 6px; overflow-wrap: anywhere; border-radius: 3px; background: var(--color-fill-1); color: var(--color-text-2); font-size: 11px; }.matched-block { display: grid; gap: 6px; padding-top: 4px; }.matched-item { display: grid; gap: 2px; padding: 8px 0; border-bottom: 1px solid var(--color-fill-2); }.matched-item b { color: var(--color-text-2); font-size: 13px; }.matched-item span { color: var(--color-text-3); font-size: 11px; }
.modal-tip { margin-top: 0; color: var(--color-text-2); }.modal-tip code { padding: 1px 4px; background: var(--color-fill-2); }
.residence-summary { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 4px; padding: 8px 10px; border-radius: 4px; background: var(--color-primary-light-1); }.residence-summary span { color: var(--color-text-2); font-size: 12px; }.location-summary .residence-summary b { color: rgb(var(--primary-6)); font-size: 13px; }
.ai-text-analysis { margin-top: 10px; border-top: 1px solid var(--color-border-2); }
.ai-text-analysis summary { padding: 8px 0; color: var(--color-text-3); font-size: 12px; cursor: pointer; }
.ai-text-analysis p { padding-top: 4px; font-size: 12px; line-height: 1.7; }
.ai-residence-table th:nth-child(2), .ai-residence-table td:nth-child(2) { text-align: left; }
.ai-residence-table th:nth-child(4), .ai-residence-table td:nth-child(4) { text-align: right; }
.ai-progress { color: var(--color-text-3); font-size: 12px; }
.ai-log-filters { margin-bottom: 14px; }.ai-query-log-table :deep(.arco-table-th) { padding: 9px 10px; color: var(--color-text-2); font-size: 12px; white-space: nowrap; }.ai-query-log-table :deep(.arco-table-td) { padding: 9px 10px; vertical-align: middle; font-size: 12px; }.ai-log-ellipsis { overflow: hidden; text-overflow: ellipsis; }.ai-log-two-lines { display: -webkit-box; color: var(--color-text-2); line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.ai-log-time, .ai-log-duration { color: var(--color-text-2); white-space: nowrap; }.ai-query-log-table :deep(.arco-tag) { margin: 0; font-size: 11px; line-height: 20px; }
.token-expired-banner { display: flex; align-items: center; gap: 6px; padding: 9px 14px; border: 1px solid var(--color-danger-light-3); border-radius: 4px; background: var(--color-danger-light-1); color: rgb(var(--danger-6)); font-size: 13px; }
.token-reset-link { color: rgb(var(--primary-6)); cursor: pointer; text-decoration: underline; }
/* 左侧导航展开宽度为 230px；助手与入口固定在内容区左下，给右侧箱体详情留出完整空间。 */
.ai-floating-trigger { position: fixed; bottom: 24px; left: var(--ai-left); z-index: 1002; width: 44px; height: 44px; box-shadow: 0 8px 22px rgb(22 93 255 / 30%); }.ai-floating-trigger :deep(.arco-icon) { font-size: 21px; }
.ai-assistant { position: fixed; bottom: 24px; left: var(--ai-left); z-index: 1002; display: flex; width: 368px; max-width: calc(100vw - var(--ai-left) - 24px); height: min(610px, calc(100vh - 48px)); flex-direction: column; overflow: hidden; border: 1px solid var(--color-border-2); border-radius: 0; background: var(--color-bg-2); box-shadow: 0 18px 52px rgb(29 33 41 / 24%); }
.ai-assistant--docked { top: 0; right: 0; bottom: 0; left: auto; width: var(--ai-panel-width); max-width: 42vw; height: auto; border-width: 0 0 0 1px; box-shadow: -8px 0 28px rgb(29 33 41 / 10%); }
.ai-resize-handle { position: absolute; top: 0; bottom: 0; left: -5px; z-index: 3; width: 10px; cursor: col-resize; }.ai-resize-handle::after { position: absolute; top: 50%; left: 3px; width: 3px; height: 38px; border-radius: 3px; background: transparent; content: ''; transform: translateY(-50%); transition: background .15s; }.ai-resize-handle:hover::after { background: #165dff; }
:global(body.ai-panel-resizing) { cursor: col-resize; user-select: none; }
.ai-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 12px 16px; border-bottom: 1px solid var(--color-fill-2); }.ai-header > div { display: flex; align-items: center; gap: 9px; }.ai-header b { display: block; color: var(--color-text-1); font-size: 14px; }.ai-header small { display: block; margin-top: 2px; color: var(--color-text-3); font-size: 11px; }.ai-avatar, .ai-mini-avatar { display: inline-flex; align-items: center; justify-content: center; color: #fff; border-radius: 8px; background: linear-gradient(135deg, #165dff, #722ed1); }.ai-avatar { width: 30px; height: 30px; font-size: 17px; }.ai-mini-avatar { width: 24px; height: 24px; flex: 0 0 auto; border-radius: 7px; font-size: 14px; }
.ai-context { display: flex; align-items: center; gap: 5px; min-height: 30px; padding: 6px 14px; overflow-x: auto; border-bottom: 1px solid var(--color-fill-2); background: var(--color-bg-2); color: var(--color-text-2); font-size: 10px; white-space: nowrap; }.ai-context-title { color: var(--color-text-3); }.ai-context > span:not(.ai-context-title) { padding: 2px 6px; border-radius: 3px; background: var(--color-primary-light-1); color: rgb(var(--primary-6)); }
.ai-shortcuts { display: flex; gap: 6px; padding: 10px 14px; overflow-x: auto; border-bottom: 1px solid var(--color-fill-2); background: var(--color-primary-light-1); }.ai-shortcuts button { flex: 0 0 auto; padding: 4px 8px; border: 1px solid var(--color-primary-light-3); border-radius: 12px; background: var(--color-bg-2); color: rgb(var(--primary-6)); font-size: 11px; cursor: pointer; }.ai-shortcuts button:hover { background: var(--color-primary-light-1); }
.ai-structured-answer, .ai-dispatch-guide { display: grid; gap: 9px; margin-top: 10px; }.ai-structured-answer > div { padding: 8px 10px; border-left: 3px solid #165dff; background: var(--color-primary-light-1); }.ai-structured-answer b, .ai-dispatch-guide b { color: var(--color-text-1); font-size: 12px; }.ai-structured-answer ul, .ai-structured-answer ol, .ai-guide-risks ul { display: grid; gap: 2px; margin: 5px 0 0; padding-left: 17px; color: var(--color-text-2); font-size: 11px; line-height: 17px; }.ai-dispatch-guide { overflow: hidden; border: 1px solid var(--color-warning-light-3); border-radius: 5px; background: var(--color-bg-2); }.ai-dispatch-guide > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 9px 10px; background: var(--color-warning-light-1); }.ai-dispatch-guide > header div { display: grid; gap: 2px; }.ai-dispatch-guide > header span, .ai-dispatch-guide footer { color: var(--color-text-3); font-size: 10px; line-height: 15px; }.ai-dispatch-guide :deep(.arco-tag) { flex: 0 0 auto; margin: 0; font-size: 10px; }.ai-guide-row { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 8px; padding: 0 10px; }.ai-guide-row > span { color: var(--color-text-3); font-size: 11px; }.ai-guide-row p { margin: 0; color: var(--color-text-2); font-size: 11px; line-height: 17px; }.ai-guide-row button { margin: 0 4px 4px 0; padding: 2px 5px; border: 1px solid var(--color-primary-light-3); border-radius: 3px; background: var(--color-bg-2); color: rgb(var(--primary-6)); font-size: 10px; cursor: pointer; }.ai-guide-risks { margin: 0 10px; padding: 7px 8px; border-radius: 3px; background: var(--color-warning-light-1); }.ai-guide-risks b { color: rgb(var(--warning-6)); }.ai-dispatch-guide footer { padding: 8px 10px; border-top: 1px solid var(--color-fill-2); background: var(--color-fill-1); }.ai-focus-row { cursor: pointer; }.ai-focus-row:hover { background: var(--color-primary-light-1); }
.ai-messages { flex: 1; min-height: 0; padding: 14px; overflow-y: auto; background: var(--color-fill-1); }.ai-message { display: flex; gap: 7px; margin-bottom: 12px; }.ai-message.user { justify-content: flex-end; }.ai-bubble { max-width: calc(100% - 31px); padding: 9px 11px; border-radius: 9px; background: var(--color-bg-2); color: var(--color-text-2); box-shadow: 0 1px 2px rgb(29 33 41 / 6%); font-size: 13px; line-height: 20px; }.ai-message.user .ai-bubble { max-width: 82%; background: #165dff; color: #fff; }.ai-bubble p { margin: 0; white-space: pre-wrap; }.ai-priority-ranking { display: grid; gap: 8px; margin-top: 10px; }.ai-priority-ranking > header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-left: 3px solid #165dff; background: var(--color-primary-light-1); }.ai-priority-ranking > header div { display: grid; gap: 1px; }.ai-priority-ranking > header b { color: var(--color-text-1); font-size: 12px; }.ai-priority-ranking > header span { color: var(--color-text-2); font-size: 10px; line-height: 15px; }.ai-priority-ranking > header > em { flex: 0 0 auto; color: var(--color-text-3); font-size: 9px; font-style: normal; }.ai-priority-table-wrap, .ai-priority-bar-chart { overflow: hidden; border: 1px solid var(--color-primary-light-3); border-radius: 4px; background: var(--color-bg-2); }.ai-priority-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }.ai-priority-table th { padding: 7px 6px; background: var(--color-primary-light-1); color: var(--color-text-3); font-size: 10px; font-weight: 500; text-align: left; }.ai-priority-table th:nth-child(1) { width: 35px; text-align: center; }.ai-priority-table th:nth-child(2) { width: 55px; }.ai-priority-table th:nth-child(4) { width: 58px; text-align: right; }.ai-priority-table td { min-width: 0; padding: 8px 6px; border-top: 1px solid var(--color-fill-2); color: var(--color-text-2); vertical-align: middle; }.ai-priority-table td:nth-child(1) { text-align: center; }.ai-priority-table td:nth-child(2) b { color: var(--color-text-1); font-size: 11px; white-space: nowrap; }.ai-priority-table td:nth-child(3) { overflow: hidden; color: var(--color-text-3); text-overflow: ellipsis; white-space: nowrap; }.ai-priority-table td:last-child { color: rgb(var(--primary-6)); text-align: right; white-space: nowrap; }.ai-priority-table td:last-child strong { font-size: 15px; line-height: 1; }.ai-priority-table td:last-child em { margin-left: 1px; color: rgb(var(--primary-6)); font-size: 9px; font-style: normal; }.ai-priority-rank { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; background: var(--color-primary-light-1); color: rgb(var(--primary-6)); font-size: 10px; font-weight: 700; }.ai-priority-bar-chart { display: grid; gap: 0; padding: 5px 9px; }.ai-priority-bar-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) 35px; align-items: center; gap: 7px; padding: 6px 0; }.ai-priority-bar-row > span { overflow: hidden; color: var(--color-text-2); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.ai-priority-bar-row i { height: 9px; overflow: hidden; border-radius: 999px; background: var(--color-border-2); }.ai-priority-bar-row b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #165dff, #4080ff); }.ai-priority-bar-row em { color: var(--color-text-2); font-size: 10px; font-style: normal; text-align: right; }.ai-evidence { display: grid; gap: 3px; margin: 8px 0 0; padding: 7px 0 0 16px; border-top: 1px solid var(--color-fill-2); color: var(--color-text-3); font-size: 11px; line-height: 17px; }.ai-sources { display: grid; gap: 3px; margin: 8px 0 0; padding: 7px 0 0 16px; border-top: 1px solid var(--color-fill-2); font-size: 11px; line-height: 17px; }.ai-sources a { color: rgb(var(--primary-6)); text-decoration: none; }.ai-sources a:hover { text-decoration: underline; }.ai-message-footer { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 8px; color: var(--color-text-3); font-size: 10px; }.ai-message-footer :deep(.arco-btn) { height: 20px; padding: 0 3px; font-size: 11px; }
.ai-input { padding: 10px 12px; border-top: 1px solid var(--color-border-2); background: var(--color-bg-2); }.ai-textarea-wrap { position: relative; }.ai-input :deep(.arco-textarea-wrapper) { border-radius: 7px; }.ai-input :deep(textarea) { padding-right: 42px; font-size: 13px; }.ai-send-btn { position: absolute; right: 7px; bottom: 7px; z-index: 1; width: 26px; height: 26px; padding: 0; }.ai-send-btn :deep(.arco-icon) { font-size: 15px; }.ai-stop-icon { display: block; width: 10px; height: 10px; border-radius: 1px; background: currentcolor; }
.ai-transport-visualization { display: grid; gap: 8px; margin-top: 10px; }.ai-transport-visualization > header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-left: 3px solid #00b42a; background: var(--color-success-light-1); }.ai-transport-visualization > header b { color: var(--color-text-1); font-size: 12px; }.ai-transport-visualization > header span { color: var(--color-text-3); font-size: 10px; }.ai-transport-metrics { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid var(--color-success-light-3); border-radius: 4px; background: var(--color-bg-2); }.ai-transport-metrics span { display: grid; gap: 2px; padding: 10px; }.ai-transport-metrics span + span { border-left: 1px solid var(--color-fill-2); }.ai-transport-metrics small { color: var(--color-text-3); font-size: 10px; }.ai-transport-metrics b { color: rgb(var(--success-6)); font-size: 20px; line-height: 1.1; }.ai-transport-metrics em { margin-left: 2px; color: rgb(var(--success-6)); font-size: 10px; font-style: normal; }.ai-transport-table-wrap { overflow: hidden; border: 1px solid var(--color-success-light-3); border-radius: 4px; background: var(--color-bg-2); }.ai-transport-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }.ai-transport-table th { padding: 7px 8px; background: var(--color-success-light-1); color: var(--color-text-3); font-size: 10px; font-weight: 500; text-align: left; }.ai-transport-table th:nth-child(2), .ai-transport-table th:nth-child(3), .ai-transport-table td:nth-child(2), .ai-transport-table td:nth-child(3) { text-align: right; }.ai-transport-table td { overflow: hidden; padding: 8px; border-top: 1px solid var(--color-fill-2); color: var(--color-text-2); text-overflow: ellipsis; white-space: nowrap; }.ai-transport-line-chart { padding: 8px 10px 5px; border: 1px solid var(--color-success-light-3); border-radius: 4px; background: var(--color-bg-2); }.ai-transport-line-chart svg { display: block; width: 100%; height: 96px; overflow: visible; }.ai-transport-line-chart polyline { fill: none; stroke: #00b42a; stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }.ai-transport-line-labels { display: flex; justify-content: space-between; color: var(--color-text-3); font-size: 9px; }.ai-transport-bars { display: grid; gap: 0; padding: 5px 9px; border: 1px solid var(--color-success-light-3); border-radius: 4px; background: var(--color-bg-2); }.ai-transport-bar-row { display: grid; grid-template-columns: 68px minmax(0, 1fr) 36px; align-items: center; gap: 7px; padding: 6px 0; }.ai-transport-bar-row > span { overflow: hidden; color: var(--color-text-2); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }.ai-transport-bar-row i { height: 8px; overflow: hidden; border-radius: 999px; background: var(--color-border-2); }.ai-transport-bar-row b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #00b42a, #7be188); }.ai-transport-bar-row em { color: var(--color-text-2); font-size: 10px; font-style: normal; text-align: right; }.ai-overflow-list { display: grid; max-height: 238px; overflow: auto; border: 1px solid var(--color-success-light-3); border-radius: 4px; background: var(--color-bg-2); }.ai-overflow-item { display: grid; grid-template-columns: 66px minmax(0, 1fr); gap: 2px 8px; padding: 9px 10px; border-top: 1px solid var(--color-fill-2); }.ai-overflow-item:first-child { border-top: 0; }.ai-overflow-item b { grid-row: span 2; align-self: center; color: var(--color-text-1); font-size: 12px; white-space: nowrap; }.ai-overflow-item span { overflow: hidden; color: var(--color-text-2); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.ai-overflow-item em { color: rgb(var(--success-6)); font-size: 10px; font-style: normal; }.ai-data-unavailable { display: grid; gap: 4px; padding: 10px; border: 1px solid var(--color-warning-light-3); border-radius: 4px; background: var(--color-warning-light-1); }.ai-data-unavailable b { color: rgb(var(--warning-6)); font-size: 11px; }.ai-data-unavailable span { color: var(--color-text-3); font-size: 10px; line-height: 16px; }
.box-map-page :deep(.box-map-marker) { position: relative; min-width: 36px; height: 26px; padding: 0 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #fff; border-radius: 4px; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 12px; font-weight: 600; }
.box-map-page :deep(.box-marker-new-badge) { position: absolute; top: -9px; right: -9px; z-index: 3; min-width: 18px; height: 18px; padding: 0 3px; display: flex; align-items: center; justify-content: center; box-sizing: border-box; border: 2px solid #fff; border-radius: 9px; background: #b7eb8f; box-shadow: 0 1px 4px rgb(29 33 41 / 20%); color: #237804; font-size: 10px; font-weight: 700; line-height: 1; }
.box-map-page :deep(.box-map-marker::after) { content: ''; position: absolute; bottom: -6px; left: 50%; width: 10px; height: 10px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; background: inherit; transform: translateX(-50%) rotate(45deg); }.box-map-page :deep(.box-map-marker.transporting::before) { content: '运'; position: absolute; top: -9px; left: -9px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; border-radius: 50%; background: #165dff; box-shadow: 0 1px 4px rgb(29 33 41 / 25%); color: #fff; font-size: 10px; font-weight: 700; }.box-map-page :deep(.box-map-marker.warning) { background: #ff7d00; }.box-map-page :deep(.box-map-marker.overflow) { background: #f53f3f; }.box-map-page :deep(.box-map-marker.matched) { box-shadow: 0 0 0 3px #00b42a, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.1); z-index: 1; }.box-map-page :deep(.box-map-marker.selected) { border: 2px solid #fff; box-shadow: 0 0 0 3px #165dff, 0 2px 6px rgb(29 33 41 / 28%); transform: scale(1.15); opacity: 1; z-index: 2; }
:global(.vehicle-map-marker) { display: flex; align-items: center; gap: 4px; min-height: 22px; padding: 2px 6px; border: 1px solid #fff; border-radius: 11px; background: #165dff; box-shadow: 0 2px 6px rgb(29 33 41 / 28%); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; }.box-map-page :global(.vehicle-map-marker i) { width: 8px; height: 8px; display: block; border: 1px solid rgb(255 255 255 / 80%); border-radius: 2px; background: currentcolor; transform: skewX(-20deg); }.box-map-page :global(.vehicle-map-marker.large) { background: #722ed1; }.box-map-page :global(.vehicle-map-marker.tricycle) { background: #00b42a; }.box-map-page :global(.vehicle-map-marker.compact) { box-sizing: border-box; width: 28px; height: 28px; min-height: 28px; justify-content: center; padding: 2px; border: 2px solid #fff; border-radius: 50%; cursor: pointer; transition: width .15s ease, height .15s ease, box-shadow .15s ease; }.box-map-page :global(.vehicle-map-marker.compact.selected) { width: 36px; height: 36px; min-height: 36px; box-shadow: 0 0 0 3px rgb(0 180 42 / 28%), 0 3px 8px rgb(0 180 42 / 42%); }.box-map-page :global(.vehicle-map-marker.compact svg) { flex: none; }.box-map-page :global(.vehicle-map-marker.compact.selected svg) { width: 28px; height: 28px; }.box-map-page :global(.vehicle-cluster-marker) { display: flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 6px; border: 2px solid #fff; border-radius: 50%; background: #00b42a; box-shadow: 0 2px 8px rgb(0 180 42 / 36%); color: #fff; font-size: 12px; font-weight: 700; }
.history-overlay { position: absolute; inset: 16px; z-index: 10; display: flex; min-height: 0; flex-direction: column; padding: 16px; overflow: hidden; background: var(--color-bg-1); box-shadow: 0 12px 36px rgb(29 33 41 / 28%); }.history-layout { display: grid; flex: 1; min-height: 0; grid-template-columns: minmax(0, 1fr) 290px; border: 1px solid var(--color-border-2); }.history-map-wrap { position: relative; min-width: 0; }.history-map { width: 100%; height: 100%; }
.history-visits { overflow-y: auto; border-left: 1px solid var(--color-border-2); background: var(--color-bg-2); }.history-visits-title { padding: 14px; color: var(--color-text-1); font-weight: 600; border-bottom: 1px solid var(--color-fill-2); }.history-visit { display: flex; width: 100%; gap: 10px; padding: 12px 14px; text-align: left; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid var(--color-fill-2); }.history-visit:hover { background: var(--color-primary-light-1); }.history-visit > b { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 22px; height: 22px; color: #fff; font-size: 12px; border-radius: 50%; background: #165dff; }.history-visit span { display: grid; min-width: 0; gap: 3px; }.history-visit strong { overflow: hidden; color: var(--color-text-1); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }.history-visit em, .history-visit small { color: var(--color-text-3); font-size: 11px; font-style: normal; }
:global(.history-track-pin) { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; color: #fff; font-size: 13px; font-weight: 700; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 2px 8px rgb(0 0 0 / 36%), 0 0 0 1px rgb(22 93 255 / 35%); }.history-track-pin.start { background: #00b42a; }.history-track-pin.end { background: #f53f3f; }.history-track-pin.visit { background: #165dff; }
:global(.history-track-pin.start) { background: #00b42a; }:global(.history-track-pin.end) { background: #f53f3f; }:global(.history-track-pin.visit) { background: #165dff; }
@media (max-width: 960px) { .detail-card { top: auto; right: 10px; bottom: 10px; left: 10px; width: auto; max-height: 58%; }.page-header { align-items: flex-start; gap: 12px; flex-direction: column; } }
@media (max-width: 960px) { .box-map-page.ai-open .detail-card { display: none; }.box-map-page.ai-docked { padding-right: 0; }.ai-floating-trigger { bottom: 10px; }.ai-assistant, .ai-assistant--docked { top: auto; right: auto; bottom: 10px; left: var(--ai-left); width: 368px; max-width: calc(100vw - var(--ai-left) - 10px); height: min(600px, calc(100vh - 20px)); border: 1px solid var(--color-border-2); box-shadow: 0 18px 52px rgb(29 33 41 / 24%); }.ai-resize-handle { display: none; } }
/* 手机端优先保证地图可见面积：筛选项横向滑动，不再把地图推到首屏之外。 */
@media (max-width: 600px) {
  .box-map-page { min-height: 100%; gap: 10px; padding: 10px; }
  .box-map-page:fullscreen, .box-map-page.fullscreen-fallback { padding: 10px; }
  .page-header { gap: 8px; }
  .page-title { font-size: 18px; line-height: 26px; }
  .page-subtitle { display: none; }
  .page-header :deep(.arco-space) { width: 100%; flex-wrap: wrap; gap: 8px; }
  .page-header :deep(.arco-space-item) { flex: 1 1 auto; }
  .page-header :deep(.arco-btn) { width: 100%; min-height: 36px; }

  .filter-card :deep(.arco-card-body) { padding: 10px; }
  .filter-block { gap: 6px; margin-bottom: 6px; }
  .filter-block:not(.locate-block):not(.status-block) { flex-wrap: nowrap; padding-bottom: 2px; overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; }
  .locate-block { padding-bottom: 10px; margin-bottom: 10px; }
  .filter-label { font-size: 12px; }
  .status-filter-checkbox { padding: 2px 7px; font-size: 12px; line-height: 20px; }
  .chip { flex: 0 0 auto; padding: 1px 10px; font-size: 12px; line-height: 20px; }

  .map-layout { flex: 0 0 auto; height: clamp(420px, 62dvh, 680px); overflow: visible; }
  .map-card-wrap { min-height: 0; }
  .map-stats { top: 10px; left: 10px; gap: 5px; }
  .map-stat { min-width: 58px; padding: 5px 6px; font-size: 10px; }
  .map-stat b { font-size: 17px; line-height: 21px; }
  .map-controls { top: 10px; right: 10px; gap: 4px; }
  .map-theme-picker { height: 30px; gap: 0; padding: 0 5px; }
  .map-theme-picker > span { display: none; }
  .map-theme-picker :deep(.arco-select) { width: 70px; }
  .map-fullscreen-btn { height: 30px; padding: 0 7px; }
  .vehicle-legend { right: 10px; bottom: 10px; left: 10px; max-width: none; padding: 6px 8px; transform: none; }
  .vehicle-legend :deep(.arco-checkbox-group) { gap: 8px; }
  .vehicle-legend :deep(.arco-checkbox) { font-size: 11px; }

  .detail-card { right: 6px; bottom: 6px; left: 6px; max-height: min(52dvh, 430px); border-radius: 10px; }
  .detail-panel-header { padding: 10px 12px; }
  .detail-panel-header h2 { font-size: 24px; line-height: 30px; }
  .detail-card .detail-scroll { padding: 12px; }
  .history-overlay { inset: 0; padding: 10px; }
  .history-title h2 { font-size: 20px; }

  .ai-floating-trigger { bottom: max(10px, env(safe-area-inset-bottom)); }
  .ai-assistant { bottom: max(6px, env(safe-area-inset-bottom)); width: calc(100vw - 20px); max-width: calc(100vw - 20px); height: min(78dvh, 600px); border-radius: 10px; }
}
@media (max-width: 480px) { .ai-shortcuts { padding-right: 10px; padding-left: 10px; } }
@media (max-width: 720px) { .history-overlay { inset: 10px; padding: 12px; }.history-layout { grid-template-columns: 1fr; grid-template-rows: minmax(300px, 1fr) 190px; }.history-visits { border-top: 1px solid var(--color-border-2); border-left: 0; } }
.ai-message-footer { display: flex; align-items: flex-start; flex-direction: column; gap: 3px; }.ai-message-actions { display: flex; align-items: center; gap: 4px; }

.box-map-page :global(.vehicle-map-marker i) { width: 9px; height: 9px; flex: none; border: 2px solid #fff; border-radius: 2px; box-shadow: 0 0 0 1px rgb(29 33 41 / 30%); transform: rotate(45deg); }
.box-map-page :global(.vehicle-map-marker.online i) { background: #00b42a; }
.box-map-page :global(.vehicle-map-marker.charging i) { background: #165dff; }
.box-map-page :global(.vehicle-map-marker.offline i) { background: #86909c; }
.box-map-page :global(.vehicle-map-marker.compact) { position: relative; }
.box-map-page :global(.vehicle-map-marker.compact i) { position: absolute; top: -4px; right: -4px; }

.vehicle-detail-card .detail-title { min-width: 0; flex: 1; flex-wrap: wrap; gap: 2px 8px; }
.vehicle-detail-card .detail-title h2 { font-size: 24px; overflow-wrap: anywhere; }
.vehicle-detail-card .detail-close-btn { flex-shrink: 0; }
.vehicle-location-summary { padding-top: 0; }
.vehicle-location-summary b { overflow-wrap: anywhere; line-height: 22px; }
.vehicle-detail-grid { margin-bottom: 16px; }
.vehicle-orders { margin-bottom: 12px; }
.vehicle-order-list { display: grid; gap: 10px; overscroll-behavior: contain; }
.vehicle-order { min-width: 0; padding: 10px; border: 1px solid var(--color-primary-light-3); border-radius: 6px; background: var(--color-primary-light-1); }
.vehicle-order-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; color: var(--color-text-1); font-size: 13px; }
.vehicle-order-heading b { min-width: 0; overflow-wrap: anywhere; }
.vehicle-order-heading :deep(.arco-tag) { flex-shrink: 0; }
.vehicle-order-route { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 5px 8px; margin-top: 8px; font-size: 12px; line-height: 18px; }
.vehicle-order-route span { color: var(--color-text-3); }
.vehicle-order-route b { color: var(--color-text-2); font-weight: 500; overflow-wrap: anywhere; }
.box-map-page :global(.vehicle-map-marker) { transform-origin: center bottom; transition: transform .15s ease, box-shadow .15s ease; }
.box-map-page :global(.vehicle-map-marker.selected) { transform: scale(1.15); outline: 3px solid rgb(22 93 255 / 28%); box-shadow: 0 3px 10px rgb(29 33 41 / 35%); }

.history-state { display: flex; flex: 1; min-height: 200px; align-items: center; justify-content: center; }
.history-facts { display: flex; flex-wrap: wrap; gap: 8px 20px; padding-bottom: 12px; color: var(--color-text-3); font-size: 12px; }.history-facts b { color: var(--color-text-1); }
</style>

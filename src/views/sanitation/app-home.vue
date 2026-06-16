<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="功能入口 - 智慧环卫运营平台"
      subtitle="APP端首页，包含搜索、状态卡片、功能模块网格与底部导航。所有按钮均可点击交互。"
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
              <p class="prd-intro">在 APP 首页新增 5 个业务入口按钮（蓝色高亮 + NEW 标签），点击跳转到对应角色页面：</p>
              <table class="prd-table">
                <thead>
                  <tr><th>按钮</th><th>目标用户</th><th>跳转页面</th></tr>
                </thead>
                <tbody>
                  <tr><td>箱体监控</td><td>管理员、调度员</td><td>管理员端 → 箱体监控 Tab</td></tr>
                  <tr><td>告警派单</td><td>调度员</td><td>调度员端 → 告警消息 Tab</td></tr>
                  <tr><td>运单监控</td><td>管理员、调度员</td><td>调度员端 → 运单监控</td></tr>
                  <tr><td>收运看板</td><td>管理员、调度员</td><td>管理员端 → 收运看板 Tab</td></tr>
                  <tr><td>收运任务</td><td>驾驶员</td><td>驾驶员端 → 任务 Tab</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <!-- ====== 手机外框 ====== -->
    <div class="phone-wrapper">
      <div class="phone-frame">
        <!-- 状态栏 -->
        <div class="status-bar">
          <span class="time-display">{{ currentTime }}</span>
          <div class="status-icons">
            <span class="signal-icon">5G</span>
            <span class="battery-icon">🔋 85%</span>
          </div>
        </div>

        <!-- APP 标题栏 -->
        <div class="app-header">
          <span class="app-logo">智慧环卫运营平台</span>
        </div>

        <!-- ===== Tab 1: 首页 ===== -->
        <div v-if="store.activeHomeTab === 'home'" class="phone-content">
          <!-- 搜索栏 -->
          <div class="search-bar" @click="handleSearch">
            <icon-search class="search-icon" />
            <span class="search-placeholder">{{ store.searchKeyword || '请输入车牌号快速查找' }}</span>
          </div>

          <!-- 状态卡片 -->
          <div class="status-cards">
            <div
              v-for="card in homeStatusCards"
              :key="card.key"
              class="status-card"
              :style="{ borderTopColor: card.color }"
              @click="handleStatusCard(card)"
            >
              <span class="card-value" :style="{ color: card.color }">{{ card.value }}</span>
              <span class="card-label">{{ card.label }}</span>
            </div>
          </div>

          <!-- 功能模块网格 -->
          <div class="module-section">
            <div class="section-label">常用功能</div>
            <div class="module-grid">
              <div
                v-for="mod in homeModules"
                :key="mod.id"
                class="module-item"
                :class="{ 'is-new-business': mod.group === 'business' }"
                @click="handleModuleClick(mod)"
              >
                <div class="module-icon" :class="mod.group">
                  <span class="icon-emoji">{{ getModuleEmoji(mod.id) }}</span>
                </div>
                <span class="module-name">{{ mod.name }}</span>
                <span v-if="mod.badge" class="module-badge">{{ mod.badge }}</span>
                <span v-if="mod.group === 'business'" class="new-tag">NEW</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Tab 2: 监控 ===== -->
        <div v-if="store.activeHomeTab === 'monitor'" class="phone-content">
          <div class="monitor-header">
            <span class="monitor-title">实时监控</span>
          </div>

          <!-- 地图占位 -->
          <div class="map-placeholder" @click="handleMapClick">
            <icon-location class="map-icon" />
            <span>全域地图监管</span>
            <span class="map-hint">点击查看车辆实时位置</span>
          </div>

          <!-- 实时统计 -->
          <div class="monitor-stats">
            <div class="monitor-stat" v-for="stat in monitorStats" :key="stat.label" @click="handleMonitorStat(stat)">
              <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>

          <!-- 告警滚动 -->
          <div class="alert-scroll">
            <div class="section-label">最新告警</div>
            <div
              v-for="alert in alertList.slice(0, 5)"
              :key="alert.id"
              class="alert-row"
              @click="handleAlertClick(alert)"
            >
              <span class="alert-dot" :class="'dot-' + alert.level"></span>
              <span class="alert-title-text">{{ alert.title }}</span>
              <span class="alert-time">{{ alert.time }}</span>
            </div>
          </div>
        </div>

        <!-- ===== Tab 3: 消息 ===== -->
        <div v-if="store.activeHomeTab === 'message'" class="phone-content">
          <div class="message-header">
            <span class="message-title">消息列表</span>
          </div>

          <!-- 消息 Tab -->
          <div class="message-tabs">
            <span
              class="msg-tab"
              :class="{ active: store.messageTab === 'system' }"
              @click="store.messageTab = 'system'"
            >系统消息</span>
            <span
              class="msg-tab"
              :class="{ active: store.messageTab === 'repair' }"
              @click="store.messageTab = 'repair'"
            >车辆报修</span>
          </div>

          <!-- 消息列表 -->
          <div class="message-list">
            <template v-if="filteredMessages.length">
              <div
                v-for="msg in filteredMessages"
                :key="msg.id"
                class="message-card"
                :class="{ unread: !msg.read }"
                @click="handleMessageClick(msg)"
              >
                <div class="msg-icon-wrapper">
                  <span class="msg-icon">{{ msg.type === 'system' ? '📢' : '🔧' }}</span>
                </div>
                <div class="msg-body">
                  <div class="msg-title-row">
                    <span class="msg-title">{{ msg.title }}</span>
                    <span v-if="!msg.read" class="msg-dot"></span>
                  </div>
                  <span class="msg-desc">{{ msg.content.slice(0, 40) }}...</span>
                  <span class="msg-time">{{ msg.time }}</span>
                </div>
              </div>
            </template>
            <div v-else class="empty-state">
              <span class="empty-icon">📭</span>
              <span>暂无数据</span>
            </div>
          </div>
        </div>

        <!-- ===== Tab 4: 我的 ===== -->
        <div v-if="store.activeHomeTab === 'mine'" class="phone-content">
          <div class="mine-header">
            <div class="avatar-circle">李</div>
            <div class="mine-info">
              <span class="mine-name">李明辉</span>
              <span class="mine-role">管理员</span>
            </div>
          </div>

          <div class="mine-menu">
            <div v-for="menu in mineMenus" :key="menu.label" class="mine-menu-item" @click="handleMineMenu(menu)">
              <span class="menu-emoji">{{ menu.icon }}</span>
              <span class="menu-label">{{ menu.label }}</span>
              <icon-right class="menu-arrow" />
            </div>
          </div>

          <div class="logout-btn" @click="handleLogout">
            退出登录
          </div>
        </div>

        <!-- ===== 底部导航 ===== -->
        <div class="bottom-nav">
          <div
            v-for="nav in bottomNavs"
            :key="nav.key"
            class="nav-item"
            :class="{ active: nav.key === 'home', disabled: nav.key !== 'home' }"
            @click="nav.key === 'home' && (store.activeHomeTab = 'home')"
          >
            <span class="nav-icon">{{ nav.icon }}</span>
            <span class="nav-label">{{ nav.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import {
  homeStatusCards,
  homeModules,
  alertList,
  messageList,
  useAppStore,
  type HomeStatusCard,
  type HomeModule,
  type AlertItem,
  type MessageItem,
} from './data/app-mock'

defineOptions({ name: 'SanitationAppHome' })

const router = useRouter()
const store = useAppStore

// 当前时间
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  const update = () => {
    const now = new Date()
    currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
  update()
  timer = setInterval(update, 30000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

// 底部导航
const bottomNavs = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'monitor', label: '监控', icon: '📡' },
  { key: 'message', label: '消息', icon: '💬' },
  { key: 'mine', label: '我的', icon: '👤' },
]

// 过滤消息
const filteredMessages = computed(() =>
  messageList.filter((m) => m.type === store.messageTab)
)

// 模块图标映射
function getModuleEmoji(id: string): string {
  const map: Record<string, string> = {
    'toilet-map': '🚻', 'station-map': '🏗️', 'inspection': '🔍',
    'vehicle-video': '📹', 'personnel-attendance': '📋', 'food-waste': '🍽️',
    'attendance-mgr': '✅', 'driver-attendance': '🚛', 'work-map': '🗺️',
    'vehicle-check': '🔧', 'biz-report': '📊', 'check-mgr': '📝',
    'vehicle-data': '📈', 'charge-mgr': '🔌', 'collect-record': '📄',
    'collect-list': '📃', 'material-out': '📤', 'stock-mgr': '📦',
    'machine-work': '⚙️', 'cleaner-location': '📍',
    'box-monitor': '📦', 'alert-dispatch': '🚨', 'waybill-monitor': '📋',
    'dashboard-view': '📊', 'driver-task': '🚛',
  }
  return map[id] || '📱'
}

// 监控统计
const monitorStats = [
  { label: '在线车辆', value: '9/11', color: '#00B42A' },
  { label: '收运中', value: '5单', color: '#165DFF' },
  { label: '告警未处理', value: '4条', color: '#F53F3F' },
  { label: '设备离线', value: '2台', color: '#FF7D00' },
]

// 我的菜单
const mineMenus = [
  { label: '个人资料', icon: '👤' },
  { label: '账号安全', icon: '🔒' },
  { label: '系统设置', icon: '⚙️' },
  { label: '关于我们', icon: 'ℹ️' },
]

// ===== 交互处理 =====
function handleSearch() {
  const kw = prompt('请输入车牌号搜索：', store.searchKeyword)
  if (kw !== null) {
    store.searchKeyword = kw
    ArcoMessage.info(kw ? `搜索车牌号：${kw}` : '已清除搜索')
  }
}

function handleStatusCard(card: HomeStatusCard) {
  ArcoMessage.info(`点击了「${card.label}」卡片，当前值：${card.value}`)
}

function handleModuleClick(mod: HomeModule) {
  // 新增业务按钮 → 跳转到对应角色页面和 tab
  switch (mod.id) {
    case 'box-monitor':
      store.activeAdminTab = 'box'
      router.push('/sanitation/app-admin')
      break
    case 'alert-dispatch':
      store.activeDispatcherTab = 'alert'
      router.push('/sanitation/app-dispatcher')
      break
    case 'waybill-monitor':
      store.activeDispatcherTab = 'task'
      router.push('/sanitation/app-dispatcher')
      break
    case 'dashboard-view':
      store.activeAdminTab = 'home'
      router.push('/sanitation/app-admin')
      break
    case 'driver-task':
      store.activeDriverTab = 'task'
      router.push('/sanitation/app-driver')
      break
    default:
      ArcoMessage.info(`进入「${mod.name}」功能模块`)
  }
}

function handleMapClick() {
  ArcoMessage.info('正在加载全域地图监管视图...')
}

function handleMonitorStat(stat: { label: string; value: string }) {
  ArcoMessage.info(`查看「${stat.label}」详情：${stat.value}`)
}

function handleAlertClick(alert: AlertItem) {
  ArcoMessage.info(`查看告警详情：${alert.title}`)
}

function handleMessageClick(msg: MessageItem) {
  msg.read = true
  ArcoMessage.info(`查看消息：${msg.title}`)
}

function handleMineMenu(menu: { label: string }) {
  ArcoMessage.info(`进入「${menu.label}」页面`)
}

function handleLogout() {
  if (confirm('确定退出登录吗？')) {
    ArcoMessage.success('已退出登录')
  }
}
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// PRD 面板
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

  th {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    background: var(--color-fill-2);
    font-weight: 600;
    text-align: left;
  }
}

.prd-intro {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-2);
}

.phone-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.phone-frame {
  width: 390px;
  min-height: 780px;
  background: #f0f2f5;
  border: 3px solid #1f2937;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,.16);
  display: flex;
  flex-direction: column;
}

// 状态栏
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px 4px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #1d2129;
  .status-icons { display: flex; gap: 6px; align-items: center; }
  .signal-icon { color: rgb(var(--arcoblue-6)); font-weight: 700; }
}

// APP 标题栏
.app-header {
  padding: 6px 20px 10px;
  background: #fff;
  .app-logo { font-size: 18px; font-weight: 700; color: #1d2129; }
}

.phone-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 12px;
  background: #f0f2f5;
}

// 搜索栏
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
  padding: 10px 14px;
  background: #fff;
  border-radius: 20px;
  cursor: pointer;
  .search-icon { color: #86909c; font-size: 16px; }
  .search-placeholder { color: #c9cdd4; font-size: 13px; }
}

// 状态卡片
.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #fff;
  border-radius: 10px;
  border-top: 3px solid;
  cursor: pointer;
  transition: transform .15s;
  &:active { transform: scale(.96); }
  .card-value { font-size: 22px; font-weight: 700; }
  .card-label { font-size: 11px; color: #86909c; margin-top: 2px; }
}

// 功能模块
.module-section { margin-bottom: 8px; }
.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: transform .15s;
  border: 2px solid transparent;
  &:active { transform: scale(.94); }

  // 新增业务按钮高亮
  &.is-new-business {
    border-color: #165DFF;
    background: linear-gradient(135deg, #f0f7ff, #e8f3ff);
    box-shadow: 0 2px 8px rgba(22, 93, 255, 0.12);
    .module-name { color: #165DFF; font-weight: 600; }
  }
}

.new-tag {
  position: absolute;
  top: -2px;
  left: -2px;
  padding: 1px 5px;
  background: linear-gradient(135deg, #165DFF, #4080FF);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  border-radius: 0 0 6px 0;
  letter-spacing: 0.5px;
}

.module-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-bottom: 4px;
  &.business { background: #e8f3ff; }
  &.facility { background: #e8ffea; }
  &.manage { background: #fff7e8; }
  &.vehicle { background: #f0e8ff; }
  &.personnel { background: #ffe8f0; }
  &.collect { background: #e8f9ff; }
  &.warehouse { background: #fff0e8; }
  &.report { background: #f5e8ff; }
  .icon-emoji { font-size: 18px; }
}

.module-name {
  font-size: 11px;
  color: #4e5969;
  text-align: center;
  line-height: 1.3;
}

.module-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  padding: 0 3px;
  background: #f53f3f;
  color: #fff;
  font-size: 9px;
  border-radius: 6px;
  transform: scale(.85);
}

// 监控 Tab
.monitor-header { padding: 10px 0; }
.monitor-title { font-size: 17px; font-weight: 700; color: #1d2129; }

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  background: linear-gradient(135deg, #e8f3ff, #d4e8ff);
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 12px;
  .map-icon { font-size: 36px; color: rgb(var(--arcoblue-6)); }
  span { font-size: 14px; color: #4e5969; margin-top: 4px; }
  .map-hint { font-size: 11px; color: #86909c; }
}

.monitor-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

.monitor-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  &:active { transform: scale(.96); }
  .stat-value { font-size: 16px; font-weight: 700; }
  .stat-label { font-size: 10px; color: #86909c; margin-top: 2px; }
}

.alert-scroll { margin-bottom: 8px; }

.alert-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  &:active { background: #f7f8fa; }
  .alert-title-text { flex: 1; font-size: 13px; color: #1d2129; }
  .alert-time { font-size: 11px; color: #c9cdd4; }
}

.alert-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  &.dot-严重 { background: #f53f3f; }
  &.dot-重要 { background: #ff7d00; }
  &.dot-一般 { background: #f7ba1e; }
}

// 消息 Tab
.message-header { padding: 10px 0; }
.message-title { font-size: 17px; font-weight: 700; color: #1d2129; }

.message-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.msg-tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-size: 13px;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  &.active { color: rgb(var(--arcoblue-6)); border-bottom-color: rgb(var(--arcoblue-6)); font-weight: 600; }
}

.message-list { display: flex; flex-direction: column; gap: 8px; }

.message-card {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  &:active { background: #f7f8fa; }
  &.unread { background: #e8f3ff; }
}

.msg-icon-wrapper {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #f0f2f5; flex-shrink: 0;
  .msg-icon { font-size: 18px; }
}

.msg-body {
  flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
  .msg-title-row { display: flex; align-items: center; gap: 6px; }
  .msg-title { font-size: 13px; font-weight: 600; color: #1d2129; }
  .msg-dot { width: 6px; height: 6px; background: #f53f3f; border-radius: 50%; }
  .msg-desc { font-size: 11px; color: #86909c; }
  .msg-time { font-size: 10px; color: #c9cdd4; }
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px; gap: 8px; color: #c9cdd4;
  .empty-icon { font-size: 36px; }
  span { font-size: 13px; }
}

// 我的 Tab
.mine-header {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 0;
}

.avatar-circle {
  width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--arcoblue-6));
  color: #fff; font-size: 20px; font-weight: 700;
  border-radius: 50%;
}

.mine-info {
  display: flex; flex-direction: column;
  .mine-name { font-size: 17px; font-weight: 700; color: #1d2129; }
  .mine-role { font-size: 12px; color: #86909c; }
}

.mine-menu {
  display: flex; flex-direction: column;
  background: #fff; border-radius: 10px; overflow: hidden;
}

.mine-menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  &:active { background: #f7f8fa; }
  .menu-emoji { font-size: 18px; }
  .menu-label { flex: 1; font-size: 14px; color: #1d2129; }
  .menu-arrow { color: #c9cdd4; font-size: 14px; }
}

.logout-btn {
  margin-top: 20px;
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  color: #f53f3f;
  font-size: 14px;
  cursor: pointer;
  &:active { background: #fff0f0; }
}

// 底部导航
.bottom-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 8px 0 18px;
  background: #fff;
  border-top: 1px solid #e5e6eb;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  .nav-icon { font-size: 20px; }
  .nav-label { font-size: 10px; color: #86909c; }
  &.active .nav-label { color: rgb(var(--arcoblue-6)); font-weight: 600; }
  &.disabled { cursor: not-allowed; opacity: 0.4; }
}
</style>

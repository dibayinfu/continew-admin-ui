<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="大屏优化版"
      subtitle="大屏进一步优化，支持视频查看、实时统计数据呈现、告警联动。"
      phase="二期"
      priority="P1"
      module="大屏优化"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-fullscreen /></template>
          全屏展示
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          大屏配置
        </a-button>
      </template>
    </ModuleHeader>

    <a-grid :cols="{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }" :col-gap="14" :row-gap="14">
      <a-grid-item :span="2">
        <div class="chart-card">
          <h3>实时监控视频</h3>
          <div class="video-grid">
            <div class="video-item" v-for="cam in cameras" :key="cam.name">
              <div class="video-placeholder">
                <icon-camera class="video-icon" />
                <span>{{ cam.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-grid-item>
      <a-grid-item>
        <div class="chart-card">
          <h3>今日运行概览</h3>
          <div class="stats-list">
            <div class="stat-item" v-for="stat in todayStats" :key="stat.label">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value" :class="`tone-${stat.tone || 'normal'}`">{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </a-grid-item>
    </a-grid>

    <a-grid :cols="{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }" :col-gap="14" :row-gap="14">
      <a-grid-item>
        <div class="chart-card">
          <h3>告警趋势（近7天）</h3>
          <div class="bar-chart">
            <div class="bar-item" v-for="item in alertTrend" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
              </div>
              <span class="bar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </a-grid-item>
      <a-grid-item>
        <div class="chart-card">
          <h3>车辆运行状态</h3>
          <div class="vehicle-stats">
            <div class="vehicle-stat-item">
              <span class="dot dot-green"></span>
              <span>在线运行</span>
              <span class="count">7辆</span>
            </div>
            <div class="vehicle-stat-item">
              <span class="dot dot-yellow"></span>
              <span>在线空闲</span>
              <span class="count">2辆</span>
            </div>
            <div class="vehicle-stat-item">
              <span class="dot dot-red"></span>
              <span>离线</span>
              <span class="count">1辆</span>
            </div>
            <div class="vehicle-stat-item">
              <span class="dot dot-gray"></span>
              <span>维修中</span>
              <span class="count">1辆</span>
            </div>
          </div>
        </div>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<script setup lang="ts">
import ModuleHeader from './components/ModuleHeader.vue'

defineOptions({ name: 'SanitationCommandCenterEnhanced' })

const cameras = [
  { name: '马投涧中转站-入口' },
  { name: '马投涧中转站-卸料区' },
  { name: '善应中转站-入口' },
  { name: '焚烧厂-地磅' },
]

const todayStats = [
  { label: '垃圾量', value: '107.3t', tone: 'normal' },
  { label: '车辆在线', value: '9/11辆', tone: 'success' },
  { label: '任务完成', value: '91.2%', tone: 'success' },
  { label: '告警未处理', value: '3条', tone: 'danger' },
  { label: '满溢告警', value: '2条', tone: 'warning' },
  { label: '设备离线', value: '2台', tone: 'danger' },
]

const alertTrend = [
  { label: '05-14', value: '5条', percent: 50, color: 'rgb(var(--arcoblue-6))' },
  { label: '05-15', value: '3条', percent: 30, color: 'rgb(var(--arcoblue-6))' },
  { label: '05-16', value: '7条', percent: 70, color: 'rgb(var(--arcoblue-6))' },
  { label: '05-17', value: '4条', percent: 40, color: 'rgb(var(--arcoblue-6))' },
  { label: '05-18', value: '6条', percent: 60, color: 'rgb(var(--arcoblue-6))' },
  { label: '05-19', value: '8条', percent: 80, color: 'rgb(var(--red-6))' },
  { label: '05-20', value: '5条', percent: 50, color: 'rgb(var(--arcoblue-6))' },
]
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chart-card {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;

  h3 {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
  }
}

.video-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.video-item {
  aspect-ratio: 16 / 9;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  background: var(--color-fill-2);
  border-radius: 4px;
  color: var(--color-text-3);
  font-size: 13px;
}

.video-icon {
  font-size: 32px;
  color: var(--color-text-4);
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-fill-2);
}

.stat-label {
  color: var(--color-text-2);
  font-size: 13px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--arcoblue-6));
}

.tone-success { color: rgb(var(--green-6)); }
.tone-warning { color: rgb(var(--orange-6)); }
.tone-danger { color: rgb(var(--red-6)); }
.tone-normal { color: rgb(var(--arcoblue-6)); }

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 60px;
  font-size: 12px;
  color: var(--color-text-2);
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 20px;
  background: var(--color-fill-2);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.bar-value {
  width: 60px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
}

.vehicle-stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.vehicle-stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-2);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-green { background: rgb(var(--green-6)); }
.dot-yellow { background: rgb(var(--orange-6)); }
.dot-red { background: rgb(var(--red-6)); }
.dot-gray { background: var(--color-text-4); }

.count {
  margin-left: auto;
  font-weight: 600;
  color: var(--color-text-1);
}
</style>

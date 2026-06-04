<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="调度大屏增强"
      subtitle="效率排行、考核排行、趋势分析、对账分析，全方位调度数据展示。"
      phase="持续迭代"
      priority="P1"
      module="调度大屏"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-fullscreen /></template>
          全屏展示
        </a-button>
        <a-button>
          <template #icon><icon-download /></template>
          导出报告
        </a-button>
      </template>
    </ModuleHeader>

    <a-grid :cols="{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }" :col-gap="14" :row-gap="14">
      <a-grid-item>
        <div class="chart-card">
          <h3>乡镇效率排行</h3>
          <div class="rank-list">
            <div class="rank-item" v-for="(item, idx) in townRanking" :key="item.name">
              <span class="rank-num" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
              <span class="rank-name">{{ item.name }}</span>
              <div class="rank-bar-track">
                <div class="rank-bar-fill" :style="{ width: item.score + '%' }"></div>
              </div>
              <span class="rank-score">{{ item.score }}分</span>
            </div>
          </div>
        </div>
      </a-grid-item>
      <a-grid-item>
        <div class="chart-card">
          <h3>车辆考核排行</h3>
          <div class="rank-list">
            <div class="rank-item" v-for="(item, idx) in vehicleRanking" :key="item.name">
              <span class="rank-num" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
              <span class="rank-name">{{ item.name }}</span>
              <div class="rank-bar-track">
                <div class="rank-bar-fill" :style="{ width: item.score + '%' }"></div>
              </div>
              <span class="rank-score">{{ item.score }}分</span>
            </div>
          </div>
        </div>
      </a-grid-item>
    </a-grid>

    <a-grid :cols="{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }" :col-gap="14" :row-gap="14">
      <a-grid-item>
        <div class="chart-card">
          <h3>垃圾量趋势（近30天）</h3>
          <div class="trend-chart">
            <div class="trend-item" v-for="item in wasteTrend" :key="item.week">
              <span class="trend-label">{{ item.week }}</span>
              <div class="trend-bar" :style="{ height: item.percent + '%', background: item.color }"></div>
              <span class="trend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </a-grid-item>
      <a-grid-item>
        <div class="chart-card">
          <h3>对账分析</h3>
          <div class="reconcile-stats">
            <div class="reconcile-item">
              <span class="label">对账总单数</span>
              <span class="value">128单</span>
            </div>
            <div class="reconcile-item">
              <span class="label">数据一致</span>
              <span class="value success">112单 (87.5%)</span>
            </div>
            <div class="reconcile-item">
              <span class="label">差异预警</span>
              <span class="value warning">12单 (9.4%)</span>
            </div>
            <div class="reconcile-item">
              <span class="label">数据异常</span>
              <span class="value danger">4单 (3.1%)</span>
            </div>
          </div>
        </div>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<script setup lang="ts">
import ModuleHeader from './components/ModuleHeader.vue'

defineOptions({ name: 'SanitationCommandCenterAdvanced' })

const townRanking = [
  { name: '马投涧镇', score: 92 },
  { name: '龙泉镇', score: 86 },
  { name: '善应镇', score: 78 },
]

const vehicleRanking = [
  { name: '豫E8K270', score: 95 },
  { name: '豫E6N109', score: 93 },
  { name: '豫E7A031', score: 88 },
  { name: '豫E3G516', score: 72 },
]

const wasteTrend = [
  { week: 'W1', value: '742t', percent: 68, color: 'rgb(var(--arcoblue-6))' },
  { week: 'W2', value: '768t', percent: 70, color: 'rgb(var(--arcoblue-6))' },
  { week: 'W3', value: '795t', percent: 73, color: 'rgb(var(--arcoblue-6))' },
  { week: 'W4', value: '821t', percent: 75, color: 'rgb(var(--arcoblue-6))' },
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

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  background: var(--color-fill-2);
  color: var(--color-text-2);
}

.rank-1 {
  background: rgb(var(--red-6));
  color: #fff;
}

.rank-2 {
  background: rgb(var(--orange-6));
  color: #fff;
}

.rank-3 {
  background: rgb(var(--arcoblue-6));
  color: #fff;
}

.rank-name {
  width: 100px;
  font-size: 13px;
  color: var(--color-text-1);
}

.rank-bar-track {
  flex: 1;
  height: 16px;
  background: var(--color-fill-2);
  border-radius: 8px;
  overflow: hidden;
}

.rank-bar-fill {
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, rgb(var(--arcoblue-6)), rgb(var(--green-6)));
  transition: width 0.6s ease;
}

.rank-score {
  width: 50px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  text-align: right;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  padding-top: 20px;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.trend-bar {
  width: 40px;
  border-radius: 4px 4px 0 0;
  min-height: 20px;
  transition: height 0.6s ease;
}

.trend-label {
  font-size: 12px;
  color: var(--color-text-3);
}

.trend-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-1);
}

.reconcile-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reconcile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-fill-2);

  .label {
    color: var(--color-text-2);
    font-size: 14px;
  }

  .value {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .success { color: rgb(var(--green-6)); }
  .warning { color: rgb(var(--orange-6)); }
  .danger { color: rgb(var(--red-6)); }
}
</style>

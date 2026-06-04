<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="垃圾量预测"
      subtitle="根据历史数据预测未来垃圾量，支持季节因子、节假日因子分析。"
      phase="持续迭代"
      priority="P0"
      module="智能预测"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-thunderbolt /></template>
          重新预测
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          预测模型配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <a-grid :cols="{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }" :col-gap="14" :row-gap="14">
      <a-grid-item>
        <div class="chart-card">
          <h3>近7日预测 vs 实际</h3>
          <div class="bar-chart">
            <div class="bar-item" v-for="item in predictionChart" :key="item.label">
              <span class="bar-label">{{ item.label }}</span>
              <div class="bar-group">
                <div class="bar-track predicted">
                  <div class="bar-fill" :style="{ width: item.predictedPercent + '%', background: 'rgb(var(--arcoblue-6))' }"></div>
                </div>
                <div class="bar-track actual">
                  <div class="bar-fill" :style="{ width: item.actualPercent + '%', background: 'rgb(var(--green-6))' }"></div>
                </div>
              </div>
              <div class="bar-values">
                <span class="predicted-value">{{ item.predicted }}</span>
                <span class="actual-value">{{ item.actual }}</span>
              </div>
            </div>
          </div>
          <div class="legend">
            <span><span class="dot dot-blue"></span> 预测值</span>
            <span><span class="dot dot-green"></span> 实际值</span>
          </div>
        </div>
      </a-grid-item>
      <a-grid-item>
        <div class="chart-card">
          <h3>预测准确率</h3>
          <div class="accuracy-display">
            <div class="accuracy-value">98.9%</div>
            <div class="accuracy-desc">近7日平均预测准确率</div>
          </div>
          <a-divider />
          <div class="factor-list">
            <div class="factor-item">
              <span>季节因子</span>
              <span class="factor-value">春季：+3.2%</span>
            </div>
            <div class="factor-item">
              <span>节假日因子</span>
              <span class="factor-value">节假日：-5.8%</span>
            </div>
            <div class="factor-item">
              <span>天气因子</span>
              <span class="factor-value">雨天：-8.2%</span>
            </div>
          </div>
        </div>
      </a-grid-item>
    </a-grid>

    <div class="table-panel">
      <h3>预测明细</h3>
      <a-table
        row-key="id"
        :data="wastePredictions"
        :columns="tableColumns"
        :pagination="{ pageSize: 8, showTotal: true }"
        :scroll="{ x: 1200 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'
import { wastePredictions } from './data/mock-enhanced'

defineOptions({ name: 'SanitationWastePrediction' })

const metrics = [
  { label: '今日预测', value: '106.8t', unit: '' },
  { label: '今日实际', value: '107.3t', unit: '' },
  { label: '偏差', value: '+0.5t', unit: '', tone: 'success' },
  { label: '准确率', value: '99.5%', unit: '', tone: 'success' },
]

const predictionChart = [
  { label: '05-14', predicted: '108.5t', actual: '110.5t', predictedPercent: 96, actualPercent: 100 },
  { label: '05-15', predicted: '103.8t', actual: '104.8t', predictedPercent: 94, actualPercent: 95 },
  { label: '05-16', predicted: '106.2t', actual: '107.3t', predictedPercent: 96, actualPercent: 97 },
  { label: '05-17', predicted: '98.5t', actual: '96.2t', predictedPercent: 89, actualPercent: 87 },
  { label: '05-18', predicted: '112.0t', actual: '110.5t', predictedPercent: 101, actualPercent: 100 },
  { label: '05-19', predicted: '105.2t', actual: '104.8t', predictedPercent: 95, actualPercent: 95 },
  { label: '05-20', predicted: '106.8t', actual: '107.3t', predictedPercent: 97, actualPercent: 97 },
]

const tableColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '日期', dataIndex: 'date', width: 120 },
  { title: '星期', dataIndex: 'weekday' },
  { title: '预测值', dataIndex: 'predictedWaste' },
  { title: '实际值', dataIndex: 'actualWaste' },
  { title: '偏差', dataIndex: 'deviation' },
  { title: '准确率', dataIndex: 'accuracy' },
  { title: '季节因子', dataIndex: 'seasonFactor' },
  { title: '节假日', dataIndex: 'holidayFactor' },
  { title: '状态', dataIndex: 'status' },
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

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-label {
  width: 50px;
  font-size: 12px;
  color: var(--color-text-2);
  text-align: right;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bar-track {
  height: 10px;
  background: var(--color-fill-2);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.bar-values {
  width: 100px;
  display: flex;
  flex-direction: column;
  font-size: 11px;
  text-align: right;
}

.predicted-value {
  color: rgb(var(--arcoblue-6));
}

.actual-value {
  color: rgb(var(--green-6));
}

.legend {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-text-2);
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.dot-blue { background: rgb(var(--arcoblue-6)); }
.dot-green { background: rgb(var(--green-6)); }

.accuracy-display {
  text-align: center;
  padding: 20px 0;
}

.accuracy-value {
  font-size: 48px;
  font-weight: 700;
  color: rgb(var(--green-6));
}

.accuracy-desc {
  margin-top: 8px;
  color: var(--color-text-3);
  font-size: 13px;
}

.factor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.factor-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-2);
}

.factor-value {
  font-weight: 600;
  color: var(--color-text-1);
}

.table-panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;

  h3 {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
  }
}
</style>

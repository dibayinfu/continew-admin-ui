<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="考核评价体系"
      subtitle="对乡镇、车辆、中转站建立考核标准，自动评分，生成考核报表。"
      phase="三期"
      priority="P1"
      module="考核评价"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-download /></template>
          导出考核报告
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          考核标准配置
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="metrics" />

    <div class="dimension-tabs">
      <a-tabs v-model="activeTab">
        <a-tab-pane key="town" title="乡镇考核" />
        <a-tab-pane key="vehicle" title="车辆考核" />
        <a-tab-pane key="station" title="中转站考核" />
      </a-tabs>
    </div>

    <div class="table-panel">
      <a-table
        row-key="id"
        :data="assessmentData"
        :columns="tableColumns"
        :pagination="{ pageSize: 8, showTotal: true, showJumper: true }"
        :scroll="{ x: 1300 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'level'" :value="record[column.dataIndex]" />
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import StatusTag from './components/StatusTag.vue'

defineOptions({ name: 'SanitationAssessmentSystem' })

const activeTab = ref('town')

const metrics = [
  { label: '优秀', value: 3, unit: '个', tone: 'success' },
  { label: '良好', value: 2, unit: '个' },
  { label: '一般', value: 1, unit: '个', tone: 'warning' },
  { label: '待改进', value: 1, unit: '个', tone: 'danger' },
]

const townAssessment = [
  { id: 'TA001', name: '马投涧镇', coverage: '97.2%', timeliness: '95.8%', wasteVolume: '558.0t', deviceOnline: '92.3%', alertProcess: '85.7%', score: 92, level: '优秀' },
  { id: 'TA002', name: '龙泉镇', coverage: '94.5%', timeliness: '91.2%', wasteVolume: '474.0t', deviceOnline: '88.9%', alertProcess: '78.6%', score: 86, level: '良好' },
  { id: 'TA003', name: '善应镇', coverage: '88.3%', timeliness: '85.6%', wasteVolume: '441.0t', deviceOnline: '83.3%', alertProcess: '71.4%', score: 78, level: '一般' },
]

const vehicleAssessment = [
  { id: 'VA001', name: '豫E8K270', type: '大勾臂车', trips: 4, wasteVolume: '13.8t', emptyRate: '0%', fuelEfficiency: '良好', safetyScore: 98, score: 95, level: '优秀' },
  { id: 'VA002', name: '豫E6N109', type: '大勾臂车', trips: 3, wasteVolume: '11.6t', emptyRate: '0%', fuelEfficiency: '良好', safetyScore: 95, score: 93, level: '优秀' },
  { id: 'VA003', name: '豫E3G516', type: '小勾臂车', trips: 6, wasteVolume: '2.4t', emptyRate: '16.7%', fuelEfficiency: '一般', safetyScore: 82, score: 72, level: '一般' },
  { id: 'VA004', name: '豫E7A031', type: '小三轮', trips: 2, wasteVolume: '0.8t', emptyRate: '0%', fuelEfficiency: '优秀', safetyScore: 90, score: 88, level: '良好' },
]

const stationAssessment = [
  { id: 'SA001', name: '马投涧中转站', dailyWaste: '18.6t', operationRate: '100%', deviceStatus: '正常', cleanliness: '优秀', safetyScore: 96, score: 94, level: '优秀' },
  { id: 'SA002', name: '善应中转站', dailyWaste: '14.7t', operationRate: '100%', deviceStatus: '预警', cleanliness: '良好', safetyScore: 85, score: 82, level: '良好' },
]

const assessmentData = computed(() => {
  if (activeTab.value === 'town') return townAssessment
  if (activeTab.value === 'vehicle') return vehicleAssessment
  return stationAssessment
})

const tableColumns = computed(() => {
  if (activeTab.value === 'town') {
    return [
      { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
      { title: '乡镇名称', dataIndex: 'name' },
      { title: '覆盖率', dataIndex: 'coverage' },
      { title: '及时率', dataIndex: 'timeliness' },
      { title: '垃圾量', dataIndex: 'wasteVolume' },
      { title: '设备在线率', dataIndex: 'deviceOnline' },
      { title: '告警处理率', dataIndex: 'alertProcess' },
      { title: '综合评分', dataIndex: 'score' },
      { title: '等级', dataIndex: 'level' },
    ]
  } else if (activeTab.value === 'vehicle') {
    return [
      { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
      { title: '车牌号', dataIndex: 'name' },
      { title: '车辆类型', dataIndex: 'type' },
      { title: '车次', dataIndex: 'trips' },
      { title: '垃圾量', dataIndex: 'wasteVolume' },
      { title: '空驶率', dataIndex: 'emptyRate' },
      { title: '油耗效率', dataIndex: 'fuelEfficiency' },
      { title: '安全评分', dataIndex: 'safetyScore' },
      { title: '综合评分', dataIndex: 'score' },
      { title: '等级', dataIndex: 'level' },
    ]
  }
  return [
    { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
    { title: '中转站名称', dataIndex: 'name' },
    { title: '日垃圾量', dataIndex: 'dailyWaste' },
    { title: '运行率', dataIndex: 'operationRate' },
    { title: '设备状态', dataIndex: 'deviceStatus' },
    { title: '清洁度', dataIndex: 'cleanliness' },
    { title: '安全评分', dataIndex: 'safetyScore' },
    { title: '综合评分', dataIndex: 'score' },
    { title: '等级', dataIndex: 'level' },
  ]
})
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-tabs {
  padding: 0 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.table-panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}
</style>

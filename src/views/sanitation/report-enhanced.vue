<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="统计报表增强"
      subtitle="任务统计、任务完成时效、垃圾量统计增强版，支持多维度数据展示。"
      phase="二期"
      priority="P1"
      module="统计报表"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-download /></template>
          导出报表
        </a-button>
        <a-button>
          <template #icon><icon-settings /></template>
          报表配置
        </a-button>
      </template>
    </ModuleHeader>

    <a-grid :cols="{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }" :col-gap="14" :row-gap="14">
      <a-grid-item>
        <div class="chart-card">
          <h3>任务完成时效统计</h3>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div class="bar-item" v-for="item in taskTimeliness" :key="item.label">
                <span class="bar-label">{{ item.label }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
                </div>
                <span class="bar-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-grid-item>
      <a-grid-item>
        <div class="chart-card">
          <h3>垃圾量统计（本周）</h3>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div class="bar-item" v-for="item in weeklyWaste" :key="item.label">
                <span class="bar-label">{{ item.label }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
                </div>
                <span class="bar-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-grid-item>
    </a-grid>

    <div class="table-panel">
      <h3>任务完成明细</h3>
      <a-table
        row-key="id"
        :data="taskDetails"
        :columns="taskColumns"
        :pagination="{ pageSize: 6, showTotal: true }"
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
import StatusTag from './components/StatusTag.vue'

defineOptions({ name: 'SanitationReportEnhanced' })

const taskTimeliness = [
  { label: '满溢清运', value: '平均45min', percent: 75, color: 'rgb(var(--red-6))' },
  { label: '日常清运', value: '平均3.2h', percent: 60, color: 'rgb(var(--arcoblue-6))' },
  { label: '紧急派单', value: '平均28min', percent: 88, color: 'rgb(var(--orange-6))' },
  { label: '工单处理', value: '平均2.1h', percent: 55, color: 'rgb(var(--green-6))' },
]

const weeklyWaste = [
  { label: '周一', value: '110.5t', percent: 100, color: 'rgb(var(--arcoblue-6))' },
  { label: '周二', value: '104.8t', percent: 95, color: 'rgb(var(--arcoblue-6))' },
  { label: '周三', value: '107.3t', percent: 97, color: 'rgb(var(--arcoblue-6))' },
  { label: '周四', value: '98.2t', percent: 89, color: 'rgb(var(--arcoblue-6))' },
  { label: '周五', value: '112.6t', percent: 102, color: 'rgb(var(--arcoblue-6))' },
  { label: '周六', value: '95.4t', percent: 86, color: 'rgb(var(--arcoblue-6))' },
  { label: '周日', value: '96.2t', percent: 87, color: 'rgb(var(--arcoblue-6))' },
]

const taskDetails = [
  { id: 'TD001', taskName: '马投涧北片上午收集', type: '日常清运', assignee: '张师傅', startTime: '06:30', endTime: '10:15', duration: '3h45min', coverage: '97.2%', status: '已完成' },
  { id: 'TD002', taskName: '牛家窑2号箱体满溢清运', type: '满溢清运', assignee: '张师傅', startTime: '08:30', endTime: '09:05', duration: '35min', coverage: '100%', status: '已完成' },
  { id: 'TD003', taskName: '马投涧压缩箱C清运', type: '满溢清运', assignee: '孙师傅', startTime: '08:00', endTime: '08:42', duration: '42min', coverage: '100%', status: '已完成' },
  { id: 'TD004', taskName: '善应北村日常收集', type: '日常清运', assignee: '李师傅', startTime: '09:00', endTime: '12:30', duration: '3h30min', coverage: '91.7%', status: '进行中' },
  { id: 'TD005', taskName: '善应至焚烧厂转运', type: '大勾臂转运', assignee: '王师傅', startTime: '09:00', endTime: '15:45', duration: '6h45min', coverage: '100%', status: '已完成' },
  { id: 'TD006', taskName: '龙泉镇小勾臂转运', type: '小勾臂转运', assignee: '赵师傅', startTime: '07:00', endTime: '10:50', duration: '3h50min', coverage: '100%', status: '已完成' },
]

const taskColumns = [
  { title: '序号', width: 70, align: 'center' as const, render: ({ rowIndex }: any) => rowIndex + 1 },
  { title: '任务名称', dataIndex: 'taskName', ellipsis: true, tooltip: true },
  { title: '类型', dataIndex: 'type' },
  { title: '驾驶员', dataIndex: 'assignee' },
  { title: '开始时间', dataIndex: 'startTime' },
  { title: '结束时间', dataIndex: 'endTime' },
  { title: '耗时', dataIndex: 'duration' },
  { title: '覆盖率', dataIndex: 'coverage' },
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

.chart-placeholder {
  min-height: 200px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 100px;
  font-size: 13px;
  color: var(--color-text-2);
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 22px;
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
  width: 100px;
  font-size: 13px;
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

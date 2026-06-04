<template>
  <div class="gi_page sanitation-overview">
    <ModuleHeader
      title="龙安智慧环卫运营概览"
      subtitle="围绕车辆、箱体、中转站、焚烧厂、人员、任务、告警、工单和报表形成生活垃圾收运业务闭环。"
      phase="全阶段"
      priority="项目总览"
      module="智慧环卫"
    >
      <template #extra>
        <a-button type="primary" @click="router.push('/sanitation/command-center')">
          <template #icon><icon-dashboard /></template>
          数字大屏
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="dashboardMetrics" />

    <a-grid :cols="24" :col-gap="14" :row-gap="14">
      <a-grid-item :span="{ xs: 24, lg: 16 }">
        <div class="panel">
          <div class="panel-title">试运营闭环态势</div>
          <SituationMap :points="mapPoints" />
        </div>
      </a-grid-item>
      <a-grid-item :span="{ xs: 24, lg: 8 }">
        <div class="panel">
          <div class="panel-title">业务链路</div>
          <a-steps direction="vertical" :current="5" small>
            <a-step title="村庄 / 农户生活垃圾产生" description="收集点、垃圾桶、村庄档案归属" />
            <a-step title="小三轮初级收集" description="GPS 定位、轨迹、任务状态" />
            <a-step title="小勾臂箱暂存" description="满溢、温度、电量、电子锁" />
            <a-step title="中转站压缩暂存" description="站点、箱体、进出站台账" />
            <a-step title="大勾臂车集中转运" description="定位、视频、主动安全、称重" />
            <a-step title="焚烧厂过磅处置" description="地磅采集、数据对账、最终处置" />
          </a-steps>
        </div>
        <div class="panel">
          <div class="panel-title">最新告警</div>
          <a-list :bordered="false" size="small">
            <a-list-item v-for="item in alarms" :key="item.id">
              <a-list-item-meta :title="item.target" :description="item.content" />
              <StatusTag :value="item.status" />
            </a-list-item>
          </a-list>
        </div>
      </a-grid-item>
    </a-grid>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ModuleHeader from './components/ModuleHeader.vue'
import MetricGrid from './components/MetricGrid.vue'
import SituationMap from './components/SituationMap.vue'
import StatusTag from './components/StatusTag.vue'
import { alarms, dashboardMetrics, mapPoints } from './data/mock'

defineOptions({ name: 'SanitationOverview' })

const router = useRouter()
</script>

<style scoped lang="scss">
.sanitation-overview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.panel + .panel {
  margin-top: 14px;
}

.panel-title {
  margin-bottom: 14px;
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 600;
}
</style>


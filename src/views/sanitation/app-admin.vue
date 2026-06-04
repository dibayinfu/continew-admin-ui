<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="管理员端"
      subtitle="项目概况、今日运行、异常查看、统计简报。"
      phase="APP端"
      priority="P0"
      module="移动端"
    >
      <template #extra>
        <a-button type="primary">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </template>
    </ModuleHeader>

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-header">
          <span class="time">10:15</span>
          <span class="battery">🔋 95%</span>
        </div>
        <div class="phone-content">
          <div class="app-top-bar">
            <span class="app-title">管理员端</span>
            <span class="driver-name">李经理</span>
          </div>

          <div class="metrics-grid">
            <div class="metric-card" v-for="m in metrics" :key="m.label">
              <span class="metric-label">{{ m.label }}</span>
              <span class="metric-value">{{ m.value }}</span>
            </div>
          </div>

          <div class="app-section-title">今日运行</div>
          <div class="run-card">
            <div class="run-item">
              <span>在线车辆</span>
              <span class="run-value success">9/11辆</span>
            </div>
            <div class="run-item">
              <span>任务完成</span>
              <span class="run-value success">91.2%</span>
            </div>
            <div class="run-item">
              <span>告警未处理</span>
              <span class="run-value danger">3条</span>
            </div>
            <div class="run-item">
              <span>设备离线</span>
              <span class="run-value warning">2台</span>
            </div>
          </div>

          <div class="app-section-title">异常提醒</div>
          <div class="alert-list">
            <div class="alert-item">
              <div class="alert-dot dot-red"></div>
              <div class="alert-info">
                <span class="alert-title">箱体长时间满溢</span>
                <span class="alert-desc">西上庄村1号箱体满溢3h50min</span>
              </div>
            </div>
            <div class="alert-item">
              <div class="alert-dot dot-orange"></div>
              <div class="alert-info">
                <span class="alert-title">车辆GPS离线</span>
                <span class="alert-desc">豫E2M883 GPS离线超过30分钟</span>
              </div>
            </div>
            <div class="alert-item">
              <div class="alert-dot dot-orange"></div>
              <div class="alert-info">
                <span class="alert-title">称重数据异常</span>
                <span class="alert-desc">豫E3G516称重数据突变</span>
              </div>
            </div>
          </div>

          <div class="app-section-title">快捷操作</div>
          <div class="quick-actions">
            <div class="action-item">
              <icon-dashboard class="action-icon" />
              <span>运营概览</span>
            </div>
            <div class="action-item">
              <icon-file class="action-icon" />
              <span>统计报表</span>
            </div>
            <div class="action-item">
              <icon-settings class="action-icon" />
              <span>系统设置</span>
            </div>
            <div class="action-item">
              <icon-user class="action-icon" />
              <span>个人中心</span>
            </div>
          </div>
        </div>
        <div class="phone-bottom-bar">
          <span class="nav-item active">首页</span>
          <span class="nav-item">数据</span>
          <span class="nav-item">告警</span>
          <span class="nav-item">我的</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModuleHeader from './components/ModuleHeader.vue'
import { appAdminMetrics } from './data/mock-enhanced'

defineOptions({ name: 'SanitationAppAdmin' })

const metrics = appAdminMetrics
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.phone-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.phone-frame {
  width: 375px;
  min-height: 700px;
  background: #f5f5f5;
  border-radius: 30px;
  border: 3px solid #333;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.phone-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px 8px;
  background: #fff;
  font-size: 12px;
  color: #333;
}

.phone-content {
  padding: 0 16px 16px;
  background: #f5f5f5;
}

.app-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.driver-name {
  font-size: 13px;
  color: rgb(var(--arcoblue-6));
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
}

.metric-label {
  font-size: 12px;
  color: #999;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: rgb(var(--arcoblue-6));
  margin-top: 4px;
}

.app-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 12px 0 8px;
}

.run-card {
  padding: 12px;
  background: #fff;
  border-radius: 10px;
}

.run-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;

  &:last-child {
    border-bottom: none;
  }
}

.run-value {
  font-weight: 600;
}

.success { color: rgb(var(--green-6)); }
.warning { color: rgb(var(--orange-6)); }
.danger { color: rgb(var(--red-6)); }

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
}

.alert-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-red { background: rgb(var(--red-6)); }
.dot-orange { background: rgb(var(--orange-6)); }

.alert-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.alert-desc {
  font-size: 12px;
  color: #999;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: #fff;
  border-radius: 10px;
  font-size: 12px;
  color: #666;
}

.action-icon {
  font-size: 24px;
  color: rgb(var(--arcoblue-6));
}

.phone-bottom-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  background: #fff;
  border-top: 1px solid #eee;
}

.nav-item {
  font-size: 12px;
  color: #999;
}

.nav-item.active {
  color: rgb(var(--arcoblue-6));
  font-weight: 600;
}
</style>

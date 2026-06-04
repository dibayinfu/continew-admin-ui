<template>
  <div class="metric-row">
    <div v-for="item in metrics" :key="item.label" class="metric-card">
      <div class="metric-label">
        {{ item.label }}
        <a-tooltip v-if="item.tooltip" :content="item.tooltip">
          <icon-info-circle style="margin-left: 4px; color: var(--color-text-4); cursor: help; font-size: 14px;" />
        </a-tooltip>
      </div>
      <div class="metric-value" :class="`tone-${item.tone || 'normal'}`">
        {{ item.value }}<span>{{ item.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  metrics: Array<{ label: string, value: string | number, unit?: string, tone?: string, tooltip?: string }>
}>()
</script>

<style scoped lang="scss">
.metric-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.metric-card {
  flex-shrink: 0;
  padding: 16px 20px;
  background: var(--color-bg-2);
  border-radius: 6px;
  min-width: 130px;
  border: 1px solid var(--color-border-2);
}

.metric-label {
  color: var(--color-text-3);
  font-size: 13px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.metric-value {
  color: rgb(var(--arcoblue-6));
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;

  span {
    margin-left: 4px;
    font-size: 13px;
    font-weight: 400;
  }

  &.tone-success { color: rgb(var(--green-6)); }
  &.tone-warning { color: rgb(var(--orange-6)); }
  &.tone-danger { color: rgb(var(--red-6)); }
  &.tone-processing { color: rgb(var(--arcoblue-6)); }
  &.tone-offline { color: rgb(var(--gray-6)); }
}

.metric-value {
  margin-top: 10px;
  color: rgb(var(--arcoblue-6));
  font-size: 28px;
  font-weight: 700;
  line-height: 1;

  span {
    margin-left: 4px;
    color: var(--color-text-3);
    font-size: 13px;
    font-weight: 400;
  }
}

.tone-success {
  color: rgb(var(--green-6));
}

.tone-warning {
  color: rgb(var(--orange-6));
}

.tone-danger {
  color: rgb(var(--red-6));
}
</style>


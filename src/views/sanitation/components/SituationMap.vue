<template>
  <div class="situation-map">
    <div class="map-bg">
      <LonganMapFrame />
      <button
        v-for="point in points"
        :key="point.id"
        class="map-point"
        :class="[point.type, `tone-${point.status}`]"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
        @click="selected = point"
      >
        <span />
      </button>
      <div class="route-line route-1" />
      <div class="route-line route-2" />
      <div class="route-line route-3" />
    </div>
    <div class="map-detail">
      <template v-if="selected">
        <div class="detail-title">{{ selected.name }}</div>
        <a-descriptions :column="1" size="small">
          <a-descriptions-item label="类型">{{ selected.category }}</a-descriptions-item>
          <a-descriptions-item label="所属乡镇">{{ selected.town }}</a-descriptions-item>
          <a-descriptions-item label="状态"><StatusTag :value="selected.value || selected.status" /></a-descriptions-item>
        </a-descriptions>
      </template>
      <a-empty v-else description="点击地图对象查看详情" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LonganMapFrame from './LonganMapFrame.vue'
import StatusTag from './StatusTag.vue'
import type { MapPoint } from '../data/mock'

defineProps<{
  points: MapPoint[]
}>()

const selected = ref<MapPoint>()
</script>

<style scoped lang="scss">
.situation-map {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  min-height: 520px;
}

.map-bg {
  position: relative;
  overflow: hidden;
  min-height: 520px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
}

.map-point {
  position: absolute;
  z-index: 3;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transform: translate(-50%, -50%);

  span {
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  &::after {
    position: absolute;
    inset: -8px;
    border: 1px solid currentColor;
    border-radius: 50%;
    animation: pulse 1.8s infinite;
    content: '';
  }
}

.vehicle {
  border-radius: 4px;
}

.station {
  border-radius: 2px;
}

.plant {
  width: 28px;
  height: 28px;
}

.tone-success {
  color: rgb(var(--green-6));
}

.tone-processing {
  color: rgb(var(--arcoblue-6));
}

.tone-warning {
  color: rgb(var(--orange-6));
}

.tone-danger {
  color: rgb(var(--red-6));
}

.tone-offline {
  color: rgb(var(--gray-6));
}

.route-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(var(--arcoblue-6), 0.72), transparent);
  transform-origin: left center;
}

.route-1 {
  left: 20%;
  top: 66%;
  width: 270px;
  transform: rotate(-18deg);
}

.route-2 {
  left: 37%;
  top: 56%;
  width: 260px;
  transform: rotate(-28deg);
}

.route-3 {
  left: 54%;
  top: 40%;
  width: 210px;
  transform: rotate(18deg);
}

.map-detail {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.detail-title {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

@keyframes pulse {
  from {
    opacity: 0.8;
    transform: scale(0.65);
  }

  to {
    opacity: 0;
    transform: scale(1.8);
  }
}
</style>

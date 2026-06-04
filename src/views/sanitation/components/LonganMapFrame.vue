<template>
  <div class="longan-map-frame" :class="{ dark }">
    <iframe
      title="安阳市龙安区地图"
      src="https://ditu.amap.com/search?query=%E5%AE%89%E9%98%B3%E5%B8%82%E9%BE%99%E5%AE%89%E5%8C%BA&city=410500"
      loading="lazy"
    />
    <div class="map-mask" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  dark?: boolean
}>()
</script>

<style scoped lang="scss">
.longan-map-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(var(--arcoblue-6), 0.08) 1px, transparent 1px),
    linear-gradient(rgba(var(--arcoblue-6), 0.08) 1px, transparent 1px),
    var(--color-bg-2);
  background-size: 34px 34px, 34px 34px, 100% 100%;

  iframe {
    position: absolute;
    inset: -56px 0 0;
    width: 100%;
    height: calc(100% + 56px);
    border: 0;
  }
}

.map-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04)),
    radial-gradient(circle at 50% 50%, transparent 32%, rgba(255, 255, 255, 0.16));
}

.dark {
  background: #06101f;

  iframe {
    filter: saturate(1.2) contrast(1.05) brightness(0.58) hue-rotate(168deg);
  }

  .map-mask {
    background:
      linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px),
      radial-gradient(circle at 50% 48%, rgba(34, 211, 238, 0.05), rgba(2, 6, 23, 0.18) 58%, rgba(2, 6, 23, 0.72)),
      linear-gradient(180deg, rgba(6, 16, 31, 0.2), rgba(6, 16, 31, 0.68));
    background-size: 48px 48px, 48px 48px, 100% 100%, 100% 100%;
  }
}
</style>


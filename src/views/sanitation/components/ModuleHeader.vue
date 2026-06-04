<template>
  <div class="module-header">
    <div>
      <a-space>
        <a-tag color="arcoblue">{{ phase }}</a-tag>
        <a-tag color="orangered">{{ priority }}</a-tag>
        <a-tag>{{ module }}</a-tag>
      </a-space>
      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>
    <a-space>
      <slot name="extra" />
    </a-space>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  phase: string
  priority: string
  module: string
}>()
</script>

<style scoped lang="scss">
.module-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: var(--color-bg-2);
  border-radius: 4px;

  h2 {
    margin: 10px 0 6px;
    color: var(--color-text-1);
    font-size: 20px;
    font-weight: 600;
  }

  p {
    max-width: 900px;
    margin: 0;
    color: var(--color-text-3);
    line-height: 1.7;
  }
}
</style>


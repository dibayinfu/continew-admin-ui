<template>
  <svg class="box-history-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="type === 'fillLevel'"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></template>
    <template v-else-if="type === 'temperature'"><path d="M10 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0ZM13 8v9M17 5h3M17 9h2" /><circle cx="13" cy="18" r="1.7" fill="currentColor" stroke="none" /></template>
    <template v-else-if="type === 'battery'"><rect x="2" y="6" width="18" height="12" rx="2" /><path d="M22 10v4M6 10v4M10 10v4M14 10v4" /></template>
    <template v-else><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h9a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h4M12 18l3 3-3 2" /></template>
  </svg>
</template>
<script setup lang="ts">
import type { BoxHistoryView } from '../box-history-metrics'
defineProps<{ type: BoxHistoryView }>()
</script>
<style scoped>
.box-history-icon { display: inline-block; width: 16px; height: 16px; vertical-align: middle; flex-shrink: 0; }
</style>

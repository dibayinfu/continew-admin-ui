<template>
  <PrototypeTablePage :page-key="pageKey" />
</template>

<script setup lang="ts">
import PrototypeTablePage from './components/PrototypeTablePage.vue'

defineOptions({ name: 'SanitationPrototypePage' })

defineProps<{
  pageKey: string
}>()
</script>


<template>
  <a-tag :color="tagColor" size="small">{{ value || '-' }}</a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { statusToneMap } from '../data/mock'

const props = defineProps<{
  value?: string | number
}>()

const tagColor = computed(() => {
  const tone = statusToneMap[String(props.value)] || 'processing'
  const map = {
    success: 'green',
    normal: 'arcoblue',
    processing: 'arcoblue',
    warning: 'orangered',
    danger: 'red',
    offline: 'gray',
  }
  return map[tone]
})
</script>


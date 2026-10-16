<template>
  <section class="weather-card">
    <header><b>{{ weather.city }} · 天气</b><small>北京时间</small></header>
    <template v-if="weather.status === 'SUPPORTED'">
      <div class="current"><strong>{{ number(weather.current?.temperature) }}℃</strong><span>{{ weather.current?.condition || '天气状态未知' }}</span></div>
      <small v-if="weather.current?.time">当前估算 {{ weather.current.time.replace('T', ' ') }}</small>
      <small>湿度 {{ number(weather.current?.humidity) }}% · 风速 {{ number(weather.current?.windSpeed) }} km/h</small>
      <table v-if="weather.forecast?.length"><thead><tr><th>日期</th><th>天气</th><th>气温</th><th>降雨概率</th></tr></thead><tbody>
        <tr v-for="day in weather.forecast" :key="day.date"><td>{{ day.date.slice(5) }}</td><td>{{ day.condition }}</td><td>{{ number(day.minTemperature) }}～{{ number(day.maxTemperature) }}℃</td><td>{{ number(day.rainProbability) }}%</td></tr>
      </tbody></table>
      <small>{{ weather.dataKind }} · 来源 Open-Meteo</small>
    </template>
    <template v-else>
      <p>{{ weather.message || '暂无天气数据' }}</p>
      <p v-if="weather.candidates?.length">{{ weather.candidates.join('；') }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { AiWeather } from '../box-map-ai'
defineProps<{ weather: AiWeather }>()
function number(value?: number | null) { return value != null && Number.isFinite(value) ? `${Number(value.toFixed(1))}` : '未知' }
</script>

<style scoped>
.weather-card { display: grid; gap: 8px; margin-top: 10px; padding: 10px; border: 1px solid var(--color-border-2); border-radius: 6px; background: var(--color-bg-2); }
header { display: flex; justify-content: space-between; gap: 4px; }
b { color: var(--color-text-1); font-size: 12px; }
small, p { color: var(--color-text-3); font-size: 10px; line-height: 1.6; margin: 0; }
.current { display: flex; align-items: baseline; gap: 12px; color: var(--color-text-2); }
strong { color: rgb(var(--primary-6)); font-size: 26px; }
table { width: 100%; border-collapse: collapse; font-size: 11px; color: var(--color-text-2); }
th, td { padding: 6px 3px; text-align: left; border-bottom: 1px solid var(--color-fill-2); }
th { color: var(--color-text-3); font-weight: normal; }
</style>

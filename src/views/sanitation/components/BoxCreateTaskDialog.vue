<template>
  <a-modal :visible="true" title="创建收运任务单" :width="760" :mask-closable="false" unmount-on-close @cancel="emit('close')">
    <p class="demo-notice" role="alert">当前仅为演示，正式功能正在开发中</p>
    <section class="task-box-info">
      <h3>箱体信息</h3>
      <a-form :model="form" layout="vertical">
        <a-form-item label="箱体编号"><a-input :model-value="box.boxNo" disabled aria-label="箱体编号" /></a-form-item>
      </a-form>
      <div class="origin-info"><span>始发地：<b>{{ box.pointName || '未匹配收集点' }}</b></span><span>{{ [box.townshipName, box.villageName].filter(Boolean).join(' · ') }}</span></div>
    </section>
    <div class="task-section-title"><h3>任务配置</h3><a-button type="primary" :loading="loading" :disabled="!box.pointId || !box.townshipName" @click="smartFill"><template #icon><icon-thunderbolt /></template>智能派单</a-button></div>
    <p class="smart-help">分析出相对合适的车辆，可能会出错，请人工确认</p>
    <a-alert v-if="fillNotice" :type="fillError ? 'warning' : 'info'" class="fill-notice">{{ fillNotice }}</a-alert>
    <a-alert v-if="!box.pointId" type="warning" class="fill-notice">当前箱体未匹配收集点，暂无法智能派单或创建演示运单。</a-alert>
    <a-form :model="form" layout="vertical" class="task-config">
      <a-form-item label="目的地" required><a-auto-complete v-model="form.destination" :data="destinationOptions" placeholder="选择或输入目的地" allow-clear /></a-form-item>
      <a-form-item label="驾驶员" required><a-auto-complete v-model="form.driver" :data="driverOptions" placeholder="选择或输入驾驶员" allow-clear @select="onDriverSelect" /></a-form-item>
      <a-form-item label="车牌号" required><a-auto-complete v-model="form.vehicle" :data="vehicleOptions" placeholder="选择或输入车牌号" allow-clear /></a-form-item>
      <a-form-item label="时效要求" required><a-auto-complete v-model="form.timeRequirement" :data="['30分钟', '60分钟', '90分钟', '120分钟']" placeholder="例如：60分钟" allow-clear /></a-form-item>
      <a-form-item label="优先级" required><a-auto-complete v-model="form.priority" :data="['普通', '紧急']" placeholder="选择或输入优先级" allow-clear /></a-form-item>
    </a-form>
    <template #footer><a-button @click="emit('close')">取消</a-button><a-button type="primary" :disabled="loading || !box.pointId" @click="confirmDemo">确定</a-button></template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { destinations, drivers } from '../data/alert-task'
import { getDriverVehicles, vehicles } from '../data/mock'

const props = defineProps<{ box: { boxNo: string, pointId?: number, pointName: string, townshipName: string, villageName: string } }>()
const emit = defineEmits<{ close: [] }>()
const form = reactive({ destination: '', driver: '', vehicle: '', timeRequirement: '', priority: '' })
const loading = ref(false)
const fillNotice = ref('')
const fillError = ref(false)
const destinationOptions = destinations.map(item => item.name)
const driverOptions = drivers.map(item => item.name)
const vehicleOptions = computed(() => [...new Set([...getDriverVehicles(form.driver).map(item => item.plateNo), ...vehicles.map(item => item.plateNo)])])
const BASE_URL = (import.meta.env.VITE_COLLECTOR_API_BASE_URL || '').replace(/\/$/, '')
let controller: AbortController | undefined
let disposed = false
function onDriverSelect(name: string) {
  form.vehicle = getDriverVehicles(name)[0]?.plateNo || ''
}
async function smartFill() {
  if (loading.value || !props.box.pointId) return
  loading.value = true
  fillNotice.value = ''
  fillError.value = false
  const abort = new AbortController()
  controller = abort
  const timeout = window.setTimeout(() => abort.abort(), 15000)
  try {
    const query = new URLSearchParams({ pointId: String(props.box.pointId), pointName: props.box.pointName, townshipName: props.box.townshipName })
    const response = await fetch(`${BASE_URL}/api/collector/transport-tasks/latest-origin?${query}`, { signal: abort.signal })
    if (!response.ok) throw new Error('历史运单查询失败，请稍后重试')
    const result = await response.json() as { found: boolean, matchType?: 'current' | 'nearby', task?: Record<string, unknown> }
    if (disposed) return
    if (!result.found || !result.task) {
      fillError.value = true
      fillNotice.value = '当前收集点及同乡镇5公里内的相邻收集点均未找到已同步历史运单，请手动填写。'
      return
    }
    const task = result.task
    const fields = ['destination', 'driver', 'vehicle', 'timeRequirement', 'priority'] as const
    const missing: string[] = []
    const labels = { destination: '目的地', driver: '驾驶员', vehicle: '车牌号', timeRequirement: '时效要求', priority: '优先级' }
    for (const key of fields) {
      const value = task[key]
      const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
      form[key] = key === 'priority' ? ({ urgent: '紧急', normal: '普通', 紧急: '紧急', 普通: '普通' } as Record<string, string>)[text.toLowerCase()] || '' : text
      if (!form[key]) missing.push(labels[key])
    }
    fillError.value = missing.length > 0
    const nearby = result.matchType === 'nearby'
      ? `当前收集点暂无历史运单，已参考相邻收集点“${task.sourcePointName || '未知点位'}”（直线距离${formatDistance(task.distanceMeters)}）。`
      : ''
    fillNotice.value = `${nearby}${missing.length ? `缺少${missing.join('、')}，请手动补充。` : ''}`
  } catch (error) {
    if (disposed) return
    fillError.value = true
    fillNotice.value = error instanceof Error && error.name !== 'AbortError' ? error.message : '查询超时，请重试'
  } finally {
    window.clearTimeout(timeout)
    if (!disposed) loading.value = false
  }
}
function formatDistance(value: unknown) {
  const meters = Number(value)
  if (!Number.isFinite(meters) || meters < 0) return '未知'
  return meters < 1000 ? `${Math.round(meters)}米` : `${(meters / 1000).toFixed(1)}公里`
}
function confirmDemo() {
  if (!props.box.pointId || Object.values(form).some(value => !value.trim())) {
    Message.warning('请补全始发收集点及任务配置')
    return
  }
  // 演示确认仅展示普通提示并保留弹窗，不调用真实创建接口。
  Message.info(`箱体 ${props.box.boxNo} 的运单创建演示已完成，未实际创建运单`)
}
onBeforeUnmount(() => { disposed = true; controller?.abort() })
</script>

<style scoped>
.demo-notice { padding: 12px 16px; margin: 0 0 18px; border: 1px solid rgb(var(--danger-3)); border-radius: 6px; color: rgb(var(--danger-6)); background: rgb(var(--danger-1)); font-weight: 600; }
h3 { margin: 0; font-size: 15px; }
.task-box-info { padding: 16px; margin-bottom: 20px; border: 1px solid var(--color-border-2); border-radius: 8px; background: var(--color-fill-1); }
.task-box-info h3 { margin-bottom: 12px; }
.task-box-info :deep(.arco-form-item) { margin-bottom: 12px; }
.origin-info { display: flex; gap: 8px 20px; flex-wrap: wrap; color: var(--color-text-2); }
.task-section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.smart-help { color: var(--color-text-3); font-size: 12px; }
.fill-notice { margin-bottom: 16px; }
.task-config { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
@media (max-width: 600px) { .task-config { grid-template-columns: 1fr; } }
</style>

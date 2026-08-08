<template>
  <div class="slider-captcha" :class="{ 'is-pass': passed }">
    <div class="sc-visual" @click="passed ? undefined : loadCaptcha()" :title="passed ? '' : '点击刷新验证码'">
      <img v-if="bgImg" :src="bgImg" class="sc-bg" alt="验证码背景" draggable="false" />
      <img v-if="templateImg" :src="templateImg" class="sc-template" alt="" draggable="false" :style="{ transform: `translateX(${moveX}px)` }" />
      <div v-if="loading" class="sc-overlay"><icon-loading /> 加载中</div>
      <div v-if="passed" class="sc-overlay sc-passed"><icon-check-circle-fill /> 验证通过</div>
      <div class="sc-refresh" v-if="!passed && !loading" @click.stop="loadCaptcha"><icon-refresh /></div>
    </div>
    <div class="sc-track">
      <div class="sc-track-fill" :style="{ width: `${moveX}px` }"></div>
      <div class="sc-handle" :class="{ 'is-dragging': dragging }" @pointerdown.prevent="onDown">
        <icon-right />
      </div>
    </div>
    <div class="sc-tip">{{ tipText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const emit = defineEmits<{ (e: 'success', captchaId: string): void }>()

/** daas-api 滑块验证码：与 daas 前端一致的渲染尺寸与最大拖动距离 */
const API = 'https://daas-api.seazonmotor.com'
const CAPTCHA_END = 206   // 最大拖动距离(px)：轨道 260 - 手柄 54
const RENDER_W = 260      // 背景渲染宽度(px)，check 提交该值
const RENDER_H = 159
const TEMPLATE_W = 49     // 模板渲染宽度 = 260 * 110/590
const TEMPLATE_H = 159

const bgImg = ref('')
const templateImg = ref('')
const captchaId = ref('')
const loading = ref(false)
const checking = ref(false)
const passed = ref(false)
const moveX = ref(0)
const dragging = ref(false)
const tipText = computed(() => {
  if (loading.value) return '验证码加载中…'
  if (checking.value) return '验证中…'
  if (passed.value) return '验证通过'
  return '向右拖动滑块完成拼图'
})

let startX = 0
let startY = 0
let startTime = 0
let track: Array<{ x: number, y: number, type: string, t: number }> = []

async function loadCaptcha() {
  loading.value = true
  checking.value = false
  passed.value = false
  moveX.value = 0
  track = []
  try {
    const res = await fetch(`${API}/user/captcha/generate`, { cache: 'no-store' })
    const json = await res.json() as { data?: { id?: string, captcha?: { backgroundImage?: string, templateImage?: string } } }
    const d = json?.data
    if (!d?.id || !d.captcha?.backgroundImage || !d.captcha.templateImage) throw new Error('captcha invalid')
    captchaId.value = d.id
    bgImg.value = d.captcha.backgroundImage
    templateImg.value = d.captcha.templateImage
  } catch {
    captchaId.value = ''
    bgImg.value = ''
    templateImg.value = ''
  } finally {
    loading.value = false
  }
}

function formatTime(date: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

function onDown(e: PointerEvent) {
  if (passed.value || loading.value || checking.value || !captchaId.value) return
  dragging.value = true
  startX = e.clientX
  startY = e.clientY
  startTime = Date.now()
  moveX.value = 0
  track = [{ x: 0, y: 0, type: 'down', t: 0 }]
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onMove(e: PointerEvent) {
  if (!dragging.value) return
  const x = Math.max(0, Math.min(CAPTCHA_END, Math.round(e.clientX - startX)))
  const y = Math.round(e.clientY - startY)
  moveX.value = x
  track.push({ x, y, type: 'move', t: Date.now() - startTime })
}

function onUp(e: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  const x = Math.max(0, Math.min(CAPTCHA_END, Math.round(e.clientX - startX)))
  const y = Math.round(e.clientY - startY)
  track.push({ x, y, type: 'up', t: Date.now() - startTime })
  submitCheck()
}

async function submitCheck() {
  if (!captchaId.value || !track.length) return
  checking.value = true
  try {
    const payload = {
      bgImageWidth: RENDER_W,
      bgImageHeight: RENDER_H,
      templateImageWidth: TEMPLATE_W,
      templateImageHeight: TEMPLATE_H,
      startSlidingTime: formatTime(new Date(startTime)),
      entSlidingTime: formatTime(new Date()),
      trackList: track,
    }
    const res = await fetch(`${API}/user/captcha/check?id=${captchaId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json() as { data?: boolean }
    if (json?.data) {
      passed.value = true
      emit('success', captchaId.value)
    } else {
      await loadCaptcha()
    }
  } catch {
    await loadCaptcha()
  } finally {
    checking.value = false
  }
}

function reset() {
  moveX.value = 0
  passed.value = false
  track = []
  loadCaptcha()
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})

loadCaptcha()
defineExpose({ reset })
</script>

<style scoped lang="scss">
.slider-captcha { width: 260px; user-select: none; }
.sc-visual { position: relative; width: 260px; height: 159px; overflow: hidden; border-radius: 4px; background: #e5e6eb; cursor: pointer; }
.sc-bg { width: 260px; height: 159px; display: block; }
.sc-template { position: absolute; left: 0; top: 0; width: 49px; height: 159px; will-change: transform; pointer-events: none; }
.sc-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgb(255 255 255 / 60%); color: #4e5969; font-size: 13px; }
.sc-passed { color: #00b42a; font-weight: 600; }
.sc-refresh { position: absolute; top: 6px; right: 6px; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: rgb(255 255 255 / 88%); color: #4e5969; font-size: 14px; cursor: pointer; }
.sc-track { position: relative; width: 260px; height: 42px; margin-top: 8px; border-radius: 4px; background: #e5e6eb; overflow: hidden; }
.sc-track-fill { position: absolute; left: 0; top: 0; bottom: 0; background: #94bfff; }
.sc-handle { position: absolute; left: 0; top: 0; width: 54px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 4px; background: #fff; box-shadow: 0 2px 6px rgb(29 33 41 / 20%); color: #4e5969; font-size: 16px; cursor: grab; }
.sc-handle.is-dragging { cursor: grabbing; color: #165dff; }
.sc-tip { margin-top: 6px; color: #86909c; font-size: 12px; }
</style>

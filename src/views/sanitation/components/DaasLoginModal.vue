<template>
  <a-modal
    :visible="daasAuth.visible"
    title="登录获取接口 Token"
    :width="520"
    :footer="false"
    :mask-closable="false"
    :unmount-on-close="true"
    @cancel="cancel"
  >
    <p class="daas-tip">
      {{ daasAuth.expired ? '接口 Token 已过期，请重新登录。' : '调用云端接口需要登录，登录后自动保存 Token。' }}
      滑块验证由人工拖动，失败会自动刷新，重试即可。
    </p>
    <a-form v-if="!manualMode" :model="form" layout="vertical">
      <a-form-item label="账号">
        <a-input v-model="form.username" placeholder="请输入账号" allow-clear>
          <template #prefix><icon-user /></template>
        </a-input>
      </a-form-item>
      <a-form-item label="密码">
        <a-input-password v-model="form.password" placeholder="请输入密码" allow-clear>
          <template #prefix><icon-lock /></template>
        </a-input-password>
      </a-form-item>
      <a-form-item label="滑块验证">
        <SliderCaptcha ref="captchaRef" @success="onCaptchaSuccess" />
      </a-form-item>
    </a-form>
    <template v-else>
      <p class="daas-tip">粘贴 daas-api 返回的原始 JWT，无需添加 <code>Bearer </code> 前缀。</p>
      <a-textarea v-model="manualToken" :auto-size="{ minRows: 5, maxRows: 8 }" placeholder="粘贴 Token" />
    </template>
    <a-space class="modal-actions" direction="vertical" fill>
      <a-button v-if="!manualMode" long type="primary" :loading="submitting" :disabled="!captchaId" @click="doLogin">登录</a-button>
      <a-button v-else long type="primary" :loading="submitting" :disabled="!manualToken.trim()" @click="saveManualToken">保存 Token</a-button>
      <a-button type="text" size="small" @click="manualMode = !manualMode">{{ manualMode ? '返回账号登录' : '手动配置 Token' }}</a-button>
    </a-space>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import SliderCaptcha from './SliderCaptcha.vue'
import {
  daasAuth,
  DAS_API_BASE,
  DAS_CLIENT_ID,
  DAS_CLIENT_SECRET,
  notifyDaasLoginSuccess,
  syncCollectorToken,
  cancelDaasLogin,
} from '@/utils/daas'

defineOptions({ name: 'DaasLoginModal' })

const form = reactive({ username: '', password: '' })
const submitting = ref(false)
const captchaId = ref('')
const captchaRef = ref<InstanceType<typeof SliderCaptcha>>()
const manualMode = ref(false)
const manualToken = ref('')

// 每次打开弹窗时重置验证码状态（组件因 unmount-on-close 会重新挂载并加载新验证码）
watch(() => daasAuth.visible, (visible) => {
  if (visible) captchaId.value = ''
})

function onCaptchaSuccess(id: string) {
  captchaId.value = id
}
function cancel() {
  cancelDaasLogin()
}

async function saveManualToken() {
  const token = manualToken.value.trim().replace(/^Bearer\s+/i, '')
  if (!token) return
  submitting.value = true
  try {
    await syncCollectorToken(token)
    notifyDaasLoginSuccess(token)
    Message.success('Token 已保存并同步到采集服务')
  } catch (error) {
    Message.error(`Token 同步失败：${error instanceof Error ? error.message : '请检查采集服务'}`)
  } finally { submitting.value = false }
}

async function doLogin() {
  const username = form.username.trim()
  const password = form.password
  if (!username || !password) { Message.warning('请输入账号和密码'); return }
  if (!captchaId.value) { Message.warning('请先完成滑块验证'); return }
  submitting.value = true
  try {
    const url = `${DAS_API_BASE}/oauth/token`
      + `?grant_type=password`
      + `&client_id=${encodeURIComponent(DAS_CLIENT_ID)}`
      + `&client_secret=${encodeURIComponent(DAS_CLIENT_SECRET)}`
      + `&username=${encodeURIComponent(username)}`
      + `&password=${encodeURIComponent(password)}`
      + `&captcha=${encodeURIComponent(captchaId.value)}`
      + `&ota=0&channel=1`
    const res = await fetch(url, { method: 'POST' })
    const json = await res.json() as { code?: number, message?: string, data?: { token?: string, refreshToken?: string } }
    if (json.code !== 200 || !json.data?.token) {
      Message.error(json.message || '登录失败')
      captchaRef.value?.reset?.()
      captchaId.value = ''
      return
    }
    try {
      await syncCollectorToken(json.data.token)
      Message.success('登录成功，Token 已同步到采集服务')
    } catch (error) {
      Message.warning(`登录成功，但 Token 同步失败：${error instanceof Error ? error.message : '请检查采集服务'}`)
    } finally {
      // 即使采集服务暂时不可用，也保留浏览器登录状态，避免影响当前页面请求。
      notifyDaasLoginSuccess(json.data.token, json.data.refreshToken)
    }
  } catch {
    Message.error('登录请求失败，请检查网络')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.daas-tip { margin-top: 0; color: #4e5969; }
.daas-tip code { padding: 1px 4px; background: #f2f3f5; }
.modal-actions { width: 100%; margin-top: 12px; }
</style>

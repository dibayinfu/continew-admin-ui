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
    <a-form :model="form" layout="vertical">
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
    <a-button long type="primary" :loading="submitting" :disabled="!captchaId" @click="doLogin">登录</a-button>
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
  cancelDaasLogin,
} from '@/utils/daas'

defineOptions({ name: 'DaasLoginModal' })

const form = reactive({ username: '', password: '' })
const submitting = ref(false)
const captchaId = ref('')
const captchaRef = ref<InstanceType<typeof SliderCaptcha>>()

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
    notifyDaasLoginSuccess(json.data.token, json.data.refreshToken)
    Message.success('登录成功，Token 已保存')
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
</style>

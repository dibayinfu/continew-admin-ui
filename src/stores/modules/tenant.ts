import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'

const storeSetup = () => {
  interface TenantInfo {
    tenantEnabled: boolean
    tenantCode: string
  }
  const tenantInfo = reactive<TenantInfo>({
    tenantEnabled: false,
    tenantCode: '',
  })
  const tenantEnabled = computed(() => tenantInfo.tenantEnabled)
  const tenantCode = computed(() => tenantInfo.tenantCode)
  const setTenantEnable = (tenantStatus: boolean) => {
    tenantInfo.tenantEnabled = tenantStatus
  }
  const setTenantCode = (tenantCode: string) => {
    tenantInfo.tenantCode = tenantCode
  }
  return {
    tenantCode,
    tenantEnabled,
    setTenantCode,
    setTenantEnable,
  }
}

export const useTenantStore = defineStore('tenant', storeSetup, {
  persist: { paths: ['tenantInfo'], storage: localStorage },
})

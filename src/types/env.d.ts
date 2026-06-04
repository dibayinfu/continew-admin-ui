/// <reference types="vite/client" />

/** 声明环境变量的类型 */
interface ImportMetaEnv {
  readonly VITE_API_PREFIX: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_BASE: string
  readonly VITE_APP_SETTING: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_AMAP_KEY: string
  readonly VITE_API_WS_URL: string
  readonly VITE_PROTOTYPE_MODE?: string
  readonly VITE_PROTOTYPE_HOME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

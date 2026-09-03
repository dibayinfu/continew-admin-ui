export interface AMapOverlay {
  setMap: (map: AMapInstance | null) => void
}

export interface AMapMarker {
  setMap: (map: AMapInstance | null) => void
  on: (event: string, handler: () => void) => void
}

export interface AMapMassMarks {
  setMap: (map: AMapInstance | null) => void
  on: (event: string, handler: (event: { data: unknown }) => void) => void
}

export interface AMapCircle {
  setMap: (map: AMapInstance | null) => void
}

export interface AMapPolyline {
  setMap: (map: AMapInstance | null) => void
}

export interface AMapInfoWindow {
  open: (map: AMapInstance, position?: [number, number]) => void
  close: () => void
}

export interface AMapInstance {
  destroy: () => void
  getZoom: () => number
  on: (event: string, handler: () => void) => void
  /** 容器尺寸变化后通知地图重算（全屏切换时使用） */
  resize: () => void
  setMapStyle: (style: string) => void
  setFitView: (markers?: AMapMarker[], immediately?: boolean, padding?: [number, number, number, number]) => void
  setZoomAndCenter: (zoom: number, center: [number, number]) => void
  setCenter: (center: [number, number]) => void
}

export interface AMapNamespace {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapInstance
  Marker: new (options: Record<string, unknown>) => AMapMarker
  MassMarks: new (data: Array<Record<string, unknown>>, options: Record<string, unknown>) => AMapMassMarks
  Circle: new (options: Record<string, unknown>) => AMapCircle
  Polyline: new (options: Record<string, unknown>) => AMapPolyline
  InfoWindow: new (options: Record<string, unknown>) => AMapInfoWindow
  LngLat: new (lng: number, lat: number) => unknown
  Pixel: new (x: number, y: number) => unknown
  Size: new (width: number, height: number) => unknown
}

let loader: Promise<AMapNamespace> | undefined

function getAmapWindow() {
  return window as typeof window & {
    AMap?: AMapNamespace
    _AMapSecurityConfig?: { securityJsCode?: string }
  }
}

/** 统一加载高德 JS API：优先使用 JS API Key，兼容已有 VITE_AMAP_KEY 配置。 */
export function loadAmapJsApi(): Promise<AMapNamespace> {
  const amapWindow = getAmapWindow()
  if (amapWindow.AMap) return Promise.resolve(amapWindow.AMap)
  if (loader) return loader

  const key = import.meta.env.VITE_AMAP_JS_KEY || import.meta.env.VITE_AMAP_KEY
  if (!key) return Promise.reject(new Error('缺少高德地图 JS API Key（VITE_AMAP_JS_KEY）'))

  if (import.meta.env.VITE_AMAP_SECURITY_JS_CODE) {
    amapWindow._AMapSecurityConfig = { securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE }
  }

  loader = new Promise<AMapNamespace>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = window.setTimeout(() => reject(new Error('高德地图加载超时')), 12_000)
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.async = true
    script.onload = () => {
      window.clearTimeout(timeout)
      const amap = getAmapWindow().AMap
      if (amap) resolve(amap)
      else reject(new Error('高德地图未初始化'))
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error('高德地图加载失败'))
    }
    document.head.appendChild(script)
  })

  return loader
}

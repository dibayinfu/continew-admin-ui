import { longanVillageArchives, wgs84ToGcj02 } from './longan-archive'

export interface MapEntity {
  id: string
  type: '车辆' | '箱体' | '告警' | '任务' | '收集点' | '中转站' | '焚烧厂'
  layer: string
  kind: string
  status: string
  icon: string
  name: string
  lng: number
  lat: number
  alarm?: boolean
  pulse?: boolean
  onlineText: string
  statusTags?: Array<'满溢' | '低电量' | '高温'>
  image?: string
  details: Array<{ label: string, value: string }>
  relations: Array<{ label: string, value: string }>
}

// 使用 Vite 的基础路径，兼容 GitHub Pages 在 /continew-admin-ui/ 子路径下部署。
const MAP_ICON_BASE = `${import.meta.env.BASE_URL}static/images/command-center-v2/map-icons`
export const mapLayerIconMap: Record<string, string> = {
  smallTruck: `${MAP_ICON_BASE}/tricycle.png`,
  hookTruck: `${MAP_ICON_BASE}/hook-truck.png`,
  largeTruck: `${MAP_ICON_BASE}/large-hook-truck.png`,
  smallBox: `${MAP_ICON_BASE}/small-box.png`,
  largeBox: `${MAP_ICON_BASE}/large-box.png`,
  collectionPoint: `${MAP_ICON_BASE}/collection-point.png`,
  station: `${MAP_ICON_BASE}/transfer-station.png`,
  plant: `${MAP_ICON_BASE}/incineration-plant.png`,
  alarm: `${MAP_ICON_BASE}/alarm-beacon.png`,
}

export const LONGAN_BOUNDS = {
  west: 113.985,
  east: 114.365,
  south: 35.955,
  north: 36.115,
}

export const vehicleImage
  = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 130"><rect x="32" y="45" width="128" height="48" rx="8" fill="%23dff7ef" stroke="%2325d36f" stroke-width="5"/><rect x="150" y="60" width="38" height="33" rx="5" fill="%23e8fff7" stroke="%2325d36f" stroke-width="5"/><rect x="48" y="56" width="34" height="20" fill="%239bd7ff"/><rect x="92" y="56" width="36" height="20" fill="%239bd7ff"/><circle cx="66" cy="98" r="14" fill="%2320262e"/><circle cx="160" cy="98" r="14" fill="%2320262e"/><path d="M36 42h122l-10-18H52z" fill="%2325d36f"/></svg>'

export const initialMapEntities: MapEntity[] = [
  {
    id: 'v1',
    type: '车辆',
    layer: 'smallTruck',
    kind: 'truck-small',
    status: 'online',
    icon: '▣',
    name: '豫E01622D',
    lng: 114.2986,
    lat: 36.0952,
    onlineText: '在线  运行中',
    image: vehicleImage,
    details: [
      { label: '车辆类型', value: '小三轮车' },
      { label: '车牌号', value: '豫E01622D' },
      { label: '司机', value: '张师傅 138****6622' },
      { label: '速度', value: '35 km/h' },
      { label: '方向', value: '东北' },
      { label: '任务', value: '乡镇A-村庄3-收运' },
      { label: '位置', value: '文明大道与龙安路交叉口' },
      { label: '上报时间', value: '10:30:30' },
    ],
    relations: [
      { label: '正在服务箱体', value: '2 个' },
      { label: '附近告警', value: '1 条未处理' },
      { label: '当前任务进度', value: '65%' },
    ],
  },
  { id: 'v2', type: '车辆', layer: 'hookTruck', kind: 'truck-hook', status: 'online', icon: '▣', name: '豫E3G516', lng: 114.3268, lat: 36.0724, onlineText: '在线  收运中', details: [{ label: '车辆类型', value: '小勾臂车' }, { label: '司机', value: '李师傅' }, { label: '速度', value: '42 km/h' }, { label: '任务', value: '箱体满溢收运' }], relations: [{ label: '关联箱体', value: 'XB-龙泉-008' }] },
  { id: 'v3', type: '车辆', layer: 'largeTruck', kind: 'truck-large', status: 'online', icon: '▣', name: '豫E6N109', lng: 114.2442, lat: 36.0648, onlineText: '在线  转运中', details: [{ label: '车辆类型', value: '大勾臂车' }, { label: '司机', value: '孙师傅' }, { label: '速度', value: '48 km/h' }, { label: '载重', value: '13.8 吨' }], relations: [{ label: '目的地', value: '焚烧厂' }] },
  { id: 'b1', type: '箱体', layer: 'smallBox', kind: 'small-box', status: 'warning', icon: '▥', name: 'XB-012', lng: 114.3098, lat: 36.0872, alarm: true, onlineText: '在线  满溢预警', details: [{ label: '箱体类型', value: '小勾臂箱' }, { label: '满溢率', value: '92%' }, { label: '电量', value: '68%' }, { label: '位置', value: '马投涧镇牛家窑村' }], relations: [{ label: '待处理告警', value: '满溢告警' }] },
  { id: 'b2', type: '箱体', layer: 'largeBox', kind: 'large-box', status: 'danger', icon: '▤', name: 'DB-005', lng: 114.2796, lat: 36.0544, alarm: true, onlineText: '在线  严重满溢', details: [{ label: '箱体类型', value: '大勾臂箱' }, { label: '满溢率', value: '96%' }, { label: '所属站点', value: '马投涧中转站' }], relations: [{ label: '建议任务', value: '大勾臂车转运' }] },
  { id: 'c1', type: '任务', layer: 'collectionPoint', kind: 'collection', status: 'online', icon: '●', name: '收集点', lng: 114.3568, lat: 36.0676, onlineText: '运行正常', details: [{ label: '收集点', value: '文明大道收集点' }, { label: '服务范围', value: '3 个村庄' }, { label: '今日投放', value: '4.8 吨' }], relations: [{ label: '附近车辆', value: '2 辆' }] },
  { id: 's1', type: '箱体', layer: 'station', kind: 'station', status: 'online', icon: '⌂', name: '中转站', lng: 114.3245, lat: 36.0462, onlineText: '运行正常', details: [{ label: '站点名称', value: '文明大道中转站' }, { label: '在站箱体', value: '4 个' }, { label: '今日进站', value: '28 趟' }], relations: [{ label: '关联车辆', value: '6 辆' }] },
  { id: 'p1', type: '任务', layer: 'plant', kind: 'plant', status: 'online', icon: '▰', name: '焚烧厂', lng: 114.3842, lat: 36.0265, onlineText: '运行正常', details: [{ label: '今日处理', value: '218.5 吨' }, { label: '日处理能力', value: '600 吨' }], relations: [{ label: '入厂车辆', value: '12 辆' }] },
  { id: 'a1', type: '告警', layer: 'alarm', kind: 'alarm', status: 'danger', icon: '!', name: '告警', lng: 114.3475, lat: 36.0928, alarm: true, onlineText: '严重  未处理', details: [{ label: '告警类型', value: '箱体满溢' }, { label: '位置', value: '龙泉镇白龙庙村' }, { label: '触发时间', value: '10:28' }], relations: [{ label: '关联任务', value: '待派单' }] },
  { id: 'a2', type: '告警', layer: 'alarm', kind: 'alarm', status: 'warning', icon: '!', name: '告警', lng: 114.2278, lat: 36.0302, alarm: true, onlineText: '重要  处理中', details: [{ label: '告警类型', value: '车辆超速' }, { label: '位置', value: '马家乡北街' }, { label: '触发时间', value: '10:12' }], relations: [{ label: '关联车辆', value: '豫E3G516' }] },
]

const villageGeoArchives = longanVillageArchives.map((item) => {
  const point = wgs84ToGcj02(item.lng, item.lat)
  return { ...item, amapLng: point.lng, amapLat: point.lat }
})
const driverNames = ['张师傅', '李师傅', '王师傅', '赵师傅', '陈师傅', '郑师傅', '孙师傅', '刘师傅', '周师傅', '郭师傅']

function padCode(value: number) {
  return String(value).padStart(3, '0')
}

function seededRatio(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function pickVillage(index: number, offset: number) {
  const village = villageGeoArchives[Math.abs(index * 17 + offset * 7) % villageGeoArchives.length]
  // 档案尚未返回时也要保证地图点位可生成，不能让单个空值阻断整张大屏。
  return village || { town: '龙安区', name: '默认点位', amapLng: 114.3, amapLat: 36.07, wasteTons: 0 }
}

function simulatedLngLat(index: number, offset: number, jitterScale = 1) {
  const village = pickVillage(index, offset)
  const lngJitter = (seededRatio(index + offset) - 0.5) * 0.006 * jitterScale
  const latJitter = (seededRatio(index * 1.37 + offset * 2.11) - 0.5) * 0.004 * jitterScale
  const lng = village.amapLng + lngJitter
  const lat = village.amapLat + latJitter
  return {
    lng: +Math.min(LONGAN_BOUNDS.east - 0.004, Math.max(LONGAN_BOUNDS.west + 0.004, lng)).toFixed(6),
    lat: +Math.min(LONGAN_BOUNDS.north - 0.004, Math.max(LONGAN_BOUNDS.south + 0.004, lat)).toFixed(6),
  }
}

function createMapEntity(entity: Omit<MapEntity, 'lng' | 'lat'>, index: number, offset: number, jitterScale = 1): MapEntity {
  return {
    ...entity,
    ...simulatedLngLat(index, offset, jitterScale),
  }
}

export function createGeneratedMapEntities(): MapEntity[] {
  const list: MapEntity[] = []

  for (let i = 1; i <= 20; i += 1) {
    const village = pickVillage(i, 10)
    const town = village.town
    list.push(createMapEntity({
      id: `hook-${i}`,
      type: '车辆',
      layer: 'hookTruck',
      kind: 'truck-hook',
      status: i % 13 === 0 ? 'charging' : i % 9 === 0 ? 'offline' : 'online',
      icon: '▣',
      name: `小勾臂${padCode(i)}`,
      onlineText: i % 13 === 0 ? '充电中' : i % 9 === 0 ? '离线' : '在线  收运中',
      image: i === 1 ? vehicleImage : undefined,
      details: [
        { label: '车辆类型', value: '小勾臂车' },
        { label: '车牌号', value: `豫E${padCode(600 + i)}` },
        { label: '司机', value: driverNames[i % driverNames.length] },
        { label: '当前乡镇', value: town },
        { label: '速度', value: `${28 + (i % 18)} km/h` },
        { label: '任务', value: `${town}箱体收运` },
      ],
      relations: [
        { label: '关联箱体', value: `${2 + (i % 4)} 个` },
        { label: '今日任务', value: `${6 + (i % 7)} 单` },
      ],
    }, i, 10, 1.3))
  }

  for (let i = 1; i <= 6; i += 1) {
    const village = pickVillage(i, 30)
    const town = village.town
    list.push(createMapEntity({
      id: `large-truck-${i}`,
      type: '车辆',
      layer: 'largeTruck',
      kind: 'truck-large',
      status: 'online',
      icon: '▣',
      name: `大勾臂${padCode(i)}`,
      onlineText: '在线  转运中',
      details: [
        { label: '车辆类型', value: '大勾臂车' },
        { label: '车牌号', value: `豫E${padCode(800 + i)}` },
        { label: '司机', value: driverNames[(i + 3) % driverNames.length] },
        { label: '当前乡镇', value: town },
        { label: '载重', value: `${10 + i}.6 吨` },
        { label: '目的地', value: '龙安生活垃圾焚烧厂' },
      ],
      relations: [
        { label: '关联中转站', value: `${town}中转站` },
        { label: '今日转运', value: `${4 + i} 趟` },
      ],
    }, i, 30, 1.6))
  }

  for (let i = 1; i <= 30; i += 1) {
    const village = pickVillage(i, 60)
    const town = village.town
    list.push(createMapEntity({
      id: `tricycle-${i}`,
      type: '车辆',
      layer: 'smallTruck',
      kind: 'truck-small',
      status: i % 17 === 0 ? 'offline' : 'online',
      icon: '▣',
      name: `三轮${padCode(i)}`,
      onlineText: i % 17 === 0 ? '离线' : '在线  巡回清运',
      details: [
        { label: '车辆类型', value: '小三轮车' },
        { label: '车辆编号', value: `TR-${padCode(i)}` },
        { label: '驾驶员', value: driverNames[i % driverNames.length] },
        { label: '服务区域', value: town },
        { label: '今日里程', value: `${18 + (i % 24)} 公里` },
        { label: '今日任务', value: `${3 + (i % 6)} 单` },
      ],
      relations: [
        { label: '服务村庄', value: village.name },
        { label: '附近收集点', value: `${1 + (i % 3)} 个` },
      ],
    }, i, 60, 1.2))
  }

  for (let i = 1; i <= 12; i += 1) {
    const village = pickVillage(i, 110)
    const town = village.town
    const alarm = i <= 3
    list.push(createMapEntity({
      id: `large-box-${i}`,
      type: '箱体',
      layer: 'largeBox',
      kind: 'large-box',
      status: i % 11 === 0 ? 'offline' : 'online',
      icon: '▤',
      name: `大箱${padCode(i)}`,
      alarm,
      onlineText: alarm ? '在线  严重告警' : '在线  正常',
      statusTags: i % 11 === 0 ? [] : alarm ? ['满溢'] : i % 7 === 0 ? ['高温'] : [],
      details: [
        { label: '箱体类型', value: '大勾臂箱' },
        { label: '箱体编号', value: `DB-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: town },
        { label: '邻近村庄', value: village.name },
        { label: '满溢率', value: `${alarm ? 91 + (i % 8) : 42 + (i % 35)}%` },
        { label: '称重', value: `${6 + (i % 5)}.${i % 9} 吨` },
      ],
      relations: [
        { label: '关联任务', value: alarm ? '待派大勾臂车' : '暂无待办' },
        { label: '最近中转站', value: `${town}中转站` },
      ],
    }, i, 110, 0.45))
  }

  for (let i = 1; i <= 24; i += 1) {
    const village = pickVillage(i, 150)
    const town = village.town
    const alarm = i <= 10
    list.push(createMapEntity({
      id: `small-box-${i}`,
      type: '箱体',
      layer: 'smallBox',
      kind: 'small-box',
      status: i % 13 === 0 ? 'offline' : 'online',
      icon: '▥',
      name: `小箱${padCode(i)}`,
      alarm,
      onlineText: alarm ? '在线  满溢预警' : '在线  正常',
      statusTags: i % 13 === 0 ? [] : alarm ? ['满溢'] : i % 11 === 0 ? ['低电量'] : i % 7 === 0 ? ['高温'] : [],
      details: [
        { label: '箱体类型', value: '小勾臂箱' },
        { label: '箱体编号', value: `XB-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: town },
        { label: '所在村庄', value: village.name },
        { label: '满溢率', value: `${alarm ? 82 + (i % 15) : 24 + (i % 48)}%` },
        { label: '电量', value: `${58 + (i % 39)}%` },
      ],
      relations: [
        { label: '建议车辆', value: `小勾臂${padCode((i % 20) + 1)}` },
        { label: '最近任务', value: alarm ? '待派单' : '正常巡检' },
      ],
    }, i, 150, 0.4))
  }

  for (let i = 1; i <= 18; i += 1) {
    const village = pickVillage(i, 210)
    const town = village.town
    list.push(createMapEntity({
      id: `collection-${i}`,
      type: '收集点',
      layer: 'collectionPoint',
      kind: 'collection',
      status: 'online',
      icon: '●',
      name: `收集点${padCode(i)}`,
      onlineText: '运行正常',
      details: [
        { label: '点位类型', value: '收集点' },
        { label: '点位名称', value: `${town}${village.name}收集点` },
        { label: '服务范围', value: `${2 + (i % 5)} 个村庄` },
        { label: '昨日垃圾量', value: `${Math.max(0.3, village.wasteTons).toFixed(2)} 吨` },
      ],
      relations: [
        { label: '附近车辆', value: `${2 + (i % 5)} 辆` },
        { label: '关联箱体', value: `${1 + (i % 4)} 个` },
      ],
    }, i, 210, 0.25))
  }

  for (let i = 1; i <= 12; i += 1) {
    const village = pickVillage(i, 280)
    const town = village.town
    list.push(createMapEntity({
      id: `station-${i}`,
      type: '中转站',
      layer: 'station',
      kind: 'station',
      status: i % 6 === 0 ? 'warning' : 'online',
      icon: '⌂',
      name: `${town}中转站`,
      onlineText: i % 6 === 0 ? '运行中  接近满载' : '运行正常',
      details: [
        { label: '站点类型', value: '垃圾中转站' },
        { label: '在站箱体', value: `${2 + (i % 6)} 个` },
        { label: '今日进站', value: `${18 + (i % 19)} 趟` },
        { label: '压缩量', value: `${18 + i}.5 吨` },
      ],
      relations: [
        { label: '关联车辆', value: `${4 + (i % 7)} 辆` },
        { label: '出站去向', value: '龙安生活垃圾焚烧厂' },
      ],
    }, i, 280, 0.85))
  }

  for (let i = 1; i <= 8; i += 1) {
    const village = pickVillage(i, 340)
    const town = village.town
    const tone = i <= 3 ? 'danger' : 'warning'
    list.push(createMapEntity({
      id: `alarm-${i}`,
      type: '告警',
      layer: 'alarm',
      kind: 'alarm',
      status: tone,
      icon: '!',
      name: i <= 3 ? '严重告警' : '重要告警',
      alarm: true,
      pulse: i <= 3,
      onlineText: i <= 3 ? '严重  未处理' : '重要  处理中',
      details: [
        { label: '告警类型', value: i % 2 === 0 ? '箱体高温告警' : '箱体满溢告警' },
        { label: '箱体名称', value: `${village.name}${i % 2 === 0 ? '大勾臂箱' : '小勾臂箱'}` },
        { label: '箱体编号', value: `${i % 2 === 0 ? 'DB' : 'XB'}-${town.slice(0, 2)}-${padCode(i)}` },
        { label: '所属乡镇', value: village.town },
        { label: '所在村庄', value: village.name },
        { label: '触发时间', value: `10:${String(10 + i * 2).padStart(2, '0')}` },
      ],
      relations: [
        { label: '处置状态', value: i <= 3 ? '待派单' : '处置中' },
        { label: '附近车辆', value: `${1 + (i % 4)} 辆` },
      ],
    }, i, 340, 0.55))
  }

  list.push({
    id: 'plant-1',
    type: '焚烧厂',
    layer: 'plant',
    kind: 'plant',
    status: 'online',
    icon: '▰',
    name: '龙安生活垃圾焚烧厂',
    lng: 114.3892,
    lat: 36.0238,
    onlineText: '运行正常',
    details: [
      { label: '设施类型', value: '焚烧厂' },
      { label: '今日入厂', value: '218.5 吨' },
      { label: '处理能力', value: '600 吨/日' },
      { label: '排队车辆', value: '4 辆' },
    ],
    relations: [
      { label: '关联中转站', value: '12 个' },
      { label: '今日转运任务', value: '46 单' },
    ],
  })

  return list
}

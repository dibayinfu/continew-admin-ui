export type ReadStatus = '未读' | '已读'
export type HandleStatus = '不需处理' | '待处理' | '已处理'
export type CollectionStatus = '待接单' | '已接单' | '收运中' | '已完成'
export type OvertimeStatus = '未超时' | '已超时'
export type AlarmType = '满溢告警' | '低电量告警' | '设备离线' | '称重异常'
export type BoxType = '小勾臂箱' | '大勾臂箱'

export interface TrackPoint {
  label: string
  address: string
  time: string
  lng: number
  lat: number
  done: boolean
  eventType?: 'start' | 'load' | 'arrive' | 'unload'
  fenceRadius?: number
}

export interface SanitationAlarm {
  id: string
  type: AlarmType
  level: '一般' | '重要' | '严重'
  boxType: BoxType
  boxNo: string
  boxName: string
  town: string
  address: string
  fillRate?: number
  battery?: number
  ruleName: string
  triggerTime: string
  readStatus: ReadStatus
  handleStatus: HandleStatus
  content: string
  linkedTaskId?: string
  offlineRemark?: string
}

export interface CollectionTask {
  id: string
  alarmId: string
  taskName: string
  taskType: string
  boxType: BoxType
  boxNo: string
  boxName: string
  town: string
  startAddress: string
  destinationType: '中转站' | '焚烧厂'
  destinationName: string
  destinationAddress: string
  driver: string
  driverPhone: string
  vehicle: string
  vehicleType: string
  priority: '紧急' | '普通'
  slaMinutes: number
  createTime: string
  acceptTime?: string
  startTime?: string
  finishTime?: string
  collectionStatus: CollectionStatus
  overtimeStatus: OvertimeStatus
  durationText: string
  currentStep: string
  proof: string
  proofImages?: string[]
  /** 称重重量（吨），小勾臂箱满溢收运后读取 */
  weight?: number
  track: TrackPoint[]
}

export const drivers = [
  { name: '张师傅', phone: '13900010001', vehicle: '豫E3G516', vehicleType: '小勾臂车' },
  { name: '李师傅', phone: '13900010002', vehicle: '豫E2M883', vehicleType: '小勾臂车' },
  { name: '孙师傅', phone: '13900010005', vehicle: '豫E6N109', vehicleType: '大勾臂车' },
  { name: '王师傅', phone: '13900010023', vehicle: '豫E8K270', vehicleType: '大勾臂车' },
]

export const destinations = [
  { type: '中转站', name: '马投涧中转站', address: '马投涧镇工业路1号' },
  { type: '中转站', name: '龙泉中转站', address: '龙泉镇南街12号' },
  { type: '中转站', name: '善应中转站', address: '善应镇东环路南段' },
  { type: '焚烧厂', name: '龙安生活垃圾焚烧厂', address: '龙安区静脉产业园焚烧厂' },
]

export const sanitationAlarms: SanitationAlarm[] = [
  {
    id: 'AL20260520001',
    type: '满溢告警',
    level: '严重',
    boxType: '小勾臂箱',
    boxNo: 'XB-MTJ-002',
    boxName: '牛家窑2号小勾臂箱',
    town: '马投涧镇',
    address: '马投涧镇牛家窑村文化广场收集点',
    fillRate: 91,
    battery: 72,
    ruleName: '小勾臂箱满溢率 >= 90%',
    triggerTime: '2026-05-20 08:22:00',
    readStatus: '已读',
    handleStatus: '已处理',
    content: '箱体满溢 91%，需 1 小时内转运至中转站。',
    linkedTaskId: 'ST20260520001',
  },
  {
    id: 'AL20260520002',
    type: '满溢告警',
    level: '严重',
    boxType: '大勾臂箱',
    boxNo: 'DB-MTJ-003',
    boxName: '马投涧压缩箱C',
    town: '马投涧镇',
    address: '马投涧中转站压缩箱区 C 位',
    fillRate: 94,
    battery: 67,
    ruleName: '大勾臂箱满溢率 >= 90%',
    triggerTime: '2026-05-20 07:45:00',
    readStatus: '已读',
    handleStatus: '不需处理',
    content: '移动压缩箱满溢 94%，需转运至焚烧厂。',
    linkedTaskId: 'ST20260520002',
  },
  {
    id: 'AL20260520003',
    type: '低电量告警',
    level: '重要',
    boxType: '小勾臂箱',
    boxNo: 'XB-LQ-002',
    boxName: '陈家庄2号小勾臂箱',
    town: '龙泉镇',
    address: '龙泉镇陈家庄村东口',
    fillRate: 73,
    battery: 8,
    ruleName: '箱体电量 <= 10%',
    triggerTime: '2026-05-20 09:38:00',
    readStatus: '未读',
    handleStatus: '待处理',
    content: '电量仅 8%，建议运维人员线下更换电池。',
    offlineRemark: '已通知设备运维人员，预计 11:30 前到场。',
  },
  {
    id: 'AL20260520004',
    type: '满溢告警',
    level: '严重',
    boxType: '小勾臂箱',
    boxNo: 'XB-LQ-004',
    boxName: '西上庄村1号小勾臂箱',
    town: '龙泉镇',
    address: '龙泉镇西上庄村村委会西侧',
    fillRate: 95,
    battery: 44,
    ruleName: '小勾臂箱满溢率 >= 90%',
    triggerTime: '2026-05-20 06:50:00',
    readStatus: '未读',
    handleStatus: '待处理',
    content: '箱体满溢 95%，已持续 3 小时以上。',
  },
  {
    id: 'AL20260520005',
    type: '设备离线',
    level: '一般',
    boxType: '大勾臂箱',
    boxNo: 'DB-SY-001',
    boxName: '善应压缩箱A',
    town: '善应镇',
    address: '善应中转站东环路南段',
    fillRate: 82,
    battery: 91,
    ruleName: '设备离线超过 30 分钟',
    triggerTime: '2026-05-20 10:05:00',
    readStatus: '未读',
    handleStatus: '不需处理',
    content: '满溢传感器超过 30 分钟未上报。',
  },
]

/**
 * 生成两点之间的平滑插值点。使用确定性偏移模拟车辆实际行驶轨迹，避免地图刷新时路线抖动。
 */
function interpolatePoints(
  from: { lng: number; lat: number },
  to: { lng: number; lat: number },
  count: number,
  curve = 0.0012,
): Array<{ lng: number; lat: number }> {
  const points: Array<{ lng: number; lat: number }> = []
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const normalLng = -dy / len
  const normalLat = dx / len
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1)
    const offset = Math.sin(Math.PI * t) * curve
    const lng = from.lng + dx * t + normalLng * offset
    const lat = from.lat + dy * t + normalLat * offset
    points.push({ lng, lat })
  }
  return points
}

function makeEventPoint(
  label: string,
  address: string,
  time: string,
  lng: number,
  lat: number,
  done: boolean,
  eventType: NonNullable<TrackPoint['eventType']>,
  fenceRadius?: number,
): TrackPoint {
  return { label, address, time, lng, lat, done, eventType, fenceRadius }
}

function makeRoutePoint(point: { lng: number; lat: number }, done: boolean): TrackPoint {
  return { label: '', address: '', time: '', lng: point.lng, lat: point.lat, done }
}

export const collectionTasks: CollectionTask[] = [
  {
    id: 'ST20260520001',
    alarmId: 'AL20260520001',
    taskName: '牛家窑2号小勾臂箱满溢收运',
    taskType: '小勾臂箱满溢收运',
    boxType: '小勾臂箱',
    boxNo: 'XB-MTJ-002',
    boxName: '牛家窑2号小勾臂箱',
    town: '马投涧镇',
    startAddress: '马投涧镇牛家窑村文化广场收集点',
    destinationType: '中转站',
    destinationName: '马投涧中转站',
    destinationAddress: '马投涧镇工业路1号',
    driver: '张师傅',
    driverPhone: '13900010001',
    vehicle: '豫E3G516',
    vehicleType: '小勾臂车',
    priority: '紧急',
    slaMinutes: 60,
    createTime: '2026-05-20 08:28:00',
    acceptTime: '2026-05-20 08:33:00',
    startTime: '2026-05-20 08:41:00',
    finishTime: '2026-05-20 09:16:00',
    collectionStatus: '已完成',
    overtimeStatus: '未超时',
    durationText: '48分钟',
    currentStep: '已卸箱入站',
    proof: '完成照片 1 张，站点确认 1 条',
    proofImages: [
      '/src/assets/images/task-proof-1.svg',
    ],
    weight: 2.4,
    track: (() => {
      const p1 = makeEventPoint('始发点', '牛家窑村文化广场收集点', '08:28', 114.276, 36.038, true, 'start', 500)
      const p2 = makeEventPoint('装车', '牛家窑村文化广场收集点', '08:48', 114.276, 36.038, true, 'load')
      const p3 = makeEventPoint('目的地', '马投涧中转站', '09:10', 114.294, 36.050, true, 'arrive', 500)
      const p4 = makeEventPoint('卸车', '马投涧中转站卸料区', '09:16', 114.296, 36.052, true, 'unload')
      const waypoints2 = interpolatePoints(p2, p3, 7).map((c) => makeRoutePoint(c, true))
      return [p1, p2, ...waypoints2, p3, p4]
    })(),
  },
  {
    id: 'ST20260520002',
    alarmId: 'AL20260520002',
    taskName: '马投涧压缩箱C满溢转运',
    taskType: '大勾臂箱满溢转运',
    boxType: '大勾臂箱',
    boxNo: 'DB-MTJ-003',
    boxName: '马投涧压缩箱C',
    town: '马投涧镇',
    startAddress: '马投涧中转站压缩箱区 C 位',
    destinationType: '焚烧厂',
    destinationName: '龙安生活垃圾焚烧厂',
    destinationAddress: '龙安区静脉产业园焚烧厂',
    driver: '孙师傅',
    driverPhone: '13900010005',
    vehicle: '豫E6N109',
    vehicleType: '大勾臂车',
    priority: '紧急',
    slaMinutes: 60,
    createTime: '2026-05-20 07:52:00',
    acceptTime: '2026-05-20 07:56:00',
    startTime: '2026-05-20 08:08:00',
    collectionStatus: '收运中',
    overtimeStatus: '已超时',
    durationText: '已用 1小时18分钟',
    currentStep: '前往焚烧厂途中',
    weight: 13.8,
    proof: '待上传完成凭证',
    track: (() => {
      const p1 = makeEventPoint('始发点', '马投涧中转站压缩箱区', '07:56', 114.296, 36.052, true, 'start', 500)
      const p2 = makeEventPoint('装车', '马投涧中转站压缩箱区', '08:08', 114.296, 36.052, true, 'load')
      const p3 = makeEventPoint('目的地', '龙安生活垃圾焚烧厂', '预计 09:34', 114.350, 36.067, false, 'arrive', 1000)
      const p4 = makeEventPoint('卸车', '龙安生活垃圾焚烧厂卸料大厅', '预计 09:42', 114.352, 36.068, false, 'unload')
      const waypoints2 = interpolatePoints(p2, p3, 10).map((c, index) => makeRoutePoint(c, index < 7))
      const waypoints3 = interpolatePoints(p3, p4, 3, 0.0004).map((c) => makeRoutePoint(c, false))
      return [p1, p2, ...waypoints2, p3, ...waypoints3, p4]
    })(),
  },
  {
    id: 'ST20260520003',
    alarmId: 'AL20260520004',
    taskName: '西上庄村1号小勾臂箱满溢收运',
    taskType: '小勾臂箱满溢收运',
    boxType: '小勾臂箱',
    boxNo: 'XB-LQ-004',
    boxName: '西上庄村1号小勾臂箱',
    town: '龙泉镇',
    startAddress: '龙泉镇西上庄村村委会西侧',
    destinationType: '中转站',
    destinationName: '龙泉中转站',
    destinationAddress: '龙泉镇南街12号',
    driver: '李师傅',
    driverPhone: '13900010002',
    vehicle: '豫E2M883',
    vehicleType: '小勾臂车',
    priority: '紧急',
    slaMinutes: 60,
    createTime: '2026-05-20 10:12:00',
    collectionStatus: '待接单',
    overtimeStatus: '未超时',
    durationText: '待开始',
    currentStep: '等待驾驶员接单',
    proof: '待上传完成凭证',
    weight: 0,
    track: (() => {
      const p1 = makeEventPoint('始发点', '西上庄村村委会西侧收集点', '待到达', 114.302, 36.085, false, 'start', 500)
      const p2 = makeEventPoint('装车', '西上庄村村委会西侧收集点', '待处理', 114.302, 36.085, false, 'load')
      const p3 = makeEventPoint('目的地', '龙泉中转站', '待到达', 114.310, 36.090, false, 'arrive', 500)
      const p4 = makeEventPoint('卸车', '龙泉中转站卸料区', '待到达', 114.312, 36.092, false, 'unload')
      const waypoints2 = interpolatePoints(p2, p3, 6).map((c) => makeRoutePoint(c, false))
      return [p1, p2, ...waypoints2, p3, p4]
    })(),
  },
]

// 各地点真实 GPS 坐标（龙安区）
const locationCoords: Record<string, { lng: number; lat: number }> = {
  '马投涧镇': { lng: 114.283, lat: 36.045 },
  '龙泉镇': { lng: 114.308, lat: 36.089 },
  '善应镇': { lng: 114.296, lat: 36.062 },
  '马投涧中转站': { lng: 114.296, lat: 36.052 },
  '龙泉中转站': { lng: 114.312, lat: 36.092 },
  '善应中转站': { lng: 114.298, lat: 36.064 },
  '龙安生活垃圾焚烧厂': { lng: 114.352, lat: 36.068 },
}

export function createCollectionTaskFromAlarm(alarm: SanitationAlarm, driverName = '张师傅', destinationName?: string) {
  const driver = drivers.find((item) => item.name === driverName) || drivers[0]
  const destination = alarm.boxType === '小勾臂箱'
    ? destinations.find((item) => item.name === destinationName && item.type === '中转站') || destinations[0]
    : destinations.find((item) => item.type === '焚烧厂') || destinations[3]
  const taskId = `ST20260520${String(collectionTasks.length + 1).padStart(3, '0')}`
  // 根据地址推算 GPS 坐标
  const alarmCoords = locationCoords[alarm.town] || locationCoords['马投涧镇']
  const destCoords = locationCoords[destination.name] || { lng: alarmCoords.lng + 0.06, lat: alarmCoords.lat + 0.02 }
  const task: CollectionTask = {
    id: taskId,
    alarmId: alarm.id,
    taskName: `${alarm.boxName}满溢${alarm.boxType === '小勾臂箱' ? '收运' : '转运'}`,
    taskType: alarm.boxType === '小勾臂箱' ? '小勾臂箱满溢收运' : '大勾臂箱满溢转运',
    boxType: alarm.boxType,
    boxNo: alarm.boxNo,
    boxName: alarm.boxName,
    town: alarm.town,
    startAddress: alarm.address,
    destinationType: destination.type as '中转站' | '焚烧厂',
    destinationName: destination.name,
    destinationAddress: destination.address,
    driver: driver.name,
    driverPhone: driver.phone,
    vehicle: driver.vehicle,
    vehicleType: driver.vehicleType,
    priority: '紧急',
    slaMinutes: 60,
    createTime: '2026-05-20 10:18:00',
    collectionStatus: '待接单',
    overtimeStatus: '未超时',
    durationText: '待开始',
    currentStep: '等待驾驶员接单',
    proof: '待上传完成凭证',
    track: (() => {
      const startRadius = 500
      const destRadius = destination.type === '焚烧厂' ? 1000 : 500
      const p1 = makeEventPoint('始发点', alarm.address, '待到达', alarmCoords.lng, alarmCoords.lat, false, 'start', startRadius)
      const p2 = makeEventPoint('装车', alarm.address, '待处理', alarmCoords.lng, alarmCoords.lat, false, 'load')
      const p3 = makeEventPoint('目的地', destination.name, '待到达', destCoords.lng, destCoords.lat, false, 'arrive', destRadius)
      const p4 = makeEventPoint('卸车', destination.address, '待到达', destCoords.lng, destCoords.lat, false, 'unload')
      const w2 = interpolatePoints(p2, p3, 6).map((c) => makeRoutePoint(c, false))
      return [p1, p2, ...w2, p3, p4]
    })(),
  }
  collectionTasks.unshift(task)
  alarm.linkedTaskId = taskId
  return task
}

const formatNow = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

const calcElapsedMinutes = (task: CollectionTask) => {
  const startText = task.startTime || task.acceptTime || task.createTime
  const start = new Date(startText.replace(/-/g, '/'))
  const now = new Date(formatNow().replace(/-/g, '/'))
  const elapsed = Math.max(1, Math.round((now.getTime() - start.getTime()) / 60000))
  return Number.isFinite(elapsed) ? elapsed : task.slaMinutes
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`
}

export function dispatchAlarmToTask(alarm: SanitationAlarm, driverName = '张师傅', destinationName?: string) {
  if (alarm.linkedTaskId) {
    return collectionTasks.find((item) => item.id === alarm.linkedTaskId)
  }
  const task = createCollectionTaskFromAlarm(alarm, driverName, destinationName)
  alarm.handleStatus = '待处理'
  alarm.readStatus = '已读'
  alarm.offlineRemark = `已派单给 ${task.driver}（${task.vehicle}），等待驾驶员接单。`
  return task
}

export function transferTask(task: CollectionTask, driverName: string) {
  const driver = drivers.find((item) => item.name === driverName)
  if (!driver || driver.name === task.driver) return false
  task.driver = driver.name
  task.driverPhone = driver.phone
  task.vehicle = driver.vehicle
  task.vehicleType = driver.vehicleType
  task.currentStep = `已转单至 ${driver.name}`
  return true
}

export function acceptCollectionTask(task: CollectionTask) {
  if (task.collectionStatus !== '待接单') return false
  task.collectionStatus = '已接单'
  task.acceptTime = formatNow()
  task.currentStep = '驾驶员已接单，前往箱体位置'
  // 标记始发点为已到达
  const startPt = task.track.find((p) => p.label === '始发点')
  if (startPt) {
    startPt.done = true
    startPt.time = formatNow().slice(11, 16)
  }
  return true
}

export function startCollectionTask(task: CollectionTask) {
  if (!['待接单', '已接单'].includes(task.collectionStatus)) return false
  if (task.collectionStatus === '待接单') acceptCollectionTask(task)
  task.collectionStatus = '收运中'
  task.startTime = formatNow()
  task.currentStep = '勾臂箱已装车，正在转运'
  // 标记到"装车"为止的所有点为已完成
  let hitLoad = false
  task.track.forEach((p) => {
    if (p.label === '装车') hitLoad = true
    if (hitLoad) return
    p.done = true
  })
  // 找到"装车"点也标记为已完成
  const loadPt = task.track.find((p) => p.label === '装车')
  if (loadPt) {
    loadPt.done = true
    loadPt.time = formatNow().slice(11, 16)
  }
  task.weight = task.boxType === '小勾臂箱' ? Number((1.5 + Math.random() * 1.5).toFixed(1)) : Number((8 + Math.random() * 10).toFixed(1))
  return true
}

export function autoCompleteCollectionTask(task: CollectionTask, mode: 'auto' | 'force' = 'auto') {
  if (task.collectionStatus === '已完成') return false
  if (!task.startTime) startCollectionTask(task)
  const elapsed = calcElapsedMinutes(task)
  task.finishTime = formatNow()
  task.durationText = formatDuration(elapsed)
  task.overtimeStatus = elapsed > task.slaMinutes ? '已超时' : '未超时'
  task.collectionStatus = '已完成'
  task.currentStep = mode === 'force' ? '运营人员已强制完成' : '车辆到达目的地，系统自动完成'
  task.weight = task.weight || (task.boxType === '小勾臂箱' ? Number((1.5 + Math.random() * 1.5).toFixed(1)) : Number((8 + Math.random() * 10).toFixed(1)))
  // 标记所有点为已完成
  task.track.forEach((p) => {
    if (!p.done) p.done = true
  })
  // 更新各事件时间
  const nowStr = formatNow().slice(11, 16)
  const destPt = task.track.find((p) => p.label === '目的地')
  if (destPt && destPt.time === '待到达') destPt.time = nowStr
  const unloadPt = task.track.find((p) => p.label === '卸车')
  if (unloadPt && unloadPt.time === '待到达') unloadPt.time = nowStr
  if (!task.proofImages?.length) task.proof = mode === 'force' ? '强制完成，待补充凭证' : '系统自动完成，待补传凭证照片'
  return true
}

export function uploadCollectionProof(task: CollectionTask) {
  if (task.collectionStatus !== '已完成') autoCompleteCollectionTask(task)
  task.proof = '驾驶员补传凭证照片 1 张'
  task.proofImages = ['/src/assets/images/task-proof-1.svg']
  return true
}

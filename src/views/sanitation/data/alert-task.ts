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
  x: number
  y: number
  done: boolean
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
    track: [
      { label: '到达箱体', address: '牛家窑村文化广场', time: '08:41', x: 18, y: 66, done: true },
      { label: '装车完成', address: '牛家窑村文化广场', time: '08:48', x: 31, y: 52, done: true },
      { label: '转运途中', address: '马投涧镇北环路', time: '09:02', x: 55, y: 42, done: true },
      { label: '到达中转站', address: '马投涧中转站', time: '09:16', x: 82, y: 28, done: true },
    ],
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
    track: [
      { label: '接单', address: '马投涧中转站', time: '07:56', x: 14, y: 40, done: true },
      { label: '装车完成', address: '马投涧中转站', time: '08:08', x: 30, y: 52, done: true },
      { label: '转运途中', address: '龙安大道', time: '08:46', x: 56, y: 48, done: true },
      { label: '焚烧厂', address: '龙安生活垃圾焚烧厂', time: '预计 09:42', x: 84, y: 32, done: false },
    ],
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
    track: [
      { label: '起点', address: '西上庄村村委会西侧', time: '待到达', x: 20, y: 60, done: false },
      { label: '装车', address: '西上庄村村委会西侧', time: '待处理', x: 36, y: 48, done: false },
      { label: '转运途中', address: '龙泉镇主路', time: '待处理', x: 58, y: 38, done: false },
      { label: '目的地', address: '龙泉中转站', time: '待到达', x: 80, y: 28, done: false },
    ],
  },
]

export function createCollectionTaskFromAlarm(alarm: SanitationAlarm, driverName = '张师傅', destinationName?: string) {
  const driver = drivers.find((item) => item.name === driverName) || drivers[0]
  const destination = alarm.boxType === '小勾臂箱'
    ? destinations.find((item) => item.name === destinationName && item.type === '中转站') || destinations[0]
    : destinations.find((item) => item.type === '焚烧厂') || destinations[3]
  const taskId = `ST20260520${String(collectionTasks.length + 1).padStart(3, '0')}`
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
    track: [
      { label: '起点', address: alarm.address, time: '待到达', x: 18, y: 64, done: false },
      { label: '装车', address: alarm.address, time: '待处理', x: 36, y: 52, done: false },
      { label: '转运途中', address: alarm.town, time: '待处理', x: 58, y: 42, done: false },
      { label: '目的地', address: destination.address, time: '待到达', x: 82, y: 28, done: false },
    ],
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
  task.track[0].done = true
  task.track[0].time = '已接单'
  return true
}

export function startCollectionTask(task: CollectionTask) {
  if (!['待接单', '已接单'].includes(task.collectionStatus)) return false
  if (task.collectionStatus === '待接单') acceptCollectionTask(task)
  task.collectionStatus = '收运中'
  task.startTime = formatNow()
  task.currentStep = '勾臂箱已装车，正在转运'
  task.track.slice(0, 3).forEach((item) => {
    item.done = true
  })
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
  task.track.forEach((item) => {
    item.done = true
  })
  if (!task.proofImages?.length) task.proof = mode === 'force' ? '强制完成，待补充凭证' : '系统自动完成，待补传凭证照片'
  return true
}

export function uploadCollectionProof(task: CollectionTask) {
  if (task.collectionStatus !== '已完成') autoCompleteCollectionTask(task)
  task.proof = '驾驶员补传凭证照片 1 张'
  task.proofImages = ['/src/assets/images/task-proof-1.svg']
  return true
}

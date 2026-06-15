import { reactive } from 'vue'

// ==================== APP 功能入口 - 首页 ====================

/** 首页状态卡片 */
export interface HomeStatusCard {
  key: string
  label: string
  value: string
  color: string
}

export const homeStatusCards: HomeStatusCard[] = [
  { key: 'fault', label: '故障', value: '3', color: '#F53F3F' },
  { key: 'vehicle', label: '车辆监管', value: '11/12', color: '#165DFF' },
  { key: 'personnel', label: '人员监管', value: '86/92', color: '#00B42A' },
]

/** 首页功能模块 */
export interface HomeModule {
  id: string
  name: string
  icon: string
  route: string
  badge?: string | number
  group: string
}

export const homeModules: HomeModule[] = [
  // 原有模块
  { id: 'toilet-map', name: '公厕地图', icon: 'toilet', route: '', group: 'facility' },
  { id: 'station-map', name: '中转站地图', icon: 'station', route: '', group: 'facility' },
  { id: 'inspection', name: '巡查管理', icon: 'inspection', route: '', group: 'manage' },
  { id: 'vehicle-video', name: '车载视频', icon: 'video', route: '', group: 'vehicle' },
  { id: 'personnel-attendance', name: '人员考勤', icon: 'attendance', route: '', group: 'personnel' },
  { id: 'food-waste', name: '餐厨收运', icon: 'food', route: '', group: 'collect' },
  { id: 'attendance-mgr', name: '考勤管理', icon: 'check', route: '', group: 'personnel' },
  { id: 'driver-attendance', name: '司机考勤', icon: 'driver', route: '', group: 'personnel' },
  { id: 'work-map', name: '作业地图', icon: 'map', route: '', group: 'manage' },
  { id: 'vehicle-check', name: '车辆点检', icon: 'check-circle', route: '', group: 'vehicle' },
  { id: 'biz-report', name: '业务分析报告', icon: 'report', route: '', group: 'report' },
  { id: 'check-mgr', name: '检查管理', icon: 'inspect', route: '', group: 'manage' },
  { id: 'vehicle-data', name: '车辆数据', icon: 'data', route: '', group: 'vehicle' },
  { id: 'charge-mgr', name: '充电管理', icon: 'charge', route: '', group: 'vehicle' },
  { id: 'collect-record', name: '收运记录', icon: 'record', route: '', group: 'collect' },
  { id: 'collect-list', name: '收运列表', icon: 'list', route: '', group: 'collect' },
  { id: 'material-out', name: '物料出库', icon: 'outbound', route: '', group: 'warehouse' },
  { id: 'stock-mgr', name: '库存管理', icon: 'stock', route: '', group: 'warehouse' },
  { id: 'machine-work', name: '机械作业', icon: 'machine', route: '', group: 'manage' },
  { id: 'cleaner-location', name: '保洁员位', icon: 'location', route: '', group: 'personnel' },
  // === 新增业务模块 ===
  { id: 'box-monitor', name: '箱体监控', icon: 'box', route: '', group: 'business', badge: '5告警' },
  { id: 'alert-dispatch', name: '告警派单', icon: 'alert', route: '', group: 'business', badge: '3' },
  { id: 'waybill-monitor', name: '运单监控', icon: 'waybill', route: '', group: 'business', badge: '8进行中' },
  { id: 'dashboard-view', name: '收运看板', icon: 'dashboard', route: '', group: 'business' },
  { id: 'driver-task', name: '收运任务', icon: 'task', route: '', group: 'business', badge: '2待接' },
]

// ==================== 箱体监控 ====================
export interface BoxMonitorItem {
  id: string
  boxNo: string
  boxName: string
  boxType: string
  town: string
  village: string
  fillRate: number
  battery: number
  status: 'normal' | 'warning' | 'overflow' | 'offline'
  lastReport: string
  lockStatus: string
}

export const boxMonitorList: BoxMonitorItem[] = [
  { id: 'BM001', boxNo: 'XB-MTJ-001', boxName: '南坡村1号小勾臂箱', boxType: '小勾臂箱', town: '马投涧镇', village: '南坡村', fillRate: 45, battery: 82, status: 'normal', lastReport: '2026-06-11 10:15:22', lockStatus: '关锁' },
  { id: 'BM002', boxNo: 'XB-MTJ-002', boxName: '牛家窑2号小勾臂箱', boxType: '小勾臂箱', town: '马投涧镇', village: '牛家窑村', fillRate: 91, battery: 66, status: 'overflow', lastReport: '2026-06-11 10:12:20', lockStatus: '开锁' },
  { id: 'BM003', boxNo: 'DB-MTJ-003', boxName: '马投涧压缩箱C', boxType: '移动压缩箱', town: '马投涧镇', village: '-', fillRate: 94, battery: 67, status: 'overflow', lastReport: '2026-06-11 10:08:00', lockStatus: '关锁' },
  { id: 'BM004', boxNo: 'XB-LQ-003', boxName: '石岩村南收集点箱体', boxType: '小勾臂箱', town: '龙泉镇', village: '石岩村', fillRate: 78, battery: 31, status: 'offline', lastReport: '2026-06-11 08:11:03', lockStatus: '未知' },
  { id: 'BM005', boxNo: 'XB-LQ-004', boxName: '西上庄村1号小勾臂箱', boxType: '小勾臂箱', town: '龙泉镇', village: '西上庄村', fillRate: 95, battery: 44, status: 'overflow', lastReport: '2026-06-11 09:50:00', lockStatus: '关锁' },
  { id: 'BM006', boxNo: 'DB-SY-001', boxName: '善应压缩箱A', boxType: '大勾臂箱', town: '善应镇', village: '-', fillRate: 82, battery: 91, status: 'warning', lastReport: '2026-06-11 10:05:00', lockStatus: '关锁' },
  { id: 'BM007', boxNo: 'XB-LQ-002', boxName: '陈家庄2号小勾臂箱', boxType: '小勾臂箱', town: '龙泉镇', village: '陈家庄', fillRate: 73, battery: 8, status: 'warning', lastReport: '2026-06-11 09:38:00', lockStatus: '关锁' },
  { id: 'BM008', boxNo: 'XB-MTJ-005', boxName: '盘龙寺村收集点箱体', boxType: '小勾臂箱', town: '马投涧镇', village: '盘龙寺村', fillRate: 32, battery: 95, status: 'normal', lastReport: '2026-06-11 10:18:00', lockStatus: '关锁' },
]

// ==================== 告警列表 ====================
export interface AlertItem {
  id: string
  type: string
  level: '严重' | '重要' | '一般'
  title: string
  content: string
  source: string
  time: string
  readStatus: '未读' | '已读'
  handleStatus: '待处理' | '已处理' | '不需处理'
  linkedTaskId?: string
}

export const alertList: AlertItem[] = [
  { id: 'AL001', type: '满溢告警', level: '严重', title: '西上庄村1号箱体满溢', content: '箱体满溢 95%，已持续 3h50min，需紧急派单清运。', source: '西上庄村1号小勾臂箱', time: '2026-06-11 06:50', readStatus: '未读', handleStatus: '待处理' },
  { id: 'AL002', type: '满溢告警', level: '严重', title: '牛家窑2号箱体满溢', content: '箱体满溢 91%，需 1 小时内转运至中转站。', source: '牛家窑2号小勾臂箱', time: '2026-06-11 08:22', readStatus: '已读', handleStatus: '已处理', linkedTaskId: 'ST001' },
  { id: 'AL003', type: '满溢告警', level: '严重', title: '马投涧压缩箱C满溢', content: '移动压缩箱满溢 94%，需转运至焚烧厂。', source: '马投涧压缩箱C', time: '2026-06-11 07:45', readStatus: '已读', handleStatus: '已处理', linkedTaskId: 'ST002' },
  { id: 'AL004', type: '低电量告警', level: '重要', title: '陈家庄2号箱低电量', content: '电量仅 8%，建议运维人员线下更换电池。', source: '陈家庄2号小勾臂箱', time: '2026-06-11 09:38', readStatus: '未读', handleStatus: '待处理' },
  { id: 'AL005', type: '设备离线', level: '一般', title: '石岩村南箱体离线', content: '满溢传感器超过 2 小时未上报。', source: '石岩村南收集点箱体', time: '2026-06-11 08:11', readStatus: '未读', handleStatus: '待处理' },
  { id: 'AL006', type: '称重异常', level: '重要', title: '豫E8K270称重突变', content: '5分钟内称重数据从12.3t变为13.8t', source: '豫E8K270', time: '2026-06-11 09:14', readStatus: '已读', handleStatus: '待处理' },
  { id: 'AL007', type: '主动安全', level: '严重', title: '豫E8K270分神驾驶', content: 'DMS检测到驾驶员分神超过3秒', source: '豫E8K270', time: '2026-06-11 10:05', readStatus: '未读', handleStatus: '待处理' },
]

// ==================== 运单列表 ====================
export interface WaybillItem {
  id: string
  taskName: string
  taskType: string
  boxNo: string
  driver: string
  driverPhone: string
  vehicle: string
  startAddress: string
  destination: string
  priority: '紧急' | '普通'
  status: '待派发' | '待接单' | '已接单' | '收运中' | '已完成'
  overtimeStatus: '未超时' | '已超时'
  createTime: string
  deadline: string
  slaMinutes: number
  weight?: number
  steps: { label: string; done: boolean; time?: string }[]
}

export const waybillList: WaybillItem[] = [
  {
    id: 'WB001', taskName: '西上庄村1号紧急清运', taskType: '满溢清运', boxNo: 'XB-LQ-004',
    driver: '张师傅', driverPhone: '13900010001', vehicle: '豫E3G516',
    startAddress: '龙泉镇西上庄村村委会西侧', destination: '龙泉中转站',
    priority: '紧急', status: '待接单', overtimeStatus: '已超时',
    createTime: '2026-06-11 06:50', deadline: '2026-06-11 10:00', slaMinutes: 190,
    steps: [
      { label: '派单', done: true, time: '06:50' },
      { label: '接单', done: false },
      { label: '到达', done: false },
      { label: '装车', done: false },
      { label: '到达中转站', done: false },
      { label: '完成', done: false },
    ],
  },
  {
    id: 'WB002', taskName: '牛家窑2号满溢清运', taskType: '满溢清运', boxNo: 'XB-MTJ-002',
    driver: '张师傅', driverPhone: '13900010001', vehicle: '豫E3G516',
    startAddress: '马投涧镇牛家窑村文化广场', destination: '马投涧中转站',
    priority: '紧急', status: '收运中', overtimeStatus: '未超时',
    createTime: '2026-06-11 08:22', deadline: '2026-06-11 11:00', slaMinutes: 158,
    steps: [
      { label: '派单', done: true, time: '08:22' },
      { label: '接单', done: true, time: '08:30' },
      { label: '到达', done: true, time: '08:52' },
      { label: '装车', done: true, time: '09:15' },
      { label: '到达中转站', done: false },
      { label: '完成', done: false },
    ],
  },
  {
    id: 'WB003', taskName: '马投涧压缩箱C清运', taskType: '满溢清运', boxNo: 'DB-MTJ-003',
    driver: '孙师傅', driverPhone: '13900010005', vehicle: '豫E6N109',
    startAddress: '马投涧中转站压缩箱区', destination: '龙安生活垃圾焚烧厂',
    priority: '紧急', status: '已接单', overtimeStatus: '未超时',
    createTime: '2026-06-11 07:45', deadline: '2026-06-11 10:30', slaMinutes: 165,
    steps: [
      { label: '派单', done: true, time: '07:45' },
      { label: '接单', done: true, time: '07:52' },
      { label: '出发', done: false },
      { label: '到达焚烧厂', done: false },
      { label: '完成', done: false },
    ],
  },
  {
    id: 'WB004', taskName: '善应北村日常收集', taskType: '日常清运', boxNo: '-',
    driver: '李师傅', driverPhone: '13900010002', vehicle: '豫E2M883',
    startAddress: '善应镇北片收集点', destination: '善应中转站',
    priority: '普通', status: '已完成', overtimeStatus: '未超时',
    createTime: '2026-06-10 18:00', deadline: '2026-06-11 15:30', slaMinutes: 0,
    steps: [
      { label: '派单', done: true, time: '06/10 18:00' },
      { label: '接单', done: true, time: '06:15' },
      { label: '出发', done: true, time: '06:30' },
      { label: '到达中转站', done: true, time: '10:15' },
      { label: '完成', done: true, time: '10:30' },
    ],
    weight: 3.2,
  },
  {
    id: 'WB005', taskName: '南坡村日常收集', taskType: '日常清运', boxNo: 'XB-MTJ-001',
    driver: '张师傅', driverPhone: '13900010001', vehicle: '豫E3G516',
    startAddress: '马投涧镇南坡村东口', destination: '马投涧中转站',
    priority: '普通', status: '待派发', overtimeStatus: '未超时',
    createTime: '2026-06-10 18:00', deadline: '2026-06-11 16:00', slaMinutes: 0,
    steps: [
      { label: '派单', done: false },
      { label: '接单', done: false },
      { label: '到达', done: false },
      { label: '装车', done: false },
      { label: '完成', done: false },
    ],
  },
  {
    id: 'WB006', taskName: '石岩村箱体维修后复位', taskType: '箱体复位', boxNo: 'XB-LQ-003',
    driver: '王师傅', driverPhone: '13900010023', vehicle: '豫E8K270',
    startAddress: '龙泉镇石岩村南', destination: '石岩村南收集点',
    priority: '普通', status: '待接单', overtimeStatus: '未超时',
    createTime: '2026-06-11 09:30', deadline: '2026-06-11 14:00', slaMinutes: 270,
    steps: [
      { label: '派单', done: true, time: '09:30' },
      { label: '接单', done: false },
      { label: '到达', done: false },
      { label: '完成', done: false },
    ],
  },
]

// ==================== 驾驶员任务（与运单关联） ====================
export interface DriverTask {
  id: string
  waybillId: string
  taskName: string
  taskType: string
  boxNo: string
  driver: string
  vehicle: string
  startAddress: string
  destination: string
  priority: '紧急' | '普通'
  status: '待接单' | '已接单' | '收运中' | '已完成'
  overtimeStatus: '未超时' | '已超时'
  createTime: string
  deadline: string
  slaMinutes: number
  proofUploaded: boolean
  weight?: number
  fillRate?: number
  acceptTime?: string
  startTime?: string
  finishTime?: string
  steps: { label: string; done: boolean; time?: string }[]
  track: { lng: number; lat: number; done: boolean; label?: string; time?: string }[]
}

export const driverTaskList: DriverTask[] = [
  {
    id: 'DT001', waybillId: 'WB001', taskName: '西上庄村1号紧急清运', taskType: '满溢清运',
    boxNo: 'XB-LQ-004', driver: '张师傅', vehicle: '豫E3G516',
    startAddress: '龙泉镇西上庄村村委会西侧', destination: '龙泉中转站',
    priority: '紧急', status: '待接单', overtimeStatus: '已超时',
    createTime: '2026-06-12 06:50', deadline: '2026-06-12 10:00', slaMinutes: 190, proofUploaded: false,
    fillRate: 95,
    steps: [
      { label: '派单', done: true, time: '06:50' },
      { label: '接单', done: false },
      { label: '到达收集点', done: false },
      { label: '装车', done: false },
      { label: '到达中转站', done: false },
      { label: '卸车完成', done: false },
    ],
    track: [
      { lng: 114.132, lat: 36.035, done: false, label: '西上庄村', time: '06:50' },
      { lng: 114.138, lat: 36.038, done: false, label: '装车点' },
      { lng: 114.145, lat: 36.042, done: false },
      { lng: 114.148, lat: 36.048, done: false },
      { lng: 114.155, lat: 36.052, done: false, label: '龙泉中转站' },
    ],
  },
  {
    id: 'DT002', waybillId: 'WB002', taskName: '牛家窑2号满溢清运', taskType: '满溢清运',
    boxNo: 'XB-MTJ-002', driver: '张师傅', vehicle: '豫E3G516',
    startAddress: '马投涧镇牛家窑村文化广场', destination: '马投涧中转站',
    priority: '紧急', status: '已接单', overtimeStatus: '未超时',
    createTime: '2026-06-12 08:22', deadline: '2026-06-12 11:00', slaMinutes: 158, proofUploaded: false,
    acceptTime: '08:28', fillRate: 91,
    steps: [
      { label: '派单', done: true, time: '08:22' },
      { label: '接单', done: true, time: '08:28' },
      { label: '到达收集点', done: false },
      { label: '装车', done: false },
      { label: '到达中转站', done: false },
      { label: '卸车完成', done: false },
    ],
    track: [
      { lng: 114.125, lat: 36.060, done: true, label: '牛家窑村', time: '08:22' },
      { lng: 114.128, lat: 36.063, done: true, label: '接单位置' },
      { lng: 114.132, lat: 36.065, done: false, label: '装车点' },
      { lng: 114.138, lat: 36.068, done: false },
      { lng: 114.142, lat: 36.070, done: false, label: '马投涧中转站' },
    ],
  },
  {
    id: 'DT003', waybillId: 'WB006', taskName: '南坡村日常收集', taskType: '日常清运',
    boxNo: 'XB-MTJ-001', driver: '张师傅', vehicle: '豫E3G516',
    startAddress: '马投涧镇南坡村东口', destination: '马投涧中转站',
    priority: '普通', status: '收运中', overtimeStatus: '未超时',
    createTime: '2026-06-12 06:00', deadline: '2026-06-12 11:30', slaMinutes: 330, proofUploaded: false,
    acceptTime: '06:10', startTime: '06:35', weight: 2.8, fillRate: 72,
    steps: [
      { label: '派单', done: true, time: '06:00' },
      { label: '接单', done: true, time: '06:10' },
      { label: '到达收集点', done: true, time: '06:25' },
      { label: '装车', done: true, time: '06:35' },
      { label: '到达中转站', done: false },
      { label: '卸车完成', done: false },
    ],
    track: [
      { lng: 114.118, lat: 36.055, done: true, label: '南坡村', time: '06:00' },
      { lng: 114.122, lat: 36.058, done: true, label: '装车点', time: '06:35' },
      { lng: 114.128, lat: 36.062, done: true },
      { lng: 114.134, lat: 36.066, done: false },
      { lng: 114.138, lat: 36.068, done: false, label: '马投涧中转站' },
    ],
  },
  {
    id: 'DT004', waybillId: 'WB004', taskName: '盘龙寺村日常收集', taskType: '日常清运',
    boxNo: 'XB-MTJ-005', driver: '张师傅', vehicle: '豫E3G516',
    startAddress: '马投涧镇盘龙寺村口', destination: '马投涧中转站',
    priority: '普通', status: '已完成', overtimeStatus: '未超时',
    createTime: '2026-06-12 05:30', deadline: '2026-06-12 09:00', slaMinutes: 210, proofUploaded: false,
    acceptTime: '05:40', startTime: '06:00', finishTime: '08:45', weight: 3.6, fillRate: 88,
    steps: [
      { label: '派单', done: true, time: '05:30' },
      { label: '接单', done: true, time: '05:40' },
      { label: '到达收集点', done: true, time: '05:58' },
      { label: '装车', done: true, time: '06:00' },
      { label: '到达中转站', done: true, time: '08:30' },
      { label: '卸车完成', done: true, time: '08:45' },
    ],
    track: [
      { lng: 114.115, lat: 36.050, done: true, label: '盘龙寺村', time: '05:30' },
      { lng: 114.120, lat: 36.054, done: true, label: '装车点', time: '06:00' },
      { lng: 114.126, lat: 36.058, done: true },
      { lng: 114.132, lat: 36.063, done: true },
      { lng: 114.136, lat: 36.067, done: true, label: '马投涧中转站', time: '08:45' },
    ],
  },
  {
    id: 'DT005', waybillId: 'WB007', taskName: '陈家庄2号箱体复位', taskType: '箱体复位',
    boxNo: 'XB-LQ-002', driver: '张师傅', vehicle: '豫E3G516',
    startAddress: '龙泉镇维修站', destination: '龙泉镇陈家庄村东口',
    priority: '普通', status: '已完成', overtimeStatus: '未超时',
    createTime: '2026-06-11 14:00', deadline: '2026-06-11 16:00', slaMinutes: 120, proofUploaded: true,
    acceptTime: '14:10', startTime: '14:30', finishTime: '15:20', weight: 0,
    steps: [
      { label: '派单', done: true, time: '14:00' },
      { label: '接单', done: true, time: '14:10' },
      { label: '到达维修站', done: true, time: '14:25' },
      { label: '装车', done: true, time: '14:30' },
      { label: '到达陈家庄', done: true, time: '15:10' },
      { label: '卸车完成', done: true, time: '15:20' },
    ],
    track: [
      { lng: 114.140, lat: 36.040, done: true, label: '维修站', time: '14:00' },
      { lng: 114.136, lat: 36.038, done: true, label: '装车点', time: '14:30' },
      { lng: 114.132, lat: 36.036, done: true },
      { lng: 114.128, lat: 36.034, done: true, label: '陈家庄', time: '15:20' },
    ],
  },
]

// ==================== 管理员综合数据 ====================
export interface AdminMetrics {
  todayWaste: string
  vehicleOnlineRate: string
  taskCompleteRate: string
  alertHandleRate: string
  onlineVehicles: string
  offlineDevices: string
  unhandledAlerts: string
  todayTrips: string
}

export const adminMetricsData: AdminMetrics = {
  todayWaste: '107.3t',
  vehicleOnlineRate: '87.5%',
  taskCompleteRate: '91.2%',
  alertHandleRate: '63.0%',
  onlineVehicles: '9/11辆',
  offlineDevices: '2台',
  unhandledAlerts: '4条',
  todayTrips: '28趟',
}

// ==================== 消息列表 ====================
export interface MessageItem {
  id: string
  type: 'system' | 'repair'
  title: string
  content: string
  time: string
  read: boolean
}

export const messageList: MessageItem[] = [
  { id: 'MSG001', type: 'system', title: '系统升级通知', content: '智慧环卫平台将于今晚22:00进行系统升级维护，预计持续2小时，期间APP部分功能可能不可用。', time: '2026-06-11 09:00', read: true },
  { id: 'MSG002', type: 'system', title: '新功能上线', content: '箱体远程控制功能已上线，支持远程开锁/关锁操作，请在"箱体监控"模块体验。', time: '2026-06-10 14:30', read: true },
  { id: 'MSG003', type: 'repair', title: '豫E3G516报修处理中', content: '您提交的车辆报修（制动系统异响）已分配至维修站，预计6月12日前完成维修。', time: '2026-06-11 08:15', read: false },
  { id: 'MSG004', type: 'system', title: '考核通知', content: '6月份驾驶员安全考核将于6月15日进行，请各位驾驶员做好准备。', time: '2026-06-09 10:00', read: false },
  { id: 'MSG005', type: 'repair', title: '牛家窑2号箱体锁具维修完成', content: '箱体电子锁已更换完毕，已恢复正常使用。', time: '2026-06-10 16:20', read: true },
]

// ==================== 响应式状态管理 ====================
export const useAppStore = reactive({
  activeHomeTab: 'home' as 'home' | 'monitor' | 'message' | 'mine',
  activeDriverTab: 'task' as 'task' | 'route' | 'proof' | 'mine',
  activeDispatcherTab: 'alert' as 'alert' | 'task' | 'map' | 'mine',
  activeAdminTab: 'home' as 'home' | 'data' | 'alert' | 'mine',
  messageTab: 'system' as 'system' | 'repair',
  searchKeyword: '',
})

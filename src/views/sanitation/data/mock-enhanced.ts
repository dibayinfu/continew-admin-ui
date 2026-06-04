import type { MetricItem, StatusTone } from './mock'

// ========== 二期：满溢预警与清运提醒 ==========
export interface OverflowAlert {
  id: string
  boxName: string
  boxNo: string
  boxType: string
  town: string
  village: string
  station: string
  fillRate: number
  fillRateText: string
  battery: number
  batteryText: string
  status: string
  alertLevel: string
  alertTime: string
  duration: string
  suggestAction: string
}

export const overflowAlerts: OverflowAlert[] = [
  { id: 'OA001', boxName: '牛家窑2号小勾臂箱', boxNo: 'XB-MTJ-002', boxType: '小勾臂箱', town: '马投涧镇', village: '牛家窑村', station: '-', fillRate: 91, fillRateText: '91%', battery: 72, batteryText: '72%', status: '满溢', alertLevel: '严重', alertTime: '2026-05-20 08:22:00', duration: '2小时18分', suggestAction: '立即派单清运' },
  { id: 'OA002', boxName: '马投涧压缩箱C', boxNo: 'DB-MTJ-003', boxType: '移动压缩箱', town: '马投涧镇', village: '-', station: '马投涧中转站', fillRate: 94, fillRateText: '94%', battery: 67, batteryText: '67%', status: '满溢', alertLevel: '严重', alertTime: '2026-05-20 07:45:00', duration: '2小时55分', suggestAction: '立即派单清运' },
  { id: 'OA003', boxName: '善应压缩箱A', boxNo: 'DB-SY-001', boxType: '大勾臂箱', town: '善应镇', village: '-', station: '善应中转站', fillRate: 82, fillRateText: '82%', battery: 91, batteryText: '91%', status: '预警', alertLevel: '重要', alertTime: '2026-05-20 09:10:00', duration: '30分', suggestAction: '安排清运计划' },
  { id: 'OA004', boxName: '石岩村南收集点箱体', boxNo: 'XB-LQ-003', boxType: '小勾臂箱', town: '龙泉镇', village: '石岩村', station: '-', fillRate: 78, fillRateText: '78%', battery: 56, batteryText: '56%', status: '预警', alertLevel: '一般', alertTime: '2026-05-20 09:35:00', duration: '5分', suggestAction: '关注趋势' },
  { id: 'OA005', boxName: '西上庄村1号小勾臂箱', boxNo: 'XB-LQ-004', boxType: '小勾臂箱', town: '龙泉镇', village: '西上庄村', station: '-', fillRate: 95, fillRateText: '95%', battery: 44, batteryText: '44%', status: '满溢', alertLevel: '严重', alertTime: '2026-05-20 06:50:00', duration: '3小时50分', suggestAction: '紧急派单清运' },
]

// ========== 二期：任务派发中心 ==========
export interface DispatchTask {
  id: string
  taskName: string
  taskType: string
  source: string
  sourceObject: string
  priority: string
  assignee: string
  assigneePhone: string
  area: string
  createTime: string
  deadline: string
  status: string
  progress: string
}

export const dispatchTasks: DispatchTask[] = [
  { id: 'DT001', taskName: '牛家窑2号箱体满溢清运', taskType: '满溢清运', source: '系统自动', sourceObject: '牛家窑2号小勾臂箱', priority: '紧急', assignee: '张师傅', assigneePhone: '13900010001', area: '马投涧镇北片', createTime: '2026-05-20 08:22:00', deadline: '2026-05-20 11:00', status: '待接单', progress: '已派发' },
  { id: 'DT002', taskName: '马投涧压缩箱C清运', taskType: '满溢清运', source: '系统自动', sourceObject: '马投涧压缩箱C', priority: '紧急', assignee: '孙师傅', assigneePhone: '13900010005', area: '马投涧中转站', createTime: '2026-05-20 07:45:00', deadline: '2026-05-20 10:30', status: '进行中', progress: '驾驶员已接单' },
  { id: 'DT003', taskName: '善应北村日常收集', taskType: '日常清运', source: '计划生成', sourceObject: '善应北村收集点', priority: '普通', assignee: '李师傅', assigneePhone: '13900010002', area: '善应镇北片', createTime: '2026-05-19 18:00:00', deadline: '2026-05-20 15:30', status: '进行中', progress: '已到达点位' },
  { id: 'DT004', taskName: '西上庄村1号箱体紧急清运', taskType: '满溢清运', source: '系统自动', sourceObject: '西上庄村1号小勾臂箱', priority: '紧急', assignee: '未指派', assigneePhone: '-', area: '龙泉镇西片', createTime: '2026-05-20 06:50:00', deadline: '2026-05-20 10:00', status: '待派发', progress: '等待调度员指派' },
  { id: 'DT005', taskName: '马投涧北片上午收集', taskType: '日常清运', source: '计划生成', sourceObject: '马投涧北片线路', priority: '普通', assignee: '张师傅', assigneePhone: '13900010001', area: '马投涧镇北片', createTime: '2026-05-19 18:00:00', deadline: '2026-05-20 10:30', status: '已完成', progress: '已完成' },
]

// ========== 二期：小勾臂箱远程控制 ==========
export interface BoxRemoteControl {
  id: string
  boxName: string
  boxNo: string
  boxType: string
  town: string
  village: string
  lockNo: string
  lockStatus: string
  online: string
  battery: number
  batteryText: string
  lastControl: string
  controlResult: string
  status: string
}

export const boxRemoteControls: BoxRemoteControl[] = [
  { id: 'BR001', boxName: '南坡村1号小勾臂箱', boxNo: 'XB-MTJ-001', boxType: '小勾臂箱', town: '马投涧镇', village: '南坡村', lockNo: 'LOCK-XB-001', lockStatus: '关锁', online: '在线', battery: 82, batteryText: '82%', lastControl: '2026-05-20 07:28:12', controlResult: '远程关锁成功', status: '正常' },
  { id: 'BR002', boxName: '牛家窑2号小勾臂箱', boxNo: 'XB-MTJ-002', boxType: '小勾臂箱', town: '马投涧镇', village: '牛家窑村', lockNo: 'LOCK-XB-002', lockStatus: '开锁', online: '在线', battery: 66, batteryText: '66%', lastControl: '2026-05-20 09:40:18', controlResult: '刷卡开锁', status: '预警' },
  { id: 'BR003', boxName: '石岩村南收集点箱体', boxNo: 'XB-LQ-003', boxType: '小勾臂箱', town: '龙泉镇', village: '石岩村', lockNo: 'LOCK-XB-003', lockStatus: '未知', online: '离线', battery: 31, batteryText: '31%', lastControl: '2026-05-20 08:11:03', controlResult: '指令超时', status: '离线' },
]

// ========== 三期：垃圾量多维分析 ==========
export interface WasteMultiAnalysis {
  dimension: string
  name: string
  dailyWaste: string
  monthlyWaste: string
  trips: number
  avgLoad: string
  emptyRate: string
  trend: string
  status: string
}

export const wasteMultiAnalysis: WasteMultiAnalysis[] = [
  { dimension: '乡镇', name: '马投涧镇', dailyWaste: '18.6t', monthlyWaste: '558.0t', trips: 42, avgLoad: '0.44t', emptyRate: '4.8%', trend: '+2.1%', status: '正常' },
  { dimension: '乡镇', name: '龙泉镇', dailyWaste: '15.8t', monthlyWaste: '474.0t', trips: 36, avgLoad: '0.44t', emptyRate: '2.8%', trend: '+1.5%', status: '正常' },
  { dimension: '乡镇', name: '善应镇', dailyWaste: '14.7t', monthlyWaste: '441.0t', trips: 31, avgLoad: '0.47t', emptyRate: '6.2%', trend: '+3.2%', status: '预警' },
  { dimension: '车辆', name: '豫E8K270', dailyWaste: '13.8t', monthlyWaste: '414.0t', trips: 4, avgLoad: '3.45t', emptyRate: '0%', trend: '-', status: '正常' },
  { dimension: '车辆', name: '豫E6N109', dailyWaste: '11.6t', monthlyWaste: '348.0t', trips: 3, avgLoad: '3.87t', emptyRate: '0%', trend: '-', status: '正常' },
  { dimension: '车辆', name: '豫E3G516', dailyWaste: '2.4t', monthlyWaste: '72.0t', trips: 6, avgLoad: '0.40t', emptyRate: '16.7%', trend: '-', status: '预警' },
  { dimension: '中转站', name: '马投涧中转站', dailyWaste: '18.6t', monthlyWaste: '558.0t', trips: 12, avgLoad: '1.55t', emptyRate: '-', trend: '+2.1%', status: '正常' },
  { dimension: '中转站', name: '善应中转站', dailyWaste: '14.7t', monthlyWaste: '441.0t', trips: 8, avgLoad: '1.84t', emptyRate: '-', trend: '+3.2%', status: '预警' },
]

// ========== 三期：地磅对账中心 ==========
export interface ScaleReconcile {
  id: string
  date: string
  vehicle: string
  vehicleType: string
  vehicleWeight: string
  stationWeight: string
  scaleWeight: string
  diffRate: string
  diffAmount: string
  status: string
  remark: string
}

export const scaleReconciles: ScaleReconcile[] = [
  { id: 'SR001', date: '2026-05-20', vehicle: '豫E8K270', vehicleType: '大勾臂车', vehicleWeight: '13.8t', stationWeight: '13.5t', scaleWeight: '13.8t', diffRate: '0.0%', diffAmount: '0t', status: '正常', remark: '三级数据一致' },
  { id: 'SR002', date: '2026-05-20', vehicle: '豫E6N109', vehicleType: '大勾臂车', vehicleWeight: '11.6t', stationWeight: '11.1t', scaleWeight: '11.6t', diffRate: '0.0%', diffAmount: '0t', status: '正常', remark: '三级数据一致' },
  { id: 'SR003', date: '2026-05-20', vehicle: '豫E3G516', vehicleType: '小勾臂车', vehicleWeight: '2.4t', stationWeight: '-', scaleWeight: '-', diffRate: '无法对账', diffAmount: '-', status: '预警', remark: '小勾臂车未进焚烧厂' },
  { id: 'SR004', date: '2026-05-19', vehicle: '豫E8K270', vehicleType: '大勾臂车', vehicleWeight: '12.9t', stationWeight: '12.6t', scaleWeight: '13.2t', diffRate: '2.3%', diffAmount: '0.3t', status: '预警', remark: '车载与地磅差异超阈值' },
  { id: 'SR005', date: '2026-05-19', vehicle: '豫E9X000', vehicleType: '大勾臂车', vehicleWeight: '10.5t', stationWeight: '10.2t', scaleWeight: '9.9t', diffRate: '5.7%', diffAmount: '0.6t', status: '异常', remark: '差异较大，需人工核查' },
]

// ========== 三期：建筑垃圾识别 ==========
export interface ConstructionWaste {
  id: string
  detectTime: string
  location: string
  town: string
  village: string
  imageUrl: string
  confidence: number
  confidenceText: string
  wasteVolume: string
  sourceVehicle: string
  status: string
  processStatus: string
}

export const constructionWasteList: ConstructionWaste[] = [
  { id: 'CW001', detectTime: '2026-05-20 08:32:00', location: '马投涧镇南坡村东口', town: '马投涧镇', village: '南坡村', imageUrl: '', confidence: 92, confidenceText: '92%', wasteVolume: '约0.8m³', sourceVehicle: '豫E7A031', status: '确认', processStatus: '待处理' },
  { id: 'CW002', detectTime: '2026-05-20 09:15:00', location: '龙泉镇石岩村南', town: '龙泉镇', village: '石岩村', imageUrl: '', confidence: 87, confidenceText: '87%', wasteVolume: '约0.5m³', sourceVehicle: '未识别', status: '疑似', processStatus: '待确认' },
  { id: 'CW003', detectTime: '2026-05-19 14:20:00', location: '善应镇善应北村', town: '善应镇', village: '善应北村', imageUrl: '', confidence: 95, confidenceText: '95%', wasteVolume: '约1.2m³', sourceVehicle: '豫E3G516', status: '确认', processStatus: '已处理' },
]

// ========== 三期：设备健康管理 ==========
export interface DeviceHealth {
  id: string
  deviceType: string
  deviceNo: string
  bindObject: string
  bindType: string
  online: string
  battery: number
  batteryText: string
  lastReport: string
  reportInterval: string
  errorCount: number
  healthScore: number
  healthLevel: string
  status: string
}

export const deviceHealthList: DeviceHealth[] = [
  { id: 'DH001', deviceType: 'GPS定位', deviceNo: 'GPS-LA-001', bindObject: '豫E7A031', bindType: '小三轮', online: '在线', battery: 88, batteryText: '88%', lastReport: '2026-05-20 10:15:22', reportInterval: '30秒', errorCount: 0, healthScore: 98, healthLevel: '优秀', status: '正常' },
  { id: 'DH002', deviceType: 'GPS定位', deviceNo: 'GPS-LA-022', bindObject: '豫E2M883', bindType: '小勾臂车', online: '离线', battery: 0, batteryText: '0%', lastReport: '2026-05-20 09:35:08', reportInterval: '>30分钟', errorCount: 3, healthScore: 42, healthLevel: '差', status: '离线' },
  { id: 'DH003', deviceType: '满溢设备', deviceNo: 'FILL-XB-002', bindObject: '牛家窑2号小勾臂箱', bindType: '小勾臂箱', online: '在线', battery: 72, batteryText: '72%', lastReport: '2026-05-20 10:12:20', reportInterval: '10分钟', errorCount: 0, healthScore: 91, healthLevel: '良好', status: '正常' },
  { id: 'DH004', deviceType: '满溢设备', deviceNo: 'FILL-DB-003', bindObject: '马投涧压缩箱C', bindType: '移动压缩箱', online: '在线', battery: 67, batteryText: '67%', lastReport: '2026-05-20 10:08:00', reportInterval: '5分钟', errorCount: 1, healthScore: 78, healthLevel: '一般', status: '预警' },
  { id: 'DH005', deviceType: '称重设备', deviceNo: 'SCALE-LQ-001', bindObject: '豫E3G516', bindType: '小勾臂车', online: '在线', battery: 94, batteryText: '94%', lastReport: '2026-05-20 10:03:11', reportInterval: '1分钟', errorCount: 0, healthScore: 95, healthLevel: '优秀', status: '正常' },
  { id: 'DH006', deviceType: '电子锁', deviceNo: 'LOCK-XB-003', bindObject: '石岩村南收集点箱体', bindType: '小勾臂箱', online: '离线', battery: 31, batteryText: '31%', lastReport: '2026-05-20 08:11:03', reportInterval: '>2小时', errorCount: 5, healthScore: 35, healthLevel: '差', status: '离线' },
]

// ========== 持续迭代：线路优化 ==========
export interface RouteOptimization {
  id: string
  routeName: string
  routeType: string
  town: string
  currentVehicle: string
  currentDistance: string
  currentDuration: string
  currentCoverage: string
  optimizedDistance: string
  optimizedDuration: string
  optimizedCoverage: string
  saveDistance: string
  saveDuration: string
  status: string
}

export const routeOptimizations: RouteOptimization[] = [
  { id: 'RO001', routeName: '马投涧北片小三轮收集线', routeType: '小三轮收集', town: '马投涧镇', currentVehicle: '豫E7A031', currentDistance: '28.6km', currentDuration: '4h', currentCoverage: '91.7%', optimizedDistance: '24.2km', optimizedDuration: '3.2h', optimizedCoverage: '97.2%', saveDistance: '-15.4%', saveDuration: '-20%', status: '建议优化' },
  { id: 'RO002', routeName: '龙泉镇小勾臂转运线', routeType: '小勾臂转运', town: '龙泉镇', currentVehicle: '豫E3G516', currentDistance: '52.4km', currentDuration: '4h', currentCoverage: '100%', optimizedDistance: '48.6km', optimizedDuration: '3.5h', optimizedCoverage: '100%', saveDistance: '-7.3%', saveDuration: '-12.5%', status: '建议优化' },
  { id: 'RO003', routeName: '善应至焚烧厂转运线', routeType: '大勾臂转运', town: '善应镇', currentVehicle: '豫E8K270', currentDistance: '72.0km', currentDuration: '7h', currentCoverage: '75%', optimizedDistance: '72.0km', optimizedDuration: '6.5h', optimizedCoverage: '100%', saveDistance: '0%', saveDuration: '-7.1%', status: '已采纳' },
]

// ========== 持续迭代：垃圾量预测 ==========
export interface WastePrediction {
  id: string
  date: string
  weekday: string
  predictedWaste: string
  actualWaste: string
  deviation: string
  accuracy: string
  seasonFactor: string
  holidayFactor: string
  status: string
}

export const wastePredictions: WastePrediction[] = [
  { id: 'WP001', date: '2026-05-20', weekday: '周三', predictedWaste: '106.8t', actualWaste: '107.3t', deviation: '+0.5t', accuracy: '99.5%', seasonFactor: '春季', holidayFactor: '否', status: '正常' },
  { id: 'WP002', date: '2026-05-19', weekday: '周二', predictedWaste: '105.2t', actualWaste: '104.8t', deviation: '-0.4t', accuracy: '99.6%', seasonFactor: '春季', holidayFactor: '否', status: '正常' },
  { id: 'WP003', date: '2026-05-18', weekday: '周一', predictedWaste: '112.0t', actualWaste: '110.5t', deviation: '-1.5t', accuracy: '98.7%', seasonFactor: '春季', holidayFactor: '否', status: '正常' },
  { id: 'WP004', date: '2026-05-17', weekday: '周日', predictedWaste: '98.5t', actualWaste: '96.2t', deviation: '-2.3t', accuracy: '97.6%', seasonFactor: '春季', holidayFactor: '是', status: '预警' },
  { id: 'WP005', date: '2026-05-21', weekday: '周四', predictedWaste: '107.5t', actualWaste: '-', deviation: '-', accuracy: '-', seasonFactor: '春季', holidayFactor: '否', status: '预测中' },
]

// ========== 持续迭代：智能异常识别 ==========
export interface AnomalyDetection {
  id: string
  anomalyType: string
  anomalyDesc: string
  objectName: string
  objectType: string
  town: string
  detectTime: string
  severity: string
  evidence: string
  status: string
  suggestAction: string
}

export const anomalyDetections: AnomalyDetection[] = [
  { id: 'AD001', anomalyType: '疑似漏收', anomalyDesc: '善应北村学校收集点未在计划时间内覆盖', objectName: '善应至焚烧厂转运线', objectType: '线路', town: '善应镇', detectTime: '2026-05-20 10:30:00', severity: '重要', evidence: '轨迹未进入50m服务半径', status: '待确认', suggestAction: '查看轨迹并确认是否漏收' },
  { id: 'AD002', anomalyType: '长时间停留', anomalyDesc: '豫E2M883在马家乡停留超过2小时未移动', objectName: '豫E2M883', objectType: '车辆', town: '马家乡', detectTime: '2026-05-20 09:35:08', severity: '一般', evidence: 'GPS位置无变化', status: '已确认', suggestAction: '联系驾驶员确认情况' },
  { id: 'AD003', anomalyType: '车辆空跑', anomalyDesc: '豫E3G516在龙泉镇区域空驶里程占比过高', objectName: '豫E3G516', objectType: '车辆', town: '龙泉镇', detectTime: '2026-05-20 10:00:00', severity: '一般', evidence: '称重数据长时间无变化', status: '待确认', suggestAction: '分析轨迹和称重数据' },
  { id: 'AD004', anomalyType: '载重异常', anomalyDesc: '豫E8K270称重数据突变超过1.5吨', objectName: '豫E8K270', objectType: '车辆', town: '善应镇', detectTime: '2026-05-20 09:14:22', severity: '重要', evidence: '5分钟内从12.3t变为13.8t', status: '已处理', suggestAction: '核查称重设备状态' },
  { id: 'AD005', anomalyType: '箱体长时间满溢', anomalyDesc: '西上庄村1号小勾臂箱满溢超过3小时未处理', objectName: '西上庄村1号小勾臂箱', objectType: '箱体', town: '龙泉镇', detectTime: '2026-05-20 06:50:00', severity: '严重', evidence: '满溢比例95%，持续3h50min', status: '待处理', suggestAction: '紧急派单清运' },
]

// ========== APP端增强 ==========
export interface AppTask {
  id: string
  title: string
  desc: string
  time: string
  location: string
  status: string
  actionLabel: string
}

export const appDriverTasks: AppTask[] = [
  { id: 'ADT001', title: '马投涧北片上午收集', desc: '36个点位，预计4小时', time: '06:30-10:30', location: '马投涧镇北片', status: '进行中', actionLabel: '查看路线' },
  { id: 'ADT002', title: '牛家窑2号箱体满溢清运', desc: '满溢91%，紧急任务', time: '08:22 派发', location: '马投涧镇牛家窑村', status: '待接单', actionLabel: '接单' },
  { id: 'ADT003', title: '善应至焚烧厂转运', desc: '4个点位，预计7小时', time: '09:00-16:00', location: '善应镇→焚烧厂', status: '待开始', actionLabel: '查看详情' },
]

export const appDispatcherAlerts = [
  { id: 'ADA001', title: '箱体满溢告警', desc: '西上庄村1号箱体95%', time: '06:50', severity: '严重', status: '未处理' },
  { id: 'ADA002', title: '主动安全告警', desc: '豫E8K270分神驾驶', time: '09:14', severity: '严重', status: '未处理' },
  { id: 'ADA003', title: '设备离线告警', desc: '豫E2M883 GPS离线', time: '09:35', severity: '一般', status: '已查看' },
  { id: 'ADA004', title: '称重异常告警', desc: '豫E3G516数据突变', time: '10:01', severity: '重要', status: '未处理' },
]

export const appAdminMetrics = [
  { label: '今日垃圾量', value: '107.3t' },
  { label: '车辆在线率', value: '87.5%' },
  { label: '任务完成率', value: '91.2%' },
  { label: '告警处理率', value: '63.0%' },
]

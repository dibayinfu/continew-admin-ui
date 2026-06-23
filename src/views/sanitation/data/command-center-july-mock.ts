// ========== 数字大屏指挥中心 - 模拟数据 ==========
// 安阳龙安区坐标范围: lng 114.20~114.45, lat 35.95~36.12

// ===== 基础类型 =====
export interface GeoPoint {
  lng: number
  lat: number
}

// ===== 收集点 =====
export interface CollectionPoint extends GeoPoint {
  id: string
  name: string
  town: string
  village: string
  address: string
  boxCount: number
  status: '正常' | '预警'
}

// ===== 中转站 =====
export interface TransferStation extends GeoPoint {
  id: string
  name: string
  town: string
  address: string
  slots: number
  smallBoxCount: number
  largeBoxCount: number
  status: '正常' | '预警' | '满溢'
}

// ===== 焚烧厂 =====
export interface IncinerationPlant extends GeoPoint {
  id: string
  name: string
  address: string
  dailyCapacity: number
  todayProcessed: number
  status: '正常' | '维护'
}

// ===== 小勾臂箱 =====
export interface SmallBox extends GeoPoint {
  id: string
  boxNo: string
  boxName: string
  town: string
  village: string
  fillRate: number | null
  battery: number | null
  temperature: number | null
  lockStatus: '开锁' | '关锁' | '未知'
  status: '正常' | '预警' | '满溢' | '离线'
  lastReport: string
}

// ===== 大勾臂箱 =====
export interface LargeBox extends GeoPoint {
  id: string
  boxNo: string
  boxName: string
  town: string
  stationName: string
  fillRate: number | null
  status: '正常' | '预警' | '满溢' | '离线'
  lastReport: string
}

// ===== 车辆 =====
export interface Vehicle extends GeoPoint {
  id: string
  plateNo: string
  vehicleType: '小三轮' | '小勾臂车' | '大勾臂车'
  town: string
  driver: string
  driverPhone: string
  status: '在线' | '离线' | '充电'
  speed: number
  heading: number
  weight?: number
  alarms: number
  trackHistory: Array<GeoPoint & { time: string; speed: number }>
}

// ===== 主动安全告警 =====
export interface ActiveSafetyAlarm {
  id: string
  type: '分神驾驶' | '疲劳驾驶' | '接打电话' | '抽烟' | '车道偏离' | '跟车过近' | '行人碰撞预警'
  level: '严重' | '重要' | '一般'
  vehiclePlate: string
  driver: string
  town: string
  location: string
  lng: number
  lat: number
  triggerTime: string
  speed: number
  handleStatus: '未处理' | '已查看' | '已处理'
}

// ===== 箱体告警 =====
export interface BoxAlarm {
  id: string
  type: '满溢告警' | '低电量告警' | '设备离线' | '高温告警'
  level: '严重' | '重要' | '一般'
  boxType: '小勾臂箱' | '大勾臂箱'
  boxNo: string
  boxName: string
  town: string
  lng: number
  lat: number
  fillRate?: number
  battery?: number
  triggerTime: string
  handleStatus: '未处理' | '已处理' | '不需处理'
}

// ===== 收运任务 =====
export interface CollectionTask {
  id: string
  taskName: string
  taskType: string
  boxType: '小勾臂箱' | '大勾臂箱'
  boxNo: string
  boxName: string
  town: string
  startAddress: string
  destinationType: '中转站' | '焚烧厂'
  destinationName: string
  driver: string
  driverPhone: string
  vehicle: string
  vehicleType: string
  priority: '紧急' | '普通'
  slaMinutes: number
  collectionStatus: '待接单' | '已接单' | '收运中' | '已完成'
  overtimeStatus: '未超时' | '已超时'
  durationText: string
  weight?: number
  geoStart: GeoPoint
  geoEnd: GeoPoint
  vehicleLng: number
  vehicleLat: number
  trackPoints: Array<GeoPoint & { time: string }>
}

// ===== 乡镇垃圾量 =====
export interface TownWaste {
  town: string
  value: number
}

// ===== 趋势数据点 =====
export interface TrendPoint {
  time: string
  value: number
}

// ===== 指标 =====
export interface MetricItem {
  label: string
  value: string | number
  unit?: string
  trend?: string
  tone?: 'normal' | 'success' | 'warning' | 'danger' | 'processing' | 'offline'
}

// ===== 通用工具函数 =====
function rng(min: number, max: number): number {
  return +(min + Math.random() * (max - min)).toFixed(4)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function nowStr(): string {
  const d = new Date()
  return `2026-06-16 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ==================== 生成模拟数据 ====================

const townNames = ['马投涧镇', '龙泉镇', '善应镇', '马家乡', '东风乡', '彰武街道', '文明大道街道', '太行小区街道']
const villageNames: Record<string, string[]> = {
  '马投涧镇': ['南坡村', '牛家窑村', '郭里西村', '高小屯村', '盘龙寺村', '黄张村', '柏庄村'],
  '龙泉镇': ['石岩村', '西上庄村', '陈家庄村', '白龙庙村', '东平村', '九堰村'],
  '善应镇': ['善应北村', '南善应村', '张北河村', '南田村', '中城村'],
  '马家乡': ['化象村', '李家庄村', '东泽村', '马家村', '岭头村'],
  '东风乡': ['许吴村', '徐家口村', '西泽村', '红旗村', '大坡村'],
  '彰武街道': ['彰武村', '南彰武村', '北彰武村'],
  '文明大道街道': ['文明村', '三官庙村'],
  '太行小区街道': ['太行村', '石沟村'],
}

// ---- 收集点 (20个) ----
export const collectionPoints: CollectionPoint[] = []
let cpId = 1
for (const town of townNames) {
  const villages = villageNames[town] || []
  const count = town === '马投涧镇' ? 4 : town === '龙泉镇' ? 3 : 2
  for (let i = 0; i < Math.min(count, villages.length); i++) {
    collectionPoints.push({
      id: `CP${pad(cpId)}`,
      name: `${villages[i]}收集点`,
      town,
      village: villages[i],
      address: `龙安区${town}${villages[i]}村口`,
      lng: rng(114.22, 114.43),
      lat: rng(35.96, 36.11),
      boxCount: Math.floor(Math.random() * 3) + 1,
      status: Math.random() > 0.85 ? '预警' : '正常',
    })
    cpId++
  }
}

// ---- 中转站 (6个) ----
export const transferStations: TransferStation[] = [
  { id: 'S001', name: '马投涧中转站', town: '马投涧镇', address: '马投涧镇工业路1号', slots: 4, smallBoxCount: 3, largeBoxCount: 2, lng: 114.2892, lat: 36.0448, status: '正常' },
  { id: 'S002', name: '龙泉中转站', town: '龙泉镇', address: '龙泉镇南街12号', slots: 2, smallBoxCount: 2, largeBoxCount: 1, lng: 114.3128, lat: 36.0156, status: '预警' },
  { id: 'S003', name: '善应中转站', town: '善应镇', address: '善应镇东环路南段', slots: 2, smallBoxCount: 1, largeBoxCount: 2, lng: 114.4201, lat: 35.9835, status: '正常' },
  { id: 'S004', name: '马家中转站', town: '马家乡', address: '马家乡北街68号', slots: 2, smallBoxCount: 2, largeBoxCount: 1, lng: 114.2185, lat: 35.9768, status: '正常' },
  { id: 'S005', name: '东风中转站', town: '东风乡', address: '东风乡政府路西侧', slots: 2, smallBoxCount: 1, largeBoxCount: 1, lng: 114.3658, lat: 36.1112, status: '满溢' },
  { id: 'S006', name: '彰武中转站', town: '彰武街道', address: '彰武街道文明路南', slots: 2, smallBoxCount: 1, largeBoxCount: 1, lng: 114.3876, lat: 36.0342, status: '正常' },
]

// ---- 焚烧厂 (1个) ----
export const incinerationPlant: IncinerationPlant = {
  id: 'P001', name: '龙安生活垃圾焚烧厂', address: '龙安区静脉产业园', lng: 114.352, lat: 36.068,
  dailyCapacity: 600, todayProcessed: 218.5, status: '正常',
}

// ---- 小勾臂箱 (50个) ----
export const smallBoxes: SmallBox[] = []
for (let i = 1; i <= 50; i++) {
  const town = pick(townNames)
  const villages = villageNames[town] || []
  const village = pick(villages)
  const fillRate = Math.random() > 0.12 ? Math.floor(Math.random() * 95) : null
  const battery = Math.random() > 0.08 ? Math.floor(Math.random() * 95) + 5 : null
  const status: SmallBox['status'] = fillRate === null || battery === null ? '离线'
    : fillRate >= 90 ? '满溢'
    : fillRate >= 75 ? '预警'
    : '正常'
  smallBoxes.push({
    id: `SB${pad(i)}`,
    boxNo: `XB-${town.slice(0, 2)}-${pad(i)}`,
    boxName: `${village}${Math.floor(Math.random() * 3) + 1}号小勾臂箱`,
    town,
    village,
    fillRate,
    battery,
    temperature: fillRate !== null ? Math.floor(Math.random() * 30) + 15 : null,
    lockStatus: battery !== null && battery > 5 ? pick(['开锁', '关锁']) : '未知',
    status,
    lastReport: fillRate !== null ? nowStr() : '2026-06-16 06:00:00',
    lng: rng(114.22, 114.43),
    lat: rng(35.96, 36.11),
  })
}

// ---- 大勾臂箱 (20个) ----
export const largeBoxes: LargeBox[] = []
for (let i = 1; i <= 20; i++) {
  const station = pick(transferStations)
  const fillRate = Math.random() > 0.1 ? Math.floor(Math.random() * 98) : null
  largeBoxes.push({
    id: `LB${pad(i)}`,
    boxNo: `DB-${station.town.slice(0, 2)}-${pad(i)}`,
    boxName: `${station.town.slice(0, 2)}压缩箱${String.fromCharCode(64 + i)}`,
    town: station.town,
    stationName: station.name,
    fillRate,
    status: fillRate === null ? '离线'
      : fillRate >= 90 ? '满溢'
      : fillRate >= 75 ? '预警'
      : '正常',
    lastReport: fillRate !== null ? nowStr() : '2026-06-16 05:30:00',
    lng: rng(station.lng - 0.005, station.lng + 0.005),
    lat: rng(station.lat - 0.003, station.lat + 0.003),
  })
}

// ---- 车辆 (20辆) ----
function makeTrack(vehicle: { lng: number; lat: number; heading: number; speed: number }): Array<GeoPoint & { time: string; speed: number }> {
  const points: Array<GeoPoint & { time: string; speed: number }> = []
  let clng = vehicle.lng - 0.02
  let clat = vehicle.lat - 0.01
  for (let i = 29; i >= 0; i--) {
    clng += rng(-0.001, 0.002)
    clat += rng(-0.001, 0.0015)
    points.push({
      lng: +clng.toFixed(4),
      lat: +clat.toFixed(4),
      time: new Date(Date.now() - i * 60000).toISOString().slice(11, 19),
      speed: Math.max(0, vehicle.speed + Math.floor(rng(-10, 10))),
    })
  }
  return points
}

export const vehicles: Vehicle[] = [
  { id: 'V01', plateNo: '豫E7A031', vehicleType: '小三轮', town: '马投涧镇', driver: '张红军', driverPhone: '13937210011', status: '在线', speed: 18, heading: 45, weight: 0.8, alarms: 0, lng: 114.286, lat: 36.048, trackHistory: [] },
  { id: 'V02', plateNo: '豫E3G516', vehicleType: '小勾臂车', town: '龙泉镇', driver: '李师傅', driverPhone: '13900010022', status: '在线', speed: 46, heading: 120, weight: 2.4, alarms: 1, lng: 114.315, lat: 36.018, trackHistory: [] },
  { id: 'V03', plateNo: '豫E8K270', vehicleType: '大勾臂车', town: '善应镇', driver: '王师傅', driverPhone: '13900010023', status: '充电', speed: 0, heading: 0, weight: 13.8, alarms: 3, lng: 114.418, lat: 35.982, trackHistory: [] },
  { id: 'V04', plateNo: '豫E2M883', vehicleType: '小勾臂车', town: '马家乡', driver: '赵师傅', driverPhone: '13900010024', status: '离线', speed: 0, heading: 180, weight: 1.7, alarms: 0, lng: 114.215, lat: 35.974, trackHistory: [] },
  { id: 'V05', plateNo: '豫E6N109', vehicleType: '大勾臂车', town: '马投涧镇', driver: '孙师傅', driverPhone: '13900010025', status: '在线', speed: 39, heading: 270, weight: 11.6, alarms: 0, lng: 114.292, lat: 36.052, trackHistory: [] },
  { id: 'V06', plateNo: '豫E1P392', vehicleType: '小三轮', town: '东风乡', driver: '陈师傅', driverPhone: '13900010026', status: '在线', speed: 15, heading: 90, weight: 0.5, alarms: 0, lng: 114.368, lat: 36.108, trackHistory: [] },
  { id: 'V07', plateNo: '豫E5F678', vehicleType: '小三轮', town: '马投涧镇', driver: '周小明', driverPhone: '13900010027', status: '在线', speed: 22, heading: 315, weight: 0.6, alarms: 0, lng: 114.278, lat: 36.038, trackHistory: [] },
  { id: 'V08', plateNo: '豫E9C345', vehicleType: '小勾臂车', town: '龙泉镇', driver: '吴刚', driverPhone: '13900010028', status: '离线', speed: 0, heading: 0, weight: 1.9, alarms: 0, lng: 114.308, lat: 36.012, trackHistory: [] },
  { id: 'V09', plateNo: '豫E0D789', vehicleType: '大勾臂车', town: '善应镇', driver: '郑伟', driverPhone: '13900010029', status: '在线', speed: 55, heading: 60, weight: 12.5, alarms: 1, lng: 114.425, lat: 35.978, trackHistory: [] },
  { id: 'V10', plateNo: '豫E2F456', vehicleType: '小三轮', town: '马家乡', driver: '冯大伟', driverPhone: '13900010030', status: '在线', speed: 14, heading: 200, weight: 0.4, alarms: 0, lng: 114.212, lat: 35.968, trackHistory: [] },
  { id: 'V11', plateNo: '豫E7G123', vehicleType: '小勾臂车', town: '东风乡', driver: '褚怀亮', driverPhone: '13900010031', status: '充电', speed: 0, heading: 0, weight: 2.1, alarms: 0, lng: 114.362, lat: 36.112, trackHistory: [] },
  { id: 'V12', plateNo: '豫E3H890', vehicleType: '大勾臂车', town: '马投涧镇', driver: '卫东', driverPhone: '13900010032', status: '离线', speed: 0, heading: 0, weight: 14.2, alarms: 2, lng: 114.284, lat: 36.042, trackHistory: [] },
  { id: 'V13', plateNo: '豫E8J567', vehicleType: '小三轮', town: '龙泉镇', driver: '蒋小军', driverPhone: '13900010033', status: '在线', speed: 20, heading: 30, weight: 0.7, alarms: 0, lng: 114.320, lat: 36.022, trackHistory: [] },
  { id: 'V14', plateNo: '豫E1K234', vehicleType: '小勾臂车', town: '善应镇', driver: '沈国平', driverPhone: '13900010034', status: '离线', speed: 0, heading: 0, weight: 1.5, alarms: 0, lng: 114.412, lat: 35.986, trackHistory: [] },
  { id: 'V15', plateNo: '豫E5M901', vehicleType: '大勾臂车', town: '马家乡', driver: '韩志伟', driverPhone: '13900010035', status: '充电', speed: 0, heading: 0, weight: 10.8, alarms: 0, lng: 114.220, lat: 35.980, trackHistory: [] },
  { id: 'V16', plateNo: '豫E9N678', vehicleType: '小三轮', town: '东风乡', driver: '唐金平', driverPhone: '13900010036', status: '在线', speed: 12, heading: 150, weight: 0.3, alarms: 0, lng: 114.358, lat: 36.104, trackHistory: [] },
  { id: 'V17', plateNo: '豫E0P345', vehicleType: '小勾臂车', town: '马投涧镇', driver: '曹德旺', driverPhone: '13900010037', status: '在线', speed: 41, heading: 80, weight: 2.6, alarms: 1, lng: 114.298, lat: 36.046, trackHistory: [] },
  { id: 'V18', plateNo: '豫E2R012', vehicleType: '大勾臂车', town: '龙泉镇', driver: '彭建', driverPhone: '13900010038', status: '在线', speed: 48, heading: 250, weight: 12.1, alarms: 0, lng: 114.316, lat: 36.008, trackHistory: [] },
  { id: 'V19', plateNo: '豫E6S789', vehicleType: '小三轮', town: '彰武街道', driver: '贺明', driverPhone: '13900010039', status: '在线', speed: 16, heading: 10, weight: 0.5, alarms: 0, lng: 114.390, lat: 36.032, trackHistory: [] },
  { id: 'V20', plateNo: '豫E1T456', vehicleType: '小勾臂车', town: '马家乡', driver: '肖红卫', driverPhone: '13900010040', status: '在线', speed: 35, heading: 340, weight: 2.2, alarms: 0, lng: 114.224, lat: 35.972, trackHistory: [] },
]

vehicles.forEach((v) => {
  if (v.status === '在线') {
    v.trackHistory = makeTrack(v)
  } else {
    v.trackHistory = []
  }
})

// ---- 主动安全告警 (12条初始) ----
export const activeSafetyAlarms: ActiveSafetyAlarm[] = [
  { id: 'ASA001', type: '分神驾驶', level: '严重', vehiclePlate: '豫E8K270', driver: '王师傅', town: '善应镇', location: '善应镇东环路', lng: 114.418, lat: 35.982, triggerTime: '2026-06-16 09:14:22', speed: 52, handleStatus: '未处理' },
  { id: 'ASA002', type: '疲劳驾驶', level: '严重', vehiclePlate: '豫E6N109', driver: '孙师傅', town: '马投涧镇', location: '马投涧镇工业路', lng: 114.292, lat: 36.052, triggerTime: '2026-06-16 08:45:10', speed: 38, handleStatus: '已查看' },
  { id: 'ASA003', type: '接打电话', level: '重要', vehiclePlate: '豫E3G516', driver: '李师傅', town: '龙泉镇', location: '龙泉镇南街', lng: 114.315, lat: 36.018, triggerTime: '2026-06-16 10:02:33', speed: 44, handleStatus: '未处理' },
  { id: 'ASA004', type: '抽烟', level: '一般', vehiclePlate: '豫E0D789', driver: '郑伟', town: '善应镇', location: '善应镇中城村段', lng: 114.425, lat: 35.978, triggerTime: '2026-06-16 10:18:55', speed: 56, handleStatus: '未处理' },
  { id: 'ASA005', type: '车道偏离', level: '重要', vehiclePlate: '豫E0P345', driver: '曹德旺', town: '马投涧镇', location: '马投涧镇南坡村段', lng: 114.298, lat: 36.046, triggerTime: '2026-06-16 09:52:18', speed: 42, handleStatus: '已处理' },
  { id: 'ASA006', type: '跟车过近', level: '严重', vehiclePlate: '豫E2R012', driver: '彭建', town: '龙泉镇', location: '龙泉镇陈家庄段', lng: 114.316, lat: 36.008, triggerTime: '2026-06-16 10:25:41', speed: 50, handleStatus: '未处理' },
  { id: 'ASA007', type: '行人碰撞预警', level: '严重', vehiclePlate: '豫E3G516', driver: '李师傅', town: '龙泉镇', location: '龙泉镇西上庄村路口', lng: 114.310, lat: 36.010, triggerTime: '2026-06-16 08:12:06', speed: 35, handleStatus: '已查看' },
  { id: 'ASA008', type: '分神驾驶', level: '严重', vehiclePlate: '豫E1T456', driver: '肖红卫', town: '马家乡', location: '马家乡北街', lng: 114.224, lat: 35.972, triggerTime: '2026-06-16 11:03:29', speed: 36, handleStatus: '未处理' },
  { id: 'ASA009', type: '接打电话', level: '重要', vehiclePlate: '豫E5F678', driver: '周小明', town: '马投涧镇', location: '马投涧镇郭里西村段', lng: 114.278, lat: 36.038, triggerTime: '2026-06-16 10:45:12', speed: 20, handleStatus: '未处理' },
  { id: 'ASA010', type: '车道偏离', level: '重要', vehiclePlate: '豫E2F456', driver: '冯大伟', town: '马家乡', location: '马家乡东泽村段', lng: 114.212, lat: 35.968, triggerTime: '2026-06-16 11:15:38', speed: 16, handleStatus: '已处理' },
  { id: 'ASA011', type: '疲劳驾驶', level: '严重', vehiclePlate: '豫E3H890', driver: '卫东', town: '马投涧镇', location: '马投涧镇高小屯村', lng: 114.284, lat: 36.042, triggerTime: '2026-06-15 23:55:00', speed: 42, handleStatus: '未处理' },
  { id: 'ASA012', type: '抽烟', level: '一般', vehiclePlate: '豫E8J567', driver: '蒋小军', town: '龙泉镇', location: '龙泉镇白龙庙村', lng: 114.320, lat: 36.022, triggerTime: '2026-06-16 11:28:44', speed: 18, handleStatus: '未处理' },
]

// ---- 箱体告警 ----
export const boxAlarms: BoxAlarm[] = [
  { id: 'BA001', type: '满溢告警', level: '严重', boxType: '小勾臂箱', boxNo: 'XB-马投-012', boxName: '牛家窑2号小勾臂箱', town: '马投涧镇', lng: 114.276, lat: 36.038, fillRate: 91, triggerTime: '2026-06-16 08:22:00', handleStatus: '已处理' },
  { id: 'BA002', type: '满溢告警', level: '严重', boxType: '大勾臂箱', boxNo: 'DB-马投-005', boxName: '马投压缩箱E', town: '马投涧镇', lng: 114.289, lat: 36.045, fillRate: 94, triggerTime: '2026-06-16 07:45:00', handleStatus: '未处理' },
  { id: 'BA003', type: '低电量告警', level: '重要', boxType: '小勾臂箱', boxNo: 'XB-龙泉-008', boxName: '陈家庄2号小勾臂箱', town: '龙泉镇', lng: 114.320, lat: 36.014, battery: 8, triggerTime: '2026-06-16 09:38:00', handleStatus: '未处理' },
  { id: 'BA004', type: '设备离线', level: '一般', boxType: '小勾臂箱', boxNo: 'XB-龙泉-003', boxName: '石岩村1号小勾臂箱', town: '龙泉镇', lng: 114.302, lat: 36.022, triggerTime: '2026-06-16 08:11:00', handleStatus: '不需处理' },
  { id: 'BA005', type: '高温告警', level: '重要', boxType: '小勾臂箱', boxNo: 'XB-善应-012', boxName: '南田村2号小勾臂箱', town: '善应镇', lng: 114.416, lat: 35.991, fillRate: 81, triggerTime: '2026-06-16 10:42:00', handleStatus: '未处理' },
  { id: 'BA006', type: '满溢告警', level: '严重', boxType: '小勾臂箱', boxNo: 'XB-龙泉-004', boxName: '西上庄村1号小勾臂箱', town: '龙泉镇', lng: 114.308, lat: 36.010, fillRate: 95, triggerTime: '2026-06-16 06:50:00', handleStatus: '未处理' },
]

// ---- 收运任务 (15条) ----
export const collectionTasks: CollectionTask[] = [
  {
    id: 'CT001', taskName: '牛家窑2号小勾臂箱满溢收运', taskType: '小勾臂箱满溢收运', boxType: '小勾臂箱',
    boxNo: 'XB-马投-012', boxName: '牛家窑2号小勾臂箱', town: '马投涧镇',
    startAddress: '马投涧镇牛家窑村文化广场', destinationType: '中转站', destinationName: '马投涧中转站',
    driver: '张师傅', driverPhone: '13900010001', vehicle: '豫E3G516', vehicleType: '小勾臂车',
    priority: '紧急', slaMinutes: 60, collectionStatus: '已完成', overtimeStatus: '未超时',
    durationText: '48分钟', weight: 2.4,
    geoStart: { lng: 114.276, lat: 36.038 }, geoEnd: { lng: 114.289, lat: 36.045 },
    vehicleLng: 114.289, vehicleLat: 36.045,
    trackPoints: [
      { lng: 114.276, lat: 36.038, time: '08:28' }, { lng: 114.278, lat: 36.039, time: '08:35' },
      { lng: 114.281, lat: 36.040, time: '08:42' }, { lng: 114.284, lat: 36.042, time: '08:50' },
      { lng: 114.286, lat: 36.043, time: '08:58' }, { lng: 114.289, lat: 36.045, time: '09:10' },
    ],
  },
  {
    id: 'CT002', taskName: '马投涧压缩箱E满溢转运', taskType: '大勾臂箱满溢转运', boxType: '大勾臂箱',
    boxNo: 'DB-马投-005', boxName: '马投压缩箱E', town: '马投涧镇',
    startAddress: '马投涧中转站压缩箱区', destinationType: '焚烧厂', destinationName: '龙安生活垃圾焚烧厂',
    driver: '孙师傅', driverPhone: '13900010005', vehicle: '豫E6N109', vehicleType: '大勾臂车',
    priority: '紧急', slaMinutes: 60, collectionStatus: '收运中', overtimeStatus: '已超时',
    durationText: '已用1h18m', weight: 13.8,
    geoStart: { lng: 114.289, lat: 36.045 }, geoEnd: { lng: 114.352, lat: 36.068 },
    vehicleLng: 114.320, vehicleLat: 36.055,
    trackPoints: [
      { lng: 114.289, lat: 36.045, time: '07:56' }, { lng: 114.295, lat: 36.048, time: '08:08' },
      { lng: 114.305, lat: 36.052, time: '08:25' }, { lng: 114.315, lat: 36.055, time: '08:45' },
      { lng: 114.320, lat: 36.055, time: '09:00' },
    ],
  },
  {
    id: 'CT003', taskName: '西上庄村1号箱紧急清运', taskType: '小勾臂箱满溢收运', boxType: '小勾臂箱',
    boxNo: 'XB-龙泉-004', boxName: '西上庄村1号小勾臂箱', town: '龙泉镇',
    startAddress: '龙泉镇西上庄村村委会西侧', destinationType: '中转站', destinationName: '龙泉中转站',
    driver: '吴刚', driverPhone: '13900010028', vehicle: '豫E9C345', vehicleType: '小勾臂车',
    priority: '紧急', slaMinutes: 45, collectionStatus: '待接单', overtimeStatus: '已超时',
    durationText: '等待接单', weight: undefined,
    geoStart: { lng: 114.308, lat: 36.010 }, geoEnd: { lng: 114.313, lat: 36.016 },
    vehicleLng: 114.310, vehicleLat: 36.012,
    trackPoints: [],
  },
  {
    id: 'CT004', taskName: '善应北村日常收集', taskType: '日常清运', boxType: '小勾臂箱',
    boxNo: 'XB-善应-005', boxName: '善应北村收集点箱体', town: '善应镇',
    startAddress: '善应镇北片收集点', destinationType: '中转站', destinationName: '善应中转站',
    driver: '沈国平', driverPhone: '13900010034', vehicle: '豫E1K234', vehicleType: '小勾臂车',
    priority: '普通', slaMinutes: 120, collectionStatus: '已完成', overtimeStatus: '未超时',
    durationText: '105分钟', weight: 3.2,
    geoStart: { lng: 114.418, lat: 35.986 }, geoEnd: { lng: 114.420, lat: 35.984 },
    vehicleLng: 114.420, vehicleLat: 35.984,
    trackPoints: [
      { lng: 114.418, lat: 35.986, time: '06:15' }, { lng: 114.419, lat: 35.985, time: '07:00' },
      { lng: 114.420, lat: 35.984, time: '08:00' },
    ],
  },
  {
    id: 'CT005', taskName: '南坡村日常收集', taskType: '日常清运', boxType: '小勾臂箱',
    boxNo: 'XB-马投-001', boxName: '南坡村1号小勾臂箱', town: '马投涧镇',
    startAddress: '马投涧镇南坡村东口', destinationType: '中转站', destinationName: '马投涧中转站',
    driver: '张红军', driverPhone: '13937210011', vehicle: '豫E7A031', vehicleType: '小三轮',
    priority: '普通', slaMinutes: 120, collectionStatus: '已接单', overtimeStatus: '未超时',
    durationText: '准备装车', weight: undefined,
    geoStart: { lng: 114.286, lat: 36.048 }, geoEnd: { lng: 114.289, lat: 36.045 },
    vehicleLng: 114.287, vehicleLat: 36.047,
    trackPoints: [{ lng: 114.286, lat: 36.048, time: '10:30' }],
  },
  {
    id: 'CT006', taskName: '龙泉压缩箱C转运', taskType: '大勾臂箱转运', boxType: '大勾臂箱',
    boxNo: 'DB-龙泉-003', boxName: '龙泉压缩箱C', town: '龙泉镇',
    startAddress: '龙泉中转站', destinationType: '焚烧厂', destinationName: '龙安生活垃圾焚烧厂',
    driver: '彭建', driverPhone: '13900010038', vehicle: '豫E2R012', vehicleType: '大勾臂车',
    priority: '普通', slaMinutes: 90, collectionStatus: '已接单', overtimeStatus: '未超时',
    durationText: '准备出发', weight: undefined,
    geoStart: { lng: 114.313, lat: 36.016 }, geoEnd: { lng: 114.352, lat: 36.068 },
    vehicleLng: 114.314, vehicleLat: 36.016,
    trackPoints: [{ lng: 114.313, lat: 36.016, time: '11:00' }],
  },
  {
    id: 'CT007', taskName: '陈家庄2号低电量箱体回收', taskType: '设备运维', boxType: '小勾臂箱',
    boxNo: 'XB-龙泉-008', boxName: '陈家庄2号小勾臂箱', town: '龙泉镇',
    startAddress: '龙泉镇陈家庄村东口', destinationType: '中转站', destinationName: '龙泉中转站',
    driver: '李师傅', driverPhone: '13900010022', vehicle: '豫E3G516', vehicleType: '小勾臂车',
    priority: '紧急', slaMinutes: 120, collectionStatus: '收运中', overtimeStatus: '未超时',
    durationText: '行驶中', weight: undefined,
    geoStart: { lng: 114.320, lat: 36.014 }, geoEnd: { lng: 114.313, lat: 36.016 },
    vehicleLng: 114.317, vehicleLat: 36.015,
    trackPoints: [
      { lng: 114.320, lat: 36.014, time: '09:45' }, { lng: 114.317, lat: 36.015, time: '10:05' },
    ],
  },
  { id: 'CT008', taskName: '东风中转站满溢压缩箱转运', taskType: '大勾臂箱转运', boxType: '大勾臂箱', boxNo: 'DB-东风-007', boxName: '东风压缩箱A', town: '东风乡', startAddress: '东风中转站', destinationType: '焚烧厂', destinationName: '龙安生活垃圾焚烧厂', driver: '褚怀亮', driverPhone: '13900010031', vehicle: '豫E7G123', vehicleType: '小勾臂车', priority: '紧急', slaMinutes: 80, collectionStatus: '待接单', overtimeStatus: '已超时', durationText: '等待接单', geoStart: { lng: 114.366, lat: 36.111 }, geoEnd: { lng: 114.352, lat: 36.068 }, vehicleLng: 114.366, vehicleLat: 36.111, trackPoints: [] },
  { id: 'CT009', taskName: '化象村日常收集', taskType: '日常清运', boxType: '小勾臂箱', boxNo: 'XB-马家-015', boxName: '化象村1号小勾臂箱', town: '马家乡', startAddress: '马家乡化象村村口', destinationType: '中转站', destinationName: '马家中转站', driver: '肖红卫', driverPhone: '13900010040', vehicle: '豫E1T456', vehicleType: '小勾臂车', priority: '普通', slaMinutes: 120, collectionStatus: '收运中', overtimeStatus: '未超时', durationText: '前往中转站', weight: 2.2, geoStart: { lng: 114.209, lat: 35.970 }, geoEnd: { lng: 114.219, lat: 35.977 }, vehicleLng: 114.215, vehicleLat: 35.974, trackPoints: [{ lng: 114.209, lat: 35.970, time: '10:40' }, { lng: 114.215, lat: 35.974, time: '11:05' }] },
  { id: 'CT010', taskName: '彰武街道下午收集', taskType: '日常清运', boxType: '小勾臂箱', boxNo: 'XB-彰武-018', boxName: '南彰武村收集点箱体', town: '彰武街道', startAddress: '彰武街道南彰武村', destinationType: '中转站', destinationName: '彰武中转站', driver: '贺明', driverPhone: '13900010039', vehicle: '豫E6S789', vehicleType: '小三轮', priority: '普通', slaMinutes: 120, collectionStatus: '待接单', overtimeStatus: '未超时', durationText: '等待接单', geoStart: { lng: 114.390, lat: 36.032 }, geoEnd: { lng: 114.388, lat: 36.034 }, vehicleLng: 114.390, vehicleLat: 36.032, trackPoints: [] },
  { id: 'CT011', taskName: '高小屯村日常收集', taskType: '日常清运', boxType: '小勾臂箱', boxNo: 'XB-马投-008', boxName: '高小屯村收集点箱体', town: '马投涧镇', startAddress: '马投涧镇高小屯村北头', destinationType: '中转站', destinationName: '马投涧中转站', driver: '周小明', driverPhone: '13900010027', vehicle: '豫E5F678', vehicleType: '小三轮', priority: '普通', slaMinutes: 120, collectionStatus: '已完成', overtimeStatus: '未超时', durationText: '92分钟', weight: 0.9, geoStart: { lng: 114.302, lat: 36.052 }, geoEnd: { lng: 114.289, lat: 36.045 }, vehicleLng: 114.289, vehicleLat: 36.045, trackPoints: [{ lng: 114.302, lat: 36.052, time: '08:00' }, { lng: 114.295, lat: 36.048, time: '08:45' }, { lng: 114.289, lat: 36.045, time: '09:32' }] },
  { id: 'CT012', taskName: '东泽村日常收集', taskType: '日常清运', boxType: '小勾臂箱', boxNo: 'XB-马家-016', boxName: '东泽村1号小勾臂箱', town: '马家乡', startAddress: '马家乡东泽村', destinationType: '中转站', destinationName: '马家中转站', driver: '冯大伟', driverPhone: '13900010030', vehicle: '豫E2F456', vehicleType: '小三轮', priority: '普通', slaMinutes: 120, collectionStatus: '收运中', overtimeStatus: '未超时', durationText: '装车中', geoStart: { lng: 114.209, lat: 35.980 }, geoEnd: { lng: 114.219, lat: 35.977 }, vehicleLng: 114.210, vehicleLat: 35.979, trackPoints: [{ lng: 114.209, lat: 35.980, time: '10:15' }, { lng: 114.210, lat: 35.979, time: '10:45' }] },
  { id: 'CT013', taskName: '南善应压缩箱A转运', taskType: '大勾臂箱转运', boxType: '大勾臂箱', boxNo: 'DB-善应-009', boxName: '善应压缩箱B', town: '善应镇', startAddress: '善应中转站', destinationType: '焚烧厂', destinationName: '龙安生活垃圾焚烧厂', driver: '郑伟', driverPhone: '13900010029', vehicle: '豫E0D789', vehicleType: '大勾臂车', priority: '普通', slaMinutes: 90, collectionStatus: '已完成', overtimeStatus: '未超时', durationText: '78分钟', weight: 12.5, geoStart: { lng: 114.420, lat: 35.984 }, geoEnd: { lng: 114.352, lat: 36.068 }, vehicleLng: 114.352, vehicleLat: 36.068, trackPoints: [{ lng: 114.420, lat: 35.984, time: '07:30' }, { lng: 114.390, lat: 36.010, time: '08:00' }, { lng: 114.352, lat: 36.068, time: '08:48' }] },
  { id: 'CT014', taskName: '徐家口村日常收集', taskType: '日常清运', boxType: '小勾臂箱', boxNo: 'XB-东风-009', boxName: '徐家口2号小勾臂箱', town: '东风乡', startAddress: '东风乡徐家口村', destinationType: '中转站', destinationName: '东风中转站', driver: '陈师傅', driverPhone: '13900010026', vehicle: '豫E1P392', vehicleType: '小三轮', priority: '普通', slaMinutes: 120, collectionStatus: '已接单', overtimeStatus: '未超时', durationText: '准备出发', geoStart: { lng: 114.369, lat: 36.105 }, geoEnd: { lng: 114.366, lat: 36.111 }, vehicleLng: 114.369, vehicleLat: 36.105, trackPoints: [{ lng: 114.369, lat: 36.105, time: '11:10' }] },
  { id: 'CT015', taskName: '马投涧北片上午收集', taskType: '日常清运', boxType: '小勾臂箱', boxNo: 'XB-马投-003', boxName: '郭里西3号小勾臂箱', town: '马投涧镇', startAddress: '马投涧镇郭里西村', destinationType: '中转站', destinationName: '马投涧中转站', driver: '曹德旺', driverPhone: '13900010037', vehicle: '豫E0P345', vehicleType: '小勾臂车', priority: '普通', slaMinutes: 120, collectionStatus: '已完成', overtimeStatus: '未超时', durationText: '86分钟', weight: 2.6, geoStart: { lng: 114.271, lat: 36.042 }, geoEnd: { lng: 114.289, lat: 36.045 }, vehicleLng: 114.289, vehicleLat: 36.045, trackPoints: [{ lng: 114.271, lat: 36.042, time: '08:20' }, { lng: 114.280, lat: 36.044, time: '08:55' }, { lng: 114.289, lat: 36.045, time: '09:46' }] },
]

// ---- 乡镇垃圾量排行 ----
export const townWasteRank: TownWaste[] = [
  { town: '马投涧镇', value: 28.6 },
  { town: '龙泉镇', value: 22.4 },
  { town: '善应镇', value: 19.8 },
  { town: '马家乡', value: 17.2 },
  { town: '东风乡', value: 14.5 },
  { town: '彰武街道', value: 11.3 },
  { town: '文明大道街道', value: 8.7 },
  { town: '太行小区街道', value: 6.1 },
]

// ---- 24小时趋势 ----
export const wasteTrend: TrendPoint[] = [
  { time: '00:00', value: 3.2 }, { time: '03:00', value: 7.8 },
  { time: '06:00', value: 18.4 }, { time: '09:00', value: 45.6 },
  { time: '12:00', value: 82.3 }, { time: '15:00', value: 108.7 },
  { time: '18:00', value: 128.6 }, { time: '21:00', value: 136.2 },
]

// ---- SLA 趋势 ----
export const slaTrend: TrendPoint[] = [
  { time: '08:00', value: 82 }, { time: '10:00', value: 86 },
  { time: '12:00', value: 91 }, { time: '14:00', value: 88 },
  { time: '16:00', value: 93 }, { time: '18:00', value: 90 },
]

// ---- 多维分析数据 ----
export interface MultiAnalysisRow {
  dimension: string
  name: string
  dailyWaste: string
  monthlyWaste: string
  trips: number
  avgLoad: string
  trend: string
}

export const multiAnalysisData: MultiAnalysisRow[] = [
  { dimension: '乡镇', name: '马投涧镇', dailyWaste: '28.6t', monthlyWaste: '858.0t', trips: 56, avgLoad: '0.51t', trend: '+3.2%' },
  { dimension: '乡镇', name: '龙泉镇', dailyWaste: '22.4t', monthlyWaste: '672.0t', trips: 44, avgLoad: '0.51t', trend: '+1.8%' },
  { dimension: '乡镇', name: '善应镇', dailyWaste: '19.8t', monthlyWaste: '594.0t', trips: 38, avgLoad: '0.52t', trend: '+2.5%' },
  { dimension: '车辆', name: '豫E8K270', dailyWaste: '13.8t', monthlyWaste: '414.0t', trips: 4, avgLoad: '3.45t', trend: '-' },
  { dimension: '车辆', name: '豫E6N109', dailyWaste: '11.6t', monthlyWaste: '348.0t', trips: 3, avgLoad: '3.87t', trend: '-' },
  { dimension: '车辆', name: '豫E3G516', dailyWaste: '2.8t', monthlyWaste: '84.0t', trips: 7, avgLoad: '0.40t', trend: '-' },
  { dimension: '中转站', name: '马投涧中转站', dailyWaste: '28.6t', monthlyWaste: '858.0t', trips: 18, avgLoad: '1.59t', trend: '+3.2%' },
  { dimension: '中转站', name: '龙泉中转站', dailyWaste: '22.4t', monthlyWaste: '672.0t', trips: 14, avgLoad: '1.60t', trend: '+1.8%' },
  { dimension: '日期', name: '6/10（周二）', dailyWaste: '124.8t', monthlyWaste: '-', trips: 85, avgLoad: '1.47t', trend: '-' },
  { dimension: '日期', name: '6/11（周三）', dailyWaste: '131.5t', monthlyWaste: '-', trips: 88, avgLoad: '1.49t', trend: '+5.4%' },
  { dimension: '日期', name: '6/12（周四）', dailyWaste: '128.2t', monthlyWaste: '-', trips: 86, avgLoad: '1.49t', trend: '-2.5%' },
  { dimension: '日期', name: '6/13（周五）', dailyWaste: '135.6t', monthlyWaste: '-', trips: 92, avgLoad: '1.47t', trend: '+5.8%' },
  { dimension: '日期', name: '6/14（周六）', dailyWaste: '118.3t', monthlyWaste: '-', trips: 78, avgLoad: '1.52t', trend: '-12.8%' },
  { dimension: '日期', name: '6/15（周日）', dailyWaste: '112.1t', monthlyWaste: '-', trips: 75, avgLoad: '1.49t', trend: '-5.2%' },
  { dimension: '日期', name: '6/16（周一）', dailyWaste: '136.2t', monthlyWaste: '-', trips: 94, avgLoad: '1.45t', trend: '+21.5%' },
]

// ---- 车辆告警排行 ----
export interface VehicleAlarmRank {
  plateNo: string
  vehicleType: string
  driver: string
  alarmCount: number
}

export const vehicleAlarmRank: VehicleAlarmRank[] = [
  { plateNo: '豫E8K270', vehicleType: '大勾臂车', driver: '王师傅', alarmCount: 3 },
  { plateNo: '豫E3H890', vehicleType: '大勾臂车', driver: '卫东', alarmCount: 2 },
  { plateNo: '豫E3G516', vehicleType: '小勾臂车', driver: '李师傅', alarmCount: 1 },
  { plateNo: '豫E0D789', vehicleType: '大勾臂车', driver: '郑伟', alarmCount: 1 },
  { plateNo: '豫E0P345', vehicleType: '小勾臂车', driver: '曹德旺', alarmCount: 1 },
  { plateNo: '豫E1T456', vehicleType: '小勾臂车', driver: '肖红卫', alarmCount: 0 },
  { plateNo: '豫E6N109', vehicleType: '大勾臂车', driver: '孙师傅', alarmCount: 0 },
  { plateNo: '豫E2R012', vehicleType: '大勾臂车', driver: '彭建', alarmCount: 0 },
]

// ---- 超时任务清单 ----
export interface OvertimeTask {
  taskName: string
  deadline: string
  actualDuration: string
  overtimeMinutes: number
  driver: string
}

export const overtimeTaskList: OvertimeTask[] = [
  { taskName: '西上庄村1号箱紧急清运', deadline: '10:00', actualDuration: '已超2h', overtimeMinutes: 120, driver: '吴刚' },
  { taskName: '马投涧压缩箱E满溢转运', deadline: '09:30', actualDuration: '已超1h18m', overtimeMinutes: 78, driver: '孙师傅' },
  { taskName: '东风中转站满溢压缩箱转运', deadline: '10:30', actualDuration: '已超40m', overtimeMinutes: 40, driver: '褚怀亮' },
]

import type { TableRow } from './mock'
import { alarms, boxes, stations, towns, vehicles, villages, weighRecords, workOrders } from './mock'
import { collectionTasks } from './alert-task'

export interface PageColumn {
  title: string
  dataIndex: string
  width?: number
}

export interface PageAction {
  label: string
  status?: 'normal' | 'warning' | 'danger' | 'success'
}

/** 产品需求说明的一个区块 */
export interface FilterItem {
  /** 筛选字段的 dataIndex */
  key: string
  /** 下拉选项，第一项为「全部」 */
  options: string[]
}

export interface PrdSection {
  title: string
  items: Array<{ label: string; value: string }>
}

export interface PrototypePageConfig {
  key: string
  title: string
  subtitle: string
  phase: string
  priority: string
  module: string
  searchPlaceholder: string
  filters: string[]
  metrics: Array<{ label: string, value: string | number, unit?: string, tone?: string, tooltip?: string }>
  columns: PageColumn[]
  rows: TableRow[]
  actions: PageAction[]
  detailSections: Array<{ title: string, items: Array<{ label: string, value: string }> }>
  /** 每个字段的下拉选项，key 为 dataIndex */
  fieldOptions?: Record<string, string[]>
  /** 产品需求说明（可选），嵌入在页面上方可折叠面板中 */
  prd?: PrdSection[]
  /** 额外的多筛选条件（可选） */
  multiFilters?: FilterItem[]
}

const stationRows = stations.map((item) => ({
  ...item,
}))

const boxRows = boxes.map((item) => ({
  ...item,
  fillRateText: item.fillRate == null ? '-' : `${item.fillRate}%`,
  batteryText: item.battery == null ? '-' : `${item.battery}%`,
  temperatureText: item.temperature == null ? '-' : `${item.temperature}℃`,
}))

export const smallBoxStatusConfig = {
  warningFillRate: 75,
  overflowFillRate: 90,
  offlineMinutes: 60,
  highTemperature: 60,
}

function getOverflowStatus(fillRate: unknown) {
  const value = Number(fillRate)
  if (Number.isNaN(value)) return '-'
  if (value >= smallBoxStatusConfig.overflowFillRate) return '满溢'
  if (value >= smallBoxStatusConfig.warningFillRate) return '预警'
  return '正常'
}

function getOnlineStatus(lastReportMinutesAgo: unknown) {
  const value = Number(lastReportMinutesAgo)
  if (Number.isNaN(value)) return '离线'
  return value >= smallBoxStatusConfig.offlineMinutes ? '离线' : '在线'
}

function getBatteryStatus(battery: unknown) {
  const value = Number(battery)
  if (Number.isNaN(value)) return '-'
  return value < 10 ? '低电量' : '正常'
}

function getTemperatureStatus(temperature: unknown) {
  const value = Number(temperature)
  if (Number.isNaN(value)) return '-'
  return value > smallBoxStatusConfig.highTemperature ? '高温' : '正常'
}

const smallBoxRows = boxRows
  .filter((b) => b.boxType === '小勾臂箱')
  .map((item) => ({
    ...item,
    overflowStatus: getOverflowStatus(item.fillRate),
    onlineStatus: getOnlineStatus(item.lastReportMinutesAgo),
    batteryStatus: getBatteryStatus(item.battery),
    temperatureStatus: getTemperatureStatus(item.temperature),
    reportTime: item.lastReportMinutesAgo != null ? `${item.lastReportMinutesAgo} 分钟前` : '-',
    locationMatchLabel: item.locationType === 'collectionPoint' ? '收集点围栏' : item.locationType === 'vehicle' ? '车辆 GPS' : item.locationType === 'station' ? '中转站围栏' : '',
  }))

const largeBoxRows = boxRows
  .filter((b) => b.boxType === '大勾臂箱')
  .map((item) => ({
    ...item,
    overflowStatus: getOverflowStatus(item.fillRate),
    onlineStatus: getOnlineStatus(item.lastReportMinutesAgo),
    locationMatchLabel: item.locationType === 'station' ? '中转站围栏' : item.locationType === 'vehicle' ? '车辆 GPS' : item.locationType === 'plant' ? '焚烧厂围栏' : '',
  }))

const vehicleRows = vehicles.map((item) => ({
  ...item,
  mileageText: `${item.mileage} km`,
  speedText: `${item.speed} km/h`,
}))

const alarmRows = alarms.map((item) => ({
  ...item,
  object: item.target,
}))

const alertRuleRows: Record<string, any>[] = [
  { id: 'AR001', alarmType: '小勾臂箱满溢', level: '一般', thresholdValue: 90, thresholdUnit: '%', thresholdDesc: '垃圾占比 > 90%', notifyMethods: ['系统消息（PC/APP）', '小程序'], notifyScope: '所有人', notifyUsers: [], notifyContent: '【满溢告警】{boxName} 当前垃圾占比 {fillRate}%，请及时安排清运。', notifyScopeLabel: '所有人', morningSend: false, morningTime: '08:00', morningSendLabel: '实时发送', status: '启用' },
  { id: 'AR002', alarmType: '小勾臂箱低电量', level: '一般', thresholdValue: 10, thresholdUnit: '%', thresholdDesc: '电量 < 10%', notifyMethods: ['系统消息（PC/APP）'], notifyScope: '所有人', notifyUsers: [], notifyContent: '【低电量告警】{boxName} 当前电量 {battery}%，请检查太阳能板或更换电池。', notifyScopeLabel: '所有人', morningSend: true, morningTime: '08:00', morningSendLabel: '次日 08:00 发送', status: '启用' },
  { id: 'AR003', alarmType: '小勾臂箱高温', level: '一般', thresholdValue: 60, thresholdUnit: '°C', thresholdDesc: '温度 > 60°C', notifyMethods: ['系统消息（PC/APP）', '小程序', '短信'], notifyScope: '指定用户', notifyUsers: ['张师傅', '李师傅'], notifyContent: '【高温告警】{boxName} 当前温度 {temperature}°C，存在安全隐患，请立即处理。', notifyScopeLabel: '指定 2 人', morningSend: false, morningTime: '08:00', morningSendLabel: '实时发送', status: '启用' },
  { id: 'AR004', alarmType: '小勾臂箱离线', level: '一般', thresholdValue: 60, thresholdUnit: '分钟', thresholdDesc: '无心跳 > 60 分钟', notifyMethods: ['系统消息（PC/APP）'], notifyScope: '所有人', notifyUsers: [], notifyContent: '【离线告警】{boxName} 已离线超过 60 分钟，请检查设备状态。', notifyScopeLabel: '所有人', morningSend: true, morningTime: '07:30', morningSendLabel: '次日 07:30 发送', status: '启用' },
  { id: 'AR005', alarmType: '大勾臂箱满溢', level: '一般', thresholdValue: 90, thresholdUnit: '%', thresholdDesc: '垃圾占比 > 90%', notifyMethods: ['系统消息（PC/APP）', '小程序'], notifyScope: '所有人', notifyUsers: [], notifyContent: '【满溢告警】{boxName} 当前垃圾占比 {fillRate}%，请及时安排清运。', notifyScopeLabel: '所有人', morningSend: false, morningTime: '08:00', morningSendLabel: '实时发送', status: '启用' },
  { id: 'AR006', alarmType: '大勾臂箱离线', level: '一般', thresholdValue: 1440, thresholdUnit: '分钟', thresholdDesc: '无心跳 > 24 小时', notifyMethods: ['系统消息（PC/APP）'], notifyScope: '所有人', notifyUsers: [], notifyContent: '【离线告警】{boxName} 已离线超过 24 小时，请检查设备状态。', notifyScopeLabel: '所有人', morningSend: true, morningTime: '08:00', morningSendLabel: '次日 08:00 发送', status: '停用' },
]

const weighingRows = weighRecords.map((item) => ({
  ...item,
  weightText: `${item.weight} t`,
}))

const collectionPoints = [
  { id: 'C001', name: '南坡村东口收集点', pointNo: 'CP-MTJ-001', town: '马投涧镇', village: '南坡村', type: '垃圾桶点', containers: 12, address: '南坡村东口路边', radius: 200, longitude: 114.2987, latitude: 36.0512, contactPerson: '张师傅', contactPhone: '13900010001', status: '启用' },
  { id: 'C002', name: '牛家窑文化广场收集点', pointNo: 'CP-MTJ-002', town: '马投涧镇', village: '牛家窑村', type: '小勾臂箱摆放点', containers: 2, address: '牛家窑村文化广场西侧', radius: 200, longitude: 114.2753, latitude: 36.0385, contactPerson: '周小明', contactPhone: '13900010005', status: '启用' },
  { id: 'C003', name: '石岩村南收集点', pointNo: 'CP-LQ-001', town: '龙泉镇', village: '石岩村', type: '小勾臂箱摆放点', containers: 2, address: '石岩村村南路口', radius: 200, longitude: 114.3055, latitude: 36.0201, contactPerson: '李师傅', contactPhone: '13900010002', status: '启用' },
  { id: 'C004', name: '善应北村学校收集点', pointNo: 'CP-SY-001', town: '善应镇', village: '善应北村', type: '垃圾桶点', containers: 10, address: '善应北村小学东门', radius: 200, longitude: 114.4218, latitude: 35.9882, contactPerson: '王磊', contactPhone: '13900010003', status: '停用' },
  { id: 'C005', name: '西上庄村东收集点', pointNo: 'CP-LQ-002', town: '龙泉镇', village: '西上庄村', type: '垃圾桶点', containers: 8, address: '西上庄村东口', radius: 200, longitude: 114.3221, latitude: 36.0128, contactPerson: '蒋小军', contactPhone: '13900010011', status: '启用' },
  { id: 'C006', name: '郭里西村广场收集点', pointNo: 'CP-MTJ-003', town: '马投涧镇', village: '郭里西村', type: '垃圾桶点', containers: 6, address: '郭里西村文化广场', radius: 200, longitude: 114.2738, latitude: 36.0432, contactPerson: '卫东', contactPhone: '13900010010', status: '启用' },
  { id: 'C007', name: '高小屯村北收集点', pointNo: 'CP-MTJ-004', town: '马投涧镇', village: '高小屯村', type: '小勾臂箱摆放点', containers: 1, address: '高小屯村北头', radius: 200, longitude: 114.3041, latitude: 36.0548, contactPerson: '赵强', contactPhone: '13900010004', status: '启用' },
  { id: 'C008', name: '许吴村中心收集点', pointNo: 'CP-DF-001', town: '东风乡', village: '许吴村', type: '垃圾桶点', containers: 8, address: '许吴村中心街', radius: 200, longitude: 114.3598, latitude: 36.1142, contactPerson: '褚怀亮', contactPhone: '13900010009', status: '启用' },
  { id: 'C009', name: '徐家口村南收集点', pointNo: 'CP-DF-002', town: '东风乡', village: '徐家口村', type: '小勾臂箱摆放点', containers: 2, address: '徐家口村南路口', radius: 200, longitude: 114.3712, latitude: 36.1065, contactPerson: '唐金平', contactPhone: '13900010014', status: '启用' },
  { id: 'C010', name: '张北河村收集点', pointNo: 'CP-SY-002', town: '善应镇', village: '张北河村', type: '垃圾桶点', containers: 6, address: '张北河村东', radius: 200, longitude: 114.4268, latitude: 35.9785, contactPerson: '郑伟', contactPhone: '13900010007', status: '启用' },
  { id: 'C011', name: '南善应村小学收集点', pointNo: 'CP-SY-003', town: '善应镇', village: '南善应村', type: '垃圾桶点', containers: 10, address: '南善应村小学门前', radius: 200, longitude: 114.4105, latitude: 35.9741, contactPerson: '沈国平', contactPhone: '13900010012', status: '启用' },
  { id: 'C012', name: '李家庄村收集点', pointNo: 'CP-MJ-001', town: '马家乡', village: '李家庄村', type: '小勾臂箱摆放点', containers: 1, address: '李家庄村西', radius: 200, longitude: 114.2231, latitude: 35.9702, contactPerson: '宋立军', contactPhone: '13900010019', status: '启用' },
  { id: 'C013', name: '东泽村收集点', pointNo: 'CP-MJ-002', town: '马家乡', village: '东泽村', type: '垃圾桶点', containers: 5, address: '东泽村中心', radius: 200, longitude: 114.2103, latitude: 35.9818, contactPerson: '韩志伟', contactPhone: '13900010013', status: '启用' },
  { id: 'C014', name: '西泽村北收集点', pointNo: 'CP-DF-003', town: '东风乡', village: '西泽村', type: '垃圾桶点', containers: 7, address: '西泽村北街', radius: 200, longitude: 114.3482, latitude: 36.1175, contactPerson: '吴刚', contactPhone: '13900010006', status: '启用' },
  { id: 'C015', name: '陈家庄村东收集点', pointNo: 'CP-LQ-003', town: '龙泉镇', village: '陈家庄村', type: '小勾臂箱摆放点', containers: 2, address: '陈家庄村东口', radius: 200, longitude: 114.3285, latitude: 36.0152, contactPerson: '刘敏', contactPhone: '13900010015', status: '启用' },
  { id: 'C016', name: '白龙庙村收集点', pointNo: 'CP-LQ-004', town: '龙泉镇', village: '白龙庙村', type: '垃圾桶点', containers: 4, address: '白龙庙村北', radius: 200, longitude: 114.2971, latitude: 36.0274, contactPerson: '杨秀英', contactPhone: '13900010016', status: '启用' },
  { id: 'C017', name: '黄张村东收集点', pointNo: 'CP-MTJ-005', town: '马投涧镇', village: '黄张村', type: '垃圾桶点', containers: 5, address: '黄张村东头', radius: 200, longitude: 114.2886, latitude: 36.0399, contactPerson: '冯大伟', contactPhone: '13900010008', status: '启用' },
  { id: 'C018', name: '南田村收集点', pointNo: 'CP-SY-004', town: '善应镇', village: '南田村', type: '小勾臂箱摆放点', containers: 2, address: '南田村村委会旁', radius: 200, longitude: 114.4173, latitude: 35.9929, contactPerson: '马春霞', contactPhone: '13900010018', status: '启用' },
  { id: 'C019', name: '马家村南收集点', pointNo: 'CP-MJ-003', town: '马家乡', village: '马家村', type: '垃圾桶点', containers: 6, address: '马家村南街', radius: 200, longitude: 114.2169, latitude: 35.9654, contactPerson: '陈秀兰', contactPhone: '13900010017', status: '启用' },
  { id: 'C020', name: '化象村东收集点', pointNo: 'CP-MJ-004', town: '马家乡', village: '化象村', type: '小勾臂箱摆放点', containers: 1, address: '化象村东侧公路边', radius: 200, longitude: 114.2121, latitude: 35.9725, contactPerson: '周凯', contactPhone: '13900010020', status: '启用' },
]

function makeBoxDeviceNo(boxNo: unknown) {
  const value = String(boxNo ?? '').trim()
  return value ? `DEV-${value}` : '-'
}

function getMatchedLocationName(row: Record<string, any>, type: string) {
  const matches = Array.isArray(row.locationMatches) ? row.locationMatches : []
  const matched = matches.find((item: Record<string, unknown>) => item.type === type)
  return typeof matched?.name === 'string' ? matched.name : ''
}

function resolveCollectionPointName(row: Record<string, any>) {
  const matchedName = getMatchedLocationName(row, 'collectionPoint')
  if (matchedName) return matchedName
  if (row.locationType === 'collectionPoint' && typeof row.locationName === 'string') return row.locationName
  return '-'
}

function resolveStationName(row: Record<string, any>) {
  const matchedName = getMatchedLocationName(row, 'station')
  if (matchedName) return matchedName
  if (row.locationType === 'station' && typeof row.locationName === 'string') return row.locationName
  return '-'
}

const smallBoxArchiveRows = smallBoxRows.map((item) => {
  return {
    ...item,
    deviceNo: makeBoxDeviceNo(item.boxNo),
    archiveStatus: '启用',
  }
})

const largeBoxArchiveRows = largeBoxRows.map((item) => {
  return {
    ...item,
    deviceNo: makeBoxDeviceNo(item.boxNo),
    archiveStatus: '启用',
  }
})

export const peopleRows = [
  { id: 'P001', name: '张师傅', phone: '13900010001', personType: '驾驶员', town: '马投涧镇', vehicle: '豫E7A031', status: '启用' },
  { id: 'P002', name: '李师傅', phone: '13900010002', personType: '驾驶员', town: '龙泉镇', vehicle: '豫E3G516', status: '启用' },
  { id: 'P003', name: '王磊', phone: '13900010003', personType: '安全员', town: '区级', vehicle: '-', status: '启用' },
  { id: 'P004', name: '赵强', phone: '13900010004', personType: '设备运维', town: '马家乡', vehicle: '-', status: '启用' },
  { id: 'P005', name: '周小明', phone: '13900010005', personType: '驾驶员', town: '马投涧镇', vehicle: '豫E5F678', status: '启用' },
  { id: 'P006', name: '吴刚', phone: '13900010006', personType: '驾驶员', town: '龙泉镇', vehicle: '豫E9C345', status: '启用' },
  { id: 'P007', name: '郑伟', phone: '13900010007', personType: '驾驶员', town: '善应镇', vehicle: '豫E0D789', status: '启用' },
  { id: 'P008', name: '冯大伟', phone: '13900010008', personType: '驾驶员', town: '马家乡', vehicle: '豫E2F456', status: '启用' },
  { id: 'P009', name: '褚怀亮', phone: '13900010009', personType: '驾驶员', town: '东风乡', vehicle: '豫E7G123', status: '启用' },
  { id: 'P010', name: '卫东', phone: '13900010010', personType: '驾驶员', town: '马投涧镇', vehicle: '豫E3H890', status: '启用' },
  { id: 'P011', name: '蒋小军', phone: '13900010011', personType: '驾驶员', town: '龙泉镇', vehicle: '豫E8J567', status: '启用' },
  { id: 'P012', name: '沈国平', phone: '13900010012', personType: '驾驶员', town: '善应镇', vehicle: '豫E1K234', status: '启用' },
  { id: 'P013', name: '韩志伟', phone: '13900010013', personType: '驾驶员', town: '马家乡', vehicle: '豫E5M901', status: '启用' },
  { id: 'P014', name: '唐金平', phone: '13900010014', personType: '驾驶员', town: '东风乡', vehicle: '豫E9N678', status: '启用' },
  { id: 'P015', name: '刘敏', phone: '13900010015', personType: '保洁员', town: '马投涧镇', vehicle: '-', status: '启用' },
  { id: 'P016', name: '杨秀英', phone: '13900010016', personType: '保洁员', town: '龙泉镇', vehicle: '-', status: '启用' },
  { id: 'P017', name: '陈秀兰', phone: '13900010017', personType: '保洁员', town: '善应镇', vehicle: '-', status: '停用' },
  { id: 'P018', name: '马春霞', phone: '13900010018', personType: '站点管理员', town: '善应镇', vehicle: '-', status: '启用' },
  { id: 'P019', name: '宋立军', phone: '13900010019', personType: '站点管理员', town: '马家乡', vehicle: '-', status: '启用' },
  { id: 'P020', name: '周凯', phone: '13900010020', personType: '站点管理员', town: '马投涧镇', vehicle: '-', status: '启用' },
]

const plants = [
  { id: 'F001', name: '马投涧垃圾焚烧厂', code: 'PLANT-MTJ-001', town: '马投涧镇', address: '龙安区马投涧镇西南侧', radius: 1000, longitude: 114.2812, latitude: 36.0395, contactPerson: '周凯', contactPhone: '13900010020', dailyWaste: 186, scaleStatus: '未对接', status: '启用' },
  { id: 'F002', name: '龙泉垃圾焚烧厂', code: 'PLANT-LQ-001', town: '龙泉镇', address: '龙安区龙泉镇东3公里', radius: 1000, longitude: 114.3356, latitude: 36.0214, contactPerson: '宋立军', contactPhone: '13900010019', dailyWaste: 142, scaleStatus: '已对接', status: '启用' },
  { id: 'F003', name: '安阳市生活垃圾焚烧厂', code: 'PLANT-AY-001', town: '东风乡', address: '龙安区东风乡循环经济园区', radius: 1500, longitude: 114.3512, latitude: 36.1085, contactPerson: '王磊', contactPhone: '13900010003', dailyWaste: 520, scaleStatus: '已对接', status: '启用' },
]

const routes = [
  { id: 'R001', routeName: '马投涧北片小三轮收集线', routeNo: 'RT-MTJ-01', routeType: '小三轮收集', town: '马投涧镇', villages: '南坡村、牛家窑村', points: 36, vehicle: '豫E7A031', status: '启用' },
  { id: 'R002', routeName: '龙泉镇小勾臂转运线', routeNo: 'RT-LQ-02', routeType: '小勾臂转运', town: '龙泉镇', villages: '石岩村、西上庄村', points: 24, vehicle: '豫E3G516', status: '启用' },
  { id: 'R003', routeName: '善应至焚烧厂转运线', routeNo: 'RT-SY-03', routeType: '大勾臂转运', town: '善应镇', villages: '善应中转站', points: 4, vehicle: '豫E8K270', status: '启用' },
]

const tasks = [
  { id: 'TASK001', taskName: '马投涧北片上午收集任务', date: '2026-05-20', route: '马投涧北片小三轮收集线', vehicle: '豫E7A031', driver: '张师傅', planTime: '06:30-10:30', status: '进行中' },
  { id: 'TASK002', taskName: '龙泉镇小勾臂转运任务', date: '2026-05-20', route: '龙泉镇小勾臂转运线', vehicle: '豫E3G516', driver: '李师傅', planTime: '08:00-12:00', status: '已关闭' },
  { id: 'TASK003', taskName: '善应至焚烧厂转运任务', date: '2026-05-20', route: '善应至焚烧厂转运线', vehicle: '豫E8K270', driver: '王师傅', planTime: '09:00-16:00', status: '异常' },
]

const coverageRows = [
  { id: 'CV001', taskName: '马投涧北片上午收集任务', planned: 36, covered: 33, coverage: '91.7%', missed: 2, passed: 1, status: '预警' },
  { id: 'CV002', taskName: '龙泉镇小勾臂转运任务', planned: 24, covered: 24, coverage: '100%', missed: 0, passed: 0, status: '正常' },
  { id: 'CV003', taskName: '善应至焚烧厂转运任务', planned: 4, covered: 3, coverage: '75%', missed: 1, passed: 0, status: '异常' },
]

const scaleRows = [
  { id: 'M001', plateNo: '豫E8K270', plant: '马投涧垃圾焚烧厂', inTime: '2026-05-20 10:20:00', outTime: '2026-05-20 10:38:00', gross: '28.6t', tare: '14.8t', net: '13.8t', status: '已匹配' },
  { id: 'M002', plateNo: '豫E6N109', plant: '马投涧垃圾焚烧厂', inTime: '2026-05-20 11:05:00', outTime: '2026-05-20 11:24:00', gross: '26.9t', tare: '15.3t', net: '11.6t', status: '已匹配' },
  { id: 'M003', plateNo: '豫E9X000', plant: '马投涧垃圾焚烧厂', inTime: '2026-05-20 11:32:00', outTime: '2026-05-20 11:48:00', gross: '20.1t', tare: '10.2t', net: '9.9t', status: '异常' },
]

const reconcileRows = [
  { id: 'RC001', date: '2026-05-20', vehicle: '豫E8K270', vehicleWeight: '13.8t', stationWeight: '13.5t', scaleWeight: '13.8t', diffRate: '0.0%', status: '正常' },
  { id: 'RC002', date: '2026-05-20', vehicle: '豫E6N109', vehicleWeight: '11.6t', stationWeight: '11.1t', scaleWeight: '11.6t', diffRate: '0.0%', status: '正常' },
  { id: 'RC003', date: '2026-05-20', vehicle: '豫E3G516', vehicleWeight: '2.4t', stationWeight: '-', scaleWeight: '-', diffRate: '无法对账', status: '预警' },
]

const reportRows = [
  { id: 'N001', date: '2026-05-20', waste: '107.3t', onlineRate: '87.5%', taskRate: '91.2%', alarms: 18, workOrders: 12, status: '车载称重估算' },
  { id: 'N002', date: '2026-05-19', waste: '104.8t', onlineRate: '89.1%', taskRate: '93.0%', alarms: 14, workOrders: 10, status: '地磅确认' },
]

const assessmentRows = [
  { id: 'AS001', object: '马投涧镇', objectType: '乡镇', coverage: '91.7%', timely: '86.0%', safety: '92', dataQuality: '88', score: 89.4, status: '预警' },
  { id: 'AS002', object: '龙泉镇', objectType: '乡镇', coverage: '100%', timely: '94.0%', safety: '96', dataQuality: '93', score: 95.8, status: '正常' },
  { id: 'AS003', object: '豫E8K270', objectType: '车辆', coverage: '75%', timely: '80.0%', safety: '72', dataQuality: '90', score: 79.1, status: '异常' },
]

function makeConfig(input: Omit<PrototypePageConfig, 'actions' | 'detailSections'> & Partial<Pick<PrototypePageConfig, 'actions' | 'detailSections'>>): PrototypePageConfig {
  return {
    actions: [
      { label: '新增' },
    ],
    detailSections: [
      {
        title: '原型说明',
        items: [
          { label: '数据来源', value: '本地模拟数据' },
          { label: '建设原则', value: '先支撑试运营闭环，再逐步增强统计、处置、考核能力' },
        ],
      },
    ],
    ...input,
  }
}

export const pageConfigs: Record<string, PrototypePageConfig> = {
  townArchive: makeConfig({
    key: 'townArchive',
    title: '乡镇档案管理',
    subtitle: '维护龙安区下辖乡镇、街道办基础信息，作为村庄、车辆、箱体、中转站和报表归属基础。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索乡镇名称/编码/负责人',
    filters: ['全部状态', '启用', '停用'],
    metrics: [],
    columns: [
      { title: '乡镇名称', dataIndex: 'name', width: 160 },
      { title: '乡镇编码', dataIndex: 'code', width: 120 },
      { title: '负责人', dataIndex: 'owner', width: 120 },
      { title: '联系电话', dataIndex: 'phone', width: 140 },
      { title: '具体地址', dataIndex: 'address', width: 200 },
      { title: '常住人口', dataIndex: 'population', width: 100 },
      { title: '下属村庄', dataIndex: 'villages', width: 100 },
      { title: '省份', dataIndex: 'province', width: 80 },
      { title: '城市', dataIndex: 'city', width: 80 },
      { title: '区/县', dataIndex: 'area', width: 90 },
      { title: '状态', dataIndex: 'status', width: 70 },
    ],
    rows: towns,
    fieldOptions: { province: ['河南省'], city: ['安阳市'], area: ['龙安区'], status: ['启用', '停用'] },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，横向滚动，超出列显示省略号 + Tooltip 查看完整内容' },
          { label: '搜索', value: '按名称/编码/负责人模糊匹配，与状态筛选叠加取交集' },
          { label: '状态筛选', value: '下拉选择「全部状态 / 启用 / 停用」' },
          { label: '新增 / 编辑', value: '省市区三级级联选择（选择区县后自动拼接名称建议）；支持地图选点回填坐标' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议改为软删除（标记 status=停用）' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '乡镇名称 (name)', value: '必填，唯一性校验（同 province+city+area 下不可重复）' },
          { label: '乡镇编码 (code)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '负责人 (owner)', value: '必填' },
          { label: '联系电话 (phone)', value: '非必填，若录入需校验 11 位手机号格式' },
          { label: '省份/城市/区县', value: '必填，从级联选择，不可自由输入' },
          { label: '常住人口 / 下属村庄', value: '≥0 整数' },
          { label: '状态', value: '枚举值：启用 / 停用' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '所有编码（乡镇编码等）在同一机构（租户）内唯一，不同租户间允许重复，数据完全隔离' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC（管理员可增删改，普通用户仅查看）' },
          { label: '删除约束', value: '删除前需检查是否被车辆/箱体/村庄/中转站引用，禁止级联删除' },
          { label: '搜索防抖', value: '当前输入即搜，生产建议加 300ms debounce' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  villageArchive: makeConfig({
    key: 'villageArchive',
    title: '村庄档案管理',
    subtitle: '维护 157 个行政村基础信息，用于村庄作业覆盖、点位归属、垃圾量统计和村庄考核。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索村庄名称/编码/负责人',
    filters: ['全部乡镇', ...towns.map((t) => t.name)],
    metrics: [],
    columns: [
      { title: '所属乡镇', dataIndex: 'town', width: 120 },
      { title: '村庄名称', dataIndex: 'name', width: 160 },
      { title: '村庄编码', dataIndex: 'code', width: 120 },
      { title: '负责人', dataIndex: 'owner', width: 100 },
      { title: '负责人电话', dataIndex: 'phone', width: 140 },
      { title: '常住人口', dataIndex: 'population', width: 100 },
      { title: '户数', dataIndex: 'households', width: 80 },
      { title: '状态', dataIndex: 'status', width: 70 },
    ],
    rows: villages,
    fieldOptions: { status: ['启用', '停用'], town: towns.map((t) => t.name) },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，所属乡镇列置于最前，横向滚动，超出列显示省略号 + Tooltip' },
          { label: '搜索', value: '按名称/编码/负责人模糊匹配，与所属乡镇筛选叠加取交集' },
          { label: '所属乡镇筛选', value: '下拉选项来自乡镇档案列表（动态联动）' },
          { label: '新增 / 编辑', value: '表单中「所属乡镇」置于最前，从乡镇档案下拉选择；支持负责人电话录入；支持地图选点回填坐标' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议软删除（标记 status=停用）' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '村庄名称 (name)', value: '必填，同一乡镇下不可重复' },
          { label: '村庄编码 (code)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '所属乡镇 (town)', value: '必填，从乡镇档案下拉选择，不可自由输入' },
          { label: '负责人 (owner)', value: '必填' },
          { label: '负责人电话 (phone)', value: '非必填，若录入需校验 11 位手机号格式' },
          { label: '常住人口 / 户数', value: '≥0 整数' },
          { label: '坐标（经度/纬度）', value: '非必填，地图选点回填；不在表格中展示' },
          { label: '状态', value: '枚举值：启用 / 停用' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '乡镇联动', value: '新增时需要先选「所属乡镇」才填充后续信息；乡镇删除时需检查是否有村庄引用' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '所有编码（村庄编码等）在同一机构（租户）内唯一，不同租户间允许重复，数据完全隔离' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '删除约束', value: '删除前需检查是否被收集点/箱体引用，禁止级联删除' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  collectionPoint: makeConfig({
    key: 'collectionPoint',
    title: '收集点档案管理',
    subtitle: '维护垃圾桶点和小勾臂箱摆放点，支撑线路规划、覆盖率和疑似漏收分析。',
    phase: 'V1.0',
    priority: 'P1',
    module: '基础档案',
    searchPlaceholder: '搜索点位名称/编号',
    filters: ['全部类型', '垃圾桶点', '小勾臂箱摆放点'],
    metrics: [],
    columns: [
      { title: '点位名称', dataIndex: 'name', width: 160 },
      { title: '所属乡镇', dataIndex: 'town', width: 120 },
      { title: '所属村庄', dataIndex: 'village', width: 140 },
      { title: '联系人', dataIndex: 'contactPerson', width: 100 },
      { title: '联系人电话', dataIndex: 'contactPhone', width: 140 },
      { title: '点位类型', dataIndex: 'type', width: 130 },
      { title: '容量数量', dataIndex: 'containers', width: 100 },
      { title: '具体地址', dataIndex: 'address', width: 210 },
      { title: '点位编号', dataIndex: 'pointNo', width: 130 },
      { title: '服务半径', dataIndex: 'radius', width: 90 },
      { title: '状态', dataIndex: 'status', width: 70 },
    ],
    rows: collectionPoints,
    fieldOptions: { type: ['垃圾桶点', '小勾臂箱摆放点'], status: ['启用', '停用'], town: towns.map((t) => t.name), village: villages.map((v) => v.name), contactPerson: peopleRows.map((p) => p.name) },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，横向滚动，超出列显示省略号 + Tooltip' },
          { label: '搜索', value: '按点位名称/编号模糊匹配，与类型筛选叠加取交集' },
          { label: '类型筛选', value: '下拉选择「全部类型 / 垃圾桶点 / 小勾臂箱摆放点」' },
          { label: '新增 / 编辑', value: '「所属乡镇」「所属村庄」从档案下拉选择（先选乡镇再选村庄）；支持地图选点回填坐标' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议软删除（标记 status=停用）' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '点位名称 (name)', value: '必填' },
          { label: '点位编号 (pointNo)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '所属乡镇 (town)', value: '必填，从乡镇档案下拉选择' },
          { label: '所属村庄 (village)', value: '必填，从村庄档案下拉选择' },
          { label: '联系人 (contactPerson)', value: '必填，从人员档案下拉选择' },
          { label: '联系人电话 (contactPhone)', value: '从人员档案自动带出，展示只读' },
          { label: '点位类型 (type)', value: '必填，枚举值：垃圾桶点 / 小勾臂箱摆放点' },
          { label: '容量数量 (containers)', value: '≥0 整数，摆放垃圾桶或小勾臂箱的数量' },
          { label: '具体地址 (address)', value: '可选' },
          { label: '坐标（经度/纬度）', value: '非必填，地图选点回填；不在表格中展示' },
          { label: '服务半径 (radius)', value: '≥0 整数，单位 m' },
          { label: '状态', value: '枚举值：启用 / 停用' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '乡镇-村庄联动', value: '建议生产实现级联：选择乡镇后村庄列表仅展示该乡镇下辖村庄' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '所有编号（点位编号等）在同一机构（租户）内唯一，不同租户间允许重复，数据完全隔离' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '删除约束', value: '删除前需检查是否被作业线路引用，禁止级联删除' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  vehicleArchive: makeConfig({
    key: 'vehicleArchive',
    title: '车辆档案',
    subtitle: '延用现有车辆管理，满足小三轮、3 吨小勾臂车、18 吨大勾臂车的管理，以及绑定 GPS、主动安全、称重设备。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索车牌号/驾驶员',
    filters: ['全部车辆', '小三轮', '小勾臂车', '大勾臂车'],
    metrics: [{ label: '车辆总数', value: 20, unit: '辆' }, { label: '在线车辆', value: 12, unit: '辆', tone: 'success' }, { label: '离线车辆', value: 5, unit: '辆', tone: 'warning' }, { label: '充电车辆', value: 3, unit: '辆', tone: 'processing' }],
    columns: [
      { title: '车牌号', dataIndex: 'plateNo', width: 140 },
      { title: '车辆类型', dataIndex: 'vehicleType', width: 120 },
      { title: '驾驶员', dataIndex: 'driver', width: 100 },
      { title: '驾驶员类型', dataIndex: 'driverType', width: 100 },
      { title: '驾驶员电话', dataIndex: 'driverPhone', width: 140 },
      { title: '状态', dataIndex: 'status', width: 80 },
    ],
    rows: vehicleRows,
    fieldOptions: { vehicleType: ['小三轮', '小勾臂车', '大勾臂车'], status: ['在线', '离线', '充电'], driver: peopleRows.map((p) => p.name) },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，横向滚动，超出列显示省略号 + Tooltip；顶部汇总展示车辆总数、在线/离线/充电数量' },
          { label: '搜索', value: '按车牌号/驾驶员模糊匹配，与车辆类型筛选叠加取交集' },
          { label: '类型筛选', value: '下拉选择「全部车辆 / 小三轮 / 小勾臂车 / 大勾臂车」' },
          { label: '新增 / 编辑', value: '「驾驶员」从人员档案下拉选择，自动带出人员类型和电话；其余字段录入' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议软删除（标记 status=停用）' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '车牌号 (plateNo)', value: '必填，唯一校验' },
          { label: '车辆类型 (vehicleType)', value: '必填，枚举值：小三轮 / 小勾臂车 / 大勾臂车' },
          { label: '驾驶员 (driver)', value: '必填，从人员档案下拉选择' },
          { label: '驾驶员类型 (driverType)', value: '从人员档案自动带出，展示只读' },
          { label: '驾驶员电话 (driverPhone)', value: '从人员档案自动带出，展示只读' },
          { label: '状态 (status)', value: '枚举值：在线 / 离线 / 充电' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '驾驶员联动', value: '选择驾驶员后自动带出人员类型和电话，不可手动修改；人员档案变更后车辆档案同步更新' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '删除约束', value: '删除前需检查是否被作业任务/线路引用，禁止级联删除' },
          { label: 'GPS/称重设备', value: '车辆设备绑定信息在设备管理模块维护，车辆档案仅展示关联关系' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  peopleArchive: makeConfig({
    key: 'peopleArchive',
    title: '人员档案',
    subtitle: '维护驾驶员、保洁员、站点管理员、设备运维等环卫作业人员信息，作为车辆驾驶员、工单处理人的来源。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索姓名/手机号',
    filters: ['全部人员', '驾驶员', '保洁员', '站点管理员', '设备运维'],
    metrics: [],
    columns: [
      { title: '姓名', dataIndex: 'name', width: 120 },
      { title: '手机号', dataIndex: 'phone', width: 140 },
      { title: '人员类型', dataIndex: 'personType', width: 130 },
      { title: '状态', dataIndex: 'status', width: 70 },
    ],
    rows: peopleRows,
    fieldOptions: { personType: ['驾驶员', '保洁员', '站点管理员', '设备运维'], status: ['启用', '停用'] },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，横向滚动，超出列显示省略号 + Tooltip' },
          { label: '搜索', value: '按姓名/手机号模糊匹配，与人员类型筛选叠加取交集' },
          { label: '类型筛选', value: '下拉选择「全部人员 / 驾驶员 / 保洁员 / 站点管理员 / 设备运维」' },
          { label: '新增 / 编辑', value: '录入姓名、手机号、人员类型、状态等信息' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议软删除（标记 status=停用）' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '姓名 (name)', value: '必填' },
          { label: '手机号 (phone)', value: '必填，需校验 11 位手机号格式，且在全局唯一（用作登录账号，不可重复）' },
          { label: '人员类型 (personType)', value: '必填，枚举值：驾驶员 / 保洁员 / 站点管理员 / 设备运维' },
          { label: '状态 (status)', value: '枚举值：启用 / 停用' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '车辆档案联动', value: '车辆档案的驾驶员从人员档案下拉选择，手机号、类型自动带出' },
          { label: '删除约束', value: '删除前需检查是否被车辆档案引用为驾驶员，禁止级联删除' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  stationArchive: makeConfig({
    key: 'stationArchive',
    title: '中转站档案管理',
    subtitle: '维护马家、善应、龙泉、马投涧等移动式压缩中转站基础信息和关联对象。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索站点名称/编号',
    filters: ['全部状态', '正常', '预警', '满溢', '停用'],
    metrics: [{ label: '中转站', value: 6, unit: '座' }, { label: '机位数量', value: 14, unit: '个' }],
    columns: [
      { title: '站点名称', dataIndex: 'name', width: 160 },
      { title: '站点编号', dataIndex: 'code', width: 120 },
      { title: '所属乡镇', dataIndex: 'town', width: 120 },
      { title: '联系人', dataIndex: 'contactPerson', width: 100 },
      { title: '联系人电话', dataIndex: 'contactPhone', width: 140 },
      { title: '具体地址', dataIndex: 'address', width: 220 },
      { title: '机位数量', dataIndex: 'slots', width: 100 },
      { title: '服务半径', dataIndex: 'radius', width: 90 },
      { title: '状态', dataIndex: 'status', width: 70 },
    ],
    rows: stationRows,
    fieldOptions: { status: ['启用', '停用'], contactPerson: peopleRows.map((p) => p.name), town: towns.map((t) => t.name) },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，横向滚动，超出列显示省略号 + Tooltip；顶部展示中转站总数和机位总数' },
          { label: '搜索', value: '按站点名称/编号模糊匹配，与状态筛选叠加取交集' },
          { label: '状态筛选', value: '下拉选择「全部状态 / 启用 / 停用」' },
          { label: '新增 / 编辑', value: '「所属乡镇」「联系人」从档案下拉选择，联系人电话自动带出；机位数量仅填数字；支持地图选点回填坐标' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议软删除' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '站点名称 (name)', value: '必填' },
          { label: '站点编号 (code)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '所属乡镇 (town)', value: '必填' },
          { label: '联系人 (contactPerson)', value: '必填，从人员档案下拉选择' },
          { label: '联系人电话 (contactPhone)', value: '从人员档案自动带出，展示只读' },
          { label: '具体地址 (address)', value: '可选' },
          { label: '机位数量 (slots)', value: '≥0 整数' },
          { label: '坐标（经度/纬度）', value: '非必填，地图选点回填；不在表格中展示' },
          { label: '服务半径 (radius)', value: '≥0 整数，单位 m' },
          { label: '状态', value: '枚举值：启用 / 停用' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '所有编号在同一机构（租户）内唯一，不同租户间允许重复' },
          { label: '人员联动', value: '选择联系人后联系电话自动从人员档案带出，不可手动修改' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '删除约束', value: '删除前需检查是否被箱体/车辆关联引用，禁止级联删除' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  plantArchive: makeConfig({
    key: 'plantArchive',
    title: '焚烧厂档案管理',
    subtitle: '维护焚烧厂基础信息，支持地图展示、地磅接口对接和垃圾处理量统计。',
    phase: 'V1.0 / V3.0',
    priority: 'P1',
    module: '基础档案',
    searchPlaceholder: '搜索焚烧厂名称/编号',
    filters: ['全部状态', '未对接', '已对接'],
    metrics: [{ label: '今日垃圾量', value: 848, unit: 't' }, { label: '今日进厂', value: 42, unit: '车次' }],
    columns: [
      { title: '焚烧厂名称', dataIndex: 'name', width: 180 },
      { title: '所属乡镇', dataIndex: 'town', width: 120 },
      { title: '编号', dataIndex: 'code', width: 140 },
      { title: '联系人', dataIndex: 'contactPerson', width: 100 },
      { title: '联系人电话', dataIndex: 'contactPhone', width: 140 },
      { title: '具体地址', dataIndex: 'address', width: 240 },
      { title: '服务半径', dataIndex: 'radius', width: 90 },
      { title: '地磅状态', dataIndex: 'scaleStatus', width: 100 },
      { title: '状态', dataIndex: 'status', width: 70 },
    ],
    rows: plants,
    fieldOptions: { scaleStatus: ['未对接', '已对接'], status: ['启用', '停用'], contactPerson: peopleRows.map((p) => p.name), town: towns.map((t) => t.name) },
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，横向滚动，超出列显示省略号 + Tooltip；顶部展示今日垃圾总量和进厂车次' },
          { label: '搜索', value: '按焚烧厂名称/编号模糊匹配，与地磅状态筛选叠加取交集' },
          { label: '地磅状态筛选', value: '下拉选择「全部状态 / 未对接 / 已对接」' },
          { label: '新增 / 编辑', value: '「联系人」从人员档案下拉选择，自动带出电话；支持地图选点回填坐标' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议软删除' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '焚烧厂名称 (name)', value: '必填' },
          { label: '所属乡镇 (town)', value: '必填' },
          { label: '编号 (code)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '联系人 (contactPerson)', value: '必填，从人员档案下拉选择' },
          { label: '联系人电话 (contactPhone)', value: '从人员档案自动带出，展示只读' },
          { label: '具体地址 (address)', value: '可选' },
          { label: '服务半径 (radius)', value: '≥0 整数，单位 m，默认 1000' },
          { label: '坐标（经度/纬度）', value: '非必填，地图选点回填；不在表格中展示' },
          { label: '地磅状态 (scaleStatus)', value: '枚举值：未对接 / 已对接 / 对接异常' },
          { label: '状态', value: '枚举值：启用 / 停用' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '所有编号在同一机构（租户）内唯一，不同租户间允许重复' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '删除约束', value: '删除前需检查是否被地磅记录/车辆称重引用' },
          { label: '今日垃圾量', value: '汇总值为各焚烧厂当日处理量的总和，数据来自地磅称重记录，每日凌晨重置' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  smallBoxArchive: makeConfig({
    key: 'smallBoxArchive',
    title: '小勾臂箱档案',
    subtitle: '维护 3 吨小勾臂箱基础档案，登记箱体自身信息和绑定设备；箱体流动位置、监控状态与统计数据统一在箱体监控中查看。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索箱体名称/编号/设备编号',
    filters: ['全部', '启用', '停用'],
    metrics: [],
    columns: [
      { title: '箱体名称', dataIndex: 'name', width: 180 },
      { title: '箱体编号', dataIndex: 'boxNo', width: 120 },
      { title: '容量(吨)', dataIndex: 'capacity', width: 100 },
      { title: '绑定设备', dataIndex: 'deviceNo', width: 160 },
      { title: '启用状态', dataIndex: 'archiveStatus', width: 90 },
    ],
    rows: smallBoxArchiveRows,
    fieldOptions: { deviceNo: smallBoxArchiveRows.map((b) => String(b.deviceNo)), archiveStatus: ['启用', '停用'] },
    multiFilters: [
      { key: 'archiveStatus', options: ['全部', '启用', '停用'] },
    ],
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，仅展示箱体名称、编号、容量、绑定设备、启用状态等基础档案信息；不展示乡镇、村庄、收集点、当前位置和监控统计' },
          { label: '搜索', value: '按箱体名称、箱体编号、设备编号模糊匹配，与启用状态筛选叠加取交集' },
          { label: '状态筛选', value: '下拉选择「全部 / 启用 / 停用」' },
          { label: '新增 / 编辑', value: '录入箱体名称、箱体编号、容量，并绑定满溢检测/定位等箱体设备' },
          { label: '删除', value: 'Popconfirm 二次确认' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '箱体名称 (name)', value: '必填' },
          { label: '箱体编号 (boxNo)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '容量 (capacity)', value: '≥0，支持 1 位小数，单位吨' },
          { label: '绑定设备 (deviceNo)', value: '必填，设备编号在当前机构内唯一；一个设备同一时间只能绑定一个箱体' },
          { label: '启用状态 (archiveStatus)', value: '枚举值：启用 / 停用；停用后不再参与新增作业绑定' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '箱体流动性', value: '小勾臂箱满箱后由车辆拉走并投放空箱，同一箱体下次投放点不固定，因此档案不维护所属乡镇、所属村庄、绑定收集点等固定位置归属' },
          { label: '职责边界', value: '基础档案只维护箱体资产信息和设备绑定关系；垃圾占比、温度、电量、位置、在线/满溢/低电量/高温等监控信息统一放到「箱体监控」中展示' },
          { label: '设备绑定', value: '箱体需要绑定设备后才能产生监控数据；设备绑定关系变更需记录生效时间，便于追溯历史上报数据' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '箱体编号在同一机构（租户）内唯一' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  largeBoxArchive: makeConfig({
    key: 'largeBoxArchive',
    title: '大勾臂箱档案',
    subtitle: '维护 18 吨大勾臂箱和移动压缩箱基础档案，登记箱体自身信息和绑定设备；箱体流动位置、监控状态与统计数据统一在箱体监控中查看。',
    phase: 'V1.0',
    priority: 'P0',
    module: '基础档案',
    searchPlaceholder: '搜索箱体名称/编号/设备编号',
    filters: ['全部', '启用', '停用'],
    metrics: [],
    columns: [
      { title: '箱体名称', dataIndex: 'name', width: 180 },
      { title: '箱体编号', dataIndex: 'boxNo', width: 120 },
      { title: '容量(吨)', dataIndex: 'capacity', width: 100 },
      { title: '绑定设备', dataIndex: 'deviceNo', width: 160 },
      { title: '启用状态', dataIndex: 'archiveStatus', width: 90 },
    ],
    rows: largeBoxArchiveRows,
    fieldOptions: { deviceNo: largeBoxArchiveRows.map((b) => String(b.deviceNo)), archiveStatus: ['启用', '停用'] },
    multiFilters: [
      { key: 'archiveStatus', options: ['全部', '启用', '停用'] },
    ],
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，仅展示箱体名称、编号、容量、绑定设备、启用状态等基础档案信息；不展示乡镇、中转站、当前位置和监控统计' },
          { label: '搜索', value: '按箱体名称、箱体编号、设备编号模糊匹配，与启用状态筛选叠加取交集' },
          { label: '状态筛选', value: '下拉选择「全部 / 启用 / 停用」' },
          { label: '新增 / 编辑', value: '录入箱体名称、箱体编号、容量，并绑定满溢检测/定位等箱体设备' },
          { label: '删除', value: 'Popconfirm 二次确认' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '箱体名称 (name)', value: '必填' },
          { label: '箱体编号 (boxNo)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '容量 (capacity)', value: '≥0，支持 1 位小数，单位吨' },
          { label: '绑定设备 (deviceNo)', value: '必填，设备编号在当前机构内唯一；一个设备同一时间只能绑定一个箱体' },
          { label: '启用状态 (archiveStatus)', value: '枚举值：启用 / 停用；停用后不再参与新增作业绑定' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '箱体流动性', value: '大勾臂箱满箱后由车辆拉走并投放空箱，同一箱体下次投放点不固定，因此档案不维护所属乡镇、绑定中转站等固定位置归属' },
          { label: '职责边界', value: '基础档案只维护箱体资产信息和设备绑定关系；垃圾占比、位置、在线/满溢等监控信息统一放到「箱体监控」中展示' },
          { label: '设备绑定', value: '箱体需要绑定设备后才能产生监控数据；设备绑定关系变更需记录生效时间，便于追溯历史上报数据' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '箱体编号在同一机构（租户）内唯一' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  safetyAlarm: makeConfig({
    key: 'safetyAlarm',
    title: '主动安全告警列表',
    subtitle: '集中展示疲劳驾驶、分神驾驶、打电话、抽烟、超速、急加速等主动安全告警。',
    phase: 'V1.0',
    priority: 'P0',
    module: '主动安全',
    searchPlaceholder: '搜索车牌号/驾驶员/告警类型',
    filters: ['全部状态', '未处理', '已查看', '已处理'],
    metrics: [{ label: '今日告警', value: 18, unit: '条', tone: 'danger' }, { label: '严重告警', value: 3, unit: '条', tone: 'danger' }, { label: '处理率', value: 72, unit: '%' }],
    columns: [{ title: '告警编号', dataIndex: 'id', width: 150 }, { title: '告警类型', dataIndex: 'alarmType' }, { title: '等级', dataIndex: 'level' }, { title: '告警对象', dataIndex: 'object' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '告警内容', dataIndex: 'content' }, { title: '告警时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: alarmRows.filter((item) => item.alarmType === '主动安全'),
    actions: [{ label: '查看详情' }, { label: '标记处理' }, { label: '转工单', status: 'warning' }],
    fieldOptions: { alarmType: ['主动安全'], level: ['一般', '重要', '严重'], status: ['未处理', '已查看', '已处理'] },
  }),
  safetyDetail: makeConfig({
    key: 'safetyDetail',
    title: '主动安全告警详情',
    subtitle: '展示单条安全告警的车辆、驾驶员、时间、位置、图片、短视频和处理记录。',
    phase: 'V1.0',
    priority: 'P0',
    module: '主动安全',
    searchPlaceholder: '搜索告警编号',
    filters: ['全部等级', '一般', '重要', '严重'],
    metrics: [{ label: '图片证据', value: 16, unit: '张' }, { label: '视频片段', value: 12, unit: '段' }, { label: '待复核', value: 3, unit: '条', tone: 'warning' }],
    columns: [{ title: '告警编号', dataIndex: 'id', width: 150 }, { title: '告警类型', dataIndex: 'alarmType' }, { title: '等级', dataIndex: 'level' }, { title: '告警对象', dataIndex: 'object' }, { title: '告警内容', dataIndex: 'content' }, { title: '告警时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: alarmRows,
    fieldOptions: { alarmType: ['主动安全', '满溢告警', '设备离线', '称重异常'], level: ['一般', '重要', '严重'], status: ['未处理', '已查看', '已处理'] },
  }),
  safetyStats: makeConfig({
    key: 'safetyStats',
    title: '主动安全统计',
    subtitle: '按车辆、驾驶员、乡镇、告警类型统计主动安全告警，为驾驶员考核和安全管理提供依据。',
    phase: 'V2.0',
    priority: 'P1',
    module: '主动安全',
    searchPlaceholder: '搜索车辆/驾驶员',
    filters: ['日统计', '周统计', '月统计'],
    metrics: [{ label: '告警趋势', value: '-12', unit: '%' }, { label: '高风险驾驶员', value: 4, unit: '人', tone: 'danger' }, { label: '安全评分', value: 91, unit: '分', tone: 'success' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '车辆类型', dataIndex: 'vehicleType' }, { title: '驾驶员', dataIndex: 'driver' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '今日告警', dataIndex: 'alarms' }, { title: '状态', dataIndex: 'status' }],
    rows: vehicleRows,
    fieldOptions: { vehicleType: ['小三轮', '小勾臂车', '大勾臂车'], status: ['在线', '告警', '离线'] },
  }),
  weighing: makeConfig({
    key: 'weighing',
    title: '称重明细查询',
    subtitle: '展示车辆称重设备上报明细，支持按车辆、时间、车辆类型、乡镇筛选和导出。',
    phase: 'V1.0',
    priority: 'P0',
    module: '称重管理',
    searchPlaceholder: '搜索车牌号/位置',
    filters: ['全部车辆', '小勾臂车', '大勾臂车', '异常数据'],
    metrics: [{ label: '今日称重', value: 107.3, unit: 't' }, { label: '明细记录', value: 428, unit: '条' }, { label: '异常数据', value: 6, unit: '条', tone: 'warning' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '车辆类型', dataIndex: 'vehicleType' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '重量', dataIndex: 'weightText' }, { title: '位置', dataIndex: 'location' }, { title: '设备状态', dataIndex: 'deviceStatus' }, { title: '上报时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: weighingRows,
    fieldOptions: { vehicleType: ['小勾臂车', '大勾臂车'], deviceStatus: ['正常', '异常', '离线'], status: ['正常', '异常'] },
  }),
  weightTrend: makeConfig({
    key: 'weightTrend',
    title: '单车重量趋势',
    subtitle: '查看单车指定时间段重量变化趋势，辅助判断装载、卸载和异常波动。',
    phase: 'V1.0',
    priority: 'P1',
    module: '称重管理',
    searchPlaceholder: '搜索车牌号',
    filters: ['今日', '昨日', '近7日'],
    metrics: [{ label: '趋势车辆', value: 32, unit: '辆' }, { label: '突变点', value: 5, unit: '处', tone: 'warning' }, { label: '最大载重', value: 13.8, unit: 't' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '车辆类型', dataIndex: 'vehicleType' }, { title: '重量', dataIndex: 'weightText' }, { title: '位置', dataIndex: 'location' }, { title: '设备状态', dataIndex: 'deviceStatus' }, { title: '上报时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: weighingRows,
    actions: [{ label: '查看趋势' }, { label: '标记异常', status: 'warning' }, { label: '导出' }],
    fieldOptions: { vehicleType: ['小勾臂车', '大勾臂车'], deviceStatus: ['正常', '异常', '离线'], status: ['正常', '异常'] },
  }),
  wasteStats: makeConfig({
    key: 'wasteStats',
    title: '垃圾量基础统计',
    subtitle: '基于车载称重数据统计今日垃圾量、车辆垃圾量和乡镇垃圾量，后续结合地磅确认。',
    phase: 'V1.0 / V2.0',
    priority: 'P0',
    module: '称重管理',
    searchPlaceholder: '搜索乡镇/车辆',
    filters: ['今日', '本周', '本月'],
    metrics: [{ label: '今日垃圾量', value: 107.3, unit: 't' }, { label: '乡镇最高', value: '马投涧镇' }, { label: '统计口径', value: '车载估算', tone: 'warning' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '车辆类型', dataIndex: 'vehicleType' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '重量', dataIndex: 'weightText' }, { title: '位置', dataIndex: 'location' }, { title: '状态', dataIndex: 'status' }],
    rows: weighingRows,
    fieldOptions: { vehicleType: ['小勾臂车', '大勾臂车'], status: ['正常', '异常'] },
  }),
  smallBoxState: makeConfig({
    key: 'smallBoxState',
    title: '小勾臂箱监控',
    subtitle: '实时监控小勾臂箱满溢状态、设备状态、电量、温度和位置，支持远程开锁操作。',
    phase: 'V1.0',
    priority: 'P0',
    module: '箱体监控',
    searchPlaceholder: '搜索箱体编号',
    filters: ['全部', '正常', '预警', '满溢'],
    metrics: [{ label: '小勾臂箱', value: smallBoxRows.length, unit: '个' }, { label: '今日收运', value: 8.6, unit: 't', tooltip: '小勾臂车今日从满溢箱体收运的垃圾总重量' }, { label: '满溢箱体', value: smallBoxRows.filter((b) => b.overflowStatus === '满溢').length, unit: '个', tone: 'danger' }, { label: '低电量箱体', value: smallBoxRows.filter((b) => b.batteryStatus === '低电量').length, unit: '个', tone: 'warning' }, { label: '高温箱体', value: smallBoxRows.filter((b) => b.temperatureStatus === '高温').length, unit: '个', tone: 'danger' }],
    columns: [
      { title: '箱体名称', dataIndex: 'name', width: 180 },
      { title: '箱体编号', dataIndex: 'boxNo', width: 120 },
      { title: '在线状态', dataIndex: 'onlineStatus', width: 90 },
      { title: '上报时间', dataIndex: 'reportTime', width: 100 },
      { title: '满溢状态', dataIndex: 'overflowStatus', width: 90 },
      { title: '电量状态', dataIndex: 'batteryStatus', width: 90 },
      { title: '温度状态', dataIndex: 'temperatureStatus', width: 90 },
      { title: '匹配对象', dataIndex: 'locationName', width: 200 },
      { title: '当前位置', dataIndex: 'currentLocation', width: 260 },
      { title: '垃圾占比(%)', dataIndex: 'fillRate', width: 120 },
      { title: '温度(℃)', dataIndex: 'temperature', width: 100 },
      { title: '电量(%)', dataIndex: 'battery', width: 100 },
      { title: '容量(吨)', dataIndex: 'capacity', width: 100 },
      { title: '开关状态', dataIndex: 'doorStatus', width: 80 },
    ],
    rows: smallBoxRows,
    fieldOptions: { overflowStatus: ['正常', '预警', '满溢'], onlineStatus: ['在线', '离线'], batteryStatus: ['正常', '低电量'], temperatureStatus: ['正常', '高温'], doorStatus: ['开', '关'] },
    multiFilters: [
      { key: 'overflowStatus', options: ['全部', '正常', '预警', '满溢'] },
      { key: 'batteryStatus', options: ['全部', '正常', '低电量'] },
    ],
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，展示箱体名称、编号、容量、垃圾占比、温度、温度状态、电量、电量状态、匹配对象、当前位置、满溢状态、在线状态' },
          { label: '搜索', value: '按箱体编号模糊匹配，与满溢状态筛选叠加取交集' },
          { label: '满溢状态筛选', value: '下拉选择「全部 / 正常 / 预警 / 满溢」' },
          { label: '电量状态筛选', value: '下拉选择「全部 / 正常 / 低电量」' },
          { label: '远程开锁', value: '操作栏提供「远程开锁」按钮，二次确认后调用远程接口' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '箱体名称 (name)', value: '必填' },
          { label: '箱体编号 (boxNo)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '容量 (capacity)', value: '≥0，支持 1 位小数，单位吨' },
          { label: '垃圾占比 (fillRate)', value: '0~100 整数，百分比，由设备上报；🟢<75%正常 / 🟠75%~90%预警 / 🔴≥90%满溢 / ⚫无数据离线' },
          { label: '箱体温度 (temperature)', value: '由设备传感器上报' },
          { label: '箱体电量 (battery)', value: '0~100 整数，百分比，由设备上报' },
          { label: '关联位置', value: '🔵 收集点名称 / 🟣 车牌号 / 🟠 中转站名称，根据 GPS 匹配自动确定' },
          { label: '状态', value: '枚举值：正常 / 预警 / 满溢 / 离线（连续1小时无数据上报）' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '垃圾占比判定', value: '正常<75%🟢 → 预警75%~90%🟠 → 满溢≥90%🔴；无数据判定为离线⚫' },
          { label: '离线判定', value: '连续1小时未获取到垃圾占比、温度、电量、位置等任何数据，状态标记为离线' },
          { label: '设备数据', value: '垃圾占比、温度、电量由箱体设备定时上报，不人工录入' },
          { label: '定位逻辑', value: '箱体位置通过定位模块判断：匹配收集点电子围栏→显示收集点；匹配车辆GPS→显示车牌号；匹配中转站围栏→显示中转站' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '箱体编号在同一机构（租户）内唯一' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  bigBoxState: makeConfig({
    key: 'bigBoxState',
    title: '大勾臂箱监控',
    subtitle: '实时监控大勾臂箱和移动压缩箱的满溢状态、位置和垃圾占比数据。',
    phase: 'V1.0',
    priority: 'P0',
    module: '箱体监控',
    searchPlaceholder: '搜索箱体编号',
    filters: ['全部', '正常', '预警', '满溢'],
    metrics: [{ label: '大勾臂箱', value: largeBoxRows.length, unit: '个' }, { label: '今日收运', value: 36.0, unit: 't', tooltip: '大勾臂车今日从满溢箱体收运的垃圾总重量' }, { label: '满溢箱体', value: largeBoxRows.filter((b) => b.overflowStatus === '满溢').length, unit: '个', tone: 'danger' }],
    columns: [
      { title: '箱体名称', dataIndex: 'name', width: 180 },
      { title: '箱体编号', dataIndex: 'boxNo', width: 120 },
      { title: '在线状态', dataIndex: 'onlineStatus', width: 90 },
      { title: '满溢状态', dataIndex: 'overflowStatus', width: 90 },
      { title: '匹配对象', dataIndex: 'locationName', width: 200 },
      { title: '当前位置', dataIndex: 'currentLocation', width: 260 },
      { title: '垃圾占比(%)', dataIndex: 'fillRate', width: 120 },
      { title: '容量(吨)', dataIndex: 'capacity', width: 100 },
    ],
    rows: largeBoxRows,
    fieldOptions: { overflowStatus: ['正常', '预警', '满溢'], onlineStatus: ['在线', '离线'] },
    multiFilters: [
      { key: 'overflowStatus', options: ['全部', '正常', '预警', '满溢'] },
    ],
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '分页 20 条/页，展示箱体名称、编号、在线状态、满溢状态、当前位置、垃圾占比、容量' },
          { label: '搜索', value: '按箱体编号模糊匹配，与满溢状态筛选叠加取交集' },
          { label: '满溢状态筛选', value: '下拉选择「全部 / 正常 / 预警 / 满溢」' },
          { label: '详情', value: '右侧抽屉展示全部字段，只读' },
        ],
      },
      {
        title: '🔑 字段校验规则',
        items: [
          { label: '箱体名称 (name)', value: '必填' },
          { label: '箱体编号 (boxNo)', value: '非必填，若录入则在当前机构（租户）内唯一' },
          { label: '容量 (capacity)', value: '≥0，支持 1 位小数，单位吨' },
          { label: '垃圾占比 (fillRate)', value: '🟢<75%正常 / 🟠75%~90%预警 / 🔴≥90%满溢 / ⚫无数据离线；由设备上报' },
          { label: '关联位置', value: '根据匹配自动确定' },
          { label: '状态', value: '枚举值：正常 / 预警 / 满溢 / 离线' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '垃圾占比判定', value: '正常<75%🟢 → 预警75%~90%🟠 → 满溢≥90%🔴；无数据判定为离线⚫' },
          { label: '离线判定', value: '连续1小时未获取到垃圾占比等数据，状态标记为离线' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '多租户隔离', value: '箱体编号在同一机构（租户）内唯一' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC' },
          { label: '操作审计', value: '增删改操作需记录操作人、时间、变更内容' },
        ],
      },
    ],
  }),
  overflowRule: makeConfig({
    key: 'overflowRule',
    title: '监控告警规则',
    subtitle: '配置各类型告警的触发阈值、等级、通知方式和范围，支持定时发送。',
    phase: 'V1.0',
    priority: 'P0',
    module: '箱体监管',
    searchPlaceholder: '搜索告警类型/等级',
    filters: ['全部规则', '小勾臂箱', '大勾臂箱'],
    metrics: [{ label: '启用规则', value: 6, unit: '条' }, { label: '今日触发', value: 23, unit: '次', tone: 'warning' }, { label: '重复抑制', value: 12, unit: '次' }],
    columns: [],
    rows: alertRuleRows,
    fieldOptions: {},
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '列表查询', value: '展示所有告警规则，含告警类型、等级、阈值、通知方式、通知内容、通知范围、定时发送、状态' },
          { label: '搜索', value: '按告警类型模糊匹配' },
          { label: '新增 / 编辑', value: '选择告警类型后自动填充阈值（可编辑具体数值），可选等级（一般/严重）、通知方式（多选）、通知内容（可自定义消息模板）、通知范围（所有人/指定用户）、早上定时发送（开关+时间）' },
          { label: '删除', value: 'Popconfirm 二次确认，生产中建议改为软删除' },
        ],
      },
      {
        title: '🔑 规则定义',
        items: [
          { label: '小勾臂箱满溢', value: '垃圾占比 > 阈值时触发，阈值默认 90%（可配置）' },
          { label: '小勾臂箱低电量', value: '电量 < 阈值时触发，阈值默认 10%（可配置）' },
          { label: '小勾臂箱高温', value: '温度 > 阈值触发告警（可配置，默认 60°C）；等级严重时阈值另设' },
          { label: '小勾臂箱离线', value: '连续无心跳 > 阈值分钟触发，阈值默认 60 分钟（可配置）' },
          { label: '大勾臂箱满溢', value: '垃圾占比 > 阈值时触发，阈值默认 90%（可配置）' },
          { label: '大勾臂箱离线', value: '连续无心跳 > 阈值分钟触发，阈值默认 1440 分钟/24 小时（可配置）；大勾臂箱拖到车上或车辆闲置时可能断电无心跳' },
        ],
      },
      {
        title: '📢 通知配置',
        items: [
          { label: '通知方式', value: '系统消息（PC/APP）、小程序、短信，可多选' },
          { label: '通知内容', value: '自定义消息模板，支持占位符如 {boxName}、{fillRate}、{temperature}、{battery} 等，上限 200 字' },
          { label: '通知范围', value: '「所有人」通知该机构所有人员；「指定用户」从人员档案下拉多选' },
          { label: '早上定时发送', value: '夜间达到告警阈值时暂不推送，次日指定时间统一发送；关闭则实时触发实时推送' },
        ],
      },
      {
        title: '⚠️ 边界 & 约束',
        items: [
          { label: '小勾臂箱特点', value: '有太阳能电池，不会断电' },
          { label: '大勾臂箱特点', value: '当从地下拖到车上后可能断电；箱在车上满载/空载或车辆闲置时，会长时间无心跳' },
          { label: '数据来源', value: '当前为本地 mock 数据，对接后端后 CRUD 需走 API' },
          { label: '权限', value: '当前无权限控制，生产需接入 RBAC（管理员可配置规则，普通用户仅查看）' },
        ],
      },
    ],
  }),
  stationMap: makeConfig({
    key: 'stationMap',
    title: '中转站地图展示',
    subtitle: '在地图上展示中转站位置、状态、关联箱体和异常情况，状态随站内箱体联动。',
    phase: 'V1.0',
    priority: 'P0',
    module: '中转站监管',
    searchPlaceholder: '搜索中转站',
    filters: ['全部状态', '正常', '预警', '满溢'],
    metrics: [{ label: '中转站', value: 4, unit: '座' }, { label: '异常站点', value: 2, unit: '座', tone: 'warning' }, { label: '关联车辆', value: 12, unit: '辆' }],
    columns: [{ title: '站点名称', dataIndex: 'name' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '机位数量', dataIndex: 'slotsText' }, { title: '负责人', dataIndex: 'owner' }, { title: '关联对象', dataIndex: 'relation' }, { title: '状态', dataIndex: 'status' }],
    rows: stationRows,
    fieldOptions: { status: ['正常', '预警', '满溢'] },
  }),
  stationDetail: makeConfig({
    key: 'stationDetail',
    title: '中转站详情',
    subtitle: '展示中转站基础信息、机位数量、关联箱体、箱体满溢状态、关联车辆和最新告警。',
    phase: 'V1.0',
    priority: 'P0',
    module: '中转站监管',
    searchPlaceholder: '搜索中转站/箱体/车辆',
    filters: ['全部站点', '双箱体机位', '四箱体机位', '异常站点'],
    metrics: [{ label: '今日进站', value: 42, unit: '车次' }, { label: '今日出站', value: 39, unit: '车次' }, { label: '站内满溢', value: 3, unit: '箱', tone: 'danger' }],
    columns: [{ title: '站点名称', dataIndex: 'name' }, { title: '站点编号', dataIndex: 'code' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '机位数量', dataIndex: 'slotsText' }, { title: '负责人', dataIndex: 'owner' }, { title: '状态', dataIndex: 'status' }],
    rows: stationRows,
    fieldOptions: { status: ['正常', '预警', '满溢'] },
  }),
  stationLedger: makeConfig({
    key: 'stationLedger',
    title: '中转站进出记录 / 运行台账',
    subtitle: '记录车辆进出中转站、箱体更换、站点异常和站点日报，支撑吞吐量统计和后续对账。',
    phase: 'V1.5 / V2.0',
    priority: 'P1',
    module: '中转站监管',
    searchPlaceholder: '搜索中转站/车辆/驾驶员',
    filters: ['全部来源', '人工补录', '电子围栏', '轨迹识别'],
    metrics: [{ label: '进出记录', value: 81, unit: '条' }, { label: '异常记录', value: 4, unit: '条', tone: 'warning' }, { label: '估算吞吐', value: 76.4, unit: 't' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '车辆类型', dataIndex: 'vehicleType' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '重量', dataIndex: 'weightText' }, { title: '位置', dataIndex: 'location' }, { title: '上报时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: weighingRows,
    fieldOptions: { vehicleType: ['小勾臂车', '大勾臂车'], status: ['正常', '异常'] },
  }),
  alarmCenter: makeConfig({
    key: 'alarmCenter',
    title: '统一告警中心',
    subtitle: '统一展示主动安全、满溢、设备离线、称重异常等告警，支持详情、处理和转工单。',
    phase: 'V1.0',
    priority: 'P0',
    module: '告警与消息',
    searchPlaceholder: '搜索告警对象/内容',
    filters: ['全部类型', '主动安全', '满溢告警', '设备离线', '称重异常'],
    metrics: [{ label: '今日告警', value: 46, unit: '条', tone: 'danger' }, { label: '未处理', value: 17, unit: '条', tone: 'warning' }, { label: '处理率', value: 63, unit: '%' }],
    columns: [{ title: '告警编号', dataIndex: 'id', width: 150 }, { title: '告警类型', dataIndex: 'alarmType' }, { title: '等级', dataIndex: 'level' }, { title: '告警对象', dataIndex: 'object' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '告警内容', dataIndex: 'content' }, { title: '告警时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: alarmRows,
    actions: [{ label: '查看详情' }, { label: '标记处理' }, { label: '转工单', status: 'warning' }],
    fieldOptions: { alarmType: ['主动安全', '满溢告警', '设备离线', '称重异常'], level: ['一般', '重要', '严重'], status: ['未处理', '已查看', '已处理'] },
  }),
  alarmHandle: makeConfig({
    key: 'alarmHandle',
    title: '告警处理状态',
    subtitle: '支持告警标记为已查看、已处理，并填写处理说明，为二期收运任务单打基础。',
    phase: 'V1.0',
    priority: 'P1',
    module: '告警与消息',
    searchPlaceholder: '搜索告警编号/处理人',
    filters: ['未处理', '已查看', '已处理', '已归档'],
    metrics: [{ label: '待处理', value: 17, unit: '条', tone: 'danger' }, { label: '今日处理', value: 29, unit: '条' }, { label: '平均耗时', value: 26, unit: '分钟' }],
    columns: [{ title: '告警编号', dataIndex: 'id', width: 150 }, { title: '告警类型', dataIndex: 'alarmType' }, { title: '告警对象', dataIndex: 'object' }, { title: '告警内容', dataIndex: 'content' }, { title: '告警时间', dataIndex: 'time', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: alarmRows,
    fieldOptions: { alarmType: ['主动安全', '满溢告警', '设备离线', '称重异常'], status: ['未处理', '已查看', '已处理', '已归档'] },
  }),
  routeManage: makeConfig({
    key: 'routeManage',
    title: '线路管理',
    subtitle: '维护小三轮收集线、小勾臂转运线、大勾臂转运线，为计划和作业监管提供基础。',
    phase: 'V1.5',
    priority: 'P1',
    module: '作业计划与监管',
    searchPlaceholder: '搜索线路名称/编号',
    filters: ['全部线路', '小三轮收集', '小勾臂转运', '大勾臂转运'],
    metrics: [{ label: '线路总数', value: 38, unit: '条' }, { label: '覆盖村庄', value: 154, unit: '个' }, { label: '停用线路', value: 2, unit: '条', tone: 'warning' }],
    columns: [{ title: '线路名称', dataIndex: 'routeName' }, { title: '线路编号', dataIndex: 'routeNo' }, { title: '线路类型', dataIndex: 'routeType' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '覆盖村庄', dataIndex: 'villages' }, { title: '覆盖点位', dataIndex: 'points' }, { title: '默认车辆', dataIndex: 'vehicle' }, { title: '状态', dataIndex: 'status' }],
    rows: routes,
    fieldOptions: { routeType: ['小三轮收集', '小勾臂转运', '大勾臂转运'], status: ['启用', '停用'] },
  }),
  taskManage: makeConfig({
    key: 'taskManage',
    title: '作业任务管理',
    subtitle: '根据线路和班次生成每日作业任务，支持任务派发、状态跟踪和临时任务创建。',
    phase: 'V1.5',
    priority: 'P1',
    module: '作业计划与监管',
    searchPlaceholder: '搜索任务/线路/车辆',
    filters: ['全部状态', '未开始', '进行中', '已完成', '异常'],
    metrics: [{ label: '今日任务', value: 68, unit: '单' }, { label: '进行中', value: 21, unit: '单' }, { label: '异常任务', value: 3, unit: '单', tone: 'warning' }],
    columns: [{ title: '任务名称', dataIndex: 'taskName' }, { title: '任务日期', dataIndex: 'date' }, { title: '线路', dataIndex: 'route' }, { title: '车辆', dataIndex: 'vehicle' }, { title: '驾驶员', dataIndex: 'driver' }, { title: '计划时间', dataIndex: 'planTime' }, { title: '状态', dataIndex: 'status' }],
    rows: tasks,
    fieldOptions: { status: ['未开始', '进行中', '已完成', '异常'] },
  }),
  coverage: makeConfig({
    key: 'coverage',
    title: '作业覆盖率分析',
    subtitle: '基于任务点位和车辆轨迹，判断车辆是否到达计划点位并计算覆盖率。',
    phase: 'V2.0',
    priority: 'P1',
    module: '作业计划与监管',
    searchPlaceholder: '搜索任务名称',
    filters: ['全部任务', '覆盖正常', '疑似漏收', '数据不足'],
    metrics: [{ label: '平均覆盖率', value: 91.4, unit: '%' }, { label: '疑似漏收', value: 9, unit: '处', tone: 'danger' }, { label: '疑似路过', value: 4, unit: '处', tone: 'warning' }],
    columns: [{ title: '任务名称', dataIndex: 'taskName' }, { title: '计划点位', dataIndex: 'planned' }, { title: '已覆盖', dataIndex: 'covered' }, { title: '覆盖率', dataIndex: 'coverage' }, { title: '疑似漏收', dataIndex: 'missed' }, { title: '疑似路过', dataIndex: 'passed' }, { title: '状态', dataIndex: 'status' }],
    rows: coverageRows,
    fieldOptions: { status: ['正常', '预警', '异常'] },
  }),
  missed: makeConfig({
    key: 'missed',
    title: '疑似漏收识别',
    subtitle: '根据计划点位、车辆轨迹和停留规则识别疑似漏收，并支持确认后转工单。',
    phase: 'V2.0',
    priority: 'P1',
    module: '作业计划与监管',
    searchPlaceholder: '搜索点位/任务',
    filters: ['全部', '待确认', '已转工单', '误报'],
    metrics: [{ label: '疑似漏收', value: 9, unit: '处', tone: 'danger' }, { label: '已转工单', value: 5, unit: '处' }, { label: '误报', value: 2, unit: '处' }],
    columns: [{ title: '任务名称', dataIndex: 'taskName' }, { title: '计划点位', dataIndex: 'planned' }, { title: '已覆盖', dataIndex: 'covered' }, { title: '覆盖率', dataIndex: 'coverage' }, { title: '疑似漏收', dataIndex: 'missed' }, { title: '状态', dataIndex: 'status' }],
    rows: coverageRows.filter((item) => item.missed > 0),
    actions: [{ label: '查看地图' }, { label: '确认漏收', status: 'warning' }, { label: '转工单', status: 'danger' }],
    fieldOptions: { status: ['待确认', '已转工单', '误报'] },
  }),
  workOrderCreate: makeConfig({
    key: 'workOrderCreate',
    title: '工单创建',
    subtitle: '支持人工创建工单，也支持由满溢告警、疑似漏收、安全告警、设备离线等异常转工单。',
    phase: 'V1.5',
    priority: 'P1',
    module: '收运任务单',
    searchPlaceholder: '搜索工单标题/来源对象',
    filters: ['全部类型', '满溢处理', '漏收处理', '安全告警', '设备故障'],
    metrics: [{ label: '今日工单', value: 12, unit: '单' }, { label: '待派发', value: 3, unit: '单', tone: 'warning' }, { label: '告警转单', value: 7, unit: '单' }],
    columns: [{ title: '工单标题', dataIndex: 'title' }, { title: '工单类型', dataIndex: 'type' }, { title: '来源', dataIndex: 'source' }, { title: '责任人', dataIndex: 'assignee' }, { title: '要求完成时间', dataIndex: 'deadline', width: 180 }, { title: '处理进度', dataIndex: 'progress' }, { title: '状态', dataIndex: 'status' }],
    rows: workOrders,
    fieldOptions: { type: ['满溢处理', '漏收处理', '安全告警', '设备故障'], source: ['满溢告警', '作业监管', '主动安全', '人工创建', '系统自动'], progress: ['已派发', '现场核查', '已提交说明', '审核通过'], status: ['待派发', '待接单', '处理中', '待审核', '已关闭', '已驳回'] },
  }),
  workOrderDispatch: makeConfig({
    key: 'workOrderDispatch',
    title: '工单派发',
    subtitle: '调度员将工单派发给驾驶员、保洁员、站点管理员、设备运维人员等。',
    phase: 'V1.5',
    priority: 'P1',
    module: '收运任务单',
    searchPlaceholder: '搜索工单/处理人',
    filters: ['待派发', '待接单', '处理中', '待审核'],
    metrics: [{ label: '待派发', value: 3, unit: '单', tone: 'warning' }, { label: '待接单', value: 4, unit: '单' }, { label: '平均派发', value: 8, unit: '分钟' }],
    columns: [{ title: '工单标题', dataIndex: 'title' }, { title: '工单类型', dataIndex: 'type' }, { title: '来源', dataIndex: 'source' }, { title: '责任人', dataIndex: 'assignee' }, { title: '要求完成时间', dataIndex: 'deadline', width: 180 }, { title: '状态', dataIndex: 'status' }],
    rows: workOrders,
    actions: [{ label: '派发' }, { label: '改派' }, { label: '撤回', status: 'warning' }],
    fieldOptions: { type: ['满溢处理', '漏收处理', '安全告警', '设备故障'], source: ['满溢告警', '作业监管', '主动安全', '人工创建'], status: ['待派发', '待接单', '处理中', '待审核'] },
  }),
  workOrderReview: makeConfig({
    key: 'workOrderReview',
    title: '工单审核关闭',
    subtitle: '管理员审核现场人员提交的处理结果，通过后关闭归档，不通过则驳回重办。',
    phase: 'V1.5',
    priority: 'P1',
    module: '收运任务单',
    searchPlaceholder: '搜索工单/审核状态',
    filters: ['待审核', '已关闭', '已驳回'],
    metrics: [{ label: '待审核', value: 2, unit: '单', tone: 'warning' }, { label: '今日关闭', value: 8, unit: '单' }, { label: '驳回率', value: 6, unit: '%' }],
    columns: [{ title: '工单标题', dataIndex: 'title' }, { title: '工单类型', dataIndex: 'type' }, { title: '责任人', dataIndex: 'assignee' }, { title: '要求完成时间', dataIndex: 'deadline', width: 180 }, { title: '处理进度', dataIndex: 'progress' }, { title: '状态', dataIndex: 'status' }],
    rows: workOrders,
    actions: [{ label: '审核通过' }, { label: '驳回', status: 'warning' }, { label: '查看记录' }],
    fieldOptions: { type: ['满溢处理', '漏收处理', '安全告警', '设备故障'], progress: ['已派发', '现场核查', '已提交说明', '审核通过'], status: ['待审核', '已关闭', '已驳回'] },
  }),
  workOrderStats: makeConfig({
    key: 'workOrderStats',
    title: '工单统计',
    subtitle: '统计工单数量、完成率、平均处理时长、超时率和各类型工单分布。',
    phase: 'V2.0',
    priority: 'P2',
    module: '收运任务单',
    searchPlaceholder: '搜索乡镇/处理人',
    filters: ['今日', '本周', '本月'],
    metrics: [{ label: '完成率', value: 86, unit: '%' }, { label: '平均处理', value: 42, unit: '分钟' }, { label: '超时率', value: 7, unit: '%', tone: 'warning' }],
    columns: [{ title: '工单标题', dataIndex: 'title' }, { title: '工单类型', dataIndex: 'type' }, { title: '来源', dataIndex: 'source' }, { title: '责任人', dataIndex: 'assignee' }, { title: '状态', dataIndex: 'status' }],
    rows: workOrders,
    fieldOptions: { type: ['满溢处理', '漏收处理', '安全告警', '设备故障'], source: ['满溢告警', '作业监管', '主动安全', '人工创建'], status: ['待接单', '处理中', '待审核', '已关闭'] },
  }),
  scaleConfig: makeConfig({
    key: 'scaleConfig',
    title: '焚烧厂地磅接口配置',
    subtitle: '配置焚烧厂地磅系统对接方式、接口地址、字段映射和同步频率。',
    phase: 'V3.0',
    priority: 'P1',
    module: '地磅对接与对账',
    searchPlaceholder: '搜索接口名称/焚烧厂',
    filters: ['API', '数据库视图', 'Excel导入', '未启用'],
    metrics: [{ label: '接口配置', value: 1, unit: '套' }, { label: '连接状态', value: '待测试', tone: 'warning' }, { label: '字段映射', value: 12, unit: '项' }],
    columns: [{ title: '焚烧厂名称', dataIndex: 'name' }, { title: '编号', dataIndex: 'code' }, { title: '地址', dataIndex: 'address' }, { title: '联系人', dataIndex: 'contact' }, { title: '地磅状态', dataIndex: 'scaleStatus' }, { title: '状态', dataIndex: 'status' }],
    rows: plants,
    actions: [{ label: '测试连接' }, { label: '字段映射' }, { label: '启用' }],
    fieldOptions: { scaleStatus: ['未对接', '已对接', '对接异常', '待测试'], status: ['启用', '停用', '待测试'] },
  }),
  scaleData: makeConfig({
    key: 'scaleData',
    title: '地磅数据采集',
    subtitle: '获取焚烧厂车辆进厂、出厂、毛重、皮重、净重等地磅数据，并匹配平台车辆。',
    phase: 'V3.0',
    priority: 'P1',
    module: '地磅对接与对账',
    searchPlaceholder: '搜索车牌号/地磅记录',
    filters: ['全部记录', '已匹配', '未匹配', '异常净重'],
    metrics: [{ label: '今日进厂', value: 18, unit: '车次' }, { label: '地磅净重', value: 105.4, unit: 't' }, { label: '未匹配', value: 1, unit: '条', tone: 'warning' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '焚烧厂', dataIndex: 'plant' }, { title: '进厂时间', dataIndex: 'inTime', width: 180 }, { title: '出厂时间', dataIndex: 'outTime', width: 180 }, { title: '毛重', dataIndex: 'gross' }, { title: '皮重', dataIndex: 'tare' }, { title: '净重', dataIndex: 'net' }, { title: '状态', dataIndex: 'status' }],
    rows: scaleRows,
    fieldOptions: { status: ['已匹配', '未匹配', '异常'] },
  }),
  reconcile: makeConfig({
    key: 'reconcile',
    title: '数据对账',
    subtitle: '将车载称重、中转站记录、焚烧厂地磅数据进行对账，识别差异并生成预警。',
    phase: 'V3.0',
    priority: 'P1',
    module: '地磅对接与对账',
    searchPlaceholder: '搜索车辆/日期',
    filters: ['全部结果', '正常', '差异预警', '无法对账'],
    metrics: [{ label: '对账率', value: 82, unit: '%' }, { label: '差异预警', value: 3, unit: '条', tone: 'warning' }, { label: '最大差异', value: 5.8, unit: '%' }],
    columns: [{ title: '日期', dataIndex: 'date' }, { title: '车辆', dataIndex: 'vehicle' }, { title: '车载称重', dataIndex: 'vehicleWeight' }, { title: '中转站记录', dataIndex: 'stationWeight' }, { title: '地磅净重', dataIndex: 'scaleWeight' }, { title: '差异率', dataIndex: 'diffRate' }, { title: '状态', dataIndex: 'status' }],
    rows: reconcileRows,
    fieldOptions: { status: ['正常', '差异预警', '无法对账'] },
  }),
  dailyReport: makeConfig({
    key: 'dailyReport',
    title: '运营日报',
    subtitle: '汇总每日垃圾量、车辆在线率、任务完成率、告警数、工单数，支持导出。',
    phase: 'V1.5 / V2.0',
    priority: 'P1',
    module: '统计报表与考核',
    searchPlaceholder: '搜索日期',
    filters: ['今日', '昨日', '自定义日期'],
    metrics: [{ label: '今日垃圾量', value: 107.3, unit: 't' }, { label: '车辆在线率', value: 87.5, unit: '%' }, { label: '任务完成率', value: 91.2, unit: '%' }],
    columns: [{ title: '日期', dataIndex: 'date' }, { title: '垃圾量', dataIndex: 'waste' }, { title: '车辆在线率', dataIndex: 'onlineRate' }, { title: '任务完成率', dataIndex: 'taskRate' }, { title: '告警数', dataIndex: 'alarms' }, { title: '工单数', dataIndex: 'workOrders' }, { title: '统计口径', dataIndex: 'status' }],
    rows: reportRows,
    fieldOptions: { status: ['车载称重估算', '地磅确认'] },
  }),
  vehicleReport: makeConfig({
    key: 'vehicleReport',
    title: '车辆报表',
    subtitle: '按车辆统计里程、在线时长、告警次数、称重数据和任务完成情况。',
    phase: 'V2.0',
    priority: 'P1',
    module: '统计报表与考核',
    searchPlaceholder: '搜索车牌号/乡镇',
    filters: ['全部车辆', '小三轮', '小勾臂车', '大勾臂车'],
    metrics: [{ label: '总里程', value: 424.1, unit: 'km' }, { label: '平均在线', value: 7.6, unit: 'h' }, { label: '告警车辆', value: 5, unit: '辆', tone: 'warning' }],
    columns: [{ title: '车牌号', dataIndex: 'plateNo' }, { title: '车辆类型', dataIndex: 'vehicleType' }, { title: '所属乡镇', dataIndex: 'town' }, { title: '驾驶员', dataIndex: 'driver' }, { title: '今日里程', dataIndex: 'mileageText' }, { title: '今日告警', dataIndex: 'alarms' }, { title: '最新称重', dataIndex: 'weight' }, { title: '状态', dataIndex: 'status' }],
    rows: vehicleRows,
    fieldOptions: { vehicleType: ['小三轮', '小勾臂车', '大勾臂车'], status: ['在线', '告警', '离线'] },
  }),
  townWasteReport: makeConfig({
    key: 'townWasteReport',
    title: '乡镇垃圾量报表',
    subtitle: '按乡镇统计垃圾量、趋势、人均垃圾量和排名，支持日、周、月维度。',
    phase: 'V2.0',
    priority: 'P1',
    module: '统计报表与考核',
    searchPlaceholder: '搜索乡镇',
    filters: ['日趋势', '周趋势', '月趋势'],
    metrics: [{ label: '全区垃圾量', value: 107.3, unit: 't' }, { label: '最高乡镇', value: '马投涧镇' }, { label: '人均垃圾量', value: 0.56, unit: 'kg/人' }],
    columns: [{ title: '乡镇名称', dataIndex: 'name' }, { title: '乡镇编码', dataIndex: 'code' }, { title: '常住人口', dataIndex: 'population' }, { title: '行政村', dataIndex: 'villages' }, { title: '负责人', dataIndex: 'owner' }, { title: '状态', dataIndex: 'status' }],
    rows: towns,
    fieldOptions: { status: ['启用', '停用'] },
  }),
  assessment: makeConfig({
    key: 'assessment',
    title: '考核评价',
    subtitle: '对乡镇、村庄、车辆、驾驶员、中转站进行考核评价，支持权重配置、评分和导出。',
    phase: 'V3.0',
    priority: 'P2',
    module: '统计报表与考核',
    searchPlaceholder: '搜索考核对象',
    filters: ['全部对象', '乡镇', '村庄', '车辆', '驾驶员', '中转站'],
    metrics: [{ label: '平均得分', value: 89.2, unit: '分' }, { label: '低分对象', value: 4, unit: '个', tone: 'warning' }, { label: '权重方案', value: '已启用' }],
    columns: [{ title: '考核对象', dataIndex: 'object' }, { title: '对象类型', dataIndex: 'objectType' }, { title: '覆盖率', dataIndex: 'coverage' }, { title: '及时率', dataIndex: 'timely' }, { title: '安全评分', dataIndex: 'safety' }, { title: '数据质量', dataIndex: 'dataQuality' }, { title: '总分', dataIndex: 'score' }, { title: '状态', dataIndex: 'status' }],
    rows: assessmentRows,
    fieldOptions: { objectType: ['乡镇', '村庄', '车辆', '驾驶员', '中转站'], status: ['正常', '预警', '异常'] },
  }),
  taskOrderStats: makeConfig({
    key: 'taskOrderStats',
    title: '全部任务单',
    subtitle: '查看全部收运任务单，围绕始发点、目的地、时效、轨迹和四个关键事件做运营追溯。',
    phase: 'V1.5',
    priority: 'P0',
    module: '收运任务单',
    searchPlaceholder: '搜索任务名称/驾驶员/车牌',
    filters: ['全部', '待接单', '已接单', '收运中', '已完成'],
    metrics: [
      { label: '总任务单', value: collectionTasks.length, unit: '单' },
      { label: '待接单', value: collectionTasks.filter((t) => t.collectionStatus === '待接单').length, unit: '单', tone: 'warning' },
      { label: '收运中', value: collectionTasks.filter((t) => t.collectionStatus === '收运中' || t.collectionStatus === '已接单').length, unit: '单', tone: 'processing' },
      { label: '已完成', value: collectionTasks.filter((t) => t.collectionStatus === '已完成').length, unit: '单', tone: 'success' },
      { label: '总垃圾量', value: collectionTasks.filter((t) => t.collectionStatus === '已完成' && t.boxType === '小勾臂箱' && t.weight).reduce((s, t) => s + (t.weight || 0), 0).toFixed(1), unit: 't' },
    ],
    columns: [
      { title: '任务单号', dataIndex: 'id', width: 150 },
      { title: '任务名称', dataIndex: 'taskName', width: 200 },
      { title: '始发点', dataIndex: 'startAddress', width: 220 },
      { title: '目的地', dataIndex: 'destinationName', width: 150 },
      { title: '驾驶员', dataIndex: 'driver', width: 100 },
      { title: '车辆', dataIndex: 'vehicle', width: 110 },
      { title: '时效', dataIndex: 'slaMinutes', width: 90 },
      { title: '收运状态', dataIndex: 'collectionStatus', width: 100 },
      { title: '超时状态', dataIndex: 'overtimeStatus', width: 100 },
      { title: '称重', dataIndex: 'weight', width: 80 },
      { title: '创建时间', dataIndex: 'createTime', width: 180 },
      { title: '完成时间', dataIndex: 'finishTime', width: 180 },
    ],
    rows: collectionTasks.map((t) => ({
      ...t,
      slaMinutes: `${t.slaMinutes}min`,
      weight: t.weight ? `${t.weight}t` : '-',
      finishTime: t.finishTime || '-',
    })),
    multiFilters: [
      { key: 'collectionStatus', options: ['全部', '待接单', '已接单', '收运中', '已完成'] },
      { key: 'overtimeStatus', options: ['全部', '未超时', '已超时'] },
    ],
    prd: [
      {
        title: '🎯 功能要点（开发 / 测试关注）',
        items: [
          { label: '数据范围', value: '展示所有收运任务单，包含全部状态（待接单/已接单/收运中/已完成），不限当日' },
          { label: '数据来源', value: '任务单数据来自告警中心创建或收运单监控页快速创建；每单必须包含始发点、目的地、时效和四个关键事件' },
          { label: '表格展示', value: '列表优先展示任务单号、任务名称、始发点、目的地、驾驶员、车辆、时效、收运状态、超时状态、称重、创建时间、完成时间' },
          { label: '统计卡', value: '任务单数 / 待接单 / 收运中 / 已完成 / 垃圾量，5 个指标，随筛选条件联动更新' },
          { label: '筛选条件', value: '关键字搜索 + 开始日期 + 结束日期 + 收运状态下拉 + 超时状态下拉，多个条件叠加取交集' },
          { label: '日期筛选', value: '开始日期和结束日期两个独立日期选择器，均选定时按 createTime 范围过滤' },
          { label: '详情查看', value: '点击行操作栏「详情」图标，弹出运营详情抽屉：顶部状态摘要、始发→目的地路线、时效/称重/作业规则、轨迹地图、关键事件、辅助信息' },
          { label: '无编辑/删除', value: '本页面为纯查看页，不提供新增、编辑、删除功能' },
        ],
      },
      {
        title: '🔑 字段映射规则',
        items: [
          { label: '收运状态', value: 'collectionStatus：待接单 / 已接单 / 收运中 / 已完成' },
          { label: '超时状态', value: 'overtimeStatus：未超时 / 已超时' },
          { label: '称重', value: 'weight（吨），已完成小勾臂箱的垃圾称重数据' },
          { label: '完成时间', value: 'finishTime，取原始数据或 "-" 占位' },
          { label: '围栏半径', value: '小勾臂：收集点 500m → 中转站 500m；大勾臂：中转站 500m → 焚烧厂 1000m' },
          { label: '关键事件', value: 'track 中 label 非空的点为事件：始发点、装车、目的地、卸车；中间空 label 点为车辆实际轨迹点' },
        ],
      },
      {
        title: '⚠️ 边界 & 验收要点',
        items: [
          { label: '✓ 统计卡联动', value: '选择日期或状态后，统计卡数字自动更新为筛选结果内的数据' },
          { label: '✓ 垃圾量统计', value: '仅统计已完成小勾臂箱的称重总和，大勾臂箱不纳入' },
          { label: '✓ 日期筛选', value: '开始日期 + 结束日期均选择后生效，单独选择一个无效' },
          { label: '✓ 多条件叠加', value: '关键字 + 日期 + 收运状态 + 超时状态四个维度叠加取交集' },
          { label: '✓ 详情抽屉', value: '点击查看详情弹出侧边抽屉，先展示运营判断信息，再展示辅助字段，避免重要信息被字段列表淹没' },
          { label: '✓ 四事件追溯', value: '详情中必须显示始发点、装车、目的地、卸车四个事件时间、地址和围栏半径' },
          { label: '✓ 地图轨迹', value: '详情地图沿用收运单监控的平滑实际轨迹、电子围栏和称重展示' },
          { label: '✓ 数据来源', value: '当前为 mock 数据，对接后端后需走 API' },
        ],
      },
    ],
  }),
}

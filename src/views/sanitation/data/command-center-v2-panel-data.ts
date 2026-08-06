export const trackSpeeds = [1, 5, 10, 15, 20, 25, 30]

export const vehicleCameras = [
  { id: 1, name: '前视摄像头', quality: '1080P' },
  { id: 2, name: '左侧摄像头', quality: '720P' },
  { id: 3, name: '右侧摄像头', quality: '720P' },
  { id: 4, name: '后视摄像头', quality: '1080P' },
  { id: 5, name: '驾驶室摄像头', quality: '720P' },
]

export const simulatedTrackPoints = [
  { x: 52, y: 236 }, { x: 124, y: 236 }, { x: 124, y: 72 }, { x: 258, y: 72 }, { x: 258, y: 150 },
  { x: 388, y: 150 }, { x: 388, y: 52 }, { x: 540, y: 52 }, { x: 540, y: 242 }, { x: 446, y: 242 },
  { x: 446, y: 190 }, { x: 320, y: 190 }, { x: 320, y: 258 }, { x: 180, y: 258 },
]



export const rightTabs = [
  { key: 'alarm', label: '实时告警' },
  { key: 'task', label: '任务监控' },
  { key: 'box', label: '箱体监控' },
  { key: 'vehicle', label: '车辆监控' },
  { key: 'safety', label: '主动安全' },
]



export const alarmDrivers = ['张师傅（豫E3G516）', '李师傅（豫E6N109）', '孙师傅（豫E8K270）']

export const alarmVehicles = ['豫E3G516 · 小勾臂车', '豫E6N109 · 大勾臂车', '豫E8K270 · 小勾臂车']

export const alarmDestinations = ['马投涧中转站', '龙泉镇中转站', '龙安生活垃圾焚烧厂']



export const taskMonitorStats = [
  { key: 'all', label: '今日总任务', value: '256', tone: 'info' },
  { key: 'pending', label: '待接单', value: '32', tone: 'warning' },
  { key: 'collecting', label: '收运中', value: '128', tone: 'success' },
  { key: 'overtime', label: '已超时', value: '20', tone: 'danger' },
]

export const taskMonitorRows = [
  { id: 'T001', name: '牛家窑2号小勾臂箱收运', route: '马投涧镇 -> 马投涧中转站', vehicle: '豫E3G516', vehicleType: '小勾臂车', driver: '张师傅', status: '收运中', tone: 'success', overtimeStatus: '未超时', overtimeTone: 'info' },
  { id: 'T002', name: '龙泉压缩箱C转运', route: '龙泉中转站 -> 焚烧厂', vehicle: '豫E1R782', vehicleType: '大勾臂车', driver: '王师傅', status: '待接单', tone: 'warning', overtimeStatus: '未超时', overtimeTone: 'info' },
  { id: 'T003', name: '文明大道收集点清运', route: '文明大道街道 -> 中转站', vehicle: '豫E6N109', vehicleType: '大勾臂车', driver: '李师傅', status: '已完成', tone: 'info', overtimeStatus: '未超时', overtimeTone: 'info' },
  { id: 'T004', name: '东风乡箱体满溢处置', route: '东风乡 -> 东风中转站', vehicle: '豫E8K270', vehicleType: '小勾臂车', driver: '孙师傅', status: '收运中', tone: 'success', overtimeStatus: '已超时', overtimeTone: 'danger' },
  { id: 'T005', name: '善应镇日常巡回清运', route: '善应镇 -> 善应中转站', vehicle: '豫E2M883', vehicleType: '小勾臂车', driver: '赵师傅', status: '收运中', tone: 'success', overtimeStatus: '已超时', overtimeTone: 'danger' },
]

export type TaskMonitorRow = (typeof taskMonitorRows)[number]

export type TaskMonitorDetail = (typeof taskMonitorRows)[number] & {
  orderNo: string
  origin: string
  destination: string
  duration: number
  sla: number
  driver: string
  vehicle: string
  weight: string
  fillRate: number
  alarmNo: string
  box: string
  town: string
  phone: string
  events: Array<{ name: string; place: string; time: string }>
}

export const taskTransferTargets = [
  { name: '王师傅', vehicle: '豫E5Q381' },
  { name: '赵师傅', vehicle: '豫E2M883' },
  { name: '陈师傅', vehicle: '豫E7L126' },
]

  export const taskMonitorDetailMap: Record<string, Omit<TaskMonitorDetail, keyof TaskMonitorRow>> = {
    T001: { orderNo: 'ST202607130001', origin: '牛家窑村文化广场收集点', destination: '马投涧中转站', duration: 48, sla: 60, weight: '2.4', fillRate: 91, alarmNo: 'AL202607130001', box: '牛家窑2号小勾臂箱（XB-MTJ-002）', town: '马投涧镇', phone: '139****1001', events: [{ name: '派单', place: '系统自动派发', time: '08:28' }, { name: '接单', place: '张师傅 · 豫E3G516', time: '08:33' }, { name: '到达始发地', place: '牛家窑村文化广场收集点', time: '08:41' }, { name: '装车', place: '牛家窑村文化广场收集点', time: '08:48' }, { name: '发车', place: '前往马投涧中转站', time: '08:52' }] },
    T002: { orderNo: 'ST202607130008', origin: '龙泉镇中转站', destination: '龙安生活垃圾焚烧厂', duration: 0, sla: 90, weight: '0.0', fillRate: 76, alarmNo: 'AL202607130008', box: '龙泉压缩箱C（DB-LQ-003）', town: '龙泉镇', phone: '138****8172', events: [{ name: '创建任务', place: '龙泉镇中转站', time: '09:12' }, { name: '等待接单', place: '王师傅 · 豫E1R782 待接单', time: '09:12' }] },
    T003: { orderNo: 'ST202607130015', origin: '文明大道东段收集点', destination: '马投涧中转站', duration: 52, sla: 60, weight: '1.8', fillRate: 88, alarmNo: 'AL202607130015', box: '文明大道收集点箱体（XB-WM-018）', town: '文明大道街道', phone: '138****6218', events: [{ name: '派单', place: '系统自动派发', time: '07:21' }, { name: '接单', place: '李师傅 · 豫E6N109', time: '07:25' }, { name: '到达始发地', place: '文明大道东段收集点', time: '07:33' }, { name: '装车', place: '文明大道东段收集点', time: '07:41' }, { name: '发车', place: '前往马投涧中转站', time: '07:49' }, { name: '到达目的地', place: '马投涧中转站', time: '08:06' }, { name: '卸车完成', place: '马投涧中转站卸料区', time: '08:13' }, { name: '上传照片', place: '完成凭证已上传 1 张', time: '08:15' }] },
    T004: { orderNo: 'ST202607130021', origin: '东风乡西岗村收集点', destination: '东风中转站', duration: 138, sla: 120, weight: '3.1', fillRate: 96, alarmNo: 'AL202607130021', box: '西岗村大勾臂箱（DB-DF-011）', town: '东风乡', phone: '137****3770', events: [{ name: '派单', place: '系统自动派发', time: '06:40' }, { name: '接单', place: '孙师傅 · 豫E8K270', time: '06:48' }, { name: '到达始发地', place: '东风乡西岗村收集点', time: '07:36' }, { name: '装车', place: '东风乡西岗村收集点', time: '07:52' }] },
    T005: { orderNo: 'ST202607130030', origin: '善应镇北村收集点', destination: '善应中转站', duration: 35, sla: 60, weight: '1.2', fillRate: 72, alarmNo: 'AL202607130030', box: '善应镇巡回箱体（XB-SY-021）', town: '善应镇', phone: '136****5098', events: [{ name: '派单', place: '系统自动派发', time: '10:06' }, { name: '接单', place: '赵师傅 · 豫E2M883', time: '10:11' }, { name: '装车', place: '善应镇北村收集点', time: '10:25' }] },
  }



export const boxMonitorStats = [
  { key: 'small', label: '小勾臂箱', value: '370', tone: 'success' },
  { key: 'large', label: '大勾臂箱', value: '12', tone: 'info' },
]

export const boxMonitorRows = [
  { id: 'B001', type: 'small', name: '牛家窑2号小勾臂箱', code: 'XB-MTJ-002', online: '在线', overflow: '满溢', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 96, battery: 78, temperature: 32, match: '豫E3G516 · 牛家窑村文化广场收集点', location: '马投涧镇牛家窑村文化广场' },
  { id: 'B002', type: 'small', name: '善应北村1号小勾臂箱', code: 'XB-SY-021', online: '在线', overflow: '正常', batteryStatus: '低电量', temperatureStatus: '正常', fillRate: 71, battery: 12, temperature: 29, match: '善应北村收集点', location: '善应镇北村村委会东侧' },
  { id: 'B003', type: 'small', name: '徐家口村小勾臂箱', code: 'XB-DF-008', online: '离线', overflow: '正常', batteryStatus: '低电量', temperatureStatus: '高温', fillRate: 48, battery: 8, temperature: 66, match: '豫E8K270 · 徐家口村收集点', location: '东风乡徐家口村文化广场' },
  { id: 'B004', type: 'large', name: '龙泉压缩箱C', code: 'DB-LQ-003', online: '在线', overflow: '正常', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 82, battery: 0, temperature: 0, match: '豫E1R782 · 龙泉镇中转站 · 龙安生活垃圾焚烧厂', location: '龙泉镇中转站卸料区' },
  { id: 'B005', type: 'large', name: '西岗村大勾臂箱', code: 'DB-DF-011', online: '在线', overflow: '满溢', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 94, battery: 0, temperature: 0, match: '豫E8K270 · 东风中转站 · 龙安生活垃圾焚烧厂', location: '东风乡西岗村收集点' },
  { id: 'B006', type: 'large', name: '马投涧大勾臂箱', code: 'DB-MTJ-005', online: '离线', overflow: '正常', batteryStatus: '正常', temperatureStatus: '正常', fillRate: 39, battery: 0, temperature: 0, match: '马投涧中转站 · 龙安生活垃圾焚烧厂', location: '马投涧镇工业路北侧' },
]

export type BoxMonitorRow = (typeof boxMonitorRows)[number]

export type BoxType = 'small' | 'large'



export const vehicleMonitorRows = [
  { id: 'V000', plate: '豫E606', driver: '孙师傅', type: '小勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V001', plate: '豫E3G516', driver: '张师傅', type: '小勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V002', plate: '豫E8K270', driver: '孙师傅', type: '小勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V003', plate: '豫E2M883', driver: '赵师傅', type: '小勾臂车', status: '充电', tone: 'warning', collecting: false },
  { id: 'V004', plate: '豫E5Q381', driver: '王师傅', type: '小勾臂车', status: '离线', tone: 'danger', collecting: false },
  { id: 'V005', plate: '豫E6N109', driver: '李师傅', type: '大勾臂车', status: '在线', tone: 'success', collecting: true },
  { id: 'V006', plate: '豫E1R782', driver: '陈师傅', type: '大勾臂车', status: '在线', tone: 'success', collecting: false },
  { id: 'V007', plate: '豫E9T266', driver: '周师傅', type: '小三轮车', status: '在线', tone: 'success', collecting: true },
  { id: 'V008', plate: '豫E7L126', driver: '刘师傅', type: '小三轮车', status: '离线', tone: 'danger', collecting: false },
]

export type VehicleMonitorRow = (typeof vehicleMonitorRows)[number]

export const vehicleTypeStats = [{ key: '小勾臂车', label: '小勾臂车', value: '370', tone: 'success' }, { key: '大勾臂车', label: '大勾臂车', value: '6', tone: 'info' }, { key: '小三轮车', label: '小三轮车', value: '540', tone: 'warning' }]

export const vehicleStatusFilters = [{ key: 'all', label: '全部' }, { key: '在线', label: '在线' }, { key: '充电', label: '充电' }, { key: '离线', label: '离线' }]



export const safetyMonitorRows = [
  { id: 'S001', type: '分神驾驶', time: '10:31:22', vehicle: '豫E3G516', place: '龙泉镇南街', driver: '张师傅', speed: 42, level: '一级', tone: 'danger' },
  { id: 'S002', type: '疲劳驾驶', time: '10:18:45', vehicle: '豫E6N109', place: '马投涧工业路', driver: '李师傅', speed: 38, level: '二级', tone: 'danger' },
  { id: 'S003', type: '接打电话', time: '09:56:12', vehicle: '豫E01622D', place: '文明大道', driver: '王师傅', speed: 35, level: '三级', tone: 'warning' },
  { id: 'S004', type: '车道偏离', time: '09:42:08', vehicle: '豫E2R012', place: '龙泉镇陈家庄', driver: '赵师傅', speed: 51, level: '四级', tone: 'success' },
  { id: 'S005', type: '行人碰撞预警', time: '09:28:36', vehicle: '豫E0D789', place: '善应镇中城村', driver: '周师傅', speed: 28, level: '二级', tone: 'info' },
]

export type SafetyMonitorRow = (typeof safetyMonitorRows)[number]

export const safetyAttachments = [{ kind: 'video', label: '驾驶室监控视频' }, { kind: 'video', label: '前向道路监控视频' }, { kind: 'image', label: '驾驶员抓拍图片' }, { kind: 'image', label: '道路环境抓拍图片' }]

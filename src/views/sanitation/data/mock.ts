export type StatusTone = 'normal' | 'success' | 'warning' | 'danger' | 'processing' | 'offline'

export interface MetricItem {
  label: string
  value: string | number
  unit?: string
  trend?: string
  tone?: StatusTone
}

export interface TableRow {
  id: string
  [key: string]: string | number | undefined
}

export interface MapPoint {
  id: string
  name: string
  type: 'vehicle' | 'box' | 'station' | 'plant' | 'alarm' | 'point'
  category: string
  status: StatusTone
  town: string
  x: number
  y: number
  value?: string
}

export const towns = [
  { id: 'T001', name: '马投涧镇', code: 'LA-MTJ', province: '河南省', city: '安阳市', area: '龙安区', population: 34500, villages: 28, owner: '张建国', phone: '13837210001', address: '龙安区马投涧镇人民政府', longitude: 114.2865, latitude: 36.0421, status: '启用' },
  { id: 'T002', name: '龙泉镇', code: 'LA-LQ', province: '河南省', city: '安阳市', area: '龙安区', population: 28600, villages: 23, owner: '李晓峰', phone: '13837210002', address: '龙安区龙泉镇人民政府', longitude: 114.3102, latitude: 36.0187, status: '启用' },
  { id: 'T003', name: '善应镇', code: 'LA-SY', province: '河南省', city: '安阳市', area: '龙安区', population: 26300, villages: 21, owner: '王海涛', phone: '13837210003', address: '龙安区善应镇人民政府', longitude: 114.4126, latitude: 35.9813, status: '启用' },
  { id: 'T004', name: '马家乡', code: 'LA-MJ', province: '河南省', city: '安阳市', area: '龙安区', population: 24100, villages: 19, owner: '赵文静', phone: '13837210004', address: '龙安区马家乡人民政府', longitude: 114.2158, latitude: 35.9742, status: '启用' },
  { id: 'T005', name: '东风乡', code: 'LA-DF', province: '河南省', city: '安阳市', area: '龙安区', population: 20500, villages: 17, owner: '刘志强', phone: '13837210005', address: '龙安区东风乡人民政府', longitude: 114.3624, latitude: 36.1089, status: '启用' },
  { id: 'T006', name: '彰武街道', code: 'LA-ZW', province: '河南省', city: '安阳市', area: '龙安区', population: 18500, villages: 15, owner: '孙丽', phone: '13837210006', address: '龙安区彰武街道办事处', longitude: 114.3851, latitude: 36.0316, status: '启用' },
  { id: 'T007', name: '文明大道街道', code: 'LA-WM', province: '河南省', city: '安阳市', area: '龙安区', population: 21300, villages: 18, owner: '郭森', phone: '13837210007', address: '龙安区文明大道街道办事处', longitude: 114.3478, latitude: 36.0954, status: '启用' },
  { id: 'T008', name: '太行小区街道', code: 'LA-TH', province: '河南省', city: '安阳市', area: '龙安区', population: 16500, villages: 16, owner: '陈芳', phone: '13837210008', address: '龙安区太行小区街道办事处', longitude: 114.3389, latitude: 36.0921, status: '启用' },
  { id: 'T009', name: '田村街道', code: 'LA-TC', province: '河南省', city: '安阳市', area: '龙安区', population: 15200, villages: 12, owner: '黄志强', phone: '13837210009', address: '龙安区田村街道办事处', longitude: 114.3721, latitude: 36.0785, status: '启用' },
  { id: 'T010', name: '文昌大道街道', code: 'LA-WC', province: '河南省', city: '安阳市', area: '龙安区', population: 22800, villages: 14, owner: '杨晓梅', phone: '13837210010', address: '龙安区文昌大道街道办事处', longitude: 114.3587, latitude: 36.0862, status: '启用' },
  { id: 'T011', name: '中州路街道', code: 'LA-ZZL', province: '河南省', city: '安阳市', area: '龙安区', population: 19600, villages: 11, owner: '周建华', phone: '13837210011', address: '龙安区中州路街道办事处', longitude: 114.3312, latitude: 36.0837, status: '启用' },
  { id: 'T012', name: '西大街街道', code: 'LA-XDJ', province: '河南省', city: '安阳市', area: '龙安区', population: 17800, villages: 10, owner: '吴秀英', phone: '13837210012', address: '龙安区西大街街道办事处', longitude: 114.3215, latitude: 36.0908, status: '启用' },
  { id: 'T013', name: '东大街街道', code: 'LA-DDJ', province: '河南省', city: '安阳市', area: '龙安区', population: 18900, villages: 10, owner: '马超', phone: '13837210013', address: '龙安区东大街街道办事处', longitude: 114.3428, latitude: 36.0891, status: '启用' },
  { id: 'T014', name: '头二三街道', code: 'LA-TES', province: '河南省', city: '安阳市', area: '龙安区', population: 16100, villages: 9, owner: '朱丽华', phone: '13837210014', address: '龙安区头二三街道办事处', longitude: 114.3356, latitude: 36.0875, status: '启用' },
  { id: 'T015', name: '甜水井街道', code: 'LA-TSJ', province: '河南省', city: '安阳市', area: '龙安区', population: 14300, villages: 8, owner: '许明', phone: '13837210015', address: '龙安区甜水井街道办事处', longitude: 114.3489, latitude: 36.0843, status: '启用' },
  { id: 'T016', name: '东关街道', code: 'LA-DG', province: '河南省', city: '安阳市', area: '龙安区', population: 20700, villages: 13, owner: '何晓东', phone: '13837210016', address: '龙安区东关街道办事处', longitude: 114.3652, latitude: 36.0928, status: '启用' },
  { id: 'T017', name: '南关街道', code: 'LA-NG', province: '河南省', city: '安阳市', area: '龙安区', population: 19400, villages: 12, owner: '曹艳', phone: '13837210017', address: '龙安区南关街道办事处', longitude: 114.3415, latitude: 36.0789, status: '启用' },
  { id: 'T018', name: '紫薇大道街道', code: 'LA-ZWDD', province: '河南省', city: '安阳市', area: '龙安区', population: 23500, villages: 15, owner: '韩磊', phone: '13837210018', address: '龙安区紫薇大道街道办事处', longitude: 114.3756, latitude: 36.0963, status: '启用' },
  { id: 'T019', name: '银杏街道', code: 'LA-YX', province: '河南省', city: '安阳市', area: '龙安区', population: 17200, villages: 11, owner: '冯静', phone: '13837210019', address: '龙安区银杏街道办事处', longitude: 114.3541, latitude: 36.0812, status: '启用' },
  { id: 'T020', name: '光华路街道', code: 'LA-GHL', province: '河南省', city: '安阳市', area: '龙安区', population: 15800, villages: 10, owner: '程辉', phone: '13837210020', address: '龙安区光华路街道办事处', longitude: 114.3698, latitude: 36.0886, status: '启用' },
]

export const villages = [
  { id: 'V001', name: '南坡村', code: 'V-MTJ-001', town: '马投涧镇', population: 1180, households: 372, owner: '张红军', phone: '13937210011', longitude: 114.2941, latitude: 36.0485, status: '启用' },
  { id: 'V002', name: '牛家窑村', code: 'V-MTJ-002', town: '马投涧镇', population: 980, households: 301, owner: '秦伟', phone: '13937210012', longitude: 114.2789, latitude: 36.0358, status: '启用' },
  { id: 'V003', name: '石岩村', code: 'V-LQ-001', town: '龙泉镇', population: 1460, households: 448, owner: '侯凯', phone: '13937210013', longitude: 114.3018, latitude: 36.0224, status: '启用' },
  { id: 'V004', name: '西上庄村', code: 'V-LQ-002', town: '龙泉镇', population: 1320, households: 410, owner: '何敏', phone: '13937210014', longitude: 114.3195, latitude: 36.0102, status: '启用' },
  { id: 'V005', name: '善应北村', code: 'V-SY-001', town: '善应镇', population: 1210, households: 366, owner: '孟磊', phone: '13937210015', longitude: 114.4182, latitude: 35.9856, status: '启用' },
  { id: 'V006', name: '化象村', code: 'V-MJ-001', town: '马家乡', population: 890, households: 275, owner: '郑鹏', phone: '13937210016', longitude: 114.2094, latitude: 35.9698, status: '启用' },
  { id: 'V007', name: '郭里西村', code: 'V-MTJ-003', town: '马投涧镇', population: 1050, households: 328, owner: '王保国', phone: '13937210017', longitude: 114.2712, latitude: 36.0415, status: '启用' },
  { id: 'V008', name: '高小屯村', code: 'V-MTJ-004', town: '马投涧镇', population: 870, households: 264, owner: '李春生', phone: '13937210018', longitude: 114.3025, latitude: 36.0523, status: '启用' },
  { id: 'V009', name: '许吴村', code: 'V-DF-001', town: '东风乡', population: 1340, households: 415, owner: '吴建平', phone: '13937210019', longitude: 114.3581, latitude: 36.1125, status: '启用' },
  { id: 'V010', name: '徐家口村', code: 'V-DF-002', town: '东风乡', population: 1120, households: 346, owner: '徐保军', phone: '13937210020', longitude: 114.3694, latitude: 36.1047, status: '启用' },
  { id: 'V011', name: '张北河村', code: 'V-SY-002', town: '善应镇', population: 960, households: 298, owner: '张来喜', phone: '13937210021', longitude: 114.4251, latitude: 35.9768, status: '启用' },
  { id: 'V012', name: '南善应村', code: 'V-SY-003', town: '善应镇', population: 1380, households: 427, owner: '刘文才', phone: '13937210022', longitude: 114.4089, latitude: 35.9724, status: '启用' },
  { id: 'V013', name: '李家庄村', code: 'V-MJ-002', town: '马家乡', population: 760, households: 238, owner: '李福山', phone: '13937210023', longitude: 114.2215, latitude: 35.9685, status: '启用' },
  { id: 'V014', name: '东泽村', code: 'V-MJ-003', town: '马家乡', population: 920, households: 285, owner: '赵大勇', phone: '13937210024', longitude: 114.2087, latitude: 35.9801, status: '启用' },
  { id: 'V015', name: '西泽村', code: 'V-DF-003', town: '东风乡', population: 1030, households: 319, owner: '孙国华', phone: '13937210025', longitude: 114.3465, latitude: 36.1158, status: '启用' },
  { id: 'V016', name: '陈家庄村', code: 'V-LQ-003', town: '龙泉镇', population: 1150, households: 356, owner: '陈建国', phone: '13937210026', longitude: 114.3268, latitude: 36.0135, status: '启用' },
  { id: 'V017', name: '白龙庙村', code: 'V-LQ-004', town: '龙泉镇', population: 880, households: 272, owner: '白明山', phone: '13937210027', longitude: 114.2954, latitude: 36.0257, status: '启用' },
  { id: 'V018', name: '黄张村', code: 'V-MTJ-005', town: '马投涧镇', population: 940, households: 291, owner: '黄海波', phone: '13937210028', longitude: 114.2869, latitude: 36.0382, status: '启用' },
  { id: 'V019', name: '南田村', code: 'V-SY-004', town: '善应镇', population: 1070, households: 332, owner: '田志强', phone: '13937210029', longitude: 114.4156, latitude: 35.9912, status: '启用' },
  { id: 'V020', name: '马家村', code: 'V-MJ-004', town: '马家乡', population: 840, households: 258, owner: '马德福', phone: '13937210030', longitude: 114.2152, latitude: 35.9637, status: '启用' },
]

export const vehicles = [
  { id: 'CAR001', plateNo: '豫E7A031', vehicleType: '小三轮', town: '马投涧镇', driver: '张师傅', driverType: '驾驶员', driverPhone: '13900010021', deviceNo: 'GPS-LA-001', status: '在线', speed: 18, mileage: 42.6, weight: '-', alarms: 0 },
  { id: 'CAR002', plateNo: '豫E3G516', vehicleType: '小勾臂车', town: '龙泉镇', driver: '李师傅', driverType: '驾驶员', driverPhone: '13900010022', deviceNo: 'GPS-LA-021', status: '在线', speed: 46, mileage: 86.2, weight: '2.4t', alarms: 1 },
  { id: 'CAR003', plateNo: '豫E8K270', vehicleType: '大勾臂车', town: '善应镇', driver: '王师傅', driverType: '驾驶员', driverPhone: '13900010023', deviceNo: 'GPS-LA-041', status: '充电', speed: 62, mileage: 114.8, weight: '13.8t', alarms: 3 },
  { id: 'CAR004', plateNo: '豫E2M883', vehicleType: '小勾臂车', town: '马家乡', driver: '赵师傅', driverType: '设备运维', driverPhone: '13900010024', deviceNo: 'GPS-LA-022', status: '离线', speed: 0, mileage: 51.4, weight: '1.7t', alarms: 0 },
  { id: 'CAR005', plateNo: '豫E6N109', vehicleType: '大勾臂车', town: '马投涧镇', driver: '孙师傅', driverType: '驾驶员', driverPhone: '13900010025', deviceNo: 'GPS-LA-042', status: '在线', speed: 39, mileage: 97.3, weight: '11.6t', alarms: 0 },
  { id: 'CAR006', plateNo: '豫E1P392', vehicleType: '小三轮', town: '东风乡', driver: '陈师傅', driverType: '驾驶员', driverPhone: '13900010026', deviceNo: 'GPS-LA-002', status: '在线', speed: 15, mileage: 31.8, weight: '-', alarms: 0 },
  { id: 'CAR007', plateNo: '豫E5F678', vehicleType: '小三轮', town: '马投涧镇', driver: '周小明', driverType: '驾驶员', driverPhone: '13900010027', deviceNo: 'GPS-LA-003', status: '在线', speed: 22, mileage: 38.5, weight: '-', alarms: 0 },
  { id: 'CAR008', plateNo: '豫E9C345', vehicleType: '小勾臂车', town: '龙泉镇', driver: '吴刚', driverType: '驾驶员', driverPhone: '13900010028', deviceNo: 'GPS-LA-023', status: '离线', speed: 0, mileage: 72.1, weight: '1.9t', alarms: 0 },
  { id: 'CAR009', plateNo: '豫E0D789', vehicleType: '大勾臂车', town: '善应镇', driver: '郑伟', driverType: '驾驶员', driverPhone: '13900010029', deviceNo: 'GPS-LA-043', status: '在线', speed: 55, mileage: 108.5, weight: '12.5t', alarms: 1 },
  { id: 'CAR010', plateNo: '豫E2F456', vehicleType: '小三轮', town: '马家乡', driver: '冯大伟', driverType: '驾驶员', driverPhone: '13900010030', deviceNo: 'GPS-LA-004', status: '在线', speed: 14, mileage: 29.6, weight: '-', alarms: 0 },
  { id: 'CAR011', plateNo: '豫E7G123', vehicleType: '小勾臂车', town: '东风乡', driver: '褚怀亮', driverType: '驾驶员', driverPhone: '13900010031', deviceNo: 'GPS-LA-024', status: '充电', speed: 0, mileage: 63.8, weight: '2.1t', alarms: 0 },
  { id: 'CAR012', plateNo: '豫E3H890', vehicleType: '大勾臂车', town: '马投涧镇', driver: '卫东', driverType: '驾驶员', driverPhone: '13900010032', deviceNo: 'GPS-LA-044', status: '离线', speed: 0, mileage: 132.6, weight: '14.2t', alarms: 2 },
  { id: 'CAR013', plateNo: '豫E8J567', vehicleType: '小三轮', town: '龙泉镇', driver: '蒋小军', driverType: '驾驶员', driverPhone: '13900010033', deviceNo: 'GPS-LA-005', status: '在线', speed: 20, mileage: 35.2, weight: '-', alarms: 0 },
  { id: 'CAR014', plateNo: '豫E1K234', vehicleType: '小勾臂车', town: '善应镇', driver: '沈国平', driverType: '驾驶员', driverPhone: '13900010034', deviceNo: 'GPS-LA-025', status: '离线', speed: 0, mileage: 55.4, weight: '1.5t', alarms: 0 },
  { id: 'CAR015', plateNo: '豫E5M901', vehicleType: '大勾臂车', town: '马家乡', driver: '韩志伟', driverType: '驾驶员', driverPhone: '13900010035', deviceNo: 'GPS-LA-045', status: '充电', speed: 0, mileage: 96.7, weight: '10.8t', alarms: 0 },
  { id: 'CAR016', plateNo: '豫E9N678', vehicleType: '小三轮', town: '东风乡', driver: '唐金平', driverType: '驾驶员', driverPhone: '13900010036', deviceNo: 'GPS-LA-006', status: '离线', speed: 0, mileage: 22.3, weight: '-', alarms: 0 },
  { id: 'CAR017', plateNo: '豫E0P345', vehicleType: '小勾臂车', town: '马投涧镇', driver: '曹德旺', driverType: '驾驶员', driverPhone: '13900010037', deviceNo: 'GPS-LA-026', status: '在线', speed: 41, mileage: 78.9, weight: '2.6t', alarms: 1 },
  { id: 'CAR018', plateNo: '豫E2R012', vehicleType: '大勾臂车', town: '龙泉镇', driver: '彭建', driverType: '驾驶员', driverPhone: '13900010038', deviceNo: 'GPS-LA-046', status: '在线', speed: 48, mileage: 103.2, weight: '12.1t', alarms: 0 },
  { id: 'CAR019', plateNo: '豫E6S789', vehicleType: '小三轮', town: '善应镇', driver: '贺明', driverType: '驾驶员', driverPhone: '13900010039', deviceNo: 'GPS-LA-007', status: '在线', speed: 16, mileage: 27.4, weight: '-', alarms: 0 },
  { id: 'CAR020', plateNo: '豫E1T456', vehicleType: '小勾臂车', town: '马家乡', driver: '肖红卫', driverType: '驾驶员', driverPhone: '13900010040', deviceNo: 'GPS-LA-027', status: '在线', speed: 35, mileage: 61.7, weight: '2.2t', alarms: 0 },
]

export const stations = [
  { id: 'S001', name: '马家中转站', code: 'ST-MJ-001', town: '马家乡', slots: 2, owner: '宋立军', phone: '13737210021', address: '马家乡北街68号', radius: 500, longitude: 114.2185, latitude: 35.9768, status: '启用', boxes: 2, vehicles: 3, contactPerson: '宋立军', contactPhone: '13900010019' },
  { id: 'S002', name: '善应中转站', code: 'ST-SY-001', town: '善应镇', slots: 2, owner: '马春霞', phone: '13737210022', address: '善应镇东环路南段', radius: 500, longitude: 114.4201, latitude: 35.9835, status: '启用', boxes: 2, vehicles: 2, contactPerson: '马春霞', contactPhone: '13900010018' },
  { id: 'S003', name: '龙泉中转站', code: 'ST-LQ-001', town: '龙泉镇', slots: 2, owner: '李俊', phone: '13737210023', address: '龙泉镇南街12号', radius: 500, longitude: 114.3128, latitude: 36.0156, status: '启用', boxes: 2, vehicles: 3, contactPerson: '宋立军', contactPhone: '13900010019' },
  { id: 'S004', name: '马投涧中转站', code: 'ST-MTJ-001', town: '马投涧镇', slots: 4, owner: '周凯', phone: '13737210024', address: '马投涧镇工业路1号', radius: 800, longitude: 114.2892, latitude: 36.0448, status: '启用', boxes: 4, vehicles: 4, contactPerson: '周凯', contactPhone: '13900010020' },
  { id: 'S005', name: '东风中转站', code: 'ST-DF-001', town: '东风乡', slots: 2, owner: '刘志强', phone: '13737210025', address: '东风乡政府路西侧', radius: 500, longitude: 114.3658, latitude: 36.1112, status: '启用', boxes: 2, vehicles: 2, contactPerson: '周凯', contactPhone: '13900010020' },
  { id: 'S006', name: '彰武中转站', code: 'ST-ZW-001', town: '彰武街道', slots: 2, owner: '孙丽', phone: '13737210026', address: '彰武街道文明路南', radius: 500, longitude: 114.3876, latitude: 36.0342, status: '停用', boxes: 1, vehicles: 1, contactPerson: '马春霞', contactPhone: '13900010018' },
]

export const boxes = [
  // 小勾臂箱（10个）
  { id: 'B001', name: '南坡村1号小勾臂箱', boxNo: 'XB-MTJ-001', boxType: '小勾臂箱', capacity: 3.0, fillRate: 68, battery: 84, temperature: 24, doorStatus: '关', locationType: 'collectionPoint', locationName: '南坡村东口收集点', currentLocation: '马投涧镇南坡村东口路边', lastReportMinutesAgo: 8, status: '正常' },
  { id: 'B002', name: '牛家窑2号小勾臂箱', boxNo: 'XB-MTJ-002', boxType: '小勾臂箱', capacity: 3.0, fillRate: 91, battery: 72, temperature: 26, doorStatus: '关', locationType: 'both', locationName: '牛家窑文化广场收集点 / 豫E7A031', currentLocation: '马投涧镇牛家窑村文化广场（车辆已就位）', lastReportMinutesAgo: 12, status: '满溢', locationMatches: [{ type: 'collectionPoint', name: '牛家窑文化广场收集点' }, { type: 'vehicle', name: '豫E7A031' }] },
  { id: 'B006', name: '郭里西3号小勾臂箱', boxNo: 'XB-MTJ-003', boxType: '小勾臂箱', capacity: 3.0, fillRate: 45, battery: 90, temperature: 22, doorStatus: '开', locationType: 'collectionPoint', locationName: '郭里西村广场收集点', currentLocation: '马投涧镇郭里西村文化广场', lastReportMinutesAgo: 18, status: '正常' },
  { id: 'B007', name: '许吴村1号小勾臂箱', boxNo: 'XB-DF-001', boxType: '小勾臂箱', capacity: 3.0, fillRate: null, battery: null, temperature: null, doorStatus: '关', locationType: 'vehicle', locationName: '豫E1P392', currentLocation: '东风乡许吴村→中转站途中', lastReportMinutesAgo: 78, status: '离线' },
  { id: 'B008', name: '徐家口2号小勾臂箱', boxNo: 'XB-DF-002', boxType: '小勾臂箱', capacity: 3.0, fillRate: 38, battery: 85, temperature: 21, doorStatus: '关', locationType: 'collectionPoint', locationName: '高小屯村北收集点', currentLocation: '马投涧镇高小屯村北头', lastReportMinutesAgo: 25, status: '正常' },
  { id: 'B009', name: '石岩村1号小勾臂箱', boxNo: 'XB-LQ-001', boxType: '小勾臂箱', capacity: 3.0, fillRate: null, battery: null, temperature: null, doorStatus: '关', locationType: 'vehicle', locationName: '豫E3G516', currentLocation: '龙泉镇→善应镇方向', lastReportMinutesAgo: 126, status: '离线' },
  { id: 'B010', name: '陈家庄2号小勾臂箱', boxNo: 'XB-LQ-002', boxType: '小勾臂箱', capacity: 3.0, fillRate: 73, battery: 8, temperature: 24, doorStatus: '开', locationType: 'collectionPoint', locationName: '陈家庄村东收集点', currentLocation: '龙泉镇陈家庄村东口', lastReportMinutesAgo: 34, status: '预警' },
  { id: 'B011', name: '张北河1号小勾臂箱', boxNo: 'XB-SY-001', boxType: '小勾臂箱', capacity: 3.0, fillRate: 47, battery: 76, temperature: 22, doorStatus: '关', locationType: 'station', locationName: '善应中转站', currentLocation: '善应镇东环路南段中转站内', lastReportMinutesAgo: 16, status: '正常' },
  { id: 'B012', name: '南田村2号小勾臂箱', boxNo: 'XB-SY-002', boxType: '小勾臂箱', capacity: 3.0, fillRate: 81, battery: 71, temperature: 62, doorStatus: '关', locationType: 'collectionPoint', locationName: '南田村收集点', currentLocation: '善应镇南田村村委会旁', lastReportMinutesAgo: 42, status: '预警' },
  { id: 'B013', name: '化象村1号小勾臂箱', boxNo: 'XB-MJ-001', boxType: '小勾臂箱', capacity: 3.0, fillRate: null, battery: null, temperature: null, doorStatus: '开', locationType: 'vehicle', locationName: '豫E2M883', currentLocation: '马家乡化象村→马家中转站', lastReportMinutesAgo: 93, status: '离线' },
  // 大勾臂箱（10个）
  { id: 'B003', name: '善应压缩箱A', boxNo: 'DB-SY-001', boxType: '大勾臂箱', capacity: 18.0, fillRate: 82, currentLocation: '善应镇东环路南段中转站内', lastReportMinutesAgo: 6, locationType: 'station', locationName: '善应中转站', status: '正常' },
  { id: 'B004', name: '龙泉压缩箱B', boxNo: 'DB-LQ-001', boxType: '大勾臂箱', capacity: 18.0, fillRate: 54, currentLocation: '龙泉镇南街12号中转站', lastReportMinutesAgo: 14, locationType: 'station', locationName: '龙泉中转站', status: '正常' },
  { id: 'B005', name: '马投涧压缩箱C', boxNo: 'DB-MTJ-001', boxType: '大勾臂箱', capacity: 18.0, fillRate: 94, currentLocation: '马投涧中转站（大勾臂车已就位）', lastReportMinutesAgo: 8, locationType: 'both', locationName: '马投涧中转站 / 豫E8K270', status: '满溢', locationMatches: [{ type: 'station', name: '马投涧中转站' }, { type: 'vehicle', name: '豫E8K270' }] },
  { id: 'B014', name: '东风压缩箱A', boxNo: 'DB-DF-001', boxType: '大勾臂箱', capacity: 18.0, fillRate: 61, currentLocation: '东风乡政府路西侧中转站', lastReportMinutesAgo: 22, locationType: 'station', locationName: '东风中转站', status: '正常' },
  { id: 'B015', name: '马家压缩箱A', boxNo: 'DB-MJ-001', boxType: '大勾臂箱', capacity: 18.0, fillRate: 46, currentLocation: '马家乡北街68号中转站', lastReportMinutesAgo: 31, locationType: 'station', locationName: '马家中转站', status: '正常' },
  { id: 'B016', name: '马投涧压缩箱D', boxNo: 'DB-MTJ-002', boxType: '大勾臂箱', capacity: 18.0, fillRate: 77, currentLocation: '马投涧镇工业路1号中转站', lastReportMinutesAgo: 17, locationType: 'vehicle', locationName: '豫E6N109', status: '正常' },
  { id: 'B017', name: '龙泉压缩箱C', boxNo: 'DB-LQ-002', boxType: '大勾臂箱', capacity: 18.0, fillRate: 88, currentLocation: '龙泉镇政府路中转站', lastReportMinutesAgo: 40, locationType: 'station', locationName: '龙泉中转站', status: '预警' },
  { id: 'B018', name: '善应压缩箱B', boxNo: 'DB-SY-002', boxType: '大勾臂箱', capacity: 18.0, fillRate: 35, currentLocation: '善应中转站院内', lastReportMinutesAgo: 65, locationType: 'station', locationName: '善应中转站', status: '离线' },
  { id: 'B019', name: '东风压缩箱B', boxNo: 'DB-DF-002', boxType: '大勾臂箱', capacity: 18.0, fillRate: null, currentLocation: '东风中转站西侧', lastReportMinutesAgo: 132, locationType: 'vehicle', locationName: '豫E8K270', status: '离线' },
  { id: 'B020', name: '马家压缩箱B', boxNo: 'DB-MJ-002', boxType: '大勾臂箱', capacity: 18.0, fillRate: 52, currentLocation: '马家乡北街中转站', lastReportMinutesAgo: 26, locationType: 'plant', locationName: '马投涧垃圾焚烧厂', status: '正常' },
]

export const alarms = [
  { id: 'A20260520001', alarmType: '主动安全', level: '严重', target: '豫E8K270', town: '善应镇', content: '驾驶员分神驾驶，触发视频联动', time: '2026-05-20 09:14:22', status: '未处理' },
  { id: 'A20260520002', alarmType: '满溢告警', level: '重要', target: '牛家窑2号小勾臂箱', town: '马投涧镇', content: '满溢比例达到91%，建议派单清运', time: '2026-05-20 09:22:41', status: '未处理' },
  { id: 'A20260520003', alarmType: '设备离线', level: '一般', target: '豫E2M883', town: '马家乡', content: 'GPS 设备超过30分钟未上报', time: '2026-05-20 09:35:08', status: '已查看' },
  { id: 'A20260520004', alarmType: '称重异常', level: '重要', target: '豫E3G516', town: '龙泉镇', content: '称重数据5分钟内突变超过1.2吨', time: '2026-05-20 10:01:37', status: '已处理' },
  { id: 'A20260520005', alarmType: '低电量', level: '一般', target: '马投涧压缩箱C', town: '马投涧镇', content: '满溢设备电量低于70%', time: '2026-05-20 10:12:49', status: '未处理' },
]

export const workOrders = [
  { id: 'W001', title: '牛家窑2号箱体满溢处理', type: '满溢处理工单', source: '满溢告警', assignee: '张师傅', deadline: '2026-05-20 13:00', status: '待接单', progress: '已派发' },
  { id: 'W002', title: '善应北村疑似漏收核查', type: '漏收处理工单', source: '作业监管', assignee: '李师傅', deadline: '2026-05-20 15:30', status: '处理中', progress: '现场核查' },
  { id: 'W003', title: '豫E8K270主动安全事件复核', type: '安全告警工单', source: '主动安全', assignee: '安全员王磊', deadline: '2026-05-20 18:00', status: '待审核', progress: '已提交说明' },
  { id: 'W004', title: '马家中转站称重设备检修', type: '设备故障工单', source: '人工创建', assignee: '设备运维赵强', deadline: '2026-05-21 10:00', status: '已关闭', progress: '审核通过' },
]

export const weighRecords = [
  { id: 'D001', plateNo: '豫E3G516', vehicleType: '小勾臂车', town: '龙泉镇', weight: 2.4, location: '石岩村收集点', deviceStatus: '正常', time: '2026-05-20 08:42:12', status: '正常' },
  { id: 'D002', plateNo: '豫E8K270', vehicleType: '大勾臂车', town: '善应镇', weight: 13.8, location: '善应中转站', deviceStatus: '正常', time: '2026-05-20 09:16:31', status: '正常' },
  { id: 'D003', plateNo: '豫E6N109', vehicleType: '大勾臂车', town: '马投涧镇', weight: 11.6, location: '马投涧中转站', deviceStatus: '正常', time: '2026-05-20 09:53:20', status: '正常' },
  { id: 'D004', plateNo: '豫E2M883', vehicleType: '小勾臂车', town: '马家乡', weight: 1.7, location: '马家中转站', deviceStatus: '离线', time: '2026-05-20 10:03:11', status: '异常' },
]

export const mapPoints: MapPoint[] = [
  { id: 'P001', name: '豫E7A031', type: 'vehicle', category: '小三轮', status: 'success', town: '马投涧镇', x: 39, y: 56, value: '18km/h' },
  { id: 'P002', name: '豫E3G516', type: 'vehicle', category: '小勾臂车', status: 'processing', town: '龙泉镇', x: 53, y: 42, value: '2.4t' },
  { id: 'P003', name: '豫E8K270', type: 'vehicle', category: '大勾臂车', status: 'danger', town: '善应镇', x: 62, y: 30, value: '3告警' },
  { id: 'P004', name: '豫E2M883', type: 'vehicle', category: '小勾臂车', status: 'offline', town: '马家乡', x: 28, y: 38, value: '离线' },
  { id: 'P101', name: '马家中转站', type: 'station', category: '中转站', status: 'success', town: '马家乡', x: 25, y: 46, value: '2机位' },
  { id: 'P102', name: '善应中转站', type: 'station', category: '中转站', status: 'warning', town: '善应镇', x: 66, y: 34, value: '预警' },
  { id: 'P103', name: '龙泉中转站', type: 'station', category: '中转站', status: 'success', town: '龙泉镇', x: 50, y: 50, value: '正常' },
  { id: 'P104', name: '马投涧中转站', type: 'station', category: '中转站', status: 'danger', town: '马投涧镇', x: 36, y: 63, value: '满溢' },
  { id: 'P201', name: '牛家窑2号小勾臂箱', type: 'box', category: '小勾臂箱', status: 'danger', town: '马投涧镇', x: 42, y: 62, value: '91%' },
  { id: 'P202', name: '善应压缩箱A', type: 'box', category: '大勾臂箱', status: 'warning', town: '善应镇', x: 68, y: 37, value: '82%' },
  { id: 'P301', name: '马投涧垃圾焚烧厂', type: 'plant', category: '焚烧厂', status: 'processing', town: '马投涧镇', x: 18, y: 68, value: '地磅未对接' },
]

export const dashboardMetrics: MetricItem[] = [
  { label: '服务乡镇', value: 8, unit: '个', trend: '覆盖全区', tone: 'processing' },
  { label: '行政村', value: 157, unit: '个', trend: '档案完整率 98%', tone: 'success' },
  { label: '服务人口', value: '19.0', unit: '万人', trend: '较方案一致', tone: 'success' },
  { label: '车辆总数', value: 56, unit: '辆', trend: '在线 49 辆', tone: 'processing' },
  { label: '箱体总数', value: 286, unit: '个', trend: '异常 17 个', tone: 'warning' },
  { label: '今日垃圾量', value: 107.3, unit: '吨', trend: '车载称重估算', tone: 'success' },
  { label: '主动安全告警', value: 18, unit: '条', trend: '严重 3 条', tone: 'danger' },
  { label: '工单完成率', value: 86, unit: '%', trend: '超时 2 单', tone: 'warning' },
]

export const trendData = [
  { time: '00:00', value: 4.2 },
  { time: '03:00', value: 8.6 },
  { time: '06:00', value: 18.4 },
  { time: '09:00', value: 39.8 },
  { time: '12:00', value: 58.2 },
  { time: '15:00', value: 82.5 },
  { time: '18:00', value: 101.6 },
  { time: '21:00', value: 107.3 },
]

export const townWasteRank = [
  { town: '马投涧镇', value: 18.6 },
  { town: '龙泉镇', value: 15.8 },
  { town: '善应镇', value: 14.7 },
  { town: '马家乡', value: 13.4 },
  { town: '东风乡', value: 11.2 },
  { town: '彰武街道', value: 10.1 },
]

export const vehicleRank = [
  { vehicle: '豫E8K270', value: 114.8 },
  { vehicle: '豫E6N109', value: 97.3 },
  { vehicle: '豫E3G516', value: 86.2 },
  { vehicle: '豫E2M883', value: 51.4 },
  { vehicle: '豫E7A031', value: 42.6 },
]

export const statusToneMap: Record<string, StatusTone> = {
  正常: 'success',
  启用: 'success',
  在线: 'success',
  进行中: 'processing',
  处理中: 'processing',
  收运中: 'processing',
  待接单: 'warning',
  待派发: 'warning',
  待审核: 'warning',
  已接单: 'processing',
  已到达目的地: 'normal',
  预警: 'warning',
  告警: 'danger',
  满溢: 'danger',
  严重: 'danger',
  异常: 'danger',
  未处理: 'danger',
  未读: 'danger',
  已读: 'processing',
  不需处理: 'normal',
  待处理: 'warning',
  已处理: 'success',
  已完成: 'success',
  未超时: 'normal',
  已超时: 'danger',
  离线: 'offline',
  停用: 'offline',
  已取消: 'offline',
  已查看: 'processing',
  线下处理中: 'warning',
  已转收运单: 'success',
  已关闭: 'success',
}

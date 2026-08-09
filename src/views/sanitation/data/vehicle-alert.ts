import { reactive } from 'vue'

export interface VehicleAlarm {
  id: string
  type: string
  plateNo: string
  content: string
  triggerTime: string
  readStatus: '未读' | '已读'
}

/** 顶部消息中心使用的车辆主动安全告警原型数据。 */
export const vehicleAlarms: VehicleAlarm[] = reactive([
  { id: 'VA20260520001', type: '超速告警', plateNo: '豫E3G516', content: '车辆速度 72km/h，超过当前道路限速 60km/h。', triggerTime: '2026-05-20 10:18:00', readStatus: '未读' },
  { id: 'VA20260520002', type: '疲劳驾驶', plateNo: '豫E8K270', content: '驾驶员连续驾驶时间超过 4 小时，请及时休息。', triggerTime: '2026-05-20 09:56:00', readStatus: '未读' },
  { id: 'VA20260520003', type: '分神驾驶', plateNo: '豫E2M883', content: '主动安全设备检测到驾驶员持续分神驾驶。', triggerTime: '2026-05-20 09:14:22', readStatus: '未读' },
  { id: 'VA20260520004', type: '接打电话', plateNo: '豫E6N109', content: '主动安全设备检测到驾驶员行驶中接打电话。', triggerTime: '2026-05-20 08:45:00', readStatus: '已读' },
])

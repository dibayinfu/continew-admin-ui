<template>
  <div class="gi_page sanitation-page trace-page">
    <ModuleHeader title="小勾臂箱报文" subtitle="按箱号、设备号与时间查看原始报文、解析结果及远程控制记录。" phase="V1.0" priority="P0" module="箱体监管">
      <template #extra><a-tag color="orange">模拟数据 · 原型</a-tag></template>
    </ModuleHeader>

    <PrdPanel :sections="prdSections" />
    <div class="source-links">行业参考：<a href="https://docs.aws.amazon.com/iot/latest/developerguide/iot-remote-command-concepts.html" target="_blank" rel="noopener noreferrer">AWS IoT 命令执行状态</a> · <a href="https://docs.aws.amazon.com/iot/latest/developerguide/device-shadow-document.html" target="_blank" rel="noopener noreferrer">AWS IoT 请求响应关联</a></div>

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input v-model="boxNoInput" allow-clear placeholder="箱号，如 086" style="width: 130px" @press-enter="applyQuery" />
          <a-input v-model="deviceInput" allow-clear placeholder="设备号" style="width: 190px" @press-enter="applyQuery" />
          <a-select v-model="eventTypeInput" placeholder="事件类型" style="width: 160px">
            <a-option value="all">全部事件</a-option>
            <a-option value="telemetry">状态上报</a-option>
            <a-option value="command">远程控制</a-option>
            <a-option value="other">刷卡等事件</a-option>
            <a-option value="protocol">连接与配置</a-option>
          </a-select>
          <a-input-number v-model="temperatureAboveInput" :min="-100" :max="150" allow-clear placeholder="温度大于 °C" style="width: 145px" />
          <a-input-number v-model="batteryBelowInput" :min="0" :max="100" allow-clear placeholder="电量小于 %" style="width: 140px" />
          <a-input v-model="cardInput" allow-clear placeholder="刷卡卡号" style="width: 145px" @press-enter="applyQuery" />
          <a-range-picker v-model="range" show-time value-format="YYYY-MM-DD HH:mm:ss" style="width: 360px" />
          <a-button type="primary" @click="applyQuery"><template #icon><icon-search /></template>查询</a-button>
          <a-button @click="resetQuery"><template #icon><icon-refresh /></template>重置</a-button>
        </a-space>
      </div>
      <a-table row-key="id" :data="displayRows" :columns="columns" :pagination="{ pageSize: 20, showTotal: true, showJumper: true }" :scroll="{ x: 1840 }" stripe>
        <template #direction="{ record }"><a-tag :color="record.direction === '上行' ? 'arcoblue' : record.direction === '下行' ? 'purple' : 'gray'">{{ record.direction }}</a-tag></template>
        <template #location="{ record }"><a-link v-if="field(record, '纬度') !== '—'" @click="showAddress(record)">查看</a-link><span v-else>—</span></template>
        <template #status="{ record }"><a-tag :color="record.statusColor">{{ record.status }}</a-tag></template>
        <template #action="{ record }"><a-link @click="selectedEvent = record">详情</a-link></template>
      </a-table>
    </div>

    <a-modal :visible="addressVisible" title="经纬度地址" :width="460" @cancel="addressVisible = false">
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="经纬度">{{ addressCoordinate }}</a-descriptions-item>
        <a-descriptions-item label="地址"><a-spin v-if="addressLoading" size="small" />{{ addressLoading ? ' 逆解析中…' : addressResult }}</a-descriptions-item>
      </a-descriptions>
      <template #footer><a-button @click="addressVisible = false">关闭</a-button></template>
    </a-modal>

    <a-drawer :visible="!!selectedEvent" :width="650" title="报文与解析详情" unmount-on-close @cancel="selectedEvent = null">
      <template v-if="selectedEvent">
        <div class="drawer-title">{{ selectedEvent.title }} <a-tag :color="selectedEvent.statusColor">{{ selectedEvent.status }}</a-tag></div>
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="平台时间">{{ selectedEvent.time }}</a-descriptions-item>
          <a-descriptions-item label="设备时间">{{ selectedEvent.deviceTime || '未携带' }}</a-descriptions-item>
          <a-descriptions-item label="设备号">{{ boxOf(selectedEvent).device }}</a-descriptions-item>
          <a-descriptions-item label="箱号">{{ boxOf(selectedEvent).no }}</a-descriptions-item>
          <a-descriptions-item label="消息 ID">{{ selectedEvent.messageId }}</a-descriptions-item>
          <a-descriptions-item label="流水号">{{ selectedEvent.serial || '—' }}</a-descriptions-item>
          <a-descriptions-item label="关联指令">{{ selectedEvent.commandId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="协议版本">{{ frameMeta(selectedEvent).version }}</a-descriptions-item>
          <a-descriptions-item label="声明 / 实际长度">{{ frameMeta(selectedEvent).length }}</a-descriptions-item>
          <a-descriptions-item label="校验">{{ frameMeta(selectedEvent).checksum }}</a-descriptions-item>
          <a-descriptions-item label="解析状态">{{ selectedEvent.parseError || '成功' }}</a-descriptions-item>
        </a-descriptions>
        <h4>解析字段</h4>
        <div class="field-list"><div v-for="item in selectedEvent.fields" :key="item[0]"><span>{{ item[0] }}</span><b>{{ item[1] }}</b></div></div>
        <h4>原始报文 HEX</h4>
        <pre class="hex-block">{{ visibleHex(selectedEvent) }}</pre>
        <div class="drawer-tip">样例中的 E7 标为 RFID 门状态，不能据此判断继电器是否上电；0x0001 仅表示通用应答。</div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PrdPanel from './components/PrdPanel.vue'
import ModuleHeader from './components/ModuleHeader.vue'
import { wgs84ToGcj02 } from './data/longan-archive'

type EventKind = 'telemetry' | 'command' | 'other' | 'protocol'
interface TraceEvent { id: string, box: string, time: string, deviceTime?: string, direction: string, title: string, messageId: string, summary: string, status: string, statusColor: string, kind: EventKind, serial?: string, commandId?: string, hex?: string, parseError?: string, fields: [string, string][] }
const boxes = [
  { id: 'A', no: '086', device: '12345678901234567891', lng: 114.013341, lat: 36.046742 },
  { id: 'B', no: '209', device: '12345678901234567892', lng: 114.035212, lat: 36.059120 },
  { id: 'C', no: '117', device: '12345678901234567893', lng: 114.058937, lat: 36.009850 },
  { id: 'D', no: '264', device: '12345678901234567894', lng: 113.945782, lat: 35.968635 },
  { id: 'E', no: '352', device: '12345678901234567895', lng: 113.854624, lat: 36.136392 },
]
const mockBox = (id: string) => boxes.find((box) => box.id === id) || boxes[0]
const boxNoInput = ref('')
const deviceInput = ref('')
const eventTypeInput = ref('all')
const temperatureAboveInput = ref<number | undefined>(undefined)
const batteryBelowInput = ref<number | undefined>(undefined)
const cardInput = ref('')
const appliedBoxNo = ref('')
const appliedDevice = ref('')
const appliedEventType = ref('all')
const appliedTemperatureAbove = ref<number | undefined>(undefined)
const appliedBatteryBelow = ref<number | undefined>(undefined)
const appliedCard = ref('')
const range = ref<string[]>(['2026-07-03 10:28:00', '2026-07-03 10:37:00'])
const appliedRange = ref([...range.value])
const selectedEvent = ref<TraceEvent | null>(null)
const addressVisible = ref(false)
const addressLoading = ref(false)
const addressCoordinate = ref('')
const addressResult = ref('')
const addressCache = new Map<string, string>()
const prdSections = [
  { title: '目标与行业参考', items: [
    { label: '业务目标', value: '让产品和研发按三位箱号（001—370）、设备号、时间追溯设备上报和平台下发，核对原始报文、解析值以及设备动作的先后顺序。' },
    { label: '设计思路', value: '原始消息可追溯：保留每条完整上下行帧及解析错误；设备状态可查询：保留原值、换算值与状态变化；命令执行可关联：用内部指令 ID 串联用户请求、实际发送及终端应答。三者组成一条可复盘的证据链。' },
    { label: 'AWS IoT 参考', value: 'AWS IoT Commands 为每次执行生成唯一 execution ID，并跟踪 CREATED、IN_PROGRESS、SUCCEEDED、FAILED、REJECTED、TIMED_OUT 等状态。Device Shadow 用 clientToken 关联请求与响应，区分 desired 与 reported 状态。这里借鉴的是关联和状态管理方法；本设备仍按 JT/T 808 报文及硬件协议实现，不直接使用 AWS 服务。' },
    { label: '结果语义', value: '0x0001 对 0x8500 的成功应答表示协议应答成功，不自动等于箱门物理打开。当前模拟协议只有 0x8500 控制命令和 0x0001 通用应答；E7 标为 RFID 门状态，不能证明继电器是否上电。无明确反馈时只显示应答结果，不推断继电器实际动作。' },
  ] },
  { title: '页面需求', items: [
    { label: '查询', value: '箱号、设备号可输入模糊查询，保留一个事件类型条件，并支持温度大于指定摄氏度、电量小于指定百分比、刷卡卡号查询；各条件可组合使用。选择平台时间范围，正式版限制最大跨度并分页。列表按平台时间倒序。' },
    { label: '事件归类', value: '原型按状态上报、远程控制、刷卡等事件、连接与配置分组；注册与注册应答等是否合并展示，由技术方案根据协议关联能力确定。' },
    { label: '模拟坐标', value: '086 号箱使用 114.013341, 36.046742；其他箱体模拟分布在周边约 2.4、5.8、10.6、17.4 公里，报文 HEX 与解析结果一致。' },
    { label: '列表', value: '同一时间线展示平台操作、上行和下行，包含心跳、注册、鉴权、注销、应答及参数设置。列表展示设备时间、传感器值及经纬度“查看”入口；点击后逆解析地址。关联指令仅在详情展示；定位状态、CSQ、卫星数、高程、速度、方向及协议头字段放在详情。无该字段显示“—”。' },
    { label: '详情', value: '展示完整 HEX、校验结果、协议版本、声明及实际消息体长度、解析字段、消息 ID、流水号、设备与平台时间及关联指令。解析失败仍可看原始帧与错误原因；鉴权信息脱敏。' },
    { label: '异常排查', value: '满溢跳变通过相邻行比较原始电压、距离和满溢率；开锁延迟通过操作、下发、应答的时间行定位。瞬时越线与正式告警分别标记。' },
  ] },
  { title: '研发落地规则', items: [
    { label: '数据模型', value: '建议分别保存原始报文、解析记录、业务指令；原始报文与解析记录一一或一对多关联，指令关联每次发送及应答。重试须保留每次发送记录。' },
    { label: '关联键', value: '业务层使用唯一 command_id。0x0001 与下行 0x8500 使用设备号＋应答消息 ID＋应答流水号，在限定会话和时间窗内匹配；处理流水号循环、重复帧、乱序和超时。' },
    { label: '计算追溯', value: '保留红外、电池、温度原值及单位，同时保存换算结果、公式版本、箱体参数版本和告警规则版本。不能用新公式无说明地覆盖历史结果。' },
    { label: '安全与性能', value: '鉴权码、卡号等敏感字段按角色授权和脱敏；按设备号、箱号与平台时间建立查询索引；限制查询跨度并分页，明确报文留存期。' },
    { label: '待确认', value: '硬件方需确认电压换算、E7 的确切含义、0x8500/0x0001 语义及是否存在继电器上电反馈。现有模拟文档的 0x8103 样例长度和校验不一致，不能作为验收帧。' },
  ] },
]
const samples = [
  { box: 'A', time: '2026-07-03 10:29:00', voltage: 1510, distance: 69, fill: 31, alert: false },
  { box: 'A', time: '2026-07-03 10:30:00', voltage: 1500, distance: 68, fill: 32, alert: false },
  { box: 'A', time: '2026-07-03 10:30:40', voltage: 510, distance: 9, fill: 91, alert: true },
  { box: 'A', time: '2026-07-03 10:32:00', voltage: 1480, distance: 67, fill: 33, alert: false },
  { box: 'A', time: '2026-07-03 10:35:00', voltage: 1460, distance: 66, fill: 34, alert: false },
  { box: 'B', time: '2026-07-03 10:29:00', voltage: 980, distance: 43, fill: 57, alert: false },
  { box: 'B', time: '2026-07-03 10:32:00', voltage: 960, distance: 42, fill: 58, alert: false },
  { box: 'B', time: '2026-07-03 10:35:00', voltage: 940, distance: 41, fill: 59, alert: false },
  { box: 'C', time: '2026-07-03 10:33:00', voltage: 1260, distance: 55, fill: 45, alert: false },
  { box: 'D', time: '2026-07-03 10:34:00', voltage: 720, distance: 24, fill: 76, alert: false },
  { box: 'E', time: '2026-07-03 10:35:30', voltage: 1620, distance: 74, fill: 26, alert: false },
]
function withChecksum(hex: string) {
  const bytes = hex.split(' ').map((v) => Number.parseInt(v, 16))
  bytes[bytes.length - 2] = bytes.slice(1, -2).reduce((xor, byte) => xor ^ byte, 0)
  return bytes.map((v) => v.toString(16).toUpperCase().padStart(2, '0')).join(' ')
}
function withCoordinates(hex: string, boxId: string) {
  const parts = hex.split(' ')
  const box = mockBox(boxId)
  for (const [offset, value] of [[26, Math.round(box.lat * 1_000_000)], [30, Math.round(box.lng * 1_000_000)]]) {
    const bytes = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
    bytes.forEach((byte, index) => {
      parts[offset + index] = byte.toString(16).toUpperCase().padStart(2, '0')
    })
  }
  return withChecksum(parts.join(' '))
}
function telemetryHex(voltage: number, time: string, serial: number, box: string) {
  const parts = '7E 02 00 40 31 01 12 34 56 78 90 12 34 56 78 91 00 01 00 00 00 00 00 02 00 02 02 26 07 96 06 CB B4 9D 00 32 00 00 00 00 26 07 03 10 30 00 E4 02 03 41 E5 02 01 00 E6 02 05 DC E7 01 00 30 01 14 31 01 0A 00 7E'.split(' ')
  parts[15] = mockBox(box).device.slice(-2)
  parts[17] = serial.toString(16).toUpperCase().padStart(2, '0')
  parts[43] = time.slice(11, 13)
  parts[44] = time.slice(14, 16)
  parts[45] = time.slice(17, 19)
  parts[56] = (voltage >> 8).toString(16).toUpperCase().padStart(2, '0')
  parts[57] = (voltage & 255).toString(16).toUpperCase().padStart(2, '0')
  parts[60] = '00'
  return withCoordinates(parts.join(' '), box)
}
const telemetry = samples.map((s, i): TraceEvent => ({ id: `t${i}`, box: s.box, time: s.time, deviceTime: s.time, direction: '上行', title: '位置及传感器上报', messageId: '0x0200', summary: `红外 ${s.voltage} mV · 距离 ${s.distance} cm · 满溢率 ${s.fill}%`, status: s.alert ? '瞬时越线' : '解析成功', statusColor: s.alert ? 'orange' : 'green', kind: 'telemetry', serial: String(i + 2).padStart(4, '0'), hex: telemetryHex(s.voltage, s.time, i + 2, s.box), fields: [['红外电压', `${s.voltage} mV`], ['换算距离', `${s.distance} cm`], ['瞬时满溢率', `${s.fill}%`], ['告警状态', s.alert ? '瞬时越线，未形成持续告警' : '正常'], ['电池电压', '833 mV'], ['电量', '76%'], ['温度原值', '256'], ['温度换算', '25.6 °C'], ['报警标志', '0x00000000'], ['状态标志', '0x00020002'], ['纬度', mockBox(s.box).lat.toFixed(6)], ['经度', mockBox(s.box).lng.toFixed(6)], ['定位状态', 'GPS 已定位'], ['高程', '50 m'], ['速度', '0 km/h'], ['方向角', '0°'], ['CSQ', '20'], ['卫星数', '10'], ['E7 原值', '0x00（含义待确认）']] }))
const commandEvents: TraceEvent[] = [
  { id: 'c1', box: 'A', time: '2026-07-03 10:31:00', direction: '平台操作', title: '用户请求远程开锁', messageId: '—', summary: '操作人 张工 · 开锁', status: '已创建', statusColor: 'blue', kind: 'command', commandId: 'CMD-260703-001', fields: [['操作人', '张工'], ['操作', '远程开锁']] },
  { id: 'c2', box: 'A', time: '2026-07-03 10:31:02', direction: '下行', title: '开锁指令已发送', messageId: '0x8500', summary: '控制标志 0x00 · 下发流水号 0042', status: '已发送', statusColor: 'blue', kind: 'command', serial: '0042', commandId: 'CMD-260703-001', hex: withChecksum('7E 85 00 40 01 01 12 34 56 78 90 12 34 56 78 91 00 2A 00 00 7E'), fields: [['控制标志', '0x00（开锁）'], ['下发流水号', '0042']] },
  { id: 'c3', box: 'A', time: '2026-07-03 10:34:18', direction: '上行', title: '终端通用应答', messageId: '0x0001', summary: '应答 0x8500 / 流水号 0042 · 下发后 3 分 16 秒', status: '设备已应答', statusColor: 'green', kind: 'command', serial: '0043', commandId: 'CMD-260703-001', hex: withChecksum('7E 00 01 40 05 01 12 34 56 78 90 12 34 56 78 91 00 2B 00 2A 85 00 00 00 7E'), fields: [['应答消息 ID', '0x8500'], ['应答流水号', '0042'], ['协议结果', '成功；不代表继电器已上电']] },

]
const otherEvents: TraceEvent[] = [{ id: 'o1', box: 'A', time: '2026-07-03 10:29:00', deviceTime: '2026-07-03 10:30:00', direction: '上行', title: 'RFID 刷卡事件', messageId: '0x0200 / E8', summary: '卡号 12345678 · 刷卡时间 10:29:00', status: '解析成功', statusColor: 'green', kind: 'other', hex: withCoordinates('7E 02 00 40 3D 01 12 34 56 78 90 12 34 56 78 91 00 02 00 00 00 00 00 02 00 02 02 26 07 96 06 CB B4 9D 00 32 00 00 00 00 26 07 03 10 30 00 E4 02 03 41 E5 02 01 00 E6 02 05 DC E7 01 00 30 01 14 31 01 0A E8 0A 12 34 56 78 26 07 03 10 29 00 00 7E', 'A'), fields: [['卡号', '12345678'], ['刷卡时间', '2026-07-03 10:29:00'], ['红外电压', '1500 mV'], ['换算距离', '68 cm'], ['瞬时满溢率', '32%'], ['电池电压', '833 mV'], ['电量', '76%'], ['温度原值', '256'], ['温度换算', '25.6 °C'], ['报警标志', '0x00000000'], ['状态标志', '0x00020002'], ['纬度', mockBox('A').lat.toFixed(6)], ['经度', mockBox('A').lng.toFixed(6)], ['定位状态', 'GPS 已定位'], ['高程', '50 m'], ['速度', '0 km/h'], ['方向角', '0°'], ['CSQ', '20'], ['卫星数', '10'], ['E7 原值', '0x00（含义待确认）']] }]
const protocolEvents: TraceEvent[] = [
  { id: 'p1', box: 'A', time: '2026-07-03 10:28:01', direction: '上行', title: '终端注册', messageId: '0x0100', summary: '终端注册', status: '已接收', statusColor: 'green', kind: 'protocol', serial: '0001', hex: '7E 01 00 40 3A 01 12 34 56 78 90 12 34 56 78 91 00 01 00 01 00 01 46 33 30 30 41 46 33 30 30 41 2D 4A 54 38 30 38 56 35 2E 34 2E 39 44 32 30 31 32 33 34 35 36 37 38 39 30 31 32 33 34 35 36 37 38 39 30 01 BE A9 41 38 38 38 38 38 3E 7E', fields: [['制造商', 'F300A'], ['终端型号', 'F300A-JT808V5.4.9D20'], ['终端 ID', '12345678901234567890'], ['车牌号（模拟字段）', '京A88888']] },
  { id: 'p2', box: 'A', time: '2026-07-03 10:28:02', direction: '下行', title: '终端注册应答', messageId: '0x8100', summary: '终端注册应答', status: '已发送', statusColor: 'blue', kind: 'protocol', serial: '0001', hex: '7E 81 00 40 0B 01 12 34 56 78 90 12 34 56 78 91 00 01 00 01 00 41 55 54 48 31 32 33 34 C6 7E', fields: [['应答流水号', '0001'], ['结果', '成功'], ['鉴权码', '********（已脱敏）']] },
  { id: 'p3', box: 'A', time: '2026-07-03 10:28:03', direction: '上行', title: '终端鉴权', messageId: '0x0102', summary: '终端鉴权', status: '解析成功', statusColor: 'green', kind: 'protocol', serial: '0001', hex: '7E 01 02 40 2D 01 12 34 56 78 90 12 34 56 78 91 00 01 08 41 55 54 48 31 32 33 34 38 36 31 32 33 34 35 36 37 38 39 30 31 32 33 56 35 2E 34 2E 39 2D 44 32 30 00 00 00 00 00 00 00 00 00 00 00 51 7E', fields: [['鉴权码', '********（已脱敏）'], ['IMEI', '861234567890123'], ['终端型号', 'V5.4.9-D20']] },
  { id: 'p4', box: 'A', time: '2026-07-03 10:28:05', direction: '下行', title: '设置终端参数', messageId: '0x8103', summary: '设置终端参数', status: '解析异常', statusColor: 'red', kind: 'protocol', serial: '0001', hex: '7E 81 03 40 09 01 12 34 56 78 90 12 34 56 78 91 00 01 01 00 01 04 00 00 00 1E 67 7E', fields: [['参数 ID', '0x0001'], ['心跳间隔', '30 秒'], ['异常原因', '消息体声明 9 字节，实际 8 字节，校验码不匹配']], parseError: '消息体长度不符；XOR 校验失败' },
  { id: 'p5', box: 'A', time: '2026-07-03 10:28:30', direction: '上行', title: '终端心跳', messageId: '0x0002', summary: '终端心跳', status: '解析成功', statusColor: 'green', kind: 'protocol', serial: '0001', hex: '7E 00 02 40 00 01 12 34 56 78 90 12 34 56 78 91 00 01 43 7E', fields: [] },
  { id: 'p6', box: 'A', time: '2026-07-03 10:28:04', direction: '下行', title: '平台通用应答', messageId: '0x8001', summary: '平台通用应答', status: '已发送', statusColor: 'blue', kind: 'protocol', serial: '0001', hex: '7E 80 01 40 05 01 12 34 56 78 90 12 34 56 78 91 00 01 00 01 01 00 00 C5 7E', fields: [['应答消息 ID', '0x0100'], ['应答流水号', '0001'], ['结果', '成功']] },
  { id: 'p7', box: 'A', time: '2026-07-03 10:36:30', direction: '上行', title: '终端注销', messageId: '0x0003', summary: '终端注销', status: '解析成功', statusColor: 'green', kind: 'protocol', serial: '0001', hex: '7E 00 03 40 00 01 12 34 56 78 90 12 34 56 78 91 00 01 42 7E', fields: [] },
]
const columns = [
  { title: '平台时间', dataIndex: 'time', width: 175 },
  { title: '设备时间', dataIndex: 'deviceTime', width: 175 },
  { title: '箱号', dataIndex: 'boxNo', width: 75 },
  { title: '设备号', dataIndex: 'device', width: 230 },
  { title: '方向', dataIndex: 'direction', slotName: 'direction', width: 90 },
  { title: '事件', dataIndex: 'title', width: 170 },
  { title: '红外 / 距离 / 满溢率', dataIndex: 'sensor', width: 215 },
  { title: '电池电压 / 电量', dataIndex: 'battery', width: 165 },
  { title: '温度原值 / 换算', dataIndex: 'temperature', width: 145 },
  { title: '卡号 / 刷卡时间', dataIndex: 'card', width: 215 },
  { title: '经纬度', dataIndex: 'location', slotName: 'location', width: 100 },
  { title: '结果', dataIndex: 'status', slotName: 'status', width: 110 },
  { title: '操作', slotName: 'action', width: 85, fixed: 'right' },
]
function frameMeta(event: TraceEvent) {
  if (!event.hex)
    return { version: '—', length: '—', checksum: '非报文操作' }
  const bytes = event.hex.split(' ').map((part) => Number.parseInt(part, 16))
  const declaredLength = ((bytes[3] << 8) | bytes[4]) & 0x03FF
  const actualLength = bytes.length - 20
  const calculated = bytes.slice(1, -2).reduce((xor, byte) => xor ^ byte, 0)
  return {
    version: `JT/T 808-2019 / 0x${bytes[5].toString(16).padStart(2, '0').toUpperCase()}`,
    length: `${declaredLength} / ${actualLength} 字节`,
    checksum: calculated === bytes[bytes.length - 2] ? '通过' : `失败（报文 ${bytes[bytes.length - 2].toString(16).padStart(2, '0').toUpperCase()}，计算 ${calculated.toString(16).padStart(2, '0').toUpperCase()}）`,
  }
}
function visibleHex(event: TraceEvent) {
  if (!event.hex)
    return '此记录为平台操作事件，无设备报文。'
  const bytes = event.hex.split(' ')
  if (event.messageId === '0x0102')
    bytes.splice(19, 8, ...Array(8).fill('**'))
  if (event.messageId === '0x8100')
    bytes.splice(21, 8, ...Array(8).fill('**'))
  return bytes.join(' ')
}
const allEvents = [...telemetry, ...commandEvents, ...otherEvents, ...protocolEvents]
const boxOf = (event: TraceEvent) => boxes.find((box) => box.id === event.box) || boxes[0]
const field = (event: TraceEvent, name: string) => event.fields.find((item) => item[0] === name)?.[1] || '—'
const sensorOf = (event: TraceEvent) => field(event, '红外电压') === '—' ? '—' : `${field(event, '红外电压')} / ${field(event, '换算距离')} / ${field(event, '瞬时满溢率')}`
const batteryOf = (event: TraceEvent) => field(event, '电池电压') === '—' ? '—' : `${field(event, '电池电压')} / ${field(event, '电量')}`
const temperatureOf = (event: TraceEvent) => field(event, '温度原值') === '—' ? '—' : `${field(event, '温度原值')} / ${field(event, '温度换算')}`
const cardOf = (event: TraceEvent) => field(event, '卡号') === '—' ? '—' : `${field(event, '卡号')} / ${field(event, '刷卡时间')}`
const numericField = (event: TraceEvent, name: string) => {
  const value = field(event, name)
  return value === '—' ? undefined : Number.parseFloat(value)
}
const filteredEvents = computed(() => allEvents.filter((event) => {
  const box = boxOf(event)
  return event.time >= appliedRange.value[0]
    && event.time <= appliedRange.value[1]
    && box.no.toLowerCase().includes(appliedBoxNo.value)
    && box.device.toLowerCase().includes(appliedDevice.value)
    && (appliedEventType.value === 'all' || event.kind === appliedEventType.value)
    && (appliedTemperatureAbove.value == null || (numericField(event, '温度换算') ?? -Infinity) > appliedTemperatureAbove.value)
    && (appliedBatteryBelow.value == null || (numericField(event, '电量') ?? Infinity) < appliedBatteryBelow.value)
    && (!appliedCard.value || field(event, '卡号').includes(appliedCard.value))
}).sort((a, b) => b.time.localeCompare(a.time)))
const visibleEvents = filteredEvents
const displayRows = computed(() => visibleEvents.value.map((event) => ({
  ...event,
  boxNo: boxOf(event).no,
  device: boxOf(event).device,
  sensor: sensorOf(event),
  battery: batteryOf(event),
  temperature: temperatureOf(event),
  card: cardOf(event),
  deviceTime: event.deviceTime || '—',
})))
async function showAddress(event: TraceEvent) {
  const lat = Number(field(event, '纬度'))
  const lng = Number(field(event, '经度'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return
  const coordinate = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  addressCoordinate.value = coordinate
  addressVisible.value = true
  addressResult.value = ''
  addressLoading.value = false
  const cached = addressCache.get(coordinate)
  if (cached) {
    addressResult.value = cached
    return
  }
  const key = import.meta.env.VITE_AMAP_JS_KEY || import.meta.env.VITE_AMAP_KEY
  if (!key) {
    addressResult.value = '未配置逆地理编码服务，暂无法获取地址'
    return
  }
  addressLoading.value = true
  try {
    const point = wgs84ToGcj02(lng, lat)
    const params = new URLSearchParams({ key, location: `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`, extensions: 'base' })
    const response = await fetch(`https://restapi.amap.com/v3/geocode/regeo?${params}`)
    if (!response.ok)
      throw new Error('逆解析请求失败')
    const data = await response.json() as { status?: string, info?: string, regeocode?: { formatted_address?: string } }
    if (data.status !== '1' || !data.regeocode?.formatted_address)
      throw new Error(data.info || '未返回地址')
    addressCache.set(coordinate, data.regeocode.formatted_address)
    if (addressCoordinate.value === coordinate)
      addressResult.value = data.regeocode.formatted_address
  } catch (error) {
    if (addressCoordinate.value === coordinate)
      addressResult.value = `地址解析失败：${error instanceof Error ? error.message : '网络异常'}`
  } finally {
    if (addressCoordinate.value === coordinate)
      addressLoading.value = false
  }
}
function applyQuery() {
  if (range.value?.length === 2)
    appliedRange.value = [...range.value]
  appliedBoxNo.value = boxNoInput.value.trim().toLowerCase()
  appliedDevice.value = deviceInput.value.trim().toLowerCase()
  appliedEventType.value = eventTypeInput.value
  appliedTemperatureAbove.value = temperatureAboveInput.value
  appliedBatteryBelow.value = batteryBelowInput.value
  appliedCard.value = cardInput.value.trim()
  selectedEvent.value = null
}
function resetQuery() {
  boxNoInput.value = ''
  deviceInput.value = ''
  eventTypeInput.value = 'all'
  temperatureAboveInput.value = undefined
  batteryBelowInput.value = undefined
  cardInput.value = ''
  appliedBoxNo.value = ''
  appliedDevice.value = ''
  appliedEventType.value = 'all'
  appliedTemperatureAbove.value = undefined
  appliedBatteryBelow.value = undefined
  appliedCard.value = ''
  range.value = ['2026-07-03 10:28:00', '2026-07-03 10:37:00']
  appliedRange.value = [...range.value]
  selectedEvent.value = null
}
</script>

<style scoped lang="scss">
.sanitation-page{display:flex;flex-direction:column;gap:14px}
.table-panel{padding:16px;background:var(--color-bg-2);border-radius:4px}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px}
.source-links{padding:0 4px;font-size:12px;color:var(--color-text-3)}.source-links a{color:rgb(var(--primary-6))}
.drawer-title{font-size:17px;font-weight:600;margin-bottom:18px}.drawer-title .arco-tag{margin-left:8px}
.field-list{border:1px solid var(--color-border-2);border-radius:4px;overflow:hidden}.field-list>div{display:flex;justify-content:space-between;gap:16px;padding:10px 14px;border-bottom:1px solid var(--color-border-2)}.field-list>div:last-child{border-bottom:0}.field-list span{color:var(--color-text-3)}.field-list b{font-weight:500;text-align:right}
.hex-block{white-space:pre-wrap;word-break:break-all;background:#182335;color:#d9e5f7;padding:15px;border-radius:4px;line-height:1.8}.drawer-tip{margin-top:15px;border-radius:4px;background:var(--color-fill-2);padding:12px 14px;color:var(--color-text-2);font-size:13px}
h4{margin:22px 0 10px}
</style>

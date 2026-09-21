<template>
  <div class="gi_page sanitation-page trace-page">
    <ModuleHeader title="小勾臂箱报文" subtitle="按箱号、设备号与时间查看原始报文、解析结果及远程控制记录。" phase="V1.0" priority="P0" module="箱体监管" />

    <PrdPanel :sections="prdSections" />
    <div class="source-links">行业参考：<a href="https://docs.aws.amazon.com/iot/latest/developerguide/iot-remote-command-concepts.html" target="_blank" rel="noopener noreferrer">AWS IoT 命令执行状态</a> · <a href="https://docs.aws.amazon.com/iot/latest/developerguide/device-shadow-document.html" target="_blank" rel="noopener noreferrer">AWS IoT 请求响应关联</a></div>

    <div class="table-panel">
      <a-tabs v-model:active-key="activeTab" class="message-tabs">
        <a-tab-pane key="state" title="设备报文">
          <div class="toolbar">
            <a-space wrap>
              <a-input v-model="boxNoInput" allow-clear placeholder="箱号，如 086" style="width: 130px" @press-enter="applyQuery" />
              <a-input v-model="deviceInput" allow-clear placeholder="设备号" style="width: 190px" @press-enter="applyQuery" />
              <a-select v-model="deviceEventInput" placeholder="事件" style="width: 140px">
                <a-option value="all">全部事件</a-option>
                <a-option value="telemetry">状态上报</a-option>
                <a-option value="card">刷卡事件</a-option>
              </a-select>
              <a-input-number v-model="temperatureAboveInput" :min="-100" :max="150" allow-clear placeholder="温度大于 °C" style="width: 145px" />
              <a-input-number v-model="batteryBelowInput" :min="0" :max="100" allow-clear placeholder="电量小于 %" style="width: 140px" />
              <a-input v-model="cardInput" allow-clear placeholder="刷卡卡号" style="width: 145px" @press-enter="applyQuery" />
              <a-range-picker v-model="range" :disabled-date="disabledDate" show-time value-format="YYYY-MM-DD HH:mm:ss" style="width: 360px" />
              <a-button type="primary" @click="applyQuery"><template #icon><icon-search /></template>查询</a-button>
              <a-button @click="resetQuery"><template #icon><icon-refresh /></template>重置</a-button>
            </a-space>
          </div>
          <a-table row-key="id" :data="displayRows" :columns="columns" :pagination="{ pageSize: 20, showTotal: true, showJumper: true }" :scroll="{ x: 1640 }" stripe>
            <template #location="{ record }"><a-link v-if="field(record, '纬度') !== '—'" @click="showAddress(record)">查看</a-link><span v-else>—</span></template>
            <template #action="{ record }"><a-link @click="selectedEvent = record">详情</a-link></template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="command" title="远程控制">
          <div class="toolbar">
            <a-space wrap>
              <a-input v-model="boxNoInput" allow-clear placeholder="箱号，如 086" style="width: 130px" @press-enter="applyQuery" />
              <a-input v-model="deviceInput" allow-clear placeholder="设备号" style="width: 190px" @press-enter="applyQuery" />
              <a-range-picker v-model="range" :disabled-date="disabledDate" show-time value-format="YYYY-MM-DD HH:mm:ss" style="width: 360px" />
              <a-button type="primary" @click="applyQuery"><template #icon><icon-search /></template>查询</a-button>
              <a-button @click="resetQuery"><template #icon><icon-refresh /></template>重置</a-button>
            </a-space>
          </div>
          <a-table row-key="commandId" :data="commandRows" :columns="commandColumns" :pagination="{ pageSize: 20, showTotal: true }" stripe>
            <template #result="{ record }"><a-tag v-if="record.result !== '—'" :color="record.result === '成功' ? 'green' : 'red'">{{ record.result }}</a-tag><span v-else>—</span></template>
            <template #downlink="{ record }"><a-link v-if="record.downlink" @click="selectedEvent = record.downlink">{{ record.downlinkTime }}</a-link><span v-else>—</span></template>
            <template #response="{ record }"><a-link v-if="record.response" @click="selectedEvent = record.response">{{ record.responseTime }}</a-link><span v-else>—</span></template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </div>

    <a-modal :visible="addressVisible" title="经纬度地址" :width="460" @cancel="addressVisible = false">
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="经纬度">{{ addressCoordinate }}</a-descriptions-item>
        <a-descriptions-item label="地址"><a-spin v-if="addressLoading" size="small" />{{ addressLoading ? ' 逆解析中…' : addressResult }}</a-descriptions-item>
      </a-descriptions>
      <template #footer><a-button @click="addressVisible = false">关闭</a-button></template>
    </a-modal>

    <a-drawer :visible="!!selectedEvent" :width="820" title="报文与解析详情" unmount-on-close @cancel="selectedEvent = null">
      <template v-if="selectedEvent">
        <div class="drawer-title">{{ selectedEvent.title }}</div>
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
        </a-descriptions>
        <h4>解析字段</h4>
        <div class="field-list"><div v-for="item in selectedEvent.fields" :key="item[0]"><span>{{ item[0] }}</span><b>{{ item[1] }}</b></div></div>
        <h4>原始报文 HEX</h4>
        <pre class="hex-block">{{ visibleHex(selectedEvent) }}</pre>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import PrdPanel from './components/PrdPanel.vue'
import ModuleHeader from './components/ModuleHeader.vue'
import { wgs84ToGcj02 } from './data/longan-archive'

type EventKind = 'telemetry' | 'command' | 'other'
interface TraceEvent { id: string, box: string, time: string, deviceTime?: string, direction: string, title: string, messageId: string, summary: string, status: string, statusColor: string, kind: EventKind, serial?: string, commandId?: string, hex?: string, parseError?: string, fields: [string, string][] }
const boxes = [
  { id: 'A', no: '086', device: '12345678901234567891', lng: 114.013341, lat: 36.046742 },
  { id: 'B', no: '209', device: '12345678901234567892', lng: 114.035212, lat: 36.059120 },
  { id: 'C', no: '117', device: '12345678901234567893', lng: 114.058937, lat: 36.009850 },
  { id: 'D', no: '264', device: '12345678901234567894', lng: 113.945782, lat: 35.968635 },
  { id: 'E', no: '352', device: '12345678901234567895', lng: 113.854624, lat: 36.136392 },
]
const mockBox = (id: string) => boxes.find((box) => box.id === id) || boxes[0]
const mockDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
const atTime = (time: string) => `${mockDate} ${time}`
const defaultRange = () => [dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'), dayjs().format('YYYY-MM-DD HH:mm:ss')]
const disabledDate = (current: Date) => dayjs(current).isAfter(dayjs(), 'day')
const boxNoInput = ref('')
const deviceInput = ref('')
const deviceEventInput = ref('all')
const activeTab = ref('state')
const temperatureAboveInput = ref<number | undefined>(undefined)
const batteryBelowInput = ref<number | undefined>(undefined)
const cardInput = ref('')
const appliedBoxNo = ref('')
const appliedDevice = ref('')
const appliedDeviceEvent = ref('all')
const appliedTemperatureAbove = ref<number | undefined>(undefined)
const appliedBatteryBelow = ref<number | undefined>(undefined)
const appliedCard = ref('')
const range = ref<string[]>(defaultRange())
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
    { label: '结果语义', value: '0x0001 对 0x8500 的成功应答表示协议应答成功；0x0200 扩展字段 E7 解析为 RFID门状态，1 表示通电、0 表示未通电。' },
  ] },
  { title: '页面需求', items: [
    { label: '查询', value: '页签位于查询条件上方，每个页签展示自己的查询栏。“设备报文”支持箱号、设备号、事件（状态上报／刷卡事件）、温度、电量、卡号和平台时间；“远程控制”仅支持箱号、设备号和平台时间。条件可组合使用，默认查询近 7 天，最大跨度 7 天，禁止选择明天及以后的日期；正式版分页。' },
    { label: '页签', value: '“设备报文”展示状态上报和刷卡事件；“远程控制”按一次控制任务聚合展示平台操作时间、下发指令时间、应答时间。连接与配置不在本页面展示。' },
    { label: '模拟坐标', value: '086 号箱使用 114.013341, 36.046742；其他箱体模拟分布在周边约 2.4、5.8、10.6、17.4 公里，报文 HEX 与解析结果一致。' },
    { label: '设备报文', value: '按平台时间倒序展示状态上报和刷卡事件，显示设备时间、传感器值及经纬度“查看”入口；点击后逆解析地址。CSQ、卫星数、高程、速度、方向及协议头字段放在详情。' },
    { label: '远程控制', value: '一条控制任务显示平台操作时间、下发指令时间、应答时间、操作人、动作和应答结果。应答结果只允许成功、失败；尚未收到应答时为空，页面显示“—”。下发及应答时间可点击查看报文详情。' },
    { label: '详情', value: '展示完整 HEX、校验结果、协议版本、声明及实际消息体长度、解析字段、消息 ID、流水号、设备与平台时间及关联指令。解析失败仍可看原始帧与错误原因；鉴权信息脱敏。' },
    { label: '异常排查', value: '满溢跳变通过相邻行比较原始电压、距离和满溢率；开锁延迟通过操作、下发、应答的时间行定位。瞬时越线与正式告警分别标记。' },
  ] },
  { title: '研发落地规则', items: [
    { label: '数据模型', value: '建议分别保存原始报文、解析记录、业务指令；原始报文与解析记录一一或一对多关联，指令关联每次发送及应答。重试须保留每次发送记录。' },
    { label: '关联键', value: '业务层使用唯一 command_id。0x0001 与下行 0x8500 使用设备号＋应答消息 ID＋应答流水号，在限定会话和时间窗内匹配；处理流水号循环、重复帧、乱序和超时。' },
    { label: '重点：乱序应答关联', value: '连续下发多条远程开锁指令时，每次下发必须分配不同的 JT/T 808 消息流水号，并在发送前保存 command_id 与下行流水号的映射。终端 0x0001 应答消息体中的“应答消息 ID＋应答流水号”指向原下行报文；平台按“设备号＋应答消息 ID＋应答流水号”查找对应发送记录，因此即使 3 条应答延迟到达或顺序颠倒，也能分别归入正确的控制任务。0x0001 报文头自身的流水号只标识本条应答，不能用于关联原指令。' },
    { label: '关联示例', value: '同一设备连续点击 3 次远程开锁，平台创建指令 CMD-001、CMD-002、CMD-003，下发 0x8500 时分别分配流水号 0042、0043、0044，并先保存三组映射。30 秒后设备按 0044、0042、0043 的顺序返回 0x0001：携带 0044 的应答关联 CMD-003，携带 0042 的应答关联 CMD-001，携带 0043 的应答关联 CMD-002。系统依据应答消息体中的原下行流水号匹配，不依据应答到达顺序。' },
    { label: '重复与异常', value: '同一关联键收到重复应答时按幂等规则处理，只保留首次有效结果并记录重复帧。流水号为 16 位循环值，匹配时需限定当前设备连接会话和合理时间窗；若设备未正确回传原下行流水号，平台无法可靠区分连续指令，应记录为协议异常并推动固件修正。' },
    { label: '计算追溯', value: '保留红外、电池、温度原值及单位，同时保存换算结果、公式版本、箱体参数版本和告警规则版本。不能用新公式无说明地覆盖历史结果。' },
    { label: '安全与性能', value: '鉴权码、卡号等敏感字段按角色授权和脱敏；按设备号、箱号与平台时间建立查询索引；限制查询跨度并分页，明确报文留存期。' },
    { label: '待确认', value: '硬件方需确认电压换算及 0x8500/0x0001 的实际语义。现有模拟文档的 0x8103 样例长度和校验不一致，不能作为验收帧。' },
  ] },
]
const samples = [
  { box: 'A', time: atTime('10:29:00'), voltage: 1510, distance: 69, fill: 31, alert: false },
  { box: 'A', time: atTime('10:30:00'), voltage: 1500, distance: 68, fill: 32, alert: false },
  { box: 'A', time: atTime('10:30:40'), voltage: 510, distance: 9, fill: 91, alert: true },
  { box: 'A', time: atTime('10:32:00'), voltage: 1480, distance: 67, fill: 33, alert: false },
  { box: 'A', time: atTime('10:35:00'), voltage: 1460, distance: 66, fill: 34, alert: false },
  { box: 'B', time: atTime('10:29:00'), voltage: 980, distance: 43, fill: 57, alert: false },
  { box: 'B', time: atTime('10:32:00'), voltage: 960, distance: 42, fill: 58, alert: false },
  { box: 'B', time: atTime('10:35:00'), voltage: 940, distance: 41, fill: 59, alert: false },
  { box: 'C', time: atTime('10:33:00'), voltage: 1260, distance: 55, fill: 45, alert: false },
  { box: 'D', time: atTime('10:34:00'), voltage: 720, distance: 24, fill: 76, alert: false },
  { box: 'E', time: atTime('10:35:30'), voltage: 1620, distance: 74, fill: 26, alert: false },
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
function rfidHex(reportTime: string, cardTime: string, box: string) {
  const parts = '7E 02 00 40 3D 01 12 34 56 78 90 12 34 56 78 91 00 02 00 00 00 00 00 02 00 02 02 26 07 96 06 CB B4 9D 00 32 00 00 00 00 26 07 03 10 30 00 E4 02 03 41 E5 02 01 00 E6 02 05 DC E7 01 00 30 01 14 31 01 0A E8 0A 12 34 56 78 26 07 03 10 29 00 00 7E'.split(' ')
  parts[15] = mockBox(box).device.slice(-2)
  parts[60] = '01'
  const writeBcdTime = (offset: number, value: string) => {
    const values = [value.slice(2, 4), value.slice(5, 7), value.slice(8, 10), value.slice(11, 13), value.slice(14, 16), value.slice(17, 19)]
    values.forEach((item, index) => {
      parts[offset + index] = item
    })
  }
  writeBcdTime(40, reportTime)
  writeBcdTime(70, cardTime)
  return withCoordinates(parts.join(' '), box)
}
function telemetryHex(voltage: number, time: string, serial: number, box: string) {
  const parts = '7E 02 00 40 31 01 12 34 56 78 90 12 34 56 78 91 00 01 00 00 00 00 00 02 00 02 02 26 07 96 06 CB B4 9D 00 32 00 00 00 00 26 07 03 10 30 00 E4 02 03 41 E5 02 01 00 E6 02 05 DC E7 01 00 30 01 14 31 01 0A 00 7E'.split(' ')
  parts[15] = mockBox(box).device.slice(-2)
  parts[17] = serial.toString(16).toUpperCase().padStart(2, '0')
  parts[40] = time.slice(2, 4)
  parts[41] = time.slice(5, 7)
  parts[42] = time.slice(8, 10)
  parts[43] = time.slice(11, 13)
  parts[44] = time.slice(14, 16)
  parts[45] = time.slice(17, 19)
  parts[56] = (voltage >> 8).toString(16).toUpperCase().padStart(2, '0')
  parts[57] = (voltage & 255).toString(16).toUpperCase().padStart(2, '0')
  parts[60] = '00'
  return withCoordinates(parts.join(' '), box)
}
const telemetry = samples.map((s, i): TraceEvent => ({ id: `t${i}`, box: s.box, time: s.time, deviceTime: s.time, direction: '上行', title: '状态上报', messageId: '0x0200', summary: `红外 ${s.voltage} mV · 距离 ${s.distance} cm · 满溢率 ${s.fill}%`, status: s.alert ? '瞬时越线' : '解析成功', statusColor: s.alert ? 'orange' : 'green', kind: 'telemetry', serial: String(i + 2).padStart(4, '0'), hex: telemetryHex(s.voltage, s.time, i + 2, s.box), fields: [['红外电压', `${s.voltage} mV`], ['换算距离', `${s.distance} cm`], ['瞬时满溢率', `${s.fill}%`], ['电池电压', '833 mV'], ['电量', '76%'], ['温度原值', '256'], ['温度换算', '25.6 °C'], ['报警标志', '0x00000000'], ['状态标志', '0x00020002'], ['纬度', mockBox(s.box).lat.toFixed(6)], ['经度', mockBox(s.box).lng.toFixed(6)], ['高程', '50 m'], ['速度', '0 km/h'], ['方向角', '0°'], ['CSQ', '20'], ['卫星数', '10'], ['RFID门状态', '0（未通电）']] }))
const commandEvents: TraceEvent[] = [
  { id: 'c1', box: 'A', time: atTime('10:31:00'), direction: '平台操作', title: '用户请求远程开锁', messageId: '—', summary: '操作人 张工 · 开锁', status: '已创建', statusColor: 'blue', kind: 'command', commandId: 'CMD-260703-001', fields: [['操作人', '张工'], ['操作', '远程开锁']] },
  { id: 'c2', box: 'A', time: atTime('10:31:02'), direction: '下行', title: '开锁指令已发送', messageId: '0x8500', summary: '控制标志 0x00 · 下发流水号 0042', status: '已发送', statusColor: 'blue', kind: 'command', serial: '0042', commandId: 'CMD-260703-001', hex: withChecksum('7E 85 00 40 01 01 12 34 56 78 90 12 34 56 78 91 00 2A 00 00 7E'), fields: [['控制标志', '0x00（开锁）'], ['下发流水号', '0042']] },
  { id: 'c3', box: 'A', time: atTime('10:34:18'), direction: '上行', title: '终端通用应答', messageId: '0x0001', summary: '应答 0x8500 / 流水号 0042 · 下发后 3 分 16 秒', status: '设备已应答', statusColor: 'green', kind: 'command', serial: '0043', commandId: 'CMD-260703-001', hex: withChecksum('7E 00 01 40 05 01 12 34 56 78 90 12 34 56 78 91 00 2B 00 2A 85 00 00 00 7E'), fields: [['应答消息 ID', '0x8500'], ['应答流水号', '0042'], ['协议结果', '成功']] },
  { id: 'c4', box: 'B', time: atTime('10:35:00'), direction: '平台操作', title: '用户请求远程开锁', messageId: '—', summary: '操作人 李工 · 开锁', status: '已创建', statusColor: 'blue', kind: 'command', commandId: 'CMD-MOCK-002', fields: [['操作人', '李工'], ['操作', '远程开锁']] },
  { id: 'c5', box: 'B', time: atTime('10:35:03'), direction: '下行', title: '开锁指令已发送', messageId: '0x8500', summary: '控制标志 0x00 · 下发流水号 0044', status: '已发送', statusColor: 'blue', kind: 'command', serial: '0044', commandId: 'CMD-MOCK-002', hex: withChecksum('7E 85 00 40 01 01 12 34 56 78 90 12 34 56 78 92 00 2C 00 00 7E'), fields: [['控制标志', '0x00（开锁）'], ['下发流水号', '0044']] },
  { id: 'c6', box: 'C', time: atTime('10:36:00'), direction: '平台操作', title: '用户请求远程开锁', messageId: '—', summary: '操作人 王工 · 开锁', status: '已创建', statusColor: 'blue', kind: 'command', commandId: 'CMD-MOCK-003', fields: [['操作人', '王工'], ['操作', '远程开锁']] },
  { id: 'c7', box: 'C', time: atTime('10:36:02'), direction: '下行', title: '开锁指令已发送', messageId: '0x8500', summary: '控制标志 0x00 · 下发流水号 0045', status: '已发送', statusColor: 'blue', kind: 'command', serial: '0045', commandId: 'CMD-MOCK-003', hex: withChecksum('7E 85 00 40 01 01 12 34 56 78 90 12 34 56 78 93 00 2D 00 00 7E'), fields: [['控制标志', '0x00（开锁）'], ['下发流水号', '0045']] },
  { id: 'c8', box: 'C', time: atTime('10:36:08'), direction: '上行', title: '终端通用应答', messageId: '0x0001', summary: '应答 0x8500 / 流水号 0045 · 结果失败', status: '设备已应答', statusColor: 'red', kind: 'command', serial: '0046', commandId: 'CMD-MOCK-003', hex: withChecksum('7E 00 01 40 05 01 12 34 56 78 90 12 34 56 78 93 00 2E 00 2D 85 00 01 00 7E'), fields: [['应答消息 ID', '0x8500'], ['应答流水号', '0045'], ['应答结果码', '1'], ['协议结果', '失败']] },

]
const otherEvents: TraceEvent[] = [{ id: 'o1', box: 'A', time: atTime('10:29:00'), deviceTime: atTime('10:30:00'), direction: '上行', title: '刷卡事件', messageId: '0x0200 / E8', summary: '卡号 12345678 · 刷卡时间 10:29:00', status: '解析成功', statusColor: 'green', kind: 'other', hex: rfidHex(atTime('10:30:00'), atTime('10:29:00'), 'A'), fields: [['卡号', '12345678'], ['刷卡时间', atTime('10:29:00')], ['红外电压', '1500 mV'], ['换算距离', '68 cm'], ['瞬时满溢率', '32%'], ['电池电压', '833 mV'], ['电量', '76%'], ['温度原值', '256'], ['温度换算', '25.6 °C'], ['报警标志', '0x00000000'], ['状态标志', '0x00020002'], ['纬度', mockBox('A').lat.toFixed(6)], ['经度', mockBox('A').lng.toFixed(6)], ['高程', '50 m'], ['速度', '0 km/h'], ['方向角', '0°'], ['CSQ', '20'], ['卫星数', '10'], ['RFID门状态', '1（通电）']] }]
const columns = [
  { title: '平台时间', dataIndex: 'time', width: 175 },
  { title: '设备时间', dataIndex: 'deviceTime', width: 175 },
  { title: '箱号', dataIndex: 'boxNo', width: 75 },
  { title: '设备号', dataIndex: 'device', width: 230 },
  { title: '事件', dataIndex: 'title', width: 170 },
  { title: '红外 / 距离 / 满溢率', dataIndex: 'sensor', width: 215 },
  { title: '电池电压 / 电量', dataIndex: 'battery', width: 165 },
  { title: '温度原值 / 换算', dataIndex: 'temperature', width: 145 },
  { title: '卡号 / 刷卡时间', dataIndex: 'card', width: 215 },
  { title: '经纬度', dataIndex: 'location', slotName: 'location', width: 100 },
  { title: '操作', slotName: 'action', width: 85, fixed: 'right' },
]
interface CommandRow {
  commandId: string
  boxNo: string
  device: string
  operator: string
  action: string
  operationTime: string
  downlinkTime: string
  responseTime: string
  result: string
  downlink?: TraceEvent
  response?: TraceEvent
}
const commandColumns = [
  { title: '箱号', dataIndex: 'boxNo', width: 90 },
  { title: '设备号', dataIndex: 'device', width: 230 },
  { title: '操作人', dataIndex: 'operator', width: 100 },
  { title: '控制动作', dataIndex: 'action', width: 110 },
  { title: '平台操作时间', dataIndex: 'operationTime', width: 180 },
  { title: '下发指令时间', dataIndex: 'downlinkTime', slotName: 'downlink', width: 180 },
  { title: '应答时间', dataIndex: 'responseTime', slotName: 'response', width: 180 },
  { title: '应答结果', dataIndex: 'result', slotName: 'result', width: 120 },
]
function frameMeta(event: TraceEvent) {
  if (!event.hex)
    return { version: '—', length: '—' }
  const bytes = event.hex.split(' ').map((part) => Number.parseInt(part, 16))
  const declaredLength = ((bytes[3] << 8) | bytes[4]) & 0x03FF
  const actualLength = bytes.length - 20
  return {
    version: `JT/T 808-2019 / 0x${bytes[5].toString(16).padStart(2, '0').toUpperCase()}`,
    length: `${declaredLength} / ${actualLength} 字节`,
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
const allEvents = [...telemetry, ...otherEvents]
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
const commandRows = computed<CommandRow[]>(() => {
  const groups = new Map<string, TraceEvent[]>()
  commandEvents.forEach((event) => {
    if (!event.commandId)
      return
    groups.set(event.commandId, [...(groups.get(event.commandId) || []), event])
  })
  return [...groups.entries()].flatMap(([commandId, events]) => {
    const operation = events.find((event) => event.direction === '平台操作')
    const downlink = events.find((event) => event.direction === '下行')
    const response = events.find((event) => event.direction === '上行')
    if (!operation)
      return []
    const box = boxOf(operation)
    if (operation.time < appliedRange.value[0] || operation.time > appliedRange.value[1]
      || !box.no.toLowerCase().includes(appliedBoxNo.value)
      || !box.device.toLowerCase().includes(appliedDevice.value))
      return []
    return [{
      commandId,
      boxNo: box.no,
      device: box.device,
      operator: field(operation, '操作人'),
      action: field(operation, '操作'),
      operationTime: operation.time,
      downlinkTime: downlink?.time || '—',
      responseTime: response?.time || '—',
      result: response ? field(response, '协议结果') : '—',
      downlink,
      response,
    }]
  }).sort((a, b) => b.operationTime.localeCompare(a.operationTime))
})

const filteredEvents = computed(() => allEvents.filter((event) => {
  const box = boxOf(event)
  return event.time >= appliedRange.value[0]
    && event.time <= appliedRange.value[1]
    && box.no.toLowerCase().includes(appliedBoxNo.value)
    && box.device.toLowerCase().includes(appliedDevice.value)
    && (appliedDeviceEvent.value === 'all'
    || (appliedDeviceEvent.value === 'card' ? event.kind === 'other' : event.kind === appliedDeviceEvent.value))
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
  if (range.value?.length !== 2) {
    Message.warning('请选择查询时间')
    return
  }
  const [start, end] = range.value
  if (dayjs(end).isBefore(dayjs(start))) {
    Message.warning('结束时间不能早于开始时间')
    return
  }
  if (dayjs(end).diff(dayjs(start), 'millisecond') > 7 * 24 * 60 * 60 * 1000) {
    Message.warning('查询时间跨度最多为 7 天')
    return
  }
  if (dayjs(start).isAfter(dayjs(), 'day') || dayjs(end).isAfter(dayjs(), 'day')) {
    Message.warning('不能查询明天及以后的日期')
    return
  }
  appliedRange.value = [...range.value]
  appliedBoxNo.value = boxNoInput.value.trim().toLowerCase()
  appliedDevice.value = deviceInput.value.trim().toLowerCase()
  appliedDeviceEvent.value = deviceEventInput.value
  appliedTemperatureAbove.value = temperatureAboveInput.value
  appliedBatteryBelow.value = batteryBelowInput.value
  appliedCard.value = cardInput.value.trim()
  selectedEvent.value = null
}
function resetQuery() {
  boxNoInput.value = ''
  deviceInput.value = ''
  deviceEventInput.value = 'all'
  temperatureAboveInput.value = undefined
  batteryBelowInput.value = undefined
  cardInput.value = ''
  appliedBoxNo.value = ''
  appliedDevice.value = ''
  appliedDeviceEvent.value = 'all'
  appliedTemperatureAbove.value = undefined
  appliedBatteryBelow.value = undefined
  appliedCard.value = ''
  range.value = defaultRange()
  appliedRange.value = [...range.value]
  selectedEvent.value = null
}
</script>

<style scoped lang="scss">
.sanitation-page{display:flex;flex-direction:column;gap:14px}
.table-panel{padding:16px;background:var(--color-bg-2);border-radius:4px}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px}
.source-links{padding:0 4px;font-size:12px;color:var(--color-text-3)}.source-links a{color:rgb(var(--primary-6))}
.drawer-title{font-size:17px;font-weight:600;margin-bottom:18px}
.field-list{border:1px solid var(--color-border-2);border-radius:4px;overflow:hidden}.field-list>div{display:flex;justify-content:space-between;gap:16px;padding:10px 14px;border-bottom:1px solid var(--color-border-2)}.field-list>div:last-child{border-bottom:0}.field-list span{color:var(--color-text-3)}.field-list b{font-weight:500;text-align:right}
.hex-block{white-space:pre-wrap;word-break:break-all;background:#182335;color:#d9e5f7;padding:15px;border-radius:4px;line-height:1.8}
h4{margin:22px 0 10px}
</style>

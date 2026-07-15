<template>
  <div class="gi_page notification-page">
    <ModuleHeader
      title="PC端消息通知"
      subtitle="重构智慧环卫运营平台原有消息铃铛，在一个入口中集中展示垃圾收运与车辆告警。"
      phase="7月份阶段"
      priority="P0"
      module="消息通知"
    />

    <div class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <section v-for="section in prdSections" :key="section.title" class="prd-section">
              <h4 class="prd-section-title">{{ section.title }}</h4>
              <table class="prd-table">
                <tbody>
                  <tr v-for="item in section.items" :key="item.label">
                    <td class="prd-label">{{ item.label }}</td>
                    <td class="prd-value">{{ item.value }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="preview-panel">
      <div class="preview-title">
        <div>
          <span class="eyebrow">界面原型</span>
          <h3>顶部通栏 · 消息中心</h3>
        </div>
        <a-button @click="resetDemo"><template #icon><icon-refresh /></template>重置演示</a-button>
      </div>

      <div class="desktop-preview">
        <div class="mock-header">
          <div class="mock-brand">智慧环卫运营平台</div>
          <div class="header-actions">
            <span class="header-action"><icon-settings /> </span>
            <button class="bell-button active" aria-label="消息通知" @click="panelVisible = !panelVisible">
              <icon-notification />
              <span v-if="unreadCount" class="unread-dot"></span>
            </button>
            <span class="header-action"><icon-fullscreen /> </span>
            <span class="header-action"><icon-moon /> </span>
            <span class="avatar">智</span>
            <span class="user-name">智慧环卫</span>
          </div>
        </div>
        <div class="mock-content">
          <div class="content-line wide"></div><div class="content-line"></div><div class="content-cards"><i></i><i></i><i></i></div>
        </div>

        <aside v-if="panelVisible" class="notification-popover">
          <div class="popover-head">
            <strong>消息通知</strong>
            <a-badge :count="unreadCount" :max-count="99" :dot="false" class="count-badge" />
          </div>

          <div class="message-scroll">
            <section class="message-group">
              <div class="group-title"><span>垃圾收运</span><a-tag color="red">{{ displayedCollectionAlarms.length }} 条</a-tag></div>
              <article v-for="alarm in displayedCollectionAlarms" :key="alarm.id" class="alarm-card" :class="{ unread: !alarm.read }" @click="openCollectionAlarm(alarm)">
                <div class="alarm-top"><strong>{{ alarm.title }}</strong><time>{{ alarm.time }}</time></div>
                <p>{{ alarm.content }}</p>
              </article>
              <footer class="group-foot">
                <a-link @click="viewMoreCollection">查看更多 <icon-right /></a-link>
                <a-link @click="markAllCollectionRead">全部已读</a-link>
              </footer>
            </section>

            <section class="message-group vehicle-group">
              <div class="group-title"><span>车辆告警</span><a-tag color="orangered">{{ displayedVehicleAlarms.length }} 条</a-tag></div>
              <article v-for="alarm in displayedVehicleAlarms" :key="alarm.id" class="alarm-card vehicle-card" :class="{ unread: !alarm.read }" @click="openVehicleAlarm(alarm)">
                <div class="alarm-top"><strong>{{ alarm.title }}</strong><time>{{ alarm.time }}</time></div>
                <p>{{ alarm.content }}</p>
              </article>
              <footer class="group-foot">
                <a-link @click="viewMoreVehicle">查看更多 <icon-right /></a-link>
                <a-link @click="markAllVehicleRead">全部已读</a-link>
              </footer>
            </section>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'

type Alarm = { id: string; title: string; content: string; time: string; read: boolean }

const panelVisible = ref(true)
const router = useRouter()
const initialCollectionAlarms: Alarm[] = [
  { id: 'AL20260520003', title: '低电量告警', content: '陈家庄2号小勾臂箱：电量仅 8%，建议运维人员线下更换电池。', time: '2026-05-20 09:38:00', read: false },
  { id: 'AL20260520004', title: '满溢告警', content: '西上庄村1号小勾臂箱：箱体满溢 95%，已持续 3 小时以上。', time: '2026-05-20 06:50:00', read: false },
  { id: 'AL20260520005', title: '设备离线', content: '善应压缩箱A：满溢传感器超过 30 分钟未上报。', time: '2026-05-20 10:05:00', read: false },
]
const initialVehicleAlarms: Alarm[] = [
  { id: 'v1', title: '超速告警', content: '豫E3G516：车辆速度 72km/h，超过当前道路限速 60km/h。', time: '2026-05-20 10:18:00', read: false },
  { id: 'v2', title: '疲劳驾驶', content: '豫E8K270：驾驶员连续驾驶时间超过 4 小时，请及时休息。', time: '2026-05-20 09:56:00', read: false },
  { id: 'v3', title: '分神驾驶', content: '豫E2M883：主动安全设备检测到驾驶员持续分神驾驶。', time: '2026-05-20 09:14:22', read: false },
]
const collectionAlarms = ref<Alarm[]>(structuredClone(initialCollectionAlarms))
const vehicleAlarms = ref<Alarm[]>(structuredClone(initialVehicleAlarms))
const unreadCount = computed(() => [...collectionAlarms.value, ...vehicleAlarms.value].filter((item) => !item.read).length)
const displayedCollectionAlarms = computed(() => [...collectionAlarms.value]
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  .slice(0, 3))
const displayedVehicleAlarms = computed(() => [...vehicleAlarms.value]
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  .slice(0, 3))

function openCollectionAlarm(alarm: Alarm) {
  alarm.read = true
  if (alarm.title !== '满溢告警') return
  router.push({ path: '/sanitation/workOrderCreate', query: { focusAlarmId: alarm.id, source: 'notification' } })
}
function openVehicleAlarm(alarm: Alarm) {
  alarm.read = true
  Message.info('车辆告警相关功能沿用系统现有功能，不在本次开发范围内')
}
function markAllCollectionRead() {
  collectionAlarms.value.forEach((item) => { item.read = true })
  Message.success('垃圾收运告警已全部标记为已读')
}
function markAllVehicleRead() {
  vehicleAlarms.value.forEach((item) => { item.read = true })
  Message.success('车辆告警已全部标记为已读')
}
function viewMoreCollection() { router.push('/sanitation/workOrderCreate') }
function viewMoreVehicle() { router.push('/sanitation/safetyAlarm') }
function resetDemo() {
  collectionAlarms.value = structuredClone(initialCollectionAlarms)
  vehicleAlarms.value = structuredClone(initialVehicleAlarms)
  panelVisible.value = true
}

const prdSections = [
  { title: '一、功能定位', items: [
    { label: '功能入口', value: '不新增第二个铃铛，直接重构顶部通栏原有消息铃铛；存在任一类型未读告警时，原铃铛展示未读红点。' },
    { label: '服务目标', value: '在统一入口中集中展示垃圾收运和车辆告警，让管理员、调度员无需离开当前页面即可快速感知两类风险。' },
    { label: '消息范围', value: '垃圾收运包含满溢、低电量、箱体离线等当前业务告警；车辆告警包含超速、疲劳驾驶、分神驾驶、接打电话等主动安全告警。' },
    { label: '展示范围', value: '系统原有铃铛对所有机构开放展示，不再按机构限制；铃铛沿用系统原有入口，不新增图标。' },
  ] },
  { title: '二、界面呈现', items: [
    { label: '铃铛状态', value: '沿用系统原铃铛图标与位置；存在未读告警时展示红点，点击后进入高亮状态并展开统一告警浮层。' },
    { label: '浮层结构', value: '浮层依次展示“垃圾收运”和“车辆告警”两个区块，不展示 Tab；每个区块包含标题、3 条最新告警及独立的“查看更多、全部已读”。' },
    { label: '告警卡片', value: '每类告警均按发生时间倒序最多展示最新 3 条；卡片展示告警类型、发生时间、对象与详情，未读消息使用醒目标识。' },
  ] },
  { title: '三、交互规则', items: [
    { label: '阅读状态', value: '点击单条告警后，该条由未读变为已读；点击某区块“全部已读”，仅将该类型全部未读告警置为已读，并展示成功提示。铃铛红点按两类未读总数同步更新。' },
    { label: '垃圾收运联动', value: '仅“满溢告警”点击后携带 focusAlarmId 跳转“告警建任务单”并定位高亮。未建任务单时自动打开预填告警信息的创建弹窗；已建任务单时只打开告警详情并显示“查看关联任务单”。低电量、设备离线等其他告警仅变为已读，不跳转。' },
    { label: '车辆告警点击', value: '点击车辆告警不打开新页面，仅提示“车辆告警相关功能沿用系统现有功能，不在本次开发范围内”；本次不改造车辆告警详情与处置功能。' },
    { label: '告警处置', value: '弹层不提供“标待处理”和“标已处理”快捷动作；只有满溢告警通过“告警建任务单”完成收运闭环，其他垃圾收运告警仅处理阅读状态，车辆告警沿用系统现有功能。' },
    { label: '消息边界', value: '原铃铛重构为统一告警入口，不新增铃铛；弹层不提供“全部/通知”Tab，也不混入普通通知消息。' },
    { label: '查看更多', value: '垃圾收运“查看更多”跳转“收运任务单 - 告警建任务单”；车辆告警“查看更多”跳转“主动安全 - 告警列表”。' },
  ] },
  { title: '四、业务与验收', items: [
    { label: '权限与数据', value: '所有机构均展示铃铛，但仅展示当前登录用户数据权限范围内的告警。告警需包含唯一 ID、业务类型、标题/内容、产生时间、已读状态及关联业务对象。' },
    { label: '实时性', value: '新消息到达后实时刷新未读数和列表；用户打开浮层后新到消息置顶，不打断正在进行的告警处置操作。' },
    { label: '验收标准', value: '顶部仅一个系统原铃铛；弹层同时展示垃圾收运、车辆告警且各最多 3 条；两类的单条已读、全部已读、查看更多均可用，长消息可正常滚动查看。' },
  ] },
]
</script>

<style scoped lang="scss">
.notification-page { min-width: 1120px; }
.prd-panel, .preview-panel { margin-top: 16px; border-radius: 6px; background: var(--color-bg-2); }
.prd-body { padding: 2px 8px 12px; }
.prd-section + .prd-section { margin-top: 20px; }
.prd-section-title { margin: 0 0 10px; color: var(--color-text-1); font-size: 15px; }
.prd-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.prd-table td { padding: 10px 12px; border: 1px solid var(--color-border-2); line-height: 1.65; }
.prd-label { width: 150px; color: var(--color-text-1); font-weight: 600; background: var(--color-fill-2); }
.prd-value { color: var(--color-text-2); }
.preview-panel { padding: 20px; }
.preview-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.preview-title h3 { margin: 3px 0 0; font-size: 18px; color: var(--color-text-1); }
.eyebrow { color: rgb(var(--primary-6)); font-size: 12px; font-weight: 600; letter-spacing: 1px; }
.desktop-preview { position: relative; overflow: hidden; min-height: 650px; border: 1px solid var(--color-border-2); border-radius: 8px; background: #f4f7fb; }
.mock-header { display: flex; align-items: center; justify-content: space-between; height: 72px; padding: 0 34px; background: #fff; box-shadow: 0 2px 9px rgb(28 39 59 / 8%); }
.mock-brand { color: #283448; font-size: 18px; font-weight: 600; }
.header-actions { display: flex; align-items: center; gap: 20px; color: #1d2433; font-size: 22px; }
.header-action { display: inline-flex; align-items: center; }
.bell-button { position: relative; display: grid; width: 54px; height: 54px; place-items: center; border: 0; border-radius: 4px; background: transparent; color: #232a37; font-size: 27px; cursor: pointer; }
.bell-button.active { background: #eef0f5; color: #505866; }
.unread-dot { position: absolute; top: 10px; right: 9px; width: 11px; height: 11px; border: 2px solid #fff; border-radius: 50%; background: #f53f3f; }
.avatar { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 50%; color: #fff; background: #6cc80f; font-size: 22px; }.user-name { font-size: 17px; }
.mock-content { padding: 50px; }.content-line { height: 22px; width: 42%; margin-bottom: 18px; border-radius: 4px; background: #e4e9f1; }.content-line.wide { width: 75%; }.content-cards { display: flex; gap: 20px; margin-top: 38px; }.content-cards i { width: 220px; height: 160px; border-radius: 8px; background: #e7edf5; }
.notification-popover { position: absolute; z-index: 2; top: 74px; right: 34px; width: 600px; max-height: 610px; overflow: hidden; border-radius: 8px; background: #fff; box-shadow: 0 10px 28px rgb(17 32 57 / 20%); }
.popover-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 6px; color: #202939; font-size: 23px; }.count-badge :deep(.arco-badge-number) { height: 30px; min-width: 66px; padding: 0 14px; border-radius: 5px; line-height: 30px; font-size: 16px; }
.message-scroll { max-height: 525px; overflow-y: auto; }.message-group { padding: 6px 20px 0; }.vehicle-group { border-top: 8px solid #f2f4f7; }.group-title { display: flex; align-items: center; justify-content: space-between; padding: 9px 2px; color: #253044; font-size: 17px; font-weight: 600; }
.alarm-card { margin-bottom: 16px; padding: 20px; border-radius: 7px; background: #fff4f3; cursor: pointer; }.alarm-card.unread { box-shadow: inset 3px 0 #f53f3f; }.alarm-top { display: flex; justify-content: space-between; gap: 12px; color: #f53f3f; font-size: 18px; }.alarm-top time { color: #788397; font-weight: 400; white-space: nowrap; }.alarm-card p { margin: 14px 0 0; color: #4c5668; font-size: 16px; line-height: 1.55; }
.vehicle-card { background: #fff8ed; }.vehicle-card .alarm-top { color: #f77234; }.group-foot { display: flex; justify-content: space-between; padding: 13px 6px 16px; border-top: 1px solid #e5e8ef; font-size: 16px; }
@media (max-width: 1280px) { .notification-popover { right: 18px; } }
</style>

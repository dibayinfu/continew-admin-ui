<template>
  <div class="gi_page notification-page">
    <ModuleHeader
      title="PC端消息通知"
      subtitle="用于展示智慧环卫运营平台顶部通栏的小铃铛消息中心，集中承接环卫告警与业务通知。"
      phase="7月份阶段"
      priority="P0"
      module="消息通知"
    />

    <div class="prd-panel">
      <a-collapse :default-active-key="['prd']" :bordered="false">
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
            <button class="bell-button legacy-bell" aria-label="旧版消息通知">
              <icon-notification />
            </button>
            <button class="bell-button active" aria-label="消息通知" @click="panelVisible = !panelVisible">
              <icon-bulb />
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
            <div class="group-title">环卫告警</div>
            <article v-for="alarm in displayedAlarms" :key="alarm.id" class="alarm-card" :class="{ unread: !alarm.read }" @click="openAlarm">
              <div class="alarm-top"><strong>{{ alarm.title }}</strong><time>{{ alarm.time }}</time></div>
              <p>{{ alarm.content }}</p>
            </article>
            <a-empty v-if="!alarms.length" description="暂无告警" />
          </div>
          <footer class="popover-foot">
            <a-link @click="viewMore">查看更多 <icon-right /></a-link>
          </footer>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ModuleHeader from './components/ModuleHeader.vue'

type Alarm = { id: string; title: string; content: string; time: string; read: boolean }

const panelVisible = ref(true)
const router = useRouter()
const initialAlarms: Alarm[] = [
  { id: 'a1', title: '低电量告警', content: '陈家庄2号小勾臂箱：电量仅 8%，建议运维人员线下更换电池。', time: '2026-05-20 09:38:00', read: false },
  { id: 'a2', title: '满溢告警', content: '西上庄村1号小勾臂箱：箱体满溢 95%，已持续 3 小时以上。', time: '2026-05-20 06:50:00', read: false },
  { id: 'a3', title: '设备离线', content: '善应压缩箱A：满溢传感器超过 30 分钟未上报。', time: '2026-05-20 10:05:00', read: false },
]
const alarms = ref<Alarm[]>(structuredClone(initialAlarms))
const unreadCount = computed(() => alarms.value.filter((item) => !item.read).length)
const displayedAlarms = computed(() => [...alarms.value]
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  .slice(0, 5))

function openAlarm() { router.push('/sanitation/alarmCenter') }
function viewMore() { router.push('/sanitation/workOrderCreate') }
function resetDemo() { alarms.value = structuredClone(initialAlarms); panelVisible.value = true }

const prdSections = [
  { title: '一、功能定位', items: [
    { label: '功能入口', value: '顶部通栏保留两个独立的铃铛入口：左侧为既有消息功能，本期不改造；右侧为本期新增的环卫告警入口，有未读告警时展示红点。' },
    { label: '服务目标', value: '让管理员、调度员无需离开当前页面，即可快速感知需要处理的设备告警；新旧消息功能暂时相互独立。' },
    { label: '消息范围', value: '新铃铛仅承接环卫告警：满溢、低电量、设备离线等；既有通知和系统公告仍由旧铃铛功能承接。' },
    { label: '展示范围', value: '当前线上环境按机构配置：仅“河南龙淼钧泽环卫有限公司”所属用户展示新铃铛；其他机构不展示。后续应升级为按业务线配置，当前暂以机构作为配置维度。' },
  ] },
  { title: '二、界面呈现', items: [
    { label: '铃铛状态', value: '左侧旧铃铛保持既有图标和功能，不在本期范围；右侧新铃铛采用灯泡图标，存在未读告警展示红点，点击后进入高亮状态并展开浮层。' },
    { label: '浮层结构', value: '新铃铛浮层仅包含标题、未读数量、环卫告警列表和底部操作区；不展示 Tab 与普通通知，宽度建议 600px，超出区域纵向滚动。' },
    { label: '告警卡片', value: '浅红背景突出风险，展示告警标题、发生时间、对象与详情；按发生时间倒序最多展示最新 5 条，点击卡片进入告警详情或处置页面。' },
  ] },
  { title: '三、交互规则', items: [
    { label: '阅读状态', value: '点击告警仅跳转告警详情或处置页面，不改变已读状态；弹层不提供单条或批量标记已读功能。' },
    { label: '告警处置', value: '弹层不提供“标待处理”和“标已处理”快捷动作；用户点击告警卡片后进入告警详情或处置页面完成业务闭环。' },
    { label: '消息边界', value: '新功能不提供“全部/通知”Tab，也不混入普通通知；旧铃铛与新铃铛的未读状态、列表和处理逻辑互不影响。' },
    { label: '查看更多', value: '点击后跳转“收运任务单 - 告警建任务单”页面，由调度员基于告警进行任务创建和后续处置。' },
  ] },
  { title: '四、业务与验收', items: [
    { label: '权限与数据', value: '仅展示当前登录用户权限范围内的消息；新铃铛当前以用户所属机构为开关，仅“河南龙淼钧泽环卫有限公司”展示。消息需包含唯一 ID、类型、标题/内容、产生时间、已读状态及关联业务对象。' },
    { label: '实时性', value: '新消息到达后实时刷新未读数和列表；用户打开浮层后新到消息置顶，不打断正在进行的告警处置操作。' },
    { label: '验收标准', value: '未读红点、分类筛选、单条已读、全部已读、待处理/已处理、查看更多均可用；长消息和多条消息不遮挡顶部通栏且可滚动查看。' },
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
.bell-button.active { background: #eef0f5; color: #505866; }.legacy-bell { color: #535b68; }
.unread-dot { position: absolute; top: 10px; right: 9px; width: 11px; height: 11px; border: 2px solid #fff; border-radius: 50%; background: #f53f3f; }
.avatar { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 50%; color: #fff; background: #6cc80f; font-size: 22px; }.user-name { font-size: 17px; }
.mock-content { padding: 50px; }.content-line { height: 22px; width: 42%; margin-bottom: 18px; border-radius: 4px; background: #e4e9f1; }.content-line.wide { width: 75%; }.content-cards { display: flex; gap: 20px; margin-top: 38px; }.content-cards i { width: 220px; height: 160px; border-radius: 8px; background: #e7edf5; }
.notification-popover { position: absolute; z-index: 2; top: 74px; right: 34px; width: 600px; max-height: 610px; overflow: hidden; border-radius: 8px; background: #fff; box-shadow: 0 10px 28px rgb(17 32 57 / 20%); }
.popover-head { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px 6px; color: #202939; font-size: 23px; }.count-badge :deep(.arco-badge-number) { height: 30px; min-width: 66px; padding: 0 14px; border-radius: 5px; line-height: 30px; font-size: 16px; }
.message-scroll { max-height: 460px; overflow-y: auto; padding: 6px 20px 0; }.group-title { padding: 9px 2px; color: #253044; font-size: 17px; font-weight: 600; }
.alarm-card { margin-bottom: 16px; padding: 20px; border-radius: 7px; background: #fff4f3; cursor: pointer; }.alarm-card.unread { box-shadow: inset 3px 0 #f53f3f; }.alarm-top { display: flex; justify-content: space-between; gap: 12px; color: #f53f3f; font-size: 18px; }.alarm-top time { color: #788397; font-weight: 400; white-space: nowrap; }.alarm-card p { margin: 14px 0 0; color: #4c5668; font-size: 16px; line-height: 1.55; }.popover-foot { display: flex; justify-content: space-between; padding: 19px 26px; border-top: 1px solid #e5e8ef; font-size: 16px; }
@media (max-width: 1280px) { .notification-popover { right: 18px; } }
</style>

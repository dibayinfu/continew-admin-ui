<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="箱体监控"
      subtitle="APP端 · 管理员端 箱体监控。小勾臂箱 / 大勾臂箱列表与「小勾臂箱地图」，支持搜索、状态筛选、展开详情与远程开锁。"
      phase="APP端"
      priority="P0"
      module="移动端"
    />

    <!-- 产品需求说明 -->
    <div class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🎯 功能要点（开发 / 测试关注）</td></tr>
                  <tr><td class="prd-label">页面</td><td class="prd-value">管理员端 APP「箱体监控」模块，单手机框 + 顶部三 Tab（小勾臂箱 / 大勾臂箱 / 小勾臂箱地图），覆盖箱体巡检与地图定位场景</td></tr>
                  <tr><td class="prd-label">目标用户</td><td class="prd-value">管理员（如李经理），负责箱体状态巡检、满溢关注和地图定位</td></tr>
                  <tr><td class="prd-label">数据来源</td><td class="prd-value">产品原型，使用内置模拟数据（列表 10 小勾臂箱 + 10 大勾臂箱；地图 30 个小勾臂箱），不调用真实接口</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">📦 Tab 1 / Tab 2：小勾臂箱 · 大勾臂箱（列表）</td></tr>
                  <tr><td class="prd-label">类型切换</td><td class="prd-value">顶部「小勾臂箱」/「大勾臂箱」切换，各 10 条模拟数据；标题显示当前类型和数量（如"小勾臂箱 · 10个"）</td></tr>
                  <tr><td class="prd-label">搜索</td><td class="prd-value">小勾臂箱 Tab 下显示搜索框，支持按箱体编号或名称模糊查询</td></tr>
                  <tr><td class="prd-label">编号</td><td class="prd-value">箱体编号为纯数字（如 101、201），卡片上大字突出展示</td></tr>
                  <tr><td class="prd-label">状态筛选</td><td class="prd-value">全部 / 满溢 两个筛选按钮，与类型切换和搜索联合过滤</td></tr>
                  <tr><td class="prd-label">箱体卡片</td><td class="prd-value">突出重点、弱化非重点：卡片直接展示编号（大字）、所属乡镇/村庄、满溢率、电量、匹配对象、状态标签（仅「正常 / 满溢」两种）；箱体名称/类型/具体地址/锁状态/最后上报等次要信息折叠在「详情」中查看</td></tr>
                  <tr><td class="prd-label">展开详情</td><td class="prd-value">点击「详情」按钮本条下拉展开次要信息：箱体名称、编号、类型、乡镇、村庄、匹配对象、具体地址、锁状态、最后上报，按钮变蓝高亮</td></tr>
                  <tr><td class="prd-label">远程开锁</td><td class="prd-value">仅小勾臂箱显示「远程开锁/关锁」按钮（带解锁图标），大勾臂箱无此功能</td></tr>
                  <tr><td class="prd-label">导航</td><td class="prd-value">每条记录右侧「导航」按钮：点击打开全屏地图页显示该箱体位置（左上返回、底部箱体信息条），页面上「开始导航」调起手机导航软件（高德 URI API，驾车导航）</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">🗺️ Tab 3：小勾臂箱地图</td></tr>
                  <tr><td class="prd-label">地图</td><td class="prd-value">点击「小勾臂箱地图」Tab，手机端内打开高德地图，展示 30 个小勾臂箱实时分布</td></tr>
                  <tr><td class="prd-label">箱体标记</td><td class="prd-value">标记显示箱体编号；颜色区分状态：🟢 正常（<75%）/ 🟠 预警（75%~90%）/ 🔴 满溢（≥90%）</td></tr>
                  <tr><td class="prd-label">统计</td><td class="prd-value">地图上方展示「共 N 箱」与「满溢 N」统计</td></tr>
                  <tr><td class="prd-label">只看满溢</td><td class="prd-value">开关：仅显示满溢箱体，按钮红色高亮</td></tr>
                  <tr><td class="prd-label">按箱号搜索</td><td class="prd-value">地图上方搜索框，按箱体编号/名称模糊匹配并绿色高亮；回车：0 条忽略 / 多条提示「匹配到 X 个箱体，请输入更精确的编号」/ 单条自动定位缩放并打开详情；不隐藏其他箱体</td></tr>
                  <tr><td class="prd-label">点选详情</td><td class="prd-value">点击标记弹出底部详情浮层：编号、名称、状态、垃圾占比、温度、电量、在线/开关状态、具体位置、所属乡镇、设备号、上报时间，支持「导航」</td></tr>
                  <tr><td class="prd-label">所属乡镇（重点）</td><td class="prd-value">根据该箱体地址是否匹配到「收集点」来确定：当箱体地址与某个收集点匹配时，显示该收集点配置的所属乡镇 / 村庄；未匹配到收集点时显示「未匹配」</td></tr>
                </tbody>
              </table>
            </div>
            <div class="prd-section">
              <table class="prd-table">
                <tbody>
                  <tr class="prd-section-row"><td class="prd-section-title" colspan="2">⚠️ 边界 & 验收要点</td></tr>
                  <tr><td class="prd-label">✓ Tab 切换</td><td class="prd-value">三 Tab 切换流畅，列表 / 地图互不干扰</td></tr>
                  <tr><td class="prd-label">✓ 搜索过滤</td><td class="prd-value">小勾臂箱搜索按编号/名称模糊匹配</td></tr>
                  <tr><td class="prd-label">✓ 地图标记色</td><td class="prd-value">正常绿 / 预警橙 / 满溢红，与图例一致</td></tr>
                  <tr><td class="prd-label">✓ 只看满溢</td><td class="prd-value">地图仅显示满溢箱体，与统计数字一致</td></tr>
                  <tr><td class="prd-label">✓ 箱号搜索</td><td class="prd-value">输入高亮命中箱体，回车定位唯一箱体并打开详情</td></tr>
                  <tr><td class="prd-label">✓ 远程开锁</td><td class="prd-value">仅小勾臂箱显示，大勾臂箱无此按钮</td></tr>
                  <tr><td class="prd-label">✓ 导航</td><td class="prd-value">点击打开全屏地图页显示该箱体位置，页面上可调起手机导航</td></tr>
                  <tr><td class="prd-label">✓ 所属乡镇</td><td class="prd-value">箱体匹配到收集点时显示收集点所属乡镇/村庄，未匹配显示「未匹配」</td></tr>
                  <tr><td class="prd-label">✓ 界面呈现</td><td class="prd-value">字号适中（≥12px）、信息简洁不拥挤、图标辅助表达、结构层级清晰</td></tr>
                  <tr><td class="prd-label">✓ 数据来源</td><td class="prd-value">列表 generateBoxes() 生成，地图 augustSmallBoxes 模拟数据；后续对接后端需走 API</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="phone-wrapper">
      <div class="phone-frame">
        <div class="phone-status-bar">
          <span>10:15</span>
          <span>🔋 95%</span>
        </div>

        <div class="phone-body">
          <!-- 顶部标题栏 -->
          <div class="app-header">
            <span class="app-title">箱体监控</span>
            <span class="app-count">{{ boxTab === 'map' ? '地图模式' : boxTabTitle }}</span>
          </div>

          <!-- 分段 Tab -->
          <div class="tab-nav">
            <button type="button" :class="{ active: boxTab === 'small' }" @click="switchTab('small')">小勾臂箱</button>
            <button type="button" :class="{ active: boxTab === 'large' }" @click="switchTab('large')">大勾臂箱</button>
            <button type="button" :class="{ active: boxTab === 'map' }" @click="switchTab('map')">地图</button>
          </div>

          <div class="phone-content" :class="{ 'is-map': boxTab === 'map' }">
            <!-- Tab 3：小勾臂箱地图 -->
            <AugustSmallBoxMap v-if="boxTab === 'map'" class="map-fill" />

            <!-- Tab 1 / Tab 2：列表 -->
            <template v-else>
              <div class="list-tools">
                <input v-if="boxTab === 'small'" v-model="boxKeyword" class="box-search" placeholder="输入箱体编号或名称搜索" />
                <div class="status-chips">
                  <span class="chip" :class="{ active: boxStatusFilter === 'all' }" @click="boxStatusFilter = 'all'">全部</span>
                  <span class="chip chip-danger" :class="{ active: boxStatusFilter === 'overflow' }" @click="boxStatusFilter = 'overflow'">满溢</span>
                </div>
              </div>
              <div class="box-list">
              <div class="box-card" v-for="box in filteredBoxes" :key="box.id">
                <div class="box-head" @click="toggleBoxDetail(box)">
                  <span class="box-type-ic"><icon-storage /></span>
                  <div class="box-head-text">
                    <b class="box-no-main">{{ box.boxNo }}</b>
                    <span class="box-loc-line"><icon-location class="loc-ic" />{{ box.town }} · {{ box.village }}</span>
                  </div>
                  <span class="box-status-tag" :class="'status-' + box.status">{{ boxStatusMap[box.status] }}</span>
                </div>

                <div class="box-gauges">
                  <div class="gauge">
                    <span class="g-label">满溢率</span>
                    <div class="g-bar-bg"><div class="g-bar" :class="'bar-' + box.status" :style="{ width: box.fillRate + '%' }"></div></div>
                    <span class="g-val" :class="'val-' + box.status">{{ box.fillRate }}%</span>
                  </div>
                  <div class="gauge">
                    <span class="g-label">电量</span>
                    <div class="g-bar-bg"><div class="g-bar bar-battery" :class="box.battery < 20 ? 'bar-offline' : ''" :style="{ width: box.battery + '%' }"></div></div>
                    <span class="g-val" :class="box.battery < 20 ? 'val-offline' : ''">{{ box.battery }}%</span>
                  </div>
                </div>

                <div class="box-match">
                  <span class="bm-label">匹配对象</span>
                  <span class="bm-value">{{ getMatchTarget(box) }}</span>
                </div>

                <!-- 展开详情：非重点信息（名称/类型/地址/锁状态/上报时间） -->
                <div v-if="expandedBoxId === box.id" class="box-expand" @click.stop>
                  <div class="bex-row"><span>箱体名称</span><b>{{ box.boxName }}</b></div>
                  <div class="bex-row"><span>箱体编号</span><b>{{ box.boxNo }}</b></div>
                  <div class="bex-row"><span>箱体类型</span><b>{{ box.boxType }}</b></div>
                  <div class="bex-row"><span>所在乡镇</span><b>{{ box.town }}</b></div>
                  <div class="bex-row"><span>所在村庄</span><b>{{ box.village }}</b></div>
                  <div class="bex-row"><span>匹配对象</span><b>{{ getMatchTarget(box) }}</b></div>
                  <div class="bex-row"><span>具体地址</span><b>{{ getBoxAddress(box) }}</b></div>
                  <div class="bex-row"><span>锁状态</span><b>{{ box.lockStatus }}</b></div>
                  <div class="bex-row"><span>最后上报</span><b>{{ box.lastReport }}</b></div>
                </div>

                <div class="box-actions">
                  <a-button v-if="box.boxType === '小勾臂箱'" size="mini" type="primary" class="act-lock" @click.stop="handleBoxAction(box, 'lock')">
                    <template #icon><icon-unlock /></template>
                    {{ box.lockStatus === '关锁' ? '远程开锁' : '远程关锁' }}
                  </a-button>
                  <a-button size="mini" :type="expandedBoxId === box.id ? 'primary' : 'outline'" @click.stop="toggleBoxDetail(box)">
                    <template #icon><icon-eye /></template>
                    详情
                  </a-button>
                  <a-button size="mini" type="primary" class="act-nav" @click.stop="openNavPage(box)">
                    <template #icon><icon-nav /></template>
                    导航
                  </a-button>
                </div>
              </div>
            </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import AugustSmallBoxMap from './components/AugustSmallBoxMap.vue'
import { type BoxMonitorItem } from './data/app-mock'

defineOptions({ name: 'SanitationAugustAppBoxMonitor' })

const router = useRouter()

const boxTab = ref<'small' | 'large' | 'map'>('small')
const boxStatusFilter = ref<'all' | 'overflow'>('all')
const boxKeyword = ref('')
const expandedBoxId = ref<string | null>(null)

const boxStatusMap: Record<string, string> = { normal: '正常', overflow: '满溢' }

const boxTabTitle = computed(() => {
  if (boxTab.value === 'map') return '小勾臂箱地图'
  return (boxTab.value === 'small' ? '小勾臂箱' : '大勾臂箱') + ' · ' + filteredBoxes.value.length + '个'
})

function switchTab(tab: 'small' | 'large' | 'map') {
  boxTab.value = tab
  expandedBoxId.value = null
}

// 模拟坐标（WGS84，龙安区各乡镇大致位置），用于列表导航地图
const townCoords: Record<string, [number, number]> = {
  '龙泉镇': [114.2428, 36.0694],
  '马投涧镇': [114.1774, 36.0665],
  '善应镇': [114.1378, 36.0306],
  '彰武街道': [114.1602, 36.0763],
  '田村街道': [114.2115, 36.0952],
}
function coordsFor(town: string, i: number): [number, number] {
  const base = townCoords[town] || [114.19, 36.06]
  const spread = ((i * 37) % 9 - 4) * 0.0022
  return [base[0] + spread, base[1] + (((i * 17) % 7) - 3) * 0.0018]
}

// 生成模拟箱体数据：小勾臂箱 10 + 大勾臂箱 10
const smallBoxTowns = ['龙泉镇', '马投涧镇', '善应镇', '彰武街道', '田村街道']
const smallBoxVillages = ['西上庄村', '牛家窑村', '南坡村', '石岩村', '陈家庄', '盘龙寺村', '东上庄村', '北坡村', '大河村', '小河村', '张家庄', '李家庄', '王村', '赵村', '刘家沟']
const largeBoxNames = ['善应压缩箱', '龙泉转运箱', '马投涧转运箱', '彰武压缩箱', '田村压缩箱']

function generateBoxes(): BoxMonitorItem[] {
  const boxes: BoxMonitorItem[] = []
  // 小勾臂箱 10 个
  for (let i = 1; i <= 10; i++) {
    const town = smallBoxTowns[i % smallBoxTowns.length]
    const village = smallBoxVillages[i % smallBoxVillages.length]
    const fillRate = Math.floor(Math.random() * 100)
    const battery = Math.floor(Math.random() * 60) + 20
    const status: BoxMonitorItem['status'] = fillRate >= 90 ? 'overflow' : 'normal'
    const [longitude, latitude] = coordsFor(town, i)
    boxes.push({
      id: `XB${String(i).padStart(4, '0')}`,
      boxNo: String(100 + i),
      boxName: `${village}${i % 3 + 1}号小勾臂箱`,
      boxType: '小勾臂箱',
      town, village,
      fillRate, battery, status,
      lastReport: `2026-06-16 ${String(8 + Math.floor(Math.random() * 6)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      lockStatus: Math.random() > 0.1 ? '关锁' : '开锁',
      longitude, latitude,
    })
  }
  // 大勾臂箱 10 个
  for (let i = 1; i <= 10; i++) {
    const name = largeBoxNames[i % largeBoxNames.length]
    const town = smallBoxTowns[i % smallBoxTowns.length]
    const fillRate = Math.floor(Math.random() * 100)
    const battery = Math.floor(Math.random() * 40) + 60
    const status: BoxMonitorItem['status'] = fillRate >= 90 ? 'overflow' : 'normal'
    const [longitude, latitude] = coordsFor(town, i)
    boxes.push({
      id: `DB${String(i).padStart(4, '0')}`,
      boxNo: String(200 + i),
      boxName: `${name}${String.fromCharCode(64 + i)}`,
      boxType: '大勾臂箱',
      town, village: '-',
      fillRate, battery, status,
      lastReport: `2026-06-16 ${String(8 + Math.floor(Math.random() * 6)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      lockStatus: '关锁',
      longitude, latitude,
    })
  }
  return boxes
}

const allBoxes = generateBoxes()

const filteredBoxes = computed(() => {
  let list = allBoxes
  // 箱体类型筛选
  const type = boxTab.value === 'small' ? '小勾臂箱' : '大勾臂箱'
  list = list.filter(b => b.boxType === type)
  // 关键词搜索
  if (boxKeyword.value) {
    const kw = boxKeyword.value.toLowerCase()
    list = list.filter(b => b.boxNo.toLowerCase().includes(kw) || b.boxName.includes(kw))
  }
  // 状态筛选
  if (boxStatusFilter.value === 'overflow') list = list.filter(b => b.status === 'overflow')
  return list
})

function toggleBoxDetail(box: BoxMonitorItem) {
  expandedBoxId.value = expandedBoxId.value === box.id ? null : box.id
}
function getMatchTarget(box: BoxMonitorItem): string {
  const transfers: Record<string, string> = { '龙泉镇': '龙泉中转站', '马投涧镇': '马投涧中转站', '善应镇': '善应中转站', '彰武街道': '彰武中转站', '田村街道': '田村中转站' }
  const incinerators: Record<string, string> = { '龙泉镇': '龙安生活垃圾焚烧厂', '马投涧镇': '龙安生活垃圾焚烧厂', '善应镇': '城北焚烧厂', '彰武街道': '城北焚烧厂', '田村街道': '城南焚烧厂' }
  return box.boxType === '大勾臂箱' ? (incinerators[box.town] || '城北焚烧厂') : (transfers[box.town] || '龙泉中转站')
}
function getBoxAddress(box: BoxMonitorItem): string {
  return box.boxType === '大勾臂箱' ? `${box.town}${box.boxName}停靠点` : `${box.town}${box.village}收集点`
}
function handleBoxAction(box: BoxMonitorItem, action: string) {
  if (action === 'lock') ArcoMessage.success(`已发送${box.lockStatus === '关锁' ? '开锁' : '关锁'}指令到 ${box.boxName}`)
}
/** 导航：跳转到全屏地图页显示该箱体位置 */
function openNavPage(box: BoxMonitorItem) {
  if (box.longitude == null || box.latitude == null) { ArcoMessage.warning('该箱体暂无定位'); return }
  router.push({
    path: '/sanitation/augustBoxNavigation',
    query: {
      no: box.boxNo,
      name: box.boxName,
      town: box.town,
      village: box.village,
      lng: String(box.longitude),
      lat: String(box.latitude),
      fillRate: String(box.fillRate),
    },
  })
}
</script>

<style scoped lang="scss">
.sanitation-page { display: flex; flex-direction: column; gap: 14px; }
/* 产品需求说明 */
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;
  :deep(.arco-collapse-item-header) { font-weight: 600; font-size: 14px; }
}
.prd-body { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
.prd-section-title { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--color-text-1); }
.prd-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  tr:nth-child(even) { background: var(--color-fill-1); }
  td { padding: 6px 12px; border: 1px solid var(--color-border-2); vertical-align: top; line-height: 1.6; }
  .prd-label { width: 140px; min-width: 140px; font-weight: 500; color: var(--color-text-2); white-space: nowrap; }
}
/* 手机框 */
.phone-wrapper { display: flex; justify-content: center; padding: 12px 0; }
.phone-frame { width: 390px; min-height: 780px; background: #f7f8fa; border: 3px solid #1f2937; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.16); display: flex; flex-direction: column; }
.phone-status-bar { display: flex; justify-content: space-between; padding: 10px 20px 4px; background: #fff; font-size: 13px; color: #1d2129; font-weight: 600; }
.phone-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
/* 顶部标题栏（简洁） */
.app-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; background: #fff; flex-shrink: 0; }
.app-title { font-size: 19px; font-weight: 700; color: #1d2129; }
.app-count { font-size: 13px; color: #86909c; }
/* 分段 Tab（简洁胶囊） */
.tab-nav { display: flex; gap: 4px; padding: 0 16px 10px; background: #fff; flex-shrink: 0; }
.tab-nav button { flex: 1; padding: 6px 0; border: none; border-radius: 8px; background: transparent; font-size: 14px; font-weight: 600; color: #86909c; cursor: pointer; transition: all .2s; }
.tab-nav button.active { background: #f2f3f5; color: #165dff; }
.phone-content { flex: 1; overflow-y: auto; padding: 10px 16px 16px; background: #f7f8fa; }
.phone-content.is-map { display: flex; flex-direction: column; overflow: hidden; padding-top: 10px; }
.phone-content.is-map .map-fill { flex: 1; min-height: 0; height: auto; }
/* 列表工具区 */
.list-tools { margin-bottom: 10px; }
.box-search { width: 100%; padding: 9px 12px; border: 1px solid #e5e6eb; border-radius: 8px; font-size: 13px; background: #fff; outline: none; margin-bottom: 8px; box-sizing: border-box; }
.status-chips { display: flex; gap: 8px; }
.chip { padding: 3px 13px; font-size: 13px; color: #4e5969; background: #fff; border: 1px solid #e5e6eb; border-radius: 12px; cursor: pointer; transition: all .2s; }
.chip.active { background: #165dff; border-color: #165dff; color: #fff; }
.chip-danger.active { background: #f53f3f; border-color: #f53f3f; }
.chip-gray.active { background: #86909c; border-color: #86909c; }
.box-list { display: flex; flex-direction: column; gap: 10px; }
/* 箱体卡片（简洁） */
.box-card { background: #fff; border-radius: 10px; padding: 12px 14px; cursor: pointer; &:active { background: #f7f8fa; } }
.box-head { display: flex; align-items: center; gap: 10px; }
.box-type-ic { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; background: #f2f3f5; color: #165dff; font-size: 20px; flex-shrink: 0; }
.box-head-text { flex: 1; min-width: 0; }
.box-no-main { display: block; font-size: 16px; font-weight: 700; color: #1d2129; line-height: 1.3; }
.box-loc-line { display: flex; align-items: center; gap: 3px; font-size: 13px; color: #4e5969; margin-top: 2px; }
.loc-ic { color: #165dff; font-size: 14px; }
.box-status-tag { font-size: 12px; padding: 2px 9px; border-radius: 8px; flex-shrink: 0; }
.status-normal { background: #e8ffea; color: #00b42a; } .status-warning { background: #fff7e8; color: #ff7d00; }
.status-overflow { background: #fff0f0; color: #f53f3f; } .status-offline { background: #f2f3f5; color: #86909c; }
.box-gauges { display: flex; flex-direction: column; gap: 6px; margin: 10px 0 8px; }
.gauge { display: flex; align-items: center; gap: 8px; }
.g-label { font-size: 12px; color: #86909c; width: 40px; flex-shrink: 0; }
.g-bar-bg { flex: 1; height: 6px; background: #eef0f4; border-radius: 3px; overflow: hidden; }
.g-bar { height: 100%; border-radius: 3px; }
.bar-normal { background: #00b42a; } .bar-warning { background: #ff7d00; } .bar-overflow { background: #f53f3f; } .bar-offline { background: #86909c; }
.bar-battery { background: #165dff; }
.g-val { font-size: 13px; font-weight: 600; color: #1d2129; width: 34px; text-align: right; }
.g-val.val-overflow { color: #f53f3f; } .g-val.val-offline { color: #86909c; }
.box-match { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
.bm-label { color: #86909c; }
.bm-value { color: #165dff; font-weight: 500; }
.box-expand { margin-bottom: 10px; padding: 10px 12px; background: #f7f8fa; border-radius: 8px; display: flex; flex-direction: column; gap: 7px; }
.bex-row { display: flex; justify-content: space-between; font-size: 13px; span { color: #86909c; } b { color: #1d2129; } }
.box-actions { display: flex; gap: 8px; }
</style>

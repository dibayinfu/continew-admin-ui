<template>
  <div class="gi_page location-monitor-page">
    <!-- 产品需求说明 -->
    <div class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div class="prd-section">
              <p class="prd-intro">在现有位置监控页面基础上，增加以下两项需求：</p>
              <table class="prd-table">
                <thead>
                  <tr><th>序号</th><th>需求描述</th></tr>
                </thead>
                <tbody>
                  <tr><td class="prd-label">1</td><td>若车辆安装了称重设备，点击车辆后在详情弹层中显示<b>重量</b>字段。</td></tr>
                  <tr><td class="prd-label">2</td><td>若车辆已配置驾驶员，点击车辆后在详情弹层中显示驾驶员的<b>姓名及联系方式</b>。</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <!-- Main Layout: Left Tree + Center Map + Right Detail -->
    <div class="monitor-shell">
      <!-- Left: Vehicle Tree -->
      <aside class="left-tree-panel">
        <div class="panel-header">
          <span class="panel-title">车辆列表</span>
        </div>
        <div class="tree-search">
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索车牌号"
            allow-clear
            size="small"
          />
        </div>
        <div class="tree-body">
          <div class="tree-filter-row">
            <a-select v-model="orgFilter" size="small" placeholder="选择机构" allow-clear class="org-select">
              <a-option v-for="org in orgList" :key="org" :value="org">{{ org }}</a-option>
            </a-select>
          </div>
          <div class="org-groups">
            <div
              v-for="group in filteredOrgGroups"
              :key="group.org"
              class="org-group"
            >
              <div
                class="org-group-header"
                :class="{ expanded: expandedOrgs[group.org] }"
                @click="toggleOrg(group.org)"
              >
                <icon-caret-right class="expand-icon" />
                <span class="org-name">{{ group.org }}</span>
                <span class="org-count">({{ group.vehicles.length }})</span>
              </div>
              <div v-show="expandedOrgs[group.org]" class="vehicle-list">
                <div
                  v-for="v in group.vehicles"
                  :key="v.id"
                  class="vehicle-item"
                  :class="{
                    active: selectedVehicle?.id === v.id,
                    [`status-${v.status}`]: true
                  }"
                  @click="selectVehicle(v)"
                >
                  <span class="v-status-dot" :class="v.status" />
                  <span class="v-plate">{{ v.plateNo }}</span>
                  <span class="v-type">{{ v.vehicleTypeShort }}</span>
                  <span v-if="v.hasScale" class="v-scale-badge">称重</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center: Map -->
      <main class="map-panel">
        <div class="map-area" @click.self="selectedVehicle = null">
          <LonganMapFrame />
          <!-- Vehicle Markers -->
          <button
            v-for="v in displayedVehicles"
            :key="v.id"
            class="vehicle-marker"
            :class="{
              online: v.status === '在线',
              charging: v.status === '充电',
              offline: v.status === '离线',
              active: selectedVehicle?.id === v.id
            }"
            :style="{ left: `${v.mapX}%`, top: `${v.mapY}%` }"
            type="button"
            @click.stop="selectVehicle(v)"
          >
            <span class="marker-icon">🚛</span>
            <span class="marker-plate">{{ v.plateNo }}</span>
          </button>

          <!-- Vehicle Detail Popup (right-top corner of map) -->
          <div v-if="selectedVehicle" class="vehicle-popup">
            <div class="popup-header">
              <div class="popup-title-row">
                <h3 class="popup-plate">{{ selectedVehicle.plateNo }}</h3>
                <span class="popup-status-tag" :class="selectedVehicle.status">
                  {{ selectedVehicle.status }}
                </span>
                <span class="popup-type">{{ selectedVehicle.vehicleType }}</span>
                <span v-if="!selectedVehicle.isRunning" class="popup-not-running">未运作</span>
              </div>
              <button class="popup-close-btn" @click="selectedVehicle = null">
                <icon-close />
              </button>
            </div>

            <div class="popup-body">
              <dl class="popup-dl">
                <div class="popup-dl-item">
                  <dt>所属机构</dt>
                  <dd>{{ selectedVehicle.org }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>车架号/VIN</dt>
                  <dd class="font-mono">{{ selectedVehicle.vin }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>设备号</dt>
                  <dd class="font-mono">{{ selectedVehicle.deviceNo }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>详细车型</dt>
                  <dd>{{ selectedVehicle.vehicleModel }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>定位时间</dt>
                  <dd>{{ selectedVehicle.locationTime }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>当前所在地</dt>
                  <dd>{{ selectedVehicle.currentLocation }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>今日里程</dt>
                  <dd>{{ selectedVehicle.todayMileage }} km</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>电量</dt>
                  <dd>
                    <span class="battery-value">{{ selectedVehicle.battery }}%</span>
                  </dd>
                </div>
                <div v-if="selectedVehicle.waterLevel !== undefined" class="popup-dl-item">
                  <dt>水量</dt>
                  <dd>{{ selectedVehicle.waterLevel }} m³</dd>
                </div>

                <!-- Garbage Weight (only if vehicle has weighing equipment) -->
                <div v-if="selectedVehicle.hasScale" class="popup-dl-item">
                  <dt>重量</dt>
                  <dd>{{ selectedVehicle.garbageWeight }}</dd>
                </div>

                <!-- Driver Info -->
                <div class="popup-dl-item">
                  <dt>驾驶员</dt>
                  <dd>{{ selectedVehicle.driver }}</dd>
                </div>
                <div class="popup-dl-item">
                  <dt>联系方式</dt>
                  <dd class="phone-value">{{ selectedVehicle.driverPhone }}</dd>
                </div>
              </dl>
            </div>

            <div class="popup-actions">
              <a-button type="primary" @click="handleTrack">
                <template #icon><icon-location /></template>
                轨迹
              </a-button>
              <a-button @click="handleVideo">
                <template #icon><icon-video-camera /></template>
                视频
              </a-button>
              <a-button @click="handleDispatch">
                <template #icon><icon-send /></template>
                下发
              </a-button>
            </div>
          </div>
        </div>

        <!-- Map Status Filters -->
        <div class="map-status-filters">
          <button
            v-for="f in statusFilters"
            :key="f.key"
            class="status-filter-btn"
            :class="{ active: statusFilter === f.key }"
            @click="statusFilter = f.key"
          >
            {{ f.label }}
            <span v-if="f.key !== 'all'" class="filter-count">
              {{ vehicles.filter((v: VehicleItem) => v.status === f.label).length }}
            </span>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import LonganMapFrame from './components/LonganMapFrame.vue'

defineOptions({ name: 'SanitationLocationMonitorWeighing' })

// ==================== Types ====================

interface VehicleItem {
  id: string
  plateNo: string
  vehicleType: string
  vehicleTypeShort: string
  vehicleModel: string
  org: string
  vin: string
  deviceNo: string
  status: '在线' | '充电' | '离线'
  isRunning: boolean
  locationTime: string
  currentLocation: string
  todayMileage: number
  battery: number
  waterLevel?: number
  hasScale: boolean
  garbageWeight: string
  driver: string
  driverPhone: string
  mapX: number
  mapY: number
}

// ==================== Mock Data ====================

const vehicles: VehicleItem[] = [
  {
    id: 'V001', plateNo: '豫E03100D', vehicleType: '洒水车', vehicleTypeShort: '洒水车',
    vehicleModel: '18T纯电动清洗车（255.48度电）AXZ5180QGQXDFBEV',
    org: '安阳市龙安区环境卫生事务中心',
    vin: 'LEWUMCI86MF146435', deviceNo: '91725501',
    status: '在线', isRunning: true,
    locationTime: '2026-07-03 17:07:47',
    currentLocation: '河南省安阳市龙安区文明大道',
    todayMileage: 82, battery: 66,
    waterLevel: 8.5,
    hasScale: false, garbageWeight: '-',
    driver: '张红军', driverPhone: '13937210011',
    mapX: 42, mapY: 38,
  },
  {
    id: 'V002', plateNo: '豫E00115D', vehicleType: '洗扫车', vehicleTypeShort: '洗扫车',
    vehicleModel: '18T纯电动洗扫车（300.81度电）AXZ5180TXSDFBEV',
    org: '安阳市龙安区环境卫生事务中心',
    vin: 'LEWUMC1B1MF101786', deviceNo: '91725502',
    status: '在线', isRunning: true,
    locationTime: '2026-07-03 17:05:32',
    currentLocation: '河南省安阳市龙安区文昌大道',
    todayMileage: 68, battery: 45,
    waterLevel: 6.2,
    hasScale: true, garbageWeight: '2.4 吨',
    driver: '李师傅', driverPhone: '13900010022',
    mapX: 28, mapY: 52,
  },
  {
    id: 'V003', plateNo: '豫E01622D', vehicleType: '压缩车', vehicleTypeShort: '压缩车',
    vehicleModel: '18T纯电动压缩式垃圾车（281.91度电）AXZ5180ZYSDNBEV',
    org: '安阳市龙安区环境卫生事务中心',
    vin: 'LEWUMCI86MG146436', deviceNo: '91725503',
    status: '在线', isRunning: true,
    locationTime: '2026-07-03 17:08:15',
    currentLocation: '河南省安阳市龙安区中州路',
    todayMileage: 53, battery: 78,
    hasScale: true, garbageWeight: '5.8 吨',
    driver: '王师傅', driverPhone: '13900010023',
    mapX: 55, mapY: 48,
  },
  {
    id: 'V004', plateNo: '豫E7002D', vehicleType: '洗扫车', vehicleTypeShort: '洗扫车',
    vehicleModel: '18T纯电动洗扫车（300.81度电）AXZ5180TXSDFBEV',
    org: '安阳龙创环境科技有限公司',
    vin: 'LEWUMC1B1MF101785', deviceNo: '91725500',
    status: '离线', isRunning: false,
    locationTime: '2024-05-12 19:40:58',
    currentLocation: '河南省安阳市龙安区祥云街',
    todayMileage: 68.9, battery: 35,
    waterLevel: 8.5,
    hasScale: false, garbageWeight: '-',
    driver: '赵师傅', driverPhone: '13900010024',
    mapX: 60, mapY: 62,
  },
  {
    id: 'V005', plateNo: '豫E01128D', vehicleType: '压缩车', vehicleTypeShort: '压缩车',
    vehicleModel: '18T纯电动压缩式垃圾车（281.91度电）AXZ5180ZYSDNBEV',
    org: '安阳龙创环境科技有限公司',
    vin: 'LEWUMCI86MG146437', deviceNo: '91725504',
    status: '在线', isRunning: true,
    locationTime: '2026-07-03 17:06:50',
    currentLocation: '河南省安阳市龙安区安林路',
    todayMileage: 41, battery: 55,
    hasScale: true, garbageWeight: '3.6 吨',
    driver: '孙师傅', driverPhone: '13900010025',
    mapX: 18, mapY: 30,
  },
  {
    id: 'V006', plateNo: '豫E8372D', vehicleType: '洒水车', vehicleTypeShort: '洒水车',
    vehicleModel: '18T纯电动清洗车（255.48度电）AXZ5180QGQXDFBEV',
    org: '安阳龙创环境科技有限公司',
    vin: 'LEWUMCI86MG146438', deviceNo: '91725505',
    status: '充电', isRunning: false,
    locationTime: '2026-07-03 17:04:22',
    currentLocation: '河南省安阳市龙安区充电站',
    todayMileage: 35, battery: 82,
    waterLevel: 10.0,
    hasScale: false, garbageWeight: '-',
    driver: '陈师傅', driverPhone: '13900010026',
    mapX: 75, mapY: 25,
  },
  {
    id: 'V007', plateNo: '豫E8K270', vehicleType: '大勾臂车', vehicleTypeShort: '大勾臂车',
    vehicleModel: '25T纯电动勾臂式垃圾车（350度电）AXZ5250ZXXDFBEV',
    org: '安阳市龙安区环境卫生事务中心',
    vin: 'LEWUMCI86MG146439', deviceNo: '91725506',
    status: '充电', isRunning: false,
    locationTime: '2026-07-03 17:03:10',
    currentLocation: '河南省安阳市龙安区善应镇充电站',
    todayMileage: 62, battery: 90,
    hasScale: true, garbageWeight: '13.8 吨',
    driver: '郑伟', driverPhone: '13900010029',
    mapX: 35, mapY: 72,
  },
  {
    id: 'V008', plateNo: '豫E3G516', vehicleType: '小勾臂车', vehicleTypeShort: '小勾臂车',
    vehicleModel: '4.5T纯电动自装卸式垃圾车（66.84度电）AXZ5040ZZXDFBEV',
    org: '安阳市龙安区环境卫生事务中心',
    vin: 'LEWUMCI86MG146440', deviceNo: '91725507',
    status: '在线', isRunning: true,
    locationTime: '2026-07-03 17:02:45',
    currentLocation: '河南省安阳市龙安区龙泉镇',
    todayMileage: 86, battery: 32,
    hasScale: true, garbageWeight: '2.4 吨',
    driver: '蒋小军', driverPhone: '13900010033',
    mapX: 22, mapY: 65,
  },
]

// ==================== State ====================

const searchKeyword = ref('')
const orgFilter = ref('')
const statusFilter = ref('all')
const selectedVehicle = ref<VehicleItem | null>(null)
const expandedOrgs = reactive<Record<string, boolean>>({})

const orgList = computed(() => [...new Set(vehicles.map((v) => v.org))])

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '在线' },
  { key: 'charging', label: '充电' },
  { key: 'offline', label: '离线' },
]

// ==================== Computed ====================

const displayedVehicles = computed(() => {
  let list = vehicles
  if (statusFilter.value === 'online') list = list.filter((v) => v.status === '在线')
  else if (statusFilter.value === 'charging') list = list.filter((v) => v.status === '充电')
  else if (statusFilter.value === 'offline') list = list.filter((v) => v.status === '离线')
  return list
})

const filteredOrgGroups = computed(() => {
  const grouped: Record<string, VehicleItem[]> = {}
  vehicles.forEach((v) => {
    if (orgFilter.value && v.org !== orgFilter.value) return
    if (searchKeyword.value && !v.plateNo.includes(searchKeyword.value)) return
    if (!grouped[v.org]) grouped[v.org] = []
    grouped[v.org].push(v)
  })

  // Auto-expand orgs that have matching vehicles
  Object.keys(grouped).forEach((org) => {
    if (expandedOrgs[org] === undefined) {
      expandedOrgs[org] = true
    }
  })

  return Object.entries(grouped).map(([org, vehs]) => ({ org, vehicles: vehs }))
})

// ==================== Methods ====================

function toggleOrg(org: string) {
  expandedOrgs[org] = !expandedOrgs[org]
}

function selectVehicle(v: VehicleItem) {
  selectedVehicle.value = v
}

function handleTrack() {
  // Placeholder: 轨迹
  console.log('轨迹:', selectedVehicle.value?.plateNo)
}

function handleVideo() {
  // Placeholder: 视频
  console.log('视频:', selectedVehicle.value?.plateNo)
}

function handleDispatch() {
  // Placeholder: 下发
  console.log('下发:', selectedVehicle.value?.plateNo)
}
</script>

<style scoped lang="scss">
.location-monitor-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  min-height: 600px;
  padding: 0;
  overflow: hidden;
}

// ===== PRD Panel =====
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;
  flex-shrink: 0;

  :deep(.arco-collapse-item-header) {
    font-weight: 600;
    font-size: 14px;
  }
}

.prd-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.prd-section {
  width: 100%;
}

.prd-intro {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-2);
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  tr:nth-child(even) {
    background: var(--color-fill-1);
  }

  td {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    vertical-align: top;
    line-height: 1.6;
  }

  .prd-label {
    width: 100px;
    min-width: 100px;
    font-weight: 500;
    color: var(--color-text-2);
    white-space: nowrap;
    text-align: center;
  }

  th {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    background: var(--color-fill-2);
    font-weight: 600;
    text-align: left;
  }
}

// ===== Main Shell =====
.monitor-shell {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ===== Left Tree Panel =====
.left-tree-panel {
  width: 250px;
  min-width: 220px;
  background: var(--color-bg-2);
  border-right: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .panel-header {
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border-2);

    .panel-title {
      font-weight: 600;
      font-size: 14px;
    }
  }

  .tree-search {
    padding: 8px 10px;
  }

  .tree-body {
    flex: 1;
    overflow-y: auto;

    .tree-filter-row {
      padding: 0 10px 8px;
    }

    .org-select {
      width: 100%;
    }
  }
}

.org-groups {
  .org-group {
    border-bottom: 1px solid var(--color-border-1);
  }

  .org-group-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-2);
    background: var(--color-fill-1);

    &:hover {
      background: var(--color-fill-2);
    }

    .expand-icon {
      font-size: 12px;
      transition: transform 0.2s;
      color: var(--color-text-3);
    }

    &.expanded .expand-icon {
      transform: rotate(90deg);
    }

    .org-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .org-count {
      font-size: 11px;
      color: var(--color-text-3);
    }
  }
}

.vehicle-list {
  .vehicle-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px 7px 22px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid var(--color-border-1);
    transition: background 0.15s;

    &:hover {
      background: var(--color-fill-2);
    }

    &.active {
      background: rgba(var(--arcoblue-6), 0.1);
      border-left: 3px solid rgb(var(--arcoblue-6));
      padding-left: 19px;
    }

    .v-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;

      &.在线 { background: #00b42a; }
      &.充电 { background: #ff7d00; }
      &.离线 { background: #c9cdd4; }
    }

    .v-plate {
      flex: 1;
      font-weight: 500;
      color: var(--color-text-1);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .v-type {
      font-size: 11px;
      color: var(--color-text-3);
      flex-shrink: 0;
    }

    .v-scale-badge {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(22, 93, 255, 0.1);
      color: #165dff;
      flex-shrink: 0;
    }
  }
}

// ===== Center Map Panel =====
.map-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  .map-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .vehicle-marker {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10;
    transition: transform 0.15s;

    &:hover {
      transform: translate(-50%, -50%) scale(1.15);
      z-index: 20;
    }

    &.active {
      z-index: 20;
      transform: translate(-50%, -50%) scale(1.2);

      .marker-icon {
        filter: drop-shadow(0 0 6px rgba(22, 93, 255, 0.6));
      }
    }

    .marker-icon {
      font-size: 28px;
      line-height: 1;
      transition: filter 0.15s;
    }

    &.online .marker-icon {
      filter: drop-shadow(0 2px 3px rgba(0, 180, 42, 0.4));
    }

    &.charging .marker-icon {
      filter: drop-shadow(0 2px 3px rgba(255, 125, 0, 0.4));
    }

    &.offline .marker-icon {
      filter: grayscale(0.8) opacity(0.6);
    }

    .marker-plate {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      white-space: nowrap;
    }
  }
}

.map-status-filters {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-bg-2);
  border-top: 1px solid var(--color-border-2);
  flex-shrink: 0;

  .status-filter-btn {
    padding: 4px 12px;
    font-size: 12px;
    border: 1px solid var(--color-border-2);
    border-radius: 4px;
    background: var(--color-bg-2);
    color: var(--color-text-2);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: rgb(var(--arcoblue-6));
      color: rgb(var(--arcoblue-6));
    }

    &.active {
      background: rgb(var(--arcoblue-6));
      color: #fff;
      border-color: rgb(var(--arcoblue-6));
    }

    .filter-count {
      margin-left: 4px;
      font-size: 11px;
      opacity: 0.8;
    }
  }
}

// ===== Vehicle Popup (right-top corner of map) =====
.vehicle-popup {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 340px;
  max-height: calc(100% - 20px);
  background: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 50;
  animation: popup-in 0.2s ease;
}

@keyframes popup-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.popup-header {
  position: relative;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(22, 93, 255, 0.08), rgba(22, 93, 255, 0.02));
  border-bottom: 1px solid var(--color-border-2);

  .popup-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .popup-plate {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }

  .popup-status-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
    font-weight: 500;

    &.在线 {
      background: rgba(0, 180, 42, 0.1);
      color: #00b42a;
    }
    &.充电 {
      background: rgba(255, 125, 0, 0.1);
      color: #ff7d00;
    }
    &.离线 {
      background: rgba(201, 205, 212, 0.15);
      color: #86909c;
    }
  }

  .popup-type {
    font-size: 12px;
    color: var(--color-text-3);
  }

  .popup-not-running {
    font-size: 11px;
    color: #f53f3f;
  }

  .popup-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--color-fill-2);
      color: var(--color-text-1);
    }
  }
}

.popup-body {
  overflow-y: auto;
  padding: 12px 16px;
}

.popup-dl {
  margin: 0;

  .popup-dl-item {
    display: flex;
    padding: 7px 0;
    border-bottom: 1px solid var(--color-border-1);
    font-size: 13px;

    &:last-child {
      border-bottom: none;
    }

    dt {
      width: 80px;
      flex-shrink: 0;
      color: var(--color-text-3);
      font-weight: 400;
    }

    dd {
      flex: 1;
      margin: 0;
      color: var(--color-text-1);
      word-break: break-all;

      &.font-mono {
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: 12px;
      }
    }


  }

  .battery-value {
    font-weight: 600;
  }

  .phone-value {
    color: rgb(var(--arcoblue-6));
    font-weight: 500;
  }
}

.popup-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-2);

  .arco-btn {
    flex: 1;
  }
}
</style>

<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="车辆绑定设备"
      subtitle="为小勾臂车、大勾臂车绑定融涞整车称重设备；绑定确认后设备不可在本页面修改。"
      phase="V1.0"
      priority="P0"
      module="基础档案"
    />

    <div class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div v-for="section in prd" :key="section.title" class="prd-section">
              <h4 class="prd-section-title">{{ section.title }}</h4>
              <table class="prd-table">
                <tbody>
                  <tr v-for="item in section.items" :key="item.label">
                    <td class="prd-label">{{ item.label }}</td>
                    <td class="prd-value">{{ item.value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
    </div>

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" placeholder="搜索车牌号或整车称重设备" allow-clear class="search-input" />
          <a-select v-model="bindingFilter" class="filter-select">
            <a-option v-for="item in bindingFilters" :key="item" :value="item">{{ item }}</a-option>
          </a-select>
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-button type="outline" @click="refresh">
          <template #icon><icon-sync /></template>
          刷新
        </a-button>
      </div>

      <a-table
        row-key="id"
        :data="filteredRows"
        :columns="tableColumns"
        :pagination="{ pageSize: 20, showTotal: true, showJumper: true }"
        :scroll="{ x: 1120 }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'bindingStatus'" :value="record.bindingStatus" />
          <span v-else-if="column.dataIndex === 'weighDeviceNo'" :class="{ 'empty-text': !record.weighDeviceNo }">
            {{ record.weighDeviceNo || '未绑定' }}
          </span>
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-button v-if="!record.weighDeviceNo" type="primary" size="mini" @click="openBinding(record)">
            绑定设备
          </a-button>
          <a-tooltip v-else content="设备已绑定并锁定，如需更换请走设备运维审批流程">
            <a-button size="mini" disabled>已绑定，禁止修改</a-button>
          </a-tooltip>
        </template>
      </a-table>
    </div>

    <a-modal v-model:visible="bindingVisible" title="绑定整车称重设备" :ok-button-props="{ disabled: !selectedDeviceNo }" @ok="confirmBinding">
      <a-alert type="warning" :show-icon="true" class="binding-alert">
        确认绑定后，本页面不支持修改或解除该车辆的称重设备。
      </a-alert>
      <a-form :model="bindingForm" layout="vertical" class="binding-form">
        <a-form-item label="车辆">
          <a-input :model-value="selectedVehicle ? `${selectedVehicle.plateNo}（${selectedVehicle.vehicleType}）` : ''" disabled />
        </a-form-item>
        <a-form-item label="整车称重设备" required>
          <a-select v-model="selectedDeviceNo" placeholder="请选择启用且未绑定的整车称重设备" allow-search>
            <a-option v-for="device in availableDevices" :key="device.deviceNo" :value="device.deviceNo">
              {{ device.deviceNo }} · {{ device.manufacturer }}
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import StatusTag from './components/StatusTag.vue'
import { devices } from './data/pageConfigs'
import { vehicles } from './data/mock'

defineOptions({ name: 'SanitationVehicleDeviceBinding' })

type BindingVehicle = {
  id: string
  plateNo: string
  vehicleType: '小勾臂车' | '大勾臂车'
  town: string
  driver: string
  weighDeviceNo: string
  bindingStatus: '未绑定' | '已绑定'
}

const supplementalSmallHookVehicles: BindingVehicle[] = [
  ['CAR-BIND-008', '豫E6A112', '马投涧镇', '刘师傅'], ['CAR-BIND-009', '豫E5B236', '龙泉镇', '陈师傅'],
  ['CAR-BIND-010', '豫E9D518', '善应镇', '周师傅'], ['CAR-BIND-011', '豫E2F631', '马家乡', '冯师傅'],
  ['CAR-BIND-012', '豫E4H725', '东风乡', '何师傅'], ['CAR-BIND-013', '豫E7J846', '马投涧镇', '宋师傅'],
  ['CAR-BIND-014', '豫E8L159', '龙泉镇', '高师傅'], ['CAR-BIND-015', '豫E0M274', '善应镇', '罗师傅'],
  ['CAR-BIND-016', '豫E3N386', '马家乡', '邓师傅'], ['CAR-BIND-017', '豫E1Q497', '东风乡', '于师傅'],
  ['CAR-BIND-018', '豫E6R508', '马投涧镇', '许师傅'], ['CAR-BIND-019', '豫E4S619', '龙泉镇', '魏师傅'],
  ['CAR-BIND-020', '豫E9T720', '善应镇', '马师傅'],
].map(([id, plateNo, town, driver]) => ({ id, plateNo, town, driver, vehicleType: '小勾臂车', weighDeviceNo: '', bindingStatus: '未绑定' }))

const bindingVehicles = reactive<BindingVehicle[]>([
  ...vehicles
    .filter((vehicle) => vehicle.vehicleType === '小勾臂车' || vehicle.vehicleType === '大勾臂车')
    .map((vehicle) => ({
      id: vehicle.id,
      plateNo: vehicle.plateNo,
      vehicleType: vehicle.vehicleType as BindingVehicle['vehicleType'],
      town: vehicle.town,
      driver: vehicle.driver,
      weighDeviceNo: '',
      bindingStatus: '未绑定' as const,
    })),
  ...supplementalSmallHookVehicles,
])

const keyword = ref('')
const bindingFilter = ref('全部状态')
const bindingVisible = ref(false)
const selectedVehicle = ref<BindingVehicle | null>(null)
const selectedDeviceNo = ref('')
const bindingForm = reactive({})

const bindingFilters = ['全部状态', '未绑定', '已绑定']
const tableColumns = [
  { title: '车牌号', dataIndex: 'plateNo', width: 140 },
  { title: '整车称重设备', dataIndex: 'weighDeviceNo', width: 200 },
  { title: '绑定整车称重', dataIndex: 'bindingStatus', width: 130 },
  { title: '操作', slotName: 'action', width: 170, fixed: 'right' as const, align: 'center' as const },
]

const filteredRows = computed(() => bindingVehicles.filter((vehicle) => {
  const search = keyword.value.trim().toLowerCase()
  const matchesKeyword = !search || [vehicle.plateNo, vehicle.weighDeviceNo].some((value) => value.toLowerCase().includes(search))
  const matchesBinding = bindingFilter.value === '全部状态' || vehicle.bindingStatus === bindingFilter.value
  return matchesKeyword && matchesBinding
}))

const availableDevices = computed(() => {
  const boundDeviceNos = new Set(bindingVehicles.map((vehicle) => vehicle.weighDeviceNo).filter(Boolean))
  return devices.filter((device) => device.deviceType === '整车称重' && device.status === '启用' && !boundDeviceNos.has(device.deviceNo))
})

const prd = [
  {
    title: '🎯 功能范围',
    items: [
      { label: '展示对象', value: '仅展示当前机构的小勾臂车 20 台和大勾臂车 6 台，共 26 台；小三轮 540 台不展示、不参与绑定。' },
      { label: '设备来源', value: '仅可选择“设备档案”中类型为“整车称重”、状态为“启用”的融涞设备。' },
      { label: '列表字段', value: '展示车牌号、已绑定整车称重设备、绑定整车称重标记和操作。' },
      { label: '查询筛选', value: '支持按车牌号、整车称重设备模糊查询，并按绑定整车称重状态筛选。' },
    ],
  },
  {
    title: '🔒 绑定规则',
    items: [
      { label: '一车一设备', value: '每台车辆最多绑定 1 台整车称重设备。' },
      { label: '一设备一车', value: '已被绑定的整车称重设备不会出现在其他车辆的可选列表中。' },
      { label: '绑定锁定', value: '用户在弹窗确认绑定后，设备编号和操作按钮即锁定；本页面不可修改或解除绑定。' },
      { label: '阶段性方案', value: '当前仅允许一车配一台整车称重设备，用于满足现阶段车辆绑定使用；后续根据主站发展统一重构。车辆本身还会配置主动安全、单桶称重、360 等多款设备，届时将按设备类型提供“绑定整车称重”“绑定主动安全”“绑定单桶称重”“绑定 360”等独立绑定标记与能力。' },
      { label: '设备变更', value: '设备故障、换装等场景须由设备运维通过审批流程处理；后端应记录操作人、操作时间、原设备和新设备。' },
    ],
  },
  {
    title: '⚠️ 校验与权限',
    items: [
      { label: '提交校验', value: '提交时校验车辆未绑定、设备为启用状态且未被其他车辆占用；任一条件不满足则禁止绑定。' },
      { label: '机构隔离', value: '车辆和设备必须属于当前机构（租户），后端按 tenantId 校验。' },
      { label: '权限建议', value: '仅“设备管理员”可执行绑定；普通用户仅可查看。' },
      { label: '数据状态', value: '当前为前端 mock 交互；接入后端后应使用事务保证车辆与设备的一对一关系。' },
    ],
  },
]

function openBinding(vehicle: BindingVehicle) {
  selectedVehicle.value = vehicle
  selectedDeviceNo.value = ''
  bindingVisible.value = true
}

function confirmBinding() {
  if (!selectedVehicle.value || !selectedDeviceNo.value) return
  if (selectedVehicle.value.weighDeviceNo) {
    ArcoMessage.warning('该车辆已绑定设备，不能修改')
    return
  }
  if (!availableDevices.value.some((device) => device.deviceNo === selectedDeviceNo.value)) {
    ArcoMessage.warning('设备不可用或已被其他车辆绑定，请重新选择')
    return
  }
  selectedVehicle.value.weighDeviceNo = selectedDeviceNo.value
  selectedVehicle.value.bindingStatus = '已绑定'
  bindingVisible.value = false
  ArcoMessage.success(`已为 ${selectedVehicle.value.plateNo} 绑定 ${selectedDeviceNo.value}，该绑定已锁定`)
}

function reset() {
  keyword.value = ''
  bindingFilter.value = '全部状态'
}

function refresh() {
  ArcoMessage.success('列表已刷新')
}
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prd-panel,
.table-panel {
  padding: 16px 20px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.prd-body {
  display: grid;
  gap: 16px;
}

.prd-section-title {
  margin: 0 0 8px;
  color: var(--color-text-1);
  font-size: 14px;
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--color-text-2);
  font-size: 13px;

  td {
    padding: 9px 12px;
    border: 1px solid var(--color-neutral-3);
    line-height: 1.6;
  }
}

.prd-label {
  width: 140px;
  color: var(--color-text-1);
  background: var(--color-fill-2);
  font-weight: 500;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 130px;
}

.empty-text {
  color: var(--color-text-4);
}

.binding-alert {
  margin-bottom: 16px;
}

.binding-form {
  margin-top: 8px;
}
</style>

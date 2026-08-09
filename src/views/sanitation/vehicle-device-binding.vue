<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="车辆绑定设备"
      subtitle="按机构选择车辆并绑定整车称重设备；仅显示和操作当前需要新增的绑定数据。"
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
        <a-button type="primary" @click="openBinding">
          <template #icon><icon-plus /></template>
          新增绑定
        </a-button>
      </div>
      <a-table
        row-key="id"
        :data="bindingRecords"
        :columns="tableColumns"
        :pagination="{ pageSize: 20, showTotal: true, showJumper: true }"
        :scroll="{ x: 1120 }"
        stripe
      >
        <template #cell="{ column, record }">
          <a-tag v-if="column.dataIndex === 'bindingStatus'" color="green">{{ record.bindingStatus }}</a-tag>
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:visible="bindingVisible"
      title="新增车辆设备绑定"
      :footer="false"
      @cancel="resetForm"
    >
      <a-alert type="info" :show-icon="true" class="binding-alert">
        设备列表仅显示启用且未绑定的设备，暂不支持解绑，请谨慎操作。
      </a-alert>
      <a-form :model="bindingForm" layout="vertical" class="binding-form">
        <a-form-item label="所属公司" required>
          <a-select
            v-model="bindingForm.organization"
            placeholder="请输入公司名称进行搜索"
            allow-search
            allow-clear
            @change="handleOrganizationChange"
          >
            <a-option v-for="organization in organizations" :key="organization" :value="organization">
              {{ organization }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="车辆" required>
          <a-select
            v-model="bindingForm.vehicleId"
            placeholder="请先选择所属公司，再搜索车牌号"
            allow-search
            allow-clear
            :disabled="!bindingForm.organization"
            @change="handleVehicleChange"
          >
            <a-option v-for="vehicle in organizationVehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.plateNo }} · {{ vehicle.vehicleType }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="整车称重设备" required>
          <a-select
            v-model="bindingForm.deviceNo"
            placeholder="请选择启用且未绑定的整车称重设备"
            allow-search
            allow-clear
          >
            <a-option v-for="device in availableDevices" :key="device.deviceNo" :value="device.deviceNo">
              {{ device.deviceNo }} · {{ device.manufacturer }}
            </a-option>
          </a-select>
          <div v-if="!availableDevices.length" class="field-tip">当前没有可绑定的整车称重设备。</div>
        </a-form-item>
      </a-form>

      <a-descriptions v-if="selectedDevice" title="设备基本信息" :column="2" bordered size="small" class="device-info">
        <a-descriptions-item label="设备编号">{{ selectedDevice.deviceNo }}</a-descriptions-item>
        <a-descriptions-item label="设备名称">{{ selectedDevice.deviceName }}</a-descriptions-item>
        <a-descriptions-item label="设备类型">{{ selectedDevice.deviceType }}</a-descriptions-item>
        <a-descriptions-item label="设备厂家">{{ selectedDevice.manufacturer }}</a-descriptions-item>
        <a-descriptions-item label="SIM 卡号" :span="2">{{ selectedDevice.simCard }}</a-descriptions-item>
        <a-descriptions-item label="绑定状态" :span="2"><a-tag color="green">未绑定，可绑定</a-tag></a-descriptions-item>
      </a-descriptions>
      <div class="modal-footer">
        <a-button @click="closeBinding">取消</a-button>
        <a-popconfirm content="确认添加后，暂不支持修改或解除绑定，请谨慎操作。" @ok="confirmBinding">
          <a-button type="primary" :disabled="!canSubmit">确定</a-button>
        </a-popconfirm>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message as ArcoMessage } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import { devices } from './data/pageConfigs'
import { vehicles } from './data/mock'

defineOptions({ name: 'SanitationVehicleDeviceBinding' })

type BindingVehicle = {
  id: string
  plateNo: string
  vehicleType: '小勾臂车' | '大勾臂车'
  organization: string
}

type BindingRecord = BindingVehicle & {
  deviceNo: string
  bindingStatus: '已绑定'
  bindingTime: string
}

const supplementalVehicles: BindingVehicle[] = [
  ['CAR-BIND-008', '豫E6A112', '马投涧镇'], ['CAR-BIND-009', '豫E5B236', '龙泉镇'],
  ['CAR-BIND-010', '豫E9D518', '善应镇'], ['CAR-BIND-011', '豫E2F631', '马家乡'],
  ['CAR-BIND-012', '豫E4H725', '东风乡'], ['CAR-BIND-013', '豫E7J846', '马投涧镇'],
  ['CAR-BIND-014', '豫E8L159', '龙泉镇'], ['CAR-BIND-015', '豫E0M274', '善应镇'],
].map(([id, plateNo, town]) => ({ id, plateNo, organization: getCompanyName(town), vehicleType: '小勾臂车' }))

const bindingVehicles: BindingVehicle[] = [
  ...vehicles
    .filter((vehicle) => vehicle.vehicleType === '小勾臂车' || vehicle.vehicleType === '大勾臂车')
    .map((vehicle) => ({
      id: vehicle.id,
      plateNo: vehicle.plateNo,
      vehicleType: vehicle.vehicleType as BindingVehicle['vehicleType'],
      organization: getCompanyName(vehicle.town),
    })),
  ...supplementalVehicles,
]

const bindingVisible = ref(false)
const bindingForm = reactive({ organization: '', vehicleId: '', deviceNo: '' })
const bindingRecords = ref<BindingRecord[]>([
  { ...bindingVehicles.find((vehicle) => vehicle.id === 'CAR002')!, deviceNo: 'DEV-WV-RL-001', bindingStatus: '已绑定', bindingTime: '2026-07-18 09:20:15' },
  { ...bindingVehicles.find((vehicle) => vehicle.id === 'CAR003')!, deviceNo: 'DEV-WV-RL-002', bindingStatus: '已绑定', bindingTime: '2026-07-18 10:05:42' },
  { ...bindingVehicles.find((vehicle) => vehicle.id === 'CAR005')!, deviceNo: 'DEV-WV-RL-003', bindingStatus: '已绑定', bindingTime: '2026-07-19 14:36:08' },
  { ...bindingVehicles.find((vehicle) => vehicle.id === 'CAR008')!, deviceNo: 'DEV-WV-RL-004', bindingStatus: '已绑定', bindingTime: '2026-07-20 16:12:33' },
])

const organizations = computed(() => [...new Set(bindingVehicles.map((vehicle) => vehicle.organization))])
const boundVehicleIds = computed(() => new Set(bindingRecords.value.map((record) => record.id)))
const boundDeviceNos = computed(() => new Set(bindingRecords.value.map((record) => record.deviceNo)))
const organizationVehicles = computed(() => bindingVehicles.filter((vehicle) => (
  vehicle.organization === bindingForm.organization && !boundVehicleIds.value.has(vehicle.id)
)))
const availableDevices = computed(() => devices.filter((device) => (
  device.deviceType === '整车称重'
  && device.status === '启用'
  && !boundDeviceNos.value.has(device.deviceNo)
)))
const selectedDevice = computed(() => availableDevices.value.find((device) => device.deviceNo === bindingForm.deviceNo))
const selectedVehicle = computed(() => organizationVehicles.value.find((vehicle) => vehicle.id === bindingForm.vehicleId))
const canSubmit = computed(() => Boolean(bindingForm.organization && selectedVehicle.value && selectedDevice.value))
const tableColumns = [
  { title: '所属公司', dataIndex: 'organization', width: 220 },
  { title: '车牌号', dataIndex: 'plateNo', width: 140 },
  { title: '车辆类型', dataIndex: 'vehicleType', width: 140 },
  { title: '整车称重设备', dataIndex: 'deviceNo', width: 190 },
  { title: '绑定状态', dataIndex: 'bindingStatus', width: 120 },
  { title: '绑定时间', dataIndex: 'bindingTime', width: 190 },
]

const prd = [
  {
    title: '🎯 功能范围',
    items: [
      { label: '默认展示', value: '页面不直接列出车辆清单，仅展示已添加的绑定记录，避免未使用该模块的公司看到无关车辆数据。' },
      { label: '新增流程', value: '按“所属公司 → 该公司下车辆 → 整车称重设备”顺序选择，三个下拉框均支持搜索补全。' },
      { label: '设备来源', value: '仅显示设备档案中类型为“整车称重”、状态为“启用”且当前未绑定的设备。' },
    ],
  },
  {
    title: '🔒 绑定规则',
    items: [
      { label: '设备信息确认', value: '选中设备后展示设备编号、名称、类型、厂家、SIM 卡号与绑定状态，确认“未绑定，可绑定”后才可提交。' },
      { label: '一车一设备', value: '每台车辆最多绑定 1 台整车称重设备。' },
      { label: '一设备一车', value: '绑定成功后设备将立即从可选下拉中移除，不再允许重复绑定。' },
      { label: '提交校验', value: '提交前进行二次确认，并再次校验设备仍为启用且未绑定；接入后端后应以事务及唯一约束保证并发下的一对一关系。' },
    ],
  },
]

function openBinding() {
  resetForm()
  bindingVisible.value = true
}

function handleOrganizationChange() {
  bindingForm.vehicleId = ''
}

function handleVehicleChange() {
  // 保留设备选择；设备可跨机构调配，提交时由后端按租户与归属关系最终校验。
}

function confirmBinding() {
  if (!selectedVehicle.value || !selectedDevice.value) return
  if (boundDeviceNos.value.has(selectedDevice.value.deviceNo)) {
    ArcoMessage.warning('该设备已被其他车辆绑定，请重新选择')
    bindingForm.deviceNo = ''
    return
  }

  const vehicle = selectedVehicle.value
  const deviceNo = selectedDevice.value.deviceNo
  bindingRecords.value.unshift({
    ...vehicle,
    deviceNo,
    bindingStatus: '已绑定',
    bindingTime: new Date().toLocaleString('zh-CN', { hour12: false }),
  })
  bindingVisible.value = false
  resetForm()
  ArcoMessage.success(`添加成功：${vehicle.plateNo} 已绑定 ${deviceNo}`)
}

function resetForm() {
  bindingForm.organization = ''
  bindingForm.vehicleId = ''
  bindingForm.deviceNo = ''
}

function closeBinding() {
  bindingVisible.value = false
  resetForm()
}

function getCompanyName(town: string) {
  const companyByTown: Record<string, string> = {
    马投涧镇: '龙安区城乡环境服务有限公司',
    龙泉镇: '龙安区环卫清运有限公司',
    善应镇: '龙安区智慧环卫运营有限公司',
    马家乡: '龙安区市容环境管理有限公司',
    东风乡: '龙安区洁净城市服务有限公司',
  }
  return companyByTown[town] || '龙安区环境卫生服务有限公司'
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

.binding-alert {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.binding-form {
  margin-bottom: 20px;
}

.field-tip {
  margin-top: 6px;
  color: rgb(var(--warning-6));
  font-size: 12px;
}

.device-info {
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>

<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      title="整车称重参数设置"
      subtitle="维护不同勾臂车辆场景的整车称重基础参数，为称重结果识别和垃圾重量计算提供统一基准。"
      phase="V1.0"
      priority="P0"
      module="基础档案"
    >
      <template #extra>
        <a-button type="primary" @click="openAdd">
          <template #icon><icon-plus /></template>
          添加
        </a-button>
      </template>
    </ModuleHeader>

    <PrdPanel :sections="prd" />

    <div class="table-panel">
      <div class="toolbar">
        <a-space wrap>
          <a-input-search v-model="keyword" allow-clear placeholder="搜索机构名称或车辆场景" class="search-input" />
          <a-select v-model="sceneFilter" class="scene-filter">
            <a-option value="全部车辆场景">全部车辆场景</a-option>
            <a-option v-for="scene in vehicleScenes" :key="scene" :value="scene">{{ scene }}</a-option>
          </a-select>
          <a-button @click="resetFilter">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
      </div>

      <a-table
        row-key="id"
        :data="filteredRecords"
        :columns="columns"
        :pagination="{ pageSize: 20, showTotal: true, showJumper: true }"
        :scroll="{ x: 1380 }"
        stripe
      >
        <template #cell="{ column, record }">
          <a-tag v-if="column.dataIndex === 'vehicleScene'" :color="record.vehicleScene === '小勾臂车' ? 'arcoblue' : 'orange'">
            {{ record.vehicleScene }}
          </a-tag>
          <span v-else-if="column.dataIndex === 'driverWeightRange'">{{ record.driverWeightMin }} - {{ record.driverWeightMax }} kg</span>
          <span v-else-if="column.dataIndex === 'driverWeightDefault'">{{ record.driverWeightDefault }} kg</span>
          <span v-else-if="column.dataIndex === 'boxWeightRange'">{{ record.boxWeightMin }} - {{ record.boxWeightMax }} kg</span>
          <span v-else-if="column.dataIndex === 'boxWeightDefault'">{{ record.boxWeightDefault }} kg</span>
          <span v-else-if="column.dataIndex === 'wasteWeightRange'">{{ record.wasteWeightMin }} - {{ record.wasteWeightMax }} kg</span>
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-tooltip content="编辑">
              <a-link @click="openEdit(record)"><icon-edit /></a-link>
            </a-tooltip>
            <a-popconfirm content="删除后可重新添加该车辆场景，确定删除吗？" @ok="removeRecord(record)">
              <a-tooltip content="删除">
                <a-link status="danger"><icon-delete /></a-link>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑整车称重参数设置' : '添加整车称重参数设置'"
      :width="640"
      @before-ok="saveRecord"
      @cancel="resetForm"
    >
      <a-alert type="info" :show-icon="true" class="form-alert">
        每种车辆场景仅允许保留一条参数记录；已有场景可编辑，不可重复添加。
      </a-alert>
      <a-form :model="form" layout="vertical">
        <a-form-item label="机构" required>
          <a-select v-model="form.organization" placeholder="请选择机构" allow-search>
            <a-option v-for="organization in organizations" :key="organization" :value="organization">{{ organization }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="车辆场景" required>
          <a-select v-model="form.vehicleScene" placeholder="请选择车辆场景">
            <a-option v-for="scene in vehicleScenes" :key="scene" :value="scene" :disabled="isSceneUsedByAnotherRecord(scene)">
              {{ scene }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="司机重量（kg）" required>
          <div class="weight-config-section">
            <div class="weight-config-grid">
              <div class="weight-field">
                <span class="weight-field-label">下限</span>
                <a-input-number v-model="form.driverWeightMin" :min="50" :max="100" :precision="0" placeholder="请输入" />
              </div>
              <span class="range-separator">至</span>
              <div class="weight-field">
                <span class="weight-field-label">上限</span>
                <a-input-number v-model="form.driverWeightMax" :min="50" :max="100" :precision="0" placeholder="请输入" />
              </div>
              <div class="weight-field">
                <span class="weight-field-label">默认值</span>
                <a-input-number v-model="form.driverWeightDefault" :min="50" :max="100" :precision="0" placeholder="请输入" />
              </div>
            </div>
            <div class="field-tip">允许范围：50 - 100 kg；默认值须落在设置范围内。</div>
          </div>
        </a-form-item>
        <a-form-item label="箱体重量（kg）" required>
          <div class="weight-config-section">
            <div class="weight-config-grid">
              <div class="weight-field">
                <span class="weight-field-label">下限</span>
                <a-input-number v-model="form.boxWeightMin" :min="400" :max="750" :precision="0" placeholder="请输入" />
              </div>
              <span class="range-separator">至</span>
              <div class="weight-field">
                <span class="weight-field-label">上限</span>
                <a-input-number v-model="form.boxWeightMax" :min="400" :max="750" :precision="0" placeholder="请输入" />
              </div>
              <div class="weight-field">
                <span class="weight-field-label">默认值</span>
                <a-input-number v-model="form.boxWeightDefault" :min="400" :max="750" :precision="0" placeholder="请输入" />
              </div>
            </div>
            <div class="field-tip">允许范围：400 - 750 kg；默认值须落在设置范围内。</div>
          </div>
        </a-form-item>
        <a-form-item label="垃圾重量范围（kg）" required>
          <div class="weight-config-section">
            <div class="waste-config-grid">
              <div class="weight-field">
                <span class="weight-field-label">下限</span>
                <a-input-number v-model="form.wasteWeightMin" :min="200" :max="800" :precision="0" placeholder="请输入" />
              </div>
              <span class="range-separator">至</span>
              <div class="weight-field">
                <span class="weight-field-label">上限</span>
                <a-input-number v-model="form.wasteWeightMax" :min="200" :max="800" :precision="0" placeholder="请输入" />
              </div>
            </div>
            <div class="field-tip">允许范围：200 - 800 kg。</div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import ModuleHeader from './components/ModuleHeader.vue'
import PrdPanel from './components/PrdPanel.vue'
import type { PrdSection } from './data/pageConfigs'
import { vehicles } from './data/mock'

defineOptions({ name: 'SanitationVehicleWeighing' })

type VehicleScene = '小勾臂车' | '大勾臂车'
type WeighingRecord = {
  id: string
  organization: string
  vehicleScene: VehicleScene
  driverWeightMin: number
  driverWeightMax: number
  driverWeightDefault: number
  boxWeightMin: number
  boxWeightMax: number
  boxWeightDefault: number
  wasteWeightMin: number
  wasteWeightMax: number
  updateTime: string
}

const organizations = [
  '河南龙淼钧泽环卫有限公司',
  '龙安区城乡环境服务有限公司',
  '龙安区环卫清运有限公司',
  '龙安区智慧环卫运营有限公司',
  '龙安区市容环境管理有限公司',
  '龙安区洁净城市服务有限公司',
]
// 与「车辆绑定设备」页一致：仅使用可绑定整车称重设备的勾臂车辆类型。
const vehicleScenes = [...new Set(vehicles
  .filter((vehicle) => vehicle.vehicleType === '小勾臂车' || vehicle.vehicleType === '大勾臂车')
  .map((vehicle) => vehicle.vehicleType))] as VehicleScene[]
const records = ref<WeighingRecord[]>([
  {
    id: 'VW001', organization: '龙安区城乡环境服务有限公司', vehicleScene: '小勾臂车',
    driverWeightMin: 50, driverWeightMax: 100, driverWeightDefault: 75,
    boxWeightMin: 400, boxWeightMax: 750, boxWeightDefault: 700,
    wasteWeightMin: 200, wasteWeightMax: 800, updateTime: '2026-09-08 09:30:00',
  },
  {
    id: 'VW002', organization: '龙安区环卫清运有限公司', vehicleScene: '大勾臂车',
    driverWeightMin: 50, driverWeightMax: 100, driverWeightDefault: 75,
    boxWeightMin: 400, boxWeightMax: 750, boxWeightDefault: 700,
    wasteWeightMin: 200, wasteWeightMax: 800, updateTime: '2026-09-08 09:35:00',
  },
])

const keyword = ref('')
const sceneFilter = ref('全部车辆场景')
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<Omit<WeighingRecord, 'id' | 'updateTime'>>({
  organization: '河南龙淼钧泽环卫有限公司', vehicleScene: '小勾臂车',
  driverWeightMin: 50, driverWeightMax: 100, driverWeightDefault: 75,
  boxWeightMin: 400, boxWeightMax: 750, boxWeightDefault: 700,
  wasteWeightMin: 200, wasteWeightMax: 800,
})

const columns = [
  { title: '机构', dataIndex: 'organization', width: 280 },
  { title: '车辆场景', dataIndex: 'vehicleScene', width: 150 },
  { title: '司机重量范围', dataIndex: 'driverWeightRange', width: 150 },
  { title: '司机默认重量', dataIndex: 'driverWeightDefault', width: 140 },
  { title: '箱体重量范围', dataIndex: 'boxWeightRange', width: 150 },
  { title: '箱体默认重量', dataIndex: 'boxWeightDefault', width: 140 },
  { title: '垃圾重量范围', dataIndex: 'wasteWeightRange', width: 190 },
  { title: '最近修改时间', dataIndex: 'updateTime', width: 190 },
  { title: '操作', slotName: 'action', width: 120, fixed: 'right' },
]

const filteredRecords = computed(() => records.value.filter((record) => {
  const matchesKeyword = !keyword.value || `${record.organization}${record.vehicleScene}`.includes(keyword.value.trim())
  const matchesScene = sceneFilter.value === '全部车辆场景' || record.vehicleScene === sceneFilter.value
  return matchesKeyword && matchesScene
}))

const prd: PrdSection[] = [
  {
    title: '🎯 功能范围',
    items: [
      { label: '列表展示', value: '展示机构、车辆场景、司机重量范围及默认值、箱体重量范围及默认值、垃圾重量范围和最近修改时间；默认提供小勾臂车、大勾臂车各一条模拟数据。' },
      { label: '添加 / 编辑', value: '添加或编辑时选择机构、车辆场景，并维护司机重量和箱体重量的下限、上限、默认值，以及垃圾重量上下限。' },
      { label: '查询', value: '支持按机构名称或车辆场景关键字搜索，并可按车辆场景筛选。' },
    ],
  },
  {
    title: '🔑 字段及校验规则',
    items: [
      { label: '机构', value: '必选，选项来自当前租户可管理的机构列表；新增默认“河南龙淼钧泽环卫有限公司”。' },
      { label: '车辆场景', value: '必选，选项同步车辆绑定设备中的可绑定车辆类型（小勾臂车、大勾臂车）；同一场景全局只能存在一条记录。' },
      { label: '司机重量', value: '设置下限、上限、默认值三个整数；均须在 50 - 100 kg 内，且下限 ≤ 默认值 ≤ 上限。新增默认 50 - 100 kg，默认值 75 kg。' },
      { label: '箱体重量', value: '设置下限、上限、默认值三个整数；均须在 400 - 750 kg 内，且下限 ≤ 默认值 ≤ 上限。新增默认 400 - 750 kg，默认值 700 kg。' },
      { label: '垃圾重量范围', value: '必填上下限，均须在 200 - 800 kg 内，且下限不得大于上限。' },
    ],
  },
  {
    title: '⚠️ 业务约束',
    items: [
      { label: '场景唯一性', value: '新增和编辑保存时均校验车辆场景唯一性；若已存在相同场景，提示“该车辆场景已配置，请直接编辑”。后端需以车辆场景唯一索引兜底。' },
      { label: '参数生效', value: '保存成功后，新参数用于后续整车称重的垃圾重量识别；历史称重记录保留当时使用的参数快照，不因后续修改而回算。' },
      { label: '权限与审计', value: '生产环境中管理员可新增、编辑、删除，普通用户只读；保存和删除应记录操作人、时间及修改前后值。' },
    ],
  },
]

function resetFilter() {
  keyword.value = ''
  sceneFilter.value = '全部车辆场景'
}

function resetForm() {
  form.organization = '河南龙淼钧泽环卫有限公司'
  form.vehicleScene = '小勾臂车'
  form.driverWeightMin = 50
  form.driverWeightMax = 100
  form.driverWeightDefault = 75
  form.boxWeightMin = 400
  form.boxWeightMax = 750
  form.boxWeightDefault = 700
  form.wasteWeightMin = 200
  form.wasteWeightMax = 800
  editingId.value = null
}

function openAdd() {
  isEdit.value = false
  resetForm()
  modalVisible.value = true
}

function openEdit(record: WeighingRecord) {
  isEdit.value = true
  editingId.value = record.id
  Object.assign(form, {
    organization: record.organization,
    vehicleScene: record.vehicleScene,
    driverWeightMin: record.driverWeightMin,
    driverWeightMax: record.driverWeightMax,
    driverWeightDefault: record.driverWeightDefault,
    boxWeightMin: record.boxWeightMin,
    boxWeightMax: record.boxWeightMax,
    boxWeightDefault: record.boxWeightDefault,
    wasteWeightMin: record.wasteWeightMin,
    wasteWeightMax: record.wasteWeightMax,
  })
  modalVisible.value = true
}

function isSceneUsedByAnotherRecord(scene: VehicleScene) {
  return records.value.some((record) => record.vehicleScene === scene && record.id !== editingId.value)
}

function validateForm() {
  if (!form.organization) return '请选择机构'
  if (!form.vehicleScene) return '请选择车辆场景'
  if (isSceneUsedByAnotherRecord(form.vehicleScene)) return '该车辆场景已配置，请直接编辑'
  if (!isRangeWithDefaultValid(form.driverWeightMin, form.driverWeightMax, form.driverWeightDefault, 50, 100)) return '司机重量的下限、上限、默认值须在 50 - 100 kg 内，且默认值须落在设置范围内'
  if (!isRangeWithDefaultValid(form.boxWeightMin, form.boxWeightMax, form.boxWeightDefault, 400, 750)) return '箱体重量的下限、上限、默认值须在 400 - 750 kg 内，且默认值须落在设置范围内'
  if (!Number.isInteger(form.wasteWeightMin) || !Number.isInteger(form.wasteWeightMax) || form.wasteWeightMin < 200 || form.wasteWeightMin > 800 || form.wasteWeightMax < 200 || form.wasteWeightMax > 800 || form.wasteWeightMin > form.wasteWeightMax) {
    return '垃圾重量范围须在 200 - 800 kg 内，且下限不得大于上限'
  }
  return ''
}

function isRangeWithDefaultValid(min: number, max: number, defaultValue: number, allowedMin: number, allowedMax: number) {
  return [min, max, defaultValue].every(Number.isInteger)
    && min >= allowedMin
    && max <= allowedMax
    && min <= defaultValue
    && defaultValue <= max
}

function saveRecord(done: (closed: boolean) => void) {
  const error = validateForm()
  if (error) {
    Message.warning(error)
    done(false)
    return
  }

  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  if (isEdit.value && editingId.value) {
    const index = records.value.findIndex((record) => record.id === editingId.value)
    if (index >= 0) records.value[index] = { ...records.value[index], ...form, updateTime: now }
    Message.success('整车称重参数已更新')
  } else {
    records.value.unshift({ id: `VW${String(records.value.length + 1).padStart(3, '0')}`, ...form, updateTime: now })
    Message.success('整车称重参数已添加')
  }
  resetForm()
  done(true)
}

function removeRecord(record: WeighingRecord) {
  records.value = records.value.filter((item) => item.id !== record.id)
  Message.success(`已删除${record.vehicleScene}称重参数`)
}
</script>

<style scoped lang="scss">
.sanitation-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.table-panel {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.search-input {
  width: 260px;
}

.scene-filter {
  width: 150px;
}

.form-alert {
  margin-bottom: 16px;
}

.field-tip {
  width: 100%;
  margin-top: 10px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 18px;
}

.range-separator {
  color: var(--color-text-2);
  white-space: nowrap;
}

.weight-config-section {
  width: 100%;
}

.weight-config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: end;
}

.waste-config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
  gap: 12px;
  align-items: end;
  max-width: 420px;
}

.weight-field {
  min-width: 0;
}

.weight-field-label {
  display: block;
  margin-bottom: 6px;
  color: var(--color-text-3);
  font-size: 12px;
}

.weight-field :deep(.arco-input-number) {
  width: 100%;
}
</style>

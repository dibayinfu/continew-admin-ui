<template>
  <div class="gi_page sanitation-page">
    <ModuleHeader
      :title="config.title"
      :subtitle="config.subtitle"
      :phase="config.phase"
      :priority="config.priority"
      :module="config.module"
    >
      <template #extra>
        <a-button v-if="props.pageKey !== 'taskOrderStats'" type="primary" @click="handleAdd">
          <template #icon><icon-plus /></template>
          新增
        </a-button>
      </template>
    </ModuleHeader>

    <MetricGrid :metrics="pageKey === 'taskOrderStats' ? taskMetrics : config.metrics" />

    <!-- 产品需求说明（折叠面板） -->
    <div v-if="config.prd?.length" class="prd-panel">
      <a-collapse :default-active-key="[]" :bordered="false">
        <a-collapse-item key="prd" header="📋 产品需求说明">
          <div class="prd-body">
            <div v-for="section in config.prd" :key="section.title" class="prd-section">
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
          <a-input-search v-model="keyword" :placeholder="config.searchPlaceholder" allow-clear class="search-input" />
          <a-date-picker
            v-if="props.pageKey === 'taskOrderStats'"
            v-model="startDate"
            placeholder="开始日期"
            style="width: 130px;"
          />
          <a-date-picker
            v-if="props.pageKey === 'taskOrderStats'"
            v-model="endDate"
            placeholder="结束日期"
            style="width: 130px;"
          />
          <template v-for="mf in config.multiFilters || []" :key="mf.key">
            <span class="filter-label">{{ mf.key === 'collectionStatus' ? '收运状态' : mf.key === 'overtimeStatus' ? '超时状态' : mf.key === 'overflowStatus' ? '满溢状态' : mf.key === 'batteryStatus' ? '电量状态' : mf.key === 'archiveStatus' ? '启用状态' : mf.key }}</span>
            <a-select v-model="filterStates[mf.key]" class="filter-select">
              <a-option v-for="opt in mf.options" :key="opt" :value="opt">{{ opt }}</a-option>
            </a-select>
          </template>
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </a-space>
        <a-space>
          <a-button type="outline">
            <template #icon><icon-sync /></template>
            刷新
          </a-button>
        </a-space>
      </div>

      <a-table
        row-key="id"
        :data="filteredRows"
        :columns="columns"
        :pagination="{ pageSize: 20, showTotal: true, showJumper: true }"
        :scroll="{ x: scrollX }"
        stripe
      >
        <template #cell="{ column, record }">
          <StatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'level' || column.dataIndex === 'archiveStatus' || column.dataIndex === 'collectionStatus' || column.dataIndex === 'overtimeStatus'" :value="record[column.dataIndex]" />
          <span v-else-if="column.dataIndex === 'locationName'" class="location-cell">
            <span v-if="!record.locationName && !record.locationMatches?.length" class="empty-text">-</span>
            <template v-else-if="record.locationMatches?.length">
              <span v-for="m in record.locationMatches" :key="m.type + m.name" class="location-match-tag" :style="getLocationTagStyle(m.type)">{{ m.name }}</span>
            </template>
            <span v-else class="location-match-tag" :style="getLocationTagStyle(record.locationType)">
              {{ record.locationName }}
            </span>
          </span>
          <span v-else-if="column.dataIndex === 'fillRate'" :style="getFillRateStyle(record.fillRate)">
            {{ record.fillRate ?? '-' }}
          </span>
          <span v-else-if="column.dataIndex === 'temperatureStatus'" class="status-cell">
            <span class="small-box-status-tag" :style="getTemperatureStatusStyle(record.temperatureStatus)">
              {{ record.temperatureStatus || '-' }}
            </span>
          </span>
          <span v-else-if="column.dataIndex === 'batteryStatus'" class="status-cell">
            <span class="small-box-status-tag" :style="getBatteryStatusStyle(record.batteryStatus)">
              {{ record.batteryStatus || '-' }}
            </span>
          </span>
          <span v-else-if="column.dataIndex === 'overflowStatus'" class="status-cell">
            <span class="small-box-status-tag" :style="getOverflowStatusStyle(record.overflowStatus)">
              {{ record.overflowStatus || '-' }}
            </span>
          </span>
          <span v-else-if="column.dataIndex === 'onlineStatus'" class="status-cell">
            <span class="small-box-status-tag" :style="getOnlineStatusStyle(record.onlineStatus)">
              {{ record.onlineStatus || '-' }}
            </span>
          </span>
          <span v-else>{{ record[column.dataIndex] ?? '-' }}</span>
        </template>
        <template #action="{ record }">
          <a-space>
            <a-tooltip content="查看详情">
              <a-link @click="showDetail(record)"><icon-eye /></a-link>
            </a-tooltip>
            <a-tooltip v-if="!['smallBoxState', 'bigBoxState', 'taskOrderStats'].includes(props.pageKey)" content="编辑">
              <a-link @click="handleEdit(record)"><icon-edit /></a-link>
            </a-tooltip>
            <a-tooltip v-if="props.pageKey === 'smallBoxState'" content="远程开锁">
              <a-link @click="handleRemoteOpen(record)"><icon-unlock /></a-link>
            </a-tooltip>
            <a-popconfirm v-if="!['smallBoxState', 'bigBoxState', 'taskOrderStats'].includes(props.pageKey)" content="确定要删除该记录吗？" @ok="handleDelete(record)">
              <a-tooltip content="删除">
                <a-link status="danger"><icon-delete /></a-link>
              </a-tooltip>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="drawerVisible" :title="drawerTitle" :width="480" unmount-on-close>
      <a-descriptions :column="1" bordered size="large">
        <a-descriptions-item v-for="item in drawerItems" :key="item.label" :label="item.label">
          {{ item.value }}
        </a-descriptions-item>
      </a-descriptions>
    </a-drawer>

    <!-- 任务单详情抽屉（含地图轨迹，仅全部任务单使用） -->
    <a-drawer v-model:visible="taskDrawerVisible" title="全部任务单详情" :width="520" unmount-on-close>
      <template v-if="detailTask">
        <div class="task-detail-section">
          <div class="section-title">收运轨迹</div>
          <div class="route-map">
            <svg viewBox="0 0 100 80" preserveAspectRatio="none">
              <polyline :points="detailTask.track.map((item: any) => `${item.x},${item.y}`).join(' ')" fill="none" stroke="rgba(22, 93, 255, 0.28)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div v-for="point in detailTask.track" :key="point.label" class="map-point" :class="{ done: point.done }" :style="{ left: `${point.x}%`, top: `${point.y}%` }">
              <span></span>
              <b>{{ point.label }}</b>
            </div>
          </div>
          <div class="map-weight" v-if="detailTask.weight">⚖️ 称重：<b>{{ detailTask.weight }}t</b></div>
        </div>
        <a-divider />
        <div class="task-detail-section">
          <div class="section-title">任务信息</div>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="任务单号">{{ detailTask.id }}</a-descriptions-item>
            <a-descriptions-item label="任务名称">{{ detailTask.taskName }}</a-descriptions-item>
            <a-descriptions-item label="箱体名称">{{ detailTask.boxName }}</a-descriptions-item>
            <a-descriptions-item label="箱体编号">{{ detailTask.boxNo }}</a-descriptions-item>
            <a-descriptions-item label="箱体类型">{{ detailTask.boxType }}</a-descriptions-item>
            <a-descriptions-item label="所属乡镇">{{ detailTask.town }}</a-descriptions-item>
            <a-descriptions-item label="起点地址">{{ detailTask.startAddress }}</a-descriptions-item>
            <a-descriptions-item label="目的地">{{ detailTask.destinationName }}</a-descriptions-item>
            <a-descriptions-item label="目的地地址">{{ detailTask.destinationAddress }}</a-descriptions-item>
            <a-descriptions-item label="驾驶员">{{ detailTask.driver }}</a-descriptions-item>
            <a-descriptions-item label="联系电话">{{ detailTask.driverPhone }}</a-descriptions-item>
            <a-descriptions-item label="车辆">{{ detailTask.vehicle }}（{{ detailTask.vehicleType }}）</a-descriptions-item>
            <a-descriptions-item label="优先级">{{ detailTask.priority }}</a-descriptions-item>
            <a-descriptions-item label="时效要求">{{ detailTask.slaMinutes }} 分钟</a-descriptions-item>
            <a-descriptions-item label="收运状态"><StatusTag :value="detailTask.collectionStatus" /></a-descriptions-item>
            <a-descriptions-item label="超时状态"><StatusTag :value="detailTask.overtimeStatus" /></a-descriptions-item>
            <a-descriptions-item label="实际耗时">{{ detailTask.durationText }}</a-descriptions-item>
            <a-descriptions-item label="称重">{{ detailTask.weight || '-' }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ detailTask.createTime }}</a-descriptions-item>
            <a-descriptions-item label="接单时间">{{ detailTask.acceptTime || '-' }}</a-descriptions-item>
            <a-descriptions-item label="开始时间">{{ detailTask.startTime || '-' }}</a-descriptions-item>
            <a-descriptions-item label="完成时间">{{ detailTask.finishTime || '-' }}</a-descriptions-item>
          </a-descriptions>
        </div>
      </template>
      <div v-else style="padding: 40px; text-align: center; color: var(--color-text-3);">未找到任务单详情</div>
    </a-drawer>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑 - ' + config.title : '新增 - ' + config.title"
      :width="640"
      unmount-on-close
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :rules="formRules" auto-label-width>
        <a-row :gutter="16">
          <a-col v-for="field in formFields" :key="field.key" :span="field.span || 12">
            <a-form-item :field="field.key" :label="field.label" :rules="field.rules">
              <a-input
                v-if="field.type === 'input'"
                v-model="formData[field.key]"
                :placeholder="'请输入' + field.label"
                :disabled="field.readonly"
              />
              <a-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.key]"
                :placeholder="'请选择' + field.label"
                :options="field.options"
              />
              <a-input-number
                v-else-if="field.type === 'number'"
                v-model="formData[field.key]"
                :placeholder="'请输入' + field.label"
                :min="field.min"
                :max="field.max"
                :step="field.step ?? 1"
                :precision="field.step ? 1 : 0"
                :disabled="field.readonly"
              />
              <a-textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.key]"
                :placeholder="'请输入' + field.label"
              />
              <a-space v-else-if="field.type === 'mapCoord'" align="center" style="width: 100%">
                <a-input
                  :model-value="formData.longitude != null ? formData.longitude : ''"
                  placeholder="经度"
                  readonly
                  style="width: 140px"
                >
                  <template #prefix>经度</template>
                </a-input>
                <a-input
                  :model-value="formData.latitude != null ? formData.latitude : ''"
                  placeholder="纬度"
                  readonly
                  style="width: 140px"
                >
                  <template #prefix>纬度</template>
                </a-input>
                <a-button @click="openMapPicker()">
                  <template #icon><icon-location /></template>
                  地图选点
                </a-button>
              </a-space>
              <a-space v-else-if="field.type === 'areaCascade'" align="center" style="width: 100%">
                <a-select
                  v-if="field.key === 'province'"
                  v-model="formData.province"
                  :options="provinceOptions"
                  placeholder="请选择省份"
                  allow-clear
                  style="width: 150px"
                  @change="onProvinceChange"
                />
                <a-select
                  v-if="field.key === 'city'"
                  v-model="formData.city"
                  :options="cityOptions"
                  placeholder="请选择城市"
                  allow-clear
                  style="width: 150px"
                  :disabled="!formData.province"
                  @change="onCityChange"
                />
                <a-select
                  v-if="field.key === 'area'"
                  v-model="formData.area"
                  :options="areaOptions"
                  placeholder="请选择区/县"
                  allow-clear
                  style="width: 150px"
                  :disabled="!formData.city"
                  @change="onAreaChange"
                />
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 地图选点弹窗 -->
    <MapPicker
      v-model:visible="mapPickerVisible"
      :longitude="mapPickerLng"
      :latitude="mapPickerLat"
      @confirm="onMapPickConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumnData } from '@arco-design/web-vue'
import { Modal } from '@arco-design/web-vue'
import { computed, h, ref, watch } from 'vue'
import ModuleHeader from './ModuleHeader.vue'
import MetricGrid from './MetricGrid.vue'
import StatusTag from './StatusTag.vue'
import MapPicker from './MapPicker.vue'
import type { PrototypePageConfig } from '../data/pageConfigs'
import { pageConfigs, peopleRows, smallBoxStatusConfig } from '../data/pageConfigs'
import { collectionTasks } from '../data/alert-task'
// 直接引入省市数据，不走后端 API
import areaData from '@/mock/_data/area'
import type { MockAreaItem } from '@/mock/_data/_type'

interface FormField {
  key: string
  label: string
  type: 'input' | 'select' | 'number' | 'textarea' | 'mapCoord' | 'areaCascade'
  options?: string[]
  span?: number
  min?: number
  max?: number
  step?: number
  readonly?: boolean
  rules?: Array<{ required?: boolean; message?: string }>
}

// 省市区级联数据
const provinceOptions = ref<Array<{ label: string; value: string }>>([])
const cityOptions = ref<Array<{ label: string; value: string }>>([])
const areaOptions = ref<Array<{ label: string; value: string }>>([])

// 加载省份列表（从本地区域数据）
function loadProvinces() {
  provinceOptions.value = areaData.map((p) => ({ label: p.label, value: p.label }))
}

// 省份变动 → 加载城市
function onProvinceChange(_val: any) {
  formData.value.city = ''
  formData.value.area = ''
  cityOptions.value = []
  areaOptions.value = []
  if (!formData.value.province) return
  const province = areaData.find((p) => p.label === formData.value.province)
  if (province?.children) {
    cityOptions.value = province.children.map((c) => ({ label: c.label, value: c.label }))
  }
}

// 城市变动 → 加载区/县
function onCityChange(_val: any) {
  formData.value.area = ''
  areaOptions.value = []
  if (!formData.value.province || !formData.value.city) return
  const province = areaData.find((p) => p.label === formData.value.province)
  const city = province?.children?.find((c) => c.label === formData.value.city)
  if (city?.children) {
    areaOptions.value = city.children.map((a) => ({ label: a.label, value: a.label }))
  }
}

// 区/县变动 → 自动生成乡镇名称
function onAreaChange(_val: any) {
  if (formData.value.province && formData.value.city && formData.value.area && !formData.value.name) {
    formData.value.name = `${formData.value.province}${formData.value.city}${formData.value.area}`
  }
}

const props = defineProps<{
  pageKey: string
}>()

const detailTask = computed(() => {
  if (props.pageKey !== 'taskOrderStats') return null
  return collectionTasks.find((t) => t.id === selectedRecord.value.id) || null
})

const config = computed<PrototypePageConfig>(() => pageConfigs[props.pageKey] || pageConfigs.townArchive).value
const keyword = ref('')
const startDate = ref<string | undefined>()
const endDate = ref<string | undefined>()
// 多筛选条件状态
const filterStates = ref<Record<string, string>>({})
config.multiFilters?.forEach((mf) => {
  filterStates.value[mf.key] = mf.options[0]
})
const drawerVisible = ref(false)
const taskDrawerVisible = ref(false)
const drawerTitle = ref('详情')
const selectedRecord = ref<Record<string, any>>({})
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<Record<string, any>>({})

const taskMetrics = computed(() => {
  const rows = filteredRows.value
  const total = rows.length
  const pending = rows.filter((t: any) => t.collectionStatus === '待接单').length
  const inProgress = rows.filter((t: any) => t.collectionStatus === '收运中' || t.collectionStatus === '已接单').length
  const done = rows.filter((t: any) => t.collectionStatus === '已完成').length
  const weight = rows
    .filter((t: any) => t.collectionStatus === '已完成' && t.boxType === '小勾臂箱' && t.weight && t.weight !== '-')
    .reduce((s: number, t: any) => s + (parseFloat(String(t.weight).replace('t', '')) || 0), 0)
  return [
    { label: '任务单数', value: total, unit: '单' },
    { label: '待接单', value: pending, unit: '单', tone: 'warning' as const },
    { label: '收运中', value: inProgress, unit: '单', tone: 'processing' as const },
    { label: '已完成', value: done, unit: '单', tone: 'success' as const },
    { label: '垃圾量', value: weight.toFixed(1), unit: 't' },
  ]
})

// 车辆档案：驾驶员变动 → 自动带出类型和电话
watch(() => formData.value.driver, (driverName: string | undefined) => {
  if (props.pageKey !== 'vehicleArchive' || !driverName) return
  const person = peopleRows.find((p) => p.name === driverName)
  if (person) {
    formData.value.driverType = person.personType
    formData.value.driverPhone = person.phone
  }
})

// 中转站档案、收集点档案、焚烧厂档案：联系人变动 → 自动带出电话
watch(() => formData.value.contactPerson, (personName: string | undefined) => {
  if (!['stationArchive', 'collectionPoint', 'plantArchive'].includes(props.pageKey) || !personName) return
  const person = peopleRows.find((p) => p.name === personName)
  if (person) {
    formData.value.contactPhone = person.phone
  }
})

// 监听弹窗打开 → 加载省市数据
watch(modalVisible, (val) => {
  if (val) {
    loadProvinces()
    // 编辑时已有省份，级联加载城市和区县
    if (formData.value.province) {
      onProvinceChange(formData.value.province)
    }
    if (formData.value.city) {
      onCityChange(formData.value.city)
    }
  }
})

// 根据配置和 pageKey 的 fieldOptions 生成表单字段
const formFields = computed<FormField[]>(() => {
  const fieldOptions = config.fieldOptions || {}
  const hasLng = config.columns.some((c) => c.dataIndex === 'longitude') || config.rows.some((r) => r.longitude !== undefined)
  const hasLat = config.columns.some((c) => c.dataIndex === 'latitude') || config.rows.some((r) => r.latitude !== undefined)
  const hasProvince = config.columns.some((c) => c.dataIndex === 'province')
  const hasCity = config.columns.some((c) => c.dataIndex === 'city')
  const hasArea = config.columns.some((c) => c.dataIndex === 'area')
  const fields: FormField[] = []

  // 省市区放在表单最前面
  if (hasProvince) fields.push({ key: 'province', label: '省份', type: 'areaCascade', span: 8 })
  if (hasCity) fields.push({ key: 'city', label: '城市', type: 'areaCascade', span: 8 })
  if (hasArea) fields.push({ key: 'area', label: '区/县', type: 'areaCascade', span: 8 })

  for (const col of config.columns) {
    const key = col.dataIndex
    const label = col.title
    // 跳过经纬度、省市区、位置标签字段（已特殊处理）
    if (['longitude', 'latitude', 'province', 'city', 'area', 'atPoint', 'onVehicle', 'currentLocation', 'locationType', 'locationName', 'locationMatchLabel', 'overflowStatus', 'onlineStatus', 'batteryStatus', 'temperatureStatus', 'doorStatus', 'fillRate', 'temperature', 'battery'].includes(key)) continue

    if (fieldOptions[key]) {
      fields.push({ key, label, type: 'select', options: fieldOptions[key], span: 12 })
    } else if (['status', 'level', 'type', 'personType', 'vehicleType', 'boxType', 'routeType', 'objectType', 'alarmType', 'scaleStatus', 'openStatus', 'online', 'result', 'deviceStatus', 'source', 'progress'].includes(key)) {
      fields.push({ key, label, type: 'select', options: inferFallbackOptions(key), span: 12 })
    } else if (['population', 'households', 'containers', 'points', 'slots', 'alarms', 'workOrders', 'score', 'coverage', 'timely', 'safety', 'dataQuality', 'mileage', 'speed', 'fillRate', 'battery', 'temperature', 'confidence', 'villages', 'radius'].includes(key)) {
      fields.push({ key, label, type: 'number', span: 12, min: 0 })
    } else if (key === 'capacity') {
      fields.push({ key, label, type: 'number', span: 12, min: 0, step: 0.1 })
    } else if (['content', 'desc', 'description', 'remark', 'anomalyDesc', 'evidence', 'suggestAction'].includes(key)) {
      fields.push({ key, label, type: 'textarea', span: 24 })
    } else {
      // 从人员档案带出的字段，只读
      const readonlyKeys: Record<string, string[]> = {
        vehicleArchive: ['driverType', 'driverPhone'],
        stationArchive: ['contactPhone'],
        collectionPoint: ['contactPhone'],
        plantArchive: ['contactPhone'],
      }
      const isReadonly = (readonlyKeys[props.pageKey] || []).includes(key)
      fields.push({ key, label, type: 'input', span: 12, readonly: isReadonly })
    }
  }

  // 当同时有经度和纬度字段时，合并为一个地图选点入口
  if (hasLng && hasLat) {
    fields.push({ key: '_coord', label: '坐标', type: 'mapCoord', span: 24 })
  }

  return fields
})

// 表单校验规则
const formRules = computed(() => {
  const rules: Record<string, any> = {}
  const requiredFields = ['name', 'plateNo', 'boxNo', 'deviceNo', 'lockNo', 'cardNo', 'routeName', 'taskName', 'title', 'pointNo', 'personType', 'vehicleType', 'boxType', 'routeType', 'objectName', 'anomalyType', 'province', 'city', 'area', 'town', 'village']
  // 乡镇档案、村庄档案、焚烧厂档案、中转站档案页面：编码非必填
  if (props.pageKey !== 'townArchive' && props.pageKey !== 'villageArchive' && props.pageKey !== 'plantArchive' && props.pageKey !== 'stationArchive') {
    requiredFields.push('code', 'phone')
  }
  // 收集点档案页面：点位编号非必填；小勾臂箱页面：箱体编号非必填
  if (props.pageKey === 'collectionPoint') {
    const idx = requiredFields.indexOf('pointNo')
    if (idx > -1) requiredFields.splice(idx, 1)
  }
  if (props.pageKey === 'smallBoxArchive' || props.pageKey === 'largeBoxArchive') {
    const idx = requiredFields.indexOf('boxNo')
    if (idx > -1) requiredFields.splice(idx, 1)
  }
  config.columns.forEach((col) => {
    if (requiredFields.includes(col.dataIndex)) {
      const msg = ['province', 'city', 'area'].includes(col.dataIndex) ? '请选择' : '请输入'
      rules[col.dataIndex] = [{ required: true, message: `${msg}${col.title}` }]
    }
  })
  return rules
})

const columns = computed<TableColumnData[]>(() => [
  { title: '序号', width: 70, align: 'center', render: ({ rowIndex }: any) => rowIndex + 1 },
  ...config.columns.map((item) => {
    const column: TableColumnData = {
      title: item.title,
      dataIndex: item.dataIndex,
      width: item.width,
      ellipsis: true,
      tooltip: true,
      headerCellStyle: { whiteSpace: 'normal', wordBreak: 'break-all', overflow: 'visible', maxWidth: 'none' },
    }
    if (item.dataIndex === 'locationName') {
      column.render = ({ record }: { record: Record<string, any> }) => renderLocationCell(record)
      column.ellipsis = false
      column.tooltip = false
    }
    if (item.dataIndex === 'overflowStatus') {
      column.render = ({ record }: { record: Record<string, any> }) => renderStatusTag(record.overflowStatus, getOverflowStatusStyle(record.overflowStatus))
      column.ellipsis = false
      column.tooltip = false
    }
    if (item.dataIndex === 'onlineStatus') {
      column.render = ({ record }: { record: Record<string, any> }) => renderStatusTag(record.onlineStatus, getOnlineStatusStyle(record.onlineStatus))
      column.ellipsis = false
      column.tooltip = false
    }
    if (item.dataIndex === 'batteryStatus') {
      column.render = ({ record }: { record: Record<string, any> }) => renderStatusTag(record.batteryStatus, getBatteryStatusStyle(record.batteryStatus))
      column.ellipsis = false
      column.tooltip = false
    }
    if (item.dataIndex === 'temperatureStatus') {
      column.render = ({ record }: { record: Record<string, any> }) => renderStatusTag(record.temperatureStatus, getTemperatureStatusStyle(record.temperatureStatus))
      column.ellipsis = false
      column.tooltip = false
    }
    return column
  }),
  { title: '操作', slotName: 'action', width: 160, align: 'center', fixed: 'right' },
])

/** 根据列宽自动计算横向滚动宽度 */
const scrollX = computed(() => {
  const indexWidth = 70
  const actionWidth = 180
  const dataWidth = config.columns.reduce((sum, col) => sum + (col.width ?? 120), 0)
  return indexWidth + dataWidth + actionWidth + 20 // 加 20px 余量防止贴边
})

const filteredRows = computed(() => {
  let result = config.rows
  if (keyword.value) {
    const text = keyword.value.toLowerCase()
    result = result.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(text)))
  }
  // 日期范围筛选
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value).getTime()
    const end = new Date(endDate.value).getTime() + 86400000 // 包含结束日期全天
    result = result.filter((row) => {
      const t = row.createTime ? new Date(row.createTime.replace(/-/g, '/')).getTime() : 0
      return t >= start && t <= end
    })
  }
  // 多筛选条件
  for (const mf of config.multiFilters || []) {
    const val = filterStates.value[mf.key]
    if (val && val !== mf.options[0]) {
      result = result.filter((row) => String(row[mf.key]) === val)
    }
  }
  return result
})

const drawerItems = computed(() => {
  const record = selectedRecord.value
  if (!Object.keys(record).length) {
    return config.columns.slice(0, 8).map((item) => ({
      label: item.title,
      value: '-',
    }))
  }
  return config.columns.map((item) => ({
    label: item.title,
    value: String(record[item.dataIndex] ?? '-'),
  }))
})

function inferFallbackOptions(key: string): string[] {
  // 仅作为 fallback，优先使用 pageConfig 中的 fieldOptions
  const fallbackMap: Record<string, string[]> = {
    status: ['启用', '停用'],
    level: ['一般', '重要', '严重'],
    type: ['类型一', '类型二'],
    personType: ['驾驶员', '保洁员', '站点管理员', '设备运维'],
    vehicleType: ['小三轮', '小勾臂车', '大勾臂车'],
    boxType: ['小勾臂箱', '大勾臂箱', '移动压缩箱'],
    routeType: ['小三轮收集', '小勾臂转运', '大勾臂转运'],
    objectType: ['乡镇', '村庄', '车辆', '驾驶员', '中转站'],
    alarmType: ['主动安全', '满溢告警', '设备离线', '称重异常'],
    scaleStatus: ['未对接', '已对接', '对接异常'],
    openStatus: ['关锁', '开锁', '未知'],
    online: ['在线', '离线'],
    result: ['正常关锁', '非授权卡', '未关锁'],
    deviceStatus: ['正常', '异常', '离线'],
    source: ['人工补录', '电子围栏', '轨迹识别'],
    progress: ['待派发', '待接单', '进行中', '已完成'],
  }
  return fallbackMap[key] || ['是', '否']
}

const locationTagConfig: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
  collectionPoint: { color: '#165dff', backgroundColor: '#e8f3ff', borderColor: '#bedaff' },
  vehicle: { color: '#722ed1', backgroundColor: '#f5e8ff', borderColor: '#dcbef6' },
  station: { color: '#d25f00', backgroundColor: '#fff7e8', borderColor: '#ffd8a8' },
  plant: { color: '#009b2e', backgroundColor: '#e8ffea', borderColor: '#aff0b5' },
}

function getLocationTagStyle(locationType: unknown) {
  const cfg = locationTagConfig[String(locationType)] || {
    color: 'var(--color-text-2)',
    backgroundColor: 'var(--color-fill-2)',
    borderColor: 'var(--color-border-2)',
  }
  return {
    color: cfg.color,
    backgroundColor: cfg.backgroundColor,
    borderColor: cfg.borderColor,
  }
}

function getFillRateStyle(fillRate: unknown) {
  const val = Number(fillRate)
  if (isNaN(val)) return { color: 'var(--color-text-4)' }
  if (val >= smallBoxStatusConfig.overflowFillRate) return { color: '#f53f3f', fontWeight: 600 }  // 满溢 - 红
  if (val >= smallBoxStatusConfig.warningFillRate) return { color: '#ff7d00', fontWeight: 600 }  // 预警 - 橙
  return { color: '#00b42a' }                                   // 正常 - 绿
}

function getOverflowStatusStyle(status: unknown) {
  const map: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
    正常: { color: '#00b42a', backgroundColor: '#e8ffea', borderColor: '#aff0b5' },
    预警: { color: '#d25f00', backgroundColor: '#fff7e8', borderColor: '#ffd8a8' },
    满溢: { color: '#f53f3f', backgroundColor: '#ffece8', borderColor: '#fdcdc5' },
  }
  return map[String(status)] || {
    color: 'var(--color-text-4)',
    backgroundColor: 'var(--color-fill-2)',
    borderColor: 'var(--color-border-2)',
  }
}

function getOnlineStatusStyle(status: unknown) {
  const map: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
    在线: { color: '#00b42a', backgroundColor: '#e8ffea', borderColor: '#aff0b5' },
    离线: { color: '#86909c', backgroundColor: '#f2f3f5', borderColor: '#e5e6eb' },
  }
  return map[String(status)] || {
    color: 'var(--color-text-4)',
    backgroundColor: 'var(--color-fill-2)',
    borderColor: 'var(--color-border-2)',
  }
}

function getBatteryStatusStyle(status: unknown) {
  const map: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
    正常: { color: '#00b42a', backgroundColor: '#e8ffea', borderColor: '#aff0b5' },
    低电量: { color: '#f53f3f', backgroundColor: '#ffece8', borderColor: '#fdcdc5' },
  }
  return map[String(status)] || {
    color: 'var(--color-text-4)',
    backgroundColor: 'var(--color-fill-2)',
    borderColor: 'var(--color-border-2)',
  }
}

function getTemperatureStatusStyle(status: unknown) {
  const map: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
    正常: { color: '#00b42a', backgroundColor: '#e8ffea', borderColor: '#aff0b5' },
    高温: { color: '#f53f3f', backgroundColor: '#ffece8', borderColor: '#fdcdc5' },
  }
  return map[String(status)] || {
    color: 'var(--color-text-4)',
    backgroundColor: 'var(--color-fill-2)',
    borderColor: 'var(--color-border-2)',
  }
}

function renderStatusTag(value: unknown, style: Record<string, string>) {
  return h('span', { class: 'status-cell' }, [
    h('span', { class: 'small-box-status-tag', style }, String(value || '-')),
  ])
}

function renderLocationCell(record: Record<string, any>) {
  if (!record.locationName && !record.locationMatches?.length) {
    return h('span', { class: 'empty-text' }, '-')
  }
  // 多匹配：遍历 locationMatches 数组渲染多个标签
  if (record.locationMatches?.length) {
    return h('span', { class: 'location-cell' }, record.locationMatches.map((m: { type: string; name: string }) =>
      h('span', {
        class: 'location-match-tag',
        style: { ...getLocationTagStyle(m.type) },
      }, m.name)
    ))
  }
  // 单匹配：向后兼容
  return h('span', { class: 'location-cell' }, [
    h('span', {
      class: 'location-match-tag',
      style: { ...getLocationTagStyle(record.locationType) },
    }, record.locationName),
  ])
}

function reset() {
  keyword.value = ''
  startDate.value = undefined
  endDate.value = undefined
  config.multiFilters?.forEach((mf) => {
    filterStates.value[mf.key] = mf.options[0]
  })
}

function showDetail(record: Record<string, any>) {
  selectedRecord.value = record
  if (props.pageKey === 'taskOrderStats') {
    taskDrawerVisible.value = true
  } else {
    drawerTitle.value = `${config.title}详情`
    drawerVisible.value = true
  }
}

function handleAdd() {
  isEdit.value = false
  editingId.value = null
  formData.value = {}
  modalVisible.value = true
}

function handleEdit(record: Record<string, any>) {
  isEdit.value = true
  editingId.value = record.id
  formData.value = { ...record }
  modalVisible.value = true
}

function handleDelete(record: Record<string, any>) {
  const index = config.rows.findIndex((item) => item.id === record.id)
  if (index !== -1) {
    config.rows.splice(index, 1)
  }
}

function handleRemoteOpen(record: Record<string, any>) {
  Modal.confirm({
    title: '远程打开箱体',
    content: `远程打开箱体「${record.name}」？`,
    onOk: async () => {
      try {
        // 模拟远程调用
        await new Promise((resolve) => setTimeout(resolve, 1500))
        record.doorStatus = '开'
        Modal.success({ title: '操作成功', content: `箱体「${record.name}」已远程打开` })
      } catch {
        Modal.error({ title: '操作失败', content: `箱体「${record.name}」远程打开失败，请重试` })
      }
    },
  })
}

function handleModalOk() {
  if (isEdit.value && editingId.value) {
    const index = config.rows.findIndex((item) => item.id === editingId.value)
    if (index !== -1) {
      config.rows[index] = { ...config.rows[index], ...formData.value }
    }
  } else {
    const newId = props.pageKey.slice(0, 3).toUpperCase() + String(config.rows.length + 1).padStart(3, '0')
    config.rows.push({ id: newId, ...formData.value })
  }
  modalVisible.value = false
}

function handleModalCancel() {
  modalVisible.value = false
}

// 地图选点
const mapPickerVisible = ref(false)
const mapPickerLng = ref(114.338)
const mapPickerLat = ref(36.058)

function openMapPicker() {
  mapPickerLng.value = Number(formData.value.longitude) || 114.338
  mapPickerLat.value = Number(formData.value.latitude) || 36.058
  mapPickerVisible.value = true
}

function onMapPickConfirm(data: { longitude: number; latitude: number }) {
  formData.value.longitude = data.longitude
  formData.value.latitude = data.latitude
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
  gap: 14px;
  margin-bottom: 16px;
}

.search-input {
  width: 260px;
}

.filter-label {
  font-size: 13px;
  color: var(--color-text-2);
  white-space: nowrap;
}

.filter-select {
  width: 120px;
}

/* 表头允许换行显示 */
:deep(.arco-table-th) {
  .arco-table-th-item {
    white-space: normal !important;
    word-break: break-all !important;
    overflow: visible !important;
    height: auto !important;
    line-height: 1.4 !important;
    padding-top: 6px;
    padding-bottom: 6px;
  }
}

.location-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.location-address {
  color: var(--color-text-1);
  line-height: 22px;
}

.location-match-tag {
  display: inline-flex;
  align-items: center;
  max-width: 160px;
  height: 22px;
  padding: 0 8px;
  overflow: hidden;
  border: 1px solid;
  border-radius: 2px;
  font-size: 12px;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-cell {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.small-box-status-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 12px;
  line-height: 22px;
  white-space: nowrap;
}

.empty-text {
  color: var(--color-text-4);
}

/* 产品需求说明折叠面板 */
.prd-panel {
  background: var(--color-bg-2);
  border-radius: 4px;

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

.prd-section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.prd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  tr {
    &:nth-child(even) {
      background: var(--color-fill-1);
    }
  }

  td {
    padding: 6px 12px;
    border: 1px solid var(--color-border-2);
    vertical-align: top;
    line-height: 1.6;
  }

  .prd-label {
    width: 140px;
    min-width: 140px;
    font-weight: 500;
    color: var(--color-text-2);
    white-space: nowrap;
  }

  .prd-value {
    color: var(--color-text-1);
  }
}

/* 任务单详情 - 地图轨迹 */
.task-detail-section {
  margin-bottom: 16px;

  .section-title {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-text-1);
    padding-bottom: 8px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--color-border-2);
  }
}

.route-map {
  position: relative;
  width: 100%;
  height: 240px;
  background: var(--color-fill-1);
  border-radius: 6px;
  overflow: hidden;

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
}

.map-point {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform: translate(-50%, -50%);
  pointer-events: none;

  span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-fill-4);
    border: 2px solid var(--color-text-4);
  }

  &.done span {
    background: rgb(var(--green-6));
    border-color: rgb(var(--green-6));
  }

  b {
    font-size: 11px;
    color: var(--color-text-3);
    white-space: nowrap;
  }
}

.map-weight {
  margin-top: 10px;
  padding: 8px 14px;
  background: rgba(var(--arcoblue-1), 0.4);
  border-radius: 4px;
  font-size: 14px;

  b { font-size: 16px; }
}
</style>

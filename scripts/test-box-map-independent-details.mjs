import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { ref } from 'vue'

const source = readFileSync(new URL('../src/views/sanitation/box-map.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const ast = ts.createSourceFile('box-map.ts', script, ts.ScriptTarget.Latest, true)
const names = ['loadVehicles', 'loadVehicleTypes', 'responseDataArray', 'selectBox',
  'loadCurrentResidence', 'loadCurrentOverflow', 'hasMatchedArea', 'syncSelectedBox', 'drawMarkers']
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node)
  && names.includes(node.name?.text)).map(node => node.getText(ast)).join('\n')
const { outputText } = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const settle = () => new Promise(resolve => setImmediate(resolve))
const boxA = { id: 1, overflowStatus: 1 }
const boxB = { id: 2, overflowStatus: 1 }

function setup() {
  const runtime = deferred(), types = deferred()
  const details = new Map()
  const events = []
  const context = vm.createContext({
    vehicleLoading: ref(false), vehicleError: ref(false), vehicleTypesLoading: ref(false), vehicleTypesError: ref(false),
    vehicles: ref([{ id: 'previous' }]), vehicleTypeById: ref(new Map([['previous', '小勾臂车']])), vehicleTypesLoadedAt: 0,
    collectorVehicleRuntimeRequest: () => { events.push('runtime-start'); return runtime.promise },
    collectorVehicleTypesRequest: () => { events.push('types-start'); return types.promise },
    indexVehicleTypes: () => events.push('types-applied'),
    cloudLoading: ref(true), selectedBox: ref(), currentResidence: ref(), currentOverflow: ref(), residenceCache: new Map(),
    residenceLoading: ref(false), residenceError: ref(false), overflowLoading: ref(false), overflowError: ref(false),
    residenceRequestVersion: 0, historyVisible: ref(false),
    boxAreas: new Map([[1, { township: '镇', village: '村', pointName: '点1' }], [2, { township: '镇', village: '村', pointName: '点2' }]]),
    collectorDaasFetch: (url, options) => {
      assert.equal(options.timeoutMs, 10000)
      const request = deferred()
      details.set(url, request)
      return request.promise
    },
    visibleBoxes: ref([boxA, boxB]), amap: {}, markers: [],
    map: { getZoom: () => 14, setZoomAndCenter: () => events.push('center'), setFitView: () => events.push('fit') },
    clearBoxOverlays() {}, shouldShowBoxLabels: () => true, createBoxMarker: box => ({ id: box.id }),
    getHiddenBoxIds: () => new Set(), closeVehicleInfo() {}, getGcjPoint: () => ({ lng: 114, lat: 36 }),
    closeHistoryTrack: () => events.push('history-closed'),
    Message: { success() {}, warning() {} }, console: { warn() {} },
  })
  vm.runInContext(outputText, context)
  return { context, runtime, types, details, events }
}

// 位置和车型同时开始；位置更新完成后不等待慢车型，期间可继续操作。
const fleet = setup()
const loading = fleet.context.loadVehicles(true, true)
assert.deepEqual(fleet.events, ['types-start', 'runtime-start'])
await fleet.context.loadVehicles(true, true)
assert.equal(fleet.events.filter(event => event === 'runtime-start').length, 1)
fleet.runtime.resolve({ data: [{ id: 'latest' }] })
await loading
assert.equal(fleet.context.vehicleLoading.value, false)
assert.equal(fleet.context.vehicleTypesLoading.value, true)
assert.equal(fleet.context.vehicles.value[0].id, 'latest')
fleet.types.reject(new Error('types unavailable'))
await settle()
assert.equal(fleet.context.vehicleTypesError.value, true)
assert.equal(fleet.context.vehicleError.value, false)
assert.ok(fleet.context.vehicleTypeById.value.has('previous'))

// 位置失败保留原车辆，车型仍可独立成功。
const failed = setup()
const failedLoad = failed.context.loadVehicles(true, true)
failed.runtime.reject(new Error('runtime unavailable'))
failed.types.resolve({ data: [] })
await failedLoad
await settle()
assert.equal(failed.context.vehicles.value[0].id, 'previous')
assert.equal(failed.context.vehicleError.value, true)
assert.ok(failed.events.includes('types-applied'))

// 用户在箱体刷新时点击 A、再切换 B；迟到的 A 详情不能覆盖 B 或结束 B 的加载状态。
const detail = setup()
detail.context.selectBox(boxA)
detail.context.selectBox(boxB)
assert.equal(detail.context.selectedBox.value.id, 2)
assert.equal(detail.context.cloudLoading.value, true, '箱体仍在刷新时也能切换详情')
for (const [url, request] of detail.details) {
  if (url.includes('/1/')) request.resolve(new Response(JSON.stringify({ boxId: 1 })))
}
await settle()
assert.equal(detail.context.currentResidence.value, undefined)
assert.equal(detail.context.currentOverflow.value, undefined)
assert.equal(detail.context.residenceLoading.value, true)
assert.equal(detail.context.overflowLoading.value, true)
for (const [url, request] of detail.details) {
  if (url.includes('/2/')) request.resolve(new Response(JSON.stringify({ boxId: 2 })))
}
await settle()
assert.equal(detail.context.currentResidence.value.boxId, 2)
assert.equal(detail.context.currentOverflow.value.boxId, 2)
assert.equal(detail.context.residenceLoading.value, false)
assert.equal(detail.context.overflowLoading.value, false)

// 新箱体对象按 ID 延续选中状态和历史面板，不移动视野。
detail.context.historyVisible.value = true
const replacement = { ...boxB, fillLevel: 80 }
const centers = detail.events.filter(event => event === 'center').length
detail.context.syncSelectedBox([replacement])
assert.equal(detail.context.selectedBox.value.fillLevel, 80)
assert.equal(detail.context.historyVisible.value, true)
assert.equal(detail.events.filter(event => event === 'center').length, centers)
assert.ok(!detail.events.includes('history-closed'))

// 后台运单/收集点更新改变筛选结果时保留详情；用户主动筛选仍可关闭详情。
detail.context.visibleBoxes.value = []
detail.context.drawMarkers(false)
assert.equal(detail.context.selectedBox.value.id, 2)
detail.context.drawMarkers(true)
assert.equal(detail.context.selectedBox.value, undefined)

detail.context.selectedBox.value = replacement
detail.context.getHiddenBoxIds = () => new Set([2])
detail.context.drawMarkers(false)
assert.equal(detail.context.selectedBox.value, undefined, '隐藏配置仍需关闭被隐藏箱体的详情')
console.log('Vehicle independence, delayed details and selection continuity checks passed')

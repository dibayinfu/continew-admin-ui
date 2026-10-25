import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { computed, reactive, ref, watch, nextTick } from 'vue'

// 执行页面真实刷新函数，用可控慢请求验证各数据源的完成顺序和失败隔离。
const source = readFileSync(new URL('../src/views/sanitation/box-map.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const ast = ts.createSourceFile('box-map.ts', script, ts.ScriptTarget.Latest, true)
const names = ['loadFromCloud', 'loadTransportTasks', 'loadCollectionPoints', 'refreshMapData', 'assignBoxAreas', 'isCollectionPointNameKey']
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node)
  && names.includes(node.name?.text)).map(node => node.getText(ast)).join('\n')
const { outputText } = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const settle = () => new Promise(resolve => setImmediate(resolve))

function setup() {
  const boxRequest = deferred()
  const transportRequest = deferred()
  const pointsRequest = deferred()
  const events = []
  const context = vm.createContext({
    cloudLoading: ref(false), transportTasksLoading: ref(false), transportTasksError: ref(false),
    pointsLoading: ref(false), pointsError: ref(false), pointsLoadedAt: 0,
    selectedBox: ref(), currentResidence: ref(), residenceLoading: ref(false),
    boxes: ref([]), points: ref([]), todayTransportTasks: ref([{ taskId: 'previous' }]),
    boxAreas: reactive(new Map()), residenceCache: new Map(), WeakMap,
    collectorMapBoxesRequest: () => {
      events.push('boxes-start')
      return boxRequest.promise
    },
    collectorMapPointsRequest: () => {
      events.push('points-start')
      return pointsRequest.promise
    },
    collectorMapTransportTasksRequest: () => {
      events.push('transport-start')
      return transportRequest.promise
    },
    // 故意永不完成，刷新按钮不能等待车辆请求。
    loadVehicles: () => { events.push('vehicles-start'); return new Promise(() => {}) },
    syncSelectedBox() {}, saveCachedBoxes() {}, saveCachedPoints() {},
    loadNewBoxIds: () => { events.push('new-box-ids-start'); return new Promise(() => {}) },
    indexTransportTasks: () => events.push('transport-applied'),
    Message: { success: text => events.push(text), warning: () => events.push('warning') },
    console: { warn() {} },
  })
  vm.runInContext(outputText, context)
  return { context, boxRequest, transportRequest, pointsRequest, events }
}

// 箱体、运单、车辆同时开始；箱体完成后按钮立即结束，慢运单仍可随后补齐。
const slow = setup()
const refresh = slow.context.refreshMapData()
assert.deepEqual(slow.events, ['points-start', 'transport-start', 'new-box-ids-start', 'boxes-start', 'vehicles-start'])
const town = computed(() => slow.context.boxAreas.get(1)?.township)
slow.boxRequest.resolve([{ id: 1, longitude: 114, latitude: 36, matchObject: '{"收集点":{}}' }])
await refresh
assert.equal(slow.context.cloudLoading.value, false)
assert.equal(slow.context.boxes.value[0].id, 1)
assert.ok(slow.events.includes('已从云端更新 1 个箱体'))
assert.equal(slow.context.transportTasksLoading.value, true, '箱体成功提示无需等待运单')
assert.equal(slow.context.todayTransportTasks.value[0].taskId, 'previous')
assert.equal(slow.context.pointsLoading.value, true)
assert.equal(town.value, undefined)
// 收集点延迟到达后归属筛选应立即更新，无需再刷新一次箱体。
slow.pointsRequest.resolve([{ id: 10, pointName: '收集点', townshipName: '测试镇', villageName: '测试村', longitude: 114, latitude: 36 }])
await settle()
assert.equal(town.value, '测试镇')
await slow.context.loadCollectionPoints()
assert.equal(slow.events.filter(event => event === 'points-start').length, 1, '有效期内复用收集点')
slow.context.pointsLoadedAt = Date.now() - 5 * 60_000
await slow.context.loadCollectionPoints()
assert.equal(slow.events.filter(event => event === 'points-start').length, 2, '到期后重新请求收集点')
await slow.context.loadTransportTasks()
assert.equal(slow.events.filter(event => event === 'transport-start').length, 1)
slow.transportRequest.resolve([{ taskId: 'latest' }])
await settle()
assert.equal(slow.context.transportTasksLoading.value, false)
assert.equal(slow.context.todayTransportTasks.value[0].taskId, 'latest')
assert.ok(slow.events.includes('transport-applied'))

// 运单失败不能清空旧数据、阻止箱体成功，或让按钮一直转圈。
const failed = setup()
failed.context.points.value = [{ id: 30, pointName: '原收集点' }]
const failedRefresh = failed.context.refreshMapData()
failed.transportRequest.reject(new Error('upstream timeout'))
failed.boxRequest.resolve([{ id: 2 }])
failed.pointsRequest.reject(new Error('points unavailable'))
await failedRefresh
await settle()
assert.equal(failed.context.boxes.value[0].id, 2)
assert.equal(failed.context.todayTransportTasks.value[0].taskId, 'previous')
assert.equal(failed.context.transportTasksError.value, true)
assert.equal(failed.context.transportTasksLoading.value, false)
assert.equal(failed.context.cloudLoading.value, false)
assert.equal(failed.context.pointsError.value, true)
assert.equal(failed.context.pointsLoading.value, false)
assert.equal(failed.context.points.value[0].id, 30)

// 箱体失败时仍可更新运单；重复刷新不会重复发起主数据请求。
const boxesFailed = setup()
const pending = boxesFailed.context.loadFromCloud()
await boxesFailed.context.loadFromCloud()
assert.equal(boxesFailed.events.filter(event => event === 'boxes-start').length, 1)
boxesFailed.boxRequest.reject(new Error('boxes unavailable'))
boxesFailed.transportRequest.resolve([{ taskId: 'independent' }])
await pending
await settle()
assert.equal(boxesFailed.context.todayTransportTasks.value[0].taskId, 'independent')
assert.equal(boxesFailed.context.cloudLoading.value, false)

// 用户在收集点未返回时点开箱体，收集点补齐后应自动加载该箱体驻留详情。
const earlySelection = setup()
const selected = { id: 11 }
earlySelection.context.selectedBox.value = selected
earlySelection.context.residenceRequestVersion = 3
const detailLoads = []
earlySelection.context.loadCurrentResidence = (box, version) => detailLoads.push([box.id, version])
const pointsLoad = earlySelection.context.loadCollectionPoints()
earlySelection.pointsRequest.resolve([{ id: 10, pointName: '收集点' }])
await pointsLoad
assert.deepEqual(detailLoads, [[11, 3]])

console.log('Box map independent refresh regression checks passed')

// 名单后台校验完成时，真实 watcher 必须触发地图重绘。
const redraws = []
const hidden = reactive({ ids: new Set() })
slow.context.watch = watch
slow.context.transportTasksByBoxNo = ref(new Map())
slow.context.getHiddenBoxIds = () => new Set(hidden.ids)
slow.context.drawMarkers = fit => redraws.push(fit)
const watcher = ast.statements.find(node => node.getText(ast).startsWith('watch([boxes, points,'))
assert.ok(watcher)
vm.runInContext(ts.transpileModule(watcher.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, slow.context)
hidden.ids = new Set([1])
await nextTick()
assert.deepEqual(redraws, [false])
console.log('Deferred points, reactive area filters and visibility redraw checks passed')

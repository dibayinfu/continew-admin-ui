import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// 执行页面真实刷新函数，用可控慢请求验证各数据源的完成顺序和失败隔离。
const source = readFileSync(new URL('../src/views/sanitation/box-map.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const ast = ts.createSourceFile('box-map.ts', script, ts.ScriptTarget.Latest, true)
const names = ['loadFromCloud', 'loadTransportTasks', 'refreshMapData']
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node)
  && names.includes(node.name?.text)).map(node => node.getText(ast)).join('\n')
const { outputText } = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
const ref = value => ({ value })
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const settle = () => new Promise(resolve => setImmediate(resolve))

function setup() {
  const boxRequest = deferred()
  const transportRequest = deferred()
  const events = []
  const context = vm.createContext({
    cloudLoading: ref(false), transportTasksLoading: ref(false), transportTasksError: ref(false),
    boxes: ref([]), points: ref([]), todayTransportTasks: ref([{ taskId: 'previous' }]),
    residenceCache: new Map(), WeakMap,
    collectorMapRequest: includeTasks => {
      assert.equal(includeTasks, false)
      events.push('boxes-start')
      return boxRequest.promise
    },
    collectorMapTransportTasksRequest: () => {
      events.push('transport-start')
      return transportRequest.promise
    },
    // 故意永不完成，刷新按钮不能等待车辆请求。
    loadVehicles: () => { events.push('vehicles-start'); return new Promise(() => {}) },
    assignBoxAreas() {}, syncSelectedBox() {}, saveCachedBoxes() {}, saveCachedPoints() {},
    loadNewBoxIds() {}, indexTransportTasks: () => events.push('transport-applied'),
    Message: { success() {}, warning: () => events.push('warning') },
    console: { warn() {} },
  })
  vm.runInContext(outputText, context)
  return { context, boxRequest, transportRequest, events }
}

// 箱体、运单、车辆同时开始；箱体完成后按钮立即结束，慢运单仍可随后补齐。
const slow = setup()
const refresh = slow.context.refreshMapData()
assert.deepEqual(slow.events, ['transport-start', 'boxes-start', 'vehicles-start'])
slow.boxRequest.resolve({ boxes: [{ id: 1 }], points: [] })
await refresh
assert.equal(slow.context.cloudLoading.value, false)
assert.equal(slow.context.boxes.value[0].id, 1)
assert.equal(slow.context.transportTasksLoading.value, true)
assert.equal(slow.context.todayTransportTasks.value[0].taskId, 'previous')
await slow.context.loadTransportTasks()
assert.equal(slow.events.filter(event => event === 'transport-start').length, 1)
slow.transportRequest.resolve([{ taskId: 'latest' }])
await settle()
assert.equal(slow.context.transportTasksLoading.value, false)
assert.equal(slow.context.todayTransportTasks.value[0].taskId, 'latest')
assert.ok(slow.events.includes('transport-applied'))

// 运单失败不能清空旧数据、阻止箱体成功，或让按钮一直转圈。
const failed = setup()
const failedRefresh = failed.context.refreshMapData()
failed.transportRequest.reject(new Error('upstream timeout'))
failed.boxRequest.resolve({ boxes: [{ id: 2 }], points: [] })
await failedRefresh
await settle()
assert.equal(failed.context.boxes.value[0].id, 2)
assert.equal(failed.context.todayTransportTasks.value[0].taskId, 'previous')
assert.equal(failed.context.transportTasksError.value, true)
assert.equal(failed.context.transportTasksLoading.value, false)
assert.equal(failed.context.cloudLoading.value, false)

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

console.log('Box map independent refresh regression checks passed')

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/views/sanitation/box-map.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const ast = ts.createSourceFile('box-map.ts', script, ts.ScriptTarget.Latest, true)
const names = ['focusMatchedTarget', 'matchTownship', 'matchVillage', 'getLocateSuggestions', 'onLocateSelect', 'onLocateEnter']
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node)
  && names.includes(node.name?.text)).map(node => node.getText(ast)).join('\n')
const { outputText } = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
const ref = value => ({ value })
const box = { id: 48, containerNo: '048', longitude: 114, latitude: 36, overflowStatus: 0 }

function setup({ target = box, town = '', village = '', overflow = false, transporting = false, task = false, hidden = false, extraBoxes = [], vehicle } = {}) {
  const notices = []
  const actions = []
  let flushed = false
  const context = vm.createContext({
    keyword: ref(vehicle ? '6095' : '048'),
    matchedBoxes: ref(new Set(vehicle ? [] : [target, ...extraBoxes])),
    matchedVehicles: ref(vehicle ? [vehicle] : []),
    townshipFilter: ref(town), villageFilter: ref(village),
    overflowOnly: ref(overflow), transportingOnly: ref(transporting),
    highTemperatureOnly: ref(false), offlineOnly: ref(false), lowBatteryOnly: ref(false),
    UNMATCHED: '__unmatched__',
    boxAreas: new Map([[48, { township: '龙泉镇', village: '某村' }]]),
    getHiddenBoxIds: () => new Set(hidden ? [48] : []),
    hasTransportTask: () => task,
    Message: { info: text => notices.push(text) },
    nextTick: async () => { flushed = true },
    selectBox: selected => {
      assert.ok(flushed, '筛选 watcher 应先于最终定位完成')
      assert.ok(context.matchTownship(selected) && context.matchVillage(selected))
      assert.ok(!context.overflowOnly.value || selected.overflowStatus === 1)
      assert.ok(!context.transportingOnly.value || task)
      actions.push(selected.id)
    },
    vehicleTypeOf: () => '小勾臂车', enabledVehicleTypes: ref([]), selectedBox: ref(box),
    drawMarkers() {}, drawVehicleMarkers() {}, vehiclePoint: () => ({ lng: 114, lat: 36 }),
    map: { getZoom: () => 12, setZoomAndCenter: () => actions.push('center') },
    visibleVehicles: ref(vehicle ? [vehicle] : []), vehicleMarkers: [],
    openVehicleInfo: selected => actions.push(selected.id),
  })
  vm.runInContext(outputText, context)
  const filters = () => [context.townshipFilter.value, context.villageFilter.value, context.overflowOnly.value, context.transportingOnly.value]
  return { context, notices, actions, filters }
}

for (const [options, expected] of [
  [{ town: '善应镇', village: '其他村' }, ['', '', false, false]],
  [{ town: '龙泉镇', village: '其他村' }, ['龙泉镇', '', false, false]],
  [{ town: '__unmatched__' }, ['', '', false, false]],
  [{ town: '龙泉镇', village: '__unmatched__' }, ['龙泉镇', '', false, false]],
  [{ overflow: true, transporting: true }, ['', '', false, false]],
  [{ town: '龙泉镇', village: '某村', overflow: true, transporting: true, task: true, target: { ...box, overflowStatus: 1 } }, ['龙泉镇', '某村', true, true]],
  [{ town: '善应镇', overflow: true, task: true, target: { ...box, overflowStatus: 1 } }, ['', '', true, false]],
]) {
  const test = setup(options)
  await test.context.focusMatchedTarget()
  assert.deepEqual(test.filters(), expected)
  assert.deepEqual(test.actions, [48])
}

// 不可定位、隐藏、无结果、多结果和输入法确认都不应改变筛选。
for (const options of [
  { target: { ...box, longitude: NaN } },
  { hidden: true },
  { target: { ...box, containerNo: '0481' }, extraBoxes: [{ ...box, id: 49, containerNo: '0482' }] },
  { empty: true },
  { composing: true },
]) {
  const test = setup({ ...options, town: '善应镇', overflow: true })
  if (options.empty) test.context.matchedBoxes.value.clear()
  await test.context.focusMatchedTarget(options.composing ? { isComposing: true } : undefined)
  assert.deepEqual(test.filters(), ['善应镇', '', true, false])
  assert.deepEqual(test.actions, [])
}

// 唯一精确箱号应优先于其他包含该字符串的箱号。
const exact = setup({ extraBoxes: [{ ...box, id: 49, containerNo: '0481' }] })
await exact.context.focusMatchedTarget()
assert.deepEqual(exact.actions, [48])

const vehicle = setup({ town: '善应镇', overflow: true, vehicle: { id: 95, plateNumber: '豫EDT6095' } })
await vehicle.context.focusMatchedTarget()
assert.deepEqual([...vehicle.context.enabledVehicleTypes.value], ['小勾臂车'])
assert.deepEqual(vehicle.actions, ['center', 95])
assert.deepEqual(vehicle.filters(), ['善应镇', '', true, false])
assert.deepEqual(vehicle.notices, [])

// 补全使用全量匹配结果，不受区域和状态筛选影响；仅返回箱号和车牌。
const suggestions = setup({ town: '善应镇', overflow: true, extraBoxes: [
  { ...box, id: 49, containerNo: '0481' },
  { ...box, id: 50, containerNo: '048' },
] })
suggestions.context.matchedVehicles.value = [{ id: 95, plateNumber: '豫EDT0481' }]
assert.deepEqual([...suggestions.context.getLocateSuggestions()], ['048', '0481', '豫EDT0481'])
assert.deepEqual(suggestions.actions, [])
assert.deepEqual(suggestions.filters(), ['善应镇', '', true, false])
suggestions.context.keyword.value = '  豫edt0481  '
assert.equal(suggestions.context.getLocateSuggestions()[0], '豫EDT0481')
suggestions.context.keyword.value = ''
assert.deepEqual([...suggestions.context.getLocateSuggestions()], [])

// 选择候选先同步输入；组件已处理的回车不应重复定位。
const selected = setup({ town: '善应镇' })
selected.context.keyword.value = '04'
await selected.context.onLocateSelect('048')
assert.equal(selected.context.keyword.value, '048')
assert.deepEqual(selected.actions, [48])
await selected.context.onLocateEnter({ defaultPrevented: true })
await selected.context.onLocateEnter({ isComposing: true })
assert.deepEqual(selected.actions, [48])

const entered = setup()
await entered.context.onLocateEnter({ defaultPrevented: false })
assert.deepEqual(entered.actions, [48])

console.log('Box map global locate and filter regression checks passed')

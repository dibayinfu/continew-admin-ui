import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/views/sanitation/box-map.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const ast = ts.createSourceFile('box-map.ts', script, ts.ScriptTarget.Latest, true)
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node)
  && ['drawVehicleMarkers', 'loadTricycleCluster', 'tricycleMarkerContent', 'focusVehicleMarker'].includes(node.name?.text)).map(node => node.getText(ast)).join('\n')
const { outputText } = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
let options
const opened = []
const vehicleA = { id: 1, longitude: 114, latitude: 36 }
const vehicleB = { id: 2, longitude: 115, latitude: 37 }
const context = vm.createContext({
  map: { getZoom: () => 13, setZoomAndCenter() {} },
  amap: {
    MarkerCluster: class { constructor(_map, _points, config) { options = config } },
    Pixel: class { constructor(x, y) { this.x = x; this.y = y } },
  },
  visibleVehicles: { value: [vehicleA, vehicleB] },
  clearVehicleOverlays() {},
  vehicleTypeOf: () => '小三轮',
  vehicleStatus: () => 'online',
  selectedVehicleId: { value: undefined },
  vehiclePoint: v => ({ lng: v.longitude, lat: v.latitude }),
  openVehicleInfo: v => opened.push(v.id),
  clusterMarkerContent: count => String(count),
  vehicleMarkers: [], tricycleCluster: undefined,
  selectedVehicleMarker: undefined,
  resetSelectedVehicleMarker: undefined,
  VEHICLE_FOCUSED_Z_INDEX: 2000,
})
vm.runInContext(`${outputText}\ndrawVehicleMarkers()`, context)
const handlers = []
const marker = {
  getPosition: () => ({ getLng: () => 114, getLat: () => 36 }),
  on: (event, handler) => { assert.equal(event, 'click'); handlers.push(handler) },
  setOffset(value) { this.offset = value },
  setContent(value) { this.content = value },
  setzIndex(value) { this.zIndex = value },
}
// SDK 单点回调的数据数组必须打开车辆详情，无缩放门槛。
options.renderMarker({ marker, data: [{ vehicle: vehicleA }] })
handlers.forEach(fn => fn())
assert.deepEqual(opened, [1])
assert.equal(marker.offset.x, -18)
assert.match(marker.content, /<svg/)
assert.match(marker.content, /circle cx="7"/)
assert.match(marker.content, /circle cx="26"/)
assert.match(marker.content, /circle cx="33"/)
assert.match(marker.content, /M17 10h18/)
assert.match(marker.content, /compact online selected/)
assert.equal(marker.zIndex, 2000)
// 重绘复用同一 Marker：只绑定一次，且打开更新后的车辆。
options.renderMarker({ marker, data: [{ vehicle: vehicleB }] })
handlers.forEach(fn => fn())
assert.equal(handlers.length, 1)
assert.deepEqual(opened, [1, 2])
// 单对象兼容形式、无数据与聚合点复用不能打开旧车辆。
options.renderMarker({ marker, data: { vehicle: vehicleA } })
handlers.forEach(fn => fn())
options.renderMarker({ marker, data: [] })
handlers.forEach(fn => fn())
options.renderMarker({ marker, data: [{ vehicle: vehicleB }] })
options.renderClusterMarker({ marker, count: 2 })
handlers.forEach(fn => fn())
assert.deepEqual(opened, [1, 2, 1])
console.log('Tricycle marker interaction checks passed')

// 冷启动尚无聚合插件时，普通车辆照常绘制；慢插件只影响小三轮。
let finishPlugin
let pluginRequests = 0
const regularVehicle = { id: 3, longitude: 116, latitude: 38 }
const drawn = []
context.amap.Marker = class {
  constructor(config) { drawn.push(config) }
  on() {}
  setMap() {}
}
context.amap.MarkerCluster = undefined
context.visibleVehicles.value = [regularVehicle]
context.vehicleTypeOf = vehicle => vehicle.id === 3 ? '勾臂车' : '小三轮'
context.vehicleMarkerContent = vehicle => String(vehicle.id)
context.vehicleStatusText = () => '在线'
context.clusterLoading = false
context.disposed = false
context.Message = { warning: () => {} }
context.loadAmapMarkerClusterer = () => {
  pluginRequests++
  return new Promise(resolve => { finishPlugin = resolve })
}
context.drawVehicleMarkers()
assert.equal(drawn.length, 1, '普通车辆不能等待聚合插件')
assert.equal(pluginRequests, 0, '未展示小三轮时不请求插件')
context.visibleVehicles.value = [regularVehicle, vehicleA]
context.drawVehicleMarkers()
context.drawVehicleMarkers()
assert.equal(pluginRequests, 1, '插件加载期间的重复重绘不能重复请求')
context.amap.MarkerCluster = class { constructor(_map, points) { assert.equal(points.length, 1) } }
finishPlugin(context.amap)
await new Promise(resolve => setImmediate(resolve))
assert.equal(context.clusterLoading, false)
assert.ok(context.tricycleCluster, '插件完成后自动补绘小三轮')
// 退出页面后，插件返回不能再创建覆盖物。
context.amap.MarkerCluster = undefined
context.drawVehicleMarkers()
const beforeUnmount = drawn.length
context.disposed = true
finishPlugin(context.amap)
await new Promise(resolve => setImmediate(resolve))
assert.equal(drawn.length, beforeUnmount)
console.log('Cold-start vehicle layers and deferred cluster checks passed')

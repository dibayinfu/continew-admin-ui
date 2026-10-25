import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/daas.ts', import.meta.url), 'utf8')
  .replace('import { reactive } from \'vue\'', 'const reactive = value => value')
  .replaceAll('import.meta.env.VITE_COLLECTOR_API_BASE_URL', '\'\'')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
})
const storage = new Map()
globalThis.localStorage = { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) }
globalThis.window = { setTimeout, clearTimeout }
const auth = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const response = (data) => new Response(JSON.stringify(data), { status: 200 })

// Both requests must start before either is released. Hidden IDs apply before drawing.
const started = []
const release = []
globalThis.fetch = (url) => {
  started.push(url)
  return new Promise((resolve) => release.push(() => resolve(response(url.includes('data-visibility')
    ? { hiddenBoxIds: [9], hiddenPointIds: [] }
    : { boxes: [{ id: 9 }], points: [] }))))
}
const pending = auth.collectorMapRequest()
assert.equal(started.length, 2)
release.forEach((resolve) => resolve())
assert.equal((await pending).boxes[0].id, 9)
assert.ok(auth.getHiddenBoxIds().has(9))

// A 504 must not repeat the entire aggregation request; preserve cached visibility.
let mapReads = 0
globalThis.fetch = async (url) => {
  if (url.includes('data-visibility')) return new Response('{}', { status: 500 })
  mapReads++
  return new Response('{"message":"upstream timeout"}', { status: 504 })
}
await assert.rejects(auth.collectorMapRequest(), /upstream timeout/)
assert.equal(mapReads, 1)
assert.ok(auth.getHiddenBoxIds().has(9))

// Timeout must also cover a response whose headers arrive but body stalls.
const budgets = []
globalThis.window.setTimeout = (callback, ms) => {
  budgets.push(ms)
  return setTimeout(callback, 10)
}
let canceled = false
globalThis.fetch = async (url, options) => {
  if (url.includes('data-visibility')) return response({ hiddenBoxIds: [9], hiddenPointIds: [] })
  return new Response(new ReadableStream({
    start(controller) {
      options.signal.addEventListener('abort', () => {
        canceled = true
        controller.error(new Error('aborted'))
      }, { once: true })
    },
  }))
}
await assert.rejects(auth.collectorMapRequest(), /请求超时/)
assert.ok(canceled)
assert.ok(budgets.includes(28000))
assert.ok(budgets.includes(4000))

// A slow visibility endpoint cannot prevent valid map data from being returned.
globalThis.fetch = async (url, options) => {
  if (!url.includes('data-visibility')) return response({ boxes: [{ id: 1 }], points: [] })
  return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
}
assert.equal((await auth.collectorMapRequest()).boxes[0].id, 1)
assert.ok(auth.getHiddenBoxIds().has(9))
console.log('Collector map parallel loading, retry and timeout checks passed')

// 新箱体请求必须独立于仍未返回的隐藏名单，不等待其超时。
let releaseVisibility
let visibilityFinished = false
const splitRequests = []
globalThis.fetch = async (url) => {
  splitRequests.push(url)
  if (url.includes('data-visibility')) {
    return new Promise(resolve => { releaseVisibility = () => {
      visibilityFinished = true
      resolve(response({ hiddenBoxIds: [12], hiddenPointIds: [] }))
    } })
  }
  if (url.endsWith('/points')) return response([{ id: 10 }])
  assert.ok(url.endsWith('/boxes'))
  return response([{ id: 1 }])
}
const visibility = auth.loadDataVisibility()
assert.equal((await auth.collectorMapBoxesRequest())[0].id, 1)
assert.equal(visibilityFinished, false)
assert.equal(splitRequests.filter(url => url.includes('data-visibility')).length, 1)
releaseVisibility()
await visibility
assert.ok(auth.getHiddenBoxIds().has(12))
assert.equal((await auth.collectorMapPointsRequest())[0].id, 10)
assert.ok(!splitRequests.some(url => url.includes('/box-map/data?')))
console.log('Split boxes and points endpoints, background visibility and shared requests checks passed')

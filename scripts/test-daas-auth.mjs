import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// 隔离浏览器和 Vue；执行真实工具函数，验证网络请求、存储与登录等待链路。
const source = readFileSync(new URL('../src/utils/daas.ts', import.meta.url), 'utf8')
  .replace("import { reactive } from 'vue'", 'const reactive = (value) => value')
  .replaceAll('import.meta.env.VITE_COLLECTOR_API_BASE_URL', "''")
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } })
const storage = new Map()
globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
const auth = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data })

// Redis 有效时，不依赖本地 Token，也不发送浏览器 Authorization。
globalThis.fetch = async (url, options) => {
  assert.match(url, /includeTransportTasks=false$/)
  assert.equal(options, undefined)
  return response(200, { boxes: [], points: [] })
}
await auth.collectorMapRequest(false)
assert.equal(auth.daasAuth.visible, false)
assert.equal(storage.size, 0)

// 两页同时失效：保存失败不关闭弹窗；保存成功后两页各重试一次。
let reads = 0
let saved = false
globalThis.fetch = async (url, options) => {
  if (options?.method === 'POST') {
    assert.equal(JSON.parse(options.body).token, 'new-token')
    return response(saved ? 204 : 500)
  }
  reads++
  return saved ? response(200, { boxes: [] }) : response(401)
}
const pending = [auth.collectorMapRequest(), auth.collectorMapRequest(false)]
await new Promise(resolve => setImmediate(resolve))
assert.equal(auth.daasAuth.visible, true)
await assert.rejects(auth.saveSharedDaasToken('Bearer new-token'), /500/)
assert.equal(auth.daasAuth.visible, true)
assert.equal(storage.size, 0)
saved = true
await auth.saveSharedDaasToken('Bearer new-token')
await Promise.all(pending)
assert.equal(reads, 4)
assert.equal(storage.get('sbg-monitor:token'), 'new-token')
assert.equal(auth.daasAuth.visible, false)

// 普通服务错误不弹登录框。
globalThis.fetch = async () => response(500)
await assert.rejects(auth.collectorMapRequest(), /500/)
assert.equal(auth.daasAuth.visible, false)

// 取消登录会结束等待；登录后仍失效不能无限重试。
globalThis.fetch = async () => response(401)
const canceled = auth.collectorMapRequest()
const canceledCheck = assert.rejects(canceled, /登录已取消/)
await new Promise(resolve => setImmediate(resolve))
auth.cancelDaasLogin()
await canceledCheck
const invalid = auth.collectorMapRequest()
const invalidCheck = assert.rejects(invalid, /登录后仍无法访问/)
await new Promise(resolve => setImmediate(resolve))
auth.notifyDaasLoginSuccess('invalid')
await invalidCheck
assert.equal(auth.daasAuth.expired, true)

// DAAS 普通业务失败保留 Token，不误触发登录。
globalThis.fetch = async () => response(200, { code: 500, message: '业务失败' })
await assert.rejects(auth.daasRequest('/test'), /业务失败/)
assert.equal(auth.daasAuth.token, 'invalid')
assert.equal(auth.daasAuth.visible, false)
console.log('DAAS auth regression checks passed')

// 大屏与换箱校验复用相同等待链路，成功保存后继续请求；204 无需解析 JSON。
let proxySaved = false
let proxyReads = 0
globalThis.fetch = async (url, options) => {
  if (options?.method === 'POST') { proxySaved = true; return response(204) }
  proxyReads++
  if (!proxySaved) return response(503)
  return url.endsWith('token-verify') ? response(204) : response(200, { code: 200, data: {} })
}
const proxyRequests = [auth.collectorDaasFetch('/api/collector/token-verify'), auth.collectorDaasFetch('/api/collector/large-screen/statistics')]
await new Promise(resolve => setImmediate(resolve))
assert.equal(auth.daasAuth.visible, true)
await auth.saveSharedDaasToken('shared-token')
const proxyResponses = await Promise.all(proxyRequests)
assert.equal(proxyResponses[0].status, 204)
assert.equal(proxyResponses[1].status, 200)
assert.equal(proxyReads, 4)
console.log('Collector shared auth regression checks passed')

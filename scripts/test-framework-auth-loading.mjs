import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { computed, reactive, ref } from 'vue'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../src/stores/modules/user.ts', import.meta.url), 'utf8')
  .replaceAll('import.meta.env.VITE_CLIENT_ID', JSON.stringify('test-client'))
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } })
const profile = { username: 'operator', nickname: '操作员', avatar: '', roles: ['admin'], permissions: ['*'] }
function setup(prototype) {
  let token = '', authLoads = 0, tenantId, resetCount = 0, logoutFails = false
  const calls = []
  const api = Object.fromEntries(['accountLogin', 'emailLogin', 'phoneLogin', 'socialLogin'].map(name => [name, async (...args) => {
    calls.push([name, ...args])
    return { data: { token: name, tenantId: 'tenant-1' } }
  }]))
  api.getUserInfo = async () => ({ data: profile })
  api.logout = async () => { if (logoutFails) throw new Error('network failure'); calls.push(['logout']) }
  const tenant = { setTenantId: id => { tenantId = id }, resetTenantId: () => { tenantId = undefined } }
  const modules = {
    vue: { computed, reactive, ref },
    pinia: { defineStore: (_id, factory) => factory },
    './tenant': { useTenantStore: () => tenant },
    '@/router': { resetRouter: () => { resetCount++ } },
    '@/router/guard': { resetHasRouteFlag() {} },
    '@/utils/auth': { getToken: () => token, setToken: value => { token = value }, clearToken: () => { token = '' } },
    '@/utils/prototype': { isPrototypeMode: prototype, prototypeToken: 'prototype-token', prototypeUserInfo: profile },
    '@/apis/auth/type': { AuthTypeConstants: { ACCOUNT: 'ACCOUNT', EMAIL: 'EMAIL', PHONE: 'PHONE', SOCIAL: 'SOCIAL' } },
  }
  const exports = {}
  vm.runInNewContext(outputText, { exports, localStorage: {}, require: name => {
    if (name === '@/apis/auth') { authLoads++; return api }
    assert.ok(name in modules, `Unexpected startup import: ${name}`)
    return modules[name]
  } })
  return { store: exports.useUserStore(), calls, setLogoutFails: () => { logoutFails = true }, state: () => ({ token, authLoads, tenantId, resetCount }) }
}

const prototype = setup(true)
await prototype.store.getInfo()
await prototype.store.accountLogin({ username: 'test', password: 'test' })
assert.equal(prototype.store.nickname.value, profile.nickname)
assert.equal(prototype.state().token, 'prototype-token')
await prototype.store.logout()
assert.equal(prototype.state().authLoads, 0, 'Prototype startup and logout must not load the backend HTTP chain')
assert.equal(prototype.state().token, '')

const backend = setup(false)
assert.equal(backend.state().authLoads, 0, 'Creating the store must not load backend API code')
for (const [method, args, authType] of [
  ['accountLogin', [{ username: 'test', password: 'test' }, 'tenant-code'], 'ACCOUNT'],
  ['emailLogin', [{ email: 'a@example.com', captcha: '123' }, 'tenant-code'], 'EMAIL'],
  ['phoneLogin', [{ phone: '123', captcha: '123' }, 'tenant-code'], 'PHONE'],
  ['socialLogin', ['github', { code: 'test' }], 'SOCIAL'],
]) {
  await backend.store[method](...args)
  assert.equal(backend.state().token, method)
  assert.equal(backend.state().tenantId, 'tenant-1')
  assert.equal(backend.calls.at(-1)[1].authType, authType)
  assert.equal(backend.calls.at(-1)[1].clientId, 'test-client')
  if (method !== 'socialLogin') assert.equal(backend.calls.at(-1)[2], 'tenant-code')
  else assert.equal(backend.calls.at(-1)[1].source, 'github')
}
await backend.store.getInfo()
assert.equal(backend.store.nickname.value, profile.nickname)
assert.deepEqual([...backend.store.permissions.value], ['*'])
backend.setLogoutFails()
assert.equal(await backend.store.logout(), false)
assert.equal(backend.state().token, 'socialLogin', 'Failed logout must preserve the session')
const success = setup(false)
await success.store.accountLogin({})
assert.equal(await success.store.logout(), true)
assert.equal(success.state().token, '')
assert.equal(success.state().tenantId, undefined)
assert.equal(success.state().resetCount, 1)
console.log('Lazy auth: prototype isolation, four login methods, profile, logout success/failure passed')

// 按函数导入必须使用库原有实现，树遍历及页签行为不变。
for (const name of ['browse', 'mapTree', 'eachTree', 'searchTree', 'toTreeArray']) {
  assert.equal(require(`xe-utils/${name}`), require('xe-utils')[name])
}
console.log('Framework tree helpers use the original implementations')

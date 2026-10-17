import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import { reactive, computed, ref } from 'vue'
import ts from 'typescript'

const storage = new Map([['sbg-monitor:hidden-boxes', '[375]'], ['sbg-monitor:hidden-points', '[65]']])
globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
globalThis.window = { setTimeout, clearTimeout }
globalThis.visibilityVue = { reactive }
const compile = async (source) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const auth = await compile(readFileSync(new URL('../src/utils/daas.ts', import.meta.url), 'utf8')
  .replace("import { reactive } from 'vue'", 'const { reactive } = globalThis.visibilityVue')
  .replaceAll('import.meta.env.VITE_COLLECTOR_API_BASE_URL', "''"))
const visible = computed(() => !auth.getHiddenBoxIds().has(375))
assert.equal(visible.value, false)
let releaseGet
// A GET started before saving may return old data after the PUT completes.
globalThis.fetch = async (url, options) => {
  if (options?.method === 'PUT') return new Response(null, { status: 204 })
  return new Promise(resolve => { releaseGet = () => resolve(new Response('{"hiddenBoxIds":[375],"hiddenPointIds":[65]}')) })
}
const oldRead = auth.loadDataVisibility()
await auth.saveDataVisibility({ hiddenBoxIds: [], hiddenPointIds: [65] })
assert.equal(visible.value, true, 'existing computed map filter must update immediately')
releaseGet()
await oldRead
assert.equal(visible.value, true, 'late GET must not restore the hidden ID')
assert.equal(storage.get('sbg-monitor:hidden-boxes'), '[]')

globalThis.fetch = async () => new Response('{"message":"数据库锁冲突，请重试"}', { status: 409 })
await assert.rejects(auth.saveDataVisibility({ hiddenBoxIds: [375], hiddenPointIds: [] }), /数据库锁冲突/)
assert.equal(visible.value, true)
assert.deepEqual([...auth.getHiddenPointIds()], [65])

// Timeout releases the pending save, retaining the last confirmed configuration.
globalThis.window.setTimeout = callback => setTimeout(callback, 5)
globalThis.fetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted'))))
await assert.rejects(auth.saveDataVisibility({ hiddenBoxIds: [375], hiddenPointIds: [] }), /超时/)
assert.equal(visible.value, true)
globalThis.window.setTimeout = setTimeout

// Execute the page's real handlers with isolated UI dependencies.
let rejectSave
const messages = []
globalThis.visibilityPage = {
  computed, ref, onBeforeUnmount() {}, onMounted() {}, defineOptions() {},
  Message: { success: text => messages.push(text), error: text => messages.push(text) },
  daasAuth: { token: '' }, getHiddenBoxIds: () => new Set([375]), getHiddenPointIds: () => new Set([65]),
  saveDataVisibility: () => new Promise((resolve, reject) => { rejectSave = reject }),
}
const pageSource = readFileSync(new URL('../src/views/sanitation/data-hidden-config.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const page = await compile(`const { computed, ref, onBeforeUnmount, onMounted, defineOptions, Message, daasAuth, getHiddenBoxIds, getHiddenPointIds, saveDataVisibility } = globalThis.visibilityPage;\n${pageSource.replace(/import[\s\S]*?from\s+['"][^'"]+['"]\s*/g, '').replaceAll('import.meta.env.VITE_COLLECTOR_API_BASE_URL', "''")}\nexport { toggleBox, hiddenBoxIds, hiddenPointIds, saving, showAllBoxes };`)
page.toggleBox(375, true)
assert.equal(page.saving.value, true)
assert.equal(page.hiddenBoxIds.value.has(375), false)
page.showAllBoxes()
assert.equal(messages.length, 0, 'no premature success toast')
rejectSave(new Error('HTTP 500'))
await new Promise(resolve => setTimeout(resolve, 0))
assert.equal(page.saving.value, false)
assert.equal(page.hiddenBoxIds.value.has(375), true, 'failed save rolls back the switch')
assert.deepEqual([...page.hiddenPointIds.value], [65])
assert.deepEqual(messages, ['HTTP 500'])
console.log('Visibility regression checks passed: reactive map updates, stale reads, errors, timeout, rollback')

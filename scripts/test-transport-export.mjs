import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import ts from 'typescript'

const messages = []
const downloads = []
const revoked = []
const csv = new Blob(['\uFEFF运单号,司机姓名\r\n"000123","张师傅"\r\n'], { type: 'text/csv;charset=UTF-8' })
globalThis.transportExportDependencies = {
  computed, reactive, ref, dayjs, onMounted() {}, beijingDate: () => '2026-10-23',
  Message: Object.fromEntries(['success', 'error', 'warning'].map(type => [type, text => messages.push({ type, text })])),
}
globalThis.document = {
  body: { appendChild(link) { link.attached = true } },
  createElement() {
    return {
      click() { assert.equal(this.attached, true); downloads.push({ href: this.href, name: this.download }) },
      remove() { this.attached = false },
    }
  },
}
globalThis.window = { setTimeout(callback) { callback() } }
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL
URL.createObjectURL = blob => { assert.equal(blob.type, csv.type); return 'blob:transport-export' }
URL.revokeObjectURL = url => revoked.push(url)

try {
  const pageSource = readFileSync(new URL('../src/views/sanitation/swap-statistics.vue', import.meta.url), 'utf8')
  assert.match(pageSource, /@click="exportRecords">导出 CSV/)
  assert.match(pageSource, /v-model="taskStatus"[^>]*@change="loadRecords\(1\)"/)
  const script = pageSource.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const source = `const { computed, reactive, ref, dayjs, onMounted, beijingDate, Message } = globalThis.transportExportDependencies;
    ${script.replace(/^import .*$/gm, '').replaceAll('import.meta.env.VITE_COLLECTOR_API_BASE_URL', "''")}
    export { exportRecords, exportLoading, loadRecords, from, to, township, vehicle, taskNo, driver, taskStatus, statusOptions, chineseStatus, selectedDay, pagination, records };`
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } })
  const page = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  page.from.value = '2026-10-01'; page.to.value = '2026-10-23'
  page.township.value = '马家乡'; page.vehicle.value = '豫A12345'
  page.taskNo.value = 'YD-1'; page.driver.value = '张师傅'
  page.taskStatus.value = '已完成'
  page.selectedDay.value = '2026-10-15'; page.pagination.current = 3
  let recordQuery
  globalThis.fetch = async url => {
    recordQuery = new URL(url, 'http://localhost').searchParams
    return new Response(JSON.stringify({ total: 125, list: [], statuses: ['已完成', '待装载', '收运中'] }))
  }
  await page.loadRecords(3)
  assert.equal(recordQuery.get('status'), '已完成')
  assert.deepEqual(page.statusOptions.value, ['已完成', '待装载', '收运中'])
  assert.equal(page.chineseStatus({ displayStatus: '待装载', taskStatus: 'CUSTOM_CODE' }), '待装载')

  let releaseExport
  let exportQuery
  let calls = 0
  globalThis.fetch = async url => {
    calls++
    const request = new URL(url, 'http://localhost')
    assert.equal(request.pathname, '/api/metrics/transport-statistics/export')
    exportQuery = request.searchParams
    return new Promise(resolve => { releaseExport = () => resolve(new Response(csv)) })
  }
  const exporting = page.exportRecords()
  assert.equal(page.exportLoading.value, true)
  await page.exportRecords()
  assert.equal(calls, 1, 'repeated clicks must not start concurrent exports')
  for (const key of ['from', 'to', 'township', 'vehicle', 'taskNo', 'driver', 'status']) assert.equal(exportQuery.get(key), recordQuery.get(key))
  assert.equal(exportQuery.get('from'), '2026-10-15')
  assert.equal(exportQuery.has('page'), false)
  assert.equal(exportQuery.has('size'), false)
  releaseExport()
  await exporting
  assert.equal(page.exportLoading.value, false)
  assert.deepEqual(downloads, [{ href: 'blob:transport-export', name: '运单明细_2026-10-15_2026-10-15.csv' }])
  assert.deepEqual(revoked, ['blob:transport-export'])
  assert.equal(messages.at(-1).type, 'success')

  page.selectedDay.value = ''
  globalThis.fetch = async url => {
    const query = new URL(url, 'http://localhost').searchParams
    assert.equal(query.get('from'), '2026-10-01')
    assert.equal(query.get('to'), '2026-10-23')
    return new Response(null, { status: 500 })
  }
  await page.exportRecords()
  assert.equal(page.exportLoading.value, false)
  assert.equal(downloads.length, 1, 'failed responses must not produce a download')
  assert.deepEqual(messages.at(-1), { type: 'error', text: '导出运单失败：HTTP 500' })

  globalThis.fetch = async () => { throw new Error('网络异常') }
  await page.exportRecords()
  assert.equal(page.exportLoading.value, false)
  assert.equal(messages.at(-1).type, 'error')

  // Clearing status resets pagination and keeps the day filter; stale responses cannot replace a newer status query.
  page.selectedDay.value = '2026-10-15'
  let releaseOldRecords
  globalThis.fetch = async () => new Promise(resolve => { releaseOldRecords = () => resolve(new Response(JSON.stringify({ total: 1, list: [{ taskId: 'old' }], statuses: ['已完成'] }))) })
  const oldRecords = page.loadRecords(3)
  page.taskStatus.value = ''
  globalThis.fetch = async url => {
    const query = new URL(url, 'http://localhost').searchParams
    assert.equal(query.get('status'), '')
    assert.equal(query.get('from'), '2026-10-15')
    assert.equal(query.get('page'), '1')
    return new Response(JSON.stringify({ total: 2, list: [{ taskId: 'new' }], statuses: ['已完成', '待装载'] }))
  }
  await page.loadRecords(1)
  releaseOldRecords()
  await oldRecords
  assert.equal(page.pagination.current, 1)
  assert.deepEqual(page.records.value, [{ taskId: 'new' }])
  assert.deepEqual(page.statusOptions.value, ['已完成', '待装载'])

  page.selectedDay.value = ''
  page.from.value = '2026-08-01'
  globalThis.fetch = async () => { assert.fail('invalid dates must not issue a request') }
  await page.exportRecords()
  assert.equal(messages.at(-1).type, 'warning')
  assert.equal(page.exportLoading.value, false)
  console.log('Transport checks passed: status filtering and options, clear status, stale responses, all export filters, selected day, all pages, duplicate clicks, cleanup, errors, invalid dates')
} finally {
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
}

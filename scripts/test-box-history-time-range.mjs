import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { computed, ref, watch } from 'vue'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const transpile = source => ts.transpileModule(source.replace(/^import .*$/gm, '').replace(/^export /gm, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText
const context = vm.createContext({ Date, Intl, URLSearchParams })
vm.runInContext(transpile(read('../src/utils/beijing-time.ts')), context)
vm.runInContext(transpile(read('../src/views/sanitation/box-history-metrics.ts')), context)
const now = Date.parse('2026-11-04T10:30:45+08:00')
const valid = { from: '2026-11-02T09:12', to: '2026-11-02T09:29' }
assert.equal(context.validateHistoryTimeRange(valid, now), '')
assert.equal(context.historyTimeRange(2, valid, now), valid)
for (const range of [
  { from: '', to: '' },
  { from: valid.to, to: valid.from },
  { from: valid.from, to: valid.from },
  { from: '2026-10-28T10:29', to: valid.to },
  { from: valid.from, to: '2026-11-04T10:31' },
  { from: '2026-10-28T10:30', to: '2026-11-04T10:30:01' },
]) {
  assert.ok(context.validateHistoryTimeRange(range, now))
  assert.throws(() => context.historyTimeRange(2, range, now))
}
assert.equal(context.validateHistoryTimeRange({ from: '2026-10-28T10:30', to: valid.to }, now), '')
for (const days of [1, 2, 3, 7]) {
  const range = context.historyTimeRange(days, undefined, now)
  assert.equal(context.parseBeijingDateTime(range.to) - context.parseBeijingDateTime(range.from), days * 86400000)
  assert.equal(context.validateHistoryTimeRange(range, now), '')
}

// 快捷请求不携带电脑时间；时钟快一天或慢一天均不影响参数。
for (const offset of [-86400000, 0, 86400000]) {
  context.Date = class extends Date { static now() { return now + offset } }
  for (const days of [1, 2, 3, 7]) {
    assert.equal(context.historyQueryParams(days).toString(), `days=${days}`)
  }
}
context.Date = class extends Date { static now() { return now } }
assert.equal(context.historyQueryParams(2, valid).get('from'), valid.from)
assert.equal(context.historyQueryParams(2, valid).get('to'), valid.to)
assert.equal(context.historyQueryParams(2, valid).has('days'), false)
assert.match((await context.historyRequestError({ status: 400, json: async () => ({ message: '结束时间不能晚于当前时间' }) })).message, /结束时间不能晚于当前时间（400）/)
assert.match((await context.historyRequestError({ status: 400, json: async () => ({ detail: '时间范围无效' }) })).message, /时间范围无效/)
assert.equal((await context.historyRequestError({ status: 502, json: async () => { throw new Error('HTML') } })).message, '请求失败（502）')

// 工具栏仅在合法时间提交后请求查询；回到相同快捷天数也必须清除自定义条件。
const events = [], warnings = []
context.Date = class extends Date {
  constructor(value) { super(value === undefined ? now : value) }
  static now() { return now }
}
Object.assign(context, {
  computed, ref, watch,
  defineProps: () => ({ boxNo: '65', view: 'track', days: 2, loading: false }),
  defineEmits: () => (...args) => events.push(args),
  Message: { warning: text => warnings.push(text) },
})
const toolbar = read('../src/views/sanitation/components/BoxHistoryToolbar.vue').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
vm.runInContext(transpile(toolbar), context)
context.changeDays('custom')
assert.equal(events.length, 0)
assert.equal(vm.runInContext('draftRange.value[0].slice(11)', context), '00:00')
assert.equal(vm.runInContext('draftRange.value[1].slice(11)', context), '23:59')
context.selectCalendarRange(['2026-10-31 00:00', '2026-11-02 23:59'])
assert.equal(context.calendarDayClass(new Date(2026, 9, 31))['history-calendar-start'], true)
assert.equal(context.calendarDayClass(new Date(2026, 10, 1))['history-calendar-in-range'], true)
assert.equal(context.calendarDayClass(new Date(2026, 10, 2))['history-calendar-end'], true)
assert.deepEqual(Object.keys(context.calendarDayClass(new Date(2026, 10, 5))), [])
// 今日的默认结束时间按当前分钟查询，不把未来时间发送给接口。
vm.runInContext('applyRange()', context)
assert.equal(events[0][1].from, '2026-11-02T00:00')
assert.equal(events[0][1].to, '2026-11-04T10:30')
events.length = 0
// 手动选择的历史分钟范围保持原样。
vm.runInContext("draftRange.value = ['2026-10-31 08:12', '2026-11-01 14:37']; applyRange()", context)
assert.equal(events[0][1].from, '2026-10-31T08:12')
assert.equal(events[0][1].to, '2026-11-01T14:37')
events.length = 0
vm.runInContext("draftRange.value = ['', '']; applyRange()", context)
assert.equal(warnings.length, 1)
assert.equal(events.length, 0)
// 使用相对当前时间，避免测试随日期推移过期。
vm.runInContext("draftRange.value = Object.values(historyTimeRange(1)).map(value => value.slice(0, 16)); applyRange()", context)
assert.equal(events[0][0], 'update:customRange')
assert.equal(events[0][1].from.length, 16)
assert.equal(events[1][0], 'range-change')
context.changeDays(2)
assert.deepEqual(events.slice(2).map(event => event[0]), ['update:customRange', 'update:days', 'range-change'])
assert.equal(events[2][1], undefined)
console.log('Box history minute ranges and toolbar transitions passed')

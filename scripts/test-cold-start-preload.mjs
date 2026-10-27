import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const manifest = JSON.parse(readFileSync(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'))
const script = html.match(/<script[^>]*data-startup-preload[^>]*>([\s\S]*?)<\/script>/)?.[1]
assert.ok(script, 'Build the prototype with --manifest first')
const preloadAt = html.indexOf('data-startup-preload')
const stylesheetAt = html.search(/<link[^>]+rel=["']stylesheet["']/i)
assert.ok(preloadAt < stylesheetAt, 'Startup preloading must execute before render-blocking CSS')
assert.ok(html.search(/<meta\s+charset=/i) < preloadAt, 'Charset must precede the preload script')
assert.equal([...html.matchAll(/<meta\s+charset=/gi)].length, 1, 'Keep exactly one charset declaration')
const origin = 'https://example.test'
const initialLinks = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(match => ({ href: new URL(match[1], origin).href }))
function run(hash, saved, unavailable = false) {
  const links = []
  vm.runInNewContext(script, {
    URL, Set, location: { hash, href: `${origin}/${hash}` },
    localStorage: { getItem() { if (unavailable) throw new Error('Storage disabled'); return saved } },
    document: { querySelectorAll: () => initialLinks, createElement: () => ({}), head: { appendChild: link => links.push(link) } },
  })
  return links
}
const map = Object.values(manifest).find(chunk => chunk.name === 'box-map' && chunk.file.endsWith('.js'))
for (const [saved, layout] of [[null, 'LayoutMix'], ['{"layout":"default"}', 'LayoutDefault'], ['{"layout":"columns"}', 'LayoutColumns'], ['{"layout":"top"}', 'LayoutTop'], ['{"layout":"unknown"}', 'LayoutDefault'], ['invalid-json', 'LayoutMix']]) {
  const links = run('#/sanitation/boxMap?foo=1', saved)
  const urls = links.map(link => link.href)
  assert.ok(urls.includes(`${origin}/${map.file}`))
  const selected = manifest[`src/layout/${layout}.vue`]
  assert.ok(urls.includes(`${origin}/${selected.file}`), `Preload the actual ${layout}`)
  for (const other of ['LayoutMix', 'LayoutDefault', 'LayoutColumns', 'LayoutTop'].filter(name => name !== layout)) {
    assert.ok(!urls.includes(`${origin}/${manifest[`src/layout/${other}.vue`].file}`), `Do not preload unused ${other}`)
  }
  assert.equal(new Set(urls).size, urls.length)
  assert.ok(!urls.some(url => /echarts-|http-client-|SettingDrawer|BoxHistoryCurves/.test(url)))
  assert.ok(links.some(link => link.rel === 'preload' && link.as === 'style'))
  assert.ok(links.every(link => link.crossOrigin === 'anonymous' && link.fetchPriority === 'low'))
}
assert.ok(run('', null).length, 'Root URL should warm the default home route')
assert.ok(run('#/sanitation/boxMap', null, true).length, 'Private browsing with unavailable storage must work')
assert.deepEqual(run('#/user/profile', null), [], 'Other routes must not download box-map resources')
assert.deepEqual(run('#/login', null), [], 'Login must not download box-map resources')
console.log('Cold-start preload: four layouts, route matching, cache absence, storage failure and lazy feature isolation passed')

// 执行真实版本检查调度：首次重定向不能重复取首页，后续导航也不能频繁轮询。
const source = readFileSync(new URL('../src/router/guard.ts', import.meta.url), 'utf8')
const ast = ts.createSourceFile('guard.ts', source, ts.ScriptTarget.Latest, true)
const names = new Set(['versionTag', 'versionCheckTimer', 'lastVersionCheckAt', 'scheduleVersionCheck', 'getVersionTag', 'compareTag'])
const snippets = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text)
  || ts.isVariableStatement(node) && node.declarationList.declarations.some(decl => names.has(decl.name.getText(ast))))
  .map(node => node.getText(ast)).join('\n').replaceAll('import.meta.env.PROD', 'true').replaceAll('import.meta.env.BASE_URL', "'/'")
const { outputText } = ts.transpileModule(snippets, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })
let now = 1000, seq = 0, requests = 0, updates = 0, etag = 'v1'
const timers = new Map()
const context = vm.createContext({
  Date: { now: () => now }, AbortController,
  window: { setTimeout(fn, delay) { const id = ++seq; timers.set(id, { fn, at: now + delay }); return id }, clearTimeout: id => timers.delete(id) },
  fetch: async (_url, options) => { requests++; assert.ok(options.signal); return { ok: true, headers: { get: () => etag } } },
  handleNotification: () => { updates++ },
})
vm.runInContext(outputText, context)
const settle = () => new Promise(resolve => setImmediate(resolve))
async function advance(ms) {
  now += ms
  for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn() }
  await settle()
}
context.scheduleVersionCheck(); context.scheduleVersionCheck(); context.scheduleVersionCheck()
assert.equal(timers.size, 1)
assert.equal(requests, 0)
await advance(29_999)
assert.equal(requests, 0, 'No version network traffic during startup')
await advance(1)
assert.equal(requests, 1)
assert.equal(updates, 0)
assert.equal(timers.size, 0, 'Version response must clear the timeout')
context.scheduleVersionCheck()
assert.equal(timers.size, 0, 'Navigation must reuse the recent check')
await advance(60_000)
etag = 'v2'
context.scheduleVersionCheck(); context.scheduleVersionCheck()
await advance(30_000)
assert.equal(requests, 2)
assert.equal(updates, 1, 'Version update notification must remain functional')
console.log('Version check: delayed startup, deduplicated redirects, one-minute throttle and update notifications passed')

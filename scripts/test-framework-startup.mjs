import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import less from 'less'
import { resolveConfig } from 'vite'

const require = createRequire(import.meta.url)
const compiler = require(require.resolve('@vue/compiler-sfc', { paths: [require.resolve('vue')] }))
const postcss = require(require.resolve('postcss', { paths: [require.resolve('@vue/compiler-sfc', { paths: [require.resolve('vue')] })] }))
const root = fileURLToPath(new URL('..', import.meta.url))
const read = file => readFileSync(path.join(root, file), 'utf8')
const config = await resolveConfig({ root, mode: 'prototype' }, 'build')

// 按需组件必须沿用原主题的全局和组件 token，包括轮廓按钮、表格等细节。
const globalFile = path.join(root, 'src/styles/arco-ui/index.less')
const current = read('src/styles/arco-ui/index.less')
const original = `@import '@arco-themes/vue-gi-demo/index.less';\n${current.slice(current.indexOf("@import './a-card.less'"))}`
const render = async (source, filename) => (await less.render(source, { filename, paths: [path.join(root, 'node_modules')] })).css
function rules(css) {
  const result = new Map()
  postcss.parse(css).walkRules(rule => {
    const declarations = result.get(rule.selector) || new Map()
    rule.walkDecls(decl => declarations.set(decl.prop, decl.value))
    result.set(rule.selector, declarations)
  })
  return result
}
const expected = rules(await render(original, globalFile))
let checked = 0
for (const name of ['button', 'input', 'select', 'table', 'drawer', 'modal', 'menu', 'tabs', 'checkbox']) {
  const filename = path.join(root, `node_modules/@arco-design/web-vue/es/${name}/style/index.less`)
  const source = config.css.preprocessorOptions.less.additionalData(readFileSync(filename, 'utf8'), filename)
  for (const [selector, declarations] of rules(await render(source, filename))) {
    const baseline = expected.get(selector)
    if (!baseline) continue
    for (const [property, value] of declarations) {
      if (!baseline.has(property)) continue
      const actual = value
      assert.equal(actual, baseline.get(property), `${name}: ${selector} ${property}`)
      checked++
    }
  }
}
console.log(`Framework theme: ${checked} declarations match the original styles`)

for (const file of ['src/App.vue', 'src/layout/LayoutDefault.vue', 'src/layout/LayoutColumns.vue', 'src/layout/LayoutMix.vue', 'src/layout/components/HeaderRightBar/index.vue', 'src/layout/components/HeaderRightBar/SettingDrawer.vue', 'src/views/user/message/components/NoticePopup.vue']) {
  const { descriptor, errors } = compiler.parse(read(file), { filename: file })
  assert.deepEqual(errors, [])
  compiler.compileScript(descriptor, { id: 'framework-startup-test', inlineTemplate: true })
}
assert.doesNotMatch(read('src/utils/index.ts'), /from ['"]cron-parser['"]/)
assert.match(read('src/views/schedule/job/index.vue'), /from ['"]@\/utils\/cron['"]/)
console.log('Framework templates and settings model compile')

const manifestPath = path.join(root, 'dist/.vite/manifest.json')
assert.ok(existsSync(manifestPath), 'Run pnpm exec vite build --mode prototype --manifest first')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const mapKey = Object.keys(manifest).find(key => manifest[key].name === 'box-map' && manifest[key].file.endsWith('.js'))
assert.ok(mapKey, 'Box map chunk must exist')
const forbidden = Object.values(manifest).filter(chunk => /SettingDrawer|BoxHistoryCurves|BoxAnalysisCard|BoxMetricCard|\/view\/components\/index.vue/.test(chunk.src || '')).map(chunk => chunk.file)
for (const layout of ['LayoutDefault', 'LayoutColumns', 'LayoutMix', 'LayoutTop']) {
  const visited = new Set()
  function visit(key) {
    if (visited.has(key)) return
    assert.ok(manifest[key], `Unknown chunk: ${key}`)
    visited.add(key)
    for (const dependency of manifest[key].imports || []) visit(dependency)
  }
  visit('index.html')
  visit(mapKey)
  visit('src/layout/index.vue')
  visit(`src/layout/${layout}.vue`)
  const files = [...new Set([...visited].map(key => manifest[key].file))]
  assert.ok(!files.some(file => forbidden.includes(file)), `${layout}: optional editor/charts/settings must stay lazy`)
  assert.ok(!files.some(file => /\/echarts-/.test(file)) && ![...visited].some(key => manifest[key].name === 'arco'), `${layout}: avoid eager chart/all-Arco bundles`)
  assert.ok(!files.some(file => /\/http-client-/.test(file)), `${layout}: prototype startup must not load backend HTTP code`)
  const bytes = files.reduce((sum, file) => sum + readFileSync(path.join(root, 'dist', file)).length, 0)
  const gzip = files.reduce((sum, file) => sum + gzipSync(readFileSync(path.join(root, 'dist', file))).length, 0)
  assert.ok(gzip < 380_000, `${layout}: startup gzip budget exceeded (${gzip} bytes)`)
  console.log(`${layout}: startup JS ${(bytes / 1000).toFixed(1)} KB, gzip ${(gzip / 1000).toFixed(1)} KB`)
}

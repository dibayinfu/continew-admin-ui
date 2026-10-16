import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const compiler = require(require.resolve('@vue/compiler-sfc', { paths: [require.resolve('vue')] }))
const postcss = require(require.resolve('postcss', { paths: [require.resolve('@vue/compiler-sfc', { paths: [require.resolve('vue')] })] }))

for (const file of ['box-map.vue', ...['BoxAnalysisCard', 'BoxMetricCard', 'WeatherCard'].map(name => `components/${name}.vue`)]) {
  const source = readFileSync(new URL(`../src/views/sanitation/${file}`, import.meta.url), 'utf8')
  const { descriptor, errors } = compiler.parse(source)
  assert.deepEqual(errors, [])
  const template = compiler.compileTemplate({ source: descriptor.template.content, filename: file, id: 'theme-test' })
  assert.deepEqual(template.errors, [])
  const style = descriptor.styles[0]
  const compiled = compiler.compileStyle({ source: style.content, filename: file, id: 'data-v-theme-test', scoped: true, preprocessLang: style.lang, preprocessCustomRequire: require })
  assert.deepEqual(compiled.errors, [])
  const root = postcss.parse(compiled.code)
  root.walkDecls(decl => {
    if (/box-map-marker|box-marker-new-badge|vehicle-map-marker|vehicle-cluster-marker|history-track-pin/.test(decl.parent.selector || '')) return
    assert.doesNotMatch(decl.value, /#(?:1d2129|4e5969|86909c|e5e6eb|f2f3f5|f7f8fa)\b/i, `Fixed light-theme color in ${file}: ${decl.parent.selector}`)
    if (/background/.test(decl.prop)) assert.doesNotMatch(decl.value, /#fff\b|rgb\(255 255 255 \/ 94%\)/i)
  })
  if (file === 'box-map.vue') {
    const rules = new Map()
    root.walkRules(rule => rule.walkDecls('background', decl => rules.set(rule.selector, decl.value)))
    for (const selector of ['.map-theme-picker', '.map-stat', '.vehicle-legend']) {
      assert.equal(rules.get(`${selector}[data-v-theme-test]`), 'var(--color-bg-2)')
    }
    assert.equal(rules.get('.history-overlay[data-v-theme-test]'), 'var(--color-bg-1)', '轨迹浮层必须使用不透明背景，防止浅色地图透出')
    assert.equal(rules.get('.map-card-wrap[data-v-theme-test] .amap-info-content'), 'var(--color-bg-2)', '高德 SDK 信息窗必须有正确的作用域和主题背景')
  } else if (file !== 'components/WeatherCard.vue') {
    assert.match(source, /:theme="appStore.theme === 'dark' \? 'dark' : undefined"/)
    assert.match(source, /backgroundColor: 'transparent'/)
  }
}

console.log('Box map theme tokens, SDK popup, opaque overlay and chart theme checks passed')

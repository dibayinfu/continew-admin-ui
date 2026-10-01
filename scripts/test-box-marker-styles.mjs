import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parse, compileStyle } = require(require.resolve('@vue/compiler-sfc', { paths: [require.resolve('vue')] }))
const postcss = require(require.resolve('postcss', { paths: [require.resolve('@vue/compiler-sfc', { paths: [require.resolve('vue')] })] }))

for (const [name, page, normalColor] of [
  ['box-map', 'box-map-page', '#165dff'],
  ['box-point-map', 'box-point-map-page', '#00b42a'],
]) {
  const filename = `${name}.vue`
  const source = readFileSync(new URL(`../src/views/sanitation/${filename}`, import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const style = descriptor.styles.find(item => item.scoped)
  const result = compileStyle({
    source: style.content,
    filename,
    id: `data-v-${name}`,
    scoped: true,
    preprocessLang: style.lang,
    preprocessCustomRequire: require,
  })
  assert.deepEqual(result.errors, [])
  const root = postcss.parse(result.code)
  const prefix = `.${page}[data-v-${name}] `
  const backgrounds = new Map()
  let markerRuleCount = 0
  root.walkRules(rule => {
    if (!/\.box-(?:map-marker|marker-new-badge)/.test(rule.selector)) return
    markerRuleCount++
    // SDK 注入的节点没有 Vue scope 属性，页面祖先必须保留作用域。
    for (const selector of rule.selectors) {
      assert.ok(selector.startsWith(prefix), `Leaked marker style: ${selector}`)
      rule.walkDecls('background', declaration => backgrounds.set(selector.slice(prefix.length), declaration.value))
    }
  })
  assert.ok(markerRuleCount >= 6)
  assert.equal(backgrounds.get('.box-map-marker'), normalColor)
  assert.equal(backgrounds.get('.box-map-marker.warning'), '#ff7d00')
  assert.equal(backgrounds.get('.box-map-marker.overflow'), '#f53f3f')
  assert.equal(backgrounds.get('.box-map-marker::after'), 'inherit')
}

console.log('Box marker CSS scope and status color checks passed')

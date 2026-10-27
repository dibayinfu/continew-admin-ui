import path from 'node:path'
import type { Plugin } from 'vite'
import { defaultSettings } from '../../src/config/setting'

interface BuildChunk {
  type: 'chunk'
  fileName: string
  facadeModuleId: string | null
  modules: Record<string, unknown>
  imports: string[]
  viteMetadata?: { importedCss: Set<string> }
}

/** 让无缓存首屏同时下载入口、首页和当前布局，消除路由/布局嵌套懒加载的网络串行。 */
export default function startupPreload(env: Record<string, string>): Plugin {
  let root = '', base = '/'
  const home = env.VITE_PROTOTYPE_HOME || '/sanitation/overview'
  return {
    name: 'startup-preload',
    apply: 'build',
    configResolved(config) { root = config.root; base = config.base },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (env.VITE_PROTOTYPE_MODE !== 'true' || home !== '/sanitation/boxMap' || !context.bundle) return html
        const chunks = Object.values(context.bundle).filter(item => item.type === 'chunk') as BuildChunk[]
        const byFile = new Map(chunks.map(chunk => [chunk.fileName, chunk]))
        const find = (source: string) => {
          const id = path.resolve(root, source).replace(/\\/g, '/')
          const chunk = chunks.find(chunk => chunk.facadeModuleId === id)
            || chunks.find(chunk => Object.keys(chunk.modules).some(module => module === id || module.startsWith(`${id}?`)))
          if (!chunk) throw new Error(`Missing startup chunk: ${source}`)
          return chunk.fileName
        }
        const collect = (sources: string[]) => {
          const js = new Set<string>(), css = new Set<string>()
          const visit = (file: string) => {
            if (js.has(file)) return
            js.add(file)
            const chunk = byFile.get(file)
            if (!chunk) return
            chunk.viteMetadata?.importedCss.forEach(file => css.add(file))
            chunk.imports.forEach(visit)
          }
          sources.forEach(source => visit(find(source)))
          // 已有入口预加载/样式标签无需再次创建。
          return {
            js: [...js].filter(file => !html.includes(file)),
            css: [...css].filter(file => !html.includes(file)),
          }
        }
        const common = collect(['src/views/sanitation/box-map.vue', 'src/layout/index.vue'])
        const layouts = Object.fromEntries(['default', 'columns', 'mix', 'top'].map(name => {
          const source = `src/layout/Layout${name[0].toUpperCase()}${name.slice(1)}.vue`
          const resources = collect([source])
          return [name, {
            js: resources.js.filter(file => !common.js.includes(file)),
            css: resources.css.filter(file => !common.css.includes(file)),
          }]
        }))
        const data = JSON.stringify({ base, home, defaultLayout: defaultSettings.layout, common, layouts }).replace(/</g, '\\u003c')
        return [{
          tag: 'script',
          attrs: { 'data-startup-preload': '' },
          injectTo: 'head',
          children: `(function(d){
var route=location.hash.slice(1).split(/[?#]/)[0]||'/';
if(['/',d.home,'/dashboard/workplace','/dashboard/analysis'].indexOf(route)<0)return;
var mode=d.defaultLayout;
try{mode=JSON.parse(localStorage.getItem('app')||'{}').layout||mode}catch(e){}
var layout=d.layouts[mode]||d.layouts.default;
var seen=new Set(Array.from(document.querySelectorAll('link[href]'),function(n){return n.href}));
function preload(files,style){files.forEach(function(file){
var href=new URL(d.base+file,location.href).href;if(seen.has(href))return;seen.add(href);
var link=document.createElement('link');link.rel=style?'preload':'modulepreload';if(style)link.as='style';
link.crossOrigin='anonymous';link.fetchPriority='low';link.href=href;document.head.appendChild(link);
})}
preload(d.common.js,false);preload(layout.js,false);
preload(d.common.css,true);preload(layout.css,true);
})(${data});`,
        }]
      },
    },
  }
}

import components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export default function createComponents() {
  return components({
    // 指定组件位置，默认是 src/components 自动导入自定义组件
    dirs: ['src/components'],
    extensions: ['vue', 'tsx'],
    // 不再通过 app.use(ArcoVue) 注册整套组件；仅编译并下载模板实际使用的
    // Arco 组件和图标，减小 GitHub Pages 的首屏 JS 请求。
    resolvers: [ArcoResolver({ resolveIcons: true, importStyle: false })],
    // 配置文件生成位置
    dts: './src/types/components.d.ts',
  })
}

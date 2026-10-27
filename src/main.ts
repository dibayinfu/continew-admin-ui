import { createApp } from 'vue'
import { Card, Drawer, Modal } from '@arco-design/web-vue'
// 命令式弹窗/通知没有模板节点，显式引入样式；其余由组件解析器按需引入。
import '@arco-design/web-vue/es/message/style/index.js'
import '@arco-design/web-vue/es/notification/style/index.js'
import '@arco-design/web-vue/es/modal/style/index.js'
import '@arco-design/web-vue/es/space/style/index.js'
import '@/styles/arco-ui/index.less'
import '@/styles/tailwind.css'
// import '@arco-themes/vue-gi-demo/index.less'
// import '@arco-design/web-vue/dist/arco.css'

import App from './App.vue'
import router from './router'

// 自定义过渡动画
import '@/styles/css/transition.css'

// 导入全局scss主文件
import '@/styles/index.scss'

// 支持SVG
import 'virtual:svg-icons-register'

// 自定义指令
import directives from './directives'

// 状态管理
import pinia from '@/stores'

// 对特定组件进行默认配置
Card.props.bordered = false

const app = createApp(App)
Modal._context = app._context
Drawer._context = app._context

app.use(router)
app.use(pinia)
app.use(directives)

app.mount('#app')

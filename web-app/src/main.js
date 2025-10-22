import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import * as Icons from '@ant-design/icons-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

// 注册所有图标
Object.keys(Icons).forEach(key => {
  app.component(key, Icons[key])
})

app.use(router)
app.use(Antd)

app.mount('#app')
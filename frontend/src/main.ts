import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './plugins/i18n';
import App from './App.vue'
import router from './router'
import { create, NButton, NCard, NInput, NFormItem, NAlert } from 'naive-ui'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(
  create({
    components: [NButton, NCard, NInput, NFormItem, NAlert]
  })
)

app.mount('#app')

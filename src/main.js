import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import MeriPlus from 'meri-plus'
import 'meri-plus/theme/index.css'
import 'meri-icon/lib/style.css'

import './styles/reset.css'
import './styles/global.css'

createApp(App).use(router).use(MeriPlus).mount('#app')

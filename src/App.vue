<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopbar from './components/AppTopbar.vue'

const route = useRoute()
const router = useRouter()

// 路由 meta 可以覆盖以下字段，控制 AppTopbar 行为：
//   meta.topbarType: 'regular' | 'simple' | 'standalone'   默认 'regular'
//   meta.breadcrumb: [{ label, to? }, ...]
//   meta.tabs:       [{ key, label }, ...]                 仅 regular 类型
//   meta.pageTitle:  string                                仅 standalone 类型
const topbarType = computed(() => route.meta?.topbarType || 'regular')
const breadcrumb = computed(() => route.meta?.breadcrumb || [])
const tabs = computed(() => route.meta?.tabs || [])
const pageTitle = computed(() => route.meta?.pageTitle || '')
const currentTabKey = computed(() => {
  if (route.name === 'workOrderDetail') return 'orders'
  if (route.name === 'workOrders') return 'orders'
  return route.name || ''
})

const tabRouteMap = {
  classifications: 'classifications',
  workflows: 'workflows',
  orders: 'workOrders'
}

function handleTopbarTabChange(key) {
  const name = tabRouteMap[key]
  if (name && name !== route.name) router.push({ name })
}
</script>

<template>
  <AppTopbar
    :type="topbarType"
    :breadcrumb="breadcrumb"
    :tabs="tabs"
    :pageTitle="pageTitle"
    :model-value="currentTabKey"
    @update:model-value="handleTopbarTabChange"
  />
  <main class="app-content">
    <router-view />
  </main>
</template>

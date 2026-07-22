<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopbar from './components/AppTopbar.vue'
import { useLocale } from './i18n'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()

// 路由 meta 可以覆盖以下字段，控制 AppTopbar 行为：
//   meta.topbarType: 'regular' | 'simple' | 'standalone'   默认 'regular'
//   meta.breadcrumb: [{ label, to? }, ...]
//   meta.tabs:       [{ key, label }, ...]                 仅 regular 类型
//   meta.pageTitle:  string                                仅 standalone 类型
const topbarType = computed(() => route.meta?.topbarType || 'regular')
const localizationEnabled = computed(() => route.name === 'classifications')
const localizeItems = items => items.map(item => ({
  ...item,
  label: localizationEnabled.value && item.i18nKey ? t(item.i18nKey) : item.label
}))
const breadcrumb = computed(() => localizeItems(route.meta?.breadcrumb || []))
const tabs = computed(() => localizeItems(route.meta?.tabs || []))
const pageTitle = computed(() => (
  localizationEnabled.value && route.meta?.pageTitleI18nKey
    ? t(route.meta.pageTitleI18nKey)
    : route.meta?.pageTitle || ''
))
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
    :localization-enabled="localizationEnabled"
    :show-language-switch="localizationEnabled"
    @update:model-value="handleTopbarTabChange"
  />
  <main class="app-content">
    <router-view />
  </main>
</template>

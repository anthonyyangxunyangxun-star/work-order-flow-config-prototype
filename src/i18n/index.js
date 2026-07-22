import { computed, ref } from 'vue'
import { fixedUiEn } from './fixedUiEn.js'

export const LOCALE_STORAGE_KEY = 'work-order-ui-locale'

const supportedLocales = ['zh-CN', 'en-US']

const messages = {
  'zh-CN': {
    topbar: {
      more: '更多',
      clipboard: '剪贴板',
      messages: '消息',
      calendar: '日历',
      help: '帮助',
      switchToEnglish: '切换为英文',
      switchToChinese: '切换为中文'
    },
    navigation: {
      configCenter: '配置中心',
      workOrderConfig: '工作单据配置',
      workflowConfig: '工作流程配置',
      workOrderManagement: '工作单据管理',
      documentCenter: '单据中心',
      workOrderDetail: '工作单据详情'
    },
    classification: {
      title: '工作单据配置',
      subtitle: '按基础工作类型维护项目工作分类，分类影响流程、页面和统计口径。',
      searchPlaceholder: '搜索工作分类',
      restoreSamples: '恢复分类样例',
      create: '新增分类',
      count: '{count} 个分类',
      add: '新增',
      edit: '编辑',
      delete: '删除',
      deleteConfirm: '确定删除「{name}」？',
      empty: '暂无工作分类',
      createTitle: '新增工作分类',
      editTitle: '编辑工作分类',
      workTypeLabel: '基础工作类型',
      nameLabel: '工作分类名称',
      selectPlaceholder: '请选择',
      inputPlaceholder: '请输入',
      cancel: '取消',
      save: '保存',
      loadFallback: '共享配置服务暂不可用，当前使用本地缓存。',
      saveFallback: '共享配置保存失败，已保存到当前浏览器本地。'
    },
    workTypes: {
      inspection: '巡检',
      maintenance: '维保',
      repair: '维修',
      serviceRequest: '报事服务',
      engineeringChange: '工程改造',
      assetManagement: '资产管理'
    }
  },
  'en-US': {
    topbar: {
      more: 'More',
      clipboard: 'Clipboard',
      messages: 'Messages',
      calendar: 'Calendar',
      help: 'Help',
      switchToEnglish: 'Switch to English',
      switchToChinese: 'Switch to Chinese'
    },
    navigation: {
      configCenter: 'Configuration Center',
      workOrderConfig: 'Work Order Configuration',
      workflowConfig: 'Workflow Configuration',
      workOrderManagement: 'Work Order Management',
      documentCenter: 'Work Order Center',
      workOrderDetail: 'Work Order Details'
    },
    classification: {
      title: 'Work Order Configuration',
      subtitle: 'Maintain project work classifications by base work type. Classifications affect workflows, pages, and reporting definitions.',
      searchPlaceholder: 'Search work classifications',
      restoreSamples: 'Restore Samples',
      create: 'New Classification',
      count: '{count} classifications',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      deleteConfirm: 'Delete “{name}”?',
      empty: 'No work classifications',
      createTitle: 'New Work Classification',
      editTitle: 'Edit Work Classification',
      workTypeLabel: 'Base Work Type',
      nameLabel: 'Classification Name',
      selectPlaceholder: 'Select',
      inputPlaceholder: 'Enter a name',
      cancel: 'Cancel',
      save: 'Save',
      loadFallback: 'The shared configuration service is unavailable. Local browser data is being used.',
      saveFallback: 'The shared configuration could not be saved. Changes were saved in this browser.'
    },
    workTypes: {
      inspection: 'Inspection',
      maintenance: 'Maintenance',
      repair: 'Repair',
      serviceRequest: 'Service Request',
      engineeringChange: 'Engineering Change',
      assetManagement: 'Asset Management'
    }
  }
}

function readStoredLocale() {
  if (typeof window === 'undefined') return 'zh-CN'
  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return supportedLocales.includes(storedLocale) ? storedLocale : 'zh-CN'
  } catch (error) {
    return 'zh-CN'
  }
}

const locale = ref(readStoredLocale())

function resolveMessage(key) {
  return key.split('.').reduce((value, segment) => value?.[segment], messages[locale.value])
}

function t(key, params = {}) {
  const message = resolveMessage(key)
  if (typeof message !== 'string') return key
  return formatMessage(message, params)
}

function formatMessage(message, params = {}) {
  if (typeof message !== 'string') return message ?? ''
  return message.replace(/\{(\w+)\}/g, (placeholder, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder
  ))
}

function tx(sourceText, params = {}) {
  if (typeof sourceText !== 'string') return sourceText ?? ''
  const message = locale.value === 'en-US' ? fixedUiEn[sourceText] || sourceText : sourceText
  return formatMessage(message, params)
}

function localizeColumns(columns = []) {
  return columns.map(column => ({
    ...column,
    title: typeof column.title === 'string' ? tx(column.title) : column.title,
    children: Array.isArray(column.children) ? localizeColumns(column.children) : column.children
  }))
}

function localizeOptions(options = []) {
  return options.map(option => ({
    ...option,
    label: typeof option.label === 'string' ? tx(option.label) : option.label,
    name: typeof option.name === 'string' ? tx(option.name) : option.name
  }))
}

function applyLocale(nextLocale) {
  const normalizedLocale = supportedLocales.includes(nextLocale) ? nextLocale : 'zh-CN'
  locale.value = normalizedLocale
  if (typeof document !== 'undefined') document.documentElement.lang = normalizedLocale
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale)
    } catch (error) {
      // The language still switches for the current session if storage is unavailable.
    }
  }
}

if (typeof document !== 'undefined') document.documentElement.lang = locale.value

export function useLocale() {
  const isEnglish = computed(() => locale.value === 'en-US')
  const toggleLocale = () => applyLocale(isEnglish.value ? 'zh-CN' : 'en-US')

  return {
    locale,
    isEnglish,
    t,
    tx,
    localizeColumns,
    localizeOptions,
    setLocale: applyLocale,
    toggleLocale
  }
}

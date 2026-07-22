import { createRouter, createWebHashHistory } from 'vue-router'

// TODO: Skill 在此追加业务路由。每条路由通过 meta 控制 AppTopbar：
//   meta: {
//     topbarType: 'regular',           // 或 'simple' / 'standalone'
//     breadcrumb: [{ label: '一级菜单' }, { label: '二级菜单' }],
//     tabs: [{ key: 'a', label: '标签A' }],   // 仅 regular 需要
//     pageTitle: '页面名',                     // 仅 standalone 需要
//   }
const routes = [
  {
    path: '/',
    redirect: '/classifications'
  },
  {
    path: '/classifications',
    name: 'classifications',
    component: () => import('../views/WorkClassificationConfig.vue'),
    meta: {
      topbarType: 'regular',
      breadcrumb: [
        { label: '配置中心', i18nKey: 'navigation.configCenter' },
        { label: '工作单据配置', i18nKey: 'navigation.workOrderConfig' }
      ],
      tabs: [
        { key: 'classifications', label: '工作单据配置', i18nKey: 'navigation.workOrderConfig' },
        { key: 'workflows', label: '工作流程配置', i18nKey: 'navigation.workflowConfig' },
        { key: 'orders', label: '工作单据管理', i18nKey: 'navigation.workOrderManagement' }
      ]
    }
  },
  {
    path: '/workflows',
    name: 'workflows',
    component: () => import('../views/WorkflowConfig.vue'),
    meta: {
      topbarType: 'regular',
      breadcrumb: [{ label: '配置中心' }, { label: '工作流程配置' }],
      tabs: [
        { key: 'classifications', label: '工作单据配置' },
        { key: 'workflows', label: '工作流程配置' },
        { key: 'orders', label: '工作单据管理' }
      ]
    }
  },
  {
    path: '/orders',
    name: 'workOrders',
    component: () => import('../views/WorkOrderList.vue'),
    meta: {
      topbarType: 'regular',
      breadcrumb: [{ label: '单据中心' }, { label: '工作单据管理' }],
      tabs: [
        { key: 'classifications', label: '工作单据配置' },
        { key: 'workflows', label: '工作流程配置' },
        { key: 'orders', label: '工作单据管理' }
      ]
    }
  },
  {
    path: '/orders/:orderNo',
    name: 'workOrderDetail',
    component: () => import('../views/WorkOrderDetail.vue'),
    meta: {
      topbarType: 'regular',
      breadcrumb: [{ label: '单据中心' }, { label: '工作单据详情' }],
      tabs: [
        { key: 'classifications', label: '工作单据配置' },
        { key: 'workflows', label: '工作流程配置' },
        { key: 'orders', label: '工作单据管理' }
      ]
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

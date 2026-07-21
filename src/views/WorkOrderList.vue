<template>
  <main class="order-list-page">
    <section class="order-title-row">
      <h2 class="page-title">工作单据管理</h2>
    </section>

    <section class="order-workbench">
      <aside class="order-type-rail" aria-label="工作类型">
        <button
          v-for="item in workTypeViews"
          :key="item.value"
          class="order-type-card"
          :class="{ 'order-type-card--active': activeWorkType === item.value }"
          type="button"
          @click="switchWorkType(item.value)"
        >
          <strong>{{ item.label }}</strong>
          <b>{{ typeCount(item.value) }}</b>
        </button>
      </aside>

      <section class="order-table-panel">
        <div class="filter-grid">
          <label class="filter-field filter-field--code">
            <span>单据编码</span>
            <m-input v-model="filter.orderNo" :width="'100%'" placeholder="请输入单据编码" @update:model-value="handleSearch" />
          </label>
          <label class="filter-field filter-field--name">
            <span>单据名称</span>
            <m-input v-model="filter.title" :width="'100%'" placeholder="请输入单据名称" @update:model-value="handleSearch" />
          </label>
          <label class="filter-field">
            <span>工作分类</span>
            <m-select v-model="filter.classification" :options="classificationOptions" style="width: 100%;" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field">
            <span>状态</span>
            <m-select v-model="filter.status" :options="currentStatusOptions" style="width: 100%;" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field">
            <span>当前节点</span>
            <m-select v-model="filter.currentNode" :options="currentNodeOptions" style="width: 100%;" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field">
            <span>当前责任人</span>
            <m-select v-model="filter.owner" :options="ownerOptions" style="width: 100%;" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field">
            <span>创建人</span>
            <m-select v-model="filter.creator" :options="creatorOptions" style="width: 100%;" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field">
            <span>单据来源</span>
            <m-select v-model="filter.source" :options="sourceOptions" style="width: 100%;" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field filter-field--date">
            <span>创建时间</span>
            <m-date-picker v-model="filter.createdAtRange" type="daterange" :width="220" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field filter-field--date">
            <span>状态变更时间</span>
            <m-date-picker v-model="filter.statusChangedAtRange" type="daterange" :width="220" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <label class="filter-field filter-field--date">
            <span>完结时间</span>
            <m-date-picker v-model="filter.completedAtRange" type="daterange" :width="220" placeholder="请选择" clearable @change="handleSearch" />
          </label>
          <div class="filter-actions">
            <m-button type="link" @click="handleSearch">查询</m-button>
            <span class="filter-divider"></span>
            <m-button type="link" @click="handleReset">重置</m-button>
          </div>
        </div>

        <div class="table-context">
          <strong>{{ activeView.tableTitle }}</strong>
        </div>

        <div class="state-box" v-if="loading">
          <div class="state-skeleton" v-for="item in 6" :key="item"></div>
        </div>
        <div class="state-box" v-else-if="tableData.length === 0">
          <h3>暂无匹配的{{ activeView.label }}</h3>
          <p>请清除筛选条件，或切换到其他{{ activeView.label }}。</p>
          <m-button type="primary" @click="handleReset">清除筛选</m-button>
        </div>
        <div class="table-wrap" v-else>
          <m-table :columns="columns" :dataSource="tableData" rowKey="orderNo" evenColor>
            <template #orderNo="row">
              <m-button type="link" size="small" @click="goDetail(row)">{{ row.orderNo }}</m-button>
            </template>
            <template #classification="row">
              <m-tag type="processing">{{ row.classification }}</m-tag>
            </template>
            <template #status="row">
              <m-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</m-tag>
            </template>
            <template #completedAt="row">
              {{ row.completedAt || '-' }}
            </template>
            <template #action="row">
              <m-button type="link" size="small" @click="goDetail(row)">详情</m-button>
            </template>
          </m-table>
        </div>

        <div v-if="filteredOrders.length > pageSize" class="pagination-wrap">
          <m-pagination v-model:page-num="pageNum" :total="filteredOrders.length" :page-size="pageSize" layout="total,prev,pager,next,jumper" />
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)
const activeWorkType = ref('engineeringChange')

const filter = reactive({
  orderNo: '',
  title: '',
  classification: '',
  status: '',
  currentNode: '',
  owner: '',
  creator: '',
  createdAtRange: '',
  statusChangedAtRange: '',
  completedAtRange: '',
  source: ''
})

const workTypeViews = [
  { value: 'inspection', label: '巡检', tableTitle: '巡检单据列表' },
  { value: 'maintenance', label: '维保', tableTitle: '维保单据列表' },
  { value: 'repair', label: '维修', tableTitle: '维修单据列表' },
  { value: 'engineeringChange', label: '工程改造', tableTitle: '工程改造单据列表' },
  { value: 'serviceRequest', label: '报事服务', tableTitle: '报事服务单据列表' }
]

const baseStatusOptions = [
  { value: 'processing', label: '处理中' },
  { value: 'pendingReview', label: '待验收' },
  { value: 'pendingConfirm', label: '待确认' },
  { value: 'closed', label: '已关闭' },
  { value: 'exception', label: '异常' }
]

const engineeringStatusOptions = [
  { value: 'CRTE', label: '创建' },
  { value: 'SBMT', label: '已提交' },
  { value: 'SORJ', label: 'SO（支持审批人）驳回' },
  { value: 'SOSP', label: 'SO（支持审批人）支持通过' },
  { value: 'AORJ', label: 'AO（授权审批人）驳回' },
  { value: 'AOAP', label: 'AO（授权审批人）批准' },
  { value: 'SAPRJ', label: 'SAP（预算校验）驳回' },
  { value: 'ISSD', label: '工单已签发' },
  { value: 'ACK', label: '承包商已确认' },
  { value: 'INPR', label: '承包商执行中' },
  { value: 'RTCP', label: '承包商完工上报' },
  { value: 'RJCP', label: '完工上报驳回' },
  { value: 'PLAN', label: '方案制定中' },
  { value: 'TAPR', label: '技术审批中' },
  { value: 'TERJ', label: '技术审批驳回' },
  { value: 'PCAP', label: '进度/成本审批中' },
  { value: 'PCRJ', label: '进度/成本审批驳回' },
  { value: 'FIAP', label: '财务审批中' },
  { value: 'FIRJ', label: '财务审批驳回' },
  { value: 'PRCR', label: '采购PR已创建' },
  { value: 'POGR', label: '采购PO入库完成' },
  { value: 'STOC', label: '库存已占用' },
  { value: 'DISP', label: '已排程派工' },
  { value: 'EXE', label: '改造执行中' },
  { value: 'ACPT', label: '待改造验收' },
  { value: 'ACRJ', label: '改造验收驳回' },
  { value: 'CERT', label: '完工认证' },
  { value: 'PMCR', label: 'SAP（付款申请）已创建' },
  { value: 'BHRV', label: 'SAP（批量复核）待复核' },
  { value: 'FPCP', label: 'SAP（最终付款）已完成' }
]

const orders = ref([
  {
    orderNo: 'WO-INS-20260616-001',
    title: 'B1 消防泵房日常巡检',
    workType: 'inspection',
    classification: '日常巡检',
    status: 'processing',
    currentNode: '巡检执行',
    owner: '张明',
    creator: '系统',
    createdAt: '2026-06-16 09:00:00',
    statusChangedAt: '2026-06-16 09:10:00',
    completedAt: '',
    source: '巡检计划'
  },
  {
    orderNo: 'WO-MAIN-20260616-003',
    title: '冷冻泵季度外委维保',
    workType: 'maintenance',
    classification: '外委维保',
    status: 'pendingReview',
    currentNode: '维保验收',
    owner: '工程主管',
    creator: '系统',
    createdAt: '2026-06-16 08:30:00',
    statusChangedAt: '2026-06-16 11:20:00',
    completedAt: '',
    source: '维保计划'
  },
  {
    orderNo: 'WO-REP-20260616-007',
    title: 'A 座大堂空调漏水应急抢修',
    workType: 'repair',
    classification: '应急抢修',
    status: 'exception',
    currentNode: '维修执行',
    owner: '值班负责人',
    creator: '客服专员',
    createdAt: '2026-06-16 14:45:00',
    statusChangedAt: '2026-06-16 15:30:00',
    completedAt: '',
    source: '用户报事'
  },
  {
    orderNo: 'WO-EC-20260617-001',
    title: 'A座3层会议室空调系统CAPEX改造',
    workType: 'engineeringChange',
    classification: 'CAPEX改造',
    status: 'EXE',
    currentNode: '改造执行',
    owner: '王建国',
    creator: '李建国',
    createdAt: '2026-06-17 09:30:00',
    statusChangedAt: '2026-06-25 08:00:00',
    completedAt: '',
    source: '资本项目立项'
  },
  {
    orderNo: 'WO-EC-20260618-002',
    title: 'B座2层公共走廊照明节能改造',
    workType: 'engineeringChange',
    classification: '小型工程',
    status: 'SBMT',
    currentNode: 'AO（授权审批人）审批',
    owner: '工程经理',
    creator: '赵琳',
    createdAt: '2026-06-18 09:10:00',
    statusChangedAt: '2026-06-18 16:20:00',
    completedAt: '',
    source: '运营节能专项'
  },
  {
    orderNo: 'WO-EC-20260619-003',
    title: 'C座屋面排水沟防汛整改工程',
    workType: 'engineeringChange',
    classification: '项目工程',
    status: 'INPR',
    currentNode: '承包商施工执行',
    owner: '安辰防水工程',
    creator: '安全品质部',
    createdAt: '2026-06-19 08:40:00',
    statusChangedAt: '2026-06-26 08:00:00',
    completedAt: '',
    source: '防汛专项检查'
  },
  {
    orderNo: 'WO-EC-20260620-004',
    title: 'L3餐饮商户排油烟接驳改造',
    workType: 'engineeringChange',
    classification: '租户工程',
    status: 'ACK',
    currentNode: '承包商施工执行',
    owner: '租户施工方-海悦餐饮',
    creator: '招商运营部',
    createdAt: '2026-06-20 13:20:00',
    statusChangedAt: '2026-06-24 09:30:00',
    completedAt: '',
    source: '租户工程申请'
  },
  {
    orderNo: 'SR-20260616-011',
    title: '商户报修照明闪烁',
    workType: 'serviceRequest',
    classification: '工程报修',
    status: 'pendingConfirm',
    currentNode: '用户确认',
    owner: '客服专员',
    creator: 'L3-305 商户',
    createdAt: '2026-06-16 16:20:00',
    statusChangedAt: '2026-06-16 18:10:00',
    completedAt: '',
    source: 'APP 报事'
  }
])

const activeView = computed(() => workTypeViews.find(item => item.value === activeWorkType.value) || workTypeViews[0])
const activeTypeOrders = computed(() => orders.value.filter(item => item.workType === activeWorkType.value))
const currentStatusOptions = computed(() => uniqueStatusOptions(activeTypeOrders.value))
const classificationOptions = computed(() => uniqueOptions(activeTypeOrders.value, 'classification'))
const currentNodeOptions = computed(() => uniqueOptions(activeTypeOrders.value, 'currentNode'))
const ownerOptions = computed(() => uniqueOptions(activeTypeOrders.value, 'owner'))
const creatorOptions = computed(() => uniqueOptions(activeTypeOrders.value, 'creator'))
const sourceOptions = computed(() => uniqueOptions(activeTypeOrders.value, 'source'))

const filteredOrders = computed(() => {
  return activeTypeOrders.value.filter(item => {
    return includesText(item.orderNo, filter.orderNo)
      && includesText(item.title, filter.title)
      && (!filter.classification || item.classification === filter.classification)
      && (!filter.status || item.status === filter.status)
      && (!filter.currentNode || item.currentNode === filter.currentNode)
      && (!filter.owner || item.owner === filter.owner)
      && (!filter.creator || item.creator === filter.creator)
      && (!filter.source || item.source === filter.source)
      && inDateRange(item.createdAt, filter.createdAtRange)
      && inDateRange(item.statusChangedAt, filter.statusChangedAtRange)
      && inDateRange(item.completedAt, filter.completedAtRange)
  })
})

const tableData = computed(() => filteredOrders.value.slice((pageNum.value - 1) * pageSize, pageNum.value * pageSize))

const columns = computed(() => [
  { dataIndex: 'orderNo', title: '单据编码', width: 170, fixed: 'left' },
  { dataIndex: 'title', title: '单据名称', width: 260 },
  { dataIndex: 'classification', title: '工作分类', width: 220 },
  { dataIndex: 'status', title: '状态', width: 180 },
  { dataIndex: 'currentNode', title: '当前节点', width: 190 },
  { dataIndex: 'owner', title: '当前责任人', width: 140 },
  { dataIndex: 'creator', title: '创建人', width: 120 },
  { dataIndex: 'createdAt', title: '创建时间', width: 170 },
  { dataIndex: 'statusChangedAt', title: '状态变更时间', width: 170 },
  { dataIndex: 'completedAt', title: '完结时间', width: 170 },
  { dataIndex: 'source', title: '单据来源', width: 150 },
  { dataIndex: 'action', title: '操作', width: 88, fixed: 'right' }
])

function uniqueOptions(rows, field) {
  return [...new Set(rows.map(item => item[field]).filter(Boolean))]
    .map(value => toSelectOption(value, value))
}

function uniqueStatusOptions(rows) {
  return [...new Set(rows.map(item => item.status).filter(Boolean))]
    .map(value => toSelectOption(value, statusLabel(value)))
}

function toSelectOption(value, label) {
  return {
    id: value,
    name: label,
    value,
    label
  }
}

function includesText(value, keyword) {
  if (!keyword) return true
  return String(value || '').toLowerCase().includes(String(keyword).trim().toLowerCase())
}

function statusLabel(value) {
  return [...engineeringStatusOptions, ...baseStatusOptions].find(item => item.value === value)?.label || value
}

function statusTagType(value) {
  if (['closed', 'completed', 'FPCP'].includes(value)) return 'completed'
  if (['exception', 'SORJ', 'AORJ', 'SAPRJ', 'RJCP', 'TERJ', 'PCRJ', 'FIRJ', 'ACRJ'].includes(value)) return 'error'
  if (['pendingReview', 'pendingConfirm', 'SBMT', 'SOSP', 'AOAP', 'TAPR', 'PCAP', 'FIAP', 'ACPT', 'CERT', 'PMCR', 'BHRV'].includes(value)) return 'rejected'
  return 'processing'
}

function inDateRange(value, range) {
  if (!Array.isArray(range) || range.length < 2 || !range[0] || !range[1]) return true
  const target = toTime(value)
  if (!target) return false
  const start = startOfDay(toTime(range[0]))
  const end = endOfDay(toTime(range[1]))
  return target >= start && target <= end
}

function toTime(value) {
  if (!value) return null
  if (value instanceof Date) return value.getTime()
  const normalized = String(value).replace(/-/g, '/')
  const time = new Date(normalized).getTime()
  return Number.isNaN(time) ? null : time
}

function startOfDay(time) {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function endOfDay(time) {
  const date = new Date(time)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

function handleSearch() {
  pageNum.value = 1
}

function handleReset() {
  Object.assign(filter, {
    orderNo: '',
    title: '',
    classification: '',
    status: '',
    currentNode: '',
    owner: '',
    creator: '',
    createdAtRange: '',
    statusChangedAtRange: '',
    completedAtRange: '',
    source: ''
  })
  pageNum.value = 1
}

function switchWorkType(value) {
  if (activeWorkType.value === value) return
  activeWorkType.value = value
  handleReset()
}

function typeCount(value) {
  return orders.value.filter(item => item.workType === value).length
}

function goDetail(row) {
  router.push({ name: 'workOrderDetail', params: { orderNo: row.orderNo } })
}
</script>

<style scoped>
.order-list-page {
  height: calc(100vh - 48px);
  overflow: hidden;
  padding: var(--padding-5);
  background: var(--gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--padding-4);
  box-sizing: border-box;
}

.order-title-row,
.filter-actions,
.pagination-wrap {
  display: flex;
  align-items: center;
}

.order-title-row {
  justify-content: space-between;
  flex: 0 0 auto;
}

.page-title {
  margin: 0;
  font-size: var(--font-xl);
  line-height: var(--line-xl);
  font-weight: 600;
  color: var(--title-color);
}

.order-workbench {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  gap: var(--padding-4);
}

.order-type-rail {
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--padding-2);
}

.order-type-card {
  position: relative;
  width: 100%;
  min-height: 56px;
  padding: var(--padding-3) var(--padding-4);
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  background: var(--gray-0);
  box-shadow: var(--shadow-1);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.order-type-card:hover,
.order-type-card--active {
  border-color: var(--primary-color);
  box-shadow: 0 6px 16px rgba(29, 78, 216, 0.08);
}

.order-type-card--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--primary-color);
}

.order-type-card strong {
  display: block;
  padding-right: 42px;
  color: var(--title-color);
  font-size: var(--font-md);
  line-height: var(--line-md);
}

.order-type-card b {
  position: absolute;
  right: var(--padding-3);
  top: 50%;
  min-width: 28px;
  height: 24px;
  padding: 0 var(--padding-2);
  border-radius: 12px;
  background: var(--gray-100);
  color: var(--title-color);
  text-align: center;
  line-height: 24px;
  transform: translateY(-50%);
}

.order-table-panel {
  min-width: 0;
  min-height: 0;
  padding: var(--padding-4);
  background: var(--gray-0);
  border-radius: 8px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
}

.filter-grid {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 180px minmax(220px, 1.4fr) repeat(4, minmax(150px, 1fr));
  gap: var(--padding-3);
  align-items: end;
}

.filter-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.filter-field span {
  color: var(--notes-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.filter-field--name {
  min-width: 220px;
}

.filter-field--date {
  width: 220px;
}

.filter-actions {
  height: 32px;
  gap: var(--padding-2);
  justify-content: flex-end;
}

.filter-divider {
  width: 1px;
  height: 14px;
  background: var(--gray-300);
}

.table-context {
  flex: 0 0 auto;
  margin: var(--padding-4) 0 var(--padding-3);
}

.table-context strong {
  color: var(--title-color);
  font-size: var(--font-md);
}

.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  box-shadow: 0 0 0 1px var(--gray-300);
  border-radius: 8px;
}

.table-wrap :deep(th:last-child),
.table-wrap :deep(td:last-child) {
  position: sticky;
  right: 0;
  z-index: 4;
  background: var(--gray-0);
  box-shadow: -8px 0 12px rgba(15, 23, 42, 0.06);
}

.table-wrap :deep(th:last-child) {
  z-index: 5;
}

.pagination-wrap {
  justify-content: flex-end;
  margin-top: var(--padding-4);
  flex: 0 0 auto;
}

.state-box {
  flex: 1;
  border-radius: 8px;
  background: var(--gray-100);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--padding-3);
  color: var(--notes-color);
}

.state-box h3 {
  margin: 0;
  color: var(--title-color);
}

.state-box p {
  margin: 0;
}

.state-skeleton {
  width: 92%;
  height: 32px;
  border-radius: 8px;
  background: var(--gray-0);
}

@media (max-width: 1320px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(180px, 1fr));
  }

  .filter-field--date {
    width: auto;
  }
}

@media (max-width: 1180px) {
  .order-list-page {
    overflow: auto;
    height: auto;
    min-height: calc(100vh - 48px);
  }

  .order-workbench {
    grid-template-columns: 1fr;
  }

  .order-type-rail {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .filter-grid,
  .order-type-rail {
    grid-template-columns: 1fr;
  }
}
</style>

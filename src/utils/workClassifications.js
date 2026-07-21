import { fetchSharedConfig, saveSharedConfig } from './sharedConfigApi'

export const CLASSIFICATION_STORAGE_KEY = 'work-order-classifications'
export const CLASSIFICATION_MIGRATION_KEY = 'work-order-classifications-engineering-v4'
const SHARED_CLASSIFICATION_CONFIG_KEY = 'work-classifications'

export const workTypeOptions = [
  { value: 'inspection', label: '巡检' },
  { value: 'maintenance', label: '维保' },
  { value: 'repair', label: '维修' },
  { value: 'serviceRequest', label: '报事服务' },
  { value: 'engineeringChange', label: '工程改造' },
  { value: 'assetManagement', label: '资产管理' }
]

export const baseClassifications = [
  { id: 'cls-001', classificationCode: 'INS-DAY', workTypeCode: 'inspection', classificationName: '日常巡检' },
  { id: 'cls-002', classificationCode: 'INS-ROOM', workTypeCode: 'inspection', classificationName: '设备房巡检' },
  { id: 'cls-003', classificationCode: 'INS-SYSTEM', workTypeCode: 'inspection', classificationName: '专业系统巡检' },
  { id: 'cls-004', classificationCode: 'INS-OUT', workTypeCode: 'inspection', classificationName: '外委巡检' },
  { id: 'cls-005', classificationCode: 'INS-FIRE', workTypeCode: 'inspection', classificationName: '消防安全巡检' },
  { id: 'cls-006', classificationCode: 'INS-TEMP', workTypeCode: 'inspection', classificationName: '临时巡检' },
  { id: 'cls-007', classificationCode: 'MAIN-EQUIP', workTypeCode: 'maintenance', classificationName: '专业设备维保' },
  { id: 'cls-008', classificationCode: 'MAIN-SEASON', workTypeCode: 'maintenance', classificationName: '季节切换维保' },
  { id: 'cls-009', classificationCode: 'MAIN-OUT', workTypeCode: 'maintenance', classificationName: '外委维保' },
  { id: 'cls-010', classificationCode: 'MAIN-REGULAR', workTypeCode: 'maintenance', classificationName: '计划例行维保' },
  { id: 'cls-011', classificationCode: 'MAIN-MANDATORY', workTypeCode: 'maintenance', classificationName: '法定检测/强检' },
  { id: 'cls-012', classificationCode: 'MAIN-REVIEW', workTypeCode: 'maintenance', classificationName: '维保复核' },
  { id: 'cls-013', classificationCode: 'REP-SIMPLE', workTypeCode: 'repair', classificationName: '简单维修' },
  { id: 'cls-014', classificationCode: 'REP-PLAN', workTypeCode: 'repair', classificationName: '计划维修' },
  { id: 'cls-015', classificationCode: 'REP-DIAG', workTypeCode: 'repair', classificationName: '故障排查维修' },
  { id: 'cls-016', classificationCode: 'REP-SYSTEM', workTypeCode: 'repair', classificationName: '专业系统维修' },
  { id: 'cls-017', classificationCode: 'REP-EMG', workTypeCode: 'repair', classificationName: '应急抢修' },
  { id: 'cls-018', classificationCode: 'REP-OUT', workTypeCode: 'repair', classificationName: '外委维修' },
  { id: 'cls-019', classificationCode: 'REP-SOURCE', workTypeCode: 'repair', classificationName: '维修来源确认' },
  { id: 'cls-020', classificationCode: 'REP-APPROVAL', workTypeCode: 'repair', classificationName: '维修审批' },
  { id: 'cls-021', classificationCode: 'SR-USER', workTypeCode: 'serviceRequest', classificationName: '用户报事' },
  { id: 'cls-022', classificationCode: 'SR-TRANSFER', workTypeCode: 'serviceRequest', classificationName: '用户报修转维修' },
  { id: 'cls-023', classificationCode: 'SR-UPGRADE', workTypeCode: 'serviceRequest', classificationName: '报事升级' },
  { id: 'cls-024', classificationCode: 'SR-DERIVED', workTypeCode: 'serviceRequest', classificationName: '报事派生工单' },
  { id: 'cls-025', classificationCode: 'SR-CONFIRM', workTypeCode: 'serviceRequest', classificationName: '用户确认' },
  { id: 'cls-026', classificationCode: 'ENG-TENANT', workTypeCode: 'engineeringChange', classificationName: '租户工程' },
  { id: 'cls-027', classificationCode: 'ENG-MINOR', workTypeCode: 'engineeringChange', classificationName: '小型工程' },
  { id: 'cls-028', classificationCode: 'ENG-PROJECT', workTypeCode: 'engineeringChange', classificationName: '项目工程' },
  { id: 'cls-029', classificationCode: 'ENG-CAPITAL', workTypeCode: 'engineeringChange', classificationName: 'CAPEX改造' },
  { id: 'cls-035', classificationCode: 'AST-STATE', workTypeCode: 'assetManagement', classificationName: '资产状态更新' },
  { id: 'cls-036', classificationCode: 'AST-ARCHIVE', workTypeCode: 'assetManagement', classificationName: '资产归档' },
  { id: 'cls-037', classificationCode: 'AST-LEDGER', workTypeCode: 'assetManagement', classificationName: '资产台账复核' }
]

const legacyEngineeringNames = new Set([
  '小型改造',
  '系统改造',
  '合规整改',
  '大中修工程',
  '外委工程',
  '工程改造申请初审',
  '改造审批',
  '改造施工',
  '改造验收',
  'Tenant Works 租户工程',
  'Minor Works 小型工程',
  'Project Works 项目工程',
  'Capital Project Works 资本项目工程'
])

const workTypePrefixMap = {
  inspection: 'INS',
  maintenance: 'MAIN',
  repair: 'REP',
  serviceRequest: 'SR',
  engineeringChange: 'ENG',
  assetManagement: 'AST'
}

function baseMatchFor(item) {
  return baseClassifications.find(row => row.id === item?.id)
    || baseClassifications.find(row => row.workTypeCode === item?.workTypeCode && row.classificationName === item?.classificationName)
}

function customClassificationCode(workTypeCode, id, index = 0) {
  const prefix = workTypePrefixMap[workTypeCode] || 'CLS'
  const suffix = String(id || index + 1)
    .replace(/^cls-/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
  return `${prefix}-CUSTOM-${suffix || index + 1}`
}

export function createWorkClassification(item, index = 0) {
  const matched = baseMatchFor(item)
  const id = item?.id || matched?.id || `cls-${Date.now()}-${index}`
  const workTypeCode = item?.workTypeCode || matched?.workTypeCode || 'inspection'
  const classificationName = String(item?.classificationName || matched?.classificationName || '').trim()
  return {
    id,
    classificationCode: String(item?.classificationCode || item?.code || item?.value || matched?.classificationCode || customClassificationCode(workTypeCode, id, index)).trim(),
    workTypeCode,
    classificationName
  }
}

export function normalizeWorkClassifications(rows = []) {
  return rows
    .map((item, index) => createWorkClassification(item, index))
    .filter(item => item.workTypeCode && item.classificationCode && item.classificationName)
}

export function migrateWorkClassifications(rows = []) {
  const normalized = normalizeWorkClassifications(rows.length > 0 ? rows : baseClassifications)
  const migrationDone = typeof window !== 'undefined' && window.localStorage.getItem(CLASSIFICATION_MIGRATION_KEY) === 'done'
  const hasLegacyEngineering = normalized.some(item => item.workTypeCode === 'engineeringChange' && legacyEngineeringNames.has(item.classificationName))
  const baseEngineeringRows = baseClassifications.filter(item => item.workTypeCode === 'engineeringChange')

  if (hasLegacyEngineering) {
    const baseEngineeringNames = new Set(baseEngineeringRows.map(item => item.classificationName))
    const customEngineeringRows = normalized.filter(item => (
      item.workTypeCode === 'engineeringChange'
      && !legacyEngineeringNames.has(item.classificationName)
      && !baseEngineeringNames.has(item.classificationName)
    ))
    return [
      ...normalized.filter(item => item.workTypeCode !== 'engineeringChange'),
      ...baseEngineeringRows,
      ...customEngineeringRows
    ]
  }

  if (migrationDone) return normalized

  const missingBaseEngineeringRows = baseEngineeringRows
    .filter(item => !normalized.some(row => row.workTypeCode === 'engineeringChange' && row.classificationCode === item.classificationCode))
  return missingBaseEngineeringRows.length > 0 ? [...normalized, ...missingBaseEngineeringRows] : normalized
}

export function loadWorkClassifications() {
  if (typeof window === 'undefined') return normalizeWorkClassifications(baseClassifications)
  try {
    const raw = window.localStorage.getItem(CLASSIFICATION_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : baseClassifications
    if (!Array.isArray(parsed)) return normalizeWorkClassifications(baseClassifications)
    const migrated = migrateWorkClassifications(parsed)
    const changed = JSON.stringify(normalizeWorkClassifications(parsed)) !== JSON.stringify(migrated)
    if (raw && (changed || window.localStorage.getItem(CLASSIFICATION_MIGRATION_KEY) !== 'done')) {
      window.localStorage.setItem(CLASSIFICATION_STORAGE_KEY, JSON.stringify(migrated))
      window.localStorage.setItem(CLASSIFICATION_MIGRATION_KEY, 'done')
    }
    return migrated.map(item => ({ ...item }))
  } catch (error) {
    return normalizeWorkClassifications(baseClassifications)
  }
}

export function hasLocalWorkClassifications() {
  return typeof window !== 'undefined' && !!window.localStorage.getItem(CLASSIFICATION_STORAGE_KEY)
}

export function saveWorkClassifications(rows = []) {
  if (typeof window === 'undefined') return
  const normalized = normalizeWorkClassifications(rows)
  window.localStorage.setItem(CLASSIFICATION_STORAGE_KEY, JSON.stringify(normalized))
  window.localStorage.setItem(CLASSIFICATION_MIGRATION_KEY, 'done')
}

export async function loadSharedWorkClassifications() {
  const hadLocalRows = hasLocalWorkClassifications()
  const localRows = loadWorkClassifications()
  try {
    const response = await fetchSharedConfig(SHARED_CLASSIFICATION_CONFIG_KEY)
    if (response.exists && Array.isArray(response.data)) {
      const migrated = migrateWorkClassifications(response.data)
      saveWorkClassifications(migrated)
      return { ok: true, source: 'server', data: migrated }
    }
    if (hadLocalRows) {
      await saveSharedWorkClassifications(localRows)
      return { ok: true, source: 'bootstrapped', data: localRows }
    }
    return { ok: true, source: 'local-default', data: localRows }
  } catch (error) {
    return { ok: false, source: 'local', data: localRows, error }
  }
}

export async function saveSharedWorkClassifications(rows = []) {
  const normalized = normalizeWorkClassifications(rows)
  saveWorkClassifications(normalized)
  try {
    const response = await saveSharedConfig(SHARED_CLASSIFICATION_CONFIG_KEY, normalized)
    return { ok: true, source: 'server', data: normalized, response }
  } catch (error) {
    return { ok: false, source: 'local', data: normalized, error }
  }
}

export function workClassificationOptions(rows = loadWorkClassifications()) {
  return normalizeWorkClassifications(rows).map(item => ({
    value: item.classificationCode,
    label: item.classificationName,
    workTypeCode: item.workTypeCode
  }))
}

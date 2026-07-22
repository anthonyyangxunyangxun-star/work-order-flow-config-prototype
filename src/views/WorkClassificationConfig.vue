<template>
  <main class="classification-page">
    <section class="classification-title-row">
      <div>
        <h2 class="page-title">{{ t('classification.title') }}</h2>
        <p class="classification-subtitle">{{ currentSubtitle }}</p>
        <p v-if="saveError" class="classification-sync-warning">{{ saveError }}</p>
      </div>
      <div class="classification-actions">
        <m-search v-model="keyword" :width="240" :placeholder="t('classification.searchPlaceholder')" />
        <m-button type="default" @click="resetClassifications">{{ t('classification.restoreSamples') }}</m-button>
        <m-button type="primary" @click="openCreate()">{{ t('classification.create') }}</m-button>
      </div>
    </section>

    <section class="classification-board">
      <article v-for="type in treeData" :key="type.value" class="classification-type-card">
        <header class="classification-type-head">
          <div>
            <strong>{{ type.label }}</strong>
            <span>{{ t('classification.count', { count: type.children.length }) }}</span>
          </div>
          <m-button type="link" size="small" @click="openCreate(type.value)">{{ t('classification.add') }}</m-button>
        </header>

        <div v-if="type.children.length > 0" class="classification-node-list">
          <div v-for="item in type.children" :key="item.id" class="classification-node">
            <span>{{ item.classificationName }}</span>
            <div class="classification-node-actions">
              <m-button type="link" size="small" @click="openEdit(item)">{{ t('classification.edit') }}</m-button>
              <m-popconfirm
                :content="t('classification.deleteConfirm', { name: item.classificationName })"
                status="danger"
                @confirm="deleteClassification(item)"
              >
                <m-button type="link" size="small">{{ t('classification.delete') }}</m-button>
              </m-popconfirm>
            </div>
          </div>
        </div>

        <div v-else class="classification-empty-node">{{ t('classification.empty') }}</div>
      </article>
    </section>

    <m-modal v-model:visible="editorVisible" :title="editorMode === 'create' ? t('classification.createTitle') : t('classification.editTitle')">
      <template #content>
        <m-form :model="editorForm" label-position="left" :label-width="formLabelWidth">
          <m-form-item :label="t('classification.workTypeLabel')" required>
            <m-select v-model="editorForm.workTypeCode" :options="toSelectOptions(localizedWorkTypeOptions)" style="width: 240px;" :placeholder="t('classification.selectPlaceholder')" />
          </m-form-item>
          <m-form-item :label="t('classification.nameLabel')" required>
            <m-input v-model="editorForm.classificationName" :width="240" :placeholder="t('classification.inputPlaceholder')" />
          </m-form-item>
        </m-form>
      </template>
      <template #footer>
        <m-button type="default" @click="editorVisible = false">{{ t('classification.cancel') }}</m-button>
        <m-button type="primary" @click="saveClassification">{{ t('classification.save') }}</m-button>
      </template>
    </m-modal>

  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  baseClassifications,
  createWorkClassification,
  loadSharedWorkClassifications,
  loadWorkClassifications,
  saveSharedWorkClassifications,
  saveWorkClassifications,
  workTypeOptions
} from '../utils/workClassifications'
import { useLocale } from '../i18n'

const { isEnglish, t } = useLocale()
const classifications = ref(loadClassifications())
const keyword = ref('')
const editorVisible = ref(false)
const editorMode = ref('create')
const syncErrorKey = ref('')
const editorForm = reactive({
  id: '',
  classificationCode: '',
  workTypeCode: 'inspection',
  classificationName: ''
})

const currentSubtitle = computed(() => t('classification.subtitle'))
const saveError = computed(() => syncErrorKey.value ? t(syncErrorKey.value) : '')
const formLabelWidth = computed(() => isEnglish.value ? '160px' : '112px')
const localizedWorkTypeOptions = computed(() => workTypeOptions.map(type => ({
  ...type,
  label: t(`workTypes.${type.value}`)
})))

onMounted(async () => {
  const result = await loadSharedWorkClassifications()
  classifications.value = result.data
  syncErrorKey.value = result.ok ? '' : 'classification.loadFallback'
})

const treeData = computed(() => workTypeOptions.map(type => ({
  ...type,
  label: t(`workTypes.${type.value}`),
  children: classifications.value.filter(item => {
    const matchType = item.workTypeCode === type.value
    const matchKeyword = !keyword.value || item.classificationName.includes(keyword.value)
    return matchType && matchKeyword
  })
})))

function openCreate(workTypeCode = 'inspection') {
  editorMode.value = 'create'
  Object.assign(editorForm, {
    id: '',
    classificationCode: '',
    workTypeCode,
    classificationName: ''
  })
  editorVisible.value = true
}

function openEdit(item) {
  editorMode.value = 'edit'
  Object.assign(editorForm, item)
  editorVisible.value = true
}

async function saveClassification() {
  if (!editorForm.classificationName) return
  const payload = createWorkClassification({ ...editorForm }, classifications.value.length)
  if (editorMode.value === 'edit') {
    const index = classifications.value.findIndex(item => item.id === payload.id)
    if (index >= 0) classifications.value.splice(index, 1, payload)
  } else {
    classifications.value.push(payload)
  }
  await saveClassifications()
  editorVisible.value = false
}

async function deleteClassification(item) {
  const index = classifications.value.findIndex(row => row.id === item.id)
  if (index >= 0) {
    classifications.value.splice(index, 1)
    await saveClassifications()
  }
}

async function resetClassifications() {
  classifications.value = baseClassifications.map(item => ({ ...item }))
  await saveClassifications()
  keyword.value = ''
}

function loadClassifications() {
  return loadWorkClassifications()
}

async function saveClassifications() {
  saveWorkClassifications(classifications.value)
  const result = await saveSharedWorkClassifications(classifications.value)
  syncErrorKey.value = result.ok ? '' : 'classification.saveFallback'
}

function toSelectOptions(options) {
  return options.map(item => ({
    id: item.value,
    name: item.label
  }))
}
</script>

<style scoped>
.classification-page {
  height: calc(100vh - 48px);
  overflow: hidden;
  padding: var(--padding-4);
  background: var(--gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--padding-3);
}

.classification-title-row,
.classification-actions,
.classification-type-head,
.classification-node,
.classification-node-actions {
  display: flex;
  align-items: center;
}

.classification-title-row {
  justify-content: space-between;
  gap: var(--padding-4);
  min-width: 0;
}

.page-title {
  margin: 0;
  color: var(--title-color);
  font-size: var(--font-xl);
  line-height: var(--line-xl);
  font-weight: 600;
}

.classification-subtitle,
.classification-type-head span,
.classification-empty-node {
  color: var(--notes-color);
  font-size: var(--font-m);
  line-height: var(--line-m);
}

.classification-subtitle {
  margin: var(--padding-1) 0 0;
}

.classification-sync-warning {
  margin: var(--padding-1) 0 0;
  color: #b7791f;
  font-size: var(--font-s);
  line-height: var(--line-s);
}

.classification-actions {
  gap: var(--padding-2);
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.classification-board {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--padding-3);
  overflow-y: auto;
}

.classification-type-card {
  min-height: 0;
  background: var(--gray-0);
  border-radius: var(--xl-radius);
  box-shadow: var(--shadow-1);
  padding: var(--padding-3);
  display: flex;
  flex-direction: column;
}

.classification-type-head {
  justify-content: space-between;
  gap: var(--padding-3);
  padding-bottom: var(--padding-2);
  box-shadow: inset 0 -1px 0 var(--divider-bg-color);
}

.classification-type-head strong {
  display: block;
  color: var(--title-color);
  font-size: var(--font-l);
  line-height: var(--line-l);
}

.classification-node-list {
  min-height: 0;
  overflow-y: auto;
  padding-top: var(--padding-2);
  display: flex;
  flex-direction: column;
  gap: var(--padding-1);
}

.classification-node {
  justify-content: space-between;
  gap: var(--padding-3);
  min-height: var(--common-size);
  border-radius: var(--big-radius);
  padding: var(--padding-2) var(--padding-3);
  background: var(--gray-100);
  transition: all 0.2s ease;
}

.classification-node:hover {
  background: var(--gray-0);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.classification-node span {
  min-width: 0;
  color: var(--title-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.classification-node-actions {
  flex: 0 0 auto;
  gap: var(--padding-1);
}

.classification-empty-node {
  margin-top: var(--padding-2);
  border-radius: var(--big-radius);
  padding: var(--padding-3);
  background: var(--gray-100);
}

.form-error {
  margin: var(--padding-2) 0 0;
  color: var(--danger-color);
  font-size: var(--font-m);
}
</style>

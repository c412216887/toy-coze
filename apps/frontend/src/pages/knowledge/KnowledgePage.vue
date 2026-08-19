<template>
  <div class="knowledge-page">
    <!-- 顶部标题栏 -->
    <div class="knowledge-page__header">
      <h2 class="knowledge-page__title">知识库</h2>
      <button class="btn btn--primary" @click="openCreateDialog">
        <svg class="btn__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3.333v9.334M3.333 8h9.334" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        新建知识库
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="knowledge-page__loading">
      <span class="spinner" />
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="knowledgeBases.length === 0" class="knowledge-page__empty">
      <svg class="knowledge-page__empty-icon" viewBox="0 0 80 80" fill="none">
        <rect x="10" y="16" width="60" height="52" rx="6" fill="#f3f4f6" />
        <rect x="18" y="26" width="28" height="4" rx="2" fill="#d1d5db" />
        <rect x="18" y="36" width="44" height="3" rx="1.5" fill="#e5e7eb" />
        <rect x="18" y="45" width="36" height="3" rx="1.5" fill="#e5e7eb" />
        <circle cx="58" cy="56" r="14" fill="#6366f1" />
        <path d="M58 50v12M52 56h12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" />
      </svg>
      <p class="knowledge-page__empty-text">暂无知识库</p>
      <button class="btn btn--primary" @click="openCreateDialog">创建第一个知识库</button>
    </div>

    <!-- 知识库列表 -->
    <div v-else class="knowledge-list">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.kb_code"
        class="kb-card"
        @click="openKnowledgeBase(kb)"
      >
        <div class="kb-card__body">
          <div class="kb-card__name">{{ kb.name }}</div>
          <div class="kb-card__code">{{ kb.kb_code }}</div>
          <p class="kb-card__desc">{{ kb.description || '暂无描述' }}</p>
          <div class="kb-card__meta">
            <span class="kb-card__doc-count">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 2A1.5 1.5 0 0 1 4 .5h5.379a.5.5 0 0 1 .353.146l2.621 2.622A.5.5 0 0 1 12.5 3.62V12A1.5 1.5 0 0 1 11 13.5H4A1.5 1.5 0 0 1 2.5 12V2Z" stroke="#9ca3af" stroke-linejoin="round"/>
                <path d="M9.5.5V3A.5.5 0 0 0 10 3.5h2.5" stroke="#9ca3af" stroke-linejoin="round"/>
              </svg>
              {{ kb.doc_count }} 个文档
            </span>
            <span class="kb-card__date">{{ formatDate(kb.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 文档管理抽屉 -->
    <Transition name="drawer-fade">
      <div v-if="activeKb" class="doc-drawer-overlay" @click.self="closeDrawer">
        <div class="doc-drawer">
          <div class="doc-drawer__header">
            <div>
              <div class="doc-drawer__title">{{ activeKb.name }}</div>
              <div class="doc-drawer__subtitle">{{ activeKb.kb_code }}</div>
            </div>
            <button class="dialog__close" @click="closeDrawer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="doc-drawer__upload">
            <label class="upload-btn" :class="{ 'upload-btn--loading': uploading }">
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,.docx,.md,.txt"
                class="upload-btn__input"
                :disabled="uploading"
                @change="handleFileChange"
              />
              <span v-if="uploading" class="spinner spinner--sm spinner--white" />
              <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v9M4 6l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M2 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
              {{ uploading ? '上传中...' : '上传文档' }}
            </label>
            <span class="doc-drawer__hint">支持 PDF / Word / Markdown / TXT</span>
          </div>

          <div v-if="docsLoading" class="doc-drawer__loading">
            <span class="spinner spinner--sm" />
            <span>加载文档...</span>
          </div>

          <div v-else-if="documents.length === 0" class="doc-drawer__empty">
            暂无文档，请上传
          </div>

          <div v-else class="doc-table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>大小</th>
                  <th>状态</th>
                  <th>分块</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id">
                  <td class="doc-table__name" :title="doc.filename">{{ doc.filename }}</td>
                  <td>{{ formatSize(doc.file_size) }}</td>
                  <td>
                    <span class="status-badge" :class="`status-badge--${doc.status}`">
                      {{ statusLabel(doc.status) }}
                    </span>
                  </td>
                  <td>{{ doc.status === 'success' ? doc.chunk_count : '-' }}</td>
                  <td>
                    <button
                      class="btn btn--danger btn--sm"
                      :disabled="deletingDocId === doc.id"
                      @click.stop="confirmDeleteDoc(doc)"
                    >
                      {{ deletingDocId === doc.id ? '删除中' : '删除' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 新建知识库 Dialog -->
    <Transition name="dialog-fade">
      <div v-if="showCreateDialog" class="dialog-overlay" @click.self="closeCreateDialog">
        <div class="dialog">
          <div class="dialog__header">
            <span class="dialog__title">新建知识库</span>
            <button class="dialog__close" @click="closeCreateDialog">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="dialog__body">
            <div class="form-field">
              <label class="form-field__label">
                知识库名称 <span class="form-field__required">*</span>
              </label>
              <input
                v-model="createForm.name"
                class="form-field__input"
                :class="{ 'form-field__input--error': createErrors.name }"
                placeholder="例如：产品文档"
                @keyup.enter="submitCreate"
              />
              <span v-if="createErrors.name" class="form-field__error">{{ createErrors.name }}</span>
            </div>
            <div class="form-field">
              <label class="form-field__label">
                知识库 Code <span class="form-field__required">*</span>
              </label>
              <input
                v-model="createForm.kb_code"
                class="form-field__input"
                :class="{ 'form-field__input--error': createErrors.kb_code }"
                placeholder="例如：product-docs（字母、数字、中划线）"
                @keyup.enter="submitCreate"
              />
              <span v-if="createErrors.kb_code" class="form-field__error">{{ createErrors.kb_code }}</span>
            </div>
            <div class="form-field">
              <label class="form-field__label">描述（可选）</label>
              <input
                v-model="createForm.description"
                class="form-field__input"
                placeholder="知识库用途描述"
                @keyup.enter="submitCreate"
              />
            </div>
          </div>
          <div class="dialog__footer">
            <button class="btn btn--ghost" @click="closeCreateDialog">取消</button>
            <button class="btn btn--primary" :disabled="creating" @click="submitCreate">
              <span v-if="creating" class="spinner spinner--sm spinner--white" />
              {{ creating ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 删除文档确认 Dialog -->
    <Transition name="dialog-fade">
      <div v-if="docToDelete" class="dialog-overlay" @click.self="docToDelete = null">
        <div class="dialog dialog--sm">
          <div class="dialog__header">
            <span class="dialog__title">删除文档</span>
            <button class="dialog__close" @click="docToDelete = null">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="dialog__body">
            <p class="dialog__confirm-text">
              确定删除 <strong>{{ docToDelete.filename }}</strong>？此操作会同步删除向量数据，无法撤销。
            </p>
          </div>
          <div class="dialog__footer">
            <button class="btn btn--ghost" @click="docToDelete = null">取消</button>
            <button class="btn btn--danger" :disabled="!!deletingDocId" @click="executeDeleteDoc">
              <span v-if="deletingDocId" class="spinner spinner--sm spinner--white" />
              {{ deletingDocId ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { knowledgeApi, type KnowledgeBase, type KnowledgeDocument } from '@/api/knowledge'
import { BizError } from '@/api/request'

/* ─── 知识库列表 ─── */
const loading = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])

async function fetchKnowledgeBases() {
  // Python 微服务没有「列表所有知识库」接口，前端维护本地列表
  loading.value = true
  try {
    const codes: string[] = JSON.parse(localStorage.getItem('coze_kb_codes') ?? '[]')
    const results = await Promise.allSettled(codes.map((code) => knowledgeApi.getBase(code)))
    knowledgeBases.value = results
      .filter((r): r is PromiseFulfilledResult<KnowledgeBase> => r.status === 'fulfilled')
      .map((r) => r.value)
  } finally {
    loading.value = false
  }
}

function persistKbCodes() {
  localStorage.setItem(
    'coze_kb_codes',
    JSON.stringify(knowledgeBases.value.map((kb) => kb.kb_code)),
  )
}

onMounted(fetchKnowledgeBases)

/* ─── 创建知识库 ─── */
const showCreateDialog = ref(false)
const creating = ref(false)
const createForm = ref({ name: '', kb_code: '', description: '' })
const createErrors = ref<Record<string, string>>({})

function openCreateDialog() {
  createForm.value = { name: '', kb_code: '', description: '' }
  createErrors.value = {}
  showCreateDialog.value = true
}

function closeCreateDialog() {
  showCreateDialog.value = false
}

function validateCreate(): boolean {
  const errors: Record<string, string> = {}
  if (!createForm.value.name.trim()) {
    errors['name'] = '请输入知识库名称'
  }
  if (!createForm.value.kb_code.trim()) {
    errors['kb_code'] = '请输入知识库 Code'
  } else if (!/^[a-z][a-z0-9_-]{0,63}$/.test(createForm.value.kb_code)) {
    errors['kb_code'] = 'Code 只能包含小写字母、数字、下划线和中划线，以字母开头'
  }
  createErrors.value = errors
  return Object.keys(errors).length === 0
}

async function submitCreate() {
  if (!validateCreate() || creating.value) return
  creating.value = true
  try {
    const kb = await knowledgeApi.createBase({
      name: createForm.value.name.trim(),
      kb_code: createForm.value.kb_code.trim(),
      description: createForm.value.description.trim() || undefined,
    })
    knowledgeBases.value.unshift(kb)
    persistKbCodes()
    closeCreateDialog()
  } catch (err) {
    createErrors.value['kb_code'] = err instanceof BizError ? err.message : '创建失败，请重试'
  } finally {
    creating.value = false
  }
}

/* ─── 文档抽屉 ─── */
const activeKb = ref<KnowledgeBase | null>(null)
const docsLoading = ref(false)
const documents = ref<KnowledgeDocument[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function openKnowledgeBase(kb: KnowledgeBase) {
  activeKb.value = kb
  docsLoading.value = true
  try {
    documents.value = await knowledgeApi.listDocuments(kb.kb_code)
  } catch {
    documents.value = []
  } finally {
    docsLoading.value = false
  }
}

function closeDrawer() {
  activeKb.value = null
  documents.value = []
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !activeKb.value) return

  uploading.value = true
  try {
    const doc = await knowledgeApi.uploadDocument(activeKb.value.kb_code, file)
    documents.value.unshift(doc)
    const kb = knowledgeBases.value.find((k) => k.kb_code === activeKb.value!.kb_code)
    if (kb) kb.doc_count += 1
    activeKb.value = { ...activeKb.value, doc_count: activeKb.value.doc_count + 1 }
  } catch (err) {
    alert(err instanceof BizError ? err.message : '上传失败，请重试')
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

/* ─── 删除文档 ─── */
const docToDelete = ref<KnowledgeDocument | null>(null)
const deletingDocId = ref<string | null>(null)

function confirmDeleteDoc(doc: KnowledgeDocument) {
  docToDelete.value = doc
}

async function executeDeleteDoc() {
  if (!docToDelete.value) return
  deletingDocId.value = docToDelete.value.id
  try {
    await knowledgeApi.deleteDocument(docToDelete.value.id)
    documents.value = documents.value.filter((d) => d.id !== docToDelete.value!.id)
    const kb = knowledgeBases.value.find((k) => k.kb_code === activeKb.value?.kb_code)
    if (kb && kb.doc_count > 0) kb.doc_count -= 1
    if (activeKb.value) {
      activeKb.value = { ...activeKb.value, doc_count: Math.max(0, activeKb.value.doc_count - 1) }
    }
    docToDelete.value = null
  } catch (err) {
    alert(err instanceof BizError ? err.message : '删除失败，请重试')
  } finally {
    deletingDocId.value = null
  }
}

/* ─── 工具函数 ─── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function statusLabel(status: KnowledgeDocument['status']): string {
  const map: Record<KnowledgeDocument['status'], string> = {
    pending: '等待中',
    processing: '处理中',
    success: '完成',
    failed: '失败',
  }
  return map[status] ?? status
}
</script>

<style lang="scss" scoped>
.knowledge-page {
  padding: 24px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  &__loading {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: #6b7280;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    padding: 60px 0;
  }

  &__empty-icon {
    width: 80px;
    height: 80px;
  }

  &__empty-text {
    font-size: 15px;
    color: #9ca3af;
    margin: 0;
  }
}

.knowledge-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.kb-card {
  padding: 18px 20px;
  cursor: pointer;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgb(99 102 241 / 10%);
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
  }

  &__code {
    font-size: 12px;
    color: #9ca3af;
    font-family: monospace;
    margin-bottom: 8px;
  }

  &__desc {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 12px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #9ca3af;
  }

  &__doc-count {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

/* 文档抽屉 */
.doc-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgb(0 0 0 / 35%);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
}

.doc-drawer {
  width: min(600px, 90vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgb(0 0 0 / 12%);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 16px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  &__subtitle {
    font-size: 12px;
    color: #9ca3af;
    font-family: monospace;
    margin-top: 2px;
  }

  &__upload {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  &__hint {
    font-size: 12px;
    color: #9ca3af;
  }

  &__loading {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: #6b7280;
  }

  &__empty {
    padding: 40px 24px;
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
  }
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;

  &__input {
    display: none;
  }

  &:hover:not(.upload-btn--loading) {
    background: #4f46e5;
  }

  &--loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.doc-table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 12px;

  th {
    padding: 8px 10px;
    text-align: left;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 1px solid #f3f4f6;
    white-space: nowrap;
  }

  td {
    padding: 10px;
    color: #374151;
    border-bottom: 1px solid #f9fafb;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  &__name {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;

  &--pending { background: #f3f4f6; color: #6b7280; }
  &--processing { background: #eff6ff; color: #3b82f6; }
  &--success { background: #f0fdf4; color: #16a34a; }
  &--failed { background: #fef2f2; color: #dc2626; }
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1.5px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:disabled { opacity: 0.6; cursor: not-allowed; }

  &--primary {
    color: #fff;
    background: #6366f1;
    border-color: #6366f1;
    &:hover:not(:disabled) { background: #4f46e5; border-color: #4f46e5; }
  }

  &--ghost {
    color: #374151;
    background: transparent;
    border-color: #e5e7eb;
    &:hover:not(:disabled) { background: #f9fafb; }
  }

  &--danger {
    color: #fff;
    background: #ef4444;
    border-color: #ef4444;
    &:hover:not(:disabled) { background: #dc2626; border-color: #dc2626; }
  }

  &--sm { padding: 5px 10px; font-size: 13px; border-radius: 6px; }
  &__icon { flex-shrink: 0; }
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgb(99 102 241 / 25%);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;

  &--sm { width: 12px; height: 12px; }
  &--white { border-color: rgb(255 255 255 / 30%); border-top-color: #fff; }
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 35%);
  backdrop-filter: blur(2px);
}

.dialog {
  width: 100%;
  max-width: 460px;
  overflow: hidden;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%), 0 2px 8px rgb(0 0 0 / 6%);

  &--sm { max-width: 380px; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 0;
  }

  &__title { font-size: 16px; font-weight: 600; color: #111827; }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #9ca3af;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: background 0.12s ease, color 0.12s ease;
    &:hover { color: #374151; background: #f3f4f6; }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 20px 24px 0;
  }

  &__confirm-text { font-size: 14px; line-height: 1.6; color: #374151; }

  &__footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 20px 24px;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label { font-size: 13px; font-weight: 500; color: #374151; }
  &__required { color: #ef4444; }

  &__input {
    width: 100%;
    padding: 9px 12px;
    font-size: 14px;
    color: #111827;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

    &::placeholder { color: #9ca3af; }

    &:focus {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 12%);
    }

    &--error {
      border-color: #ef4444;
      &:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgb(239 68 68 / 12%); }
    }
  }

  &__error { font-size: 12px; color: #ef4444; }
}

/* 过渡 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
  .dialog { transition: transform 0.18s ease, opacity 0.18s ease; }
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  .dialog { opacity: 0; transform: scale(0.95) translateY(-8px); }
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
  .doc-drawer { transition: transform 0.2s ease; }
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
  .doc-drawer { transform: translateX(100%); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

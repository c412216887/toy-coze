<template>
  <div class="workflow-page">
    <!-- 顶部标题栏 -->
    <div class="workflow-page__header">
      <h2 class="workflow-page__title">工作流</h2>
      <button class="btn btn--primary" @click="openCreateDialog">
        <svg
          class="btn__icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 3.333v9.334M3.333 8h9.334"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        新建工作流
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="store.loading" class="workflow-page__loading">
      <span class="spinner" />
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="store.workflows.length === 0" class="workflow-page__empty">
      <svg
        class="workflow-page__empty-icon"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="12" y="20" width="56" height="44" rx="6" fill="#f3f4f6" />
        <rect x="20" y="30" width="24" height="4" rx="2" fill="#d1d5db" />
        <rect x="20" y="40" width="40" height="3" rx="1.5" fill="#e5e7eb" />
        <rect x="20" y="49" width="32" height="3" rx="1.5" fill="#e5e7eb" />
        <circle cx="58" cy="56" r="14" fill="#6366f1" />
        <path
          d="M58 50v12M52 56h12"
          stroke="#fff"
          stroke-width="2.2"
          stroke-linecap="round"
        />
      </svg>
      <p class="workflow-page__empty-text">暂无工作流</p>
      <button class="btn btn--primary" @click="openCreateDialog">创建第一个工作流</button>
    </div>

    <!-- 工作流列表 -->
    <div v-else class="workflow-list">
      <div v-for="workflow in store.workflows" :key="workflow.id" class="workflow-card">
        <div class="workflow-card__body">
          <RouterLink
            :to="`/workflow/${workflow.id}/edit`"
            class="workflow-card__name"
          >
            {{ workflow.name }}
          </RouterLink>
          <p class="workflow-card__desc" :title="workflow.description">
            {{ workflow.description || '暂无描述' }}
          </p>
          <span class="workflow-card__date">{{ formatDate(workflow.createdAt) }}</span>
        </div>
        <div class="workflow-card__actions">
          <RouterLink
            :to="`/workflow/${workflow.id}/edit`"
            class="btn btn--ghost btn--sm"
          >
            编辑
          </RouterLink>
          <button
            class="btn btn--ghost btn--sm btn--danger"
            @click="openDeleteConfirm(workflow.id, workflow.name)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 新建工作流 Dialog -->
    <Transition name="dialog-fade">
      <div v-if="createDialog.visible" class="dialog-overlay" @click.self="closeCreateDialog">
        <div class="dialog">
          <div class="dialog__header">
            <h3 class="dialog__title">新建工作流</h3>
            <button class="dialog__close" aria-label="关闭" @click="closeCreateDialog">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4 4 12M4 4l8 8"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <form class="dialog__body" @submit.prevent="submitCreate">
            <div class="form-field">
              <label class="form-field__label" for="wf-name">
                名称 <span class="form-field__required">*</span>
              </label>
              <input
                id="wf-name"
                v-model="createDialog.name"
                class="form-field__input"
                :class="{ 'form-field__input--error': !!createDialog.nameError }"
                type="text"
                placeholder="请输入工作流名称"
                maxlength="50"
                autofocus
              />
              <p v-if="createDialog.nameError" class="form-field__error">
                {{ createDialog.nameError }}
              </p>
            </div>

            <div class="form-field">
              <label class="form-field__label" for="wf-desc">描述（选填）</label>
              <input
                id="wf-desc"
                v-model="createDialog.description"
                class="form-field__input"
                type="text"
                placeholder="请输入工作流描述"
                maxlength="100"
              />
            </div>

            <div class="dialog__footer">
              <button
                type="button"
                class="btn btn--ghost"
                :disabled="createDialog.loading"
                @click="closeCreateDialog"
              >
                取消
              </button>
              <button type="submit" class="btn btn--primary" :disabled="createDialog.loading">
                <span v-if="createDialog.loading" class="spinner spinner--sm" />
                {{ createDialog.loading ? '创建中...' : '确认创建' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- 删除确认 Dialog -->
    <Transition name="dialog-fade">
      <div v-if="deleteConfirm.visible" class="dialog-overlay" @click.self="closeDeleteConfirm">
        <div class="dialog dialog--sm">
          <div class="dialog__header">
            <h3 class="dialog__title">删除工作流</h3>
            <button class="dialog__close" aria-label="关闭" @click="closeDeleteConfirm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4 4 12M4 4l8 8"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <div class="dialog__body">
            <p class="dialog__confirm-text">
              确认删除工作流「<strong>{{ deleteConfirm.name }}</strong>」？此操作无法撤销。
            </p>
          </div>
          <div class="dialog__footer">
            <button
              class="btn btn--ghost"
              :disabled="deleteConfirm.loading"
              @click="closeDeleteConfirm"
            >
              取消
            </button>
            <button
              class="btn btn--danger"
              :disabled="deleteConfirm.loading"
              @click="submitDelete"
            >
              <span v-if="deleteConfirm.loading" class="spinner spinner--sm spinner--white" />
              {{ deleteConfirm.loading ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'

const router = useRouter()
const store = useWorkflowStore()

onMounted(() => {
  store.fetchWorkflows()
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── 新建 Dialog ───────────────────────────────────────────
const createDialog = reactive({
  visible: false,
  name: '',
  nameError: '',
  description: '',
  loading: false
})

function openCreateDialog() {
  createDialog.visible = true
  createDialog.name = ''
  createDialog.nameError = ''
  createDialog.description = ''
}

function closeCreateDialog() {
  if (createDialog.loading) return
  createDialog.visible = false
}

async function submitCreate() {
  createDialog.nameError = ''
  if (!createDialog.name.trim()) {
    createDialog.nameError = '工作流名称不能为空'
    return
  }
  createDialog.loading = true
  try {
    const workflow = await store.create({
      name: createDialog.name.trim(),
      description: createDialog.description.trim() || undefined
    })
    createDialog.visible = false
    router.push(`/workflow/${workflow.id}/edit`)
  } finally {
    createDialog.loading = false
  }
}

// ── 删除确认 Dialog ───────────────────────────────────────
const deleteConfirm = reactive({
  visible: false,
  id: '',
  name: '',
  loading: false
})

function openDeleteConfirm(id: string, name: string) {
  deleteConfirm.visible = true
  deleteConfirm.id = id
  deleteConfirm.name = name
}

function closeDeleteConfirm() {
  if (deleteConfirm.loading) return
  deleteConfirm.visible = false
}

async function submitDelete() {
  deleteConfirm.loading = true
  try {
    await store.remove(deleteConfirm.id)
    deleteConfirm.visible = false
  } finally {
    deleteConfirm.loading = false
  }
}
</script>

<style lang="scss" scoped>
.workflow-page {
  padding: 32px 36px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    letter-spacing: -0.3px;
  }

  &__loading {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    height: 240px;
    font-size: 14px;
    color: #6b7280;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    justify-content: center;
    height: 360px;
  }

  &__empty-icon {
    width: 80px;
    height: 80px;
  }

  &__empty-text {
    font-size: 14px;
    color: #9ca3af;
  }
}

/* 工作流卡片列表 */
.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workflow-card {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 2px 8px rgb(99 102 241 / 8%);
  }

  &__body {
    display: flex;
    flex: 1;
    gap: 0;
    align-items: baseline;
    min-width: 0;
  }

  &__name {
    flex-shrink: 0;
    min-width: 120px;
    margin-right: 20px;
    font-size: 15px;
    font-weight: 500;
    color: #6366f1;
    text-decoration: none;
    transition: color 0.12s ease;

    &:hover {
      color: #4f46e5;
      text-decoration: underline;
    }
  }

  &__desc {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    color: #6b7280;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__date {
    flex-shrink: 0;
    margin-left: 20px;
    font-size: 12px;
    color: #9ca3af;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }
}

/* 通用按钮 */
.btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &--primary {
    color: #fff;
    background: #6366f1;
    border-color: #6366f1;

    &:hover:not(:disabled) {
      background: #4f46e5;
      border-color: #4f46e5;
    }
  }

  &--ghost {
    color: #374151;
    background: transparent;
    border-color: #e5e7eb;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
    }
  }

  &--danger {
    color: #fff;
    background: #ef4444;
    border-color: #ef4444;

    &:hover:not(:disabled) {
      background: #dc2626;
      border-color: #dc2626;
    }
  }

  &--sm {
    padding: 5px 10px;
    font-size: 13px;
    border-radius: 6px;
  }

  &__icon {
    flex-shrink: 0;
  }
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

  &--sm {
    width: 12px;
    height: 12px;
  }

  &--white {
    border-color: rgb(255 255 255 / 30%);
    border-top-color: #fff;
  }
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
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
  box-shadow:
    0 8px 24px rgb(0 0 0 / 12%),
    0 2px 8px rgb(0 0 0 / 6%);

  &--sm {
    max-width: 380px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

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

    &:hover {
      color: #374151;
      background: #f3f4f6;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 20px 24px 0;
  }

  &__confirm-text {
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
  }

  &__footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 20px 24px;
  }
}

/* 表单字段 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  &__required {
    color: #ef4444;
  }

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
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease,
      background 0.15s ease;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 12%);
    }

    &--error {
      border-color: #ef4444;

      &:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgb(239 68 68 / 12%);
      }
    }
  }

  &__error {
    font-size: 12px;
    color: #ef4444;
  }
}

/* Dialog 过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;

  .dialog {
    transition: transform 0.18s ease, opacity 0.18s ease;
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;

  .dialog {
    opacity: 0;
    transform: scale(0.95) translateY(-8px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

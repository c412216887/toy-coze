<template>
  <div class="runs-page">
    <!-- 顶部标题栏 -->
    <div class="runs-page__header">
      <div class="runs-page__header-left">
        <button class="btn-back" @click="router.push('/workflow')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12 6 8l4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          返回
        </button>
        <h2 class="runs-page__title">
          <span class="runs-page__title-workflow">{{ workflowName }}</span>
          <span class="runs-page__title-sep">/</span>
          运行历史
        </h2>
      </div>
      <button class="btn btn--ghost btn--sm" @click="loadRuns">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M12.5 7A5.5 5.5 0 1 1 7 1.5a5.49 5.49 0 0 1 3.89 1.61" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          <path d="M10 1v3.5H13.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        刷新
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="runs-page__loading">
      <span class="spinner" />
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="runs.length === 0" class="runs-page__empty">
      <svg class="runs-page__empty-icon" viewBox="0 0 80 80" fill="none">
        <rect x="14" y="18" width="52" height="44" rx="6" fill="#f3f4f6" />
        <rect x="22" y="28" width="22" height="4" rx="2" fill="#d1d5db" />
        <rect x="22" y="38" width="36" height="3" rx="1.5" fill="#e5e7eb" />
        <rect x="22" y="47" width="28" height="3" rx="1.5" fill="#e5e7eb" />
        <circle cx="58" cy="56" r="12" fill="#e5e7eb" />
        <path d="M58 50v6l3 3" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <p class="runs-page__empty-text">暂无运行记录</p>
      <p class="runs-page__empty-hint">在工作流编辑器中点击「运行」后，记录会在这里显示</p>
    </div>

    <!-- 运行记录列表 -->
    <div v-else class="runs-list">
      <div
        v-for="run in runs"
        :key="run.id"
        class="run-card"
        :class="{ 'run-card--active': selectedRun?.id === run.id }"
        @click="openDetail(run)"
      >
        <div class="run-card__status-col">
          <span class="status-badge" :class="`status-badge--${run.status}`">
            <span class="status-badge__dot" />
            {{ statusLabel(run.status) }}
          </span>
        </div>
        <div class="run-card__info">
          <span class="run-card__id" title="运行 ID">{{ run.id.slice(0, 8) }}…</span>
          <span class="run-card__time">{{ formatDateTime(run.createdAt) }}</span>
        </div>
        <div class="run-card__meta">
          <span v-if="run.elapsedMs !== null" class="run-card__meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2" />
              <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            {{ formatElapsed(run.elapsedMs) }}
          </span>
          <span v-if="run.totalTokens > 0" class="run-card__meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="3" width="10" height="6" rx="2" stroke="currentColor" stroke-width="1.2" />
              <path d="M4 6h4M3 4.5v3M9 4.5v3" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
            </svg>
            {{ run.totalTokens }} tokens
          </span>
        </div>
        <div class="run-card__arrow">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <Transition name="drawer-slide">
      <div v-if="selectedRun" class="drawer-overlay" @click.self="closeDetail">
        <div class="drawer">
          <div class="drawer__header">
            <div class="drawer__header-left">
              <span class="status-badge" :class="`status-badge--${selectedRun.status}`">
                <span class="status-badge__dot" />
                {{ statusLabel(selectedRun.status) }}
              </span>
              <span class="drawer__run-id">{{ selectedRun.id }}</span>
            </div>
            <button class="drawer__close" aria-label="关闭" @click="closeDetail">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <!-- 运行概要 -->
          <div class="drawer__section">
            <p class="drawer__section-title">概要</p>
            <div class="meta-grid">
              <div class="meta-grid__item">
                <span class="meta-grid__label">开始时间</span>
                <span class="meta-grid__value">{{ formatDateTime(selectedRun.createdAt) }}</span>
              </div>
              <div class="meta-grid__item">
                <span class="meta-grid__label">完成时间</span>
                <span class="meta-grid__value">{{ selectedRun.finishedAt ? formatDateTime(selectedRun.finishedAt) : '—' }}</span>
              </div>
              <div class="meta-grid__item">
                <span class="meta-grid__label">耗时</span>
                <span class="meta-grid__value">{{ selectedRun.elapsedMs !== null ? formatElapsed(selectedRun.elapsedMs) : '—' }}</span>
              </div>
              <div class="meta-grid__item">
                <span class="meta-grid__label">Token 用量</span>
                <span class="meta-grid__value">{{ selectedRun.totalTokens > 0 ? `${selectedRun.totalTokens} tokens` : '—' }}</span>
              </div>
            </div>
          </div>

          <!-- 输入 -->
          <div class="drawer__section">
            <p class="drawer__section-title">输入</p>
            <div v-if="selectedRun.inputs" class="code-block">
              <pre>{{ formatJson(selectedRun.inputs) }}</pre>
            </div>
            <p v-else class="drawer__empty-field">无输入数据</p>
          </div>

          <!-- 输出 -->
          <div class="drawer__section">
            <p class="drawer__section-title">输出</p>
            <div v-if="selectedRun.outputs" class="code-block">
              <pre>{{ formatJson(selectedRun.outputs) }}</pre>
            </div>
            <p v-else-if="selectedRun.status === 'failed'" class="drawer__error-text">
              {{ selectedRun.errorMessage || '运行失败，无错误信息' }}
            </p>
            <p v-else class="drawer__empty-field">无输出数据</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkflow, getWorkflowRuns, type WorkflowRun } from '@/api/workflow'

const route = useRoute()
const router = useRouter()

const workflowId = route.params.id as string
const workflowName = ref('')
const runs = ref<WorkflowRun[]>([])
const loading = ref(false)
const selectedRun = ref<WorkflowRun | null>(null)

onMounted(async () => {
  const [wf] = await Promise.allSettled([
    getWorkflow(workflowId),
    loadRuns()
  ])
  if (wf.status === 'fulfilled') {
    workflowName.value = wf.value.name
  }
})

async function loadRuns() {
  loading.value = true
  try {
    const data = await getWorkflowRuns(workflowId)
    // 按创建时间倒序
    runs.value = data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } finally {
    loading.value = false
  }
}

function openDetail(run: WorkflowRun) {
  selectedRun.value = run
}

function closeDetail() {
  selectedRun.value = null
}

function statusLabel(status: WorkflowRun['status']): string {
  const map: Record<WorkflowRun['status'], string> = {
    pending: '等待中',
    running: '运行中',
    success: '成功',
    failed: '失败',
  }
  return map[status] ?? status
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}

function formatJson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 2)
}
</script>

<style lang="scss" scoped>
.runs-page {
  padding: 32px 36px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  &__header-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  &__title-workflow {
    color: #6366f1;
  }

  &__title-sep {
    color: #d1d5db;
    font-weight: 400;
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
    gap: 12px;
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
    font-weight: 500;
    color: #6b7280;
  }

  &__empty-hint {
    font-size: 13px;
    color: #9ca3af;
  }
}

/* 返回按钮 */
.btn-back {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 6px 10px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: background 0.12s ease, color 0.12s ease;

  &:hover {
    color: #374151;
    background: #f9fafb;
  }
}

/* 运行记录列表 */
.runs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.run-card {
  display: grid;
  grid-template-columns: 140px 1fr auto 28px;
  gap: 16px;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 2px 8px rgb(99 102 241 / 8%);
  }

  &--active {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgb(99 102 241 / 10%);
  }

  &__status-col {
    display: flex;
    align-items: center;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__id {
    font-size: 13px;
    font-family: ui-monospace, monospace;
    color: #374151;
  }

  &__time {
    font-size: 12px;
    color: #9ca3af;
  }

  &__meta {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  &__meta-item {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    color: #6b7280;
  }

  &__arrow {
    display: flex;
    align-items: center;
    color: #d1d5db;
    transition: color 0.12s ease;
  }

  &:hover &__arrow {
    color: #6366f1;
  }
}

/* 状态徽标 */
.status-badge {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &--pending {
    color: #92400e;
    background: #fef3c7;

    .status-badge__dot {
      background: #d97706;
    }
  }

  &--running {
    color: #1e40af;
    background: #dbeafe;

    .status-badge__dot {
      background: #3b82f6;
      animation: pulse 1.2s ease-in-out infinite;
    }
  }

  &--success {
    color: #065f46;
    background: #d1fae5;

    .status-badge__dot {
      background: #10b981;
    }
  }

  &--failed {
    color: #991b1b;
    background: #fee2e2;

    .status-badge__dot {
      background: #ef4444;
    }
  }
}

/* 抽屉 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgb(0 0 0 / 25%);
  backdrop-filter: blur(1px);
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 201;
  display: flex;
  flex-direction: column;
  width: 500px;
  overflow-y: auto;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 24px rgb(0 0 0 / 10%);

  &__header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-shrink: 0;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid #f3f4f6;
  }

  &__header-left {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  &__run-id {
    overflow: hidden;
    font-size: 11px;
    font-family: ui-monospace, monospace;
    color: #9ca3af;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__close {
    display: flex;
    flex-shrink: 0;
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

  &__section {
    padding: 20px 20px 0;

    &:last-child {
      padding-bottom: 24px;
    }
  }

  &__section-title {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  &__empty-field {
    font-size: 13px;
    color: #9ca3af;
  }

  &__error-text {
    padding: 12px 14px;
    font-size: 13px;
    color: #991b1b;
    background: #fee2e2;
    border-radius: 6px;
  }
}

/* 概要网格 */
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid #f3f4f6;
  border-radius: 8px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    background: #fff;
  }

  &__label {
    font-size: 11px;
    color: #9ca3af;
  }

  &__value {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }
}

/* 代码块 */
.code-block {
  overflow-x: auto;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;

  pre {
    margin: 0;
    padding: 14px 16px;
    font-size: 12px;
    font-family: ui-monospace, 'Cascadia Code', monospace;
    line-height: 1.6;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-all;
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
    color 0.15s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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

  &--sm {
    padding: 5px 10px;
    font-size: 13px;
    border-radius: 6px;
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
}

/* 抽屉过渡 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: opacity 0.2s ease;

  .drawer {
    transition: transform 0.2s ease;
  }
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;

  .drawer {
    transform: translateX(100%);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>

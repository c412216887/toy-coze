<template>
  <div class="editor">
    <!-- 顶部工具栏 -->
    <header class="editor-toolbar">
      <button class="editor-toolbar__back" @click="router.push('/workflow')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12 6 8l4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        返回列表
      </button>

      <div class="editor-toolbar__title-wrap">
        <input
          v-if="editingTitle"
          ref="titleInput"
          v-model="workflowName"
          class="editor-toolbar__title-input"
          type="text"
          maxlength="50"
          @blur="commitTitle"
          @keydown.enter="commitTitle"
          @keydown.esc="cancelTitle"
        />
        <span v-else class="editor-toolbar__title" :title="workflowName" @click="startEditTitle">
          {{ workflowName || '未命名工作流' }}
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="margin-left: 4px; opacity: 0.5">
            <path d="M9 2a1.414 1.414 0 0 1 2 2L4 11H1V8L9 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
          </svg>
        </span>
      </div>

      <div class="editor-toolbar__actions">
        <button class="btn btn--ghost btn--sm" :disabled="saving" @click="handleSave">
          <span v-if="saving" class="spinner spinner--sm"></span>
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button class="btn btn--primary btn--sm" @click="openRunDrawer">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M3 2l8 4.5L3 11V2Z" fill="currentColor" />
          </svg>
          运行
        </button>
      </div>
    </header>

    <div class="editor-body">
      <!-- 左侧节点面板 -->
      <aside class="node-panel" :class="{ 'node-panel--collapsed': panelCollapsed }">
        <button class="node-panel__toggle" @click="panelCollapsed = !panelCollapsed">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" :style="{ transform: panelCollapsed ? 'rotate(180deg)' : 'none' }">
            <path d="M9 2 4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <template v-if="!panelCollapsed">
          <p class="node-panel__heading">节点</p>
          <div class="node-panel__item" draggable="true" @dragstart="onDragStart($event, 'llmNode')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2.5" stroke="#6366f1" stroke-width="1.5" />
              <path d="M4.5 6.5h7M4.5 9.5h4.5" stroke="#6366f1" stroke-width="1.3" stroke-linecap="round" />
            </svg>
            <span>LLM 节点</span>
          </div>
        </template>
      </aside>

      <!-- 画布 -->
      <div ref="flowWrapper" class="editor-canvas" @dragover.prevent @drop="onDrop">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :default-edge-options="{ animated: true }"
          fit-view-on-init
          class="editor-canvas__flow"
          @node-click="onNodeClick"
          @pane-click="closePanel"
        >
          <Background variant="dots" :gap="20" :size="1.2" />
          <Controls />
          <MiniMap :node-color="miniMapColor" :node-stroke-width="2" mask-color="rgb(240,240,255,0.6)" />
        </VueFlow>
      </div>

      <!-- 右侧配置面板 -->
      <Transition name="panel-slide">
        <aside v-if="selectedNode" class="config-panel">
          <div class="config-panel__header">
            <span class="config-panel__title">节点配置</span>
            <button class="config-panel__close" @click="closePanel">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3 3 11M3 3l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <!-- 开始节点 -->
          <div v-if="selectedNode.type === 'startNode'" class="config-panel__body">
            <p class="config-panel__readonly">
              用户输入：
              <code>&#123;&#123;input&#125;&#125;</code>
            </p>
            <p class="config-panel__hint">开始节点无需配置，工作流运行时会要求用户填写输入内容。</p>
          </div>

          <!-- LLM 节点 -->
          <div v-else-if="selectedNode.type === 'llmNode'" class="config-panel__body">
            <div class="form-field">
              <label class="form-field__label">节点名称</label>
              <input v-model="selectedNode.data.label" class="form-field__input" type="text" placeholder="LLM 节点" @input="syncNodeData" />
            </div>

            <div class="form-field">
              <label class="form-field__label">System Prompt</label>
              <textarea v-model="selectedNode.data.systemPrompt" class="form-field__input form-field__textarea" placeholder="你是一个助手，请回答：{{input}}" rows="6" @input="syncNodeData" />
              <p class="form-field__hint">
                支持
                <code>&#123;&#123;变量名&#125;&#125;</code>
                引用上游输出
              </p>
            </div>

            <div class="form-field">
              <label class="form-field__label">模型</label>
              <select v-model="selectedNode.data.model" class="form-field__input form-field__select" @change="syncNodeData">
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-field__label">
                Temperature
                <span class="form-field__value">{{ selectedNode.data.temperature ?? 0.7 }}</span>
              </label>
              <input v-model.number="selectedNode.data.temperature" class="form-field__range" type="range" min="0" max="2" step="0.1" @input="syncNodeData" />
              <div class="form-field__range-labels">
                <span>0</span>
                <span>2</span>
              </div>
            </div>
          </div>

          <!-- 结束节点 -->
          <div v-else-if="selectedNode.type === 'endNode'" class="config-panel__body">
            <div class="form-field">
              <label class="form-field__label">输出变量来源</label>
              <select v-model="selectedNode.data.outputSource" class="form-field__input form-field__select" @change="syncNodeData">
                <option value="">请选择上游节点</option>
                <option v-for="n in llmNodes" :key="n.id" :value="n.id">{{ String(n.data.label) || 'LLM 节点' }}（{{ n.id }}）</option>
              </select>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </div>

  <!-- 运行 Drawer -->
  <Transition name="drawer-slide">
    <div v-if="runDrawer.visible" class="run-drawer">
      <div class="run-drawer__header">
        <span class="run-drawer__title">运行工作流</span>
        <button class="run-drawer__close" :disabled="runDrawer.status === 'pending'" @click="closeRunDrawer">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 3 3 11M3 3l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="run-drawer__body">
        <div class="form-field">
          <label class="form-field__label">用户输入</label>
          <textarea
            v-model="runDrawer.input"
            class="form-field__input form-field__textarea"
            placeholder="请输入内容..."
            rows="4"
            :disabled="runDrawer.status === 'pending' || runDrawer.status === 'streaming'"
          />
        </div>

        <button class="btn btn--primary run-drawer__run-btn" :disabled="runDrawer.status === 'pending' || runDrawer.status === 'streaming'" @click="startRun">
          <span v-if="runDrawer.status === 'pending' || runDrawer.status === 'streaming'" class="spinner spinner--sm spinner--white" />
          {{ runDrawer.status === 'pending' ? '启动中...' : runDrawer.status === 'streaming' ? '运行中...' : '开始运行' }}
        </button>

        <!-- 输出区 -->
        <div v-if="runDrawer.status !== 'idle'" class="run-output">
          <div class="run-output__status">
            <template v-if="runDrawer.status === 'pending'">
              <span class="spinner spinner--sm" />
              <span class="run-output__status-text">运行中...</span>
            </template>
            <template v-else-if="runDrawer.status === 'completed'">
              <span class="run-output__status-icon run-output__status-icon--ok">✓</span>
              <span class="run-output__status-text run-output__status-text--ok">运行完成</span>
            </template>
            <template v-else-if="runDrawer.status === 'failed'">
              <span class="run-output__status-icon run-output__status-icon--err">✗</span>
              <span class="run-output__status-text run-output__status-text--err">运行失败：{{ runDrawer.errorMsg }}</span>
            </template>
          </div>

          <div v-if="runDrawer.output" ref="outputEl" class="run-output__content">{{ runDrawer.output }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, markRaw, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge, NodeMouseEvent } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import StartNode from '@/components/nodes/StartNode.vue'
import LlmNode from '@/components/nodes/LlmNode.vue'
import EndNode from '@/components/nodes/EndNode.vue'
import { getWorkflow, updateWorkflow, runWorkflow, createRunStream } from '@/api/workflow'
import type { WorkflowDefinition, WorkflowNodeDef, WorkflowEdgeDef } from '@/api/workflow'

const route = useRoute()
const router = useRouter()
const workflowId = route.params.id as string

const nodeTypes = {
  startNode: markRaw(StartNode),
  llmNode: markRaw(LlmNode),
  endNode: markRaw(EndNode)
}

const { project, onConnect, addEdges } = useVueFlow()
onConnect(params => addEdges([params]))

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const workflowName = ref('')
const saving = ref(false)
const panelCollapsed = ref(false)
const flowWrapper = ref<HTMLElement | null>(null)

const selectedNode = ref<Node | null>(null)

const llmNodes = computed<Node[]>((): Node[] => nodes.value.filter((n: Node) => n.type === 'llmNode'))

function miniMapColor(n: Node): string {
  if (n.type === 'startNode') return '#86efac'
  if (n.type === 'endNode') return '#fca5a5'
  return '#c7d2fe'
}

onMounted(async () => {
  const detail = await getWorkflow(workflowId)
  workflowName.value = detail.name

  if (detail.graphData?.nodes?.length) {
    nodes.value = detail.graphData.nodes.map((n: WorkflowNodeDef): Node => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { ...n.data }
    }))
    edges.value = detail.graphData.edges.map((e: WorkflowEdgeDef): Edge => ({
      id: e.id,
      source: e.source,
      target: e.target
    }))
  } else {
    nodes.value = [
      {
        id: 'start-1',
        type: 'startNode',
        position: { x: 80, y: 180 },
        data: { label: '开始' }
      },
      {
        id: 'end-1',
        type: 'endNode',
        position: { x: 560, y: 180 },
        data: { label: '结束', outputSource: '' }
      }
    ]
    edges.value = []
  }
})

async function handleSave() {
  saving.value = true
  try {
    const graphData: WorkflowDefinition = {
      nodes: nodes.value.map<WorkflowNodeDef>(n => ({
        id: n.id,
        type: n.type ?? 'default',
        position: n.position,
        data: n.data as Record<string, unknown>
      })),
      edges: edges.value.map<WorkflowEdgeDef>(e => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    }
    await updateWorkflow(workflowId, {
      name: workflowName.value,
      graphData
    })
  } finally {
    saving.value = false
  }
}

function onNodeClick(event: NodeMouseEvent) {
  selectedNode.value = event.node
}

function closePanel() {
  selectedNode.value = null
}

function syncNodeData() {
  if (!selectedNode.value) return
  nodes.value = nodes.value.map<Node>(n => (n.id === selectedNode.value!.id ? { ...n, data: { ...selectedNode.value!.data } } : n))
}

let idCounter = 0
function onDragStart(event: DragEvent, nodeType: string) {
  event.dataTransfer?.setData('nodeType', nodeType)
}

function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('nodeType')
  if (!nodeType || !flowWrapper.value) return

  const bounds = flowWrapper.value.getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  idCounter++
  const id = `${nodeType}-${Date.now()}-${idCounter}`
  const newNode: Node = {
    id,
    type: nodeType,
    position,
    data: {
      label: 'LLM 节点',
      systemPrompt: '',
      model: 'gpt-4o',
      temperature: 0.7
    }
  }
  nodes.value.push(newNode)
}

const editingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
let titleSnapshot = ''

function startEditTitle() {
  titleSnapshot = workflowName.value
  editingTitle.value = true
  nextTick(() => titleInput.value?.select())
}

function commitTitle() {
  editingTitle.value = false
}

function cancelTitle() {
  workflowName.value = titleSnapshot
  editingTitle.value = false
}

type RunStatus = 'idle' | 'pending' | 'streaming' | 'completed' | 'failed'

const runDrawer = reactive<{
  visible: boolean
  input: string
  status: RunStatus
  output: string
  errorMsg: string
}>({
  visible: false,
  input: '',
  status: 'idle',
  output: '',
  errorMsg: ''
})

const outputEl = ref<HTMLElement | null>(null)
let currentEventSource: EventSource | null = null

function openRunDrawer() {
  runDrawer.visible = true
  runDrawer.status = 'idle'
  runDrawer.output = ''
  runDrawer.errorMsg = ''
}

function closeRunDrawer() {
  currentEventSource?.close()
  currentEventSource = null
  runDrawer.visible = false
}

async function startRun() {
  if (!runDrawer.input.trim()) return

  currentEventSource?.close()
  currentEventSource = null
  runDrawer.status = 'pending'
  runDrawer.output = ''
  runDrawer.errorMsg = ''

  let runId: string
  try {
    const res = await runWorkflow(workflowId, runDrawer.input.trim())
    runId = res.runId
  } catch {
    runDrawer.status = 'failed'
    runDrawer.errorMsg = '触发运行失败，请重试'
    return
  }

  const es = createRunStream(workflowId, runId)
  currentEventSource = es
  runDrawer.status = 'streaming'

  es.addEventListener('token', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { content: string }
      runDrawer.output += data.content
      nextTick(() => {
        if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
      })
    } catch {}
  })

  es.addEventListener('done', () => {
    runDrawer.status = 'completed'
    es.close()
    currentEventSource = null
  })

  es.addEventListener('error', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { message: string }
      runDrawer.status = 'failed'
      runDrawer.errorMsg = data.message
    } catch {
      runDrawer.status = 'failed'
      runDrawer.errorMsg = '连接异常，请重试'
    }
    es.close()
    currentEventSource = null
  })
}

onUnmounted(() => {
  currentEventSource?.close()
})
</script>

<style lang="scss" scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f8f9fc;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;

  &__back {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 5px 10px;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: background 0.12s;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }

  &__title-wrap {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  &__title {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    max-width: 320px;
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 6px;
    transition: background 0.12s;

    &:hover {
      background: #f3f4f6;
    }
  }

  &__title-input {
    width: 280px;
    padding: 4px 8px;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    text-align: center;
    background: #f9fafb;
    border: 1px solid #6366f1;
    border-radius: 6px;
    outline: none;
    box-shadow: 0 0 0 3px rgb(99 102 241 / 12%);
  }

  &__actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

/* 主体 */
.editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左侧节点面板 */
.node-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 6px;
  width: 160px;
  padding: 14px 12px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  transition: width 0.2s ease;

  &--collapsed {
    width: 32px;
    padding: 14px 8px;
  }

  &__toggle {
    position: absolute;
    right: -12px;
    top: 16px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    cursor: pointer;
    color: #6b7280;
    transition: background 0.12s;

    svg {
      transition: transform 0.2s ease;
    }

    &:hover {
      background: #f3f4f6;
    }
  }

  &__heading {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  &__item {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 9px 10px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: grab;
    user-select: none;
    transition:
      background 0.12s,
      border-color 0.12s;

    &:hover {
      background: #eef2ff;
      border-color: #c7d2fe;
      color: #4338ca;
    }

    &:active {
      cursor: grabbing;
    }
  }
}

/* 画布 */
.editor-canvas {
  flex: 1;
  min-width: 0;
  height: 100%;

  &__flow {
    width: 100%;
    height: 100%;
  }
}

/* 右侧配置面板 */
.config-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 280px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid #f3f4f6;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 1;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: #9ca3af;
    background: transparent;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition:
      background 0.12s,
      color 0.12s;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 16px;
  }

  &__readonly {
    padding: 10px 12px;
    font-size: 13px;
    color: #374151;
    background: #f9fafb;
    border-radius: 8px;

    code {
      padding: 2px 5px;
      font-size: 12px;
      background: #e0e7ff;
      border-radius: 4px;
      color: #4338ca;
    }
  }

  &__hint {
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.6;
  }
}

/* 表单字段（复用编辑器内） */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  &__value {
    font-weight: 400;
    color: #6366f1;
  }

  &__input {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    color: #111827;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    outline: none;
    box-sizing: border-box;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 10%);
    }
  }

  &__textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.5;
    font-family: inherit;
  }

  &__select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
    cursor: pointer;
  }

  &__range {
    width: 100%;
    accent-color: #6366f1;
    cursor: pointer;
  }

  &__range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #9ca3af;
  }

  &__hint {
    font-size: 11px;
    color: #9ca3af;

    code {
      padding: 1px 4px;
      background: #eef2ff;
      border-radius: 3px;
      color: #4338ca;
      font-size: 11px;
    }
  }
}

/* 通用按钮 */
.btn {
  display: inline-flex;
  gap: 5px;
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
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    color: #fff;
    background: #6366f1;
    border-color: #6366f1;

    &:hover:not(:disabled) {
      background: #4f46e5;
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

  &--sm {
    padding: 5px 12px;
    font-size: 13px;
    border-radius: 7px;
  }
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgb(99 102 241 / 25%);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;

  &--sm {
    width: 11px;
    height: 11px;
  }
}

/* 右侧面板滑入动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition:
    width 0.2s ease,
    opacity 0.2s ease;
  overflow: hidden;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  width: 0;
  opacity: 0;
}

/* 运行 Drawer */
.run-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 100vh;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 24px rgb(0 0 0 / 8%);

  &__header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  &__title {
    font-size: 14px;
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
    transition:
      background 0.12s,
      color 0.12s;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      color: #374151;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    overflow-y: auto;
  }

  &__run-btn {
    width: 100%;
  }
}

/* 输出区 */
.run-output {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;

  &__status {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  &__status-text {
    font-size: 13px;
    color: #6b7280;

    &--ok {
      color: #15803d;
    }

    &--err {
      color: #dc2626;
    }
  }

  &__status-icon {
    font-size: 14px;
    font-weight: 700;

    &--ok {
      color: #16a34a;
    }

    &--err {
      color: #dc2626;
    }
  }

  &__content {
    flex: 1;
    min-height: 120px;
    max-height: 420px;
    padding: 12px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.7;
    color: #111827;
    white-space: pre-wrap;
    word-break: break-all;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
}

.spinner--white {
  border-color: rgb(255 255 255 / 30%);
  border-top-color: #fff;
}

/* Drawer 滑入动画 */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

import { markRaw } from 'vue'
import type { Component } from 'vue'

import StartNode from './StartNode.vue'
import StartNodeConfig from './StartNodeConfig.vue'
import LlmNode from './LlmNode.vue'
import LlmNodeConfig from './LlmNodeConfig.vue'
import EndNode from './EndNode.vue'
import EndNodeConfig from './EndNodeConfig.vue'
import HttpNode from './HttpNode.vue'
import HttpNodeConfig from './HttpNodeConfig.vue'
import CodeNode from './CodeNode.vue'
import CodeNodeConfig from './CodeNodeConfig.vue'
import ConditionNode from './ConditionNode.vue'
import ConditionNodeConfig from './ConditionNodeConfig.vue'
import KnowledgeNode from './KnowledgeNode.vue'
import KnowledgeNodeConfig from './KnowledgeNodeConfig.vue'

export interface NodeDefinition {
  type: string
  label: string
  component: Component
  configPanel: Component
  defaultData: (index?: number) => Record<string, unknown>
  miniMapColor: string
  draggable: boolean
}

const PREFIX: Record<string, string> = {
  llmNode: 'llm',
  httpNode: 'http',
  codeNode: 'code',
  conditionNode: 'condition',
  knowledgeNode: 'knowledge',
}

export const nodeRegistry: NodeDefinition[] = [
  {
    type: 'startNode',
    label: '开始',
    component: markRaw(StartNode),
    configPanel: markRaw(StartNodeConfig),
    defaultData: () => ({ label: '开始', name: 'start' }),
    miniMapColor: '#86efac',
    draggable: false,
  },
  {
    type: 'llmNode',
    label: 'LLM 节点',
    component: markRaw(LlmNode),
    configPanel: markRaw(LlmNodeConfig),
    defaultData: (i = 1) => ({
      label: 'LLM 节点',
      name: `${PREFIX.llmNode}_${i}`,
      systemPrompt: '',
      model: 'qwen3.7-max',
      temperature: 0.7,
    }),
    miniMapColor: '#c7d2fe',
    draggable: true,
  },
  {
    type: 'httpNode',
    label: 'HTTP 请求',
    component: markRaw(HttpNode),
    configPanel: markRaw(HttpNodeConfig),
    defaultData: (i = 1) => ({ label: 'HTTP 请求', name: `${PREFIX.httpNode}_${i}`, method: 'GET', url: '', body: '' }),
    miniMapColor: '#a5f3fc',
    draggable: true,
  },
  {
    type: 'codeNode',
    label: '代码节点',
    component: markRaw(CodeNode),
    configPanel: markRaw(CodeNodeConfig),
    defaultData: (i = 1) => ({ label: '代码节点', name: `${PREFIX.codeNode}_${i}`, code: '' }),
    miniMapColor: '#ddd6fe',
    draggable: true,
  },
  {
    type: 'conditionNode',
    label: '条件分支',
    component: markRaw(ConditionNode),
    configPanel: markRaw(ConditionNodeConfig),
    defaultData: (i = 1) => ({ label: '条件分支', name: `${PREFIX.conditionNode}_${i}`, expression: '' }),
    miniMapColor: '#fde68a',
    draggable: true,
  },
  {
    type: 'knowledgeNode',
    label: '知识库检索',
    component: markRaw(KnowledgeNode),
    configPanel: markRaw(KnowledgeNodeConfig),
    defaultData: (i = 1) => ({ label: '知识库检索', name: `${PREFIX.knowledgeNode}_${i}`, kbCode: '', topK: 3, threshold: 0.7 }),
    miniMapColor: '#a7f3d0',
    draggable: true,
  },
  {
    type: 'endNode',
    label: '结束',
    component: markRaw(EndNode),
    configPanel: markRaw(EndNodeConfig),
    defaultData: () => ({ label: '结束', name: 'end', outputTemplate: '' }),
    miniMapColor: '#fca5a5',
    draggable: false,
  },
]

export const nodeRegistryMap = Object.fromEntries(
  nodeRegistry.map(def => [def.type, def])
) as Record<string, NodeDefinition>

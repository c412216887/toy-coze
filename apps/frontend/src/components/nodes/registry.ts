import { markRaw } from 'vue'
import type { Component } from 'vue'

import StartNode from './StartNode.vue'
import StartNodeConfig from './StartNodeConfig.vue'
import LlmNode from './LlmNode.vue'
import LlmNodeConfig from './LlmNodeConfig.vue'
import EndNode from './EndNode.vue'
import EndNodeConfig from './EndNodeConfig.vue'

export interface NodeDefinition {
  type: string
  label: string
  component: Component
  configPanel: Component
  defaultData: () => Record<string, unknown>
  miniMapColor: string
  draggable: boolean
}

export const nodeRegistry: NodeDefinition[] = [
  {
    type: 'startNode',
    label: '开始',
    component: markRaw(StartNode),
    configPanel: markRaw(StartNodeConfig),
    defaultData: () => ({ label: '开始' }),
    miniMapColor: '#86efac',
    draggable: false,
  },
  {
    type: 'llmNode',
    label: 'LLM 节点',
    component: markRaw(LlmNode),
    configPanel: markRaw(LlmNodeConfig),
    defaultData: () => ({
      label: 'LLM 节点',
      systemPrompt: '',
      model: 'qwen3.7-max',
      temperature: 0.7,
    }),
    miniMapColor: '#c7d2fe',
    draggable: true,
  },
  {
    type: 'endNode',
    label: '结束',
    component: markRaw(EndNode),
    configPanel: markRaw(EndNodeConfig),
    defaultData: () => ({ label: '结束', outputSource: '' }),
    miniMapColor: '#fca5a5',
    draggable: false,
  },
]

export const nodeRegistryMap = Object.fromEntries(
  nodeRegistry.map(def => [def.type, def])
) as Record<string, NodeDefinition>

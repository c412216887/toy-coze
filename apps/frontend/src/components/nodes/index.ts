export { nodeRegistry, nodeRegistryMap } from './registry'
export type { NodeDefinition } from './registry'

import { nodeRegistry } from './registry'
import type { Component } from 'vue'

export const nodeTypes: Record<string, Component> = Object.fromEntries(
  nodeRegistry.map(def => [def.type, def.component])
)

export const configPanelMap: Record<string, Component> = Object.fromEntries(
  nodeRegistry.map(def => [def.type, def.configPanel])
)

<template>
  <div class="workflow-editor">
    <VueFlow v-model:nodes="nodes" v-model:edges="edges" class="workflow-editor__canvas">
      <Background />
      <Controls />
      <MiniMap />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const nodes = ref<Node[]>([
  { id: '1', type: 'input', label: '开始', position: { x: 100, y: 100 } }
])

const edges = ref<Edge[]>([])
</script>

<style lang="scss" scoped>
.workflow-editor {
  height: 100vh;

  &__canvas {
    width: 100%;
    height: 100%;
  }
}
</style>

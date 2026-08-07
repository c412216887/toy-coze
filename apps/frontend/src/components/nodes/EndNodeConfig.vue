<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">输出变量来源</label>
      <select
        class="form-field__input form-field__select"
        :value="String(data.outputSource ?? '')"
        @change="patch('outputSource', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">请选择上游节点</option>
        <option v-for="n in llmNodes" :key="n.id" :value="n.id">
          {{ String(n.data.label) || 'LLM 节点' }}（{{ n.id }}）
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Node } from '@vue-flow/core'

const props = defineProps<{
  data: Record<string, unknown>
  llmNodes: Node[]
}>()

const emit = defineEmits<{
  update: [data: Record<string, unknown>]
}>()

function patch(field: string, value: unknown) {
  emit('update', { ...props.data, [field]: value })
}
</script>

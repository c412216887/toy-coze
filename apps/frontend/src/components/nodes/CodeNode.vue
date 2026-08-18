<template>
  <div class="code-node" :class="{ 'code-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />

    <div class="code-node__header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <polyline points="5,4 1,8 5,12" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <polyline points="11,4 15,8 11,12" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="9.5" y1="2.5" x2="6.5" y2="13.5" stroke="#7c3aed" stroke-width="1.3" stroke-linecap="round" />
      </svg>
      <span class="code-node__title">{{ data.label || '代码节点' }}</span>
      <span class="code-node__badge">JS</span>
    </div>

    <div class="code-node__preview" v-if="codePreview">{{ codePreview }}</div>
    <div class="code-node__preview code-node__preview--empty" v-else>未编写代码</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()

const codePreview = computed(() => {
  const code = String(props.data.code ?? '').trim()
  if (!code) return ''
  const firstLine = code.split('\n')[0]
  return firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine
})
</script>

<style lang="scss" scoped>
.code-node {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  max-width: 280px;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #ddd6fe;
  border-radius: 10px;
  cursor: default;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--selected {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgb(124 58 237 / 15%);
  }

  &__header {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  &__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: #3b1a6b;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    padding: 1px 5px;
    font-size: 10px;
    font-weight: 700;
    color: #7c3aed;
    background: #ede9fe;
    border-radius: 4px;
  }

  &__preview {
    padding: 6px 8px;
    font-size: 11px;
    font-family: 'Menlo', 'Monaco', monospace;
    color: #4b5563;
    background: #f5f3ff;
    border-radius: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--empty {
      color: #9ca3af;
      font-style: italic;
    }
  }
}
</style>

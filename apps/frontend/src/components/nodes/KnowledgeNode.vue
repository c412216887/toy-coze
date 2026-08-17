<template>
  <div class="knowledge-node" :class="{ 'knowledge-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />

    <div class="knowledge-node__header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="#059669" stroke-width="1.5" />
        <path d="M5 6h6M5 9h4" stroke="#059669" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span class="knowledge-node__title">{{ data.label || '知识库检索' }}</span>
    </div>

    <div class="knowledge-node__info">
      <span v-if="data.kbCode" class="knowledge-node__tag">{{ data.kbCode }}</span>
      <span v-else class="knowledge-node__tag knowledge-node__tag--empty">未选择知识库</span>
      <span class="knowledge-node__meta">Top-{{ data.topK ?? 3 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()
const { data, selected } = props
</script>

<style lang="scss" scoped>
.knowledge-node {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  max-width: 280px;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #a7f3d0;
  border-radius: 10px;
  cursor: default;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--selected {
    border-color: #059669;
    box-shadow: 0 0 0 3px rgb(5 150 105 / 15%);
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
    color: #064e3b;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__info {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__tag {
    padding: 2px 7px;
    font-size: 11px;
    color: #065f46;
    background: #d1fae5;
    border-radius: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 160px;

    &--empty {
      color: #9ca3af;
      background: #f3f4f6;
      font-style: italic;
    }
  }

  &__meta {
    font-size: 11px;
    color: #6b7280;
    margin-left: auto;
    flex-shrink: 0;
  }
}
</style>

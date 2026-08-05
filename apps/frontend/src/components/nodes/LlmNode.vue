<template>
  <div class="llm-node" :class="{ 'llm-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />

    <div class="llm-node__header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="10" rx="2.5" stroke="#6366f1" stroke-width="1.5" />
        <path
          d="M4.5 6.5h7M4.5 9.5h4.5"
          stroke="#6366f1"
          stroke-width="1.3"
          stroke-linecap="round"
        />
      </svg>
      <span class="llm-node__title">{{ data.label || 'LLM 节点' }}</span>
    </div>

    <div v-if="data.systemPrompt" class="llm-node__prompt">
      {{ truncate(String(data.systemPrompt), 60) }}
    </div>
    <div v-else class="llm-node__prompt llm-node__prompt--empty">未设置 System Prompt</div>

    <div class="llm-node__footer">
      <span class="llm-node__badge">{{ data.model || 'gpt-4o' }}</span>
      <span class="llm-node__badge">T={{ data.temperature ?? 0.7 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps>()
const { data, selected } = props

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}
</script>

<style lang="scss" scoped>
.llm-node {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  max-width: 280px;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #e0e7ff;
  border-radius: 10px;
  cursor: default;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--selected {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgb(99 102 241 / 15%);
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
    color: #3730a3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__prompt {
    font-size: 11px;
    line-height: 1.5;
    color: #4b5563;
    white-space: pre-wrap;
    word-break: break-all;

    &--empty {
      color: #9ca3af;
      font-style: italic;
    }
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  &__badge {
    display: inline-block;
    padding: 2px 7px;
    font-size: 10px;
    color: #6366f1;
    background: #eef2ff;
    border-radius: 99px;
  }
}
</style>

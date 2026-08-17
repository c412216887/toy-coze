<template>
  <div class="http-node" :class="{ 'http-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />

    <div class="http-node__header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#0891b2" stroke-width="1.5" />
        <path d="M2 8h12M8 2c-1.5 2-2.5 3.8-2.5 6s1 4 2.5 6M8 2c1.5 2 2.5 3.8 2.5 6S9.5 12 8 14"
          stroke="#0891b2" stroke-width="1.3" stroke-linecap="round" />
      </svg>
      <span class="http-node__title">{{ data.label || 'HTTP 请求' }}</span>
    </div>

    <div class="http-node__info">
      <span class="http-node__method" :data-method="String(data.method || 'GET')">
        {{ data.method || 'GET' }}
      </span>
      <span v-if="data.url" class="http-node__url">{{ truncate(String(data.url), 32) }}</span>
      <span v-else class="http-node__url http-node__url--empty">未配置 URL</span>
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
.http-node {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  max-width: 280px;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #a5f3fc;
  border-radius: 10px;
  cursor: default;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--selected {
    border-color: #0891b2;
    box-shadow: 0 0 0 3px rgb(8 145 178 / 15%);
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
    color: #164e63;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__info {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__method {
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    border-radius: 4px;
    color: #fff;
    background: #0891b2;
    flex-shrink: 0;

    &[data-method="POST"] { background: #16a34a; }
    &[data-method="PUT"] { background: #d97706; }
    &[data-method="DELETE"] { background: #dc2626; }
    &[data-method="PATCH"] { background: #7c3aed; }
  }

  &__url {
    font-size: 11px;
    color: #4b5563;
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

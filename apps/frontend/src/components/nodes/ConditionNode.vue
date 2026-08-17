<template>
  <div class="condition-node" :class="{ 'condition-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />

    <div class="condition-node__header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L15 8L8 15L1 8L8 1Z" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M8 5v3M8 10.5v.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span class="condition-node__title">{{ data.label || '条件分支' }}</span>
    </div>

    <div class="condition-node__expr" v-if="data.expression">{{ data.expression }}</div>
    <div class="condition-node__expr condition-node__expr--empty" v-else>未设置条件</div>

    <div class="condition-node__handles">
      <div class="condition-node__branch condition-node__branch--true">
        <Handle id="true" type="source" :position="Position.Right" style="top: 35%" />
        <span class="condition-node__branch-label">True</span>
      </div>
      <div class="condition-node__branch condition-node__branch--false">
        <Handle id="false" type="source" :position="Position.Right" style="top: 75%" />
        <span class="condition-node__branch-label">False</span>
      </div>
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
.condition-node {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  max-width: 280px;
  padding: 12px 14px;
  background: #fff;
  border: 2px solid #fde68a;
  border-radius: 10px;
  cursor: default;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--selected {
    border-color: #d97706;
    box-shadow: 0 0 0 3px rgb(217 119 6 / 15%);
  }

  &__header {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #78350f;
  }

  &__expr {
    padding: 5px 8px;
    font-size: 11px;
    font-family: 'Menlo', 'Monaco', monospace;
    color: #374151;
    background: #fefce8;
    border-radius: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--empty {
      color: #9ca3af;
      font-style: italic;
    }
  }

  &__handles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
    padding-right: 8px;
    align-items: flex-end;
  }

  &__branch {
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;

    &--true .condition-node__branch-label { color: #16a34a; }
    &--false .condition-node__branch-label { color: #dc2626; }
  }

  &__branch-label {
    font-size: 11px;
    font-weight: 600;
  }
}
</style>

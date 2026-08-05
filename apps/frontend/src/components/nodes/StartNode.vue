<template>
  <div class="start-node">
    <Handle type="source" :position="Position.Right" />
    <div class="start-node__icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="#16a34a" stroke-width="1.6" />
        <path
          d="M7.5 10h5M10 7.5l2.5 2.5-2.5 2.5"
          stroke="#16a34a"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <div class="start-node__content">
      <span class="start-node__label">开始</span>
      <span class="start-node__hint">用户输入：<code>&#123;&#123;input&#125;&#125;</code></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<style lang="scss" scoped>
.start-node {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 180px;
  padding: 12px 14px;
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 10px;
  cursor: default;

  &__icon {
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #15803d;
  }

  &__hint {
    font-size: 11px;
    color: #6b7280;

    code {
      padding: 1px 3px;
      font-size: 10px;
      background: #dcfce7;
      border-radius: 3px;
    }
  }
}
</style>

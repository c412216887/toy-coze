<template>
  <div class="end-node">
    <Handle type="target" :position="Position.Left" />
    <div class="end-node__icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="#dc2626" stroke-width="1.6" />
        <rect x="7" y="7" width="6" height="6" rx="1.5" fill="#dc2626" />
      </svg>
    </div>
    <div class="end-node__content">
      <span class="end-node__label">结束</span>
      <span class="end-node__hint">
        输出：{{ data.outputSource ? `来自节点 ${String(data.outputSource)}` : '未配置' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

defineProps<NodeProps>()
</script>

<style lang="scss" scoped>
.end-node {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 180px;
  padding: 12px 14px;
  background: #fff5f5;
  border: 2px solid #fca5a5;
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
    color: #b91c1c;
  }

  &__hint {
    font-size: 11px;
    color: #6b7280;
  }
}
</style>

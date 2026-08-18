<template>
  <div class="config-panel__body">
    <p class="config-panel__readonly">
      变量引用名：<code>{{ data.name ?? 'start_1' }}</code>
    </p>
    <p class="config-panel__readonly">
      用户输入：<code>&#123;&#123;input&#125;&#125;</code>
    </p>
    <p class="config-panel__hint">开始节点无需配置，工作流运行时会要求用户填写输入内容。</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: Record<string, unknown>
}>()

defineEmits<{
  update: [data: Record<string, unknown>]
}>()
</script>

<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">节点名称</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="代码节点"
        :value="String(data.label ?? '')"
        @input="patch('label', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">变量引用名：<code class="form-field__name">{{ data.name }}</code></p>
    </div>

    <div class="form-field">
      <label class="form-field__label">JavaScript 代码</label>
      <textarea
        class="form-field__input form-field__textarea form-field__code"
        placeholder="// 通过 inputs 获取上游数据&#10;// 通过 output 设置输出&#10;output = inputs.input?.toUpperCase()"
        rows="12"
        spellcheck="false"
        :value="String(data.code ?? '')"
        @input="patch('code', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="form-field__hint"><code>inputs</code> 包含上游所有输出；结果赋值给 <code>output</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ data: Record<string, unknown> }>()
const emit = defineEmits<{ update: [data: Record<string, unknown>] }>()

function patch(field: string, value: unknown) {
  emit('update', { ...props.data, [field]: value })
}
</script>

<style lang="scss" scoped>
.form-field__code {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
}
</style>

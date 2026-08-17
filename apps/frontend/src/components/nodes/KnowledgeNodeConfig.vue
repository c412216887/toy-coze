<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">节点名称</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="知识库检索"
        :value="String(data.label ?? '')"
        @input="patch('label', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">变量引用名：<code class="form-field__name">{{ data.name }}</code></p>
    </div>

    <div class="form-field">
      <label class="form-field__label">知识库 Code</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="kb_xxxxxxxx"
        :value="String(data.kbCode ?? '')"
        @input="patch('kbCode', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">在知识库页面查看 Code</p>
    </div>

    <div class="form-field">
      <label class="form-field__label">返回条数（Top-K）</label>
      <input
        class="form-field__input"
        type="number"
        min="1"
        max="20"
        :value="Number(data.topK ?? 3)"
        @input="patch('topK', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="form-field">
      <label class="form-field__label">相似度阈值</label>
      <input
        class="form-field__input"
        type="number"
        min="0"
        max="1"
        step="0.05"
        :value="Number(data.threshold ?? 0.7)"
        @input="patch('threshold', Number(($event.target as HTMLInputElement).value))"
      />
      <p class="form-field__hint">0~1，越高结果越精准但数量越少</p>
    </div>

    <div class="form-field__info">
      检索结果通过 <code>result.context</code>（拼接文本）和 <code>result.chunks</code>（原始分块）传给下游节点
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
.form-field__info {
  padding: 10px 12px;
  font-size: 12px;
  color: #374151;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  line-height: 1.6;

  code {
    padding: 1px 4px;
    font-family: 'Menlo', 'Monaco', monospace;
    font-size: 11px;
    background: #d1fae5;
    border-radius: 3px;
    color: #065f46;
  }
}
</style>

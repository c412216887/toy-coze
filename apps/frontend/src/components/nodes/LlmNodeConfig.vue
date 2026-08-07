<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">节点名称</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="LLM 节点"
        :value="String(data.label ?? '')"
        @input="patch('label', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-field">
      <label class="form-field__label">System Prompt</label>
      <textarea
        class="form-field__input form-field__textarea"
        placeholder="你是一个助手，请回答：{{input}}"
        rows="6"
        :value="String(data.systemPrompt ?? '')"
        @input="patch('systemPrompt', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="form-field__hint">支持 <code>&#123;&#123;变量名&#125;&#125;</code> 引用上游输出</p>
    </div>

    <div class="form-field">
      <label class="form-field__label">模型</label>
      <select
        class="form-field__input form-field__select"
        :value="String(data.model ?? 'qwen3.7-max')"
        @change="patch('model', ($event.target as HTMLSelectElement).value)"
      >
        <option value="qwen3.7-max">qwen3.7-max</option>
        <option value="gpt-4o">gpt-4o</option>
      </select>
    </div>

    <div class="form-field">
      <label class="form-field__label">
        Temperature
        <span class="form-field__value">{{ data.temperature ?? 0.7 }}</span>
      </label>
      <input
        class="form-field__range"
        type="range"
        min="0"
        max="2"
        step="0.1"
        :value="Number(data.temperature ?? 0.7)"
        @input="patch('temperature', Number(($event.target as HTMLInputElement).value))"
      />
      <div class="form-field__range-labels">
        <span>0</span>
        <span>2</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Record<string, unknown>
}>()

const emit = defineEmits<{
  update: [data: Record<string, unknown>]
}>()

function patch(field: string, value: unknown) {
  emit('update', { ...props.data, [field]: value })
}
</script>

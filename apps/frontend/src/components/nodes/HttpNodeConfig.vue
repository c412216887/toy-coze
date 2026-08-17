<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">节点名称</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="HTTP 请求"
        :value="String(data.label ?? '')"
        @input="patch('label', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">变量引用名：<code class="form-field__name">{{ data.name }}</code></p>
    </div>

    <div class="form-field">
      <label class="form-field__label">请求方法</label>
      <select
        class="form-field__input form-field__select"
        :value="String(data.method ?? 'GET')"
        @change="patch('method', ($event.target as HTMLSelectElement).value)"
      >
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>PATCH</option>
        <option>DELETE</option>
      </select>
    </div>

    <div class="form-field">
      <label class="form-field__label">URL</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="https://api.example.com/endpoint"
        :value="String(data.url ?? '')"
        @input="patch('url', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">支持 <code>&#123;&#123;变量名&#125;&#125;</code> 引用上游输出</p>
    </div>

    <div class="form-field">
      <label class="form-field__label">请求体（JSON）</label>
      <textarea
        class="form-field__input form-field__textarea"
        placeholder='{"key": "{{input}}"}'
        rows="4"
        :value="String(data.body ?? '')"
        @input="patch('body', ($event.target as HTMLTextAreaElement).value)"
      />
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

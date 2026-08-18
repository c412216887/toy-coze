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
        placeholder="https://api.example.com/{{llm_1}}"
        :value="String(data.url ?? '')"
        @input="patch('url', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">支持 <code>&#123;&#123;变量引用名&#125;&#125;</code> 插入上游输出</p>
    </div>

    <div class="form-field">
      <label class="form-field__label">认证方式</label>
      <select
        class="form-field__input form-field__select"
        :value="String(data.authType ?? 'none')"
        @change="patch('authType', ($event.target as HTMLSelectElement).value)"
      >
        <option value="none">无认证</option>
        <option value="bearer">Bearer Token</option>
        <option value="custom">自定义 Header</option>
      </select>
    </div>

    <div v-if="data.authType === 'bearer'" class="form-field">
      <label class="form-field__label">Token</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="eyJhbGciOi... 或 {{变量名}}"
        :value="String(data.authToken ?? '')"
        @input="patch('authToken', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">自动添加 <code>Authorization: Bearer &lt;token&gt;</code></p>
    </div>

    <template v-if="data.authType === 'custom'">
      <div class="form-field">
        <label class="form-field__label">Header 名称</label>
        <input
          class="form-field__input"
          type="text"
          placeholder="X-Api-Key"
          :value="String(data.authHeaderName ?? '')"
          @input="patch('authHeaderName', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-field">
        <label class="form-field__label">Header 值</label>
        <input
          class="form-field__input"
          type="text"
          placeholder="your-api-key 或 {{变量名}}"
          :value="String(data.authHeaderValue ?? '')"
          @input="patch('authHeaderValue', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </template>

    <div class="form-field">
      <textarea
        class="form-field__input form-field__textarea"
        placeholder='{"key": "{{llm_1}}"}'
        rows="4"
        :value="String(data.body ?? '')"
        @input="patch('body', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div v-if="upstreamVars.length" class="var-list">
      <p class="var-list__title">可用变量</p>
      <div class="var-list__items">
        <code
          v-for="v in upstreamVars"
          :key="v"
          class="var-list__chip"
          @click="insertVar(v)"
        >{{ v }}</code>
      </div>
      <p class="var-list__hint">点击插入 &#123;&#123;变量名&#125;&#125; 到 URL 或请求体</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<{ data: Record<string, unknown> }>()
const emit = defineEmits<{ update: [data: Record<string, unknown>] }>()

const { nodes } = useVueFlow()

const upstreamVars = computed(() => {
  const currentName = String(props.data.name ?? '')
  return nodes.value
    .filter((n) => n.type !== 'endNode' && (n.data.name as string) !== currentName)
    .map((n) => String(n.data.name ?? n.id))
})

// 追踪最后聚焦的字段，决定插入位置
const lastFocused = ref<'url' | 'body'>('body')

function patch(field: string, value: unknown) {
  if (field === 'url' || field === 'body') lastFocused.value = field
  emit('update', { ...props.data, [field]: value })
}

function insertVar(name: string) {
  const field = lastFocused.value
  const cur = String(props.data[field] ?? '')
  patch(field, `${cur}{{${name}}}`)
}
</script>

<style lang="scss" scoped>
.var-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #ecfeff;
  border: 1px solid #a5f3fc;
  border-radius: 8px;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: #164e63;
  }

  &__items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    padding: 2px 8px;
    font-size: 11px;
    font-family: 'Menlo', 'Monaco', monospace;
    color: #0e7490;
    background: #cffafe;
    border: 1px solid #a5f3fc;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.1s;

    &:hover {
      background: #a5f3fc;
    }
  }

  &__hint {
    font-size: 11px;
    color: #9ca3af;
  }
}
</style>

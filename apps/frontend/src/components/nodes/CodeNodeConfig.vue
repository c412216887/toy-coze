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
        placeholder="// 上游节点按 name 直接暴露在 context 中&#10;// 如 llm_1 节点的输出：context.llm_1&#10;// 用户输入：context.input&#10;output = context.llm_1?.toUpperCase()"
        rows="12"
        spellcheck="false"
        :value="String(data.code ?? '')"
        @input="patch('code', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="form-field__hint">通过 <code>context.变量引用名</code> 获取上游输出，结果赋值给 <code>output</code></p>
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
      <p class="var-list__hint">点击插入 context.变量名</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

function patch(field: string, value: unknown) {
  emit('update', { ...props.data, [field]: value })
}

function insertVar(name: string) {
  const cur = String(props.data.code ?? '')
  patch('code', cur ? `${cur}\ncontext.${name}` : `context.${name}`)
}
</script>

<style lang="scss" scoped>
.form-field__code {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
}

.var-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: #4c1d95;
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
    color: #6d28d9;
    background: #ede9fe;
    border: 1px solid #ddd6fe;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.1s;

    &:hover {
      background: #ddd6fe;
    }
  }

  &__hint {
    font-size: 11px;
    color: #9ca3af;
  }
}
</style>

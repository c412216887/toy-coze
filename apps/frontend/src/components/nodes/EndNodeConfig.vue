<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">输出模板</label>
      <textarea
        class="form-field__input form-field__textarea"
        placeholder="使用 {{变量引用名}} 引用上游节点输出，如：{{llm_1}}"
        :value="String(data.outputTemplate ?? '')"
        @input="patch('outputTemplate', ($event.target as HTMLTextAreaElement).value)"
      />
      <p class="form-field__hint">支持自由拼接多个节点输出，留空则输出最后一个节点结果</p>
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
      <p class="var-list__hint">点击变量名自动插入模板</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<{ data: Record<string, unknown> }>()
const emit = defineEmits<{ update: [data: Record<string, unknown>] }>()

const { nodes } = useVueFlow()

const upstreamVars = computed(() =>
  nodes.value
    .filter((n) => n.type !== 'endNode')
    .map((n) => String(n.data.name ?? n.id))
)

function patch(field: string, value: unknown) {
  emit('update', { ...props.data, [field]: value })
}

function insertVar(name: string) {
  const cur = String(props.data.outputTemplate ?? '')
  patch('outputTemplate', `${cur}{{${name}}}`)
}
</script>

<style lang="scss" scoped>
.form-field__textarea {
  min-height: 100px;
  resize: vertical;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}

.var-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: #9f1239;
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
    color: #be123c;
    background: #ffe4e6;
    border: 1px solid #fecdd3;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.1s;

    &:hover {
      background: #fecdd3;
    }
  }

  &__hint {
    font-size: 11px;
    color: #9ca3af;
  }
}
</style>

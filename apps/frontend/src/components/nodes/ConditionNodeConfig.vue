<template>
  <div class="config-panel__body">
    <div class="form-field">
      <label class="form-field__label">节点名称</label>
      <input
        class="form-field__input"
        type="text"
        placeholder="条件分支"
        :value="String(data.label ?? '')"
        @input="patch('label', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">变量引用名：<code class="form-field__name">{{ data.name }}</code></p>
    </div>

    <div class="form-field">
      <label class="form-field__label">条件表达式（JS）</label>
      <input
        class="form-field__input form-field__code"
        type="text"
        placeholder="inputs.score > 0.8"
        :value="String(data.expression ?? '')"
        @input="patch('expression', ($event.target as HTMLInputElement).value)"
      />
      <p class="form-field__hint">
        返回 <code>true</code> 走上方分支，<code>false</code> 走下方分支
      </p>
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
      <p class="var-list__hint">点击变量名自动填入表达式</p>
    </div>

    <div class="condition-branches">
      <div class="condition-branches__item condition-branches__item--true">
        <span class="condition-branches__dot" />
        <span>True 分支 — 条件成立时执行</span>
      </div>
      <div class="condition-branches__item condition-branches__item--false">
        <span class="condition-branches__dot" />
        <span>False 分支 — 条件不成立时执行</span>
      </div>
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
    .filter((n) => n.type !== 'startNode' && n.type !== 'endNode' && (n.data.name as string) !== currentName)
    .map((n) => String(n.data.name ?? n.id))
})

function patch(field: string, value: unknown) {
  emit('update', { ...props.data, [field]: value })
}

function insertVar(name: string) {
  const cur = String(props.data.expression ?? '')
  patch('expression', cur ? `${cur} && ${name}` : name)
}
</script>

<style lang="scss" scoped>
.form-field__code {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}

.var-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;

  &__title {
    font-size: 12px;
    font-weight: 600;
    color: #78350f;
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
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.1s;

    &:hover {
      background: #fde68a;
    }
  }

  &__hint {
    font-size: 11px;
    color: #9ca3af;
  }
}

.condition-branches {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;

  &__item {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: #374151;

    &--true .condition-branches__dot { background: #16a34a; }
    &--false .condition-branches__dot { background: #dc2626; }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
}
</style>


<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <div class="auth-card__logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#6366f1" />
            <path
              d="M8 16C8 11.582 11.582 8 16 8s8 3.582 8 8-3.582 8-8 8"
              stroke="#fff"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <circle cx="16" cy="16" r="3" fill="#fff" />
          </svg>
        </div>
        <h1 class="auth-card__title">Coze</h1>
        <p class="auth-card__subtitle">AI 工作流配置平台</p>
      </div>

      <p v-if="registeredHint" class="auth-card__hint">注册成功，请登录</p>

      <form class="auth-card__form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="form-field__label" for="email">邮箱</label>
          <input
            id="email"
            v-model="form.email"
            class="form-field__input"
            :class="{ 'form-field__input--error': !!errorMsg }"
            type="email"
            placeholder="请输入邮箱"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-field__label" for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            class="form-field__input"
            :class="{ 'form-field__input--error': !!errorMsg }"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="auth-card__error">{{ errorMsg }}</p>

        <button class="auth-card__btn" type="submit" :disabled="loading">
          <span v-if="loading" class="auth-card__spinner" />
          <span>{{ loading ? '登录中...' : '登录' }}</span>
        </button>

        <p class="auth-card__footer">
          没有账号？
          <router-link to="/register" class="auth-card__link">立即注册</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { encryptPassword } from '@/utils/rsa'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

const registeredHint = computed(() => route.query.registered === '1')

async function handleSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    const encryptedPassword = await encryptPassword(form.password)
    await authStore.login({ email: form.email, password: encryptedPassword })
    router.push('/workflow')
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'status' in err.response
    ) {
      const status = (err.response as { status: number }).status
      if (status === 401) {
        errorMsg.value = '账号或密码错误，请重新输入'
      } else if (status === 403) {
        const data = (err.response as { data?: { message?: string } }).data
        errorMsg.value = data?.message ?? '账号已被锁定，请稍后重试'
      } else if (status === 429) {
        errorMsg.value = '操作过于频繁，请稍后再试'
      } else {
        errorMsg.value = '登录失败，请稍后重试'
      }
    } else {
      errorMsg.value = '网络异常，请检查连接后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 36px;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 7%),
    0 10px 40px -4px rgb(99 102 241 / 12%);

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;
    text-align: center;
  }

  &__logo {
    margin-bottom: 12px;
  }

  &__title {
    margin-bottom: 4px;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.5px;
  }

  &__subtitle {
    font-size: 14px;
    color: #6b7280;
  }

  &__hint {
    margin-bottom: 16px;
    padding: 10px 14px;
    font-size: 13px;
    color: #15803d;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__error {
    margin-top: -8px;
    font-size: 13px;
    color: #ef4444;
  }

  &__btn {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 11px 0;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    transition: background 0.15s ease;

    &:hover:not(:disabled) {
      background: #4f46e5;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }
  }

  &__spinner {
    display: inline-block;
    width: 15px;
    height: 15px;
    border: 2px solid rgb(255 255 255 / 40%);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  &__footer {
    margin-top: -8px;
    font-size: 13px;
    color: #6b7280;
    text-align: center;
  }

  &__link {
    color: #6366f1;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  &__input {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    color: #111827;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    outline: none;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 12%);
    }

    &--error {
      border-color: #ef4444;

      &:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgb(239 68 68 / 12%);
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

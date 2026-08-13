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
        <h1 class="auth-card__title">注册 Coze</h1>
        <p class="auth-card__subtitle">AI 工作流配置平台</p>
      </div>

      <form class="auth-card__form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="form-field__label" for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            class="form-field__input"
            :class="{ 'form-field__input--error': !!fieldErrors.username }"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            @blur="validateUsername"
          />
          <p v-if="fieldErrors.username" class="form-field__error">{{ fieldErrors.username }}</p>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="email">邮箱</label>
          <input
            id="email"
            v-model="form.email"
            class="form-field__input"
            :class="{ 'form-field__input--error': !!fieldErrors.email }"
            type="email"
            placeholder="请输入邮箱"
            autocomplete="email"
            @blur="validateEmail"
          />
          <p v-if="fieldErrors.email" class="form-field__error">{{ fieldErrors.email }}</p>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="password">密码</label>
          <div class="form-field__input-wrap">
            <input
              id="password"
              v-model="form.password"
              class="form-field__input"
              :class="{ 'form-field__input--error': !!fieldErrors.password }"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="new-password"
              @input="validatePassword"
            />
            <button type="button" class="form-field__eye" @click="showPassword = !showPassword">
              <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div class="password-rules">
            <span
              v-for="rule in passwordRules"
              :key="rule.label"
              class="password-rules__item"
              :class="{ 'password-rules__item--pass': rule.pass }"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle v-if="!rule.pass" cx="6" cy="6" r="5" stroke="#d1d5db" stroke-width="1.5"/>
                <path v-else d="M2.5 6l2.5 2.5 4.5-5" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ rule.label }}
            </span>
          </div>
          <p v-if="fieldErrors.password" class="form-field__error">{{ fieldErrors.password }}</p>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            class="form-field__input"
            :class="{ 'form-field__input--error': !!fieldErrors.confirmPassword }"
            type="password"
            placeholder="请再次输入密码"
            autocomplete="new-password"
            @blur="validateConfirmPassword"
          />
          <p v-if="fieldErrors.confirmPassword" class="form-field__error">{{ fieldErrors.confirmPassword }}</p>
        </div>

        <p v-if="errorMsg" class="auth-card__error">{{ errorMsg }}</p>

        <button class="auth-card__btn" type="submit" :disabled="loading || !isFormValid">
          <span v-if="loading" class="auth-card__spinner" />
          <span>{{ loading ? '注册中...' : '注册' }}</span>
        </button>

        <p class="auth-card__footer">
          已有账号？
          <router-link to="/login" class="auth-card__link">立即登录</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { encryptPassword } from '@/utils/rsa'

const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const fieldErrors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

const passwordRules = computed(() => [
  { label: '至少 8 位', pass: form.password.length >= 8 },
  { label: '包含大写字母', pass: /[A-Z]/.test(form.password) },
  { label: '包含小写字母', pass: /[a-z]/.test(form.password) },
  { label: '包含数字', pass: /\d/.test(form.password) },
  { label: '包含特殊字符', pass: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(form.password) },
])

const isPasswordValid = computed(() => passwordRules.value.every((r) => r.pass))

const isFormValid = computed(
  () =>
    form.username.trim().length > 0 &&
    form.email.trim().length > 0 &&
    isPasswordValid.value &&
    form.password === form.confirmPassword,
)

function validateUsername() {
  fieldErrors.username = form.username.trim() ? '' : '请输入用户名'
}

function validateEmail() {
  fieldErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : '请输入有效的邮箱地址'
}

function validatePassword() {
  fieldErrors.password = isPasswordValid.value ? '' : '密码不符合强度要求'
}

function validateConfirmPassword() {
  fieldErrors.confirmPassword = form.password === form.confirmPassword ? '' : '两次输入的密码不一致'
}

async function handleSubmit() {
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  if (Object.values(fieldErrors).some((e) => e)) return

  errorMsg.value = ''
  loading.value = true
  try {
    const encryptedPassword = await encryptPassword(form.password)
    await register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: encryptedPassword,
    })
    router.push('/login?registered=1')
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response
    ) {
      const data = (err.response as { data: { message?: string } }).data
      errorMsg.value = data.message ?? '注册失败，请稍后重试'
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
  max-width: 420px;
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

  &__form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  &__error {
    margin-top: -6px;
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
      opacity: 0.55;
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
    margin-top: -4px;
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

  &__input-wrap {
    position: relative;

    .form-field__input {
      padding-right: 38px;
    }
  }

  &__eye {
    position: absolute;
    top: 50%;
    right: 10px;
    display: flex;
    align-items: center;
    padding: 0;
    color: #9ca3af;
    cursor: pointer;
    background: none;
    border: none;
    transform: translateY(-50%);

    &:hover {
      color: #6366f1;
    }
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
    box-sizing: border-box;

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

  &__error {
    font-size: 12px;
    color: #ef4444;
  }
}

.password-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 2px;

  &__item {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    color: #9ca3af;
    transition: color 0.15s;

    &--pass {
      color: #22c55e;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

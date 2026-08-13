<template>
  <div class="profile-page">
    <div class="profile-page__header">
      <h1 class="profile-page__title">个人中心</h1>
    </div>

    <div class="profile-sections">
      <section class="profile-card">
        <h2 class="profile-card__title">基本信息</h2>

        <div class="profile-card__avatar-row">
          <div class="profile-avatar">{{ authStore.avatarLetter }}</div>
          <div>
            <p class="profile-card__email">{{ authStore.user?.email }}</p>
            <p class="profile-card__hint">邮箱不可修改</p>
          </div>
        </div>

        <form @submit.prevent="handleUpdateProfile">
          <div class="form-field">
            <label class="form-field__label" for="username">用户名</label>
            <input
              id="username"
              v-model="profileForm.username"
              class="form-field__input"
              type="text"
              placeholder="请输入用户名"
              :disabled="profileLoading"
            />
          </div>
          <p v-if="profileError" class="form-msg form-msg--error">{{ profileError }}</p>
          <p v-if="profileSuccess" class="form-msg form-msg--success">{{ profileSuccess }}</p>
          <button class="btn btn--primary" type="submit" :disabled="profileLoading || !profileForm.username.trim()">
            <span v-if="profileLoading" class="btn__spinner" />
            {{ profileLoading ? '保存中...' : '保存修改' }}
          </button>
        </form>
      </section>

      <section class="profile-card">
        <h2 class="profile-card__title">修改密码</h2>

        <form @submit.prevent="handleChangePassword">
          <div class="form-field">
            <label class="form-field__label" for="oldPassword">当前密码</label>
            <div class="form-field__input-wrap">
              <input
                id="oldPassword"
                v-model="pwdForm.oldPassword"
                class="form-field__input"
                :type="showOld ? 'text' : 'password'"
                placeholder="请输入当前密码"
                autocomplete="current-password"
              />
              <button type="button" class="form-field__eye" @click="showOld = !showOld">
                <EyeIcon :open="showOld" />
              </button>
            </div>
          </div>

          <div class="form-field">
            <label class="form-field__label" for="newPassword">新密码</label>
            <div class="form-field__input-wrap">
              <input
                id="newPassword"
                v-model="pwdForm.newPassword"
                class="form-field__input"
                :type="showNew ? 'text' : 'password'"
                placeholder="请输入新密码"
                autocomplete="new-password"
                @input="validateNewPassword"
              />
              <button type="button" class="form-field__eye" @click="showNew = !showNew">
                <EyeIcon :open="showNew" />
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
                  <circle v-if="!rule.pass" cx="6" cy="6" r="5" stroke="#d1d5db" stroke-width="1.5" />
                  <path v-else d="M2.5 6l2.5 2.5 4.5-5" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ rule.label }}
              </span>
            </div>
          </div>

          <div class="form-field">
            <label class="form-field__label" for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="pwdForm.confirmPassword"
              class="form-field__input"
              :class="{ 'form-field__input--error': pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword }"
              type="password"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
            />
            <p v-if="pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword" class="form-field__error">两次输入的密码不一致</p>
          </div>

          <p v-if="pwdError" class="form-msg form-msg--error">{{ pwdError }}</p>
          <p v-if="pwdSuccess" class="form-msg form-msg--success">{{ pwdSuccess }}</p>

          <button class="btn btn--primary" type="submit" :disabled="pwdLoading || !isPwdFormValid">
            <span v-if="pwdLoading" class="btn__spinner" />
            {{ pwdLoading ? '修改中...' : '修改密码' }}
          </button>
        </form>
      </section>

      <section class="profile-card profile-card--danger">
        <h2 class="profile-card__title profile-card__title--danger">退出登录</h2>
        <p class="profile-card__desc">退出后需重新登录才能使用平台功能。</p>
        <button class="btn btn--danger" @click="handleLogout">退出登录</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { updateProfile, changePassword } from '@/api/auth'
import { encryptPassword } from '@/utils/rsa'

const router = useRouter()
const authStore = useAuthStore()

const profileForm = reactive({ username: authStore.user?.username ?? '' })
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

const showOld = ref(false)
const showNew = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)
const pwdError = ref('')
const pwdSuccess = ref('')

const passwordRules = computed(() => [
  { label: '至少 8 位', pass: pwdForm.newPassword.length >= 8 },
  { label: '包含大写字母', pass: /[A-Z]/.test(pwdForm.newPassword) },
  { label: '包含小写字母', pass: /[a-z]/.test(pwdForm.newPassword) },
  { label: '包含数字', pass: /\d/.test(pwdForm.newPassword) },
  { label: '包含特殊字符', pass: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwdForm.newPassword) },
])

const isNewPasswordValid = computed(() => passwordRules.value.every((r) => r.pass))

const isPwdFormValid = computed(
  () =>
    pwdForm.oldPassword.trim() &&
    isNewPasswordValid.value &&
    pwdForm.newPassword === pwdForm.confirmPassword,
)

function validateNewPassword() {
  pwdError.value = ''
}

async function handleUpdateProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  profileLoading.value = true
  try {
    const updated = await updateProfile(profileForm.username.trim())
    authStore.user = updated
    profileSuccess.value = '用户名已更新'
  } catch (err: unknown) {
    profileError.value = extractMessage(err, '保存失败，请稍后重试')
  } finally {
    profileLoading.value = false
  }
}

async function handleChangePassword() {
  pwdError.value = ''
  pwdSuccess.value = ''
  pwdLoading.value = true
  try {
    const [encOld, encNew] = await Promise.all([
      encryptPassword(pwdForm.oldPassword),
      encryptPassword(pwdForm.newPassword),
    ])
    await changePassword(encOld, encNew)
    pwdSuccess.value = '密码已修改，下次登录请使用新密码'
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (err: unknown) {
    pwdError.value = extractMessage(err, '修改失败，请稍后重试')
  } finally {
    pwdLoading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function extractMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response: { data?: { message?: string } } }).response.data
    return data?.message ?? fallback
  }
  return fallback
}

const EyeIcon = {
  props: ['open'],
  template: `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <template v-if="open">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </template>
      <template v-else>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </template>
    </svg>
  `,
}

onMounted(() => {
  if (authStore.user) profileForm.username = authStore.user.username
})
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 640px;
  padding: 32px;

  &__header {
    margin-bottom: 28px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
  }
}

.profile-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  padding: 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;

  &__title {
    margin-bottom: 20px;
    font-size: 15px;
    font-weight: 600;
    color: #111827;

    &--danger {
      color: #ef4444;
    }
  }

  &__avatar-row {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 20px;
  }

  &__email {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  &__hint {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  &__desc {
    margin-bottom: 16px;
    font-size: 13px;
    color: #6b7280;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &--danger {
    border-color: #fee2e2;
    background: #fff;
  }
}

.profile-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: #6366f1;
  border-radius: 12px;
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
    padding: 9px 12px;
    font-size: 14px;
    color: #111827;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      background: #fff;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgb(99 102 241 / 12%);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &--error {
      border-color: #ef4444;
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

.form-msg {
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 7px;

  &--error {
    color: #ef4444;
    background: #fef2f2;
  }

  &--success {
    color: #15803d;
    background: #f0fdf4;
  }
}

.btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 9px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: background 0.15s, opacity 0.15s;

  &--primary {
    color: #fff;
    background: #6366f1;

    &:hover:not(:disabled) {
      background: #4f46e5;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  &--danger {
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;

    &:hover {
      background: #fee2e2;
    }
  }

  &__spinner {
    display: inline-block;
    width: 13px;
    height: 13px;
    border: 2px solid rgb(255 255 255 / 40%);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

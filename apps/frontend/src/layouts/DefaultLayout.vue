<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#6366f1" />
          <path d="M8 16C8 11.582 11.582 8 16 8s8 3.582 8 8-3.582 8-8 8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="16" cy="16" r="3" fill="#fff" />
        </svg>
        <span class="sidebar__brand-name">Coze</span>
      </div>

      <nav class="sidebar__nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="sidebar__nav-item">
          <span class="sidebar__nav-icon" v-html="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__bottom">
        <div class="sidebar__user" @click="toggleUserMenu">
          <div class="sidebar__avatar">{{ authStore.avatarLetter }}</div>
          <div class="sidebar__user-info">
            <p class="sidebar__user-name">{{ authStore.displayName }}</p>
            <p class="sidebar__user-email">{{ authStore.user?.email }}</p>
          </div>
          <svg class="sidebar__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <Transition name="menu">
          <div v-if="userMenuOpen" class="user-menu">
            <RouterLink to="/profile" class="user-menu__item" @click="userMenuOpen = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              个人中心
            </RouterLink>
            <div class="user-menu__divider" />
            <button class="user-menu__item user-menu__item--danger" @click="handleLogout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              退出登录
            </button>
          </div>
        </Transition>
      </div>
    </aside>

    <main class="layout__main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const userMenuOpen = ref(false)

const navItems = [
  {
    to: '/home',
    label: '首页',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
  },
  {
    to: '/workflow',
    label: '工作流',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
  },
  {
    to: '/agent',
    label: 'Agent',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/></svg>'
  },
  {
    to: '/knowledge',
    label: '知识库',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
  },
  {
    to: '/settings',
    label: '设置',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  }
]

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.sidebar__bottom')) {
    userMenuOpen.value = false
  }
}

async function handleLogout() {
  userMenuOpen.value = false
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!authStore.user) authStore.loadUser()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;

  &__main {
    flex: 1;
    overflow: auto;
    background: #f9fafb;
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-width: 220px;
  background: #fff;
  border-right: 1px solid #e5e7eb;

  &__brand {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 20px 16px 16px;
  }

  &__brand-name {
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.3px;
  }

  &__nav {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    padding: 4px 10px;
  }

  &__nav-item {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 9px 10px;
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
    text-decoration: none;
    border-radius: 8px;
    transition:
      background 0.12s,
      color 0.12s;

    &:hover {
      background: #f3f4f6;
      color: #111827;
    }

    &.router-link-active {
      background: #ede9fe;
      color: #6366f1;
    }
  }

  &__nav-icon {
    display: flex;
    align-items: center;
    opacity: 0.75;

    :deep(svg) {
      display: block;
    }
  }

  &__bottom {
    position: relative;
    padding: 10px;
    border-top: 1px solid #f3f4f6;
  }

  &__user {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.12s;

    &:hover {
      background: #f3f4f6;
    }
  }

  &__avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: #6366f1;
    border-radius: 8px;
  }

  &__user-info {
    flex: 1;
    min-width: 0;
  }

  &__user-name {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__user-email {
    overflow: hidden;
    font-size: 11px;
    color: #9ca3af;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chevron {
    flex-shrink: 0;
    color: #9ca3af;
  }
}

.user-menu {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 10px;
  right: 10px;
  z-index: 50;
  padding: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 10%);

  &__item {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    text-decoration: none;
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 7px;
    transition: background 0.1s;

    &:hover {
      background: #f3f4f6;
    }

    &--danger {
      color: #ef4444;

      &:hover {
        background: #fef2f2;
      }
    }
  }

  &__divider {
    height: 1px;
    margin: 4px 0;
    background: #f3f4f6;
  }
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>

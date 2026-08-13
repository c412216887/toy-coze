import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/register/RegisterPage.vue'),
    meta: { public: true }
  },
  {
    path: '/workflow/:id/edit',
    name: 'workflow-edit',
    component: () => import('@/pages/workflow/WorkflowEditorPage.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue')
      },
      {
        path: 'workflow',
        name: 'workflow',
        component: () => import('@/pages/workflow/WorkflowPage.vue')
      },
      {
        path: 'agent',
        name: 'agent',
        component: () => import('@/pages/agent/AgentPage.vue')
      },
      {
        path: 'knowledge',
        name: 'knowledge',
        component: () => import('@/pages/knowledge/KnowledgePage.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/pages/settings/SettingsPage.vue')
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/pages/profile/ProfilePage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(to => {
  const authStore = useAuthStore()

  if (to.name === 'login' && authStore.isLoggedIn) {
    return { name: 'workflow' }
  }

  if (!to.meta.public && !authStore.isLoggedIn) {
    return { name: 'login' }
  }
})

export default router

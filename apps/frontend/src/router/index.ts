import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/home/HomePage.vue')
      },
      {
        path: 'workflow',
        name: 'workflow',
        component: () => import('@/pages/workflow/WorkflowPage.vue')
      },
      {
        path: 'workflow/:id/edit',
        name: 'workflow-edit',
        component: () => import('@/pages/workflow/WorkflowEditorPage.vue')
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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/',
      redirect: '/exam',
    },
    {
      path: '/exam',
      name: 'exam-list',
      component: () => import('@/views/exam/ExamListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exam/:id/start',
      name: 'exam-start',
      component: () => import('@/views/exam/ExamView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exam/record/:recordId/result',
      name: 'exam-result',
      component: () => import('@/views/exam/ExamResultView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    return '/login'
  }

  if (to.path === '/login' && userStore.token) {
    return '/exam'
  }

  return true
})

export default router

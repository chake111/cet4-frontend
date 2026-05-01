import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { redirectIfAuth: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false, redirectIfAuth: true },
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
      path: '/exam/records',
      name: 'exam-records',
      component: () => import('@/views/exam/ExamRecordListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exam/:id/brief',
      name: 'exam-brief',
      component: () => import('@/views/exam/ExamBriefView.vue'),
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
      name: 'exam-result-record',
      component: () => import('@/views/exam/ExamResultView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exam/result/:examId',
      name: 'exam-result',
      component: () => import('@/views/exam/ExamResultView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/exam',
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    return '/login'
  }

  if (to.meta.redirectIfAuth && userStore.token) {
    return '/exam'
  }

  return true
})

export default router

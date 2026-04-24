import { createRouter, createWebHistory } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useExamStore } from '@/stores/exam'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
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
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const examStore = useExamStore()

  if (to.meta.requiresAuth && !userStore.token) {
    return '/login'
  }

  if (to.path === '/login' && userStore.token) {
    return '/exam'
  }

  if (examStore.hasActiveExam && !to.path.startsWith('/exam')) {
    try {
      await ElMessageBox.confirm(
        '考试进行中，确定要离开吗？离开将丢失当前进度',
        '提示',
        { type: 'warning' },
      )
      examStore.resetExam()
      return true
    } catch {
      return false
    }
  }

  return true
})

export default router

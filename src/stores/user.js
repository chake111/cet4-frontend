import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useExamSessionStore } from '@/stores/examSession'
import { useExamAnswerStore } from '@/stores/examAnswer'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const userInfo = ref(null)

    const setToken = (newToken) => {
      token.value = newToken
    }

    const logout = () => {
      setToken('')
      userInfo.value = null
      const sessionStore = useExamSessionStore()
      const answerStore = useExamAnswerStore()
      sessionStore.resetExam()
      answerStore.resetAnswers()
    }

    return {
      token,
      userInfo,
      setToken,
      logout,
    }
  },
  {
    persist: {
      key: 'cet4-user',
      pick: ['token'],
    },
  }
)

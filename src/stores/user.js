import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  const setToken = (newToken) => {
    token.value = newToken

    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const logout = () => {
    setToken('')
    userInfo.value = null
  }

  return {
    token,
    userInfo,
    setToken,
    logout,
  }
})

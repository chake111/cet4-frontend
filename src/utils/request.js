import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()

    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const userStore = useUserStore()
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401 || code === 401) {
      userStore.logout()
      await router.push('/login')
    }

    return Promise.reject(error)
  },
)

export default request

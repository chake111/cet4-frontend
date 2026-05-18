import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/constants/request'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()

    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const userStore = useUserStore()
    const shouldShowErrorMessage = !error.config?.suppressErrorMessage

    if (!error.response) {
      if (shouldShowErrorMessage) {
        ElMessage.error('网络连接失败')
      }
      return Promise.reject(error)
    }

    const { status } = error.response
    const code = error.response.data?.code
    const message = error.response.data?.message

    if (status === 401 || code === 401) {
      userStore.logout()
      await router.push('/login')
    }

    if (shouldShowErrorMessage) {
      if (message) {
        ElMessage.error(message)
      } else if (status === 403) {
        ElMessage.error('没有访问权限')
      } else if (status === 500) {
        ElMessage.error('服务器错误')
      } else if (status !== 401 && code !== 401) {
        ElMessage.error('请求失败')
      }
    }

    return Promise.reject(error)
  }
)

export default request

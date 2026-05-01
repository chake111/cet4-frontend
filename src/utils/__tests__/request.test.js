import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock router before importing request
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/constants/request', () => ({
  API_BASE_URL: '/api',
  REQUEST_TIMEOUT: 10000,
}))

import request from '../request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import router from '@/router'

describe('request (axios instance)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', () => {
      const userStore = useUserStore()
      userStore.setToken('test-token')

      const config = { headers: {} }
      const result = request.interceptors.request.handlers[0].fulfilled(config)

      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('should not add Authorization header when token is empty', () => {
      const userStore = useUserStore()
      userStore.setToken('')

      const config = { headers: {} }
      const result = request.interceptors.request.handlers[0].fulfilled(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should not add Authorization header when token is not set', () => {
      const config = { headers: {} }
      const result = request.interceptors.request.handlers[0].fulfilled(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should pass through config unchanged (except headers)', () => {
      const config = { headers: {}, url: '/test', method: 'get' }
      const result = request.interceptors.request.handlers[0].fulfilled(config)

      expect(result.url).toBe('/test')
      expect(result.method).toBe('get')
    })

    it('should reject on request error', async () => {
      const error = new Error('Request setup error')

      await expect(request.interceptors.request.handlers[0].rejected(error)).rejects.toThrow(
        'Request setup error'
      )
    })
  })

  describe('response interceptor - success', () => {
    it('should return response.data on success', () => {
      const response = { data: { id: 1, name: 'Test' } }
      const result = request.interceptors.response.handlers[0].fulfilled(response)

      expect(result).toEqual({ id: 1, name: 'Test' })
    })
  })

  describe('response interceptor - error', () => {
    it('should show network error message when no response', async () => {
      const error = { message: 'Network Error' }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(ElMessage.error).toHaveBeenCalledWith('网络连接失败')
    })

    it('should logout and redirect on 401 status', async () => {
      const userStore = useUserStore()
      userStore.setToken('some-token')
      const logoutSpy = vi.spyOn(userStore, 'logout')

      const error = {
        response: {
          status: 401,
          data: {},
        },
      }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(logoutSpy).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith('/login')
    })

    it('should logout and redirect on code 401 in response data', async () => {
      const userStore = useUserStore()
      userStore.setToken('some-token')
      const logoutSpy = vi.spyOn(userStore, 'logout')

      const error = {
        response: {
          status: 200,
          data: { code: 401 },
        },
      }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(logoutSpy).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith('/login')
    })

    it('should show forbidden message on 403 status', async () => {
      const error = {
        response: {
          status: 403,
          data: {},
        },
      }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(ElMessage.error).toHaveBeenCalledWith('没有访问权限')
    })

    it('should show server error message on 500 status', async () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(ElMessage.error).toHaveBeenCalledWith('服务器错误')
    })

    it('should show custom message from response data for other errors', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: '参数错误' },
        },
      }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(ElMessage.error).toHaveBeenCalledWith('参数错误')
    })

    it('should show default error message when no custom message', async () => {
      const error = {
        response: {
          status: 422,
          data: {},
        },
      }

      await expect(request.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error)
      expect(ElMessage.error).toHaveBeenCalledWith('请求失败')
    })
  })

  describe('axios instance configuration', () => {
    it('should have correct base URL', () => {
      expect(request.defaults.baseURL).toBe('/api')
    })

    it('should have correct timeout', () => {
      expect(request.defaults.timeout).toBe(10000)
    })
  })
})

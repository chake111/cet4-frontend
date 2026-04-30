import request from '@/utils/request'

export const authService = {
  login(payload) {
    return request.post('/auth/login', payload)
  },

  register(payload) {
    return request.post('/auth/register', payload)
  },
}

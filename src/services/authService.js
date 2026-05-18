import request from '@/utils/request'

export const authService = {
  login(payload, config) {
    return request.post('/auth/login', payload, config)
  },

  register(payload, config) {
    return request.post('/auth/register', payload, config)
  },
}

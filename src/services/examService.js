import request from '@/utils/request'

export const examService = {
  getExamList() {
    return request.get('/exam')
  },

  getExamRecords() {
    return request.get('/exam/records')
  },

  startExam(paperId) {
    return request.post('/exam/start', { paperId })
  },

  saveDraft(payload, config) {
    return request.put('/exam/draft', payload, config)
  },

  submitExam(payload, config) {
    return request.post('/exam/submit', payload, config)
  },

  getExamResult(recordId) {
    return request.get(`/exam/record/${recordId}/result`)
  },
}

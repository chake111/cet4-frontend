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

  saveDraft(payload) {
    return request.put('/exam/draft', payload)
  },

  submitExam(payload) {
    return request.post('/exam/submit', payload)
  },

  getExamResult(recordId) {
    return request.get(`/exam/record/${recordId}/result`)
  },
}

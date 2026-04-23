import request from '@/utils/request'

export const getExamList = () => request.get('/exam')

export const getExamQuestions = (examId) => request.get(`/exam/${examId}/questions`)

export const startExam = (examId) => request.post(`/exam/${examId}/start`)

export const submitExam = (recordId, answers) =>
  request.post(`/exam/record/${recordId}/submit`, { answers })

export const getExamResult = (recordId) => request.get(`/exam/record/${recordId}/result`)

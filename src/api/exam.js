import request from '@/utils/request'

export const getExamList = () => request.get('/exam').then(res => res.data)

export const getExamQuestions = (examId) =>   request.get(`/exam/${examId}/questions`).then(res => res.data)

// DEPRECATED: 旧接口 POST /exam/{id}/start 已不再被前端调用，统一使用 POST /exam/start（通过 examStore.startExam）
export const startExam = (examId) =>
  request.post(`/exam/${examId}/start`).then(res => res.data)

export const submitExam = (recordId, answers) =>   request.post(`/exam/record/${recordId}/submit`, { answers }).then(res => res.data)

export const getExamResult = (recordId) =>   request.get(`/exam/record/${recordId}/result`).then(res => res.data)

export const getExamRecords = () => request.get('/exam/records').then(res => res.data)
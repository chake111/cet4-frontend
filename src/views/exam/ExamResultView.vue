<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const result = ref(null)
const showWrongOnly = ref(false)
const showBackTop = ref(false)

const partOrder = {
  writing: 1,
  listening: 2,
  reading_a: 3,
  reading_b: 3,
  reading: 3,
  reading_c: 3,
  translation: 4,
}

const partLabelMap = {
  writing: '写作',
  listening: '听力',
  reading_a: '选词填空',
  reading_b: '段落匹配',
  reading: '阅读理解',
  reading_c: '阅读理解',
  translation: '翻译',
}

const objectiveTypes = ['single_choice', 'blank_filling', 'matching', 'listening']
const subjectiveTypes = ['writing', 'translation']

const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined || answer === '') {
    return '未作答'
  }

  if (Array.isArray(answer)) {
    return answer.join('、')
  }

  return String(answer)
}

const parseTime = (value) => {
  if (!value) {
    return null
  }

  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? null : time
}

const formatDuration = (startTime, submitTime) => {
  const start = parseTime(startTime)
  const end = parseTime(submitTime)

  if (!start || !end || end < start) {
    return '--:--:--'
  }

  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':')
}

const sortedAnswers = computed(() => {
  const source = result.value?.answerDetails || []
  return [...source].sort((a, b) => {
    const pa = partOrder[a.part] || 99
    const pb = partOrder[b.part] || 99
    if (pa !== pb) return pa - pb
    return (a.questionNo || 0) - (b.questionNo || 0)
  })
})

const groupedAnswers = computed(() => {
  const groupMap = new Map()
  for (const item of sortedAnswers.value) {
    const partKey = item.part || 'other'
    if (!groupMap.has(partKey)) {
      groupMap.set(partKey, {
        part: partKey,
        label: partLabelMap[partKey] || partKey,
        questions: [],
      })
    }
    groupMap.get(partKey).questions.push(item)
  }
  return [...groupMap.values()]
})

const filteredGroupedAnswers = computed(() => {
  if (!showWrongOnly.value) return groupedAnswers.value

  return groupedAnswers.value
    .map(group => ({
      ...group,
      questions: group.questions.filter(q => isObjectiveQuestion(q) && q.correct === false),
    }))
    .filter(group => group.questions.length > 0)
})

const hasWrongAnswers = computed(() => {
  return groupedAnswers.value.some(group =>
    group.questions.some(q => isObjectiveQuestion(q) && q.correct === false),
  )
})

const objectiveCorrectCount = computed(() => result.value?.objectiveCorrect ?? 0)

const objectiveTotalCount = computed(() => result.value?.objectiveTotal ?? 0)

const objectiveAccuracy = computed(() => {
  return `${objectiveCorrectCount.value}/${objectiveTotalCount.value}`
})

const durationText = computed(() => formatDuration(result.value?.startTime, result.value?.submittedAt))

const statusText = computed(() => {
  const score = result.value?.score
  if (score === undefined || score === null) {
    return '--'
  }

  return score > 0 ? '已完成' : '未作答'
})

const isObjectiveQuestion = (question) => {
  if (objectiveTypes.includes(question.questionType)) return true
  if (subjectiveTypes.includes(question.questionType)) return false
  // If not subjective, treat as objective
  return question.correct !== null && question.correct !== undefined
}

const isSubjectiveQuestion = (question) => subjectiveTypes.includes(question.questionType)

const getScoreText = (question) => {
  const score = question.score ?? '--'
  const fullScore = question.fullScore ?? '--'
  return `${score} / ${fullScore}`
}

const goHome = () => {
  router.push('/exam')
}

const handleScroll = () => {
  showBackTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const fetchResult = async () => {
  const recordId = route.params.recordId || route.params.examId

  if (!recordId) {
    ElMessage.error('缺少考试记录 ID')
    loading.value = false
    return
  }

  loading.value = true

  try {
    const res = await request.get(`/exam/record/${recordId}/result`)
    result.value = res?.data || {}
  } catch (error) {
    ElMessage.error('获取结果失败，请重试')
    result.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchResult()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="exam-result-view">
    <el-skeleton :loading="loading" animated :rows="10">
      <template #template>
        <div class="skeleton-wrap">
          <el-skeleton-item variant="rect" class="skeleton-summary" />
          <el-skeleton-item variant="rect" class="skeleton-section" />
          <el-skeleton-item variant="rect" class="skeleton-section" />
        </div>
      </template>

      <template #default>
        <el-card shadow="never" class="summary-card">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">考试总分</div>
              <div class="summary-value">{{ result?.score ?? 0 }} / {{ result?.total ?? 710 }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">主观题得分</div>
              <div class="summary-value">{{ result?.subjectiveScore ?? 0 }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">客观题得分</div>
              <div class="summary-value">{{ result?.objectiveScore ?? 0 }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">客观题正确率</div>
              <div class="summary-value">{{ objectiveAccuracy }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">考试状态</div>
              <div class="summary-value">{{ statusText }}</div>
            </div>
            <div class="summary-action">
              <el-button type="primary" @click="goHome">返回首页</el-button>
            </div>
          </div>
        </el-card>

        <div class="filter-bar">
          <el-checkbox v-model="showWrongOnly" label="只看错题" />
        </div>

        <div v-if="showWrongOnly && filteredGroupedAnswers.length === 0" class="empty-wrong">
          <el-empty description="暂无错题" :image-size="80" />
        </div>

        <div v-else class="part-list">
          <el-card
            v-for="group in filteredGroupedAnswers"
            :key="group.part"
            shadow="never"
            class="part-card"
          >
            <template #header>
              <div class="part-title">{{ group.label }}</div>
            </template>

            <div
              v-for="question in group.questions"
              :key="question.questionId"
              class="question-item"
            >
              <div class="question-no">第 {{ question.questionNo }} 题</div>

              <template v-if="isObjectiveQuestion(question)">
                <div class="row-item">
                  <span class="row-label">我的答案：</span>
                  <span
                    class="answer-text"
                    :class="{
                      'answer-correct': question.correct === true,
                      'answer-wrong': question.correct === false,
                      'answer-unanswered': normalizeAnswer(question.userAnswer) === '未作答',
                    }"
                  >
                    {{ normalizeAnswer(question.userAnswer) }}
                  </span>
                </div>
                <div class="row-item">
                  <span class="row-label">正确答案：</span>
                  <span class="correct-answer-text">{{ normalizeAnswer(question.correctAnswer) }}</span>
                </div>
                <div class="row-item">
                  <span class="row-label">结果：</span>
                  <el-tag v-if="question.correct === true" type="success" size="small">正确</el-tag>
                  <el-tag v-else-if="question.correct === false" type="danger" size="small">错误</el-tag>
                  <el-tag v-else type="info" size="small">未判定</el-tag>
                </div>
                <div class="row-item">
                  <span class="row-label">得分：</span>
                  <span>{{ getScoreText(question) }}</span>
                </div>
              </template>

              <template v-else-if="isSubjectiveQuestion(question)">
                <div class="row-item subjective-answer">
                  <span class="row-label">我的答案：</span>
                  <div class="subjective-content">{{ normalizeAnswer(question.userAnswer) }}</div>
                </div>
                <div class="row-item">
                  <span class="row-label">评分：</span>
                  <el-tag type="warning" size="small">AI评分</el-tag>
                  <span class="ai-score-text">{{ getScoreText(question) }}</span>
                </div>
                <div v-if="question.aiFeedback" class="row-item subjective-feedback">
                  <span class="row-label">AI 反馈：</span>
                  <div class="subjective-content">{{ question.aiFeedback }}</div>
                </div>
              </template>
            </div>
          </el-card>
        </div>

        <transition name="fade">
          <div v-if="showBackTop" class="back-top" @click="scrollToTop">
            ↑ 返回顶部
          </div>
        </transition>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.exam-result-view {
  padding: 20px;
  position: relative;
}

.skeleton-wrap {
  display: grid;
  gap: 16px;
}

.skeleton-summary,
.skeleton-section {
  width: 100%;
  border-radius: 8px;
}

.skeleton-summary {
  height: 120px;
}

.skeleton-section {
  height: 180px;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  align-items: center;
}

.summary-item {
  min-width: 0;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 22px;
  color: #303133;
  font-weight: 600;
}

.summary-action {
  display: flex;
  justify-content: flex-end;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.part-list {
  display: grid;
  gap: 20px;
}

.part-card {
  border-top: 3px solid #409eff;
}

.part-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 1px;
}

.question-item {
  padding: 14px 0;
  border-bottom: 1px solid #ebeef5;
}

.question-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.question-no {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.row-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  line-height: 1.7;
  color: #606266;
}

.row-item:last-child {
  margin-bottom: 0;
}

.row-label {
  flex-shrink: 0;
  color: #909399;
}

.answer-text {
  font-weight: 600;
}

.answer-correct {
  color: #67c23a;
}

.answer-wrong {
  color: #f56c6c;
}

.answer-unanswered {
  color: #909399;
}

.correct-answer-text {
  color: #67c23a;
  font-weight: 600;
}

.ai-score-text {
  margin-left: 8px;
  color: #e6a23c;
  font-weight: 600;
}

.subjective-answer,
.subjective-feedback {
  gap: 8px;
}

.subjective-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: #303133;
  flex: 1;
  max-width: 100%;
  overflow-wrap: break-word;
}

.empty-wrong {
  padding: 40px 0;
}

.back-top {
  position: fixed;
  bottom: 40px;
  right: 40px;
  background: #409eff;
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 999;
  transition: opacity 0.3s;
}

.back-top:hover {
  background: #66b1ff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .summary-action {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .exam-result-view {
    padding: 12px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .back-top {
    bottom: 20px;
    right: 20px;
  }
}
</style>

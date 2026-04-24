<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExamResult } from '@/api/exam'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const result = ref(null)

const partOrder = ['writing', 'reading_a', 'reading_b', 'reading_c', 'translation']
const partLabelMap = {
  writing: '写作',
  reading_a: '选词填空',
  reading_b: '段落匹配',
  reading_c: '阅读理解',
  translation: '翻译',
}

const objectiveTypes = ['single_choice', 'blank_filling', 'matching']
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
  const source = Array.isArray(result.value?.answers) ? result.value.answers : []
  return [...source].sort((a, b) => Number(a.questionNo) - Number(b.questionNo))
})

const groupedAnswers = computed(() => {
  const groups = partOrder
    .map((part) => {
      const questions = sortedAnswers.value.filter((item) => item.part === part)
      return {
        part,
        label: partLabelMap[part] || part,
        questions,
      }
    })
    .filter((group) => group.questions.length > 0)

  return groups
})

const objectiveAnswers = computed(() =>
  sortedAnswers.value.filter((item) => objectiveTypes.includes(item.questionType)),
)

const objectiveCorrectCount = computed(
  () => objectiveAnswers.value.filter((item) => item.isCorrect === true).length,
)

const objectiveTotalCount = computed(() => objectiveAnswers.value.length)

const objectiveAccuracy = computed(() => {
  if (!objectiveTotalCount.value) {
    return '0/0'
  }

  return `${objectiveCorrectCount.value}/${objectiveTotalCount.value}`
})

const durationText = computed(() => formatDuration(result.value?.startTime, result.value?.submitTime))

const statusText = computed(() => {
  const status = result.value?.status
  if (status === 'graded') {
    return '已批改'
  }

  if (status === 'submitted') {
    return '待批改'
  }

  return '未知状态'
})

const isObjectiveQuestion = (question) => objectiveTypes.includes(question.questionType)

const isSubjectiveQuestion = (question) => subjectiveTypes.includes(question.questionType)

const getScoreText = (question) => {
  const score = question.score ?? '--'
  const fullScore = question.fullScore ?? question.maxScore ?? '--'
  return `${score} / ${fullScore}`
}

const goHome = () => {
  router.push('/exam')
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
    const data = await getExamResult(recordId)
    result.value = data || {}
  } catch (error) {
    ElMessage.error('获取考试结果失败，请稍后重试')
    result.value = { answers: [] }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchResult()
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
              <div class="summary-value">{{ result?.totalScore ?? 0 }} / 710</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">答题用时</div>
              <div class="summary-value">{{ durationText }}</div>
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

        <div class="part-list">
          <el-card
            v-for="group in groupedAnswers"
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
                    :style="{ color: question.isCorrect ? '#67c23a' : '#f56c6c' }"
                  >
                    {{ normalizeAnswer(question.userAnswer) }}
                  </span>
                </div>
                <div class="row-item">
                  <span class="row-label">正确答案：</span>
                  <span>{{ normalizeAnswer(question.correctAnswer) }}</span>
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
                  <el-tag type="warning">等待 AI 批改</el-tag>
                </div>
                <div v-if="question.aiFeedback" class="row-item subjective-feedback">
                  <span class="row-label">AI 反馈：</span>
                  <div class="subjective-content">{{ question.aiFeedback }}</div>
                </div>
              </template>
            </div>
          </el-card>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
.exam-result-view {
  padding: 20px;
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
  grid-template-columns: repeat(4, minmax(120px, 1fr));
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

.part-list {
  display: grid;
  gap: 16px;
}

.part-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.question-item {
  padding: 12px 0;
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

.subjective-answer,
.subjective-feedback {
  gap: 8px;
}

.subjective-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: #303133;
  flex: 1;
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
}
</style>

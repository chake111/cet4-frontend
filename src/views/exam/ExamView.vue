<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExamList, getExamQuestions, startExam, submitExam } from '@/api/exam'

const route = useRoute()
const router = useRouter()

const partOrder = ['writing', 'reading_a', 'reading_b', 'reading_c', 'translation']
const partLabelMap = {
  writing: '写作',
  reading_a: '选词填空',
  reading_b: '段落匹配',
  reading_c: '阅读理解',
  translation: '翻译',
}

const loading = ref(false)
const submitDialogVisible = ref(false)
const submitting = ref(false)
const hasSubmitted = ref(false)

const examInfo = ref(null)
const questions = ref([])
const answers = reactive({})

const timer = ref(null)
const remainingSeconds = ref(0)
const examId = computed(() => Number(route.params.id))
const recordId = ref(route.query.recordId ? Number(route.query.recordId) : null)
const examStartTimeStorageKey = computed(() =>
  recordId.value ? `exam_start_time_${recordId.value}` : '',
)

const safeQuestions = computed(() =>
  [...questions.value].sort((a, b) => Number(a.questionNo) - Number(b.questionNo)),
)

const groupedQuestions = computed(() => {
  const groups = partOrder
    .map((part) => {
      const items = safeQuestions.value.filter((item) => item.part === part)
      return {
        part,
        label: partLabelMap[part] || part,
        questions: items,
      }
    })
    .filter((group) => group.questions.length > 0)

  return groups
})

const totalQuestions = computed(() => questions.value.length)

const isAnswered = (question) => {
  const value = answers[question.id]
  return value !== undefined && value !== null && String(value).trim() !== ''
}

const answeredCount = computed(() =>
  questions.value.reduce((count, question) => (isAnswered(question) ? count + 1 : count), 0),
)

const readingAGroup = computed(() => groupedQuestions.value.find((group) => group.part === 'reading_a'))

const readingAData = computed(() => {
  const firstQuestion = readingAGroup.value?.questions?.[0]
  if (!firstQuestion?.passage) {
    return { article: '', wordBank: [] }
  }

  try {
    const parsed = JSON.parse(firstQuestion.passage)
    return {
      article: parsed.article || '',
      wordBank: Array.isArray(parsed.word_bank) ? parsed.word_bank : [],
    }
  } catch (error) {
    return { article: '', wordBank: [] }
  }
})

const readingATokens = computed(() => {
  if (!readingAData.value.article) {
    return []
  }

  return readingAData.value.article.split(/(\{\d+\})/g).filter((token) => token !== '')
})

const formatRemainTime = computed(() => {
  const hours = Math.floor(remainingSeconds.value / 3600)
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60)
  const seconds = remainingSeconds.value % 60
  return [hours, minutes, seconds].map((num) => String(num).padStart(2, '0')).join(':')
})

const getQuestionIdByNo = (part, questionNo) => {
  const group = groupedQuestions.value.find((item) => item.part === part)
  const target = group?.questions.find((item) => Number(item.questionNo) === Number(questionNo))
  return target?.id || null
}

const getReadingAAnswer = (questionNo) => {
  const questionId = getQuestionIdByNo('reading_a', questionNo)
  return questionId ? answers[questionId] || '' : ''
}

const setReadingAAnswer = (questionNo, value) => {
  const questionId = getQuestionIdByNo('reading_a', questionNo)
  if (questionId) {
    answers[questionId] = value
  }
}

const normalizeReadingB = (question) => {
  const rawValue = answers[question.id] || ''
  const normalized = String(rawValue).toUpperCase().replace(/[^A-M]/g, '').slice(0, 1)
  answers[question.id] = normalized
}

const shouldShowReadingCPassage = (group, index) => {
  const current = group.questions[index]
  const prev = group.questions[index - 1]

  if (!current?.passage) {
    return false
  }

  if (!prev?.passage) {
    return true
  }

  return current.passage !== prev.passage
}

const jumpToQuestion = (questionId) => {
  const target = document.getElementById(`question-${questionId}`)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const clearTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const startCountDown = () => {
  clearTimer()
  timer.value = setInterval(async () => {
    if (remainingSeconds.value <= 0) {
      clearTimer()
      await handleSubmit(true)
      return
    }

    remainingSeconds.value -= 1

    if (remainingSeconds.value <= 0) {
      clearTimer()
      await handleSubmit(true)
    }
  }, 1000)
}

const getSubmitAnswers = () => {
  return questions.value
    .filter((question) => isAnswered(question))
    .map((question) => ({
      questionId: question.id,
      answer: String(answers[question.id]).trim(),
    }))
}

const ensureRecordId = async () => {
  if (recordId.value) {
    return recordId.value
  }

  const data = await startExam(examId.value)
  const newRecordId = data?.examRecordId
  if (!newRecordId) {
    throw new Error('缺少 examRecordId')
  }

  recordId.value = Number(newRecordId)
  return recordId.value
}

const handleSubmit = async (autoSubmit = false) => {
  if (submitting.value || hasSubmitted.value) {
    return
  }

  try {
    submitting.value = true
    hasSubmitted.value = true

    const currentRecordId = await ensureRecordId()
    const payload = getSubmitAnswers()

    await submitExam(currentRecordId, payload)
    ElMessage.success('交卷成功')
    localStorage.removeItem(`exam_start_time_${currentRecordId}`)
    await router.replace(`/exam/record/${currentRecordId}/result`)
  } catch (error) {
    hasSubmitted.value = false
    if (!autoSubmit) {
      ElMessage.error('提交失败，请重试')
    }
  } finally {
    submitDialogVisible.value = false
    submitting.value = false
  }
}

const openSubmitDialog = () => {
  submitDialogVisible.value = true
}

const fetchExamData = async () => {
  loading.value = true

  try {
    const [examListData, questionsData] = await Promise.all([
      getExamList(),
      getExamQuestions(examId.value),
    ])

    const examList = Array.isArray(examListData) ? examListData : []
    examInfo.value = examList.find((item) => Number(item.id) === examId.value) || null
    questions.value = Array.isArray(questionsData) ? questionsData : []

    const duration = Number(examInfo.value?.duration || 0)
    const totalSeconds = duration > 0 ? duration * 60 : 0
    const storageKey = examStartTimeStorageKey.value
    if (!storageKey || totalSeconds <= 0) {
      remainingSeconds.value = totalSeconds
    } else {
      const savedStartTime = Number(localStorage.getItem(storageKey) || 0)
      if (savedStartTime > 0) {
        const elapsedSeconds = Math.floor((Date.now() - savedStartTime) / 1000)
        remainingSeconds.value = Math.max(totalSeconds - elapsedSeconds, 0)
      } else {
        localStorage.setItem(storageKey, String(Date.now()))
        remainingSeconds.value = totalSeconds
      }
    }

    startCountDown()
  } catch (error) {
    ElMessage.error('加载试题失败，请返回重试')
  } finally {
    loading.value = false
  }
}

onMounted(fetchExamData)

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="exam-page">
    <header class="exam-header">
      <div>
        <h1>{{ examInfo?.title || '试卷加载中...' }}</h1>
      </div>
      <div class="header-right">
        <span class="timer">剩余时间：{{ formatRemainTime }}</span>
        <el-button type="danger" :loading="submitting" @click="openSubmitDialog">提交试卷</el-button>
      </div>
    </header>

    <el-skeleton v-if="loading" :rows="12" animated class="loading" />

    <div v-else class="exam-content">
      <aside class="question-nav">
        <div v-for="group in groupedQuestions" :key="group.part" class="nav-group">
          <h3>{{ group.label }}</h3>
          <div class="nav-list">
            <el-button
              v-for="question in group.questions"
              :key="question.id"
              size="small"
              :type="isAnswered(question) ? 'primary' : 'default'"
              @click="jumpToQuestion(question.id)"
            >
              {{ question.questionNo }}
            </el-button>
          </div>
        </div>
      </aside>

      <main class="question-main">
        <section v-for="group in groupedQuestions" :key="group.part" class="part-section">
          <h2>{{ group.label }}</h2>

          <template v-if="group.part === 'reading_a' && readingATokens.length">
            <div class="reading-a-article">
              <template v-for="(token, index) in readingATokens" :key="`ra-token-${index}`">
                <template v-if="/^\{\d+\}$/.test(token)">
                  <el-select
                    :model-value="getReadingAAnswer(token.replace(/\{|\}/g, ''))"
                    placeholder="选择词汇"
                    class="inline-select"
                    @update:model-value="setReadingAAnswer(token.replace(/\{|\}/g, ''), $event)"
                  >
                    <el-option
                      v-for="word in readingAData.wordBank"
                      :key="word"
                      :label="word"
                      :value="word"
                    />
                  </el-select>
                </template>
                <template v-else>
                  <span>{{ token }}</span>
                </template>
              </template>
            </div>
          </template>

          <article
            v-for="(question, index) in group.questions"
            :id="`question-${question.id}`"
            :key="question.id"
            class="question-card"
          >
            <h3>{{ question.questionNo }}. {{ question.content }}</h3>

            <template v-if="group.part === 'writing'">
              <el-input
                v-model="answers[question.id]"
                type="textarea"
                :rows="8"
                placeholder="请输入写作内容"
              />
              <p class="word-count">当前字数：{{ (answers[question.id] || '').length }}</p>
            </template>

            <template v-else-if="group.part === 'reading_b'">
              <pre v-if="index === 0 && group.questions[0]?.passage" class="passage-text">{{ group.questions[0].passage }}</pre>
              <el-input
                v-model="answers[question.id]"
                maxlength="1"
                placeholder="填写段落字母 A-M"
                @input="normalizeReadingB(question)"
              />
            </template>

            <template v-else-if="group.part === 'reading_c'">
              <pre
                v-if="shouldShowReadingCPassage(group, index)"
                class="passage-text"
              >{{ question.passage }}</pre>
              <el-radio-group v-model="answers[question.id]">
                <el-radio value="A">A. {{ question.optionA }}</el-radio>
                <el-radio value="B">B. {{ question.optionB }}</el-radio>
                <el-radio value="C">C. {{ question.optionC }}</el-radio>
                <el-radio value="D">D. {{ question.optionD }}</el-radio>
              </el-radio-group>
            </template>

            <template v-else-if="group.part === 'translation'">
              <pre class="passage-text">{{ question.content }}</pre>
              <el-input
                v-model="answers[question.id]"
                type="textarea"
                :rows="6"
                placeholder="请输入英文翻译"
              />
            </template>
          </article>
        </section>
      </main>
    </div>

    <el-dialog v-model="submitDialogVisible" title="确认提交" width="420px">
      <p>已作答 {{ answeredCount }} 题 / 共 {{ totalQuestions }} 题。</p>
      <p>确认后将无法继续修改答案，是否继续提交？</p>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit(false)">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.exam-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.exam-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-header h1 {
  margin: 0;
  font-size: 22px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timer {
  color: #e6a23c;
  font-size: 18px;
  font-weight: 600;
}

.loading {
  margin: 24px;
}

.exam-content {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  padding: 16px;
}

.question-nav {
  position: sticky;
  top: 86px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.nav-group {
  margin-bottom: 12px;
}

.nav-group h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.question-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.part-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.part-section h2 {
  margin: 0 0 12px;
}

.question-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 12px;
}

.question-card h3 {
  margin: 0 0 12px;
  font-size: 16px;
  line-height: 1.6;
}

.passage-text {
  white-space: pre-wrap;
  background: #f9fafc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  margin: 0 0 12px;
  line-height: 1.6;
}

.reading-a-article {
  line-height: 2.2;
  margin-bottom: 14px;
}

.inline-select {
  width: 120px;
  margin: 0 6px;
  vertical-align: middle;
}

.word-count {
  margin: 10px 0 0;
  color: #909399;
}

@media (max-width: 992px) {
  .exam-content {
    grid-template-columns: 1fr;
  }

  .question-nav {
    position: static;
    max-height: none;
  }
}
</style>

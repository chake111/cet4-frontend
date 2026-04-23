<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
const examAnswersStorageKey = computed(() =>
  recordId.value ? `exam_answers_${recordId.value}` : '',
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

// 根据题号获取 reading_a 题目的 id（用于导航锚点）
const getReadingAQuestionId = (questionNo) => {
  return getQuestionIdByNo('reading_a', questionNo)
}

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

// 解析段落匹配的文章，将段落按字母标识拆分
// 支持格式：A) 内容、[A] 内容、A. 内容
const parseReadingBPassage = (passage) => {
  if (!passage) return []

  // 尝试按 A) 格式拆分（实际数据格式：A) 段落内容\n\nB) 段落内容）
  const parenMatches = [...passage.matchAll(/(?:^|\n)\s*([A-M])\)\s*/gm)]
  if (parenMatches.length > 0) {
    const title = passage.slice(0, parenMatches[0].index).trim()
    const segments = parenMatches.map((m, i) => {
      const contentStart = m.index + m[0].length
      const contentEnd = parenMatches[i + 1]?.index ?? passage.length
      return {
        label: m[1],
        text: passage.slice(contentStart, contentEnd).trim(),
      }
    })
    return title ? [{ label: '', text: title, isTitle: true }, ...segments] : segments
  }

  // 尝试按 [A] 格式拆分
  const bracketMatches = [...passage.matchAll(/\[([A-M])\]/g)]
  if (bracketMatches.length > 0) {
    const title = passage.slice(0, bracketMatches[0].index).trim()
    const segments = bracketMatches.map((m, i) => {
      const contentStart = m.index + m[0].length
      const contentEnd = bracketMatches[i + 1]?.index ?? passage.length
      return {
        label: m[1],
        text: passage.slice(contentStart, contentEnd).trim(),
      }
    })
    return title ? [{ label: '', text: title, isTitle: true }, ...segments] : segments
  }

  // 尝试按 A. 格式拆分
  const dotMatches = [...passage.matchAll(/(?:^|\n)\s*([A-M])\.\s*/gm)]
  if (dotMatches.length > 0) {
    const title = passage.slice(0, dotMatches[0].index).trim()
    const segments = dotMatches.map((m, i) => {
      const contentStart = m.index + m[0].length
      const contentEnd = dotMatches[i + 1]?.index ?? passage.length
      return {
        label: m[1],
        text: passage.slice(contentStart, contentEnd).trim(),
      }
    })
    return title ? [{ label: '', text: title, isTitle: true }, ...segments] : segments
  }

  // 无法解析，返回整体
  return [{ label: '', text: passage }]
}

const readingBPassageParsed = computed(() => {
  const group = groupedQuestions.value.find((g) => g.part === 'reading_b')
  const passage = group?.questions?.[0]?.passage || ''
  return parseReadingBPassage(passage)
})

const shouldShowReadingCPassage = (group, index) => {
  const current = group.questions[index]
  const prev = group.questions[index - 1]

  if (!current?.passage) {
    return false
  }

  if (index === 0) {
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
    localStorage.removeItem(`exam_answers_${currentRecordId}`)
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
    const answersStorageKey = examAnswersStorageKey.value
    if (answersStorageKey) {
      const savedAnswersRaw = localStorage.getItem(answersStorageKey)
      if (savedAnswersRaw) {
        try {
          const savedAnswers = JSON.parse(savedAnswersRaw)
          if (savedAnswers && typeof savedAnswers === 'object') {
            Object.assign(answers, savedAnswers)
          }
        } catch (error) {
          localStorage.removeItem(answersStorageKey)
        }
      }
    }

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

watch(
  answers,
  (newAnswers) => {
    const answersStorageKey = examAnswersStorageKey.value
    if (!answersStorageKey) {
      return
    }
    localStorage.setItem(answersStorageKey, JSON.stringify(newAnswers))
  },
  { deep: true },
)

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
        <div class="nav-progress">
          <div class="nav-progress-text">
            <span class="nav-progress-answered">{{ answeredCount }}</span>
            <span class="nav-progress-sep">/</span>
            <span class="nav-progress-total">{{ totalQuestions }}</span>
            <span class="nav-progress-label">已作答</span>
          </div>
          <div class="nav-progress-bar">
            <div
              class="nav-progress-fill"
              :style="{ width: totalQuestions > 0 ? (answeredCount / totalQuestions * 100) + '%' : '0%' }"
            />
          </div>
        </div>
        <div class="nav-legend">
          <span class="legend-item legend-answered"><i />已答</span>
          <span class="legend-item legend-unanswered"><i />未答</span>
        </div>
        <div v-for="group in groupedQuestions" :key="group.part" class="nav-group">
          <h3 class="nav-group-title">{{ group.label }}</h3>
          <div class="nav-list">
            <button
              v-for="question in group.questions"
              :key="question.id"
              class="nav-btn"
              :class="{ 'is-answered': isAnswered(question) }"
              :title="`第 ${question.questionNo} 题`"
              @click="jumpToQuestion(question.id)"
            >
              {{ question.questionNo }}
            </button>
          </div>
        </div>
      </aside>

      <main class="question-main">
        <section v-for="group in groupedQuestions" :key="group.part" class="part-section">
          <h2>{{ group.label }}</h2>

          <!-- 选词填空 reading_a -->
          <template v-if="group.part === 'reading_a' && readingATokens.length">
            <div class="reading-a-article">
              <template v-for="(token, index) in readingATokens" :key="`ra-token-${index}`">
                <template v-if="/^\{\d+\}$/.test(token)">
                  <span
                    :id="`question-${getReadingAQuestionId(token.replace(/\{|\}/g, ''))}`"
                    class="inline-select-anchor"
                  >
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
                  </span>
                </template>
                <template v-else>
                  <span>{{ token }}</span>
                </template>
              </template>
            </div>
          </template>

          <!-- 写作 writing -->
          <template v-else-if="group.part === 'writing'">
            <article
              v-for="question in group.questions"
              :id="`question-${question.id}`"
              :key="question.id"
              class="question-card"
            >
              <h3>{{ question.questionNo }}. {{ question.content }}</h3>
              <el-input
                v-model="answers[question.id]"
                type="textarea"
                :rows="8"
                placeholder="请输入写作内容"
              />
              <p class="word-count">当前字数：{{ (answers[question.id] || '').length }}</p>
            </article>
          </template>

          <!-- 段落匹配 reading_b -->
          <template v-else-if="group.part === 'reading_b'">
            <!-- 段落文章区域：结构化展示各段落 -->
            <div v-if="readingBPassageParsed.length" class="reading-b-passage">
              <!-- 文章标题 -->
              <template v-for="seg in readingBPassageParsed" :key="seg.label || 'title'">
                <div v-if="seg.isTitle" class="reading-b-title">{{ seg.text }}</div>
                <div v-else class="reading-b-paragraph">
                  <span v-if="seg.label" class="paragraph-label">{{ seg.label }})</span>
                  <span class="paragraph-text">{{ seg.text }}</span>
                </div>
              </template>
            </div>
            <!-- 题目列表 -->
            <div class="reading-b-questions">
              <article
                v-for="question in group.questions"
                :id="`question-${question.id}`"
                :key="question.id"
                class="question-card"
              >
                <p class="question-stem">{{ question.questionNo }}. {{ question.content }}</p>
                <el-input
                  v-model="answers[question.id]"
                  maxlength="1"
                  placeholder="填写段落字母 A-M"
                  class="reading-b-input"
                  @input="normalizeReadingB(question)"
                />
              </article>
            </div>
          </template>

          <!-- 阅读理解 reading_c -->
          <template v-else-if="group.part === 'reading_c'">
            <template v-for="(question, index) in group.questions" :key="question.id">
              <!-- 文章段落：换文章时单独展示 -->
              <div
                v-if="shouldShowReadingCPassage(group, index)"
                class="passage-block"
              >
                <div class="passage-text">{{ question.passage }}</div>
              </div>
              <!-- 题目卡片 -->
              <article
                :id="`question-${question.id}`"
                class="question-card"
              >
                <p class="question-stem">{{ question.questionNo }}. {{ question.content }}</p>
                <el-radio-group v-model="answers[question.id]" class="options-group">
                  <el-radio value="A" class="option-item">A. {{ question.optionA }}</el-radio>
                  <el-radio value="B" class="option-item">B. {{ question.optionB }}</el-radio>
                  <el-radio value="C" class="option-item">C. {{ question.optionC }}</el-radio>
                  <el-radio value="D" class="option-item">D. {{ question.optionD }}</el-radio>
                </el-radio-group>
              </article>
            </template>
          </template>

          <!-- 翻译 translation -->
          <template v-else-if="group.part === 'translation'">
            <article
              v-for="question in group.questions"
              :id="`question-${question.id}`"
              :key="question.id"
              class="question-card"
            >
              <div class="passage-text translation-source">{{ question.questionNo }}. {{ question.content }}</div>
              <el-input
                v-model="answers[question.id]"
                type="textarea"
                :rows="6"
                placeholder="请输入英文翻译"
              />
            </article>
          </template>
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
  padding: 14px 12px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* 进度统计 */
.nav-progress {
  margin-bottom: 10px;
}

.nav-progress-text {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: 6px;
}

.nav-progress-answered {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
}

.nav-progress-sep {
  font-size: 14px;
  color: #c0c4cc;
}

.nav-progress-total {
  font-size: 15px;
  font-weight: 600;
  color: #606266;
}

.nav-progress-label {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.nav-progress-bar {
  height: 5px;
  background: #ebeef5;
  border-radius: 99px;
  overflow: hidden;
}

.nav-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 99px;
  transition: width 0.4s ease;
}

/* 图例 */
.nav-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #909399;
}

.legend-item i {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-answered i {
  background: #409eff;
}

.legend-unanswered i {
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
}

/* 分组 */
.nav-group {
  margin-bottom: 14px;
}

.nav-group-title {
  margin: 0 0 7px;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* 自定义题号按钮 */
.nav-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1.5px solid #dcdfe6;
  border-radius: 6px;
  background: #f5f7fa;
  color: #606266;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.nav-btn:active {
  transform: scale(0.92);
}

.nav-btn.is-answered {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
  font-weight: 600;
}

.nav-btn.is-answered:hover {
  background: #66b1ff;
  border-color: #66b1ff;
  color: #fff;
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
  border-radius: 6px;
  margin-bottom: 12px;
}

.question-stem {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
  color: #303133;
}

/* 文章段落块（阅读理解） */
.passage-block {
  margin-bottom: 16px;
}

.passage-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 15px;
  background: #f4f6fb;
  border-left: 4px solid #409eff;
  border-radius: 0 6px 6px 0;
  padding: 14px 16px;
  margin: 0;
  line-height: 1.9;
  color: #303133;
}

/* 阅读理解选项 */
.options-group {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  width: 100% !important;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  line-height: 1.6;
  white-space: normal;
  height: auto;
  width: 100%;
  margin-right: 0 !important;
}

.option-item :deep(.el-radio__input) {
  flex-shrink: 0;
  margin-top: 3px;
}

.option-item :deep(.el-radio__label) {
  white-space: normal;
  word-break: break-word;
  line-height: 1.6;
  vertical-align: top;
  padding-left: 8px;
}

/* 段落匹配文章区域 */
.reading-b-passage {
  background: #f4f6fb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.reading-b-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 14px;
  text-align: center;
}

.reading-b-paragraph {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  line-height: 1.8;
  font-size: 15px;
  color: #303133;
}

.reading-b-paragraph:last-child {
  margin-bottom: 0;
}

.paragraph-label {
  flex-shrink: 0;
  font-weight: 700;
  color: #409eff;
  font-size: 15px;
  min-width: 28px;
}

.paragraph-text {
  flex: 1;
}

.reading-b-questions {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.reading-b-input {
  max-width: 200px;
}

/* 选词填空 */
.reading-a-article {
  line-height: 2.4;
  margin-bottom: 14px;
  font-size: 15px;
  color: #303133;
}

.inline-select-anchor {
  display: inline;
  vertical-align: middle;
}

.inline-select {
  width: 130px;
  margin: 0 4px;
  vertical-align: middle;
}

/* 翻译原文 */
.translation-source {
  font-size: 15px;
  margin-bottom: 12px;
}

.word-count {
  margin: 10px 0 0;
  color: #909399;
  font-size: 13px;
}

@media (max-width: 992px) {
  .exam-content {
    grid-template-columns: 1fr;
  }

  .question-nav {
    position: static;
    max-height: none;
  }

  .reading-b-input {
    max-width: 100%;
  }
}
</style>

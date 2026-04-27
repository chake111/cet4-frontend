<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { getListeningSectionInfo } from '@/stores/exam.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const result = ref(null)
const showWrongOnly = ref(false)
const showBackTop = ref(false)

/* ---- 排序与标签映射 ---- */
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

const questionTypeLabelMap = {
  single_choice: '选择题',
  blank_filling: '填空题',
  matching: '匹配题',
  writing: '写作题',
  translation: '翻译题',
}

const objectiveTypes = ['single_choice', 'blank_filling', 'matching']
const subjectiveTypes = ['writing', 'translation']

/* ---- 工具函数 ---- */
const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined || answer === '') return '未作答'
  if (Array.isArray(answer)) return answer.join('、')
  return String(answer)
}

const parseTime = (value) => {
  if (!value) return null
  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? null : time
}

const formatDuration = (startTime, submitTime) => {
  const start = parseTime(startTime)
  const end = parseTime(submitTime)
  if (!start || !end || end < start) return '--:--:--'
  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':')
}

const parseAiFeedback = (feedback) => {
  if (!feedback) return null
  if (typeof feedback === 'object') return feedback
  try {
    return JSON.parse(feedback)
  } catch {
    return null
  }
}

const isStructuredFeedback = (feedback) => {
  const parsed = parseAiFeedback(feedback)
  if (!parsed || typeof parsed !== 'object') return false
  return !!(parsed.overall || parsed.strengths || parsed.weaknesses || parsed.suggestions || parsed.accuracy || parsed.expression)
}

const partToStage = (part) => {
  if (part === 'writing') return 'writing'
  if (part === 'listening') return 'listening'
  if (part && part.startsWith('reading')) return 'reading'
  if (part === 'translation') return 'translation'
  return part
}

/* ---- 题目分类 ---- */
const isObjectiveQuestion = (question) => {
  if (objectiveTypes.includes(question.questionType)) return true
  if (subjectiveTypes.includes(question.questionType)) return false
  return question.correct !== null && question.correct !== undefined
}

const isSubjectiveQuestion = (question) => subjectiveTypes.includes(question.questionType)

const getScoreText = (question) => {
  const score = question.score ?? '--'
  const fullScore = question.fullScore ?? '--'
  return `${score} / ${fullScore}`
}

/* ---- 计算属性：排序与分组 ---- */
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

const hasWrongAnswers = computed(() => {
  return groupedAnswers.value.some(group =>
    group.questions.some(q => isObjectiveQuestion(q) && q.correct === false),
  )
})

/* ---- 按四大阶段分组 ---- */
const stageOrderList = ['writing', 'listening', 'reading', 'translation']
const stageLabels = { writing: '写作', listening: '听力', reading: '阅读', translation: '翻译' }

const stageGroupedAnswers = computed(() => {
  const groupMap = new Map()
  for (const item of sortedAnswers.value) {
    const stageKey = partToStage(item.part)
    if (!groupMap.has(stageKey)) {
      groupMap.set(stageKey, {
        stage: stageKey,
        label: stageLabels[stageKey] || stageKey,
        questions: [],
      })
    }
    groupMap.get(stageKey).questions.push(item)
  }
  return stageOrderList
    .filter(key => groupMap.has(key))
    .map(key => groupMap.get(key))
})

/* ---- 听力/阅读按 session 分组 ---- */
const buildListeningSessions = (questions) => {
  const sectionMap = new Map()
  for (const q of questions) {
    const info = getListeningSectionInfo(q.questionNo)
    const key = info.sectionLabel
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        sessionId: key,
        sessionTitle: `${info.sectionLabel} · ${info.sectionTitle}`,
        questions: [],
      })
    }
    sectionMap.get(key).questions.push(q)
  }
  return Array.from(sectionMap.values())
}

const buildReadingSessions = (questions) => {
  const partMap = new Map()
  for (const q of questions) {
    const partKey = q.part || 'reading'
    if (!partMap.has(partKey)) {
      partMap.set(partKey, {
        sessionId: partKey,
        sessionTitle: partLabelMap[partKey] || partKey,
        questions: [],
      })
    }
    partMap.get(partKey).questions.push(q)
  }
  return Array.from(partMap.values()).sort((a, b) => {
    return (partOrder[a.sessionId] || 99) - (partOrder[b.sessionId] || 99)
  })
}

/* ---- 阶段 + session 分组（核心计算属性） ---- */
const stageSessionAnswers = computed(() => {
  return stageGroupedAnswers.value.map(stage => {
    const objectiveQuestions = stage.questions.filter(q => isObjectiveQuestion(q))
    const subjectiveQuestions = stage.questions.filter(q => isSubjectiveQuestion(q))

    let sessions = []
    if (stage.stage === 'listening' && objectiveQuestions.length > 0) {
      sessions = buildListeningSessions(objectiveQuestions)
    } else if (stage.stage === 'reading' && objectiveQuestions.length > 0) {
      sessions = buildReadingSessions(objectiveQuestions)
    } else if (objectiveQuestions.length > 0) {
      sessions = [{ sessionId: 'default', sessionTitle: '', questions: objectiveQuestions }]
    }

    return {
      ...stage,
      sessions,
      subjectiveQuestions,
    }
  })
})

const stageSessionFilteredAnswers = computed(() => {
  if (!showWrongOnly.value) return stageSessionAnswers.value

  return stageSessionAnswers.value
    .map(stage => {
      const filteredSessions = stage.sessions
        .map(session => ({
          ...session,
          questions: session.questions.filter(q => q.correct === false),
        }))
        .filter(session => session.questions.length > 0)

      return {
        ...stage,
        sessions: filteredSessions,
        subjectiveQuestions: [],
      }
    })
    .filter(stage => stage.sessions.length > 0 || stage.subjectiveQuestions.length > 0)
})

/* ---- 四项能力拆解 ---- */
const skillBreakdown = computed(() => {
  if (!result.value) return []
  const stages = [
    { key: 'writing', label: '写作', maxScore: 106 },
    { key: 'listening', label: '听力', maxScore: 249 },
    { key: 'reading', label: '阅读', maxScore: 249 },
    { key: 'translation', label: '翻译', maxScore: 106 },
  ]
  const answers = result.value.answerDetails || []
  return stages.map(s => {
    const stageAnswers = answers.filter(a => partToStage(a.part) === s.key)
    const earned = stageAnswers.reduce((sum, a) => sum + (a.score || 0), 0)
    return {
      key: s.key,
      label: s.label,
      earned,
      max: s.maxScore,
      percent: s.maxScore > 0 ? Math.min((earned / s.maxScore) * 100, 100) : 0,
    }
  })
})

/* ---- 概览信息 ---- */
const objectiveCorrectCount = computed(() => result.value?.objectiveCorrect ?? 0)
const objectiveTotalCount = computed(() => result.value?.objectiveTotal ?? 0)
const objectiveAccuracy = computed(() => `${objectiveCorrectCount.value}/${objectiveTotalCount.value}`)
const durationText = computed(() => formatDuration(result.value?.startTime, result.value?.submittedAt))

const statusText = computed(() => {
  const score = result.value?.score
  if (score === undefined || score === null) return '--'
  return score > 0 ? '已完成' : '未作答'
})

const examTitle = computed(() => 'CET-4 模拟考试')

const submitTimeText = computed(() => {
  const time = parseTime(result.value?.submittedAt)
  if (!time) return '--'
  const y = time.getFullYear()
  const m = String(time.getMonth() + 1).padStart(2, '0')
  const d = String(time.getDate()).padStart(2, '0')
  const h = String(time.getHours()).padStart(2, '0')
  const min = String(time.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
})

/* ---- 操作 ---- */
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
    ElMessage.error('获取结果失败，稍后重试')
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
  <div class="result-page">
    <!-- 顶部栏 -->
    <header class="result-header">
      <span class="header-brand">CET-4 模拟考试</span>
      <span class="header-link" @click="goHome">返回首页</span>
    </header>

    <!-- 主体区域 -->
    <main class="result-main">
      <el-skeleton :loading="loading" animated :rows="10">
        <template #template>
          <div class="skeleton-wrap">
            <el-skeleton-item variant="rect" class="skeleton-overview" />
            <el-skeleton-item variant="rect" class="skeleton-breakdown" />
            <el-skeleton-item variant="rect" class="skeleton-detail" />
          </div>
        </template>

        <template #default>
          <!-- 成绩概览区 -->
          <section class="overview-card">
            <div class="overview-meta">
              <span>{{ submitTimeText }}</span>
              <span class="meta-sep">·</span>
              <span>用时 {{ durationText }}</span>
              <span class="meta-sep">·</span>
              <span>{{ statusText }}</span>
            </div>
            <div class="overview-score">
              <span class="score-value">{{ result?.score ?? 0 }}</span>
            </div>
            <div class="score-total-label">总分 710</div>
          </section>

          <!-- 四项能力拆解 -->
          <section class="breakdown-card">
            <div class="breakdown-grid">
              <div v-for="item in skillBreakdown" :key="item.key" class="breakdown-item">
                <div class="breakdown-label">{{ item.label }}</div>
                <div class="breakdown-score">{{ item.earned }}/{{ item.max }}</div>
                <div class="breakdown-bar">
                  <div class="breakdown-bar-fill" :style="{ width: item.percent + '%' }"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- 分割线 -->
          <div class="section-divider"></div>

          <!-- 筛选栏 -->
          <div class="filter-bar">
            <el-checkbox v-model="showWrongOnly" label="只看错题" />
          </div>

          <!-- 详细复盘 -->
          <div v-if="showWrongOnly && stageSessionFilteredAnswers.length === 0" class="empty-wrong">
            <el-empty description="暂无错题" :image-size="80" />
          </div>

          <div v-else class="detail-list">
            <section v-for="group in stageSessionFilteredAnswers" :key="group.stage" class="detail-section">
              <h3 class="detail-section-title">{{ group.label }}</h3>

              <!-- 客观题：按 session 分组的卡片 -->
              <div v-for="session in group.sessions" :key="session.sessionId" class="session-card">
                <div v-if="session.sessionTitle" class="session-header">
                  <span class="session-title">{{ session.sessionTitle }}</span>
                  <span class="session-meta">{{ session.questions.length }} 题</span>
                </div>
                <div class="session-question-list">
                  <!-- 表头 -->
                  <div class="session-question-header">
                    <span class="sq-col sq-col-no">题号</span>
                    <span class="sq-col sq-col-my">我的答案</span>
                    <span class="sq-col sq-col-correct">正确答案</span>
                    <span class="sq-col sq-col-score">得分</span>
                    <span class="sq-col sq-col-status">状态</span>
                  </div>
                  <!-- 题目行 -->
                  <div v-for="question in session.questions" :key="question.questionId"
                    class="session-question-row" :class="{
                      'row-wrong': question.correct === false,
                      'row-unanswered': normalizeAnswer(question.userAnswer) === '未作答',
                    }">
                    <span class="sq-col sq-col-no">Q{{ question.questionNo }}</span>
                    <span class="sq-col sq-col-my" :class="{
                      'text-danger': question.correct === false,
                      'text-tertiary': normalizeAnswer(question.userAnswer) === '未作答',
                    }">{{ normalizeAnswer(question.userAnswer) }}</span>
                    <span class="sq-col sq-col-correct">{{ normalizeAnswer(question.correctAnswer) }}</span>
                    <span class="sq-col sq-col-score">{{ getScoreText(question) }}</span>
                    <span class="sq-col sq-col-status">
                      <span v-if="question.correct === true" class="status-tag tag-correct">正确</span>
                      <span v-else-if="question.correct === false" class="status-tag tag-wrong">错误</span>
                      <span v-else class="status-tag tag-unanswered">未作答</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 主观题：列表排列 -->
              <div v-if="group.subjectiveQuestions.length > 0" class="subjective-list">
                <div v-for="question in group.subjectiveQuestions" :key="question.questionId"
                  class="question-item">
                  <div class="question-header">
                    <span class="question-no">Q{{ question.questionNo }}</span>
                  </div>

                  <div class="question-row subjective-row">
                    <span class="row-label">我的答案</span>
                    <div class="subjective-content">{{ normalizeAnswer(question.userAnswer) }}</div>
                  </div>
                  <!-- 结构化 AI 反馈 -->
                  <div v-if="question.aiFeedback && isStructuredFeedback(question.aiFeedback)"
                    class="ai-feedback-panel">
                    <div v-if="parseAiFeedback(question.aiFeedback)?.overall" class="feedback-section">
                      <div class="feedback-label">总体评价</div>
                      <div class="feedback-content">{{ parseAiFeedback(question.aiFeedback).overall }}</div>
                    </div>

                    <div v-if="parseAiFeedback(question.aiFeedback)?.strengths?.length" class="feedback-section">
                      <div class="feedback-label">优点</div>
                      <ul class="feedback-list">
                        <li v-for="(item, idx) in parseAiFeedback(question.aiFeedback).strengths" :key="'s' + idx">{{ item
                          }}</li>
                      </ul>
                    </div>

                    <div v-if="parseAiFeedback(question.aiFeedback)?.accuracy" class="feedback-section">
                      <div class="feedback-label">准确性</div>
                      <div class="feedback-content">{{ parseAiFeedback(question.aiFeedback).accuracy }}</div>
                    </div>

                    <div v-if="parseAiFeedback(question.aiFeedback)?.expression" class="feedback-section">
                      <div class="feedback-label">语言表达</div>
                      <div class="feedback-content">{{ parseAiFeedback(question.aiFeedback).expression }}</div>
                    </div>

                    <div v-if="parseAiFeedback(question.aiFeedback)?.weaknesses?.length" class="feedback-section">
                      <div class="feedback-label">存在问题</div>
                      <ul class="feedback-list">
                        <li v-for="(item, idx) in parseAiFeedback(question.aiFeedback).weaknesses" :key="'w' + idx">{{
                          item }}</li>
                      </ul>
                    </div>

                    <div v-if="parseAiFeedback(question.aiFeedback)?.suggestions?.length" class="feedback-section">
                      <div class="feedback-label">改进建议</div>
                      <ul class="feedback-list">
                        <li v-for="(item, idx) in parseAiFeedback(question.aiFeedback).suggestions" :key="'g' + idx">{{
                          item }}</li>
                      </ul>
                    </div>
                  </div>

                  <!-- 非结构化 AI 反馈 -->
                  <div v-else-if="question.aiFeedback" class="ai-feedback-plain">
                    {{ question.aiFeedback }}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </template>
      </el-skeleton>
    </main>

    <!-- 返回顶部 -->
    <transition>
      <button v-if="showBackTop" class="modern-back-top" @click="scrollToTop" aria-label="回到顶部">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<style scoped>
/* ---- 页面容器 ---- */
.result-page {
  min-height: 100vh;
  background: var(--c-bg-weak);
}

/* ---- 顶部栏 ---- */
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: var(--c-primary);
  color: #FFFFFF;
}

.header-brand {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.header-link {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: color 0.2s;
}

.header-link:hover {
  color: #FFFFFF;
  text-decoration: underline;
}

/* ---- 主体区域 ---- */
.result-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px;
}

/* ---- 骨架屏 ---- */
.skeleton-wrap {
  display: grid;
  gap: 16px;
}

.skeleton-overview {
  width: 100%;
  height: 160px;
  border-radius: var(--r-card);
}

.skeleton-breakdown {
  width: 100%;
  height: 80px;
  border-radius: var(--r-card);
}

.skeleton-detail {
  width: 100%;
  height: 240px;
  border-radius: var(--r-card);
}

/* ---- 成绩概览区 ---- */
.overview-card {
  background: var(--c-bg);
  border-radius: var(--r-card);
  padding: 32px;
  margin-bottom: 16px;
}

.overview-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 8px;
}

.overview-meta {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin-bottom: 24px;
}

.meta-sep {
  margin: 0 8px;
  color: var(--c-text-tertiary);
}

.overview-score {
  margin-bottom: 4px;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1.1;
}

.score-total-label {
  font-size: 14px;
  color: var(--c-text-tertiary);
}

/* ---- 四项能力拆解 ---- */
.breakdown-card {
  background: var(--c-bg);
  border-radius: var(--r-card);
  padding: 24px 32px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.breakdown-item {
  min-width: 0;
}

.breakdown-label {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin-bottom: 6px;
}

.breakdown-score {
  font-size: 20px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 8px;
  font-family: var(--font-mono);
}

.breakdown-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--c-border);
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--c-accent);
  transition: width 0.4s ease;
}

/* ---- 分割线 ---- */
.section-divider {
  height: 1px;
  background: var(--c-border);
  margin: 32px 0;
}

/* ---- 筛选栏 ---- */
.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

/* ---- 详细复盘 ---- */
.detail-list {
  display: grid;
  gap: 32px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
  padding-bottom: 8px;
  margin-bottom: 16px;
}

/* ---- Session 卡片 ---- */
.session-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  margin-bottom: 16px;
  overflow: hidden;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-weak);
}

.session-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
}

.session-meta {
  font-size: 12px;
  color: var(--c-text-tertiary);
}

.session-question-list {
  /* no extra padding */
}

/* ---- Session 内表格行 ---- */
.session-question-header,
.session-question-row {
  display: grid;
  grid-template-columns: 56px 1fr 1fr 80px 72px;
  align-items: center;
  padding: 0 16px;
  min-width: 480px;
}

.session-question-header {
  background: var(--c-bg-weak);
  font-size: 12px;
  color: var(--c-text-tertiary);
  line-height: 32px;
  font-weight: 500;
  border-bottom: 1px solid var(--c-border);
}

.session-question-row {
  font-size: 13px;
  color: var(--c-text-primary);
  line-height: 40px;
  border-bottom: 1px solid var(--c-border);
  transition: background 0.15s;
}

.session-question-row:last-child {
  border-bottom: none;
}

.session-question-row.row-wrong {
  background: #FEF2F2;
}

.session-question-row.row-unanswered {
  background: #F9FAFB;
}

.sq-col-no {
  font-weight: 600;
  color: #6B7280;
}

.sq-col-my {
  word-break: break-all;
  padding-right: 8px;
}

.sq-col-correct {
  word-break: break-all;
  padding-right: 8px;
  font-weight: 500;
}

.sq-col-score {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #6B7280;
}

.sq-col-status {
  text-align: center;
}

/* ---- 状态标签 ---- */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
}

.tag-correct {
  background: #F0FDF4;
  color: #16A34A;
}

.tag-wrong {
  background: #FEF2F2;
  color: #DC2626;
}

.tag-unanswered {
  background: #F3F4F6;
  color: #6B7280;
}

/* ---- 主观题列表布局 ---- */
.subjective-list {
  display: grid;
  gap: 0;
}

/* ---- 题目项 ---- */
.question-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--c-border);
}

.question-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.question-no {
  font-weight: 600;
  color: #6B7280;
}

.question-type-tag {
  --el-tag-bg-color: var(--c-bg-weak);
  --el-tag-border-color: var(--c-border);
  --el-tag-text-color: var(--c-text-tertiary);
  border-radius: var(--r-tag);
}

.question-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  line-height: 1.7;
  font-size: 14px;
}

.question-row:last-child {
  margin-bottom: 0;
}

.row-label {
  flex-shrink: 0;
  width: 72px;
  color: var(--c-text-tertiary);
  font-size: 13px;
}

.row-value {
  color: var(--c-text-primary);
}

.text-success {
  color: var(--c-success);
  font-weight: 600;
}

.text-danger {
  color: var(--c-danger);
  font-weight: 600;
}

.text-tertiary {
  color: var(--c-text-tertiary);
}

.text-primary {
  color: var(--c-text-primary);
  font-weight: 600;
}

/* ---- 结果标记 ---- */
.result-correct {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-success);
}

.result-wrong {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-danger);
}

.result-pending {
  font-size: 13px;
  color: var(--c-text-tertiary);
}

/* ---- 主观题 ---- */
.subjective-row {
  gap: 0;
}

.subjective-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--c-text-primary);
  flex: 1;
  max-width: 100%;
  overflow-wrap: break-word;
  font-size: 14px;
  line-height: 1.7;
}

.ai-score-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-warning);
  margin-right: 8px;
}

.ai-score-value {
  font-weight: 600;
  color: var(--c-warning);
}

/* ---- AI 评语面板 ---- */
.ai-feedback-panel {
  margin-top: 12px;
  padding: 16px;
  background: var(--c-bg-weak);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
}

.feedback-section {
  margin-bottom: 12px;
}

.feedback-section:last-child {
  margin-bottom: 0;
}

.feedback-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 4px;
}

.feedback-content {
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.6;
}

.feedback-list {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.6;
}

.feedback-list li {
  list-style-type: disc;
  margin-bottom: 2px;
}

.ai-feedback-plain {
  margin-top: 12px;
  padding: 16px;
  background: var(--c-bg-weak);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ---- 空状态 ---- */
.empty-wrong {
  padding: 40px 0;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .result-main {
    padding: 20px 16px;
  }

  .overview-card {
    padding: 24px 20px;
  }

  .breakdown-card {
    padding: 20px;
  }

  .breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .score-value {
    font-size: 36px;
  }

  .session-question-header,
  .session-question-row {
    padding: 0 10px;
  }
}

@media (max-width: 480px) {
  .result-header {
    padding: 0 16px;
  }

  .result-main {
    padding: 16px 12px;
  }

  .overview-card {
    padding: 20px 16px;
  }

  .breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .session-question-header,
  .session-question-row {
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EXAM_TITLE } from '@/constants/exam'
import { useBackTop } from '@/composables/useBackTop'
import { examService } from '@/services/examService'
import { formatDateTime, formatDuration } from '@/utils/date'
import {
  buildGroupedAnswers,
  buildSkillBreakdown,
  buildStageGroupedAnswers,
  buildStageSessionAnswers,
  filterWrongStageSessionAnswers,
  isObjectiveQuestion,
  sortAnswerDetails,
} from '@/utils/examResult'
import ResultOverview from '@/components/exam/result/ResultOverview.vue'
import SkillBreakdown from '@/components/exam/result/SkillBreakdown.vue'
import AnswerReviewSection from '@/components/exam/result/AnswerReviewSection.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const result = ref(null)
const showWrongOnly = ref(false)
const { showBackTop, scrollToTop } = useBackTop()

const sortedAnswers = computed(() => sortAnswerDetails(result.value?.answerDetails || []))
const groupedAnswers = computed(() => buildGroupedAnswers(sortedAnswers.value))
const hasWrongAnswers = computed(() => {
  return groupedAnswers.value.some((group) =>
    group.questions.some((question) => isObjectiveQuestion(question) && question.correct === false),
  )
})

const stageGroupedAnswers = computed(() => buildStageGroupedAnswers(sortedAnswers.value))
const stageSessionAnswers = computed(() => buildStageSessionAnswers(stageGroupedAnswers.value))
const stageSessionFilteredAnswers = computed(() => {
  if (!showWrongOnly.value) return stageSessionAnswers.value
  return filterWrongStageSessionAnswers(stageSessionAnswers.value)
})

const skillBreakdown = computed(() => buildSkillBreakdown(result.value))
const durationText = computed(() => formatDuration(result.value?.startTime, result.value?.submittedAt))
const submitTimeText = computed(() => formatDateTime(result.value?.submittedAt, '--'))
const statusText = computed(() => {
  const score = result.value?.score
  if (score === undefined || score === null) return '--'
  return score > 0 ? '已完成' : '未作答'
})

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
    const res = await examService.getExamResult(recordId)
    result.value = res?.data || {}
  } catch {
    ElMessage.error('获取结果失败，请稍后重试')
    result.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(fetchResult)
</script>

<template>
  <div class="result-page">
    <header class="result-header">
      <span class="header-brand">{{ EXAM_TITLE }}</span>
      <span class="header-link" @click="goHome">返回首页</span>
    </header>

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
          <ResultOverview
            :submit-time-text="submitTimeText"
            :duration-text="durationText"
            :status-text="statusText"
            :score="result?.score ?? 0"
          />

          <SkillBreakdown :items="skillBreakdown" />

          <div class="section-divider"></div>

          <div class="filter-bar">
            <el-checkbox v-model="showWrongOnly" label="只看错题" :disabled="!hasWrongAnswers" />
          </div>

          <div v-if="showWrongOnly && stageSessionFilteredAnswers.length === 0" class="empty-wrong">
            <el-empty description="暂无错题" :image-size="80" />
          </div>

          <AnswerReviewSection v-else :groups="stageSessionFilteredAnswers" />
        </template>
      </el-skeleton>
    </main>

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
.result-page {
  min-height: 100vh;
  background: var(--c-bg-weak);
}

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

.result-main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px;
}

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

.section-divider {
  height: 1px;
  background: var(--c-border);
  margin: 32px 0;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.empty-wrong {
  padding: 40px 0;
}

@media (max-width: 768px) {
  .result-main {
    padding: 20px 16px;
  }
}

@media (max-width: 480px) {
  .result-header {
    padding: 0 16px;
  }

  .result-main {
    padding: 16px 12px;
  }
}
</style>

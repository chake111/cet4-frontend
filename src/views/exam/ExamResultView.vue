<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamResult } from '@/composables/useExamResult'
import ResultPageHeader from '@/components/layout/ResultPageHeader.vue'
import BackTopButton from '@/components/layout/BackTopButton.vue'
import ResultSkeleton from '@/components/exam/result/ResultSkeleton.vue'
import ResultOverview from '@/components/exam/result/ResultOverview.vue'
import SkillBreakdown from '@/components/exam/result/SkillBreakdown.vue'
import AnswerReviewSection from '@/components/exam/result/AnswerReviewSection.vue'

const route = useRoute()
const router = useRouter()

const recordId = computed(() => route.params.recordId || route.params.examId)
const {
  loading,
  result,
  showWrongOnly,
  fetchResult,
  hasWrongAnswers,
  stageSessionFilteredAnswers,
  skillBreakdown,
  durationText,
  submitTimeText,
  statusText,
} = useExamResult(recordId)

const goHome = () => router.push('/exam')

onMounted(fetchResult)
</script>

<template>
  <div class="result-page">
    <ResultPageHeader @back="goHome" />
    <main class="result-main">
      <el-skeleton :loading="loading" animated :rows="10">
        <template #template>
          <ResultSkeleton />
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
    <BackTopButton />
  </div>
</template>

<style scoped>
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
</style>

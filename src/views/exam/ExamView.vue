<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useExamSessionStore } from '@/stores/examSession'
import { useExamFlow } from '@/composables/useExamFlow'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import ExamFooter from '@/components/exam/ExamFooter.vue'
import WritingStage from '@/components/exam/stages/WritingStage.vue'
import ListeningStage from '@/components/exam/stages/ListeningStage.vue'
import ReadingStage from '@/components/exam/stages/ReadingStage.vue'
import TranslationStage from '@/components/exam/stages/TranslationStage.vue'

const route = useRoute()
const sessionStore = useExamSessionStore()
const { submitting, isLastStage, startExam, stopExam, goToNextStage, handleSubmit } = useExamFlow()

const stageComponentMap = {
  writing: WritingStage,
  listening: ListeningStage,
  reading: ReadingStage,
  translation: TranslationStage,
}

const currentStageComponent = computed(
  () => stageComponentMap[sessionStore.currentStage] || WritingStage
)

const currentQuestions = computed(() => {
  const stage = sessionStore.currentStage
  if (!stage) return []
  return sessionStore.questionsByStage[stage] || []
})

/** 预加载考试结果页组件，减少交卷后等待时间 */
const preloadResultView = () => {
  import('@/views/exam/ExamResultView.vue')
}

onMounted(() => {
  startExam(route.params.id)
  // 考试开始后预加载结果页
  preloadResultView()
})

onUnmounted(() => {
  stopExam()
  // TODO: 任务 1.3 恢复离开页面时的答题草稿上报 API
})
</script>

<template>
  <div class="exam-view">
    <ExamHeader class="exam-header-fixed" />
    <div class="exam-content">
      <main>
        <component :is="currentStageComponent" :questions="currentQuestions" />
      </main>
      <ExamFooter
        :is-last-stage="isLastStage"
        :is-submitting="submitting"
        @next="goToNextStage"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.exam-view {
  min-height: 100vh;
  background: var(--c-bg-weak);
}
.exam-header-fixed {
  position: sticky;
  top: 0;
  z-index: 20;
}
.exam-content {
  max-width: 920px;
  margin: 0 auto;
  padding: 24px 20px;
}
@media (max-width: 480px) {
  .exam-content {
    padding: 16px 12px;
  }
}
</style>

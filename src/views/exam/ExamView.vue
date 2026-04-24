<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import WritingStage from '@/components/exam/stages/WritingStage.vue'
import ListeningStage from '@/components/exam/stages/ListeningStage.vue'
import ReadingStage from '@/components/exam/stages/ReadingStage.vue'
import TranslationStage from '@/components/exam/stages/TranslationStage.vue'
import { useExamStore } from '@/stores/exam'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()

const stageComponentMap = {
  writing: WritingStage,
  listening: ListeningStage,
  reading: ReadingStage,
  translation: TranslationStage,
}

const tick = ref(0)
const isAutoSwitching = ref(false)
let timer = null

const currentStageComponent = computed(() => stageComponentMap[examStore.currentStage] || WritingStage)

const isLastStage = computed(() => {
  const stageOrder = examStore.stageOrder
  return examStore.currentStage === stageOrder[stageOrder.length - 1]
})

const nextButtonText = computed(() => (isLastStage.value ? '提交' : '下一阶段'))

const currentQuestions = computed(() => {
  tick.value
  return examStore.currentQuestions
})

const ensureMockExamData = () => {
  if (examStore.currentStage) {
    return
  }

  examStore.$patch({
    // 仅用于任务 1.2 本地验收，任务 1.3 替换为真实 API
    examId: 'mock-exam-001',
    currentStage: 'writing',
    stageStartedAt: Date.now(),
    stageDuration: 1800,
    questionsByStage: {
      writing: [{ id: 'w1', content: { title: '根据以下提纲，写一篇不少于120词的英语作文。' } }],
      listening: [
        { id: 'l1', subType: 'choice', content: { stem: '听力题1', options: ['A. ...', 'B. ...', 'C. ...', 'D. ...'] } },
        { id: 'l2', subType: 'choice', content: { stem: '听力题2', options: ['A. ...', 'B. ...', 'C. ...', 'D. ...'] } },
      ],
      reading: [{ id: 'r1', subType: 'choice', content: { stem: '阅读题1', options: ['A. ...', 'B. ...', 'C. ...', 'D. ...'] } }],
      translation: [{ id: 't1', content: { source: '请将以下中文翻译成英文：中国是一个历史悠久的国家。' } }],
    },
  })
}

const handleAutoSwitch = async () => {
  if (!examStore.hasActiveExam || examStore.remainingSeconds > 0 || isAutoSwitching.value) {
    return
  }

  isAutoSwitching.value = true
  try {
    if (isLastStage.value) {
      await examStore.submitExam()
      await router.push(`/exam/result/${examStore.examId}`)
      return
    }

    examStore.advanceStage()
  } finally {
    isAutoSwitching.value = false
  }
}

const handleNext = async () => {
  if (isLastStage.value) {
    await examStore.submitExam()
    await router.push(`/exam/result/${examStore.examId}`)
    return
  }

  examStore.advanceStage()
}

onMounted(async () => {
  await examStore.startExam(route.params.id)

  // TODO: 任务 1.3 恢复真实 startExam / getExamQuestions API 调用
  ensureMockExamData()

  timer = setInterval(async () => {
    tick.value += 1
    await handleAutoSwitch()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  // TODO: 任务 1.3 恢复离开页面时的答题草稿上报 API
})
</script>

<template>
  <div class="exam-view">
    <ExamHeader />

    <main class="exam-body">
      <component :is="currentStageComponent" :questions="currentQuestions" />
    </main>

    <footer class="exam-footer">
      <el-button type="primary" @click="handleNext">{{ nextButtonText }}</el-button>
    </footer>
  </div>
</template>

<style scoped>
.exam-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.exam-body {
  max-width: 980px;
  margin: 20px auto;
  padding: 0 20px;
}

.exam-footer {
  display: flex;
  justify-content: center;
  padding: 20px;
}

:deep(.stage-wrap) {
  display: grid;
  gap: 16px;
}

:deep(.question-card) {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
</style>

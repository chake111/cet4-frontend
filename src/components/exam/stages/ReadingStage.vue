<script setup>
import { computed } from 'vue'
import { useExamAnswerStore } from '@/stores/examAnswer'
import { buildSectionGroups, buildSessionGroups } from '@/domain/exam'
import ExamSessionCard from './ExamSessionCard.vue'
import BlankFillingBlock from './BlankFillingBlock.vue'
import MatchingBlock from './MatchingBlock.vue'
import ChoiceBlock from './ChoiceBlock.vue'

const props = defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
})

const answerStore = useExamAnswerStore()

const updateAnswer = (questionId, value) => {
  answerStore.saveAnswer({ stage: 'reading', questionId, value })
}

const sessionGroups = computed(() => buildSessionGroups(props.questions, 'reading'))
const sectionGroups = computed(() => buildSectionGroups(sessionGroups.value))

const blockComponentMap = {
  blank_filling: BlankFillingBlock,
  matching: MatchingBlock,
  single_choice: ChoiceBlock,
}

const getBlockComponent = (session) => {
  const type = session.questions[0]?.content?.type
  return blockComponentMap[type] || ChoiceBlock
}

const getSessionProps = (session) => {
  const firstContent = session.questions[0]?.content
  return {
    questions: session.questions,
    answers: answerStore.answersByStage.reading,
    passage: firstContent?.passage || '',
    wordBank: firstContent?.type === 'blank_filling' ? firstContent?.wordBank || [] : [],
  }
}
</script>

<template>
  <section class="stage-wrap">
    <div v-if="questions.length === 0" class="empty-state">
      <el-empty description="暂无阅读题目" />
    </div>

    <template v-else>
      <section v-for="section in sectionGroups" :key="section.sectionLabel" class="exam-section">
        <h2 class="section-title">{{ section.sectionLabel }} — {{ section.sectionTitle }}</h2>
        <ExamSessionCard
          v-for="session in section.sessions"
          :key="session.sessionId"
          :title="session.sessionTitle"
          :meta="`${session.questions.length} 题`"
        >
          <component
            :is="getBlockComponent(session)"
            v-bind="getSessionProps(session)"
            @update-answer="updateAnswer"
          />
        </ExamSessionCard>
      </section>
    </template>
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.exam-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0 0 2px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--c-accent);
}

@media (max-width: 480px) {
  .section-title {
    font-size: 15px;
  }
}
</style>

<script setup>
import { computed } from 'vue'
import { useExamAnswerStore } from '@/stores/examAnswer'
import { buildSectionGroups, buildSessionGroups } from '@/domain/exam'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import AudioStatusBanner from './AudioStatusBanner.vue'
import ExamSessionCard from './ExamSessionCard.vue'
import QuestionOptionList from './QuestionOptionList.vue'

const props = defineProps({
  questions: { type: Array, default: () => [] },
})

const answerStore = useExamAnswerStore()
const updateAnswer = (questionId, value) =>
  answerStore.saveAnswer({ stage: 'listening', questionId, value })

const fullAudioUrl = computed(() => {
  if (props.questions.length === 0) return null
  return props.questions[0].audioUrl || null
})

const onAudioEnded = () => {
  for (const q of props.questions) answerStore.markListeningPlayed(q.id)
}

const {
  audioRef,
  hasPlayed,
  isPlaying,
  autoPlayFailed,
  tryAutoPlay,
  onAudioEnded: handleAudioEnded,
  onAudioPlay,
  onAudioPause,
} = useAudioPlayer(fullAudioUrl, { onEnded: onAudioEnded })

const sessionGroups = computed(() => buildSessionGroups(props.questions, 'listening'))
const sectionGroups = computed(() => buildSectionGroups(sessionGroups.value))
</script>

<template>
  <section class="stage-wrap">
    <div v-if="questions.length === 0" class="empty-state">
      <el-empty description="暂无听力题目" />
    </div>
    <template v-else>
      <AudioStatusBanner
        :is-playing="isPlaying"
        :has-played="hasPlayed"
        :auto-play-failed="autoPlayFailed"
        @retry="tryAutoPlay"
      />
      <div v-if="fullAudioUrl" class="audio-box">
        <audio
          ref="audioRef"
          :src="fullAudioUrl"
          class="audio-player-hidden"
          @ended="handleAudioEnded"
          @play="onAudioPlay"
          @pause="onAudioPause"
        />
      </div>
      <div v-else class="audio-box audio-missing">
        <span>该题暂无音频，检查听力资源配置</span>
      </div>
      <section v-for="section in sectionGroups" :key="section.sectionLabel" class="exam-section">
        <h2 class="section-title">{{ section.sectionLabel }} — {{ section.sectionTitle }}</h2>
        <ExamSessionCard
          v-for="session in section.sessions"
          :key="session.sessionId"
          :title="session.sessionTitle"
          :meta="`${session.questions.length} 题`"
          :stem="session.sharedStem"
        >
          <div class="question-list">
            <div v-for="question in session.questions" :key="question.id" class="question-block">
              <div class="question-no">Q{{ question.questionNo }}</div>
              <QuestionOptionList
                :model-value="answerStore.answersByStage.listening[question.id] || ''"
                :options="question.content?.options || []"
                :max-options="4"
                @update:model-value="updateAnswer(question.id, $event)"
              />
            </div>
          </div>
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
.audio-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.audio-missing {
  color: var(--c-text-tertiary);
  font-size: 14px;
}
.audio-player-hidden {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
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
.question-list {
  display: flex;
  flex-direction: column;
}
.question-block {
  padding: 20px 0;
  border-top: 1px solid var(--c-border);
}
.question-block:first-child {
  padding-top: 0;
  border-top: none;
}
.question-no {
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  color: var(--c-accent);
}
</style>

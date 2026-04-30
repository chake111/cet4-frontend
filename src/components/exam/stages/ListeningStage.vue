<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useExamStore } from '@/stores/exam'
import { buildSectionGroups, buildSessionGroups } from '@/utils/examGrouping'
import ExamSessionCard from './ExamSessionCard.vue'
import QuestionOptionList from './QuestionOptionList.vue'

const props = defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
})

const examStore = useExamStore()

const updateAnswer = (questionId, value) => {
  examStore.saveAnswer('listening', questionId, value)
}

const audioRef = ref(null)
const hasPlayed = ref(false)
const isPlaying = ref(false)

const onAudioEnded = () => {
  hasPlayed.value = true
  isPlaying.value = false
  // 标记所有听力题为已播放
  for (const q of props.questions) {
    examStore.markListeningPlayed(q.id)
  }
}

const onAudioPlay = () => {
  isPlaying.value = true
}

const onAudioPause = () => {
  // 禁止暂停：播放中暂停时立即恢复
  if (!hasPlayed.value && audioRef.value) {
    audioRef.value.play().catch(() => {})
  }
}

/**
 * 获取整段听力音频 URL。
 * 所有听力题共用同一个 audio_url，取第一题的即可。
 */
const fullAudioUrl = computed(() => {
  if (props.questions.length === 0) return null
  return props.questions[0].audioUrl || null
})

/** 进入页面自动播放音频 */
const tryAutoPlay = () => {
  if (audioRef.value && fullAudioUrl.value && !hasPlayed.value) {
    audioRef.value.play().catch(() => {
      // 浏览器可能阻止自动播放，需要用户手动点击播放
    })
  }
}

onMounted(() => {
  tryAutoPlay()
})

watch(() => fullAudioUrl.value, async () => {
  if (fullAudioUrl.value) {
    await nextTick()
    tryAutoPlay()
  }
})

/**
 * 按 sessionId 分组，再按 section 聚合。
 */
const sessionGroups = computed(() => buildSessionGroups(props.questions, 'listening'))

const sectionGroups = computed(() => buildSectionGroups(sessionGroups.value))
</script>

<template>
  <section class="stage-wrap">
    <!-- 空状态 -->
    <div v-if="questions.length === 0" class="empty-state">
      <el-empty description="暂无听力题目" />
    </div>

    <template v-else>
      <!-- 整段听力音频播放器（固定在顶部） -->
      <div class="audio-header">
        <span v-if="hasPlayed" class="audio-played-tag">已播放</span>
        <span v-else-if="isPlaying" class="audio-playing-tag">播放中…</span>
        <span v-else class="audio-waiting-tag" @click="tryAutoPlay">点击播放听力</span>
      </div>
      <div v-if="fullAudioUrl" class="audio-box">
        <audio
          ref="audioRef"
          :src="fullAudioUrl"
          class="audio-player-hidden"
          @ended="onAudioEnded"
          @play="onAudioPlay"
          @pause="onAudioPause"
        />
      </div>
      <div v-else class="audio-box audio-missing">
        <span>该题暂无音频，检查听力资源配置</span>
      </div>

      <!-- 按 Section 分组展示 session 卡片 -->
      <section
        v-for="section in sectionGroups"
        :key="section.sectionLabel"
        class="exam-section"
      >
        <h2 class="section-title">{{ section.sectionLabel }} — {{ section.sectionTitle }}</h2>

        <ExamSessionCard
          v-for="session in section.sessions"
          :key="session.sessionId"
          :title="session.sessionTitle"
          :meta="`${session.questions.length} questions`"
          :stem="session.sharedStem"
        >
          <div class="question-list">
            <div
              v-for="question in session.questions"
              :key="question.id"
              class="question-block"
            >
              <div class="question-no">Q{{ question.questionNo }}</div>
              <QuestionOptionList
                :model-value="examStore.answersByStage.listening[question.id] || ''"
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

/* 整段音频播放器区域 */
.audio-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-played-tag {
  font-size: 12px;
  color: var(--c-success);
  padding: 2px 8px;
  border-radius: var(--r-button);
  background: rgba(22, 163, 74, 0.08);
}

.audio-playing-tag {
  font-size: 12px;
  color: var(--c-accent);
  padding: 2px 8px;
  border-radius: var(--r-button);
  animation: pulse 1.5s ease-in-out infinite;
}

.audio-waiting-tag {
  font-size: 12px;
  color: var(--c-accent);
  padding: 4px 12px;
  border-radius: var(--r-button);
  background: rgba(37, 99, 235, 0.06);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.audio-waiting-tag:hover {
  background: rgba(37, 99, 235, 0.12);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

/* Section 分组 */
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

/* 题目列表 */
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

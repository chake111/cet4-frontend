<script setup>
import { ref, computed } from 'vue'
import { useExamStore } from '@/stores/exam'

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

const onAudioEnded = () => {
  hasPlayed.value = true
  // 标记所有听力题为已播放
  for (const q of props.questions) {
    examStore.markListeningPlayed(q.id)
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

/**
 * 根据 questionNo 范围判断听力 Section。
 * Section A: 1-4 (News Reports)
 * Section B: 5-7 (Long Conversations)
 * Section C: 8-10 (Short Passages)
 */
const getSectionLabel = (questionNo) => {
  if (questionNo <= 4) return 'Section A'
  if (questionNo <= 7) return 'Section B'
  return 'Section C'
}

const getSectionDescription = (questionNo) => {
  if (questionNo <= 4) return 'News Report'
  if (questionNo <= 7) return 'Long Conversation'
  return 'Short Passage'
}

/**
 * 按 Section 分组题目。
 * Section A / B / C 根据 questionNo 范围划分。
 */
const sectionGroups = computed(() => {
  const groupMap = new Map()
  for (const q of props.questions) {
    const sectionKey = getSectionLabel(q.questionNo)
    if (!groupMap.has(sectionKey)) {
      groupMap.set(sectionKey, {
        label: sectionKey,
        description: getSectionDescription(q.questionNo),
        questions: [],
      })
    }
    groupMap.get(sectionKey).questions.push(q)
  }
  return [...groupMap.values()]
})
</script>

<template>
  <section class="stage-wrap">
    <!-- 空状态 -->
    <div v-if="questions.length === 0" class="empty-state">
      <el-empty description="暂无听力题目" />
    </div>

    <template v-else>
      <!-- 整段听力音频播放器（固定在顶部） -->
      <div class="audio-section">
        <div class="audio-header">
          <span class="audio-title">听力音频</span>
          <span v-if="hasPlayed" class="audio-played-tag">已播放</span>
        </div>
        <div v-if="fullAudioUrl" class="audio-box">
          <audio
            ref="audioRef"
            :src="fullAudioUrl"
            controls
            class="audio-player"
            @ended="onAudioEnded"
          />
        </div>
        <div v-else class="audio-box audio-missing">
          <span>该题暂无音频，检查听力资源配置</span>
        </div>
      </div>

      <!-- 按 Section 分组展示题目 -->
      <div v-for="group in sectionGroups" :key="group.label" class="section-group">
        <div class="section-header">{{ group.label }} — {{ group.description }}</div>

        <article v-for="question in group.questions" :key="question.id" class="question-card">
          <div class="question-no">Q{{ question.questionNo }}</div>
          <div class="question-stem">{{ question.content?.stem }}</div>
          <el-radio-group
            :model-value="examStore.answersByStage.listening[question.id] || ''"
            class="option-group"
            @update:model-value="updateAnswer(question.id, $event)"
          >
            <label
              v-for="(option, oi) in question.content?.options?.slice(0, 4) || []"
              :key="oi"
              class="option-item"
              :class="{ 'option-item--active': examStore.answersByStage.listening[question.id] === String.fromCharCode(65 + oi) }"
              @click="updateAnswer(question.id, String.fromCharCode(65 + oi))"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + oi) }}</span>
              <span class="option-text">{{ option }}</span>
            </label>
          </el-radio-group>
        </article>
      </div>
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
.audio-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: var(--r-card);
  background: var(--c-bg-weak);
  border: 1px solid var(--c-border);
  margin-bottom: 20px;
  position: sticky;
  top: 60px;
  z-index: 10;
}

.audio-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
}

.audio-played-tag {
  font-size: 12px;
  color: var(--c-success);
  padding: 2px 8px;
  border-radius: var(--r-button);
  background: rgba(22, 163, 74, 0.08);
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

.audio-player {
  width: 100%;
}

/* Section 分组 */
.section-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  padding: 8px 12px;
  background: rgba(37, 99, 235, 0.04);
  border-radius: var(--r-input);
}

/* 题目卡片 */
.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-no {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: 4px;
}

.question-stem {
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-text-primary);
}

/* 选项 */
.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
  line-height: 1.5;
  color: var(--c-text-primary);
}

.option-item:hover {
  border-color: var(--c-accent);
  background: rgba(37, 99, 235, 0.04);
}

.option-item--active {
  border-color: var(--c-accent);
  background: rgba(37, 99, 235, 0.06);
  color: var(--c-accent);
}

.option-letter {
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
}

.option-text {
  line-height: 1.5;
}
</style>

<script setup>
import { ref } from 'vue'
import { useExamStore } from '@/stores/exam'

defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
})

const examStore = useExamStore()

const updateAnswer = (questionId, value) => {
  examStore.saveAnswer('listening', questionId, value)
}

const audioRefs = ref({})

const onAudioEnded = (questionId) => {
  examStore.markListeningPlayed(questionId)
}
</script>

<template>
  <section class="stage-wrap">
    <article v-for="question in questions" :key="question.id" class="question-card">
      <!-- 音频播放器 -->
      <div v-if="question.audioUrl" class="audio-box">
        <audio
          :ref="(el) => { if (el) audioRefs[question.id] = el }"
          :src="question.audioUrl"
          controls
          class="audio-player"
          @ended="onAudioEnded(question.id)"
        />
        <el-tag v-if="examStore.listeningPlayed[question.id]" type="success" size="small" class="played-tag">
          已播放
        </el-tag>
      </div>
      <div v-else class="audio-box">
        <el-tag type="info" size="small">暂无音频</el-tag>
      </div>

      <h3 class="question-title">{{ question.content?.stem }}</h3>
      <el-radio-group
        :model-value="examStore.answersByStage.listening[question.id] || ''"
        class="option-group"
        @update:model-value="updateAnswer(question.id, $event)"
      >
        <el-radio
          v-for="(option, oi) in question.content?.options?.slice(0, 4) || []"
          :key="oi"
          :value="option"
        >
          {{ String.fromCharCode(65 + oi) }}. {{ option }}
        </el-radio>
      </el-radio-group>
    </article>
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
}

.audio-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f5f7fa;
}

.audio-player {
  width: 100%;
  max-width: 400px;
}

.played-tag {
  flex-shrink: 0;
}

.question-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

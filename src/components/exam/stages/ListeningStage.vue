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
          <el-tag v-if="hasPlayed" type="success" size="small">已播放完毕</el-tag>
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
          <el-icon><i class="el-icon-warning-outline" /></el-icon>
          <span>该题暂无音频，请检查听力资源配置</span>
        </div>
      </div>

      <!-- 按 Section 分组展示题目 -->
      <div v-for="group in sectionGroups" :key="group.label" class="section-group">
        <div class="section-header">{{ group.label }} — {{ group.description }}</div>

        <article v-for="question in group.questions" :key="question.id" class="question-card">
          <h3 class="question-title">
            <span class="question-no">第 {{ question.questionNo }} 题</span>
            {{ question.content?.stem }}
          </h3>
          <el-radio-group
            :model-value="examStore.answersByStage.listening[question.id] || ''"
            class="option-group"
            @update:model-value="updateAnswer(question.id, $event)"
          >
            <el-radio
              v-for="(option, oi) in question.content?.options?.slice(0, 4) || []"
              :key="oi"
              :value="String.fromCharCode(65 + oi)"
              class="option-radio"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + oi) }}.</span>
              <span class="option-text">{{ option }}</span>
            </el-radio>
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
  gap: 20px;
  padding: 16px;
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
  border-radius: 8px;
  background: #fff;
  position: sticky;
  top: 60px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.audio-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audio-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.audio-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
}

.audio-missing {
  color: #e6a23c;
  font-size: 14px;
}

.audio-player {
  width: 100%;
}

/* Section 分组 */
.section-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
  padding: 8px 12px;
  background: #ecf5ff;
  border-radius: 6px;
}

/* 题目卡片 */
.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
}

.question-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.6;
}

.question-no {
  display: inline-block;
  min-width: 56px;
  padding: 2px 8px;
  margin-right: 8px;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-radio {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.option-radio:hover {
  background: #f5f7fa;
}

.option-letter {
  font-weight: 600;
  margin-right: 6px;
  flex-shrink: 0;
}

.option-text {
  line-height: 1.5;
}
</style>

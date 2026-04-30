<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EXAM_TITLE, EXAM_TOTAL_SCORE, STAGE_LIST } from '@/constants/exam'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { examService } from '@/services/examService'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const examInfo = ref(null)

const RULES = [
  '考试开始后不可暂停，请确保有充足的时间',
  '听力阶段音频仅播放一次，提前调整音量',
  '各阶段时间独立计时，时间到自动进入下一阶段',
  '写作和翻译答案需手动保存，建议边写边存',
  '交卷后不可修改答案',
]

const totalDuration = computed(() => STAGE_LIST.reduce((sum, s) => sum + s.duration, 0))

const examTitle = computed(() => {
  if (!examInfo.value) return ''
  const e = examInfo.value
  if (e.year && e.month && e.setNo) {
    return `${e.year} 年 ${e.month} 月 · 第 ${e.setNo} 套`
  }
  return e.title || ''
})

const fetchExamInfo = async () => {
  const examId = route.params.id
  if (!examId) {
    ElMessage.error('缺少试卷 ID')
    return
  }

  loading.value = true
  try {
    const data = await examService.getExamList()
    const list = Array.isArray(data) ? data : []
    examInfo.value = list.find((exam) => String(exam.id) === String(examId)) || null
  } catch (error) {
    ElMessage.error('获取试卷信息失败，稍后重试')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/exam')
}

const startExam = () => {
  router.push(`/exam/${route.params.id}/start`)
}

onMounted(fetchExamInfo)
</script>

<template>
  <div class="exam-brief-page">
    <PageTopBar :title="EXAM_TITLE" />

    <div class="main-area">
      <el-skeleton v-if="loading" :rows="8" animated />

      <div v-else class="brief-content">
        <h1 class="page-title">考试说明</h1>

        <!-- 信息区 -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">考试名称</span>
            <span class="info-value">{{ examTitle }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">总时长</span>
            <span class="info-value">{{ totalDuration }} 分钟</span>
          </div>
          <div v-if="examInfo" class="info-row">
            <span class="info-label">总分</span>
            <span class="info-value">{{ examInfo.totalScore || EXAM_TOTAL_SCORE }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 考试流程区 -->
        <div class="flow-section">
          <h2 class="section-title">考试流程</h2>
          <div class="flow-steps">
            <template v-for="(stage, index) in STAGE_LIST" :key="stage.key">
              <div class="flow-step">
                <span class="step-num">{{ index + 1 }}</span>
                <div class="step-info">
                  <span class="step-name">{{ stage.label }}</span>
                  <span class="step-duration">{{ stage.duration }} 分钟</span>
                </div>
              </div>
              <span v-if="index < STAGE_LIST.length - 1" class="step-arrow">&rarr;</span>
            </template>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 注意事项区 -->
        <div class="rules-section">
          <h2 class="section-title">注意事项</h2>
          <div class="rules-list">
            <div v-for="(rule, index) in RULES" :key="index" class="rule-item">
              <span class="rule-index">{{ index + 1 }}</span>
              <span class="rule-text">{{ rule }}</span>
            </div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="action-bar">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="startExam">开始考试</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exam-brief-page {
  min-height: 100vh;
  background: var(--c-bg);
}

.main-area {
  max-width: 700px;
  margin: 0 auto;
  padding: 48px 20px;
}

.brief-content {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin: 0 0 32px;
}

/* 信息区 */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.info-label {
  font-size: 13px;
  color: var(--c-text-secondary);
  width: 72px;
  flex-shrink: 0;
}

.info-value {
  font-size: 15px;
  color: var(--c-text-primary);
  font-weight: 500;
}

/* 分割线 */
.divider {
  height: 1px;
  background: var(--c-border);
  margin: 24px 0;
}

/* 考试流程区 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin: 0 0 16px;
}

.flow-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--c-accent);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-primary);
}

.step-duration {
  font-size: 12px;
  color: var(--c-text-secondary);
}

.step-arrow {
  color: var(--c-text-tertiary);
  font-size: 16px;
  margin: 0 2px;
}

/* 注意事项区 */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.rule-item {
  display: flex;
  align-items: baseline;
  padding: 6px 0;
  line-height: 1.8;
}

.rule-index {
  color: var(--c-text-secondary);
  font-size: 13px;
  margin-right: 8px;
  flex-shrink: 0;
}

.rule-text {
  font-size: 14px;
  color: var(--c-text-primary);
  line-height: 1.8;
}

/* 底部操作区 */
.action-bar {
  margin-top: 40px;
  display: flex;
  gap: 12px;
}

@media (max-width: 640px) {
  .main-area {
    padding: 32px 16px;
  }

  .flow-steps {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .step-arrow {
    transform: rotate(90deg);
  }

  .action-bar {
    flex-direction: column;
  }
}
</style>

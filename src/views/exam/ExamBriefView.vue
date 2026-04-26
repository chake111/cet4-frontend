<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExamList } from '@/api/exam'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const examInfo = ref(null)

const STAGE_INFO = [
  { key: 'writing', label: '写作', duration: 30, unit: '分钟' },
  { key: 'listening', label: '听力', duration: 25, unit: '分钟' },
  { key: 'reading', label: '阅读', duration: 45, unit: '分钟' },
  { key: 'translation', label: '翻译', duration: 25, unit: '分钟' },
]

const RULES = [
  { icon: '⏱️', text: '各阶段时间到将自动切换到下一阶段，最后阶段结束自动交卷' },
  { icon: '🤖', text: '考试提交后将由 AI 进行智能评分，包括客观题自动判分和主观题 AI 评估' },
  { icon: '🔊', text: '听力阶段请确保设备音频正常，音频将自动播放' },
  { icon: '🚫', text: '考试中请勿刷新或关闭页面，否则可能丢失答题进度' },
  { icon: '📶', text: '请在安静环境下完成考试，确保网络连接稳定' },
]

const totalDuration = computed(() => STAGE_INFO.reduce((sum, s) => sum + s.duration, 0))

const examTitle = computed(() => examInfo.value?.title || '英语四级考试')

const fetchExamInfo = async () => {
  const examId = route.params.id
  if (!examId) {
    ElMessage.error('缺少试卷 ID')
    return
  }

  loading.value = true
  try {
    const data = await getExamList()
    const list = Array.isArray(data) ? data : []
    examInfo.value = list.find((exam) => String(exam.id) === String(examId)) || null
  } catch (error) {
    ElMessage.error('获取试卷信息失败，请稍后重试')
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
    <header class="page-header">
      <h1>考试说明</h1>
    </header>

    <el-skeleton v-if="loading" :rows="8" animated />

    <div v-else class="brief-content">
      <!-- 考试信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">📋 考试信息</div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">考试名称</span>
            <span class="info-value">{{ examTitle }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总时长</span>
            <span class="info-value">{{ totalDuration }} 分钟</span>
          </div>
          <div v-if="examInfo" class="info-item">
            <span class="info-label">总分</span>
            <span class="info-value">{{ examInfo.totalScore || 710 }} 分</span>
          </div>
        </div>
      </el-card>

      <!-- 考试流程卡片 -->
      <el-card shadow="never" class="flow-card">
        <template #header>
          <div class="card-title">📝 考试流程</div>
        </template>

        <div class="stage-flow">
          <div
            v-for="(stage, index) in STAGE_INFO"
            :key="stage.key"
            class="stage-step"
          >
            <div class="step-indicator">
              <div class="step-number">{{ index + 1 }}</div>
              <div v-if="index < STAGE_INFO.length - 1" class="step-line"></div>
            </div>
            <div class="step-content">
              <div class="step-label">{{ stage.label }}</div>
              <div class="step-duration">{{ stage.duration }} {{ stage.unit }}</div>
            </div>
          </div>
        </div>

        <div class="stage-detail">
          <div
            v-for="stage in STAGE_INFO"
            :key="stage.key"
            class="detail-row"
          >
            <el-tag size="small" type="info">{{ stage.label }}</el-tag>
            <span class="detail-text">{{ stage.duration }} {{ stage.unit }}</span>
          </div>
        </div>
      </el-card>

      <!-- 注意事项卡片 -->
      <el-card shadow="never" class="rules-card">
        <template #header>
          <div class="card-title">⚠️ 注意事项</div>
        </template>

        <ul class="rules-list">
          <li v-for="(rule, index) in RULES" :key="index" class="rule-item">
            <span class="rule-icon">{{ rule.icon }}</span>
            <span class="rule-text">{{ rule.text }}</span>
          </li>
        </ul>
      </el-card>

      <!-- 底部操作区 -->
      <div class="action-bar">
        <el-button size="large" @click="goBack">返回</el-button>
        <el-button type="primary" size="large" class="start-btn" @click="startExam">
          我已了解，开始考试
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exam-brief-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.brief-content {
  display: grid;
  gap: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

/* 考试信息 */
.info-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 考试流程 */
.stage-flow {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 8px 0;
}

.stage-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-indicator {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  position: relative;
}

.step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  z-index: 1;
}

.step-line {
  position: absolute;
  top: 50%;
  left: calc(50% + 18px);
  right: calc(-50% + 18px);
  height: 2px;
  background: #dcdfe6;
  transform: translateY(-50%);
}

.step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.step-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.step-duration {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.stage-detail {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-text {
  font-size: 14px;
  color: #606266;
}

/* 注意事项 */
.rules-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f3f5;
  line-height: 1.7;
}

.rule-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.rule-icon {
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1.7;
}

.rule-text {
  font-size: 14px;
  color: #606266;
}

/* 底部操作区 */
.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 8px;
}

.start-btn {
  min-width: 200px;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .exam-brief-page {
    padding: 16px 12px 32px;
  }

  .stage-flow {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .stage-step {
    flex-direction: row;
    width: 100%;
    gap: 12px;
  }

  .step-indicator {
    flex-direction: column;
    width: auto;
    justify-content: flex-start;
  }

  .step-line {
    top: 18px;
    left: 17px;
    right: auto;
    width: 2px;
    height: 28px;
  }

  .step-content {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    margin-top: 0;
  }

  .stage-detail {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
  }

  .start-btn {
    width: 100%;
  }
}
</style>

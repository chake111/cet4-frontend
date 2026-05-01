<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import { examService } from '@/services/examService'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const examList = ref([])

const fetchExamList = async () => {
  loading.value = true
  try {
    const res = await examService.getExamList()
    examList.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    ElMessage.error('获取试卷列表失败，稍后重试')
  } finally {
    loading.value = false
  }
}

const formatExamTitle = (exam) => {
  if (exam.year && exam.month && exam.setNo) {
    return `${exam.year} 年 ${exam.month} 月 · 第 ${exam.setNo} 套`
  }
  return exam.title || ''
}

const formatExamSubtitle = (exam) => {
  const parts = []
  if (exam.duration) parts.push(`${exam.duration} 分钟`)
  if (exam.totalScore) parts.push(`总分 ${exam.totalScore}`)
  return parts.join(' · ')
}

const handleStartExam = (examId) => {
  router.push(`/exam/${examId}/brief`)
}

const handleLogout = async () => {
  userStore.logout()
  await router.push('/login')
}

onMounted(fetchExamList)
</script>

<template>
  <div class="exam-list-page">
    <PageTopBar>
      <template #actions>
        <a class="top-bar-link" @click="$router.push('/exam/records')">考试记录</a>
        <span class="top-bar-divider">|</span>
        <a class="top-bar-link" @click="handleLogout">退出</a>
      </template>
    </PageTopBar>

    <div class="main-area">
      <el-skeleton v-if="loading" :rows="6" animated />

      <el-empty v-else-if="!examList.length" description="暂无试卷" />

      <div v-else class="exam-list">
        <div v-for="exam in examList" :key="exam.id" class="exam-item">
          <div class="exam-item-left">
            <div class="exam-item-title">{{ formatExamTitle(exam) }}</div>
            <div class="exam-item-subtitle">{{ formatExamSubtitle(exam) }}</div>
          </div>
          <el-button type="primary" @click="handleStartExam(exam.id)"> 开始考试 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exam-list-page {
  min-height: 100vh;
  background: var(--c-bg);
}

.main-area {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 20px;
}

.exam-list {
  display: flex;
  flex-direction: column;
}

.exam-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid var(--c-border);
  transition: background 0.15s;
  cursor: default;
}

.exam-item:hover {
  background: var(--c-bg-weak);
}

.exam-item:last-child {
  border-bottom: none;
}

.exam-item-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exam-item-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
}

.exam-item-subtitle {
  font-size: 13px;
  color: var(--c-text-secondary);
}
</style>

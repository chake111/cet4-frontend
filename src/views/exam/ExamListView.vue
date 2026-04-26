<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExamList } from '@/api/exam'
import { useUserStore } from '@/stores/user'
import ExamHeader from '@/components/exam/ExamHeader.vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const examList = ref([])

const fetchExamList = async () => {
  loading.value = true
  try {
    const data = await getExamList()
    examList.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error('获取试卷列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleStartExam = (examId) => {
  router.push(`/exam/${examId}/start`)
}

const handleLogout = async () => {
  userStore.logout()
  await router.push('/login')
}

onMounted(fetchExamList)
</script>

<template>
  <div class="exam-list-page">
    <header class="page-header">
      <h1>英语四级练习平台</h1>
      <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
    </header>

    <el-skeleton v-if="loading" :rows="6" animated />

    <el-empty
      v-else-if="!examList.length"
      description="暂无试卷，请稍后再试"
      class="empty-state"
    />

    <div v-else class="exam-list">
      <el-card v-for="exam in examList" :key="exam.id" shadow="hover" class="exam-card">
        <template #header>
          <div class="card-header">
            <h2>{{ exam.title }}</h2>
          </div>
        </template>

        <div class="exam-meta">
          <p>年份月份套次：{{ exam.year }} 年 {{ exam.month }} 月 第 {{ exam.setNo }} 套</p>
          <p>考试时长：{{ exam.duration }} 分钟</p>
          <p>总分：{{ exam.totalScore }}</p>
        </div>

        <div class="card-action">
          <el-button
            type="primary"
            @click="handleStartExam(exam.id)"
          >
            开始考试
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.exam-list-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
}

.exam-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.exam-card h2 {
  margin: 0;
  font-size: 20px;
}

.exam-meta p {
  margin: 8px 0;
  line-height: 1.6;
}

.card-action {
  margin-top: 16px;
}

.empty-state {
  margin-top: 80px;
}
</style>

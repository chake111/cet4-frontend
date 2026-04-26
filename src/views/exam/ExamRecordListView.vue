<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getExamRecords } from '@/api/exam'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const records = ref([])

const fetchRecords = async () => {
  loading.value = true
  try {
    const data = await getExamRecords()
    records.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error('获取考试记录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const formatTime = (dt) => {
  if (!dt) return '-'
  const d = new Date(dt)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const calcDuration = (start, end) => {
  if (!start || !end) return '-'
  const ms = new Date(end) - new Date(start)
  if (ms < 0) return '-'
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 1) return '<1分钟'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

const viewReport = (recordId) => {
  router.push(`/exam/record/${recordId}/result`)
}

const handleLogout = async () => {
  userStore.logout()
  await router.push('/login')
}

onMounted(fetchRecords)
</script>

<template>
  <div class="exam-record-list" v-loading="loading">
    <header class="page-header">
      <div class="header-left">
        <el-button @click="$router.push('/exam')" :icon="ArrowLeft" circle />
        <h1>我的考试记录</h1>
      </div>
      <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
    </header>

    <el-empty v-if="!loading && records.length === 0" description="暂无考试记录" class="empty-state" />

    <el-table v-else :data="records" stripe>
      <el-table-column prop="title" label="试卷" min-width="200" />
      <el-table-column label="得分" width="120">
        <template #default="{ row }">
          {{ row.totalScore }} / {{ row.fullScore }}
        </template>
      </el-table-column>
      <el-table-column label="考试时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column label="用时" width="120">
        <template #default="{ row }">
          {{ calcDuration(row.startTime, row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="viewReport(row.recordId)">
            查看报告
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.exam-record-list {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
}

.empty-state {
  margin-top: 80px;
}
</style>

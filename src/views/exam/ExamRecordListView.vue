<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useBackTop } from '@/composables/useBackTop'
import { examService } from '@/services/examService'
import { formatDateTime, formatDurationText } from '@/utils/date'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const records = ref([])
const { showBackTop, scrollToTop } = useBackTop()

const fetchRecords = async () => {
  loading.value = true
  try {
    const data = await examService.getExamRecords()
    records.value = Array.isArray(data) ? data : []
  } catch (error) {
    ElMessage.error('获取考试记录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const viewReport = (recordId) => {
  router.push(`/exam/record/${recordId}/result`)
}

const handleLogout = async () => {
  userStore.logout()
  await router.push('/login')
}

onMounted(() => {
  fetchRecords()
})
</script>

<template>
  <div class="exam-record-list" v-loading="loading">
    <header class="page-header">
      <div class="header-left">
        <span class="back-link" @click="$router.push('/exam')">← 返回</span>
        <div class="header-titles">
          <h1 class="page-title">考试记录</h1>
          <p class="page-subtitle">查看已完成的 CET-4 模拟考试</p>
        </div>
      </div>
      <span class="logout-link" @click="handleLogout">退出登录</span>
    </header>

    <el-empty v-if="!loading && records.length === 0" description="暂无考试记录" class="empty-state" />

    <el-table
      v-else
      :data="records"
      class="record-table"
    >
      <el-table-column label="试卷" min-width="240">
        <template #default="{ row }">
          <div class="record-title">{{ row.title }}</div>
          <div class="record-time">{{ formatDateTime(row.submitTime) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="得分" width="140">
        <template #default="{ row }">
          <span class="score-value">{{ row.totalScore }}</span>
          <span class="score-full">/ {{ row.fullScore }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用时" width="120">
        <template #default="{ row }">
          {{ formatDurationText(row.startTime, row.submitTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <span class="report-btn" @click="viewReport(row.recordId)">查看报告</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 返回顶部 -->
    <transition name="back-top-fade">
      <button v-if="showBackTop" class="modern-back-top" @click="scrollToTop" aria-label="回到顶部">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </transition>
  </div>
</template>

<style scoped>
.exam-record-list {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

/* ---- Header ---- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-link {
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
  line-height: 28px;
  white-space: nowrap;
  transition: color 0.15s;
}

.back-link:hover {
  color: #111827;
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6B7280;
  line-height: 1.4;
}

.logout-link {
  color: #6B7280;
  font-size: 14px;
  cursor: pointer;
  line-height: 28px;
  white-space: nowrap;
  transition: color 0.15s;
}

.logout-link:hover {
  color: #111827;
}

/* ---- Table ---- */
.record-table {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #F9FAFB;
  --el-table-row-hover-bg-color: #F9FAFB;
}

.record-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.record-table :deep(.el-table__header th) {
  font-size: 12px;
  color: #6B7280;
  font-weight: 400;
  background-color: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.record-table :deep(.el-table__body td) {
  border-bottom: 1px solid #E5E7EB;
}

.record-table :deep(.el-table__row) {
  height: auto;
}

.record-table :deep(.el-table__body tr:last-child td) {
  border-bottom: none;
}

/* ---- Record cell ---- */
.record-title {
  color: #111827;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5;
}

.record-time {
  color: #6B7280;
  font-size: 12px;
  margin-top: 2px;
  line-height: 1.4;
}

/* ---- Score ---- */
.score-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.score-full {
  font-size: 12px;
  color: #6B7280;
  margin-left: 2px;
}

/* ---- Report button ---- */
.report-btn {
  display: inline-block;
  padding: 4px 12px;
  font-size: 13px;
  color: #0F172A;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.5;
  white-space: nowrap;
}

.report-btn:hover {
  color: #2563EB;
  border-color: #2563EB;
}

/* ---- Empty state ---- */
.empty-state {
  margin-top: 80px;
}

/* ---- Responsive ---- */
@media (max-width: 640px) {
  .exam-record-list {
    padding: 16px 12px 32px;
  }

  .page-header {
    flex-direction: column;
    gap: 8px;
  }

  .logout-link {
    align-self: flex-start;
    margin-left: 52px;
  }
}
</style>

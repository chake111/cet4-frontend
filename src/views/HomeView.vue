<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import WritingStage from '@/components/exam/stages/WritingStage.vue'
import ListeningStage from '@/components/exam/stages/ListeningStage.vue'
import ReadingStage from '@/components/exam/stages/ReadingStage.vue'
import TranslationStage from '@/components/exam/stages/TranslationStage.vue'

const router = useRouter()
const userStore = useUserStore()

const writingQuestions = [
  {
    id: 'w-mock-1',
    content: {
      title: 'Directions: Write an essay about the importance of exercise.',
      background: 'You should write at least 120 words and no more than 180 words.',
    },
  },
]

const listeningQuestions = [
  {
    id: 'l-mock-1',
    content: {
      stem: 'What does the speaker suggest students do first?',
      options: ['A. Join a club', 'B. Review the syllabus', 'C. Buy new books', 'D. Ask senior students'],
    },
  },
]

const readingQuestions = [
  {
    id: 'r-mock-1',
    content: {
      passage:
        'Many researchers believe that reading for pleasure improves language skills and critical thinking over time.',
      stem: 'According to the passage, what can reading for pleasure improve?',
      options: [
        'A. Language skills only',
        'B. Critical thinking only',
        'C. Language skills and critical thinking',
        'D. Memory and speaking speed',
      ],
    },
  },
]

const translationQuestions = [
  {
    id: 't-mock-1',
    content: {
      source: '科技的发展让人们的学习方式更加灵活，也让终身学习成为可能。',
    },
  },
]

const handleLogout = async () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  await router.push('/login')
}
</script>

<template>
  <div class="home-page">
    <el-card class="home-card">
      <header class="home-header">
        <h1>欢迎来到英语四级练习平台</h1>
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
      </header>

      <el-divider>任务 1.2b 临时验收页面</el-divider>

      <section class="stage-demo">
        <h2>WritingStage</h2>
        <WritingStage :questions="writingQuestions" />
      </section>

      <section class="stage-demo">
        <h2>ListeningStage</h2>
        <ListeningStage :questions="listeningQuestions" />
      </section>

      <section class="stage-demo">
        <h2>ReadingStage</h2>
        <ReadingStage :questions="readingQuestions" />
      </section>

      <section class="stage-demo">
        <h2>TranslationStage</h2>
        <TranslationStage :questions="translationQuestions" />
      </section>
    </el-card>
  </div>
</template>

<style scoped>
.home-page {
  padding: 24px;
  background: #f5f7fa;
}

.home-card {
  max-width: 960px;
  margin: 0 auto;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.stage-demo {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.stage-demo h2 {
  margin: 0;
  padding: 12px 16px;
  font-size: 16px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
}
</style>

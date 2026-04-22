<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  await router.push('/login')
}
</script>

<template>
  <div class="home-page">
    <el-card>
      <h1>欢迎来到英语四级练习平台</h1>
      <el-button type="danger" @click="handleLogout">退出登录</el-button>
    </el-card>
  </div>
</template>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
</style>

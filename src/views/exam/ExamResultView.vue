<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/exam')
}
</script>

<template>
  <div class="result-placeholder">
    <h2>结果页开发中</h2>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
</template>

<style scoped>
.result-placeholder {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
}
</style>

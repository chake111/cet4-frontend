<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    const res = await request.post('/auth/login', {
      username: form.username,
      password: form.password,
    })

    if (res.code === 200 && res.data?.token) {
      userStore.setToken(res.data.token)
      ElMessage.success('登录成功')
      await router.push('/')
      return
    }

    ElMessage.error(res.message || '登录失败')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>英语四级练习平台</h2>
      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <div class="footer-link">
          <el-link type="primary" @click="$router.push('/register')">注册</el-link>
        </div>
        <el-button type="primary" :loading="loading" class="full-width" @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.login-card {
  width: 360px;
}

.full-width {
  width: 100%;
}
</style>

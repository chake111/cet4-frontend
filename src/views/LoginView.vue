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
    ElMessage.warning('输入用户名和密码')
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
    ElMessage.error(error.response?.data?.message || '登录失败，稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <header class="top-bar">
      <span class="brand">CET-4 模拟考试</span>
    </header>

    <div class="main-area">
      <h1 class="page-title">登录</h1>

      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="密码"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button type="primary" :loading="loading" size="large" class="submit-btn" @click="handleLogin">
          登录
        </el-button>
      </el-form>

      <div class="footer-link">
        没有账号？<router-link to="/register">注册</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--c-bg-weak);
}

.top-bar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: var(--c-primary);
  color: #FFFFFF;
}

.brand {
  font-size: 15px;
  font-weight: 600;
  color: #FFFFFF;
}

.main-area {
  max-width: 400px;
  margin: 0 auto;
  padding: 80px 20px 40px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text-primary);
  margin-bottom: 32px;
}

.submit-btn {
  width: 100%;
  border-radius: var(--r-button);
  font-weight: 500;
  height: 44px;
}

.footer-link {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--c-text-secondary);
}

.footer-link a {
  color: var(--c-accent);
  text-decoration: none;
}

.footer-link a:hover {
  text-decoration: underline;
}

.main-area :deep(.el-input__wrapper) {
  border-radius: var(--r-input);
  box-shadow: none;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
}

.main-area :deep(.el-input__wrapper:hover) {
  border-color: var(--c-accent);
}

.main-area :deep(.el-input__wrapper.is-focus) {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 1px var(--c-accent);
}
</style>

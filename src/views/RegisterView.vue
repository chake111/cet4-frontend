<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
    return
  }

  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度为 4~20 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6~20 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  if (loading.value) {
    return
  }

  const valid = await formRef.value.validate().catch(() => false)

  if (!valid) {
    return
  }

  loading.value = true

  try {
    const res = await request.post('/auth/register', {
      username: form.username,
      password: form.password,
    })

    if (res.code === 200) {
      ElMessage.success('注册成功')
      await router.push('/login')
      return
    }

    ElMessage.error(res.message || '注册失败')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '注册失败，稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <header class="top-bar">
      <span class="brand">CET-4 模拟考试</span>
    </header>

    <div class="main-area">
      <h1 class="page-title">注册</h1>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent>
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="密码"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            placeholder="确认密码"
            size="large"
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="loading"
          size="large"
          class="submit-btn"
          @click="handleRegister"
        >
          注册
        </el-button>
      </el-form>

      <div class="footer-link">
        已有账号？<router-link to="/login">登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
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

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { authService } from '@/services/authService'

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
    const res = await authService.register(
      {
        username: form.username,
        password: form.password,
      },
      { suppressErrorMessage: true }
    )

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
  <AuthLayout>
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

    <div class="footer-link">已有账号？<router-link to="/login">登录</router-link></div>
  </AuthLayout>
</template>

<style scoped>
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
</style>

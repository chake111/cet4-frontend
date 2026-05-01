<script setup>
import { EXAM_TITLE } from '@/constants/exam'
</script>

<template>
  <div class="auth-page">
    <header class="top-bar">
      <span class="brand">{{ EXAM_TITLE }}</span>
    </header>

    <main class="main-area">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: var(--c-bg-weak);
}

.top-bar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: var(--c-primary);
  color: #ffffff;
}

.brand {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.main-area {
  max-width: 400px;
  margin: 0 auto;
  padding: 80px 20px 40px;
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

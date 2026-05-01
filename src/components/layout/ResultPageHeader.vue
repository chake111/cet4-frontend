<script setup>
import { EXAM_TITLE } from '@/constants/exam'

defineProps({
  backText: {
    type: String,
    default: '返回首页',
  },
})

defineEmits(['back'])
</script>

<template>
  <header class="result-header">
    <span class="header-brand">{{ EXAM_TITLE }}</span>
    <span class="header-link" @click="$emit('back')">{{ backText }}</span>
  </header>
</template>

<style scoped>
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: var(--c-primary);
  color: #ffffff;
}
.header-brand {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.header-link {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: color 0.2s;
}
.header-link:hover {
  color: #ffffff;
  text-decoration: underline;
}
@media (max-width: 480px) {
  .result-header {
    padding: 0 16px;
  }
}
</style>

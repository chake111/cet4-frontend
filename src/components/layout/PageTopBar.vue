<script setup>
import { EXAM_TITLE } from '@/constants/exam'

defineProps({
  title: {
    type: String,
    default: EXAM_TITLE,
  },
})
</script>

<template>
  <header class="top-bar">
    <span class="brand">{{ title }}</span>
    <div v-if="$slots.actions" class="top-bar-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: var(--c-primary);
  color: #FFFFFF;
}

.brand {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.top-bar-link) {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  text-decoration: none;
}

:deep(.top-bar-link:hover) {
  text-decoration: underline;
  color: #FFFFFF;
}

:deep(.top-bar-divider) {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}
</style>

<script setup>
defineProps({
  isLastStage: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['next', 'submit'])
</script>

<template>
  <footer class="exam-footer">
    <el-button
      type="primary"
      size="default"
      :loading="isSubmitting"
      @click="isLastStage ? $emit('submit') : $emit('next')"
    >
      {{ isSubmitting ? '提交中...' : isLastStage ? '交卷' : '下一阶段' }}
    </el-button>
  </footer>
</template>

<style scoped>
.exam-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  margin: 24px -20px 0;
  background: var(--c-bg);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

@media (max-width: 480px) {
  .exam-footer {
    padding: 12px;
    margin: 16px -12px 0;
  }

  .exam-footer .el-button {
    width: 100%;
  }
}
</style>

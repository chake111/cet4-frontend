<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  meta: {
    type: String,
    default: '',
  },
  stem: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="session-card">
    <div class="session-header">
      <div class="session-title">{{ title }}</div>
      <div v-if="meta" class="session-meta">{{ meta }}</div>
    </div>

    <p v-if="stem" class="session-stem">{{ stem }}</p>

    <slot name="before-questions" />
    <slot />
  </div>
</template>

<style scoped>
.session-card {
  background: #ffffff;
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: 24px 30px;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.session-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.session-meta {
  font-size: 13px;
  line-height: 20px;
  color: var(--c-text-secondary);
}

.session-stem {
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-text-primary);
}
</style>

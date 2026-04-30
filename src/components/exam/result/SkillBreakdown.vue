<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <section class="breakdown-card">
    <div class="breakdown-grid">
      <div v-for="item in items" :key="item.key" class="breakdown-item">
        <div class="breakdown-label">{{ item.label }}</div>
        <div class="breakdown-score">{{ item.earned }}/{{ item.max }}</div>
        <div class="breakdown-bar">
          <div class="breakdown-bar-fill" :style="{ width: item.percent + '%' }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.breakdown-card {
  background: var(--c-bg);
  border-radius: var(--r-card);
  padding: 24px 32px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.breakdown-item {
  min-width: 0;
}

.breakdown-label {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin-bottom: 6px;
}

.breakdown-score {
  font-size: 20px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 8px;
  font-family: var(--font-mono);
}

.breakdown-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--c-border);
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--c-accent);
  transition: width 0.4s ease;
}

@media (max-width: 768px) {
  .breakdown-card {
    padding: 20px;
  }

  .breakdown-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .breakdown-grid {
    gap: 12px;
  }
}
</style>

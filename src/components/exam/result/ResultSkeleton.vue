<script setup></script>

<template>
  <div class="skeleton-wrap">
    <el-skeleton-item variant="rect" class="skeleton-overview" />
    <el-skeleton-item variant="rect" class="skeleton-breakdown" />
    <el-skeleton-item variant="rect" class="skeleton-detail" />
  </div>
</template>

<style scoped>
.skeleton-wrap {
  display: grid;
  gap: 16px;
}
.skeleton-overview {
  width: 100%;
  height: 160px;
  border-radius: var(--r-card);
}
.skeleton-breakdown {
  width: 100%;
  height: 80px;
  border-radius: var(--r-card);
}
.skeleton-detail {
  width: 100%;
  height: 240px;
  border-radius: var(--r-card);
}
</style>

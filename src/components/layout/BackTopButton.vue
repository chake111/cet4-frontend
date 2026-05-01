<script setup>
import { useBackTop } from '@/composables/useBackTop'

const { showBackTop, scrollToTop } = useBackTop()
</script>

<template>
  <transition>
    <button v-if="showBackTop" class="modern-back-top" aria-label="回到顶部" @click="scrollToTop">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  </transition>
</template>

<style scoped>
.modern-back-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--c-primary);
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.modern-back-top:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>

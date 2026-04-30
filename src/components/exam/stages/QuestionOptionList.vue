<script setup>
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: String,
    default: '',
  },
  maxOptions: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const getOptionValue = (index) => String.fromCharCode(65 + index)
</script>

<template>
  <div class="option-list">
    <div
      v-for="(option, index) in maxOptions ? props.options.slice(0, maxOptions) : props.options"
      :key="index"
      class="option-item"
      :class="{ 'option-selected': modelValue === getOptionValue(index) }"
      @click="emit('update:modelValue', getOptionValue(index))"
    >
      <span class="option-label">{{ getOptionValue(index) }}</span>
      <span class="option-text">{{ option }}</span>
    </div>
  </div>
</template>

<style scoped>
.option-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--c-text-primary);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--r-input);
  transition: background-color 0.15s;
}

.option-item:hover {
  background-color: var(--c-bg-hover);
}

.option-item.option-selected {
  background-color: rgba(37, 99, 235, 0.06);
  border: 1px solid var(--c-accent);
}

.option-label {
  width: 24px;
  flex: 0 0 24px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.option-text {
  flex: 1;
}
</style>

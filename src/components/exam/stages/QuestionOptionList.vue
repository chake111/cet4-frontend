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

const selectOption = (index) => {
  emit('update:modelValue', getOptionValue(index))
}

const onKeydown = (event, index) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectOption(index)
  }
}
</script>

<template>
  <div class="option-list" role="radiogroup">
    <div
      v-for="(option, index) in maxOptions ? props.options.slice(0, maxOptions) : props.options"
      :key="index"
      class="option-item"
      :class="{ 'option-selected': modelValue === getOptionValue(index) }"
      role="radio"
      :aria-checked="modelValue === getOptionValue(index) ? 'true' : 'false'"
      :aria-label="getOptionValue(index) + '. ' + option"
      tabindex="0"
      @click="selectOption(index)"
      @keydown="onKeydown($event, index)"
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
  border: 1px solid transparent;
  transition:
    background-color 0.15s,
    box-shadow 0.15s;
}

.option-item:hover {
  background-color: var(--c-bg-hover);
}

/* #6: 键盘聚焦样式 */
.option-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--c-primary, #2563eb);
  background-color: var(--c-bg-hover);
}

.option-item.option-selected {
  background-color: rgba(37, 99, 235, 0.06);
  border: 1px solid var(--c-accent);
}

.option-item.option-selected:focus-visible {
  box-shadow: 0 0 0 2px var(--c-primary, #2563eb);
}

.option-label {
  width: 24px;
  flex: 0 0 24px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.option-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* #12: 移动端适配 */
@media (max-width: 480px) {
  .option-item {
    gap: 8px;
    padding: 6px 8px;
    font-size: 13px;
  }

  .option-label {
    width: 20px;
    flex: 0 0 20px;
    font-size: 13px;
  }

  .option-text {
    font-size: 13px;
  }
}
</style>

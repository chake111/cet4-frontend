import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      all: false,
      include: [
        'src/domain/exam/answer.js',
        'src/domain/exam/constants.js',
        'src/domain/exam/feedback.js',
        'src/domain/exam/grouping.js',
        'src/domain/exam/index.js',
        'src/domain/exam/result.js',
        'src/domain/exam/transform.js',
        'src/stores/examAnswer.js',
        'src/stores/examSession.js',
        'src/stores/user.js',
        'src/composables/useExamFlow.js',
        'src/composables/useExamTimer.js',
        'src/utils/date.js',
        'src/utils/request.js',
      ],
      exclude: [
        'src/utils/answer.js',
        'src/utils/examGrouping.js',
        'src/utils/examResult.js',
        'src/utils/feedback.js',
        'src/utils/questionTransform.js',
        'src/constants/exam.js',
        'src/constants/request.js',
      ],
    },
  },
})

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { TIMER_DANGER_SECONDS, TIMER_TICK_MS } from '@/constants/exam'

/**
 * 考试计时 composable。
 * 从 examSessionStore 读取阶段计时信息。
 *
 * @param {import('pinia').Store} examSessionStore - examSession store 实例
 * @param {object} options - 配置项
 */
export function useExamTimer(examSessionStore, options = {}) {
  const tick = ref(0)
  let intervalId = null

  const remainingSeconds = computed(() => {
    tick.value
    if (!examSessionStore.stageStartedAt || !examSessionStore.stageDuration) return 0

    const elapsed = Math.floor((Date.now() - examSessionStore.stageStartedAt) / 1000)
    return Math.max(0, examSessionStore.stageDuration - elapsed)
  })

  const timeText = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const isDanger = computed(() => remainingSeconds.value <= TIMER_DANGER_SECONDS)

  const start = (onTick) => {
    if (intervalId !== null) return

    intervalId = setInterval(() => {
      tick.value += 1
      onTick?.()
    }, TIMER_TICK_MS)
  }

  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(() => {
    if (options.autoStart !== false) start()
  })

  onUnmounted(stop)

  return {
    remainingSeconds,
    timeText,
    isDanger,
    start,
    stop,
  }
}

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { TIMER_DANGER_SECONDS, TIMER_TICK_MS } from '@/constants/exam'

export function useExamTimer(examStore, options = {}) {
  const tick = ref(0)
  let intervalId = null

  const remainingSeconds = computed(() => {
    tick.value
    if (!examStore.stageStartedAt || !examStore.stageDuration) return 0

    const elapsed = Math.floor((Date.now() - examStore.stageStartedAt) / 1000)
    return Math.max(0, examStore.stageDuration - elapsed)
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

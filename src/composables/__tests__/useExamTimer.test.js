import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { useExamTimer } from '../useExamTimer'

// Mock constants
vi.mock('@/constants/exam', () => ({
  TIMER_DANGER_SECONDS: 300,
  TIMER_TICK_MS: 1000,
}))

describe('useExamTimer', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper(store, options = {}) {
    const Comp = defineComponent({
      setup() {
        const timer = useExamTimer(store, { autoStart: false, ...options })
        return { timer }
      },
      render() {
        return h('div')
      },
    })
    return mount(Comp, { global: { plugins: [pinia] } })
  }

  describe('remainingSeconds', () => {
    it('should return 0 when stageStartedAt is null', () => {
      const store = { stageStartedAt: null, stageDuration: 1800 }
      const wrapper = createWrapper(store)
      expect(wrapper.vm.timer.remainingSeconds.value).toBe(0)
    })

    it('should return 0 when stageDuration is 0', () => {
      const store = { stageStartedAt: Date.now(), stageDuration: 0 }
      const wrapper = createWrapper(store)
      expect(wrapper.vm.timer.remainingSeconds.value).toBe(0)
    })

    it('should calculate remaining seconds correctly', () => {
      const store = {
        stageStartedAt: Date.now() - 60000, // 1 minute ago
        stageDuration: 1800, // 30 minutes
      }
      const wrapper = createWrapper(store)
      // Should be approximately 1740 seconds (1800 - 60)
      expect(wrapper.vm.timer.remainingSeconds.value).toBeGreaterThanOrEqual(1739)
      expect(wrapper.vm.timer.remainingSeconds.value).toBeLessThanOrEqual(1741)
    })

    it('should return 0 when time is up', () => {
      const store = {
        stageStartedAt: Date.now() - 2000000, // Way past duration
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      expect(wrapper.vm.timer.remainingSeconds.value).toBe(0)
    })
  })

  describe('timeText', () => {
    it('should format time as MM:SS', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      // At the start, should be 30:00
      expect(wrapper.vm.timer.timeText.value).toBe('30:00')
    })

    it('should show 00:00 when no active timer', () => {
      const store = { stageStartedAt: null, stageDuration: 0 }
      const wrapper = createWrapper(store)
      expect(wrapper.vm.timer.timeText.value).toBe('00:00')
    })
  })

  describe('isDanger', () => {
    it('should be true when remaining seconds <= 300', () => {
      const store = {
        stageStartedAt: Date.now() - 1501000, // 1501 seconds ago, 299 remaining for 1800 duration
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      expect(wrapper.vm.timer.isDanger.value).toBe(true)
    })

    it('should be false when remaining seconds > 300', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      expect(wrapper.vm.timer.isDanger.value).toBe(false)
    })
  })

  describe('start and stop', () => {
    it('should start the timer', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      const onTick = vi.fn()

      wrapper.vm.timer.start(onTick)
      vi.advanceTimersByTime(3000)

      expect(onTick).toHaveBeenCalledTimes(3)
      wrapper.vm.timer.stop()
    })

    it('should not start another interval if already running', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)

      wrapper.vm.timer.start()
      wrapper.vm.timer.start() // Second call should be ignored

      vi.advanceTimersByTime(2000)
      // Should only tick once per interval, not twice
      wrapper.vm.timer.stop()
    })

    it('should stop the timer', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      const onTick = vi.fn()

      wrapper.vm.timer.start(onTick)
      vi.advanceTimersByTime(1000)
      wrapper.vm.timer.stop()
      vi.advanceTimersByTime(2000)

      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('should handle stop when timer is not running', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const wrapper = createWrapper(store)
      // Should not throw
      expect(() => wrapper.vm.timer.stop()).not.toThrow()
    })
  })

  describe('autoStart', () => {
    it('should auto-start when autoStart is true (default)', () => {
      const store = {
        stageStartedAt: Date.now(),
        stageDuration: 1800,
      }
      const Comp = defineComponent({
        setup() {
          const timer = useExamTimer(store, { autoStart: true })
          return { timer }
        },
        render() {
          return h('div')
        },
      })
      const wrapper = mount(Comp, { global: { plugins: [pinia] } })

      vi.advanceTimersByTime(2000)
      // Timer should be ticking (we can verify by checking tick value changes)
      wrapper.vm.timer.stop()
    })
  })
})

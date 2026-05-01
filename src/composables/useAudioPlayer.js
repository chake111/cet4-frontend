import { ref, watch, nextTick, onMounted } from 'vue'

/**
 * 音频播放控制 composable。
 * 封装播放/暂停控制、自动播放、播放失败处理和禁暂停逻辑。
 *
 * @param {import('vue').Ref<string|null>} audioUrl - 音频 URL（ref 或 computed）
 * @param {object} options - 配置选项
 * @param {() => void} [options.onEnded] - 音频播放结束回调
 * @param {boolean} [options.disablePause=true] - 是否禁止暂停（听力题默认禁暂停）
 */
export function useAudioPlayer(audioUrl, options = {}) {
  const { onEnded, disablePause = true } = options

  const audioRef = ref(null)
  const hasPlayed = ref(false)
  const isPlaying = ref(false)
  const autoPlayFailed = ref(false)

  const onAudioEnded = () => {
    hasPlayed.value = true
    isPlaying.value = false
    onEnded?.()
  }

  const onAudioPlay = () => {
    isPlaying.value = true
    autoPlayFailed.value = false
  }

  const onAudioPause = () => {
    // 禁暂停：播放中暂停时立即恢复
    if (disablePause && !hasPlayed.value && audioRef.value) {
      audioRef.value.play().catch(() => {})
    }
  }

  const tryAutoPlay = () => {
    if (audioRef.value && audioUrl.value && !hasPlayed.value) {
      audioRef.value.play().catch(() => {
        // 浏览器可能阻止自动播放，需要用户手动点击播放
        autoPlayFailed.value = true
      })
    }
  }

  onMounted(() => {
    tryAutoPlay()
  })

  watch(
    () => audioUrl.value,
    async (url) => {
      if (url) {
        await nextTick()
        tryAutoPlay()
      }
    }
  )

  return {
    audioRef,
    hasPlayed,
    isPlaying,
    autoPlayFailed,
    tryAutoPlay,
    onAudioEnded,
    onAudioPlay,
    onAudioPause,
  }
}

import { onMounted, onUnmounted, ref } from 'vue'

export function useBackTop(threshold = 300) {
  const showBackTop = ref(false)

  const handleScroll = () => {
    showBackTop.value = window.scrollY > threshold
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    handleScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    showBackTop,
    scrollToTop,
  }
}

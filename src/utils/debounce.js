/**
 * 简易防抖实现，支持 leading / trailing 选项。
 * 行为与 lodash.debounce 一致：leading 为 true 时首次调用立即执行，
 * trailing 为 true 时在等待窗口结束后执行最后一次调用。
 * 当 leading + trailing 同时为 true 且仅触发一次时，只会执行 leading，
 * 不会重复调用。
 *
 * @param {Function} fn   要防抖的函数
 * @param {number}   delay 等待毫秒数
 * @param {{ leading?: boolean, trailing?: boolean }} options
 * @returns {Function & { cancel: () => void }}
 */
export function debounce(fn, delay, options = {}) {
  const { leading = false, trailing = true } = options
  let timer = null
  let lastThis = null
  let lastArgs = null
  let hasPendingCall = false

  function debounced(...args) {
    lastThis = this
    lastArgs = args

    if (timer === null) {
      // 新的防抖窗口
      if (leading) {
        fn.apply(lastThis, lastArgs)
        hasPendingCall = false
      } else {
        hasPendingCall = true
      }

      timer = setTimeout(() => {
        if (trailing && hasPendingCall) {
          fn.apply(lastThis, lastArgs)
        }
        timer = null
        lastThis = null
        lastArgs = null
        hasPendingCall = false
      }, delay)
    } else {
      // 在已有防抖窗口内再次调用
      hasPendingCall = true
    }
  }

  /** 取消尚未执行的 trailing 调用 */
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
    lastThis = null
    lastArgs = null
    hasPendingCall = false
  }

  return debounced
}

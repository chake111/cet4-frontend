export const parseTime = (value) => {
  if (!value) return null
  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? null : time
}

export const formatDateTime = (value, emptyText = '-') => {
  const time = parseTime(value)
  if (!time) return emptyText

  const pad = (n) => String(n).padStart(2, '0')
  return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}`
}

export const formatDuration = (startTime, endTime, emptyText = '--:--:--') => {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  if (!start || !end || end < start) return emptyText

  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':')
}

export const formatDurationText = (startTime, endTime, emptyText = '-') => {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  if (!start || !end || end < start) return emptyText

  const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000)
  if (totalMinutes < 1) return '<1分钟'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}小时${minutes}分钟`
  return `${minutes}分钟`
}

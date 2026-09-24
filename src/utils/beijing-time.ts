/** 业务时间统一按北京时间解释，与后端 LocalDateTime / MySQL DATETIME 一致。 */
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export function beijingDateTime(value: Date = new Date(), separator: 'T' | ' ' = 'T'): string {
  const parts = Object.fromEntries(formatter.formatToParts(value).map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}${separator}${parts.hour}:${parts.minute}:${parts.second}`
}

export function beijingDate(value: Date = new Date()): string { return beijingDateTime(value).slice(0, 10) }
export function beijingTime(value: Date = new Date()): string { return beijingDateTime(value).slice(11, 19) }

/** 无时区的服务端/Excel 时间是北京时间；已有 Z 或偏移量的时间按其绝对时刻解析。 */
export function parseBeijingDateTime(value: string): Date {
  const normalized = value.trim().replace(' ', 'T').replace(/\//g, '-')
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return new Date(`${normalized}T00:00:00+08:00`)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(normalized)) return new Date(`${normalized}+08:00`)
  return new Date(normalized)
}

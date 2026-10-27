import CronParser from 'cron-parser'
import { dateFormat } from './index'

/**
 * 不含年的 cron 表达式
 * @param cron
 */
const expressionNoYear = (cron: string) => {
  const vs = cron.split(' ')
  // 长度=== 7 包含年表达式 不解析
  if (vs.length === 7) {
    return vs.slice(0, vs.length - 1).join(' ')
  }
  return cron
}

/**
 * 解析cron表达式预计未来运行时间
 * @param cron cron表达式
 */
export function parseCron(cron: string) {
  try {
    const parse = expressionNoYear(cron)
    const iter = CronParser.parseExpression(parse, {
      currentDate: dateFormat(new Date()),
    })
    const result: string[] = []
    for (let i = 1; i <= 5; i++) {
      const nextDate = iter.next()
      if (nextDate) {
        result.push(dateFormat(new Date(nextDate as any)))
      }
    }

    return result.length > 0 ? result.join('\n') : '无执行时间'
  } catch (e) {
    return '表达式错误'
  }
}

import { addDays, bostonNow, formatCalendarDate, toCalendarDate, weekdayIndex, type CalendarDate } from './sweeping'
import { ilikeContains, sqlNonNegativeInt } from './sql'

export const TRASH_RESOURCE_ID = 'fee8ee07-b8b5-4ee5-b540-5162590ba5c1'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TOKENS: Array<[string, number]> = [
  ['TH', 4],
  ['SU', 0],
  ['SA', 6],
  ['M', 1],
  ['T', 2],
  ['W', 3],
  ['F', 5],
  ['S', 6],
]

export interface TrashAddress {
  full_address: string
  mailing_neighborhood: string | null
  zip_code: string | null
  trashday: string | null
  recollect: string | null
}

export interface ParsedSchedule {
  days: number[]
  suffix: string
  label: string
}

export function parseScheduleCode(code: string | null | undefined): ParsedSchedule {
  if (!code?.trim()) {
    return { days: [], suffix: '', label: 'Not listed' }
  }

  let rest = code.toUpperCase().replace(/\s+/g, '')
  const days: number[] = []
  while (rest.length > 0) {
    const token = TOKENS.find(([name]) => rest.startsWith(name))
    if (!token) break
    if (!days.includes(token[1])) days.push(token[1])
    rest = rest.slice(token[0].length)
  }

  return {
    days,
    suffix: rest,
    label: days.length > 0 ? days.map((day) => DAY_NAMES[day]).join(' & ') : 'Not listed',
  }
}

export function nextCollectionDate(days: number[], now = new Date(), cutoffHour = 18): CalendarDate | null {
  if (days.length === 0) return null
  const current = bostonNow(now)
  const start = days.includes(current.weekday) && current.hour >= cutoffHour
    ? addDays(toCalendarDate(current), 1)
    : toCalendarDate(current)

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = addDays(start, offset)
    if (days.includes(weekdayIndex(candidate))) return candidate
  }

  return null
}

export function formatCollectionDate(date: CalendarDate, today: CalendarDate): string {
  if (date.year === today.year && date.month === today.month && date.day === today.day) {
    return `Today, ${formatCalendarDate(date)}`
  }
  return formatCalendarDate(date)
}

export function trashSearchSql(query: string, limit = 15): string {
  const safeLimit = sqlNonNegativeInt(limit) || 15
  return [
    'SELECT "full_address", "mailing_neighborhood", "zip_code", "trashday", "recollect"',
    `FROM "${TRASH_RESOURCE_ID}"`,
    `WHERE ${ilikeContains('"full_address"', query)}`,
    'ORDER BY length("full_address"), "full_address"',
    `LIMIT ${safeLimit}`,
  ].join(' ')
}

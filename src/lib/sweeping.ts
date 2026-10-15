import type { StreetData } from '../types/street'
import { formatTime12h } from './utils'

export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface BostonDateTime extends CalendarDate {
  hour: number
  minute: number
  weekday: number
}

export interface ClockTime {
  hour: number
  minute: number
}

export interface SeasonWindow {
  startMonth: number
  startDay: number
  endMonth: number
  endDay: number
}

export interface StreetScheduleSummary {
  status: 'danger' | 'safe' | 'info'
  message: string
  nextDateLabel: string
  timeRange: string
  specificDays: string
  hasUpcoming: boolean
  inSeasonToday: boolean
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const EXTENDED_DISTRICTS = new Set(['North End', 'South End', 'Beacon Hill'])

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:America/New_York',
  'X-LIC-LOCATION:America/New_York',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n')

export function sideKey(side: string): string {
  const trimmed = side.trim()
  if (/^odd$/i.test(trimmed)) return 'Odd'
  if (/^even$/i.test(trimmed)) return 'Even'
  return trimmed
}

export function sideLabel(side: string): string {
  const key = sideKey(side)
  if (!key) return 'Entire block'
  return key
}

export function sidePhrase(side: string): string {
  const label = sideLabel(side)
  if (label === 'Entire block') return 'Entire block'
  return `${label} side`
}

export function uniqueSides(rows: Array<Pick<StreetData, 'side'>>): string[] {
  const seen = new Set<string>()
  const sides: string[] = []
  for (const row of rows) {
    const key = sideKey(row.side)
    if (seen.has(key)) continue
    seen.add(key)
    sides.push(key)
  }

  const rank = (side: string) => {
    if (side === 'Odd') return 0
    if (side === 'Even') return 1
    if (side === '') return 2
    return 3
  }

  return sides.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

export function weekOfMonth(day: number): number {
  return Math.ceil(day / 7)
}

export function compareCalendar(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  }
}

export function weekdayIndex(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
}

export function formatCalendarDate(date: CalendarDate, withWeekday = true): string {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day))
  return new Intl.DateTimeFormat('en-US', {
    weekday: withWeekday ? 'long' : undefined,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utc)
}

export function bostonNow(date = new Date()): BostonDateTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date)

  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  let hour = Number(read('hour'))
  if (hour === 24) hour = 0

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour,
    minute: Number(read('minute')),
    weekday: WEEKDAY_INDEX[read('weekday')] ?? 0,
  }
}

export function toCalendarDate(value: BostonDateTime): CalendarDate {
  return { year: value.year, month: value.month, day: value.day }
}

/**
 * Boston sweeps most streets April 1–November 30.
 * North End, South End, Beacon Hill, and rows flagged north_end_pilot run March 1–December 31.
 * year_round rows have no seasonal gap.
 */
export function seasonWindow(street: Pick<StreetData, 'dist_name' | 'year_round' | 'north_end_pilot'>): SeasonWindow | null {
  if (street.year_round === 't') return null
  if (EXTENDED_DISTRICTS.has(street.dist_name) || street.north_end_pilot === 't') {
    return { startMonth: 3, startDay: 1, endMonth: 12, endDay: 31 }
  }
  return { startMonth: 4, startDay: 1, endMonth: 11, endDay: 30 }
}

export function inSeason(date: CalendarDate, window: SeasonWindow | null): boolean {
  if (!window) return true
  const start = { year: date.year, month: window.startMonth, day: window.startDay }
  const end = { year: date.year, month: window.endMonth, day: window.endDay }
  return compareCalendar(date, start) >= 0 && compareCalendar(date, end) <= 0
}

export function seasonEndFor(date: CalendarDate, street: StreetData): CalendarDate | null {
  const window = seasonWindow(street)
  if (!window) return null
  const start = { year: date.year, month: window.startMonth, day: window.startDay }
  const end = { year: date.year, month: window.endMonth, day: window.endDay }
  if (compareCalendar(date, end) <= 0 && compareCalendar(date, start) >= 0) return end
  if (compareCalendar(date, start) < 0) return end
  return { year: date.year + 1, month: window.endMonth, day: window.endDay }
}

export function scheduledWeekdays(street: StreetData): number[] {
  return DAY_KEYS.flatMap((key, index) => (street[key] === 't' ? [index] : []))
}

export function scheduledWeeks(street: StreetData): number[] {
  return [1, 2, 3, 4, 5].filter((week) => street[`week_${week}` as keyof StreetData] === 't')
}

export function isSweepingDay(date: CalendarDate, street: StreetData): boolean {
  if (!inSeason(date, seasonWindow(street))) return false
  const weeks = scheduledWeeks(street)
  const days = scheduledWeekdays(street)
  if (weeks.length === 0 || days.length === 0) return false
  return days.includes(weekdayIndex(date)) && weeks.includes(weekOfMonth(date.day))
}

export function parseClock(value: string): ClockTime | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return { hour, minute }
}

export function nextSweepingDate(street: StreetData, now = new Date()): CalendarDate | null {
  const current = bostonNow(now)
  const today = toCalendarDate(current)
  const end = parseClock(street.end_time)
  const endMinutes = end ? end.hour * 60 + end.minute : 24 * 60
  const nowMinutes = current.hour * 60 + current.minute
  const start = isSweepingDay(today, street) && nowMinutes >= endMinutes ? addDays(today, 1) : today

  for (let offset = 0; offset < 400; offset += 1) {
    const candidate = addDays(start, offset)
    if (isSweepingDay(candidate, street)) return candidate
  }

  return null
}

export function sweepingOccurrences(street: StreetData, now = new Date()): CalendarDate[] {
  const next = nextSweepingDate(street, now)
  if (!next) return []

  const until = seasonWindow(street) ? seasonEndFor(next, street) : addDays(next, 365)
  if (!until) return [next]

  const dates: CalendarDate[] = []
  let cursor = next
  while (compareCalendar(cursor, until) <= 0 && dates.length < 370) {
    if (isSweepingDay(cursor, street)) dates.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return dates
}

function weeksLabel(weeks: number[]): string {
  if (weeks.length === 5 || weeks.length === 0) return weeks.length === 5 ? 'every week' : ''
  const ordinal = ['', '1st', '2nd', '3rd', '4th', '5th']
  const labels = weeks.map((week) => ordinal[week] ?? `${week}th`)
  return `${labels.join(' & ')} ${weeks.length === 1 ? 'week' : 'weeks'}`
}

export function describeStreet(street: StreetData, now = new Date()): StreetScheduleSummary {
  const current = bostonNow(now)
  const today = toCalendarDate(current)
  const next = nextSweepingDate(street, now)
  const todayInSeason = inSeason(today, seasonWindow(street))
  const end = parseClock(street.end_time)
  const endMinutes = end ? end.hour * 60 + end.minute : 24 * 60
  const happeningNow = isSweepingDay(today, street) && current.hour * 60 + current.minute < endMinutes
  const weeks = scheduledWeeks(street)
  const days = scheduledWeekdays(street)
  const weekText = weeksLabel(weeks)
  const dayText = days.length === 0
    ? 'No scheduled cleaning'
    : `Every ${days.map((day) => DAY_NAMES[day]).join(' & ')}${weekText ? ` (${weekText})` : ''}`

  let status: StreetScheduleSummary['status'] = happeningNow ? 'danger' : 'safe'
  let message = happeningNow ? 'Move Your Car' : 'Safe to Park'
  if (!todayInSeason) {
    status = 'info'
    message = 'Out of Season'
  }
  if (!next && !happeningNow) {
    status = 'info'
    message = 'No Upcoming Sweeping'
  }

  const nextDateLabel = next
    ? (compareCalendar(next, today) === 0 ? `Today, ${formatCalendarDate(next)}` : formatCalendarDate(next))
    : 'No date on the schedule'

  return {
    status,
    message,
    nextDateLabel,
    timeRange: formatTimeRange(street.start_time, street.end_time),
    specificDays: dayText,
    hasUpcoming: next !== null,
    inSeasonToday: todayInSeason,
  }
}

export function formatTimeRange(start: string, end: string): string {
  const startLabel = formatTime12h(start)
  const endLabel = formatTime12h(end)
  if (!startLabel || !endLabel) return 'Time not listed'
  return `${startLabel} – ${endLabel}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function icsStamp(date: CalendarDate, time: ClockTime): string {
  return `${date.year}${pad(date.month)}${pad(date.day)}T${pad(time.hour)}${pad(time.minute)}00`
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  let rest = line.slice(75)
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  return parts.join('\r\n')
}

export function buildSweepingIcs(street: StreetData, now = new Date()): string | null {
  const dates = sweepingOccurrences(street, now)
  const start = parseClock(street.start_time)
  const end = parseClock(street.end_time)
  if (dates.length === 0 || !start || !end) return null

  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const seasonNote = (() => {
    const endDate = seasonEndFor(dates[0], street)
    if (!endDate) return 'This street is swept year-round.'
    return `Sweeping season ends ${formatCalendarDate(endDate, false)}.`
  })()

  const events = dates.map((date) => {
    const startMinutes = start.hour * 60 + start.minute
    const endMinutes = end.hour * 60 + end.minute
    const endDate = endMinutes <= startMinutes ? addDays(date, 1) : date
    const lines = [
      'BEGIN:VEVENT',
      `UID:boston-sweeper-${street.main_id}-${icsStamp(date, start)}@boston-hub.vercel.app`,
      `DTSTAMP:${stamp}`,
      `SUMMARY:${escapeIcs(`Street cleaning: ${street.st_name} (${sideLabel(street.side)})`)}`,
      `DESCRIPTION:${escapeIcs(`Street cleaning from ${street.from} to ${street.to}. District: ${street.dist_name}. ${seasonNote}`)}`,
      `DTSTART;TZID=America/New_York:${icsStamp(date, start)}`,
      `DTEND;TZID=America/New_York:${icsStamp(endDate, end)}`,
      'END:VEVENT',
    ]
    return lines.map(foldIcsLine).join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Boston Hub//Boston Sweeper//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    VTIMEZONE,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadICS(street: StreetData, now = new Date()) {
  const icsContent = buildSweepingIcs(street, now)
  if (!icsContent || typeof document === 'undefined') return

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  const url = window.URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', `${street.st_name.replace(/\s+/g, '_')}_cleaning.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

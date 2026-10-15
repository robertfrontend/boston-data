import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bostonNow, toCalendarDate } from './sweeping'
import { formatCollectionDate, nextCollectionDate, parseScheduleCode, trashSearchSql } from './trash'

describe('trash schedule codes', () => {
  it('reads weekday letters and keeps an unrecognized suffix', () => {
    assert.deepEqual(parseScheduleCode('MTH'), { days: [1, 4], suffix: '', label: 'Monday & Thursday' })
    assert.deepEqual(parseScheduleCode('TF'), { days: [2, 5], suffix: '', label: 'Tuesday & Friday' })
    assert.deepEqual(parseScheduleCode('TH5'), { days: [4], suffix: '5', label: 'Thursday' })
    assert.deepEqual(parseScheduleCode('W1A'), { days: [3], suffix: '1A', label: 'Wednesday' })
    assert.equal(parseScheduleCode(null).label, 'Not listed')
  })

  it('picks the next collection day and uses the same address match as suggestions', () => {
    const now = new Date('2026-04-08T15:00:00Z')
    const next = nextCollectionDate([4], now)
    assert.deepEqual(next, { year: 2026, month: 4, day: 9 })
    const today = toCalendarDate(bostonNow(now))
    assert.equal(formatCollectionDate(next!, today).startsWith('Thursday'), true)

    const sql = trashSearchSql("100 Beacon St")
    assert.match(sql, /ILIKE '%100 Beacon St%' ESCAPE '!'/)
    assert.match(sql, /ORDER BY length\("full_address"\)/)
  })
})

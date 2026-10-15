import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { StreetData } from '../types/street'
import {
  buildSweepingIcs,
  describeStreet,
  nextSweepingDate,
  sideKey,
  sideLabel,
  sweepingOccurrences,
  uniqueSides,
} from './sweeping'

function street(overrides: Partial<StreetData> = {}): StreetData {
  return {
    main_id: '42',
    st_name: 'Test St',
    dist_name: 'Jamaica Plain',
    start_time: '08:00',
    end_time: '12:00',
    side: 'Odd',
    from: 'Centre St',
    to: 'Perkins St',
    monday: 'f',
    tuesday: 't',
    wednesday: 'f',
    thursday: 'f',
    friday: 'f',
    saturday: 'f',
    sunday: 'f',
    week_1: 't',
    week_2: 'f',
    week_3: 't',
    week_4: 'f',
    week_5: 'f',
    year_round: 'f',
    ...overrides,
  }
}

describe('next sweeping date', () => {
  it('skips the off-season and lands on the first real sweeping day', () => {
    const next = nextSweepingDate(street(), new Date('2026-03-01T15:00:00Z'))
    assert.deepEqual(next, { year: 2026, month: 4, day: 7 })
  })

  it('keeps today when sweeping is still underway', () => {
    const next = nextSweepingDate(street(), new Date('2026-04-07T13:00:00Z'))
    assert.deepEqual(next, { year: 2026, month: 4, day: 7 })
    const summary = describeStreet(street(), new Date('2026-04-07T13:00:00Z'))
    assert.equal(summary.status, 'danger')
    assert.equal(summary.message, 'Move Your Car')
    assert.match(summary.nextDateLabel, /^Today,/)
  })

  it('moves to the next week-of-month match after the window ends', () => {
    const next = nextSweepingDate(street(), new Date('2026-04-07T16:30:00Z'))
    assert.deepEqual(next, { year: 2026, month: 4, day: 21 })
    const summary = describeStreet(street(), new Date('2026-04-08T15:00:00Z'))
    assert.equal(summary.status, 'safe')
    assert.equal(summary.message, 'Safe to Park')
  })

  it('uses the March start for extended districts', () => {
    const next = nextSweepingDate(
      street({ dist_name: 'North End', monday: 't', tuesday: 'f' }),
      new Date('2026-02-01T15:00:00Z'),
    )
    assert.deepEqual(next, { year: 2026, month: 3, day: 2 })
  })
})

describe('calendar file', () => {
  it('emits a New York timezone and stops at the season end', () => {
    const ics = buildSweepingIcs(street(), new Date('2026-03-01T15:00:00Z'))
    assert.ok(ics)
    assert.match(ics, /BEGIN:VTIMEZONE/)
    assert.match(ics, /TZID:America\/New_York/)
    assert.match(ics, /DTSTART;TZID=America\/New_York:20260407T080000/)
    assert.match(ics, /DTEND;TZID=America\/New_York:20260407T120000/)
    assert.match(ics, /DTSTART;TZID=America\/New_York:20261117T080000/)
    assert.doesNotMatch(ics, /DTSTART;TZID=America\/New_York:20260401/)
    assert.doesNotMatch(ics, /DTSTART;TZID=America\/New_York:202612/)
    assert.match(ics, /Sweeping season ends November 30\\, 2026/)

    const dates = sweepingOccurrences(street(), new Date('2026-03-01T15:00:00Z'))
    const last = dates[dates.length - 1]
    assert.ok(last)
    assert.ok(last.month < 11 || (last.month === 11 && last.day <= 30))
    assert.equal(dates.some((date) => date.month === 12), false)
  })

  it('keeps year-round streets on the calendar through the winter', () => {
    const dates = sweepingOccurrences(
      street({ year_round: 't', monday: 't', tuesday: 't', wednesday: 't', thursday: 't', friday: 't', saturday: 't', sunday: 't', week_1: 't', week_2: 't', week_3: 't', week_4: 't', week_5: 't' }),
      new Date('2026-01-15T15:00:00Z'),
    )
    assert.equal(dates[0]?.month, 1)
    assert.ok(dates.some((date) => date.month === 2))
    const ics = buildSweepingIcs(
      street({ year_round: 't', monday: 't', tuesday: 't', wednesday: 't', thursday: 't', friday: 't', saturday: 't', sunday: 't', week_1: 't', week_2: 't', week_3: 't', week_4: 't', week_5: 't' }),
      new Date('2026-01-15T15:00:00Z'),
    )
    assert.match(ics ?? '', /year-round/)
  })
})

describe('street sides', () => {
  it('normalizes odd, even, and blank sides', () => {
    assert.equal(sideKey('EVEN'), 'Even')
    assert.equal(sideKey('odd'), 'Odd')
    assert.equal(sideLabel(''), 'Entire block')
    assert.equal(sideLabel('Median'), 'Median')
    assert.deepEqual(
      uniqueSides([{ side: 'Even' }, { side: '' }, { side: 'ODD' }, { side: 'Median' }, { side: 'Even Side Median' }]),
      ['Odd', 'Even', '', 'Even Side Median', 'Median'],
    )
  })
})

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  featuredFoodSql,
  formatInspectionDate,
  mergeInspectionRecords,
  searchFoodSql,
  suggestionFoodSql,
  type FoodInspectionRecord,
  type GroupedBusiness,
} from './food-inspections'

function record(overrides: Partial<FoodInspectionRecord> = {}): FoodInspectionRecord {
  return {
    _id: 1,
    businessname: 'Example Cafe',
    licenseno: '100',
    result: 'HE_Pass',
    resultdttm: '2026-10-14T18:00:00Z',
    violdesc: 'Floors',
    comments: 'Clean the floor.',
    address: '1 Main St',
    city: 'Boston',
    ...overrides,
  }
}

describe('food inspection queries', () => {
  it('drops null result times on the featured query and keeps the latest row per restaurant', () => {
    const sql = featuredFoodSql(20, 0)
    assert.match(sql, /"resultdttm" IS NOT NULL/)
    assert.match(sql, /NULLS LAST/)
    assert.match(sql, /DISTINCT ON \("licenseno", "address"\)/)
    assert.match(sql, /ORDER BY "resultdttm" DESC NULLS LAST/)
  })

  it('searches with the same escaped partial match as autocomplete', () => {
    const entered = searchFoodSql("McDonald's 100%", 20, 40, '2021-10-15')
    const suggested = suggestionFoodSql("McDonald's 100%")
    assert.match(entered, /ILIKE '%McDonald''s 100!%%' ESCAPE '!'/)
    assert.match(suggested, /ILIKE '%McDonald''s 100!%%' ESCAPE '!'/)
    assert.doesNotMatch(entered, /"businessname" = '/)
    assert.match(entered, /"resultdttm" >= '2021-10-15'/)
    assert.match(entered, /OFFSET 40/)
  })
})

describe('merging inspection pages', () => {
  it('adds later pages onto the existing restaurant and ignores repeated rows', () => {
    const first = mergeInspectionRecords([], [
      record({ _id: 1, resultdttm: '2026-10-14T18:00:00Z', violdesc: 'Floors' }),
      record({ _id: 2, resultdttm: '2026-10-14T18:00:00Z', violdesc: 'Walls', comments: 'Repair.' }),
      record({ _id: 3, resultdttm: null, violdesc: 'Missing date' }),
    ])

    const secondPage = [
      record({ _id: 2, resultdttm: '2026-10-14T18:00:00Z', violdesc: 'Walls', comments: 'Repair.' }),
      record({ _id: 4, resultdttm: '2024-05-01T15:00:00Z', result: 'HE_Fail', violdesc: 'Temperature', comments: 'Cold food.' }),
      record({
        _id: 5,
        licenseno: '200',
        businessname: 'Other Place',
        address: '9 Elm St',
        resultdttm: '2026-09-01T15:00:00Z',
        violdesc: 'Sink',
      }),
    ]

    const merged = mergeInspectionRecords(first, secondPage)
    assert.equal(merged.length, 2)
    assert.equal(merged[0]?.name, 'Example Cafe')
    assert.equal(merged[0]?.inspections.length, 2)
    assert.equal(merged[0]?.inspections[0]?.resultdttm, '2026-10-14T18:00:00Z')
    assert.equal(merged[0]?.inspections[0]?.violations.length, 2)
    assert.equal(merged[0]?.inspections[1]?.result, 'HE_Fail')
    assert.equal(merged[1]?.name, 'Other Place')
    assert.equal(formatInspectionDate('not-a-date'), 'Date unavailable')
  })

  it('does not drop a known restaurant when a page only contains older visits', () => {
    const existing: GroupedBusiness[] = [{
      key: '100::1 Main St',
      licenseNo: '100',
      name: 'Example Cafe',
      address: '1 Main St',
      city: 'Boston',
      inspections: [{
        resultdttm: '2026-10-14T18:00:00Z',
        result: 'HE_Pass',
        violations: [{ id: 1, description: 'Floors', comments: 'Clean the floor.' }],
      }],
    }]

    const merged = mergeInspectionRecords(existing, [
      record({ _id: 9, resultdttm: '2023-01-02T12:00:00Z', result: 'HE_Pass', violdesc: 'Old note', comments: 'Done.' }),
    ])

    assert.equal(merged.length, 1)
    assert.equal(merged[0]?.inspections.length, 2)
    assert.equal(merged[0]?.inspections[0]?.violations[0]?.description, 'Floors')
  })
})

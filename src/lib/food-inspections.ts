import { ilikeContains, sqlNonNegativeInt } from './sql'

export const FOOD_RESOURCE_ID = '4582bec6-2b4f-4f9e-bc55-cbaa73117f4c'

const FOOD_COLUMNS = [
  '"_id"',
  '"businessname"',
  '"dbaname"',
  '"licenseno"',
  '"licstatus"',
  '"descript"',
  '"result"',
  '"resultdttm"',
  '"violdesc"',
  '"comments"',
  '"address"',
  '"city"',
  '"zip"',
  '"violation"',
].join(', ')

export interface FoodInspectionRecord {
  _id: number
  businessname: string
  dbaname?: string | null
  licenseno?: string | null
  licstatus?: string | null
  descript?: string | null
  result: string
  resultdttm: string | null
  violdesc?: string | null
  comments?: string | null
  address: string
  city: string
  zip?: string | null
  violation?: string | null
}

export interface FoodViolation {
  id: number
  description?: string
  comments?: string
}

export interface InspectionVisit {
  resultdttm: string
  result: string
  violations: FoodViolation[]
}

export interface GroupedBusiness {
  key: string
  licenseNo: string
  name: string
  address: string
  city: string
  inspections: InspectionVisit[]
}

export function fiveYearDateLimit(now = new Date()): string {
  const date = new Date(now.getTime())
  date.setUTCFullYear(date.getUTCFullYear() - 5)
  return date.toISOString().slice(0, 10)
}

export function featuredFoodSql(limit: number, offset: number): string {
  const safeLimit = sqlNonNegativeInt(limit)
  const safeOffset = sqlNonNegativeInt(offset)
  return [
    `SELECT ${FOOD_COLUMNS} FROM (`,
    `SELECT DISTINCT ON ("licenseno", "address") ${FOOD_COLUMNS}`,
    `FROM "${FOOD_RESOURCE_ID}"`,
    `WHERE "licstatus" = 'Active' AND "resultdttm" IS NOT NULL`,
    `ORDER BY "licenseno", "address", "resultdttm" DESC`,
    ') AS latest',
    'ORDER BY "resultdttm" DESC NULLS LAST',
    `LIMIT ${safeLimit} OFFSET ${safeOffset}`,
  ].join(' ')
}

export function searchFoodSql(query: string, limit: number, offset: number, dateLimit: string): string {
  const safeLimit = sqlNonNegativeInt(limit)
  const safeOffset = sqlNonNegativeInt(offset)
  return [
    `SELECT ${FOOD_COLUMNS}`,
    `FROM "${FOOD_RESOURCE_ID}"`,
    `WHERE ${ilikeContains('"businessname"', query)}`,
    `AND "licstatus" = 'Active'`,
    `AND "resultdttm" IS NOT NULL`,
    `AND "resultdttm" >= '${dateLimit}'`,
    'ORDER BY "resultdttm" DESC NULLS LAST',
    `LIMIT ${safeLimit} OFFSET ${safeOffset}`,
  ].join(' ')
}

export function suggestionFoodSql(query: string): string {
  return [
    'SELECT DISTINCT "businessname"',
    `FROM "${FOOD_RESOURCE_ID}"`,
    `WHERE ${ilikeContains('"businessname"', query)}`,
    `AND "licstatus" = 'Active'`,
    'LIMIT 8',
  ].join(' ')
}

export function businessKey(record: {
  licenseno?: string | null
  businessname: string
  address: string
}): string {
  const license = record.licenseno?.trim()
  const identity = license ? license : record.businessname.trim()
  return `${identity}::${record.address.trim()}`
}

export function isValidResultTime(value: string | null | undefined): value is string {
  if (!value) return false
  return !Number.isNaN(Date.parse(value))
}

export function formatInspectionDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

export function formatInspectionResult(result: string): string {
  return result.replace(/^HE_/, '').replaceAll('_', ' ')
}

export function mergeInspectionRecords(
  previous: GroupedBusiness[],
  incoming: FoodInspectionRecord[],
): GroupedBusiness[] {
  const order: string[] = []
  const groups = new Map<string, GroupedBusiness>()

  const ensure = (key: string, seed: GroupedBusiness) => {
    const existing = groups.get(key)
    if (existing) return existing
    groups.set(key, seed)
    order.push(key)
    return seed
  }

  for (const business of previous) {
    ensure(business.key, {
      ...business,
      inspections: business.inspections.map((visit) => ({
        ...visit,
        violations: visit.violations.map((violation) => ({ ...violation })),
      })),
    })
  }

  for (const record of incoming) {
    if (!isValidResultTime(record.resultdttm) || !record.businessname || !record.address) continue

    const key = businessKey(record)
    const group = ensure(key, {
      key,
      licenseNo: record.licenseno?.trim() || 'N/A',
      name: record.businessname,
      address: record.address,
      city: record.city,
      inspections: [],
    })

    let visit = group.inspections.find(
      (item) => item.resultdttm === record.resultdttm && item.result === record.result,
    )
    if (!visit) {
      visit = { resultdttm: record.resultdttm, result: record.result, violations: [] }
      group.inspections.push(visit)
    }

    const description = record.violdesc?.trim() || undefined
    const comments = record.comments?.trim() || undefined
    if (!description && !comments) continue

    const duplicate = visit.violations.some((violation) => violation.id === record._id)
      || visit.violations.some(
        (violation) => violation.description === description && violation.comments === comments,
      )
    if (duplicate) continue

    visit.violations.push({
      id: record._id,
      description,
      comments,
    })
  }

  for (const group of groups.values()) {
    group.inspections.sort((a, b) => Date.parse(b.resultdttm) - Date.parse(a.resultdttm))
  }

  return order.map((key) => groups.get(key) as GroupedBusiness)
}

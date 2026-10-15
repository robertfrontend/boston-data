interface DatastoreSqlResponse<T> {
  success: boolean
  result?: {
    records: T[]
  }
}

export async function queryDatastore<T>(sql: string): Promise<T[]> {
  const url = `https://data.boston.gov/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Analyze Boston returned ${response.status}`)
  }

  const data = (await response.json()) as DatastoreSqlResponse<T>
  if (!data.success || !data.result) {
    throw new Error('Analyze Boston query failed')
  }

  return data.result.records
}

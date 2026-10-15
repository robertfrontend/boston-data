/** Quote a value for a SQL string literal. */
export function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * Case-insensitive partial match. `!` is the escape character so user
 * input cannot inject extra LIKE wildcards.
 */
export function ilikeContains(column: string, raw: string): string {
  const escaped = raw
    .trim()
    .replace(/!/g, '!!')
    .replace(/%/g, '!%')
    .replace(/_/g, '!_')
    .replace(/'/g, "''")

  return `${column} ILIKE '%${escaped}%' ESCAPE '!'`
}

export function sqlNonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

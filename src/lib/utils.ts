export const normalizeStreetName = (value: string) => value.toLowerCase()
  .replace(/\bstreet\b/g, 'st')
  .replace(/\bavenue\b/g, 'ave')
  .replace(/\bplace\b/g, 'pl')
  .replace(/\broad\b/g, 'rd')
  .replace(/\bparkway\b/g, 'pkwy')
  .replace(/\bboulevard\b/g, 'blvd')
  .replace(/\bterrace\b/g, 'ter')
  .replace(/\bcourt\b/g, 'ct')
  .replace(/\blane\b/g, 'ln')
  .replace(/\bcircle\b/g, 'cir')
  .replace(/\bsquare\b/g, 'sq')
  .replace(/[^\w\s]/g, '')
  .trim()

export const formatTime12h = (timeStr: string) => {
  if (!timeStr) return ''
  const match = /^(\d{1,2}):(\d{2})/.exec(timeStr.trim())
  if (!match) return ''
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return ''
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

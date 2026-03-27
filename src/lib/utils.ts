export const normalizeStreetName = (s: string) => s.toLowerCase()
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
  .trim();

export const formatTime12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

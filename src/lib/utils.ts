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

export const downloadICS = (street: any) => {
  const daysMap: Record<string, string> = {
    sunday: 'SU',
    monday: 'MO',
    tuesday: 'TU',
    wednesday: 'WE',
    thursday: 'TH',
    friday: 'FR',
    saturday: 'SA',
  };

  const activeDays = Object.keys(daysMap).filter(d => street[d] === 't');
  const activeWeeks = ['1', '2', '3', '4', '5'].filter(w => street[`week_${w}`] === 't');

  if (activeDays.length === 0) return;

  // Build BYDAY rule part (e.g., 1TH,3TH)
  const byDayParts: string[] = [];
  activeDays.forEach(day => {
    const code = daysMap[day];
    if (activeWeeks.length === 5) {
      byDayParts.push(code);
    } else {
      activeWeeks.forEach(week => {
        byDayParts.push(`${week}${code}`);
      });
    }
  });

  const freq = activeWeeks.length === 5 ? 'WEEKLY' : 'MONTHLY';
  const rrule = `RRULE:FREQ=${freq};BYDAY=${byDayParts.join(',')}`;

  // Find the next occurrence to set as DTSTART (Simplified: use April 1st 2026 as start of season)
  const startTime = street.start_time.replace(':', '') + '00';
  const endTime = street.end_time.replace(':', '') + '00';
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Boston Sweeper//robertfrontend//EN',
    'BEGIN:VEVENT',
    `SUMMARY:Street Cleaning: ${street.st_name} (${street.side} Side)`,
    `DESCRIPTION:Street cleaning from ${street.from} to ${street.to}. District: ${street.dist_name}.`,
    `DTSTART;TZID=America/New_York:20260401T${startTime}`,
    `DTEND;TZID=America/New_York:20260401T${endTime}`,
    rrule,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${street.st_name.replace(/\s+/g, '_')}_cleaning.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

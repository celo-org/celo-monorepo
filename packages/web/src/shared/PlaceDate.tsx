import fecha from 'fecha'

export function printDuration(date: Date, endDate: Date | null): string {
  try {
    if (endDate) {
      return `${fecha.format(date, 'MMM D')}-${fecha.format(endDate, 'mediumDate')}`
    }
    return fecha.format(date, 'mediumDate')
  } catch (e) {
    return ''
  }
}

export function parseDate(date: string | undefined) {
  if (date) {
    return fecha.parse(date, 'YYYY-MM-DD')
  }
  return null
}

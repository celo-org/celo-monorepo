// Import a static mapping of timezone names to metadata.
const timezones: { [name: string]: Timezone } = require('./timezones.json')

// Used in testing to override the timezone which is returned by the system.
let _testTimezoneOverride: string | undefined

export function _testSetTimezoneOverride(zone: string | undefined) {
  _testTimezoneOverride = zone
}

export interface Coordinates {
  lattitude: number
  longitude: number
}

// Timezone information from the IANA timezone database.
// https://data.iana.org/time-zones/tzdb/zone1970.tab
export interface Timezone {
  name: string
  countryCodes?: string[]
  coordinates?: Coordinates
  comments?: string
}

function resolveTimezoneName(): string {
  return _testTimezoneOverride ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

// Return the current timezone.
export function timezone(): Timezone {
  const name = resolveTimezoneName()
  return timezones[name] ?? { name }
}

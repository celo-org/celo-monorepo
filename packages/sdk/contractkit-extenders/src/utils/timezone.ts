// Import a static mapping of timezone names to metadata.
const timezones: { [name: string]: Timezone } = require('./timezones.json')

// Used in testing to override the timezone which is returned by the system.
let _testTimezoneOverride: string | undefined

export function _testSetTimezoneOverride(zone: string | undefined) {
  _testTimezoneOverride = zone
}

export interface Coordinates {
  latitude: number
  longitude: number
}

// Timezone information from the IANA timezone database.
// https://data.iana.org/time-zones/tzdb/zone.tab
export interface Timezone {
  name: string
  countryCodes?: string[]
  coordinates?: Coordinates
  comments?: string
}

function resolveTimezoneName(): string | undefined {
  try {
    return _testTimezoneOverride ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Intl is not defined in some environments, such as react-native.
    return undefined
  }
}

// Extract a normalized timezone name from the given string. (e.g. remove trailing slashes)
function normalize(tz: string): string | undefined {
  return tz.match(/((?:[a-zA-Z_]+)(?:\/[a-zA-Z_]+)*)/)?.[1] ?? undefined
}

// Return the current timezone, or the timezone with the given name.
// If the current timezone cannot be resolved, undefined is returned.
export function timezone(tz?: string): Timezone | undefined {
  const name = tz ?? resolveTimezoneName()
  if (name === undefined) {
    return undefined
  }
  const key = normalize(name)
  if (key === undefined) {
    return undefined
  }
  return timezones[key]
}

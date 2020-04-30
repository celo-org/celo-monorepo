// Restricted countries (for geofence)
enum Countries {
  Canada = 'ca',
  China = 'cn',
  Cuba = 'cu',
  NorthKorea = 'kp',
  Iran = 'ir',
  Syria = 'sy',
  Sudan = 'sd',
  UnitedStates = 'us',
}

const RESTRICTED_JURISDICTIONS = new Set(Object.keys(Countries).map((name) => Countries[name]))

export function isJurisdictionRestricted(country: string) {
  if (!country) {
    return true
  }
  return RESTRICTED_JURISDICTIONS.has(country)
}

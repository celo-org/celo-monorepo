const PIN_TIMEOUT = 300000 // 5 minutes

let pinCache: string | null = null

interface PasswordCache {
  [account: string]: {
    timestamp: number | null
    password: string | null
  }
}

export function setPinCache(pin: string) {
  pinCache = pin
}

export function getPinCache() {
  return pinCache
}

const passwordCache: PasswordCache = {}

export function getCachedPassword(account: string) {
  // TODO(Rossy) use a monotonic clock here
  if (
    passwordCache.password &&
    passwordCache.timestamp &&
    Date.now() - passwordCache.timestamp < PIN_TIMEOUT
  ) {
    return passwordCache.password
  }
  return null
}

export function setCachedPassword(password: string | null, account: string) {
  passwordCache.timestamp = Date.now()
  passwordCache.password = password
}

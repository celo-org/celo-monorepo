const PIN_TIMEOUT = 300000 // 5 minutes

interface PasswordCache {
  [account: string]: {
    timestamp: number | null
    password: string | null
  }
}
let pinCache: string | null = null
let cachedPepper: string | null = null

const cachedPasswordHashes: {
  [account: string]: string
} = {}

const passwordCache: PasswordCache = {}

export function getCachedPin() {
  return pinCache
}

export function setCachedPin(pin: string | null) {
  pinCache = pin
}

export function getCachedPepper() {
  return cachedPepper
}

export function setCachedPepper(pepper: string | null) {
  cachedPepper = pepper
}

export function getCachedPasswordHash(account: string) {
  return cachedPasswordHashes[account]
}

export function setCachedPasswordHash(account: string, passwordHash: string) {
  cachedPasswordHashes[account] = passwordHash
}

export function getCachedPassword(account: string) {
  // TODO(Rossy) use a monotonic clock here
  if (
    passwordCache[account] &&
    passwordCache[account].password &&
    passwordCache[account].timestamp
  ) {
    if (Date.now() - (passwordCache[account].timestamp as number) < PIN_TIMEOUT) {
      return passwordCache[account].password
    }
  }
  return null
}

export function setCachedPassword(account: string, password: string | null) {
  if (!passwordCache[account]) {
    passwordCache[account] = { timestamp: null, password: null }
  }
  passwordCache[account].timestamp = Date.now()
  passwordCache[account].password = password
}

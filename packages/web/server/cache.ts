import NodeCache from 'node-cache'

const MINUTE = 60

const TTL = MINUTE * 5

const myCache = new NodeCache({ stdTTL: TTL, checkperiod: 120 })

export async function cache<T>(
  key: string,
  func: (param?: any) => Promise<T>,
  options?: { minutes?: number; args?: any }
): Promise<T> {
  const cachedResult = myCache.get<T>(key)
  if (cachedResult) {
    return cachedResult
  } else {
    const freshResult = options ? await func(options.args) : await func()
    const ttl = options && options.minutes ? options.minutes * MINUTE : TTL
    myCache.set(key, freshResult, ttl)
    return freshResult as T
  }
}

export default cache

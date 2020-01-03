import NodeCache from 'node-cache'

const MINUTE = 60

const TTL = MINUTE * 5

const myCache = new NodeCache({ stdTTL: TTL, checkperiod: 120 })

export async function cache<T>(key: string, func: (param?: any) => Promise<T>, args?: any) {
  const cachedResult = myCache.get<T>(key)
  if (cachedResult) {
    return cachedResult
  } else {
    const freshResult = await func(args)
    myCache.set(key, freshResult)
    return freshResult as T
  }
}

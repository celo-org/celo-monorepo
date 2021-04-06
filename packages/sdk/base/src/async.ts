import { Logger } from './logger'

const TAG = 'utils/src/async'

/** Sleep for a number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

type InFunction<T extends any[], U> = (...params: T) => Promise<U>

// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
export const retryAsync = async <T extends any[], U>(
  inFunction: InFunction<T, U>,
  tries: number,
  params: T,
  delay = 100,
  logger: Logger | null = null
) => {
  let saveError
  for (let i = 0; i < tries; i++) {
    try {
      // it awaits otherwise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      await sleep(delay)
      saveError = error
      if (logger) {
        logger(`${TAG}/@retryAsync, Failed to execute function on try #${i}:`, error)
      }
    }
  }

  throw saveError
}

// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
export const retryAsyncWithBackOff = async <T extends any[], U>(
  inFunction: InFunction<T, U>,
  tries: number,
  params: T,
  delay = 100,
  factor = 1.5,
  logger: Logger | null = null
) => {
  let saveError
  for (let i = 0; i < tries; i++) {
    try {
      // it awaits otherwise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      await sleep(Math.pow(factor, i) * delay)
      saveError = error
      if (logger) {
        logger(`${TAG}/@retryAsync, Failed to execute function on try #${i}`, error)
      }
    }
  }

  throw saveError
}

// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
// throws automatically on specified errors
export const selectiveRetryAsyncWithBackOff = async <T extends any[], U>(
  inFunction: InFunction<T, U>,
  tries: number,
  dontRetry: string[],
  params: T,
  delay = 100,
  factor = 1.5,
  logger: Logger | null = null
) => {
  let saveError
  for (let i = 0; i < tries; i++) {
    try {
      // it awaits otherwise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      if (dontRetry.some((msg) => (error as Error).message.includes(msg))) {
        throw error
      }
      saveError = error
      if (logger) {
        logger(`${TAG}/@retryAsync, Failed to execute function on try #${i}`, error)
      }
    }
    if (i < tries - 1) {
      await sleep(Math.pow(factor, i) * delay)
    }
  }

  throw saveError
}

// Retries an async function when it raises an exeption
// Terminates any ongoing request when the timeout is reached
// if all the tries fail it raises the last thrown exeption
export const retryAsyncWithBackOffAndTimeout = async <T extends any[], U>(
  inFunction: InFunction<T, U>,
  tries: number,
  params: T,
  delayMs = 100,
  factor = 1.5,
  timeoutMs = 2000,
  logger: Logger | null = null
) => {
  return timeout(
    retryAsyncWithBackOff,
    [inFunction, tries, params, delayMs, factor, logger],
    timeoutMs,
    new Error(`Timed out after ${timeoutMs}ms`),
    `${TAG}/@retryAsyncWithBackOffAndTimeout, Timed out after ${timeoutMs}ms`,
    logger
  )
}

/**
 * Map an async function over a list xs with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param xs list of value
 * @param mapFn mapping function
 */
export async function concurrentMap<A, B>(
  concurrency: number,
  xs: A[],
  mapFn: (val: A, idx: number) => Promise<B>
): Promise<B[]> {
  let res: B[] = []
  for (let i = 0; i < xs.length; i += concurrency) {
    const remaining = xs.length - i
    const sliceSize = Math.min(remaining, concurrency)
    const slice = xs.slice(i, i + sliceSize)
    res = res.concat(await Promise.all(slice.map((elem, index) => mapFn(elem, i + index))))
  }
  return res
}

/**
 * Map an async function over the values in Object x with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param x associative array of values
 * @param mapFn mapping function
 */
export async function concurrentValuesMap<IN extends any, OUT extends any>(
  concurrency: number,
  x: Record<string, IN>,
  mapFn: (val: IN, key: string) => Promise<OUT>
): Promise<Record<string, OUT>> {
  const xk = Object.keys(x)
  const xv: IN[] = []
  xk.forEach((k) => xv.push(x[k]))
  const res = await concurrentMap(concurrency, xv, (val: IN, idx: number) => mapFn(val, xk[idx]))
  return res.reduce((output: Record<string, OUT>, value: OUT, index: number) => {
    output[xk[index]] = value
    return output
  }, {})
}

/**
 * Wraps an async function in a timeout before calling it.
 *
 * @param inFunction The async function to call
 * @param params The parameters of the async function
 * @param timeoutMs The timeout in milliseconds
 * @param timeoutError The value to which the returned Promise should reject to
 */
export const timeout = <T extends any[], U>(
  inFunction: InFunction<T, U>,
  params: T,
  timeoutMs: number,
  timeoutError: any,
  timeoutLogMsg: string | null = null,
  logger: Logger | null = null
) => {
  let timer: any
  return Promise.race([
    inFunction(...params),
    new Promise<U>((_resolve, reject) => {
      timer = setTimeout(() => {
        if (logger) {
          logger(timeoutLogMsg || `${TAG}/@timeout Timed out after ${timeoutMs}ms`)
        }
        reject(timeoutError)
      }, timeoutMs)
    }),
  ]).finally(() => {
    clearTimeout(timer)
  })
}

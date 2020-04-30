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
  delay = 100
) => {
  let saveError
  for (let i = 0; i < tries; i++) {
    try {
      // it awaits otherwise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      await sleep(delay)
      saveError = error
      console.info(`${TAG}/@retryAsync, Failed to execute function on try #${i}`, error)
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
  factor = 1.5
) => {
  let saveError
  for (let i = 0; i < tries; i++) {
    try {
      // it awaits otherwise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      await sleep(Math.pow(factor, i) * delay)
      saveError = error
      console.info(`${TAG}/@retryAsync, Failed to execute function on try #${i}`, error)
    }
  }

  throw saveError
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

const TAG = 'utils/src/async'

/** Sleep for a number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

type InFunction = (...params: any) => Promise<any>

// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
export const retryAsync = async (
  inFunction: InFunction,
  tries: number,
  params: any,
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
      console.info(`${TAG}/@reTryAsync, Failed to execute function on try #${i}`, error)
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
    res = res.concat(await Promise.all(slice.map(mapFn)))
  }
  return res
}

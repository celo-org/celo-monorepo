export function zip<A, B, C>(fn: (a: A, b: B) => C, as: A[], bs: B[]) {
  const len = Math.min(as.length, bs.length)
  const res: C[] = []

  for (let i = 0; i < len; i++) {
    res.push(fn(as[i], bs[i]))
  }
  return res
}

export function zip3<A, B, C>(as: A[], bs: B[], cs: C[]) {
  const len = Math.min(as.length, bs.length, cs.length)
  const res: Array<[A, B, C]> = []

  for (let i = 0; i < len; i++) {
    res.push([as[i], bs[i], cs[i]])
  }
  return res
}

// https://stackoverflow.com/questions/43118692/typescript-filter-out-nulls-from-an-array
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

// https://stackoverflow.com/questions/33355528/filtering-an-array-with-a-function-that-returns-a-promise
export function mapAsync<T, U>(
  array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}
 
export async function filterAsync<T>(
  array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>
): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((_, index) => filterMap[index]);
}

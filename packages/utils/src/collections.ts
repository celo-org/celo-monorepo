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

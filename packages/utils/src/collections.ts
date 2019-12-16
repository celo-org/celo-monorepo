import BigNumber from 'bignumber.js'

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

export function intersection<T>(arrays: T[][]): T[] {
  if (arrays.length === 0) {
    return []
  }

  const sets = arrays.map((array) => new Set(array))
  const res: T[] = []

  for (const elem of arrays[0]) {
    if (sets.every((set) => set.has(elem))) {
      res.push(elem)
    }
  }

  return res
}

// List of sorted from greater to smaller

export interface Item {
  address: string
  value: BigNumber
}

const nilAddress = '0x0000000000000000000000000000000000000000'

function insert(sortedList: Item[], change: Item) {
  const oldIdx = sortedList.findIndex((a) => a.address === change.address)
  sortedList.splice(oldIdx, 1)
  const newIdx = sortedList.findIndex((a) => a.value.lt(change.value))
  if (newIdx === -1) {
    sortedList.push(change)
  } else {
    sortedList.splice(newIdx, 0, change)
  }
}

export function linkedListChanges(sortedList: Item[], changeList: Item[]) {
  const lesser: string[] = []
  const greater: string[] = []
  for (const it of changeList) {
    insert(sortedList, it)
    const idx = sortedList.findIndex((a) => a.address === it.address)
    if (idx === 0) {
      greater.push(nilAddress)
    } else {
      greater.push(sortedList[idx - 1].address)
    }
    if (idx === sortedList.length - 1) {
      lesser.push(nilAddress)
    } else {
      lesser.push(sortedList[idx + 1].address)
    }
  }
  return { lesser, greater }
}

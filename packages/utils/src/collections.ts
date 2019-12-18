import BigNumber from 'bignumber.js'
import { NULL_ADDRESS } from './address'

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

// List of address value pairs sorted from greater to smaller

export interface Item {
  address: string
  value: BigNumber
}

function upsert(sortedList: Item[], change: Item) {
  const oldIdx = sortedList.findIndex((a) => a.address === change.address)
  if (oldIdx == -1) throw new Error('')
  sortedList.splice(oldIdx, 1)
  const newIdx = sortedList.findIndex((a) => a.value.lt(change.value))
  if (newIdx === -1) {
    sortedList.push(change)
  } else {
    sortedList.splice(newIdx, 0, change)
  }
}

// Warning: sortedList is modified
function _linkedListChange(sortedList: Item[], change: Item) {
  let lesser: string
  let greater: string
  upsert(sortedList, change)
  const idx = sortedList.findIndex((a) => a.address === change.address)
  if (idx === 0) {
    greater = NULL_ADDRESS
  } else {
    greater = sortedList[idx - 1].address
  }
  if (idx === sortedList.length - 1) {
    lesser = NULL_ADDRESS
  } else {
    lesser = sortedList[idx + 1].address
  }
  return { lesser, greater }
}

export function linkedListChange(sortedList: Item[], change: Item) {
  const list = sortedList.concat()
  const { lesser, greater } = _linkedListChange(list, change)
  return { lesser, greater, list }
}

export function linkedListChanges(sortedList: Item[], changeList: Item[]) {
  const list = sortedList.concat()
  const lessers: string[] = []
  const greaters: string[] = []
  for (const it of changeList) {
    const { lesser, greater } = _linkedListChange(sortedList, it)
    lessers.push(lesser)
    greaters.push(greater)
  }
  return { lessers, greaters, list }
}

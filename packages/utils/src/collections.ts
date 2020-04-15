import BigNumber from 'bignumber.js'
import { eqAddress, NULL_ADDRESS } from './address'

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

export interface AddressListItem {
  address: string
  value: BigNumber
}

function upsert(sortedList: AddressListItem[], change: AddressListItem) {
  const oldIdx = sortedList.findIndex((a) => eqAddress(a.address, change.address))
  if (oldIdx === -1) {
    throw new Error('')
  }
  sortedList.splice(oldIdx, 1)
  const newIdx = sortedList.findIndex((a) => a.value.lt(change.value))
  if (newIdx === -1) {
    sortedList.push(change)
    return sortedList.length - 1
  } else {
    sortedList.splice(newIdx, 0, change)
    return newIdx
  }
}

// Warning: sortedList is modified
function _linkedListChange(sortedList: AddressListItem[], change: AddressListItem) {
  const idx = upsert(sortedList, change)
  const greater = idx === 0 ? NULL_ADDRESS : sortedList[idx - 1].address
  const lesser = idx === sortedList.length - 1 ? NULL_ADDRESS : sortedList[idx + 1].address
  return { lesser, greater }
}

export function linkedListChange(
  sortedList: AddressListItem[],
  change: AddressListItem
): { lesser: string; greater: string; list: AddressListItem[] } {
  const list = sortedList.concat()
  const { lesser, greater } = _linkedListChange(list, change)
  return { lesser, greater, list }
}

export function linkedListChanges(
  sortedList: AddressListItem[],
  changeList: AddressListItem[]
): { lessers: string[]; greaters: string[]; list: AddressListItem[] } {
  const listClone = [...sortedList]
  const lessers: string[] = []
  const greaters: string[] = []
  for (const it of changeList) {
    const { lesser, greater } = _linkedListChange(listClone, it)
    lessers.push(lesser)
    greaters.push(greater)
  }
  return { lessers, greaters, list: listClone }
}

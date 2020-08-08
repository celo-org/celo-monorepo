import * as base from '@celo/base/lib/collections'
import BigNumber from 'bignumber.js'

// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export { intersection, notEmpty, zip, zip3 } from '@celo/base/lib/collections'
export type AddressListItem = base.AddressListItem<BigNumber>

// BigNumber comparator
const bnc: base.Comparator<BigNumber> = (a: BigNumber, b: BigNumber) => a.lt(b)

export function linkedListChange(
  sortedList: AddressListItem[],
  change: AddressListItem
): { lesser: string; greater: string; list: AddressListItem[] } {
  return base.linkedListChange(sortedList, change, bnc)
}

export function linkedListChanges(
  sortedList: AddressListItem[],
  changeList: AddressListItem[]
): { lessers: string[]; greaters: string[]; list: AddressListItem[] } {
  return base.linkedListChanges(sortedList, changeList, bnc)
}

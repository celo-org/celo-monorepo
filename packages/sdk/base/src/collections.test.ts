import BigNumber from 'bignumber.js'
import { NULL_ADDRESS } from './address'
import {
  AddressListItem as ALI,
  Comparator,
  linkedListChange,
  linkedListChanges,
} from './collections'

type AddressListItem = ALI<BigNumber>

// BigNumber comparator
const bnc: Comparator<BigNumber> = (a: BigNumber, b: BigNumber) => a.lt(b)

describe('Collection', () => {
  describe('linkedListChange', () => {
    it('singleton list', () => {
      const lst: AddressListItem[] = [{ address: 'address 1', value: new BigNumber(2) }]
      const change: AddressListItem = { address: 'address 1', value: new BigNumber(20) }
      const expected = {
        lesser: NULL_ADDRESS,
        greater: NULL_ADDRESS,
      }
      expect(linkedListChange(lst, change, bnc)).toMatchObject(expected)
    })
    it('becoming greatest', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
      ]
      const change: AddressListItem = { address: 'address 3', value: new BigNumber(20) }
      const expected = {
        lesser: 'address 1',
        greater: NULL_ADDRESS,
      }
      expect(linkedListChange(lst, change, bnc)).toMatchObject(expected)
    })
    it('becoming smallest', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
        { address: 'address 5', value: new BigNumber(2) },
      ]
      const change: AddressListItem = { address: 'address 3', value: new BigNumber(1) }
      const expected = {
        lesser: NULL_ADDRESS,
        greater: 'address 5',
      }
      expect(linkedListChange(lst, change, bnc)).toMatchObject(expected)
    })
    it('change order', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const change: AddressListItem = { address: 'address 3', value: new BigNumber(2) }
      const expected = {
        greater: 'address 6',
        lesser: 'address 7',
      }
      expect(linkedListChange(lst, change, bnc)).toMatchObject(expected)
    })
  })
  describe('linkedListChanges', () => {
    it('singleton list', () => {
      const lst: AddressListItem[] = [{ address: 'address 1', value: new BigNumber(2) }]
      const changes: AddressListItem[] = [{ address: 'address 1', value: new BigNumber(20) }]
      const expected = {
        lessers: ['0x0000000000000000000000000000000000000000'],
        greaters: ['0x0000000000000000000000000000000000000000'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('becoming greatest', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
      ]
      const changes: AddressListItem[] = [{ address: 'address 3', value: new BigNumber(20) }]
      const expected = {
        lessers: ['address 1'],
        greaters: ['0x0000000000000000000000000000000000000000'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('becoming smallest', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
        { address: 'address 5', value: new BigNumber(2) },
      ]
      const changes: AddressListItem[] = [{ address: 'address 3', value: new BigNumber(1) }]
      const expected = {
        lessers: ['0x0000000000000000000000000000000000000000'],
        greaters: ['address 5'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('change order', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: AddressListItem[] = [{ address: 'address 3', value: new BigNumber(2) }]
      const expected = {
        greaters: ['address 6'],
        lessers: ['address 7'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('change order, become smallest', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: AddressListItem[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(0) },
      ]
      const expected = {
        greaters: ['address 6', 'address 7'],
        lessers: ['address 7', NULL_ADDRESS],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('change order, become largest', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: AddressListItem[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(8) },
      ]
      const expected = {
        greaters: ['address 6', NULL_ADDRESS],
        lessers: ['address 7', 'address 1'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('change order, then replace with another', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: AddressListItem[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(2) },
      ]
      const expected = {
        greaters: ['address 6', 'address 3'],
        lessers: ['address 7', 'address 7'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
    it('change order, then replace with another again', () => {
      const lst: AddressListItem[] = [
        { address: 'address 1', value: new BigNumber(17) },
        { address: 'address 2', value: new BigNumber(15) },
        { address: 'address 3', value: new BigNumber(14) },
        { address: 'address 4', value: new BigNumber(13) },
        { address: 'address 5', value: new BigNumber(12) },
        { address: 'address 6', value: new BigNumber(11) },
        { address: 'address 7', value: new BigNumber(0) },
      ]
      const changes: AddressListItem[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(1) },
        { address: 'address 4', value: new BigNumber(3) },
      ]
      const expected = {
        greaters: ['address 6', 'address 3', 'address 6'],
        lessers: ['address 7', 'address 7', 'address 3'],
      }
      expect(linkedListChanges(lst, changes, bnc)).toMatchObject(expected)
    })
  })
})

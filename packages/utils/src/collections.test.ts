import BigNumber from 'bignumber.js'
import { Item, linkedListChanges, linkedListChange } from './collections'
import { NULL_ADDRESS } from './address'

describe('Collection', () => {
  describe('linkedListChange', () => {
    it('singleton list', () => {
      const lst: Item[] = [{ address: 'address 1', value: new BigNumber(2) }]
      const change: Item = { address: 'address 1', value: new BigNumber(20) }
      const expected = {
        lesser: NULL_ADDRESS,
        greater: NULL_ADDRESS,
      }
      expect(linkedListChange(lst, change)).toMatchObject(expected)
    })
    it('becoming greatest', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
      ]
      const change: Item = { address: 'address 3', value: new BigNumber(20) }
      const expected = {
        lesser: 'address 1',
        greater: NULL_ADDRESS,
      }
      expect(linkedListChange(lst, change)).toMatchObject(expected)
    })
    it('becoming smallest', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
        { address: 'address 5', value: new BigNumber(2) },
      ]
      const change: Item = { address: 'address 3', value: new BigNumber(1) }
      const expected = {
        lesser: NULL_ADDRESS,
        greater: 'address 5',
      }
      expect(linkedListChange(lst, change)).toMatchObject(expected)
    })
    it('change order', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const change: Item = { address: 'address 3', value: new BigNumber(2) }
      const expected = {
        greater: 'address 6',
        lesser: 'address 7',
      }
      expect(linkedListChange(lst, change)).toMatchObject(expected)
    })
  })
  describe('linkedListChanges', () => {
    it('singleton list', () => {
      const lst: Item[] = [{ address: 'address 1', value: new BigNumber(2) }]
      const changes: Item[] = [{ address: 'address 1', value: new BigNumber(20) }]
      const expected = {
        lessers: ['0x0000000000000000000000000000000000000000'],
        greaters: ['0x0000000000000000000000000000000000000000'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('becoming greatest', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
      ]
      const changes: Item[] = [{ address: 'address 3', value: new BigNumber(20) }]
      const expected = {
        lessers: ['address 1'],
        greaters: ['0x0000000000000000000000000000000000000000'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('becoming smallest', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(4) },
        { address: 'address 2', value: new BigNumber(4) },
        { address: 'address 3', value: new BigNumber(3) },
        { address: 'address 4', value: new BigNumber(2) },
        { address: 'address 5', value: new BigNumber(2) },
      ]
      const changes: Item[] = [{ address: 'address 3', value: new BigNumber(1) }]
      const expected = {
        lessers: ['0x0000000000000000000000000000000000000000'],
        greaters: ['address 5'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('change order', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: Item[] = [{ address: 'address 3', value: new BigNumber(2) }]
      const expected = {
        greaters: ['address 6'],
        lessers: ['address 7'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('change order, become smallest', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: Item[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(0) },
      ]
      const expected = {
        greaters: ['address 6', 'address 7'],
        lessers: ['address 7', NULL_ADDRESS],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('change order, become largest', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: Item[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(8) },
      ]
      const expected = {
        greaters: ['address 6', NULL_ADDRESS],
        lessers: ['address 7', 'address 1'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('change order, then replace with another', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(7) },
        { address: 'address 2', value: new BigNumber(5) },
        { address: 'address 3', value: new BigNumber(4) },
        { address: 'address 4', value: new BigNumber(3) },
        { address: 'address 5', value: new BigNumber(2) },
        { address: 'address 6', value: new BigNumber(2) },
        { address: 'address 7', value: new BigNumber(1) },
      ]
      const changes: Item[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(2) },
      ]
      const expected = {
        greaters: ['address 6', 'address 3'],
        lessers: ['address 7', 'address 7'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
    it('change order, then replace with another again', () => {
      const lst: Item[] = [
        { address: 'address 1', value: new BigNumber(17) },
        { address: 'address 2', value: new BigNumber(15) },
        { address: 'address 3', value: new BigNumber(14) },
        { address: 'address 4', value: new BigNumber(13) },
        { address: 'address 5', value: new BigNumber(12) },
        { address: 'address 6', value: new BigNumber(11) },
        { address: 'address 7', value: new BigNumber(0) },
      ]
      const changes: Item[] = [
        { address: 'address 3', value: new BigNumber(2) },
        { address: 'address 2', value: new BigNumber(1) },
        { address: 'address 4', value: new BigNumber(3) },
      ]
      const expected = {
        greaters: ['address 6', 'address 3', 'address 6'],
        lessers: ['address 7', 'address 7', 'address 3'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
  })
})

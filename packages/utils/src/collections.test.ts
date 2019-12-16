import BigNumber from 'bignumber.js'
import { Item, linkedListChanges } from './collections'

describe('Collection', () => {
  describe('linkedListChanges', () => {
    it('singleton list', () => {
      const lst: Item[] = [{ address: 'address 1', value: new BigNumber(2) }]
      const changes: Item[] = [{ address: 'address 1', value: new BigNumber(20) }]
      const expected = {
        lesser: ['0x0000000000000000000000000000000000000000'],
        greater: ['0x0000000000000000000000000000000000000000'],
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
        lesser: ['address 1'],
        greater: ['0x0000000000000000000000000000000000000000'],
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
        lesser: ['0x0000000000000000000000000000000000000000'],
        greater: ['address 5'],
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
        greater: ['address 6'],
        lesser: ['address 7'],
      }
      expect(linkedListChanges(lst, changes)).toMatchObject(expected)
    })
  })
})

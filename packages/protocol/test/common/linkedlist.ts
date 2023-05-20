import { assertRevertWithReason } from '@celo/protocol/lib/test-utils'
import { LinkedListTestContract, LinkedListTestInstance } from 'types'

const LinkedListTest: LinkedListTestContract = artifacts.require('LinkedListTest')

contract('LinkedListTest', () => {
  let linkedListTest: LinkedListTestInstance

  beforeEach(async () => {
    linkedListTest = await LinkedListTest.new()
  })

  describe('#insert()', () => {
    const NULL_KEY = '0x00'
    const firstKey = '0x01'
    const keys = ['0x01', '0x02', '0x03']
    const middleKey = '0x02'
    const lastKey = '0x03'
    const addedKey = '0x04'

    describe('when inserting to empty list', () => {
      it('should revert if previous is equal to key', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, addedKey, NULL_KEY),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if next is equal to key', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, NULL_KEY, addedKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })
    })

    describe('when inserting to singleton', () => {
      beforeEach(async () => {
        await linkedListTest.insert(firstKey, NULL_KEY, NULL_KEY)
      })

      it('should revert if next is equal to key', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, firstKey, addedKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if previous is equal to key', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, addedKey, firstKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })
    })

    describe('when inserting to a list with more items', () => {
      beforeEach(async () => {
        await linkedListTest.insert(firstKey, NULL_KEY, NULL_KEY)
        for (let i = 1; i < keys.length; i++) {
          await linkedListTest.insert(keys[i], NULL_KEY, keys[i - 1])
        }
      })

      it('should revert if next is equal to key (beginning)', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, firstKey, addedKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if previous is equal to key (beginning)', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, addedKey, firstKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if next is equal to key (end)', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, lastKey, addedKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if previous is equal to key (end)', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, addedKey, lastKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if next is equal to key (middle)', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, middleKey, addedKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if previous is equal to key (middle)', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, addedKey, middleKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })

      it('should revert if next and previous equal to key', async () => {
        await assertRevertWithReason(
          linkedListTest.insert(addedKey, addedKey, addedKey),
          'Key cannot be the same as previousKey or nextKey'
        )
      })
    })
  })

  describe('#remove()', () => {
    const NULL_KEY = '0x00' + '00'.repeat(31)
    const firstKey = '0x01' + '00'.repeat(31)
    const middleKey = '0x02' + '00'.repeat(31)
    const lastKey = '0x03' + '00'.repeat(31)
    const keys = [firstKey, middleKey, lastKey]

    describe('removing from an empty list', () => {
      it('should revert', async () => {
        await assertRevertWithReason(linkedListTest.remove(firstKey), 'key not in list')
      })
    })

    describe('when removing from a list with more items', () => {
      beforeEach(async () => {
        await linkedListTest.insert(firstKey, NULL_KEY, NULL_KEY)
        for (let i = 1; i < keys.length; i++) {
          await linkedListTest.insert(keys[i], keys[i - 1], NULL_KEY)
        }
      })

      it('should remove the first element', async () => {
        await linkedListTest.remove(firstKey)
        const exists = await linkedListTest.contains(firstKey)
        assert.isFalse(exists)
      })

      it('should end with the middle element at head', async () => {
        await linkedListTest.remove(firstKey)
        const tail = await linkedListTest.tail()
        assert.equal(tail, middleKey)
      })

      it('should reduce the number of list elements', async () => {
        await linkedListTest.remove(firstKey)
        const numElements = await linkedListTest.getNumElements()
        assert.equal(numElements.toNumber(), 2)
      })

      it('should revert when attempting to remove a removed element', async () => {
        await linkedListTest.remove(firstKey)
        await assertRevertWithReason(linkedListTest.remove(firstKey), 'key not in list')
      })
    })
  })
})

import { assertRevert } from '@celo/protocol/lib/test-utils'
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
        await assertRevert(linkedListTest.insert(addedKey, addedKey, NULL_KEY))
      })

      it('should revert if next is equal to key', async () => {
        await assertRevert(linkedListTest.insert(addedKey, NULL_KEY, addedKey))
      })
    })

    describe('when inserting to singleton', () => {
      beforeEach(async () => {
        await linkedListTest.insert(firstKey, NULL_KEY, NULL_KEY)
      })

      it('should revert if next is equal to key', async () => {
        await assertRevert(linkedListTest.insert(addedKey, firstKey, addedKey))
      })

      it('should revert if previous is equal to key', async () => {
        await assertRevert(linkedListTest.insert(addedKey, addedKey, firstKey))
      })
    })

    describe('when inserting to a list with more items', () => {
      beforeEach(async () => {
        await linkedListTest.insert(firstKey, NULL_KEY, NULL_KEY)
        for (let i = 1; i < keys.length; i++)
          await linkedListTest.insert(keys[i], NULL_KEY, keys[i - 1])
      })

      it('should revert if next is equal to key (beginning)', async () => {
        await assertRevert(linkedListTest.insert(addedKey, firstKey, addedKey))
      })

      it('should revert if previous is equal to key (beginning)', async () => {
        await assertRevert(linkedListTest.insert(addedKey, addedKey, firstKey))
      })

      it('should revert if next is equal to key (end)', async () => {
        await assertRevert(linkedListTest.insert(addedKey, lastKey, addedKey))
      })

      it('should revert if previous is equal to key (end)', async () => {
        await assertRevert(linkedListTest.insert(addedKey, addedKey, lastKey))
      })

      it('should revert if next is equal to key (middle)', async () => {
        await assertRevert(linkedListTest.insert(addedKey, middleKey, addedKey))
      })

      it('should revert if previous is equal to key (middle)', async () => {
        await assertRevert(linkedListTest.insert(addedKey, addedKey, middleKey))
      })

      it('should revert if next and previous equal to key', async () => {
        await assertRevert(linkedListTest.insert(addedKey, addedKey, addedKey))
      })
    })
  })
})

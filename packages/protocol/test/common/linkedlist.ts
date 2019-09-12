import { assertRevert } from '@celo/protocol/lib/test-utils'
// import BigNumber from 'bignumber.js'
import { LinkedListTestContract, LinkedListTestInstance } from 'types'

const LinkedListTest: LinkedListTestContract = artifacts.require('LinkedListTest')

// @ts-ignore
// TODO(mcortesi): Use BN
LinkedListTest.numberFormat = 'BigNumber'

contract('LinkedListTest', () => {
  let linkedListTest: LinkedListTestInstance

  beforeEach(async () => {
    linkedListTest = await LinkedListTest.new()
  })

  describe('#insert()', () => {
    const NULL_KEY = '0x00'
    const first_key = '0x01'
    const keys = ['0x01', '0x02', '0x03']
    const middle_key = '0x02'
    const last_key = '0x03'
    const added_key = '0x04'

    it('should revert if previous is equal to key (empty list)', async () => {
      await assertRevert(linkedListTest.insert(added_key, added_key, NULL_KEY))
    })

    it('should revert if next is equal to key (empty list)', async () => {
      await assertRevert(linkedListTest.insert(added_key, NULL_KEY, added_key))
    })

    describe('singleton', () => {
      beforeEach(async () => {
        await linkedListTest.insert(first_key, NULL_KEY, NULL_KEY)
      })

      it('should revert if next is equal to key (singleton)', async () => {
        await assertRevert(linkedListTest.insert(added_key, first_key, added_key))
      })

      it('should revert if previous is equal to key (singleton)', async () => {
        await assertRevert(linkedListTest.insert(added_key, added_key, first_key))
      })
    })

    describe('list with more items', () => {
      beforeEach(async () => {
        await linkedListTest.insert(first_key, NULL_KEY, NULL_KEY)
        for (let i = 1; i < keys.length; i++)
          await linkedListTest.insert(keys[i], NULL_KEY, keys[i - 1])
      })

      it('should revert if next is equal to key (beginning)', async () => {
        await assertRevert(linkedListTest.insert(added_key, first_key, added_key))
      })

      it('should revert if previous is equal to key (beginning)', async () => {
        await assertRevert(linkedListTest.insert(added_key, added_key, first_key))
      })

      it('should revert if next is equal to key (end)', async () => {
        await assertRevert(linkedListTest.insert(added_key, last_key, added_key))
      })

      it('should revert if previous is equal to key (end)', async () => {
        await assertRevert(linkedListTest.insert(added_key, added_key, last_key))
      })

      it('should revert if next is equal to key (middle)', async () => {
        await assertRevert(linkedListTest.insert(added_key, middle_key, added_key))
      })

      it('should revert if previous is equal to key (middle)', async () => {
        await assertRevert(linkedListTest.insert(added_key, added_key, middle_key))
      })

      it('should revert if next and previous equal to key', async () => {
        await assertRevert(linkedListTest.insert(added_key, added_key, added_key))
      })
    })
  })
})

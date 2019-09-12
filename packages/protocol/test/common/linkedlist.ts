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
    const key = '0x01'
    const NULL_KEY = '0x00'
    it('should add a single element to the list', async () => {
      await linkedListTest.insert(key, NULL_KEY, NULL_KEY)
    })
    it('should revert if previous is equal to key', async () => {
      await assertRevert(linkedListTest.insert(key, key, NULL_KEY))
    })

    it('should revert if next is equal to key', async () => {
      await assertRevert(linkedListTest.insert(key, NULL_KEY, key))
    })
    it('should revert if next and previous equal to key', async () => {
      await assertRevert(linkedListTest.insert(key, key, key))
    })
  })
})

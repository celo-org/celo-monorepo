import { assertLogMatches2, assertRevert, assertSameAddress } from '@celo/protocol/lib/test-utils'
import { FreezableTestInstance } from 'types'

contract('Freezable', (accounts: string[]) => {
  const FreezableTest = artifacts.require('FreezableTest')
  let freezableTest: FreezableTestInstance

  beforeEach(async () => {
    freezableTest = await FreezableTest.new()
    await freezableTest.setFreezer(accounts[0])
  })

  describe('_setFreezer', () => {
    it('should allow owner to change the freezer', async () => {
      // _setFreezer is internal in Freezable, FreezableTest wraps around it with setFreezer
      await freezableTest.setFreezer(accounts[1])
      const freezer = await freezableTest.freezer()
      assertSameAddress(freezer, accounts[1])
    })
  })

  describe('when the contract is not frozen', () => {
    it('should allow freezable functions to be called', async () => {
      const resp = await freezableTest.freezableFunction()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'FunctionCalled',
        args: {},
      })
    })

    it('should allow non-freezable functions to be called', async () => {
      const resp = await freezableTest.nonfreezableFunction()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'FunctionCalled',
        args: {},
      })
    })
  })

  describe('freeze', () => {
    it('should allow freezer to freeze the contract', async () => {
      await freezableTest.freeze()
      const frozen = await freezableTest.frozen()
      assert.isTrue(frozen)
    })

    it('should not allow a non-freezer to freeze the contract', async () => {
      await assertRevert(freezableTest.freeze({ from: accounts[1] }))
    })
  })

  describe('unfreeze', () => {
    beforeEach(async () => {
      await freezableTest.freeze()
    })

    it('should allow freezer to unfreeze the contract', async () => {
      await freezableTest.unfreeze()
      const frozen = await freezableTest.frozen()
      assert.isFalse(frozen)
    })

    it('should not allow a non-freezer to unfreeze the contract', async () => {
      await assertRevert(freezableTest.freeze({ from: accounts[1] }))
    })
  })

  describe('when the contract is frozen', () => {
    beforeEach(async () => {
      await freezableTest.freeze()
    })

    it('should revert a freezable function', async () => {
      await assertRevert(freezableTest.freezableFunction())
    })

    it('should not affect a non-freezable function', async () => {
      const resp = await freezableTest.nonfreezableFunction()
      assert.equal(resp.logs.length, 1)
      const log = resp.logs[0]
      assertLogMatches2(log, {
        event: 'FunctionCalled',
        args: {},
      })
    })
  })
})

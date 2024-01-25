import { assertTransactionRevertWithReason } from '@celo/protocol/lib/test-utils'
import { FeeCurrencyWhitelistContract, FeeCurrencyWhitelistInstance } from 'types'

const FeeCurrencyWhitelist: FeeCurrencyWhitelistContract = artifacts.require('FeeCurrencyWhitelist')

contract('FeeCurrencyWhitelist', (accounts: string[]) => {
  let feeCurrencyWhitelist: FeeCurrencyWhitelistInstance

  const aTokenAddress = '0x000000000000000000000000000000000000ce10'

  const nonOwner = accounts[1]

  beforeEach(async () => {
    feeCurrencyWhitelist = await FeeCurrencyWhitelist.new(true)
    await feeCurrencyWhitelist.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await feeCurrencyWhitelist.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertTransactionRevertWithReason(
        feeCurrencyWhitelist.initialize(),
        'contract already initialized'
      )
    })
  })

  describe('#addToken()', () => {
    it('should allow the owner to add a token', async () => {
      await feeCurrencyWhitelist.addToken(aTokenAddress)
      const tokens = await feeCurrencyWhitelist.getWhitelist()
      assert.sameMembers(tokens, [aTokenAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertTransactionRevertWithReason(
        feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }),
        'Ownable: caller is not the owner'
      )
    })
  })

  describe('Removing', () => {
    beforeEach(async () => {
      await feeCurrencyWhitelist.addToken(aTokenAddress)
      await feeCurrencyWhitelist.addToken(accounts[0])
      await feeCurrencyWhitelist.addToken(accounts[1])
    })

    describe('#removeToken()', () => {
      it('Removes from a big list', async () => {
        await feeCurrencyWhitelist.removeToken(accounts[0], 1)
        assert.sameMembers(await feeCurrencyWhitelist.getWhitelist(), [aTokenAddress, accounts[1]])
      })

      it("Doesn't remove if the index is wrong", async () => {
        await assertTransactionRevertWithReason(
          feeCurrencyWhitelist.removeToken(accounts[0], 0),
          'Index does not match.'
        )
      })

      it('should not allow a non-owner to remove Mento token', async () => {
        await assertTransactionRevertWithReason(
          feeCurrencyWhitelist.removeToken(accounts[0], 0, { from: nonOwner }),
          'Ownable: caller is not the owner.'
        )
      })
    })
  })
})
import { assertRevert } from '@celo/protocol/lib/test-utils'
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
      await assertRevert(feeCurrencyWhitelist.initialize())
    })
  })

  describe('#addToken()', () => {
    it('should allow the owner to add a token', async () => {
      await feeCurrencyWhitelist.addToken(aTokenAddress)
      const tokens = await feeCurrencyWhitelist.getWhitelist()
      assert.sameMembers(tokens, [aTokenAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
    })
  })

  describe('#addNonMentoToken()', () => {
    it('should allow the owner to add a token', async () => {
      await feeCurrencyWhitelist.addNonMentoToken(aTokenAddress)
      const nonMentoTokens = await feeCurrencyWhitelist.getWhitelist()
      assert.sameMembers(nonMentoTokens, [aTokenAddress])

      const mentoTokens = await feeCurrencyWhitelist.getWhitelistNonMento()
      assert.sameMembers(mentoTokens, [aTokenAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(feeCurrencyWhitelist.addNonMentoToken(aTokenAddress, { from: nonOwner }))
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
        await assertRevert(feeCurrencyWhitelist.removeToken(accounts[0], 0))
      })
    })

    describe('#removeNonMentoToken()', () => {
      beforeEach(async () => {
        await feeCurrencyWhitelist.addNonMentoToken(accounts[2])
        await feeCurrencyWhitelist.addNonMentoToken(accounts[3])
        await feeCurrencyWhitelist.addNonMentoToken(accounts[4])
      })

      it('Removes from a big list', async () => {
        await feeCurrencyWhitelist.removeNonMentoToken(accounts[3], 4, 1)
        assert.sameMembers(await feeCurrencyWhitelist.getWhitelist(), [
          aTokenAddress,
          accounts[0],
          accounts[1],
          accounts[2],
          accounts[4],
        ])
        assert.sameMembers(await feeCurrencyWhitelist.getWhitelistNonMento(), [
          accounts[2],
          accounts[4],
        ])
      })

      it("Doesn't remove if the index is wrong", async () => {
        assertRevert(feeCurrencyWhitelist.removeNonMentoToken(accounts[0], 1, 1))
      })
    })
  })
})

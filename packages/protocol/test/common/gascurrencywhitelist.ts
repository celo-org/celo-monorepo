import { assertRevert } from '@celo/protocol/lib/test-utils'
import { GasCurrencyWhitelistContract, GasCurrencyWhitelistInstance } from 'types'

const GasCurrencyWhitelist: GasCurrencyWhitelistContract = artifacts.require('GasCurrencyWhitelist')

contract('GasCurrencyWhitelist', (accounts: string[]) => {
  let gasCurrencyWhitelist: GasCurrencyWhitelistInstance

  const aTokenAddress = '0x000000000000000000000000000000000000ce10'

  const nonOwner = accounts[1]

  beforeEach(async () => {
    gasCurrencyWhitelist = await GasCurrencyWhitelist.new()
    await gasCurrencyWhitelist.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await gasCurrencyWhitelist.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(gasCurrencyWhitelist.initialize())
    })
  })

  describe('#addToken()', () => {
    it('should allow the owner to add a token', async () => {
      await gasCurrencyWhitelist.addToken(aTokenAddress)
      const tokens = await gasCurrencyWhitelist.getWhitelist()
      assert.sameMembers(tokens, [aTokenAddress])
    })

    it('should not allow a non-owner to add a token', async () => {
      await assertRevert(gasCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
    })
  })
})

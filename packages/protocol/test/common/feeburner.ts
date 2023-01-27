import { assertRevert } from '@celo/protocol/lib/test-utils'
import { FeeBurnerContract, FeeBurnerInstance } from 'types'

const FeeBurner: FeeBurnerContract = artifacts.require('FeeBurner')

contract('FeeBurner', (accounts: string[]) => {
  let feeBurner: FeeBurnerInstance

  // const aTokenAddress = '0x000000000000000000000000000000000000ce10'

  // const nonOwner = accounts[1]

  beforeEach(async () => {
    feeBurner = await FeeBurner.new(true)
    await feeBurner.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const owner: string = await feeBurner.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(feeBurner.initialize())
    })
  })

  describe('#addToken()', () => {
    it('should allow the owner to add a token', async () => {})

    it('should not allow a non-owner to add a token', async () => {
      // await assertRevert(feeCurrencyWhitelist.addToken(aTokenAddress, { from: nonOwner }))
    })
  })
})

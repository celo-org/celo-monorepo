import { assertRevert } from '@celo/protocol/lib/test-utils'
import { StableTokenRegistryContract, StableTokenRegistryInstance } from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')

contract('StableTokenRegistry', (accounts: string[]) => {
  let strc: StableTokenRegistryInstance
  const nonOwner: string = accounts[1]
  const fiatTicker: string = 'USD'
  const stableTokenContractName = 'StableToken'

  beforeEach(async () => {
    strc = await STRC.new(true)
    await strc.initialize([], [])
  })

  describe('#initialize()', async () => {
    it('should have set the owner', async () => {
      const owner: string = await strc.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(strc.initialize([], []))
    })
  })

  describe('#removeStableToken(fiatTicker)', () => {
    beforeEach(async () => {
      await strc.addNewStableToken(fiatTicker, stableTokenContractName)
    })

    it('only allows owner', async () => {
      await assertRevert(strc.removeStableToken(fiatTicker, 0, { from: nonOwner }))
    })

    it('has the right list of fiat tickers after removing one', async () => {
      await strc.removeStableToken(fiatTicker, 0)
      const fiatTickers = await strc.getFiatTickers()
      assert.deepEqual(fiatTickers, [])
    })

    it("can't be removed twice", async () => {
      await strc.removeStableToken(fiatTicker, 0)
      await assertRevert(strc.removeStableToken(fiatTicker, 0))
    })

    it("can't delete an index out of range", async () => {
      await assertRevert(strc.removeStableToken(fiatTicker, 1))
    })

    it('removes from a big array', async () => {
      await strc.addNewStableToken(fiatTicker, stableTokenContractName)
      await strc.removeStableToken(fiatTicker, 0)
      const fiatTickers = await strc.getFiatTickers()
      assert.deepEqual(fiatTickers, [accounts[1]])
    })

    it("doesn't remove an fiat ticker with the wrong index", async () => {
      await strc.addNewStableToken(fiatTicker, stableTokenContractName)
      await assertRevert(strc.removeStableToken(fiatTicker, 1))
    })
  })
})

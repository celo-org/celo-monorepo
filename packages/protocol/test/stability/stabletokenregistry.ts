import { assertRevert } from '@celo/protocol/lib/test-utils'
import { StableTokenRegistryContract, StableTokenRegistryInstance } from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')

contract('StableTokenRegistry', (accounts: string[]) => {
  let strc: StableTokenRegistryInstance
  const nonOwner: string = accounts[1]
  const fiatTicker: string = 'cUSD'
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
    // beforeEach(async () => {
    //   await strc.addNewStableToken(fiatTicker, stableTokenContractName)
    // })

    it('only allows owner', async () => {
      await strc.addNewStableToken(fiatTicker, stableTokenContractName)
      await assertRevert(strc.removeStableToken(fiatTicker, 0, { from: nonOwner }))
    })

    //   it('has the right list of fiat tickers after removing one', async () => {
    //     await strc.addNewStableToken('cEUR', 'StableTokenEUR')
    //     await strc.addNewStableToken('cBRL', 'StableTokenBRL')
    //     await strc.removeStableToken(fiatTicker, 0)
    //     const fiatTickers = await strc.getFiatTickers()
    //     assert.deepEqual(fiatTickers, ['cBRL', 'cEUR'])
    //   })

    //   it("can't be removed twice", async () => {
    //     await strc.removeStableToken(fiatTicker, 0)
    //     await assertRevert(strc.removeStableToken(fiatTicker, 0))
    //   })

    //   it("can't delete an index out of range", async () => {
    //     await assertRevert(strc.removeStableToken(fiatTicker, 1))
    //   })

    //   it('removes from fiatTickers array', async () => {
    //     await strc.removeStableToken(fiatTicker, 0)
    //     const fiatTickers = await strc.getFiatTickers()
    //     assert.deepEqual(fiatTickers, [])
    //   })

    //   it("doesn't remove an fiat ticker with the wrong index", async () => {
    //     await assertRevert(strc.removeStableToken(fiatTicker, 1))
    //   })
    // })

    // describe('#addNewStableToken(fiatTicker)', () => {
    //   it('only allows owner', async () => {
    //     await assertRevert(
    //       strc.addNewStableToken(fiatTicker, stableTokenContractName, { from: nonOwner })
    //     )
    //   })

    //   it('does not allow empty strings', async () => {
    //     await assertRevert(strc.addNewStableToken(fiatTicker, ''))
    //     await assertRevert(strc.addNewStableToken('', fiatTicker))
    //     await assertRevert(strc.addNewStableToken('', ''))
    //   })

    //   it('has the right list of fiat tickers after addition', async () => {
    //     const fiatTickersBefore = await strc.getFiatTickers()
    //     assert.deepEqual(fiatTickersBefore, [])
    //     await strc.addNewStableToken(fiatTicker, stableTokenContractName)
    //     await strc.addNewStableToken('cEUR', 'StableTokenEUR')
    //     const fiatTickers = await strc.getFiatTickers()
    //     assert.deepEqual(fiatTickers, ['cUSD', 'cEUR'])
    //   })
  })
})

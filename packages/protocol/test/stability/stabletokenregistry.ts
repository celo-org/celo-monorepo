import { assertRevert } from '@celo/protocol/lib/test-utils'
import { StableTokenRegistryContract, StableTokenRegistryInstance } from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')

const convertToHex = (input: string) => {
  return web3.utils.utf8ToHex(input)
}

contract('StableTokenRegistry', (accounts: string[]) => {
  let strc: StableTokenRegistryInstance
  const nonOwner: string = accounts[1]

  const fiatTicker: string = convertToHex('cUSD')
  const stableTokenContractName = convertToHex('StableToken')
  const fiatTickers: string[] = [convertToHex('cUSD'), convertToHex('cEUR')]
  const stableTokenContractNames = [convertToHex('StableToken'), convertToHex('StableTokenEUR')]

  const getFiatTickers = async () => {
    const updatedFiatTickers = []
    for (let i = 0; i < 180; i++) {
      try {
        updatedFiatTickers.push(web3.utils.hexToUtf8(await strc.fiatTickers(i)))
      } catch (error) {
        return updatedFiatTickers
      }
    }
  }

  beforeEach(async () => {
    strc = await STRC.new(true)
    await strc.initialize(fiatTickers, stableTokenContractNames)
  })

  describe('#initialize()', async () => {
    it('should have set the owner', async () => {
      const owner: string = await strc.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(strc.initialize(fiatTickers, stableTokenContractNames))
    })
  })

  describe('#removeStableToken(fiatTicker)', () => {
    beforeEach(async () => {
      await strc.addNewStableToken(convertToHex('cBRL'), convertToHex('StableTokenBRL'))
    })

    it('only allows owner', async () => {
      await assertRevert(strc.removeStableToken(fiatTicker, 0, { from: nonOwner }))
    })

    it('has the right list of fiat tickers after removing one', async () => {
      await strc.removeStableToken(fiatTicker, 0)
      const updatedFiatTickers = await getFiatTickers()
      assert.deepEqual(updatedFiatTickers, ['cBRL', 'cEUR'])
    })

    // it('has the right list of contract names after removing one', async () => {
    //   await strc.addNewStableToken(fiatTicker, stableTokenContractName)
    //   await strc.removeStableToken(fiatTicker, 0)
    //   const updatedContractNames = strc.getContractInstances();
    // })

    it("can't be removed twice", async () => {
      await strc.removeStableToken(convertToHex('cUSD'), 0)
      await assertRevert(strc.removeStableToken(convertToHex('cUSD'), 0))
    })

    it("can't delete an index out of range", async () => {
      await assertRevert(strc.removeStableToken(convertToHex('cUSD'), 1))
    })

    it('removes from fiatTickers array', async () => {
      await strc.removeStableToken(fiatTicker, 0)
      const updatedFiatTickers = await getFiatTickers()
      assert.deepEqual(updatedFiatTickers, ['cBRL', 'cEUR'])
    })

    it("doesn't remove an fiat ticker with the wrong index", async () => {
      await assertRevert(strc.removeStableToken(convertToHex('cUSD'), 1))
    })

    it('reverts if a wrong values is passed as a fiatTicker', async () => {
      await assertRevert(strc.removeStableToken(convertToHex('cEUR'), 0))
    })
  })

  describe('#addNewStableToken(fiatTicker)', () => {
    it('only allows owner', async () => {
      await assertRevert(
        strc.addNewStableToken(fiatTicker, stableTokenContractName, { from: nonOwner })
      )
    })

    it('does not allow empty strings', async () => {
      await assertRevert(strc.addNewStableToken(fiatTicker, convertToHex('')))
      await assertRevert(strc.addNewStableToken(convertToHex(''), fiatTicker))
      await assertRevert(strc.addNewStableToken(convertToHex(''), convertToHex('')))
    })

    it('does not allow duplicate values', async () => {
      await assertRevert(strc.addNewStableToken(fiatTicker, stableTokenContractName))
      await assertRevert(strc.addNewStableToken(fiatTicker, stableTokenContractName))
    })

    it('has the right list of fiat tickers after addition', async () => {
      const fiatTickersBefore = await getFiatTickers()
      assert.deepEqual(fiatTickersBefore, ['cUSD', 'cEUR'])
      await strc.addNewStableToken(convertToHex('cBRL'), convertToHex('StableTokenEUR'))
      const updatedFiatTickers = await getFiatTickers()
      assert.deepEqual(updatedFiatTickers, ['cUSD', 'cEUR', 'cBRL'])
    })
  })
})

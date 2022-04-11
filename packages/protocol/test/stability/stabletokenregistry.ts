import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import { RegistryContract, StableTokenRegistryContract, StableTokenRegistryInstance } from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')
const Registry: RegistryContract = artifacts.require('Registry')

const convertToHex = (input: string) => {
  return web3.utils.utf8ToHex(input)
}

const assertSTContractNames = (
  contractsHex: string,
  lengths: BigNumber[],
  expectedContracts: string[]
) => {
  assert.equal(lengths.length, expectedContracts.length)
  const contracts = web3.utils.hexToUtf8(contractsHex)
  let currentIndex = 0
  expectedContracts.forEach((expectedContract: string, i: number) => {
    const contract = contracts.slice(currentIndex, currentIndex + lengths[i].toNumber())
    currentIndex += lengths[i].toNumber()
    assert.equal(contract, expectedContract)
  })
  assert.equal(contracts.length, currentIndex)
}

contract('StableTokenRegistry', (accounts: string[]) => {
  let strc: StableTokenRegistryInstance
  const nonOwner: string = accounts[1]

  const fiatTicker: string = convertToHex('USD')
  const stableTokenContractName = convertToHex('StableToken')

  const getFiatTickers = async () => {
    const updatedFiatTickers = []
    try {
      let index = 0
      while (await strc.fiatTickers(index)) {
        updatedFiatTickers.push(web3.utils.hexToUtf8(await strc.fiatTickers(index)))
        index++
      }
    } catch (error) {
      return updatedFiatTickers
    }
  }

  beforeEach(async () => {
    strc = await STRC.new(true)
    const registry = await Registry.new(true)
    await registry.setAddressFor(CeloContractName.StableTokenRegistry, strc.address)
    await strc.initialize(convertToHex('GEL'), convertToHex('StableTokenGEL'), registry.address)
  })

  describe('#initialize()', async () => {
    const registry = await Registry.new(true)
    it('should have set the owner', async () => {
      const owner: string = await strc.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(
        strc.initialize(convertToHex('GEL'), convertToHex('StableTokenGEL'), registry.address)
      )
    })
  })

  describe('#removeStableToken(fiatTicker)', () => {
    beforeEach(async () => {
      await strc.addNewStableToken(convertToHex('GBP'), convertToHex('StableTokenGBP'))
    })

    it('only allows owner', async () => {
      await assertRevert(strc.removeStableToken(fiatTicker, 0, { from: nonOwner }))
    })

    it('has the right list of fiat tickers after removing one', async () => {
      await strc.removeStableToken(fiatTicker, 0)
      const updatedFiatTickers = await getFiatTickers()
      assert.deepEqual(updatedFiatTickers, ['GBP', 'EUR', 'BRL', 'GEL'])
    })

    it('has the right list of contract names after removing one', async () => {
      await strc.removeStableToken(fiatTicker, 0)
      const [contractsHex, lengths] = await strc.getContractInstances()
      assertSTContractNames(contractsHex, lengths, [
        'StableTokenGBP',
        'StableTokenEUR',
        'StableTokenBRL',
        'StableTokenGEL',
      ])
    })

    it("can't be removed twice", async () => {
      await strc.removeStableToken(convertToHex('USD'), 0)
      await assertRevert(strc.removeStableToken(convertToHex('USD'), 0))
    })

    it("can't delete an index out of range", async () => {
      await assertRevert(strc.removeStableToken(convertToHex('USD'), 1))
    })

    it('removes from fiatTickers array', async () => {
      await strc.removeStableToken(fiatTicker, 0)
      const updatedFiatTickers = await getFiatTickers()
      assert.deepEqual(updatedFiatTickers, ['GBP', 'EUR', 'BRL', 'GEL'])
    })

    it("doesn't remove an fiat ticker with the wrong index", async () => {
      await assertRevert(strc.removeStableToken(convertToHex('USD'), 1))
    })

    it('reverts if a wrong values is passed as a fiatTicker', async () => {
      await assertRevert(strc.removeStableToken(convertToHex('EUR'), 0))
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
    })

    it('has the right list of fiat tickers after addition', async () => {
      const fiatTickersBefore = await getFiatTickers()
      assert.deepEqual(fiatTickersBefore, ['USD', 'EUR', 'BRL', 'GEL'])
      await strc.addNewStableToken(convertToHex('MXN'), convertToHex('StableTokenMXN'))
      const updatedFiatTickers = await getFiatTickers()
      assert.deepEqual(updatedFiatTickers, ['USD', 'EUR', 'BRL', 'GEL', 'MXN'])
    })

    it('has the right list of contract names after adding one', async () => {
      await strc.addNewStableToken(convertToHex('MXN'), convertToHex('StableTokenMXN'))
      const [contractsHex, lengths] = await strc.getContractInstances()
      assertSTContractNames(contractsHex, lengths, [
        'StableToken',
        'StableTokenEUR',
        'StableTokenBRL',
        'StableTokenGEL',
        'StableTokenMXN',
      ])
    })
  })

  describe('#queryStableTokenContractNames(fiatTicker)', () => {
    it('returns the corresponfing contract name', async () => {
      const queriedContract = await strc.queryStableTokenContractNames.call(fiatTicker)
      assert.deepEqual(queriedContract, stableTokenContractName)
    })
  })
})

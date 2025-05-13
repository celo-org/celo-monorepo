// /* tslint:disable */

// TODO remove magic numbers
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertTransactionRevertWithReason } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  GoldTokenContract,
  GoldTokenInstance,
  MentoFeeHandlerSellerContract,
  MentoFeeHandlerSellerInstance,
  RegistryContract,
  RegistryInstance,
  UniswapFeeHandlerSellerContract,
  UniswapFeeHandlerSellerInstance,
} from 'types'

const MentoFeeHandlerSeller: MentoFeeHandlerSellerContract =
  artifacts.require('MentoFeeHandlerSeller')

const UniswapFeeHandlerSeller: UniswapFeeHandlerSellerContract =
  artifacts.require('UniswapFeeHandlerSeller')

const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
const Registry: RegistryContract = artifacts.require('Registry')

const oneCelo = new BigNumber('1e18')

contract('FeeHandlerSeller', (accounts: string[]) => {
  let uniswapFeeHandlerSeller: UniswapFeeHandlerSellerInstance
  let mentoFeeHandlerSeller: MentoFeeHandlerSellerInstance
  let goldToken: GoldTokenInstance
  let registry: RegistryInstance

  let contractsToTest
  const user = accounts[1]

  beforeEach(async () => {
    registry = await Registry.new(true)

    goldToken = await GoldToken.new(true)
    await goldToken.initialize(registry.address)
    await registry.setAddressFor(CeloContractName.GoldToken, goldToken.address)

    uniswapFeeHandlerSeller = await UniswapFeeHandlerSeller.new(true)
    mentoFeeHandlerSeller = await MentoFeeHandlerSeller.new(true)
    contractsToTest = [mentoFeeHandlerSeller, uniswapFeeHandlerSeller]
    for (const contract of contractsToTest) {
      await contract.initialize(registry.address, [], [])
    }
  })

  describe('#transfer()', () => {
    it(`transfer works`, async () => {
      for (const contract of contractsToTest) {
        const receiver = web3.eth.accounts.create().address
        assertEqualBN(await goldToken.balanceOf(receiver), new BigNumber(0))

        await goldToken.transfer(contract.address, oneCelo)
        await contract.transfer(goldToken.address, oneCelo, receiver)
        assertEqualBN(await goldToken.balanceOf(receiver), oneCelo)
        assertEqualBN(await goldToken.balanceOf(contract.address), new BigNumber(0))
      }
    })

    it('only owner can transfer', async () => {
      const receiver = web3.eth.accounts.create().address
      for (const contract of contractsToTest) {
        await goldToken.transfer(contract.address, oneCelo)
        await assertTransactionRevertWithReason(
          contract.transfer(goldToken.address, oneCelo, receiver, { from: user }),
          'Ownable: caller is not the owner'
        )
      }
    })
  })

  describe('#setMinimumReports()', () => {
    it(`setMinimumReports works`, async () => {
      for (const contract of contractsToTest) {
        await contract.setMinimumReports(goldToken.address, 15)
        assertEqualBN(await contract.minimumReports(goldToken.address), 15)
      }
    })

    it('only owner can setMinimumReports', async () => {
      for (const contract of contractsToTest) {
        await assertTransactionRevertWithReason(
          contract.setMinimumReports(goldToken.address, 1, { from: user }),
          'Ownable: caller is not the owner.'
        )
      }
    })
  })
})

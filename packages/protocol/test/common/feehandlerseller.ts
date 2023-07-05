// /* tslint:disable */

// TODO remove magic numbers
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertEqualBN, assertRevert } from '@celo/protocol/lib/test-utils'
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
      contract.initialize(registry.address, [], [])
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
        await assertRevert(contract.transfer(goldToken.address, oneCelo, receiver, { from: user }))
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
        await assertRevert(contract.setMinimumReports(goldToken.address, 1, { from: user }))
      }
    })
  })
})

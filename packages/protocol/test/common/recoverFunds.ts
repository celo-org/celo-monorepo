// Note: this test is testing the recover-funds script and not a particular smart contract.

import { recoverFunds } from '@celo/protocol/lib/recover-funds'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { expectBigNumberInRange } from '@celo/protocol/lib/test-utils'
import { BigNumber } from 'bignumber.js'
import { GetSetV0Instance, ProxyInstance, RegistryContract } from 'types'
import { CeloDistributionScheduleContract, FreezerContract, GoldTokenContract } from 'types/08'
import { SOLIDITY_08_PACKAGE } from '../../contractPackages'
import { ArtifactsSingleton } from '../../lib/artifactsSingleton'

const GetSetV0: Truffle.Contract<GetSetV0Instance> = artifacts.require('GetSetV0')
const Proxy: Truffle.Contract<ProxyInstance> = artifacts.require('Proxy')

contract('Proxy', (accounts: string[]) => {
  let proxy: ProxyInstance
  let getSet: GetSetV0Instance

  const owner = accounts[0]

  beforeEach(async () => {
    proxy = await Proxy.new({ from: owner })
    getSet = await GetSetV0.new({ from: owner })
  })

  describe('fallback', () => {
    beforeEach(async () => {
      await proxy._setImplementation(getSet.address)
    })

    it('recovers funds from an incorrectly intialized implementation', async () => {
      const Freezer: FreezerContract = artifacts.require('Freezer')
      const GoldToken: GoldTokenContract = artifacts.require('GoldToken')
      const CeloDistributionSchedule: CeloDistributionScheduleContract =
        ArtifactsSingleton.getInstance(SOLIDITY_08_PACKAGE).require('CeloDistributionSchedule') // Added because the CeloToken `_transfer` prevents transfers to the celoDistributionSchedule.
      // @ts-ignore
      GoldToken.numberFormat = 'BigNumber'
      const Registry: RegistryContract = artifacts.require('Registry')

      const freezer = await Freezer.new(true)
      const goldToken = await GoldToken.new(true)
      const celoDistributionSchedule = await CeloDistributionSchedule.new(true)

      const registry = await Registry.new(true)
      await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
      await registry.setAddressFor(
        CeloContractName.CeloDistributionSchedule,
        celoDistributionSchedule.address
      )
      await goldToken.initialize(registry.address)

      const amount = new BigNumber(10)
      const initialBalance = new BigNumber(await goldToken.balanceOf(owner))
      await goldToken.transfer(proxy.address, amount)

      await proxy._setImplementation(getSet.address)

      const ownerBalance = await goldToken.balanceOf(owner)

      expectBigNumberInRange(ownerBalance, initialBalance.minus(amount))
      const proxyBalance = await web3.eth.getBalance(proxy.address)
      assert(proxyBalance === amount.toString())

      await recoverFunds(proxy.address, owner)
      const ownerBalance2 = await goldToken.balanceOf(owner)
      assert((await web3.eth.getBalance(proxy.address)) === '0')
      expectBigNumberInRange(ownerBalance2, initialBalance)
    })
  })
})

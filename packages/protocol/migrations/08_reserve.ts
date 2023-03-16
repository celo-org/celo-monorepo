/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { RegistryInstance } from 'types'
import { ReserveInstance, ReserveSpenderMultiSigInstance } from 'types/mento'
import Web3 from 'web3'
import { MySingleton } from './singletonArtifacts'

import Web3Utils = require('web3-utils')

const truffle = require('@celo/protocol/truffle-config.js')
// const Artifactor = require('truffle-artifactor')
// const mentoArtifacts = new Artifactor('./build/mento');
// console.log("require", mentoArtifacts.require('ReserveSpenderMultiSig'))

const initializeArgs = async (): Promise<
  [string, number, string, number, number, string[], string[], string, string]
> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [
    registry.address,
    config.reserve.tobinTaxStalenessThreshold,
    config.reserve.dailySpendingRatio,
    0, // frozenGold cannot be set until the reserve us funded
    0, // frozenGold cannot be set until the reserve us funded
    config.reserve.assetAllocationSymbols.map((assetSymbol) =>
      Web3Utils.padRight(Web3Utils.utf8ToHex(assetSymbol), 64)
    ),
    config.reserve.assetAllocationWeights.map((assetWeight) => toFixed(assetWeight).toFixed()),
    config.reserve.tobinTax,
    config.reserve.tobinTaxReserveRatio,
  ]
}
console.log('Singleton initialized', MySingleton.getInstance().initialized)

module.exports = deploymentForCoreContract<ReserveInstance>(
  web3,
  artifacts,
  CeloContractName.Reserve,
  initializeArgs,
  async (reserve: ReserveInstance, web3: Web3, networkName: string) => {
    config.reserve.spenders.forEach(async (spender) => {
      console.info(`Marking ${spender} as a Reserve spender`)
      await reserve.addSpender(spender)
    })
    config.reserve.otherAddresses.forEach(async (otherAddress) => {
      console.info(`Marking ${otherAddress} as an "otherReserveAddress"`)
      await reserve.addOtherReserveAddress(otherAddress)
    })

    if (config.reserve.initialBalance) {
      console.info('Sending the Reserve an initial gold balance')
      const network: any = truffle.networks[networkName]
      await web3.eth.sendTransaction({
        from: network.from,
        to: reserve.address,
        value: web3.utils.toWei(config.reserve.initialBalance.toString(), 'ether').toString(),
      })

      if (config.reserve.frozenAssetsStartBalance && config.reserve.frozenAssetsDays) {
        console.info('Setting frozen asset parameters on the Reserve')
        await reserve.setFrozenGold(
          config.reserve.frozenAssetsStartBalance,
          config.reserve.frozenAssetsDays
        )
      }
    }

    const reserveSpenderMultiSig: ReserveSpenderMultiSigInstance = await getDeployedProxiedContract<ReserveSpenderMultiSigInstance>(
      CeloContractName.ReserveSpenderMultiSig,
      MySingleton.getInstance()
    )
    console.info(`Marking ${reserveSpenderMultiSig.address} as a reserve spender`)
    await reserve.addSpender(reserveSpenderMultiSig.address)
  },
  'mento'
)

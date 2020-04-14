/* tslint:disable:no-console */
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { RegistryInstance, ReserveInstance, ReserveSpenderMultiSigInstance } from 'types'
import Web3 from 'web3'
import Web3Utils = require('web3-utils')

const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (): Promise<[
  string,
  number,
  string,
  number,
  number,
  string[],
  string[],
  string,
  string
]> => {
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

module.exports = deploymentForCoreContract<ReserveInstance>(
  web3,
  artifacts,
  CeloContractName.Reserve,
  initializeArgs,
  async (reserve: ReserveInstance, web3: Web3, networkName: string) => {
    config.reserve.spenders.forEach(async (spender) => {
      console.info(`Marking ${spender} as a reserve spender`)
      await reserve.addSpender(spender)
    })
    config.reserve.otherAddresses.forEach(async (otherAddress) => {
      console.info(`Marking ${otherAddress} as an "otherReserveAddress"`)
      await reserve.addOtherReserveAddress(otherAddress)
    })

    if (config.reserve.initialBalance) {
      console.info('Sending the reserve an initial gold balance')
      const network: any = truffle.networks[networkName]
      await web3.eth.sendTransaction({
        from: network.from,
        to: reserve.address,
        value: web3.utils.toWei(config.reserve.initialBalance.toString(), 'ether').toString(),
      })
    }

    const reserveSpenderMultiSig: ReserveSpenderMultiSigInstance = await getDeployedProxiedContract<
      ReserveSpenderMultiSigInstance
    >(CeloContractName.ReserveSpenderMultiSig, artifacts)
    console.info(`Marking ${reserveSpenderMultiSig.address} as a reserve spender`)
    await reserve.addSpender(reserveSpenderMultiSig.address)
  }
)

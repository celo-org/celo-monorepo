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
import { MENTO_PACKAGE } from '../contractPackages'
import { ArtifactsSingleton } from '../lib/artifactsSingleton'

import Web3Utils = require('web3-utils')

const truffle = require('@celo/protocol/truffle-config.js')

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
      const network: any = truffle.networks[networkName]

      const block = await web3.eth.getBlock('latest')
      const nextGasPrice = Math.ceil(block.baseFeePerGas)

      await web3.eth.sendTransaction({
        from: network.from,
        to: reserve.address,
        value: web3.utils.toWei(config.reserve.initialBalance.toString(), 'ether').toString(),
        // @ts-ignore: typing not available https://github.com/web3/web3.js/issues/6123#issuecomment-1568250373
        type: 0,
        gasPrice: nextGasPrice,
      })

      if (config.reserve.frozenAssetsStartBalance && config.reserve.frozenAssetsDays) {
        console.info('Setting frozen asset parameters on the Reserve')
        await reserve.setFrozenGold(
          config.reserve.frozenAssetsStartBalance,
          config.reserve.frozenAssetsDays
        )
      }
    }

    const reserveSpenderMultiSig: ReserveSpenderMultiSigInstance =
      await getDeployedProxiedContract<ReserveSpenderMultiSigInstance>(
        CeloContractName.ReserveSpenderMultiSig,
        ArtifactsSingleton.getInstance(MENTO_PACKAGE)
      )
    console.info(`Marking ${reserveSpenderMultiSig.address} as a reserve spender`)
    await reserve.addSpender(reserveSpenderMultiSig.address)
  },
  MENTO_PACKAGE
)

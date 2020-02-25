/* tslint:disable:no-console */
import Web3 = require('web3')
import Web3Utils = require('web3-utils')

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { BigNumber } from 'bignumber.js'
import { RegistryInstance, ReserveInstance } from 'types'
const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (): Promise<[
  string,
  number,
  string,
  number,
  number,
  string[],
  BigNumber[]
]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [
    registry.address,
    config.reserve.tobinTaxStalenessThreshold,
    config.reserve.dailySpendingRatio,
    config.reserve.frozenGold,
    config.reserve.frozenDays,
    config.reserve.assetAllocationSymbols.map((assetSymbol) =>
      Web3Utils.padRight(Web3Utils.utf8ToHex(assetSymbol), 64)
    ),
    config.reserve.assetAllocationWeights.map((assetWeight) => toFixed(assetWeight)),
  ]
}

module.exports = deploymentForCoreContract<ReserveInstance>(
  web3,
  artifacts,
  CeloContractName.Reserve,
  initializeArgs,
  async (reserve: ReserveInstance, web3: Web3, networkName: string) => {
    const network: any = truffle.networks[networkName]
    console.info('Sending the reserve an initial gold balance')
    await web3.eth.sendTransaction({
      from: network.from,
      to: reserve.address,
      value: web3.utils.toWei(config.reserve.goldBalance.toString(), 'ether') as string,
    })
    console.info(`Marking ${network.from} as a reserve spender`)
    await reserve.addSpender(network.from)
  }
)

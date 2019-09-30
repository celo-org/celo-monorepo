/* tslint:disable:no-console */
import Web3 = require('web3')

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { RegistryInstance, ReserveInstance } from 'types'
const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (): Promise<[string, number]> => {
  const registry: RegistryInstance = await getDeployedProxiedContract<RegistryInstance>(
    'Registry',
    artifacts
  )
  return [registry.address, config.reserve.tobinTaxStalenessThreshold]
}

module.exports = deploymentForCoreContract<ReserveInstance>(
  web3,
  artifacts,
  CeloContractName.Reserve,
  initializeArgs,
  async (reserve: ReserveInstance, web3: Web3, networkName: string) => {
    const network: any = truffle.networks[networkName]
    console.log('Sending the reserve an initial gold balance')
    await web3.eth.sendTransaction({
      from: network.from,
      to: reserve.address,
      value: web3.utils.toWei(config.reserve.goldBalance.toString(), 'ether') as string,
    })
  }
)

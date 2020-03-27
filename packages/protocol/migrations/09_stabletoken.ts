/* tslint:disable:no-console */
import Web3 from 'web3'

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { NULL_ADDRESS } from '@celo/protocol/lib/test-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { ensureLeading0x, eqAddress } from '@celo/utils/lib/address'
import { toFixed } from '@celo/utils/lib/fixidity'
import {
  FeeCurrencyWhitelistInstance,
  FreezerInstance,
  ReserveInstance,
  SortedOraclesInstance,
  StableTokenInstance,
} from 'types'
const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (): Promise<any[]> => {
  const rate = toFixed(config.stableToken.inflationRate)
  return [
    config.stableToken.tokenName,
    config.stableToken.tokenSymbol,
    config.stableToken.decimals,
    config.registry.predeployedProxyAddress,
    rate.toString(),
    config.stableToken.inflationPeriod,
    config.stableToken.initialBalances.addresses,
    config.stableToken.initialBalances.values,
  ]
}

module.exports = deploymentForCoreContract<StableTokenInstance>(
  web3,
  artifacts,
  CeloContractName.StableToken,
  initializeArgs,
  async (stableToken: StableTokenInstance, _web3: Web3, networkName: string) => {
    if (config.stableToken.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(stableToken.address)
    }

    const sortedOracles: SortedOraclesInstance = await getDeployedProxiedContract<
      SortedOraclesInstance
    >('SortedOracles', artifacts)

    for (const oracle of config.stableToken.oracles) {
      console.info(`Adding ${oracle} as an Oracle for StableToken`)
      await sortedOracles.addOracle(stableToken.address, ensureLeading0x(oracle))
    }

    const goldPrice = config.stableToken.goldPrice
    if (goldPrice) {
      const fromAddress = truffle.networks[networkName].from
      const isOracle = config.stableToken.oracles.some((o) => eqAddress(o, fromAddress))
      if (!isOracle) {
        console.warn(
          `Gold price specified in migration but ${fromAddress} not explicitly authorized as oracle, authorizing...`
        )
        await sortedOracles.addOracle(stableToken.address, ensureLeading0x(fromAddress))
      }
      console.info('Reporting price of StableToken to oracle')
      await sortedOracles.report(
        stableToken.address,
        toFixed(goldPrice),
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
        'Reserve',
        artifacts
      )
      console.info('Adding StableToken to Reserve')
      await reserve.addToken(stableToken.address)
    }

    console.info('Whitelisting StableToken as a fee currency')
    const feeCurrencyWhitelist: FeeCurrencyWhitelistInstance = await getDeployedProxiedContract<
      FeeCurrencyWhitelistInstance
    >('FeeCurrencyWhitelist', artifacts)
    await feeCurrencyWhitelist.addToken(stableToken.address)
  }
)

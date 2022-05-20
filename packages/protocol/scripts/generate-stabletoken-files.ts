import * as fs from 'fs'

function stableTokenSource(ticker: string): string {
  return `pragma solidity ^0.5.13;

import "./StableToken.sol";

contract StableToken${ticker} is StableToken {
  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public StableToken(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @dev This function is overloaded to maintain a distinct version from StableToken.sol.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
`
}

function exchangeSource(ticker: string): string {
  return `pragma solidity ^0.5.13;

import "./Exchange.sol";

contract Exchange${ticker} is Exchange {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Exchange(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @dev This function is overloaded to maintain a distinct version from Exchange.sol.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
`
}

function stableTokenProxySource(ticker: string): string {
  return `pragma solidity ^0.5.13;

import "../../common/Proxy.sol";

/* solhint-disable no-empty-blocks */
contract StableToken${ticker}Proxy is Proxy {}
`
}

function exchangeProxySource(ticker: string): string {
  return `pragma solidity ^0.5.13;

import "../../common/Proxy.sol";

/* solhint-disable no-empty-blocks */
contract Exchange${ticker}Proxy is Proxy {}
`
}

function migrationStableSource(ticker: string): string {
  return `/* tslint:disable:no-console */
import { ensureLeading0x, eqAddress, NULL_ADDRESS } from '@celo/base/lib/address'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import {
  FeeCurrencyWhitelistInstance,
  FreezerInstance,
  ReserveInstance,
  SortedOraclesInstance,
  StableToken${ticker}Instance,
} from 'types'
import Web3 from 'web3'

const truffle = require('@celo/protocol/truffle-config.js')

const initializeArgs = async (): Promise<any[]> => {
  const rate = toFixed(config.stableToken${ticker}.inflationRate)
  return [
    config.stableToken${ticker}.tokenName,
    config.stableToken${ticker}.tokenSymbol,
    config.stableToken${ticker}.decimals,
    config.registry.predeployedProxyAddress,
    rate.toString(),
    config.stableToken${ticker}.inflationPeriod,
    config.stableToken${ticker}.initialBalances.addresses,
    config.stableToken${ticker}.initialBalances.values,
    'Exchange${ticker}',
  ]
}

// TODO make this general
module.exports = deploymentForCoreContract<StableToken${ticker}Instance>(
  web3,
  artifacts,
  CeloContractName.StableToken${ticker},
  initializeArgs,
  async (stableToken: StableToken${ticker}Instance, _web3: Web3, networkName: string) => {
    if (config.stableToken${ticker}.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(stableToken.address)
    }
    const sortedOracles: SortedOraclesInstance = await getDeployedProxiedContract<SortedOraclesInstance>(
      'SortedOracles',
      artifacts
    )

    for (const oracle of config.stableToken${ticker}.oracles) {
      console.info(\`Adding \${ oracle } as an Oracle for StableToken(${ticker})\`)
      await sortedOracles.addOracle(stableToken.address, ensureLeading0x(oracle))
    }

    const goldPrice = config.stableToken${ticker}.goldPrice
    if (goldPrice) {
      const fromAddress = truffle.networks[networkName].from
      const isOracle = config.stableToken${ticker}.oracles.some((o) => eqAddress(o, fromAddress))
      if (!isOracle) {
        console.warn(
          \`Gold price specified in migration but \${ fromAddress } not explicitly authorized as oracle, authorizing...\`
        )
        await sortedOracles.addOracle(stableToken.address, ensureLeading0x(fromAddress))
      }
      console.info('Reporting price of StableToken (${ticker}) to oracle')
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
      console.info('Adding StableToken (${ticker}) to Reserve')
      await reserve.addToken(stableToken.address)
    }

    console.info('Whitelisting StableToken (${ticker}) as a fee currency')
    const feeCurrencyWhitelist: FeeCurrencyWhitelistInstance = await getDeployedProxiedContract<FeeCurrencyWhitelistInstance>(
      'FeeCurrencyWhitelist',
      artifacts
    )
    await feeCurrencyWhitelist.addToken(stableToken.address)
  }
)
`
}

function migrationExchangeSource(ticker: string): string {
  return `/* tslint:disable:no-console */

import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  deploymentForCoreContract,
  getDeployedProxiedContract,
} from '@celo/protocol/lib/web3-utils'
import { config } from '@celo/protocol/migrationsConfig'
import { toFixed } from '@celo/utils/lib/fixidity'
import { Exchange${ticker}Instance, FreezerInstance, ReserveInstance } from 'types'

const initializeArgs = async (): Promise<any[]> => {
  return [
    config.registry.predeployedProxyAddress,
    CeloContractName.StableToken${ticker},
    toFixed(config.exchange.spread).toString(),
    toFixed(config.exchange.reserveFraction).toString(),
    config.exchange.updateFrequency,
    config.exchange.minimumReports,
  ]
}

module.exports = deploymentForCoreContract<Exchange${ticker}Instance>(
  web3,
  artifacts,
  CeloContractName.Exchange${ticker},
  initializeArgs,
  async (exchange: Exchange${ticker}Instance) => {
    if (config.exchange.frozen) {
      const freezer: FreezerInstance = await getDeployedProxiedContract<FreezerInstance>(
        'Freezer',
        artifacts
      )
      await freezer.freeze(exchange.address)
    }

    const reserve: ReserveInstance = await getDeployedProxiedContract<ReserveInstance>(
      'Reserve',
      artifacts
    )
    // cUSD doesn't need to be added as it is currently harcoded in Reserve.sol
    await reserve.addExchangeSpender(exchange.address)
    await exchange.activateStable()
  }
)
`
}

function exchangeConstitution(ticker: string): string {
  return `Exchange${ticker}: {
  default: 0.8,
  setRegistry: 0.9,
  setUpdateFrequency: 0.8,
  setMinimumReports: 0.8,
  setStableToken: 0.8,
  setSpread: 0.8,
  setReserveFraction: 0.8,
}`
}

function stableTokenConstitution(ticker: string): string {
  return `StableToken${ticker}: {
  default: 0.8,
  setRegistry: 0.9,
  setInflationParameters: 0.9,
  transfer: 0.6,
  transferWithComment: 0.6,
  approve: 0.6,
}`
}

function migrationsConfig(ticker: string): string {
  return `stableToken${ticker}: {
  decimals: 18,
  goldPrice: 1.2,
  tokenName: 'Celo ${ticker}',
  tokenSymbol: 'c${ticker}',
  inflationRate: 1,
  inflationPeriod: 1.5 * YEAR,
  initialBalances: {
    addresses: [network.from],
    values: ['5000000000000000000000000'],
  },
  oracles: [network.from],
  frozen: false,
}`
}

function integrationTestSnippet(ticker: string): string {
  return `['Exchange${ticker}', 'StableToken${ticker}'], // ${ticker}`
}

function errorFunct(err) {
  if (err) {
    // tslint:disable-next-line:no-console
    return console.log(err)
  }
}

try {
  const argv = require('minimist')(process.argv.slice(2), {
    string: ['stableTokenTicker'],
  })
  const fiatTicker = argv.stableTokenTicker

  const stabilityContractPath = './contracts/stability'
  const stabilityProxyPath = './contracts/stability/proxies'
  const migrationPath = './migrations'

  // contracts
  fs.writeFile(
    `${stabilityContractPath}/StableToken${fiatTicker}.sol`,
    stableTokenSource(fiatTicker),
    errorFunct
  )
  fs.writeFile(
    `${stabilityContractPath}/Exchange${fiatTicker}.sol`,
    exchangeSource(fiatTicker),
    errorFunct
  )

  // proxy
  fs.writeFile(
    `${stabilityProxyPath}/StableToken${fiatTicker}.sol`,
    stableTokenProxySource(fiatTicker),
    errorFunct
  )
  fs.writeFile(
    `${stabilityProxyPath}/Exchange${fiatTicker}.sol`,
    exchangeProxySource(fiatTicker),
    errorFunct
  )

  // migration
  fs.writeFile(
    `${migrationPath}/09_999_stableToken_${fiatTicker}.sol`,
    migrationStableSource(fiatTicker),
    errorFunct
  )
  fs.writeFile(
    `${migrationPath}/10_999_exchange_${fiatTicker}.sol`,
    migrationExchangeSource(fiatTicker),
    errorFunct
  )

  // tslint:disable-next-line:no-console
  console.log(`Other things that should be updated:
  * Add constitution parameters: packages/protocol/governanceConstitution.js
    Suggested values:
${exchangeConstitution(fiatTicker)}
${stableTokenConstitution(fiatTicker)}
  * Rename migration with right number: packages/protocol/migrations/09_Y_stableToken_X.ts and packages/protocol/migrations/10_Y_Exchange_X.ts
  * Add keys to migration config: packages/protocol/migrationsConfig.js
    Suggested values:
${migrationsConfig(fiatTicker)}
  * Add files to the build: packages/protocol/scripts/build.ts
    'Exchange${fiatTicker}Proxy' and 'StableToken${fiatTicker}Proxy' to 'ProxyContracts'.
    'Exchange${fiatTicker}' and 'StableToken${fiatTicker}' to 'CoreContracts'.
  * Add it to the env tests packages/protocol/test/common/integration.ts
    Code snippet:
${integrationTestSnippet(fiatTicker)}
  `)
} catch (e) {
  console.error(`Something went wrong: ${e}`)
}

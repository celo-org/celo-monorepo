import { concurrentMap } from '@celo/base'
import { CeloContract, NULL_ADDRESS } from '@celo/contractkit'
import { newICeloVersionedContract } from '@celo/contractkit/lib/generated/ICeloVersionedContract'
import { newProxy } from '@celo/contractkit/lib/generated/Proxy'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import BigNumber from 'bignumber.js'

const DEFAULT_VERSION = { 0: 1, 1: 0, 2: 0, 3: 0 }
const UNVERSIONED_CONTRACTS = [
  CeloContract.Registry,
  CeloContract.FeeCurrencyWhitelist,
  CeloContract.Freezer,
  CeloContract.TransferWhitelist,
]
const UNPROXIED_CONTRACTS = [CeloContract.TransferWhitelist]

export default class Contracts extends BaseCommand {
  static description = 'Lists Celo core contracts and their addesses.'

  static flags = {
    ...BaseCommand.flags,
    ...(cli.table.flags() as object),
  }

  async run() {
    const addressMapping = await this.kit.registry.addressMapping()
    const res = this.parse(Contracts)
    const contractInfo = await concurrentMap(
      4,
      Array.from(addressMapping.entries()),
      async ([contract, proxy]) => {
        // skip implementation check for unproxied contract
        const implementation = UNPROXIED_CONTRACTS.includes(contract)
          ? NULL_ADDRESS
          : await newProxy(this.kit.web3, proxy)
              .methods._getImplementation()
              .call()

        // skip version check for unversioned contracts
        const version = UNVERSIONED_CONTRACTS.includes(contract)
          ? DEFAULT_VERSION
          : await newICeloVersionedContract(this.kit.web3, implementation)
              .methods.getVersionNumber()
              .call()

        const balance = await this.kit.celoTokens.balancesOf(proxy)
        return {
          contract,
          proxy,
          implementation,
          version,
          balance,
        }
      }
    )

    cli.table(
      contractInfo,
      {
        contract: { get: (i) => i.contract },
        proxy: { get: (i) => i.proxy },
        implementation: { get: (i) => i.implementation },
        version: { get: (i) => `${i.version[0]}.${i.version[1]}.${i.version[2]}.${i.version[3]}` },
        // TODO: unpack balances for each token into a column
        balances: {
          get: (i) =>
            Object.entries(i.balance)
              .map(([symbol, amount]) =>
                amount!.isZero() ? '' : `${symbol}: ${amount!.toFixed()}`
              )
              .filter((s) => s !== '')
              .join(', '),
        },
      },
      { sort: 'contract', ...res.flags }
    )
  }
}

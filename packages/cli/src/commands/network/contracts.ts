import { CeloContract, NULL_ADDRESS } from '@celo/contractkit/lib'
import { PROXY_ABI } from '@celo/contractkit/lib/governance/proxy'
import { ContractFactories } from '@celo/contractkit/lib/web3-contract-cache'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Contracts extends BaseCommand {
  static description = 'Prints Celo contract addesses.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const lst: Array<keyof typeof ContractFactories> = [
      CeloContract.Accounts,
      CeloContract.Attestations,
      CeloContract.BlockchainParameters,
      CeloContract.DoubleSigningSlasher,
      CeloContract.DowntimeSlasher,
      CeloContract.Election,
      CeloContract.EpochRewards,
      CeloContract.Escrow,
      CeloContract.Exchange,
      CeloContract.FeeCurrencyWhitelist,
      CeloContract.Freezer,
      CeloContract.GasPriceMinimum,
      CeloContract.GoldToken,
      CeloContract.Governance,
      CeloContract.LockedGold,
      CeloContract.Random,
      CeloContract.Registry,
      CeloContract.Reserve,
      CeloContract.SortedOracles,
      CeloContract.StableToken,
      CeloContract.TransferWhitelist,
      CeloContract.Validators,
    ]
    const res = await Promise.all(
      lst.map(async (name) => {
        try {
          const contract = await this.kit._web3Contracts.getContract(name)
          const proxy = new this.kit.web3.eth.Contract(PROXY_ABI)
          proxy.options.address = contract.options.address
          return {
            name,
            contract:
              contract.options.address +
              ' (implementation at ' +
              (await proxy.methods._getImplementation().call()) +
              ')',
          }
        } catch (err) {
          console.log(err)
          return { name, contract: NULL_ADDRESS }
        }
      })
    )
    const obj: any = {}
    for (const { name, contract } of res) {
      obj[name] = contract
    }
    printValueMapRecursive(obj)
  }
}

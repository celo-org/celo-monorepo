import { CeloContract } from '@celo/contractkit/lib'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class Contracts extends BaseCommand {
  static description = 'Lists Celo core contracts and their addesses.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const contractAddresses = await this.kit.registry.allAddresses()
    for (const contract of Object.keys(contractAddresses)) {
      const c = contract as CeloContract // https://github.com/microsoft/TypeScript/issues/12870
      contractAddresses[c] = contractAddresses[c] ?? 'Address not found'
    }
    printValueMap(contractAddresses)
  }
}

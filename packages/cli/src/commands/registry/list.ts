import { CeloContract } from '@celo/contractkit'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class List extends BaseCommand {
  static description = 'List contracts and their addresses in the registry'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['list']

  async run() {
    const contractAddresses = await this.kit.registry.allAddresses()
    for (const contract of Object.keys(contractAddresses)) {
      const c = contract as CeloContract // https://github.com/microsoft/TypeScript/issues/12870
      contractAddresses[c] = contractAddresses[c] ?? 'Address not found'
    }
    printValueMap(contractAddresses)
  }
}

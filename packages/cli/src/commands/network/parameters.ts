import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Parameters extends BaseCommand {
  static description =
    'View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const config = await this.kit.getNetworkConfig()
    printValueMapRecursive(config)
  }
}

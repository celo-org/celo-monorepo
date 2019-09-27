import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Parameters extends BaseCommand {
  static description = 'View network parameters'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const config = await this.kit.getNetworkConfig()
    printValueMapRecursive(config)
  }
}

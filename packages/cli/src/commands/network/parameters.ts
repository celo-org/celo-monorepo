import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'

export default class Parameters extends BaseCommand {
  static description =
    'View parameters of the network, including but not limited to configuration for the various Celo core smart contracts.'

  static flags = {
    ...BaseCommand.flags,
    raw: flags.boolean({
      description: 'Display raw numerical configuration',
      required: false,
      default: false,
    }),
  }

  async run() {
    const res = this.parse(Parameters)
    const config = res.flags.raw
      ? this.kit.getNetworkConfig()
      : this.kit.getHumanReadableNetworkConfig()
    printValueMapRecursive(await config)
  }
}

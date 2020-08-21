import { flags } from '@oclif/command'
import { BaseCommand, GasOptions, LocalCommand } from '../../base'
import { readConfig, writeConfig } from '../../utils/config'

export default class Set extends LocalCommand {
  static description = 'Configure running node information for propogating transactions to network'

  static flags = {
    ...LocalCommand.flags,
    // Overrides base command node flag.
    node: flags.string({
      char: 'n',
      required: false,
      description: 'URL of the node to run commands against',
      default: 'http://localhost:8545',
    }),
    gasCurrency: BaseCommand.flags.gasCurrency,
  }

  static examples = ['set  --node ws://localhost:2500', 'set  --node <geth-location>/geth.ipc']

  async run() {
    const res = this.parse(Set)
    const curr = readConfig(this.config.configDir)
    const node = res.flags.node ?? curr.node
    const gasCurrency = res.flags.gasCurrency
      ? GasOptions[res.flags.gasCurrency as keyof typeof GasOptions]
      : curr.gasCurrency
    writeConfig(this.config.configDir, {
      node,
      gasCurrency,
    })
  }
}

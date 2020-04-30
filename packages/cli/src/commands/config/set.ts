import { flags } from '@oclif/command'
import { LocalCommand } from '../../base'
import { CeloConfig, writeConfig } from '../../utils/config'

export default class Set extends LocalCommand {
  static description = 'Configure running node information for propogating transactions to network'

  static flags = {
    ...LocalCommand.flags,
    // Overrides base command node flag.
    node: flags.string({
      char: 'n',
      required: true,
      description: 'URL of the node to run commands against',
      default: 'http://localhost:8545',
    }),
  }

  static examples = ['set  --node ws://localhost:2500', 'set  --node <geth-location>/geth.ipc']

  async run() {
    const res = this.parse(Set)
    const config: CeloConfig = {
      nodeUrl: res.flags.node,
    }
    await writeConfig(this.config.configDir, config)
  }
}

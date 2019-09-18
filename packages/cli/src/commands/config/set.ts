import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { CeloConfig, writeConfig } from '../../utils/config'

export default class Set extends BaseCommand {
  static description = 'Configure running node information for propogating transactions to network'

  static flags = {
    ...BaseCommand.flags,
    node: flags.string({
      required: true,
      description: 'Node URL',
      default: 'ws://localhost:8546',
    }),
  }

  requireSynced = false

  async run() {
    const res = this.parse(Set)
    const config: CeloConfig = {
      nodeUrl: res.flags.node,
    }
    await writeConfig(this.config.configDir, config)
  }
}

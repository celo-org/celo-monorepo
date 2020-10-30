import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { nodeIsSynced } from '../../utils/helpers'

export default class NodeSynced extends BaseCommand {
  static description = 'Check if the node is synced'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    verbose: flags.boolean({
      description: 'output the full status if syncing',
    }),
  }

  requireSynced = false

  async run() {
    const res = this.parse(NodeSynced)

    if (res.flags.verbose) {
      const status = await this.web3.eth.isSyncing()
      if (typeof status !== 'boolean') {
        console.log(status)
      }
    }
    console.log(await nodeIsSynced(this.web3))
  }
}

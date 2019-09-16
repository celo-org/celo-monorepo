import { BaseCommand } from '../../base'
import { nodeIsSynced } from '../../utils/helpers'

export default class NodeSynced extends BaseCommand {
  static description = 'Check if the node is synced'

  static flags = {
    ...BaseCommand.flags,
  }

  requireSynced = false

  async run() {
    this.parse(NodeSynced)
    console.log(await nodeIsSynced(this.web3))
  }
}

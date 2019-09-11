import { BaseCommand } from '../../base'

export default class NodeSynced extends BaseCommand {
  static description = 'Check if the node is synced'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    this.parse(NodeSynced)

    const isSyncing = await this.web3.eth.isSyncing()
    console.log(isSyncing === false)
  }
}

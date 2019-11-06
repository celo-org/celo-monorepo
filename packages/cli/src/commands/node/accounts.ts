import { BaseCommand } from '../../base'

export default class NodeAccounts extends BaseCommand {
  static description = 'List node accounts'

  static flags = {
    ...BaseCommand.flags,
  }

  requireSynced = false

  async run() {
    this.parse(NodeAccounts)

    const accounts = await this.web3.eth.getAccounts()
    console.log(accounts)
  }
}

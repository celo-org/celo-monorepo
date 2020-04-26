import { BaseCommand } from '../../base'

export default class NodeAccounts extends BaseCommand {
  static description = 'List the addresses that this node has the private keys for.'

  static flags = {
    ...BaseCommand.flags,
  }

  requireSynced = false

  async run() {
    this.parse(NodeAccounts)

    const accounts = await this.kit.web3.eth.getAccounts()
    console.log('***This command will be deprecated, please use "account:list" ***')
    console.log(accounts)
  }
}

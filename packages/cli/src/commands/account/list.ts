import { CeloProvider } from '@celo/contractkit/lib'
import { ParserOutput } from '@oclif/parser/lib/parse'
import { toChecksumAddress } from 'ethereumjs-util'
import { BaseCommand } from '../../base'

export default class AccountList extends BaseCommand {
  static description = 'List the addresses from the node and the local instance'

  static flags = {
    ...BaseCommand.flags,
  }

  requireSynced = false

  async run() {
    this.parse(AccountList)

    const celoProvider: CeloProvider = this.kit.web3.currentProvider as any
    const addresses = await this.kit.web3.eth.getAccounts()
    const localAddresses = celoProvider.wallet
      .getAccounts()
      .map((value) => toChecksumAddress(value))
    let localName = 'Local'
    const res: ParserOutput<any, any> = this.parse()

    if (res.flags.useLedger) {
      localName = 'Ledger'
    }
    console.log('All Addresses: ', addresses)
    console.log(
      'Keystore Addresses: ',
      addresses.filter((address) => !localAddresses.includes(address))
    )
    console.log(`${localName} Addresses: `, localAddresses)
  }
}

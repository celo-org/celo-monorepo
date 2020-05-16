import { CeloProvider } from '@celo/contractkit/lib'
import { flags } from '@oclif/command'
import { ParserOutput } from '@oclif/parser/lib/parse'
import { toChecksumAddress } from 'ethereumjs-util'
import { BaseCommand } from '../../base'

export default class AccountList extends BaseCommand {
  static description = 'List the addresses from the node and the local instance'

  static flags = {
    ...BaseCommand.flags,
    local: flags.boolean({
      default: false,
      description: 'If set, only show local and hardware wallet accounts',
    }),
  }

  requireSynced = false

  async run() {
    const res = this.parse(AccountList)

    const celoProvider: CeloProvider = this.kit.web3.currentProvider as any

    // Retreive accounts from the connected Celo node.
    const addresses = []
    if (res.flags.local) {
      addresses.push(...(await this.kit.web3.eth.getAccounts()))
    }

    // Get addresses from the local wallet.
    const localAddresses = celoProvider.wallet
      .getAccounts()
      .map((value) => toChecksumAddress(value))

    // Display the addresses.
    const localName = res.flags.useLedger ? 'Ledger' : 'Local'
    console.log('All Addresses: ', addresses)
    console.log(
      'Keystore Addresses: ',
      addresses.filter((address) => !localAddresses.includes(address))
    )
    console.log(`${localName} Addresses: `, localAddresses)
  }
}

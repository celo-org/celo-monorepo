import { CeloProvider } from '@celo/contractkit/lib'
import { flags } from '@oclif/command'
import { toChecksumAddress } from 'ethereumjs-util'
import { BaseCommand } from '../../base'

export default class AccountList extends BaseCommand {
  static description = 'List the addresses from the node and the local instance'

  static flags = {
    ...BaseCommand.flags,
    local: flags.boolean({
      allowNo: true,
      description:
        'If set, only show local and hardware wallet accounts. Use no-local to only show keystore addresses.',
    }),
  }

  requireSynced = false

  async run() {
    const res = this.parse(AccountList)

    // Retreive accounts from the connected Celo node.
    const nodeAddresses = !res.flags.local ? await this.kit.web3.eth.getAccounts() : []

    // Get addresses from the local wallet.
    const celoProvider: CeloProvider = this.kit.web3.currentProvider as any
    const localAddresses =
      res.flags.local ?? true
        ? celoProvider.wallet.getAccounts().map((value) => toChecksumAddress(value))
        : []

    // Display the addresses.
    const localName = res.flags.useLedger ? 'Ledger' : 'Local'
    if (res.flags.local === undefined) {
      console.log('All Addresses: ', nodeAddresses.concat(localAddresses))
    }
    if (!res.flags.local) {
      console.log('Keystore Addresses: ', nodeAddresses)
    }
    if (res.flags.local ?? true) {
      console.log(`${localName} Addresses: `, localAddresses)
    }
  }
}

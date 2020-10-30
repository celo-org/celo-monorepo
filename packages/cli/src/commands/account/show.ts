import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Args } from '../../utils/command'

export default class Show extends BaseCommand {
  static description =
    'Show information for an account, including name, authorized vote, validator, and attestation signers, the URL at which account metadata is hosted, the address the account is using with the mobile wallet, and a public key that can be used to encrypt information for the account.'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('address')]

  static examples = ['show 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(Show)

    const accounts = await this.kit.contracts.getAccounts()
    const address = await accounts.signerToAccount(args.address)
    printValueMapRecursive(await accounts.getAccountSummary(address))
  }
}

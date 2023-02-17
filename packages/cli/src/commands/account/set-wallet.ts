import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetWallet extends BaseCommand {
  static description =
    "Sets the wallet of a registered account on-chain. An account's wallet is an optional wallet associated with an account. Can be set by the account or an account's signer."

  static flags = {
    ...BaseCommand.flags,
    account: Flags.address({ required: true }),
    wallet: Flags.address({ required: true }),
    signature: Flags.proofOfPossession({
      required: false,
      description: 'Signature (a.k.a. proof-of-possession) of the signer key',
    }),
    signer: Flags.address({
      required: false,
      default: '',
      description: 'Address of the signer key to verify proof of possession.',
    }),
  }

  static args = []

  static examples = [
    'set-wallet --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --wallet 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'set-wallet --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --wallet 0x5409ed021d9299bf6814279a6a1411a7e866a631 --signer 0x0EdeDF7B1287f07db348997663EeEb283D70aBE7 --signature 0x1c5efaa1f7ca6484d49ccce76217e2fba0552c0b23462cff7ba646473bc2717ffc4ce45be89bd5be9b5d23305e87fc2896808467c4081d9524a84c01b89ec91ca3',
  ]

  async run() {
    const res = this.parse(SetWallet)
    this.kit.defaultAccount = res.flags.account
    const accounts = await this.kit.contracts.getAccounts()

    await newCheckBuilder(this).isAccount(res.flags.account).runChecks()

    if (res.flags.signature !== undefined) {
      try {
        accounts.parseSignatureOfAddress(res.flags.account, res.flags.signer, res.flags.signature)
      } catch (error) {
        console.error('Error: Failed to parse signature')
      }
      await displaySendTx(
        'setWalletAddress',
        accounts.setWalletAddress(
          res.flags.wallet,
          accounts.parseSignatureOfAddress(res.flags.account, res.flags.signer, res.flags.signature)
        )
      )
    } else {
      await displaySendTx('setWalletAddress', accounts.setWalletAddress(res.flags.wallet))
    }
  }
}

import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RegisterDataEncryptionKey extends BaseCommand {
  static description =
    'Register a data encryption key for an account on chain. This key can be used to encrypt data to you such as offchain metadata or transaction comments'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Addess of the account to set the data encryption key for',
    }),
    publicKey: flags.string({
      required: true,
      description: 'The public key you want to register',
    }),
  }

  static examples = [
    'register-data-encryption-key --publicKey 0x...  --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    const res = this.parse(RegisterDataEncryptionKey)
    this.kit.defaultAccount = res.flags.from

    await newCheckBuilder(this)
      .isAccount(res.flags.from)
      .runChecks()

    const publicKey = res.flags.publicKey

    const accounts = await this.kit.contracts.getAccounts()
    await displaySendTx(
      'RegisterDataEncryptionKey',
      accounts.setAccountDataEncryptionKey(publicKey)
    )
  }
}

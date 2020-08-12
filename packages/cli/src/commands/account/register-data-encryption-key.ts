import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RegisterDataEncryptionKey extends BaseCommand {
  static description =
    'Register a data encryption key for an account where users will be able to retieve the metadata file and verify your claims'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Addess of the account to set metadata for',
    }),
    publicKey: flags.string({
      required: true,
      description: 'The public key you want to register',
    }),
    force: flags.boolean({ description: 'Ignore metadata validity checks' }),
  }

  static examples = [
    'register-metadata --url https://www.mywebsite.com/celo-metadata --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    // const priv1 = '3fd72bd680c5a2c697bea4035dd39f375b58ddfc6b9e460a3274fb27740259fe'
    // const pub1 = '0x049ba928b8ee77c08294c6483e2054b9acbddd1aae05d4462c226a1ca6eef15bea0f45af0edd046a007a7ea0037a24fc66e8eee2fe5717ce01d78e137e31329cf2'

    // const priv2 = '92c88a27773d43bf7d3dd2852ca60800248559f4140e33bebf1079e471f630f5'
    // const pub2 = '0x0411b60fc071f0b038ab4d8388de6788ede47ed8bf9399c425d398606105d1e3391fc2616ac899642f009e6a6de25f3ee1b56b18ff846535498f6f88f40df63010'
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

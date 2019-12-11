import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class RegisterMetadata extends BaseCommand {
  static description =
    'Register metadata URL for an account where users will be able to retieve the metadata file and verify your claims'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Addess of the account to set metadata for',
    }),
    url: Flags.url({
      required: true,
      description: 'The url to the metadata you want to register',
    }),
  }

  static examples = [
    'register-metadata --url https://www.mywebsite.com/celo-metadata --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    const { flags } = this.parse(RegisterMetadata)
    this.kit.defaultAccount = flags.from

    await newCheckBuilder(this)
      .isAccount(flags.from)
      .runChecks()

    const accounts = await this.kit.contracts.getAccounts()
    await displaySendTx('registerMetadata', accounts.setMetadataURL(flags.url))
  }
}

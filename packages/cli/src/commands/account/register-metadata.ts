import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { displayMetadata } from '../../utils/identity'

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
    force: flags.boolean({ description: 'Ignore checks' }),
  }

  static examples = [
    'register-metadata --url https://www.mywebsite.com/celo-metadata --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    const res = this.parse(RegisterMetadata)
    this.kit.defaultAccount = res.flags.from

    await newCheckBuilder(this)
      .isAccount(res.flags.from)
      .runChecks()

    const metadataURL = res.flags.url

    try {
      if (!res.flags.force) {
        const metadata = await IdentityMetadataWrapper.fetchFromURL(metadataURL)
        console.info('Metadata contains the following claims: \n')
        await displayMetadata(metadata, this.kit)
        console.info()
      }
      const accounts = await this.kit.contracts.getAccounts()
      await displaySendTx('registerMetadata', accounts.setMetadataURL(metadataURL))
    } catch (error) {
      console.error(`Cannot set metadata URL ${metadataURL}: ${error.toString()}`)
    }
  }
}

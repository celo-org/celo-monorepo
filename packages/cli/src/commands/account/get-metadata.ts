import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'
import { displayMetadata } from '../../utils/identity'

export default class GetMetadata extends BaseCommand {
  static description = 'Show information about an address'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: IArg[] = [Args.address('address', { description: 'Address to get metadata for' })]

  static examples = ['get-metadata 0x97f7333c51897469E8D98E7af8653aAb468050a3']

  async run() {
    const { args } = this.parse(GetMetadata)
    const address = args.address
    const accounts = await this.kit.contracts.getAccounts()
    const metadataURL = await accounts.getMetadataURL(address)

    if (!metadataURL) {
      console.info('No metadata set for address')
      return
    }

    try {
      const metadata = await IdentityMetadataWrapper.fetchFromURL(metadataURL)
      console.info('Metadata contains the following claims: \n')
      displayMetadata(metadata)
    } catch (error) {
      console.error('Metadata could not be retrieved from ', metadataURL)
    }
  }
}

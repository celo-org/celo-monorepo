import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'
import { displayMetadata } from '../../utils/identity'

export default class ShowMetadata extends BaseCommand {
  static description = 'Show the data in a local metadata file'
  static flags = {
    ...BaseCommand.flags,
  }
  static args: IArg[] = [Args.file('file', { description: 'Path of the metadata file' })]
  static examples = ['show-metadata ~/metadata.json']
  public requireSynced: boolean = false

  async run() {
    const res = this.parse(ShowMetadata)
    const metadata = await IdentityMetadataWrapper.fromFile(this.kit, res.args.file)
    console.info(`Metadata at ${res.args.file} contains the following claims: \n`)
    await displayMetadata(metadata, this.kit)
  }
}

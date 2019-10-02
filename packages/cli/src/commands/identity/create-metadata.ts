import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { IArg } from '@oclif/parser/lib/args'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class CreateMetadata extends BaseCommand {
  static description = 'Create an empty metadata file'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: IArg[] = [
    Args.newFile('file', { description: 'Path where the metadata should be saved' }),
  ]

  static examples = ['create-metadata ~/metadata.json']

  async run() {
    const { args } = this.parse(CreateMetadata)
    const metadata = new IdentityMetadataWrapper(IdentityMetadataWrapper.emptyData)
    writeFileSync(args.file, metadata.toString())
  }
}

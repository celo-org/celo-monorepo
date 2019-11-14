import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { IArg } from '@oclif/parser/lib/args'
import { writeFileSync } from 'fs'
import { Args } from '../../utils/command'
import { ClaimCommand } from '../../utils/identity'

export default class CreateMetadata extends ClaimCommand {
  static description = 'Create an empty metadata file'
  static flags = ClaimCommand.flags
  static args: IArg[] = [
    Args.newFile('file', { description: 'Path where the metadata should be saved' }),
  ]
  static examples = ['create-metadata ~/metadata.json --from 0x0']

  async run() {
    const res = this.parse(CreateMetadata)
    const metadata = IdentityMetadataWrapper.fromEmpty(res.flags.from)
    writeFileSync(res.args.file, metadata.toString())
  }
}

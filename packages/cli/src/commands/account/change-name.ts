import { createNameClaim } from '@celo/contractkit/lib/identity'
import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'
import { modifyMetadata } from '../../utils/identity'

export default class ChangeName extends BaseCommand {
  static description = 'Change the name in a local metadata file'

  static flags = {
    ...BaseCommand.flags,
    name: flags.string({
      required: true,
      description: 'The name you want to claim',
    }),
  }

  static args: IArg[] = [Args.file('file', { description: 'Path of the metadata file' })]

  static examples = ['change-name ~/metadata.json']

  async run() {
    const res = this.parse(ChangeName)
    modifyMetadata(res.args.file, (metadata) => {
      const claim = createNameClaim(res.flags.name)
      metadata.addClaim(claim)
    })
  }
}

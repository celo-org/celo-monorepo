import { createDomainClaim } from '@celo/contractkit/lib/identity'
import { flags } from '@oclif/command'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'
import { modifyMetadata } from '../../utils/identity'

export default class ChangeDomain extends BaseCommand {
  static description = 'Change the domain in a local metadata file'

  static flags = {
    ...BaseCommand.flags,
    domain: flags.string({
      required: true,
      description: 'The domain you want to claim',
    }),
  }

  static args: IArg[] = [Args.file('file', { description: 'Path of the metadata file' })]

  static examples = ['change-domain ~/metadata.json']

  async run() {
    const res = this.parse(ChangeDomain)
    modifyMetadata(res.args.file, (metadata) => {
      const claim = createDomainClaim(res.flags.domain)
      metadata.addClaim(claim)
    })
  }
}

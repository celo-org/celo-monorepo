import { createAttestationServiceURLClaim } from '@celo/contractkit/lib/identity'
import { IArg } from '@oclif/parser/lib/args'
import { BaseCommand } from '../../base'
import { Args, Flags } from '../../utils/command'
import { modifyMetadata } from '../../utils/identity'

export default class ChangeAttestationServiceUrl extends BaseCommand {
  static description = 'Change the URL of the attestation service in a local metadata file'

  static flags = {
    ...BaseCommand.flags,
    url: Flags.url({
      required: true,
      description: 'The url you want to claim',
    }),
  }

  static args: IArg[] = [Args.file('file', { description: 'Path of the metadata file' })]

  static examples = ['change-attestation-service-url ~/metadata.json']

  async run() {
    const res = this.parse(ChangeAttestationServiceUrl)
    modifyMetadata(res.args.file, (metadata) => {
      const claim = createAttestationServiceURLClaim(res.flags.url)
      metadata.addClaim(claim)
    })
  }
}

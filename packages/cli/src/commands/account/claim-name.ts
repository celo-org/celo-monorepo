import { createNameClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { flags } from '@oclif/command'
import { ClaimCommand } from '../../utils/identity'

export default class ClaimName extends ClaimCommand {
  static description = 'Change the name in a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    name: flags.string({
      required: true,
      description: 'The name you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = ['change-name ~/metadata.json --from 0x0 --name myname']
  self = ClaimName
  async run() {
    const res = this.parse(ClaimName)
    const metadata = this.readMetadata()
    await this.addClaim(metadata, createNameClaim(res.flags.name))
    this.writeMetadata(metadata)
  }
}

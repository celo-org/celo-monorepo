import { createNameClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { flags } from '@oclif/command'
import { ClaimCommand } from '../../utils/identity'

export default class ClaimName extends ClaimCommand {
  static description = 'Claim a name and add the claim to a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    name: flags.string({
      required: true,
      description: 'The name you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = [
    'claim-name ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --name myname',
  ]
  self = ClaimName
  async run() {
    const res = this.parse(ClaimName)
    const metadata = await this.readMetadata()
    await this.addClaim(metadata, createNameClaim(res.flags.name))
    this.writeMetadata(metadata)
  }
}

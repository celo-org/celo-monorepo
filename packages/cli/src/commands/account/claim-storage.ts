import { createStorageClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { Flags } from '../../utils/command'
import { ClaimCommand } from '../../utils/identity'
export default class ClaimStorage extends ClaimCommand {
  static description = 'Claim a storage root and add the claim to a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    url: Flags.url({
      required: true,
      description: 'The URL of the storage root you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = [
    'claim-storage ~/metadata.json --url http://test.com/myurl --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]
  self = ClaimStorage

  async run() {
    const res = this.parse(ClaimStorage)
    const metadata = await this.readMetadata()
    await this.addClaim(metadata, createStorageClaim(res.flags.url))
    this.writeMetadata(metadata)
  }
}

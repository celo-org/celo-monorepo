import { createAttestationServiceURLClaim } from '@celo/contractkit/lib/identity/claims/attestation-service-url'
import { flags } from '@oclif/command'
import { Flags } from '../../utils/command'
import { ClaimCommand } from '../../utils/identity'
export default class ClaimAttestationServiceUrl extends ClaimCommand {
  static description =
    'Claim the URL of the attestation service and add the claim to a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    url: Flags.url({
      required: true,
      description: 'The URL you want to claim. Should begin http://',
    }),
    force: flags.boolean({ description: 'Ignore URL validity checks' }),
  }
  static args = ClaimCommand.args
  static examples = [
    'claim-attestation-service-url ~/metadata.json --url https://test.com/myurl --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]
  self = ClaimAttestationServiceUrl

  async run() {
    const res = this.parse(ClaimAttestationServiceUrl)
    if (!res.flags.force && !res.flags.url.startsWith('https://')) {
      this.error(
        'Attestation Service URLs should begin https:// to be accessible to all clients. Use --force to proceed anyway.'
      )
      return
    }
    const metadata = await this.readMetadata()
    await this.addClaim(metadata, createAttestationServiceURLClaim(res.flags.url))
    this.writeMetadata(metadata)
  }
}

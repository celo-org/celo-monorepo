import { createAttestationServiceURLClaim } from '@celo/contractkit/lib/identity/claims/attestation-service-url'
import { Flags } from '../../utils/command'
import { ClaimCommand } from '../../utils/identity'
export default class ClaimAttestationServiceUrl extends ClaimCommand {
  static description = 'Claim the URL of the attestation service in a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    url: Flags.url({
      required: true,
      description: 'The url you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = [
    'claim-attestation-service-url ~/metadata.json --url http://test.com/myurl --from 0x0',
  ]
  self = ClaimAttestationServiceUrl

  async run() {
    const res = this.parse(ClaimAttestationServiceUrl)
    const metadata = this.readMetadata()
    await this.addClaim(metadata, createAttestationServiceURLClaim(res.flags.url))
    this.writeMetadata(metadata)
  }
}

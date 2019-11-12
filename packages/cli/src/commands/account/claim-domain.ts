import { createDomainClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { flags } from '@oclif/command'
import { ClaimCommand } from '../../utils/identity'

export default class ClaimDomain extends ClaimCommand {
  static description = 'Change the domain in a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    domain: flags.string({
      required: true,
      description: 'The domain you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = ['claim-domain ~/metadata.json --domain test.com --from 0x0']
  self = ClaimDomain
  async run() {
    const res = this.parse(ClaimDomain)
    const metadata = this.readMetadata()
    await this.addClaim(metadata, createDomainClaim(res.flags.domain))
    this.writeMetadata(metadata)
  }
}

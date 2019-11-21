import { createAccountClaim } from '@celo/contractkit/lib/identity/claims/account'
import { flags } from '@oclif/command'
import { ClaimCommand } from '../../utils/identity'

export default class ClaimAccount extends ClaimCommand {
  static description = 'Claim another account in a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    address: flags.string({
      required: true,
      description: 'The address of the account you want to claim',
    }),
    publicKey: flags.string({
      default: undefined,
      description: 'The public key of the account if you want others to encrypt messages to you',
    }),
  }
  static args = ClaimCommand.args
  static examples = ['claim-account ~/metadata.json --address test.com --from 0x0']
  self = ClaimAccount
  async run() {
    const res = this.parse(ClaimAccount)
    const metadata = this.readMetadata()
    await this.addClaim(metadata, createAccountClaim(res.flags.address, res.flags.publicKey))
    this.writeMetadata(metadata)
  }
}

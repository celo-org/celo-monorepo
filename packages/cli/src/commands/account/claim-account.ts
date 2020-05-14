import { createAccountClaim } from '@celo/contractkit/lib/identity/claims/account'
import { flags } from '@oclif/command'
import { ClaimCommand } from '../../utils/identity'

export default class ClaimAccount extends ClaimCommand {
  static description =
    'Claim another account, and optionally its public key, and add the claim to a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    address: flags.string({
      required: true,
      description: 'The address of the account you want to claim',
    }),
    publicKey: flags.string({
      default: undefined,
      description:
        'The public key of the account that others may use to send you encrypted messages',
    }),
  }
  static args = ClaimCommand.args
  static examples = [
    'claim-account ~/metadata.json --address 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]
  self = ClaimAccount
  async run() {
    const res = this.parse(ClaimAccount)
    const metadata = await this.readMetadata()
    await this.addClaim(metadata, createAccountClaim(res.flags.address, res.flags.publicKey))
    this.writeMetadata(metadata)
  }
}

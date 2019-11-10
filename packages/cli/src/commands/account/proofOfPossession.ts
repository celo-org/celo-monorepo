import { BaseCommand } from '../../base'
import { Args, Flags } from '../../utils/command'

export default class ProofOfPossession extends BaseCommand {
  static description = 'Generate proof-of-possession to be used to authorize a signer'

  static flags = {
    ...BaseCommand.flags,
    account: Flags.address({ required: true }),
  }

  static args = [Args.address('signer')]

  static examples = [
    'proof-of-possession 0x5409ed021d9299bf6814279a6a1411a7e866a631 --signer 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(ProofOfPossession)
    const accounts = await this.kit.contracts.getAccounts()
    const pop = await accounts.generateProofOfSigningKeyPossession(
      res.flags.account,
      res.args.signer
    )
    console.log(pop)
  }
}

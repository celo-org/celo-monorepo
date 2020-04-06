import { serializeSignature } from '@celo/utils/lib/signatureUtils'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'
export default class ProofOfPossession extends BaseCommand {
  static description =
    'Generate proof-of-possession to be used to authorize a signer. See the "account:authorize" command for more details.'

  static flags = {
    ...BaseCommand.flags,
    signer: Flags.address({
      required: true,
      description: 'Address of the signer key to prove possession of.',
    }),
    account: Flags.address({
      required: true,
      description: 'Address of the account that needs to prove possession of the signer key.',
    }),
  }

  static examples = [
    'proof-of-possession --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb',
  ]

  async run() {
    const res = this.parse(ProofOfPossession)
    const accounts = await this.kit.contracts.getAccounts()
    const pop = await accounts.generateProofOfKeyPossession(res.flags.account, res.flags.signer)
    printValueMap({ signature: serializeSignature(pop) })
  }
}

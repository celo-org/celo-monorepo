import { serializeSignature } from '@celo/utils/lib/signatureUtils'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'
export default class VerifyProofOfPossession extends BaseCommand {
  static description =
    'Verify a proof-of-possession. See the "account:proof-of-possession" command for more details.'

  static flags = {
    ...BaseCommand.flags,
    signer: Flags.address({
      required: true,
      description: 'Address of the signer key to verify proof of possession.',
    }),
    account: Flags.address({
      required: true,
      description: 'Address of the account that needs to prove possession of the signer key.',
    }),
    signature: Flags.proofOfPossession({
      required: true,
      description: 'Signature (a.k.a. proof-of-possession) of the signer key',
    }),
  }

  static examples = [
    'verify-proof-of-possession --account 0x199eDF79ABCa29A2Fa4014882d3C13dC191A5B58 --signer 0x0EdeDF7B1287f07db348997663EeEb283D70aBE7 --signature 0x1c5efaa1f7ca6484d49ccce76217e2fba0552c0b23462cff7ba646473bc2717ffc4ce45be89bd5be9b5d23305e87fc2896808467c4081d9524a84c01b89ec91ca3',
  ]

  async run() {
    const res = this.parse(VerifyProofOfPossession)
    const accounts = await this.kit.contracts.getAccounts()
    let valid = false
    let signature = res.flags.signature
    try {
      const { v, r, s } = accounts.parseSignatureOfAddress(
        res.flags.account,
        res.flags.signer,
        res.flags.signature
      )
      signature = serializeSignature({ v, r, s })
      valid = true
    } catch (error) {
      console.error('Error: Failed to parse signature')
    }
    printValueMap({
      valid: valid,
      signature: signature,
    })
  }
}

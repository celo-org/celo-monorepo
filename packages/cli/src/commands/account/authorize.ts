import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

// TODO: Support authorizing a validator signer when a validator is registered.
export default class Authorize extends BaseCommand {
  static description = 'Authorize an attestation, validator or vote signing key'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    role: flags.string({
      char: 'r',
      options: ['vote', 'validator', 'attestation'],
      description: 'Role to delegate',
      required: true,
    }),
    pop: flags.string({
      description: 'Proof-of-possession of the signer key',
      required: true,
    }),
    signer: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --pop 0xTODO',
  ]

  async run() {
    const res = this.parse(Authorize)
    this.kit.defaultAccount = res.flags.from
    const accounts = await this.kit.contracts.getAccounts()
    const sig = accounts.parseSignatureOfAddress(res.flags.from, res.flags.signer, res.flags.pop)

    let tx: any
    if (res.flags.role === 'vote') {
      tx = await accounts.authorizeVoteSigner(res.flags.signer, sig)
    } else if (res.flags.role === 'validator') {
      tx = await accounts.authorizeValidatorSigner(res.flags.signer, sig)
    } else if (res.flags.role === 'attestation') {
      tx = await accounts.authorizeAttestationSigner(res.flags.signer, sig)
    } else {
      this.error(`Invalid role provided`)
      return
    }
    await displaySendTx('authorizeTx', tx)
  }
}

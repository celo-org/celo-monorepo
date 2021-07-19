import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetIndexedSigner extends BaseCommand {
  static description = 'Set the indexed signer for a specific role.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    role: flags.string({
      char: 'r',
      options: ['vote', 'validator', 'attestation'],
      description: 'Role to delegate',
      required: true,
    }),
    signer: Flags.address({ required: true }),
  }

  static examples = [
    'set-indexed-signer --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb',
  ]

  async run() {
    const res = this.parse(SetIndexedSigner)
    const accounts = await this.kit.contracts.getAccounts()

    const checker = newCheckBuilder(this).isAccount(res.flags.from)
    await checker.runChecks()

    let tx: any
    tx = await accounts.setIndexedSigner(res.flags.signer, res.flags.role)

    await displaySendTx('authorizeTx', tx)
  }
}

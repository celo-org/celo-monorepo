import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Authorize extends BaseCommand {
  static description = 'Authorize an attestation, validation or vote signing key'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    role: flags.string({
      char: 'r',
      options: ['vote', 'validation', 'attestation'],
      description: 'Role to delegate',
    }),
    to: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --to 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(Authorize)

    if (!res.flags.role) {
      this.error(`Specify role with --role`)
      return
    }

    if (!res.flags.to) {
      this.error(`Specify authorized address with --to`)
      return
    }

    this.kit.defaultAccount = res.flags.from
    const accounts = await this.kit.contracts.getAccounts()

    await newCheckBuilder(this)
      .isAccount(res.flags.from)
      .runChecks()

    let tx: any
    if (res.flags.role === 'vote') {
      tx = await accounts.authorizeVoteSigner(res.flags.from, res.flags.to)
    } else if (res.flags.role === 'validation') {
      tx = await accounts.authorizeValidationSigner(res.flags.from, res.flags.to)
    } else if (res.flags.role === 'attestation') {
      tx = await accounts.authorizeAttestationSigner(res.flags.from, res.flags.to)
    } else {
      this.error(`Invalid role provided`)
      return
    }
    await displaySendTx('authorizeTx', tx)
  }
}

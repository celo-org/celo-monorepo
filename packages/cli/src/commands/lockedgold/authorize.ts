import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Authorize extends BaseCommand {
  static description = 'Authorize validating or voting address for a Locked Gold account'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    role: flags.string({
      char: 'r',
      options: ['voter', 'validator'],
      description: 'Role to delegate',
    }),
    to: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'authorize --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role voter --to 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
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
    const lockedGold = await this.kit.contracts.getLockedGold()
    let tx: any
    if (res.flags.role === 'voter') {
      tx = await lockedGold.authorizeVoter(res.flags.from, res.flags.to)
    } else if (res.flags.role === 'validator') {
      tx = await lockedGold.authorizeValidator(res.flags.from, res.flags.to)
    } else {
      this.error(`Invalid role provided`)
      return
    }
    await displaySendTx('authorizeTx', tx)
  }
}

import { Roles } from '@celo/contractkit'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Delegate extends BaseCommand {
  static description = 'Delegate validating, voting and reward roles for Locked Gold account'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    role: flags.string({
      char: 'r',
      options: Object.keys(Roles),
      description: 'Role to delegate',
    }),
    to: Flags.address({ required: true }),
  }

  static args = []

  static examples = [
    'delegate --from=0x5409ED021D9299bf6814279A6A1411A7e866A631 --role Voting --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d',
  ]

  async run() {
    const res = this.parse(Delegate)

    if (!res.flags.role) {
      this.error(`Specify role with --role`)
      return
    }

    if (!res.flags.to) {
      this.error(`Specify delegate address with --to`)
      return
    }

    this.kit.defaultAccount = res.flags.from
    const lockedGold = await this.kit.contracts.getLockedGold()
    const tx = await lockedGold.delegateRoleTx(
      res.flags.from,
      res.flags.to,
      Roles[res.flags.role as keyof typeof Roles]
    )
    await displaySendTx('delegateRoleTx', tx)
  }
}

import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Rewards extends BaseCommand {
  static description = 'Manage rewards for Locked Gold account'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    redeem: flags.boolean({
      char: 'r',
      description: 'Redeem accrued rewards from Locked Gold',
      exclusive: ['delegate'],
    }),
    delegate: Flags.address({
      char: 'd',
      description: 'Delegate rewards to provided account',
      exclusive: ['redeem'],
    }),
  }

  static args = []

  static examples = [
    'rewards --redeem',
    'rewards --delegate=0x56e172F6CfB6c7D01C1574fa3E2Be7CC73269D95',
  ]

  async run() {
    const res = this.parse(Rewards)

    if (!res.flags.redeem && !res.flags.delegate) {
      this.error(`Specify action with --redeem or --delegate`)
      return
    }

    this.kit.defaultAccount = res.flags.from
    const lockedGold = await this.kit.contracts.getLockedGold()
    if (res.flags.redeem) {
      const tx = lockedGold.redeemRewards()
      await displaySendTx('redeemRewards', tx)
    }

    if (res.flags.delegate) {
      const tx = await lockedGold.delegateRewards(res.flags.from, res.flags.delegate)
      await displaySendTx('delegateRewards', tx)
    }
  }
}

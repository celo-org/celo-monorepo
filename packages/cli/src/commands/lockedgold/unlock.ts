import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Unlock extends BaseCommand {
  static description =
    'Unlocks CELO, which can be withdrawn after the unlocking period. Unlocked gold will appear as a "pending withdrawal" until the unlocking period is over, after which it can be withdrawn via "lockedgold:withdraw".'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    value: flags.string({ ...LockedGoldArgs.valueArg, required: true }),
  }

  static args = []

  static examples = ['unlock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 500000000']

  async run() {
    const res = this.parse(Unlock)

    const lockedgold = await this.kit.contracts.getLockedGold()
    const value = new BigNumber(res.flags.value)

    await newCheckBuilder(this, res.flags.from)
      .isAccount(res.flags.from)
      .isNotVoting(res.flags.from)
      .hasEnoughLockedGoldToUnlock(value)
      .runChecks()

    await displaySendTx('unlock', lockedgold.unlock(value))
  }
}

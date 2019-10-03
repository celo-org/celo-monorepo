import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Unlock extends BaseCommand {
  static description = 'Unlocks Celo Gold, which can be withdrawn after the unlocking period.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true }),
    goldAmount: flags.string({ ...LockedGoldArgs.goldAmountArg, required: true }),
  }

  static args = []

  static examples = ['unlock --goldAmount 500000000']

  async run() {
    const res = this.parse(Unlock)
    this.kit.defaultAccount = res.flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    await displaySendTx('unlock', lockedgold.unlock(res.flags.goldAmount))
  }
}

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
    value: flags.string({ ...LockedGoldArgs.valueArg, required: true }),
  }

  static args = []

  static examples = ['unlock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 500000000']

  async run() {
    const res = this.parse(Unlock)
    this.kit.defaultAccount = res.flags.from
    const lockedgold = await this.kit.contracts.getLockedGold()
    await displaySendTx('unlock', lockedgold.unlock(res.flags.value))
  }
}

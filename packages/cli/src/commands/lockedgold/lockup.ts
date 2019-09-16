import { Address } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Commitment extends BaseCommand {
  static description = 'Create a Locked Gold commitment given notice period and gold amount'

  static flags = {
    ...BaseCommand.flags,
    from: flags.string({ ...Flags.address, required: true }),
    noticePeriod: flags.string({ ...LockedGoldArgs.noticePeriodArg, required: true }),
    goldAmount: flags.string({ ...LockedGoldArgs.goldAmountArg, required: true }),
  }

  static args = []

  static examples = [
    'lockup --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --noticePeriod 8640 --goldAmount 1000000000000000000',
  ]

  async run() {
    const res = this.parse(Commitment)
    const address: Address = res.flags.from

    this.kit.defaultAccount = address
    const lockedGold = await this.kit.contracts.getLockedGold()

    const noticePeriod = new BigNumber(res.flags.noticePeriod)
    const goldAmount = new BigNumber(res.flags.goldAmount)

    if (!(await lockedGold.isVoting(address))) {
      failWith(`require(!isVoting(address)) => false`)
    }

    const maxNoticePeriod = await lockedGold.maxNoticePeriod()
    if (!maxNoticePeriod.gte(noticePeriod)) {
      failWith(`require(noticePeriod <= maxNoticePeriod) => [${noticePeriod}, ${maxNoticePeriod}]`)
    }
    if (!goldAmount.gt(new BigNumber(0))) {
      failWith(`require(goldAmount > 0) => [${goldAmount}]`)
    }

    // await displaySendTx('redeemRewards', lockedGold.methods.redeemRewards())
    const tx = lockedGold.newCommitment(noticePeriod.toString())
    await displaySendTx('lockup', tx, { value: goldAmount.toString() })
  }
}

import { LockedGold } from '@celo/walletkit'
import { flags } from '@oclif/command'
import Web3 from 'web3'
import { BaseCommand } from '../../base'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { Address } from '../../utils/helpers'
import { LockedGoldArgs } from '../../utils/lockedgold'
import { Op, requireCall } from '../../utils/require'

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
    const lockedGold = await LockedGold(this.web3, address)

    const noticePeriod = Web3.utils.toBN(res.flags.noticePeriod)
    const goldAmount = Web3.utils.toBN(res.flags.goldAmount)

    await requireCall(lockedGold.methods.isVoting(address), Op.EQ, false, '!isVoting(address)')

    const maxNoticePeriod = Web3.utils.toBN(await lockedGold.methods.maxNoticePeriod().call())
    if (!maxNoticePeriod.gte(noticePeriod)) {
      failWith(`require(noticePeriod <= maxNoticePeriod) => [${noticePeriod}, ${maxNoticePeriod}]`)
    }
    if (!goldAmount.gt(Web3.utils.toBN(0))) {
      failWith(`require(goldAmount > 0) => [${goldAmount}]`)
    }

    // await displaySendTx('redeemRewards', lockedGold.methods.redeemRewards())
    const tx = lockedGold.methods.newCommitment(noticePeriod.toString())
    await displaySendTx('lockup', tx, { value: goldAmount.toString() })
  }
}

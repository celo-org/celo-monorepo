import { Address } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Lock extends BaseCommand {
  static description = 'Locks Celo Gold to be used in governance and validator elections.'

  static flags = {
    ...BaseCommand.flags,
    from: flags.string({ ...Flags.address, required: true }),
    goldAmount: flags.string({ ...LockedGoldArgs.goldAmountArg, required: true }),
  }

  static args = []

  static examples = [
    'lock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --goldAmount 1000000000000000000',
  ]

  async run() {
    const res = this.parse(Lock)
    const address: Address = res.flags.from

    this.kit.defaultAccount = address
    const lockedGold = await this.kit.contracts.getLockedGold()

    const goldAmount = new BigNumber(res.flags.goldAmount)

    if (!goldAmount.gt(new BigNumber(0))) {
      failWith(`require(goldAmount > 0) => [${goldAmount}]`)
    }

    // TODO(asa): Why is this failing?
    const tx = lockedGold.lock()
    await displaySendTx('lock', tx, { value: goldAmount.toString() })
  }
}

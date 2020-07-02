import { Address } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Lock extends BaseCommand {
  static description = 'Locks CELO to be used in governance and validator elections.'

  static flags = {
    ...BaseCommand.flags,
    from: flags.string({ ...Flags.address, required: true }),
    value: flags.string({ ...LockedGoldArgs.valueArg, required: true }),
  }

  static args = []

  static examples = [
    'lock --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --value 10000000000000000000000',
  ]

  async run() {
    const res = this.parse(Lock)
    const address: Address = res.flags.from

    this.kit.defaultAccount = address
    const value = new BigNumber(res.flags.value)

    await newCheckBuilder(this)
      .addCheck(`Value [${value.toFixed()}] is > 0`, () => value.gt(0))
      .isAccount(address)
      .runChecks()

    const lockedGold = await this.kit.contracts.getLockedGold()
    const pendingWithdrawalsValue = await lockedGold.getPendingWithdrawalsTotalValue(address)
    const relockValue = BigNumber.minimum(pendingWithdrawalsValue, value)
    const lockValue = value.minus(relockValue)

    await newCheckBuilder(this)
      .hasEnoughGold(address, lockValue)
      .runChecks()

    const txos = await lockedGold.relock(address, relockValue)
    for (const txo of txos) {
      await displaySendTx('relock', txo, { from: address })
    }
    if (lockValue.gt(new BigNumber(0))) {
      const tx = lockedGold.lock()
      await displaySendTx('lock', tx, { value: lockValue.toFixed() })
    }
  }
}

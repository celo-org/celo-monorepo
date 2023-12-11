import { Address } from '@celo/connect'
import { toFixed } from '@celo/utils/src/fixidity'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Delegate extends BaseCommand {
  static description = 'Delegate locked celo.'

  static flags = {
    ...BaseCommand.flags,
    from: flags.string({ ...Flags.address, required: true }),
    to: flags.string({ ...Flags.address, required: true }),
    percent: flags.string({
      ...LockedGoldArgs.valueArg,
      required: true,
      description: '1-100% of locked celo to be delegated',
    }),
  }

  static args = []

  static examples = [
    'delegate --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --to 0xc0ffee254729296a45a3885639AC7E10F9d54979 --percent 100',
  ]

  async run() {
    const res = this.parse(Delegate)
    const address: Address = res.flags.from
    const to: Address = res.flags.to

    this.kit.defaultAccount = address
    const percent = new BigNumber(res.flags.percent).div(100)
    const percentFixed = toFixed(percent)

    await newCheckBuilder(this)
      .addCheck(`Value [${percentFixed}] is > 0 and <=100`, () => percent.gt(0) && percent.lte(100))
      .isAccount(address)
      .isAccount(to)
      .runChecks()

    const lockedGold = await this.kit.contracts.getLockedGold()

    console.log('value', percent.toString())
    console.log('valueFixed', percentFixed.toFixed())

    const tx = lockedGold.delegate(to, percentFixed.toFixed())
    await displaySendTx('delegate', tx)
  }
}

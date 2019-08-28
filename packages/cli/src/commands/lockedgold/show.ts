import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Show extends BaseCommand {
  static description = 'Show Locked Gold and corresponding account weight of a commitment given ID'

  static flags = {
    ...BaseCommand.flags,
    noticePeriod: flags.string({
      ...LockedGoldArgs.noticePeriodArg,
      exclusive: ['availabilityTime'],
    }),
    availabilityTime: flags.string({
      ...LockedGoldArgs.availabilityTimeArg,
      exclusive: ['noticePeriod'],
    }),
  }

  static args = [Args.address('account')]

  static examples = [
    'show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --noticePeriod=3600',
    'show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --availabilityTime=1562206887',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags, args } = this.parse(Show)

    if (!(flags.noticePeriod || flags.availabilityTime)) {
      this.error(`Specify commitment ID with --noticePeriod or --availabilityTime`)
      return
    }

    const lockedGold = await this.kit.contracts.getLockedGold()
    let value = new BigNumber(0)
    let contributingWeight = new BigNumber(0)
    if (flags.noticePeriod) {
      cli.action.start('Fetching Locked Gold commitment...')
      value = await lockedGold.getLockedCommitmentValue(args.account, flags.noticePeriod)
      contributingWeight = value.times(new BigNumber(flags.noticePeriod))
    }

    if (flags.availabilityTime) {
      cli.action.start('Fetching notified commitment...')
      value = await lockedGold.getNotifiedCommitmentValue(args.account, flags.availabilityTime)
      contributingWeight = value
    }

    cli.action.stop()

    cli.log(chalk.bold.yellow('Gold Locked \t') + value.toString())
    cli.log(chalk.bold.red('Account Weight Contributed \t') + contributingWeight.toString())
  }
}

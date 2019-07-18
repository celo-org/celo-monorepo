import { flags } from '@oclif/command'
import BN from 'bn.js'
import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BondedDepositAdapter } from '../../adapters/bonded-deposit'
import { BaseCommand } from '../../base'
import { BondArgs } from '../../utils/bonds'
import { Args } from '../../utils/command'

export default class Show extends BaseCommand {
  static description = 'View bonded gold and corresponding account weight of a deposit given ID'

  static flags = {
    ...BaseCommand.flags,
    noticePeriod: flags.string({
      ...BondArgs.noticePeriodArg,
      exclusive: ['availabilityTime'],
    }),
    availabilityTime: flags.string({
      ...BondArgs.availabilityTimeArg,
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
      this.error(`Specify bond ID with --noticePeriod or --availabilityTime`)
      return
    }

    const contract = await new BondedDepositAdapter(this.web3)
    let value = new BN(0)
    let contributingWeight = new BN(0)
    if (flags.noticePeriod) {
      cli.action.start('Fetching bonded deposit...')
      value = await contract.getBondedDepositValue(args.account, flags.noticePeriod)
      contributingWeight = value.mul(this.web3.utils.toBN(flags.noticePeriod))
    }

    if (flags.availabilityTime) {
      cli.action.start('Fetching notified deposit...')
      value = await contract.getNotifiedDepositValue(args.account, flags.availabilityTime)
      contributingWeight = value
    }

    cli.action.stop()

    cli.log(chalk.bold.yellow('Gold Bonded \t') + value.toString())
    cli.log(chalk.bold.red('Account Weight Contributed \t') + contributingWeight.toString())
  }
}

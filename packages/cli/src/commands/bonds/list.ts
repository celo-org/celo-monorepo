import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BondedDepositAdapter } from '../../adapters/bonded-deposit'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class List extends BaseCommand {
  static description = "View information about all of the account's deposits"

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('account')]

  static examples = ['list 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const { args } = this.parse(List)
    cli.action.start('Fetching deposits...')
    const deposits = await new BondedDepositAdapter(this.web3).getDeposits(args.account)
    cli.action.stop()

    cli.log(chalk.bold.yellow('Total Gold Bonded \t') + deposits.total.gold)
    cli.log(chalk.bold.red('Total Account Weight \t') + deposits.total.weight)
    if (deposits.bonded.length > 0) {
      cli.table(deposits.bonded, {
        noticePeriod: { header: 'NoticePeriod', get: (a) => a.time.toString() },
        value: { get: (a) => a.value.toString() },
      })
    }
    if (deposits.notified.length > 0) {
      cli.table(deposits.notified, {
        availabilityTime: { header: 'AvailabilityTime', get: (a) => a.time.toString() },
        value: { get: (a) => a.value.toString() },
      })
    }
  }
}

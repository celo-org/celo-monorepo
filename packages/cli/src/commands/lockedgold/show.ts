import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import chalk from 'chalk'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Args } from '../../utils/command'
import { LockedGoldArgs } from '../../utils/lockedgold'

export default class Show extends BaseCommand {
  static description = 'Show locked gold information for a given account'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('account')]

  static examples = ['show 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    // tslint:disable-next-line
    const { flags, args } = this.parse(Show)

    const lockedGold = await this.kit.contracts.getLockedGold()
    const nonvoting = await lockedGold.getAccountNonvotingLockedGold(args.account)
    const total = await lockedGold.getAccountTotalLockedGold(args.account)
    const voter = await lockedGold.getVoterFromAccount(args.account)
    const validator = await lockedGold.getValidatorFromAccount(args.account)
    const pendingWithdrawals = await lockedGold.getPendingWithdrawals(args.account)
    const info = {
      lockedGold: {
        total,
        nonvoting,
      },
      authorizations: {
        voter: voter == args.account ? null : voter,
        validator: validator == args.account ? null : validator,
      },
      pendingWithdrawals,
    }
    printValueMap(info)
  }
}

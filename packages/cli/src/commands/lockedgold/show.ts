import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Args } from '../../utils/command'
import { eqAddress } from '@celo/utils/lib/address'

export default class Show extends BaseCommand {
  static description = 'Show locked gold information for a given account'

  static flags = {
    ...BaseCommand.flags,
  }

  static args = [Args.address('account')]

  static examples = ['show 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    // tslint:disable-next-line
    const { args } = this.parse(Show)

    const lockedGold = await this.kit.contracts.getLockedGold()
    const nonvoting = (await lockedGold.getAccountNonvotingLockedGold(args.account)).toString()
    const total = (await lockedGold.getAccountTotalLockedGold(args.account)).toString()
    const voter = await lockedGold.getVoterFromAccount(args.account)
    const validator = await lockedGold.getValidatorFromAccount(args.account)
    const pendingWithdrawals = await lockedGold.getPendingWithdrawals(args.account)
    const info = {
      lockedGold: {
        total,
        nonvoting,
      },
      authorizations: {
        voter: eqAddress(voter, args.account) ? 'None' : voter,
        validator: eqAddress(validator, args.account) ? 'None' : validator,
      },
      pendingWithdrawals: pendingWithdrawals.length > 0 ? pendingWithdrawals : '[]',
    }
    printValueMapRecursive(info)
  }
}

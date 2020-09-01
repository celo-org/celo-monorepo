import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Withdraw extends BaseCommand {
  static description = 'Withdraw refunded governance proposal deposits.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Proposer's address" }),
  }

  static examples = ['withdraw --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Withdraw)

    await newCheckBuilder(this, res.flags.from)
      .hasRefundedDeposits(res.flags.from)
      .runChecks()

    const governance = await this.kit.contracts.getGovernance()
    await displaySendTx('withdraw', governance.withdraw(), {}, 'DepositWithdrawn')
  }
}

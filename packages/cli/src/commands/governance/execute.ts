import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Execute extends BaseCommand {
  static description = 'Execute a passing governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to execute' }),
    from: Flags.address({ required: true, description: "Executor's address" }),
  }

  static examples = ['execute --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Execute)
    const id = res.flags.proposalID
    const account = res.flags.from

    this.kit.defaultAccount = account
    await newCheckBuilder(this, account)
      .proposalExists(id)
      .proposalInStage(id, 'Execution')
      .proposalIsPassing(id)
      .runChecks()

    const governance = await this.kit.contracts.getGovernance()
    await displaySendTx('executeTx', await governance.execute(id), {}, 'ProposalExecuted')
  }
}

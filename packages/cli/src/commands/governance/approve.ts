import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Approve extends BaseCommand {
  static description = 'Approve a dequeued governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to approve' }),
    from: Flags.address({ required: true, description: "Approver's address" }),
  }

  static examples = ['approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Approve)
    const account = res.flags.from
    const id = res.flags.proposalID
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()

    // in case target is queued
    if (await governance.isQueued(id)) {
      await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
    }

    await newCheckBuilder(this)
      .isApprover(account)
      .proposalExists(id)
      .addCheck(`${id} not already approved`, async () => !(await governance.isApproved(id)))
      .proposalInStage(id, 'Approval')
      .runChecks()

    await displaySendTx('approveTx', await governance.approve(id), {}, 'ProposalApproved')
  }
}

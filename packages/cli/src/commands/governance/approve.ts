import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Approve extends BaseCommand {
  static description = 'Approve a dequeued governance proposal'

  // Only authorized approvers need to know about this command.
  static hidden = true

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to approve' }),
    from: Flags.address({ required: true, description: "Approver's address" }),
    useMultiSig: flags.boolean({
      description: 'True means the request will be sent through multisig.',
    }),
  }

  static examples = [
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --useMultiSig',
  ]

  async run() {
    const res = this.parse(Approve)
    const account = res.flags.from
    const useMultiSig = res.flags.useMultiSig
    const id = res.flags.proposalID
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()
    const multiSigAddress = useMultiSig ? await governance.getApprover() : ''
    const governanceApproverMultiSig = useMultiSig
      ? await this.kit.contracts.getMultiSig(multiSigAddress)
      : undefined
    const approver = useMultiSig ? multiSigAddress : account

    // in case target is queued
    if (await governance.isQueued(id)) {
      await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
    }

    await newCheckBuilder(this)
      .isApprover(approver)
      .addConditionalCheck(`${account} is multisig signatory`, useMultiSig, async () =>
        governanceApproverMultiSig !== undefined
          ? governanceApproverMultiSig.isowner(account)
          : new Promise<boolean>(() => false)
      )
      .proposalExists(id)
      .addCheck(`${id} not already approved`, async () => !(await governance.isApproved(id)))
      .proposalInStage(id, 'Approval')
      .runChecks()

    const governanceTx = await governance.approve(id)
    const tx =
      governanceApproverMultiSig === undefined
        ? governanceTx
        : await governanceApproverMultiSig.submitOrConfirmTransaction(
            governance.address,
            governanceTx.txo
          )
    await displaySendTx<string | void | boolean>('approveTx', tx, {}, 'ProposalApproved')
  }
}

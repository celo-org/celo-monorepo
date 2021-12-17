import { CeloTransactionObject } from '@celo/connect'
import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx, failWith } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Approve extends BaseCommand {
  static description = 'Approve a dequeued governance proposal (or hotfix)'

  static aliases = ['governance:approve', 'governance:approvehotfix']

  // Only authorized approvers need to know about this command.
  static hidden = true

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({
      description: 'UUID of proposal to approve',
      exclusive: ['hotfix'],
    }),
    from: Flags.address({ required: true, description: "Approver's address" }),
    useMultiSig: flags.boolean({
      description: 'True means the request will be sent through multisig.',
    }),
    hotfix: flags.string({
      exclusive: ['proposalID'],
      description: 'Hash of hotfix proposal',
    }),
  }

  static examples = [
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --useMultiSig',
    'approve --hotfix 0xfcfc98ec3db7c56f0866a7149e811bf7f9e30c9d40008b0def497fcc6fe90649 --from 0xCc50EaC48bA71343dC76852FAE1892c6Bd2971DA --useMultiSig',
  ]

  async run() {
    const res = this.parse(Approve)
    const account = res.flags.from
    const useMultiSig = res.flags.useMultiSig
    const id = res.flags.proposalID
    const hotfix = res.flags.hotfix
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()
    const governanceApproverMultiSig = useMultiSig
      ? await governance.getApproverMultisig()
      : undefined
    const approver = useMultiSig ? governanceApproverMultiSig!.address : account

    const checkBuilder = newCheckBuilder(this)
      .isApprover(approver)
      .addConditionalCheck(`${account} is multisig signatory`, useMultiSig, () =>
        governanceApproverMultiSig!.isowner(account)
      )

    let governanceTx: CeloTransactionObject<any>
    let logEvent: string
    if (id) {
      if (await governance.isQueued(id)) {
        await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
      }

      await checkBuilder
        .proposalExists(id)
        .proposalInStage(id, 'Approval')
        .addCheck(`${id} not already approved`, async () => !(await governance.isApproved(id)))
        .runChecks()
      governanceTx = await governance.approve(id)
      logEvent = 'ProposalApproved'
    } else if (hotfix) {
      const hotfixBuf = toBuffer(hotfix) as Buffer
      await checkBuilder.hotfixNotExecuted(hotfixBuf).hotfixNotApproved(hotfixBuf).runChecks()
      governanceTx = governance.approveHotfix(hotfixBuf)
      logEvent = 'HotfixApproved'
    } else {
      failWith('Proposal ID or hotfix must be provided')
    }

    const tx = useMultiSig
      ? await governanceApproverMultiSig!.submitOrConfirmTransaction(
          governance.address,
          governanceTx.txo
        )
      : governanceTx
    await displaySendTx<string | void | boolean>('approveTx', tx, {}, logEvent)
  }
}

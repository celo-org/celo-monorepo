import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ApproveHotfix extends BaseCommand {
  static description = 'Approve a governance hotfix'

  // Only authorized approvers need to know about this command.
  static hidden = true

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Approver's address" }),
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
    useMultiSig: flags.boolean({
      description: 'True means the request will be sent through multisig.',
    }),
  }

  static examples = [
    'approvehotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'approvehotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --useMultiSig',
  ]

  async run() {
    const res = this.parse(ApproveHotfix)
    const account = res.flags.from
    const useMultiSig = res.flags.useMultiSig
    const hash = toBuffer(res.flags.hash) as Buffer
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()
    const governanceApproverMultiSig = useMultiSig
      ? await governance.getApproverMultisig()
      : undefined
    const approver = useMultiSig ? governanceApproverMultiSig!.address : account

    await newCheckBuilder(this)
      .isApprover(approver)
      .addConditionalCheck(`${account} is multisig signatory`, useMultiSig, () =>
        governanceApproverMultiSig!.isowner(account)
      )
      .hotfixNotExecuted(hash)
      .runChecks()

    const governanceTx = governance.approveHotfix(hash)
    const tx = useMultiSig
      ? await governanceApproverMultiSig!.submitOrConfirmTransaction(
          governance.address,
          governanceTx.txo
        )
      : governanceTx
    await displaySendTx<string | void | boolean>('approveTx', tx, {})
  }
}

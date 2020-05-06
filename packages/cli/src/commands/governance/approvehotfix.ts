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
  }

  static examples = [
    'approvehotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(ApproveHotfix)
    const account = res.flags.from
    const hash = toBuffer(res.flags.hash) as Buffer
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()

    await newCheckBuilder(this)
      .isApprover(account)
      .hotfixNotExecuted(hash)
      .runChecks()

    await displaySendTx('approveTx', governance.approveHotfix(hash), {})
  }
}

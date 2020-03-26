import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Dequeue extends BaseCommand {
  static description = 'Try to dequeue governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to approve' }),
    from: Flags.address({ required: true, description: 'From address' }),
  }

  static examples = [
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
    'approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --useMultiSig',
  ]

  async run() {
    const res = this.parse(Dequeue)
    const account = res.flags.from
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()
    await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
  }
}

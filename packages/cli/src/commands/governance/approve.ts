import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Approve extends BaseCommand {
  static description = 'Approve a dequeued governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to approve' }),
    from: Flags.address({ required: true, description: "Approver's address" }),
  }

  static examples = []

  async run() {
    const res = this.parse(Approve)

    const governance = await this.kit.contracts.getGovernance()
    const tx = await governance.approve(res.flags.proposalID)
    await displaySendTx('approveTx', tx, { from: res.flags.from })
  }
}

import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'

export default class Dequeue extends BaseCommand {
  static description = 'Try to dequeue governance proposal'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'From address' }),
  }

  static examples = ['dequeue --from 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Dequeue)
    const account = res.flags.from
    this.kit.defaultAccount = account
    const governance = await this.kit.contracts.getGovernance()

    await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
  }
}

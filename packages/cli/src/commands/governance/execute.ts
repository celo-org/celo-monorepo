import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Execute extends BaseCommand {
  static description = 'Execute a passing governance proposal'

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to execute' }),
    from: Flags.address({ required: true, description: "Executor's address" }),
  }

  static examples = []

  async run() {
    const res = this.parse(Execute)

    const governance = await this.kit.contracts.getGovernance()

    const tx = await governance.execute(res.flags.proposalID)
    await displaySendTx('executeTx', tx, { from: res.flags.from })
  }
}

import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { buildProposalFromJsonFile } from '../../utils/governance'

export default class Propose extends BaseCommand {
  static description = 'Submit a governance proposal'

  static flags = {
    ...BaseCommand.flags,
    jsonTransactions: flags.string({ required: true, description: 'Path to json transactions' }),
    deposit: flags.string({ required: true, description: 'Amount of Gold to attach to proposal' }),
    from: Flags.address({ required: true, description: "Proposer's address" }),
  }

  static examples = []

  async run() {
    const res = this.parse(Propose)

    const governance = await this.kit.contracts.getGovernance()

    const proposal = await buildProposalFromJsonFile(this.kit, res.flags.jsonTransactions)
    const tx = governance.propose(proposal)
    await displaySendTx('proposeTx', tx, { from: res.flags.from, value: res.flags.deposit })
    // const proposalID = await tx.txo.call()
    // this.log(`ProposalID: ${proposalID}`)
  }
}

import {
  ProposalBuilder,
  proposalToJSON,
  ProposalTransactionJSON,
} from '@celo/contractkit/lib/governance/proposals'
import { flags } from '@oclif/command'
import { BigNumber } from 'bignumber.js'
import { readFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx, printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Propose extends BaseCommand {
  static description = 'Submit a governance proposal'

  static flags = {
    ...BaseCommand.flags,
    jsonTransactions: flags.string({ required: true, description: 'Path to json transactions' }),
    deposit: flags.string({ required: true, description: 'Amount of Gold to attach to proposal' }),
    from: Flags.address({ required: true, description: "Proposer's address" }),
    descriptionURL: flags.string({
      required: true,
      description: 'A URL where further information about the proposal can be viewed',
    }),
  }

  static examples = [
    'propose --jsonTransactions ./transactions.json --deposit 10000 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --descriptionURL https://gist.github.com/yorhodes/46430eacb8ed2f73f7bf79bef9d58a33',
  ]

  async run() {
    const res = this.parse(Propose)
    const account = res.flags.from
    const deposit = new BigNumber(res.flags.deposit)
    this.kit.defaultAccount = account

    await newCheckBuilder(this, account)
      .hasEnoughCelo(account, deposit)
      .exceedsProposalMinDeposit(deposit)
      .runChecks()

    const builder = new ProposalBuilder(this.kit)

    // BUILD FROM JSON
    const jsonString = readFileSync(res.flags.jsonTransactions).toString()
    const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)
    jsonTransactions.forEach((tx) => builder.addJsonTx(tx))

    // BUILD FROM CONTRACTKIT FUNCTIONS
    // const params = await this.kit.contracts.getBlockchainParameters()
    // builder.addTx(params.setMinimumClientVersion(1, 8, 24), { to: params.address })
    // builder.addWeb3Tx()
    // builder.addProxyRepointingTx

    const proposal = await builder.build()

    printValueMapRecursive(proposalToJSON(this.kit, proposal))

    const governance = await this.kit.contracts.getGovernance()
    await displaySendTx(
      'proposeTx',
      governance.propose(proposal, res.flags.descriptionURL),
      { value: res.flags.deposit },
      'ProposalQueued'
    )
  }
}

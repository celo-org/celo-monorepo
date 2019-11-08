import { readFileSync } from 'fs-extra'

import {
  JSONTransaction,
  TransactionBuilder,
} from '@celo/contractkit/lib/wrappers/TransactionBuilder'
import { flags } from '@oclif/command'

import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

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

    const jsonString = readFileSync(res.flags.jsonTransactions).toString()
    const jsonTransactions: JSONTransaction[] = JSON.parse(jsonString)
    const transactions = TransactionBuilder.fromCeloJsonTransactions(this.kit, jsonTransactions)

    const tx = governance.propose(transactions)
    await displaySendTx('proposeTx', tx, { from: res.flags.from, value: res.flags.deposit })
    const proposalID = await tx.txo.call()
    this.log(`ProposalID: ${proposalID}`)
  }
}

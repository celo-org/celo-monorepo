import { toTxResult } from '@celo/connect'
import { ProposalBuilder, proposalToJSON, ProposalTransactionJSON } from '@celo/governance'
import { flags } from '@oclif/command'
import { readFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'
export default class Propose extends BaseCommand {
  static description = 'Test a governance proposal'

  static flags = {
    ...BaseCommand.flags,
    jsonTransactions: flags.string({
      required: true,
      description: 'Path to json transactions',
    }),
    from: Flags.address({ required: true, description: "Proposer's address" }),
  }

  static examples = [
    'propose --jsonTransactions ./transactions.json --deposit 10000 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --descriptionURL https://gist.github.com/yorhodes/46430eacb8ed2f73f7bf79bef9d58a33',
  ]

  async run() {
    const res = this.parse(Propose)
    const account = res.flags.from
    this.kit.defaultAccount = account

    const builder = new ProposalBuilder(this.kit)

    // BUILD FROM JSON
    const jsonString = readFileSync(res.flags.jsonTransactions).toString()
    const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)
    jsonTransactions.forEach((tx) => builder.addJsonTx(tx))

    const proposal = await builder.build()
    printValueMapRecursive(await proposalToJSON(this.kit, proposal))

    for (let tx of proposal) {
      console.log(tx)
      if (!tx.to) {
        continue
      }

      let res = toTxResult(
        this.web3.eth.sendTransaction({ to: tx.to, from: account, value: tx.value, data: tx.input })
      )
      let receipt = await res.waitReceipt()
      console.log(receipt)
    }
  }
}

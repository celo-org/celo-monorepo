import {
  hotfixToHash,
  ProposalBuilder,
  ProposalTransactionJSON,
} from '@celo/contractkit/lib/governance/proposals'
import { trimLeading0x } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import { readFileSync } from 'fs-extra'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class HashHotfix extends BaseCommand {
  static description = 'Hash a governance hotfix specified by JSON and a salt'

  static flags = {
    ...BaseCommand.flags,
    jsonTransactions: flags.string({
      required: true,
      description: 'Path to json transactions of the hotfix',
    }),
    salt: flags.string({ required: true, description: 'Secret salt associated with hotfix' }),
  }

  static examples = [
    'hashhotfix --jsonTransactions ./transactions.json --salt 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658',
  ]

  async run() {
    const res = this.parse(HashHotfix)

    // Parse the transactions JSON file.
    const jsonString = readFileSync(res.flags.jsonTransactions).toString()
    const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)
    const builder = new ProposalBuilder(this.kit)
    jsonTransactions.forEach((tx) => builder.addJsonTx(tx))
    const hotfix = await builder.build()

    // Combine with the salt and hash the proposal.
    const saltBuff = Buffer.from(trimLeading0x(res.flags.salt), 'hex')
    console.log(`salt: ${res.flags.salt}, buf: ${saltBuff.toString('hex')}`)
    const hash = hotfixToHash(this.kit, hotfix, saltBuff)

    // Print the hash to the console.
    printValueMap({ hash: '0x' + hash.toString('hex') })
  }
}

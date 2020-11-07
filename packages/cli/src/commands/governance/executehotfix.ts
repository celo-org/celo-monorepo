import {
  hotfixToHash,
  ProposalBuilder,
  ProposalTransactionJSON,
} from '@celo/contractkit/lib/governance/proposals'
import { hexToBuffer } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import { readFileSync } from 'fs-extra'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ExecuteHotfix extends BaseCommand {
  static description = 'Execute a governance hotfix prepared for the current epoch'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Executors's address" }),
    jsonTransactions: flags.string({ required: true, description: 'Path to json transactions' }),
    salt: flags.string({ required: true, description: 'Secret salt associated with hotfix' }),
  }

  static examples = [
    'executehotfix --jsonTransactions ./transactions.json --salt 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(ExecuteHotfix)
    const account = res.flags.from
    this.kit.defaultAccount = account

    const jsonString = readFileSync(res.flags.jsonTransactions).toString()
    const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)

    const builder = new ProposalBuilder(this.kit)
    jsonTransactions.forEach((tx) => builder.addJsonTx(tx))
    const hotfix = await builder.build()
    const saltBuff = hexToBuffer(res.flags.salt)
    const hash = hotfixToHash(this.kit, hotfix, saltBuff)

    const governance = await this.kit.contracts.getGovernance()
    const record = await governance.getHotfixRecord(hash)

    await newCheckBuilder(this, account)
      .hotfixIsPassing(hash)
      .hotfixNotExecuted(hash)
      .addCheck(`Hotfix 0x${hash.toString('hex')} is prepared for current epoch`, async () => {
        const validators = await this.kit.contracts.getValidators()
        const currentEpoch = await validators.getEpochNumber()
        return record.preparedEpoch.eq(currentEpoch)
      })
      .addCheck(`Hotfix 0x${hash.toString('hex')} is approved`, () => record.approved)
      .runChecks()

    await displaySendTx(
      'executeHotfixTx',
      governance.executeHotfix(hotfix, saltBuff),
      {},
      'HotfixExecuted'
    )
  }
}

import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class PrepareHotfix extends BaseCommand {
  static description = 'Prepare a governance hotfix for execution in the current epoch'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Preparer's address" }),
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
  }

  static examples = [
    'preparehotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = this.parse(PrepareHotfix)
    const account = res.flags.from
    this.kit.defaultAccount = account

    const governance = await this.kit.contracts.getGovernance()
    const hash = toBuffer(res.flags.hash) as Buffer

    await newCheckBuilder(this, account)
      .hotfixIsPassing(hash)
      .hotfixNotExecuted(hash)
      .addCheck(
        `Hotfix 0x${hash.toString('hex')} not already prepared for current epoch`,
        async () => {
          const { preparedEpoch } = await governance.getHotfixRecord(hash)
          const validators = await this.kit.contracts.getValidators()
          const currentEpoch = await validators.getEpochNumber()
          return preparedEpoch.lt(currentEpoch)
        }
      )
      .runChecks()

    await displaySendTx('prepareHotfixTx', governance.prepareHotfix(hash), {}, 'HotfixPrepared')
  }
}

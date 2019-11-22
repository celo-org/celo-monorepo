import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class PrepareHotfix extends BaseCommand {
  static description = 'Prepare a governance hotfix for execution in the current epoch'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Preparer's address" }),
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
  }

  static examples = []

  async run() {
    const res = this.parse(PrepareHotfix)

    const governance = await this.kit.contracts.getGovernance()
    const hash = toBuffer(res.flags.hash) as Buffer
    const tx = governance.prepareHotfix(hash)
    await displaySendTx('prepareHotfixTx', tx, { from: res.flags.from })
  }
}

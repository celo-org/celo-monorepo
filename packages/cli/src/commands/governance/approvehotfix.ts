import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class ApproveHotfix extends BaseCommand {
  static description = 'Approve a governance hotfix'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Approver's address" }),
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
  }

  static examples = []

  async run() {
    const res = this.parse(ApproveHotfix)

    const governance = await this.kit.contracts.getGovernance()
    const hash = toBuffer(res.flags.hash) as Buffer
    const tx = governance.approveHotfix(hash)
    await displaySendTx('approveHotfixTx', tx, { from: res.flags.from })
  }
}

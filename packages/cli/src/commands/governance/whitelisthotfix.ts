import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class WhitelistHotfix extends BaseCommand {
  static description = 'Whitelist a governance hotfix'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: "Whitelister's address" }),
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
  }

  static examples = []

  async run() {
    const res = this.parse(WhitelistHotfix)

    const governance = await this.kit.contracts.getGovernance()
    const hash = toBuffer(res.flags.hash) as Buffer
    const tx = governance.whitelistHotfix(hash)
    await displaySendTx('whitelistHotfixTx', tx, { from: res.flags.from })
  }
}

import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
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
    const hash = toBuffer(res.flags.hash) as Buffer
    const account = res.flags.from
    this.kit.defaultAccount = account

    await newCheckBuilder(this)
      .hotfixNotExecuted(hash)
      .runChecks()

    const governance = await this.kit.contracts.getGovernance()
    await displaySendTx('whitelistHotfixTx', governance.whitelistHotfix(hash))
  }
}

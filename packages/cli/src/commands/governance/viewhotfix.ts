import { concurrentMap } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { printValueMap, printValueMapRecursive } from '../../utils/cli'

export default class ViewHotfix extends BaseCommand {
  static description = 'View information associated with hotfix'

  static flags = {
    ...BaseCommand.flags,
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
    notyet: flags.boolean({
      description: 'Whether to list validators who have or have not yet whitelisted',
    }),
  }

  static examples = [
    'viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658',
    'viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --notyet',
  ]

  async run() {
    const res = this.parse(ViewHotfix)

    const governance = await this.kit.contracts.getGovernance()
    const hash = toBuffer(res.flags.hash) as Buffer
    const record = await governance.getHotfixRecord(hash)
    printValueMap(record)

    const passing = await governance.isHotfixPassing(hash)
    printValueMap({ passing })
    if (!passing) {
      const tally = await governance.hotfixWhitelistValidatorTally(hash)
      const quorum = await governance.byzantineQuorumValidators()
      printValueMap({
        tally,
        quorum,
      })

      const validators = await this.kit.contracts.getValidators()
      const accounts = await validators.currentValidatorAccountsSet()
      const whitelist = await concurrentMap(5, accounts, async (validator) => {
        const whitelisted = await governance.isHotfixWhitelistedBy(hash, validator.signer)
        return (await governance.isHotfixWhitelistedBy(hash, validator.account)) || whitelisted
      })
      printValueMapRecursive({
        Validators: accounts.filter((_, idx) => res.flags.notyet !== whitelist[idx]),
      })
    }
  }
}

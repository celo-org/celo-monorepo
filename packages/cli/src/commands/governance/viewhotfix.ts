import { concurrentMap } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { printValueMap, printValueMapRecursive } from '../../utils/cli'

export default class ViewHotfix extends BaseCommand {
  static description = 'View information associated with hotfix'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    hash: flags.string({ required: true, description: 'Hash of hotfix transactions' }),
    whitelisters: flags.boolean({
      description: 'If set, displays validators that have whitelisted the hotfix.',
      exclusive: ['nonwhitelisters'],
    }),
    nonwhitelisters: flags.boolean({
      description: 'If set, displays validators that have not whitelisted the hotfix.',
      exclusive: ['whitelisters'],
    }),
  }

  static examples = [
    'viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658',
    'viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --whitelisters',
    'viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --nonwhitelisters',
  ]

  async run() {
    const res = this.parse(ViewHotfix)

    const governance = await this.kit.contracts.getGovernance()
    const hash = toBuffer(res.flags.hash) as Buffer
    const record = await governance.getHotfixRecord(hash)
    printValueMap(record)

    const passing = await governance.isHotfixPassing(hash)
    printValueMap({ passing })

    const tally = await governance.hotfixWhitelistValidatorTally(hash)
    const quorum = await governance.minQuorumSize()
    printValueMap({
      tally,
      quorum,
    })

    if (res.flags.whitelisters || res.flags.nonwhitelisters) {
      const validators = await this.kit.contracts.getValidators()
      const accounts = await validators.currentValidatorAccountsSet()
      const whitelist = await concurrentMap(
        5,
        accounts,
        async (validator) =>
          (await governance.isHotfixWhitelistedBy(hash, validator.signer)) ||
          /* tslint:disable-next-line no-return-await */
          (await governance.isHotfixWhitelistedBy(hash, validator.account))
      )
      printValueMapRecursive({
        Validators: accounts.filter((_, idx) => !!res.flags.whitelisters === whitelist[idx]),
      })
    }
  }
}

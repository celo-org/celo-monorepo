import { concurrentMap } from '@celo/utils/lib/async'
import { proposalToJSON } from '@celo/contractkit/lib/governance/proposals'
import { flags } from '@oclif/command'
import { toBuffer } from 'ethereumjs-util'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap, printValueMapRecursive } from '../../utils/cli'

export default class Show extends BaseCommand {
  static description = 'Show information about a governance proposal, hotfix, or account.'

  static flags = {
    ...BaseCommand.flags,
    raw: flags.boolean({ required: false, description: 'Display proposal in raw bytes format' }),
    proposalID: flags.string({
      exclusive: ['account', 'hotfix'],
      description: 'UUID of proposal to view',
    }),
    account: flags.string({
      exclusive: ['proposalID', 'hotfix'],
      description: 'Address of account or voter',
    }),
    hotfix: flags.string({
      exclusive: ['account', 'proposalID'],
      description: 'Hash of hotfix proposal',
    }),
    notwhitelisted: flags.boolean({
      description: 'List validators who have not whitelisted the speicified hotfix',
    }),
  }

  static examples = [
    'show --proposalID 99',
    'show --proposalID 99 --raw',
    'show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658',
    'show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --notwhitelisted',
    'show --account 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95',
  ]

  async run() {
    const res = this.parse(Show)
    const id = res.flags.proposalID
    const raw = res.flags.raw
    const account = res.flags.account
    const hotfix = res.flags.hotfix

    const governance = await this.kit.contracts.getGovernance()
    if (id) {
      await newCheckBuilder(this)
        .proposalExists(id)
        .runChecks()

      const record = await governance.getProposalRecord(id)
      if (!raw) {
        const jsonproposal = await proposalToJSON(this.kit, record.proposal)
        record.proposal = jsonproposal as any
      }
      printValueMapRecursive(record)
    } else if (hotfix) {
      const hotfixBuf = toBuffer(hotfix) as Buffer
      const record = await governance.getHotfixRecord(hotfixBuf)
      printValueMap(record)

      const passing = await governance.isHotfixPassing(hotfixBuf)
      printValueMap({ passing })
      if (!passing) {
        const tally = await governance.hotfixWhitelistValidatorTally(hotfixBuf)
        const quorum = await governance.minQuorumSize()
        printValueMap({
          tally,
          quorum,
        })

        const validators = await this.kit.contracts.getValidators()
        const accounts = await validators.currentValidatorAccountsSet()
        const whitelist = await concurrentMap(5, accounts, async (validator: any) => {
          const whitelisted = await governance.isHotfixWhitelistedBy(hotfixBuf, validator.signer)
          return (
            (await governance.isHotfixWhitelistedBy(hotfixBuf, validator.account)) || whitelisted
          )
        })
        printValueMapRecursive({
          Validators: accounts.filter((_, idx) => res.flags.notwhitelisted !== whitelist[idx]),
        })
      }
    } else if (account) {
      const accounts = await this.kit.contracts.getAccounts()
      printValueMapRecursive(await governance.getVoter(await accounts.signerToAccount(account)))
    }
  }
}

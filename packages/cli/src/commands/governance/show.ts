import { ProposalBuilder, proposalToJSON } from '@celo/governance'
import { concurrentMap } from '@celo/utils/lib/async'
import { toBuffer } from '@ethereumjs/util'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import { writeFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap, printValueMapRecursive } from '../../utils/cli'
import {
  addExistingProposalIDToBuilder,
  addExistingProposalJSONFileToBuilder,
} from '../../utils/governance'

export default class Show extends BaseCommand {
  static aliases = [
    'governance:show',
    'governance:showhotfix',
    'governance:showaccount',
    'governance:view',
    'governance:viewhotfix',
    'governance:viewaccount',
  ]

  static description = 'Show information about a governance proposal, hotfix, or account.'

  static flags = {
    ...BaseCommand.flags,
    raw: flags.boolean({ required: false, description: 'Display proposal in raw bytes format' }),
    jsonTransactions: flags.string({
      required: false,
      description: 'Output proposal JSON to provided file',
    }),
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
      description: 'List validators who have not whitelisted the specified hotfix',
    }),
    whitelisters: flags.boolean({
      description: 'If set, displays validators that have whitelisted the hotfix.',
      exclusive: ['nonwhitelisters', 'account', 'proposalID'],
    }),
    nonwhitelisters: flags.boolean({
      description: 'If set, displays validators that have not whitelisted the hotfix.',
      exclusive: ['whitelisters', 'account', 'proposalID'],
    }),
    afterExecutingProposal: flags.string({
      required: false,
      description: 'Path to proposal which will be executed prior to proposal',
      exclusive: ['afterExecutingID'],
    }),
    afterExecutingID: flags.string({
      required: false,
      description: 'Governance proposal identifier which will be executed prior to proposal',
      exclusive: ['afterExecutingProposal'],
    }),
  }

  static examples = [
    'show --proposalID 99',
    'show --proposalID 99 --raw',
    'show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658',
    'show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --whitelisters',
    'show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --nonwhitelisters',
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
      await newCheckBuilder(this).proposalExists(id).runChecks()

      const record = await governance.getProposalRecord(id)
      const proposal = record.proposal

      if (!raw) {
        const builder = new ProposalBuilder(this.kit)
        if (res.flags.afterExecutingID) {
          await addExistingProposalIDToBuilder(this.kit, builder, res.flags.afterExecutingID)
        } else if (res.flags.afterExecutingProposal) {
          await addExistingProposalJSONFileToBuilder(builder, res.flags.afterExecutingProposal)
        }
        try {
          console.log(chalk.cyanBright(`Parsing ${proposal.length} proposal transactions...`))
          const jsonproposal = await proposalToJSON(this.kit, proposal, builder.registryAdditions)
          record.proposal = jsonproposal as any

          if (res.flags.jsonTransactions) {
            console.log(
              chalk.yellowBright(`Outputting proposal JSON to ${res.flags.jsonTransactions}`)
            )
            writeFileSync(res.flags.jsonTransactions, JSON.stringify(jsonproposal, null, 2))
          }
        } catch (error) {
          console.warn(`Could not decode proposal, displaying raw data: ${error}`)
        }
      }

      let requirements = {}
      if (record.stage === 'Referendum' || record.stage === 'Execution') {
        // Identify the transaction with the highest constitutional requirement.
        const constitutionThreshold = await governance.getConstitution(proposal)
        const support = await governance.getSupportWithConstitutionThreshold(
          id,
          constitutionThreshold
        )
        requirements = {
          constitutionThreshold,
          ...support,
        }
      }

      const schedule = await governance.humanReadableProposalSchedule(id)
      printValueMapRecursive({
        ...record,
        schedule,
      })

      if (Object.keys(requirements).length !== 0) {
        console.log(
          'Note: required is the minimal amount of yes + abstain votes needed to pass the proposal'
        )
        printValueMapRecursive({
          requirements,
        })
      }
    } else if (hotfix) {
      const hotfixBuf = toBuffer(hotfix) as Buffer
      const record = await governance.getHotfixRecord(hotfixBuf)
      printValueMap(record)

      const passing = await governance.isHotfixPassing(hotfixBuf)
      printValueMap({ passing })
      const tally = await governance.hotfixWhitelistValidatorTally(hotfixBuf)
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
            (await governance.isHotfixWhitelistedBy(hotfixBuf, validator.signer)) ||
            /* tslint:disable-next-line no-return-await */
            (await governance.isHotfixWhitelistedBy(hotfixBuf, validator.account))
        )
        printValueMapRecursive({
          Validators: accounts.filter((_, idx) => !!res.flags.whitelisters === whitelist[idx]),
        })
      }
    } else if (account) {
      const accounts = await this.kit.contracts.getAccounts()
      printValueMapRecursive(await governance.getVoter(await accounts.signerToAccount(account)))
    }
  }
}

import { Address } from '@celo/contractkit/lib/base'
import { GroupVoterReward, VoterReward } from '@celo/contractkit/lib/wrappers/Election'
import { AccountSlashed } from '@celo/contractkit/lib/wrappers/LockedGold'
import { Validator, ValidatorReward } from '@celo/contractkit/lib/wrappers/Validators'
import { eqAddress } from '@celo/utils/lib/address'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

interface ExplainedVoterReward extends VoterReward {
  validators: Validator[]
}

interface ExplainedGroupVoterReward extends GroupVoterReward {
  validators: Validator[]
}

export default class Show extends BaseCommand {
  static description =
    'Show rewards information about a voter, registered Validator, or Validator Group'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
    estimate: flags.boolean({ description: 'Estimate voter rewards from current votes' }),
    voter: Flags.address({ description: 'Voter to show rewards for' }),
    validator: Flags.address({ description: 'Validator to show rewards for' }),
    group: Flags.address({ description: 'Validator Group to show rewards for' }),
    slashing: flags.boolean({ description: 'Show rewards for slashing', default: true }),
    epochs: flags.integer({
      default: 1,
      description: 'Show results for the last N epochs',
    }),
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)
    const filter =
      Boolean(res.flags.voter) || Boolean(res.flags.validator) || Boolean(res.flags.group)
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const lockedGold = await this.kit.contracts.getLockedGold()
    const currentEpoch = (await validators.getEpochNumber()).toNumber()
    const checkBuilder = newCheckBuilder(this)
    const epochs = Math.max(1, res.flags.epochs || 1)

    if (res.flags.validator) {
      if (res.flags.voter || res.flags.group) {
        throw Error('Cannot select --validator with --voter or --group')
      }
      checkBuilder.isValidator(res.flags.validator)
    }
    if (res.flags.group) {
      checkBuilder.isValidatorGroup(res.flags.group)
    }
    if (res.flags.voter) {
      checkBuilder.isAccount(res.flags.voter)
    }
    await checkBuilder.runChecks()

    let voterRewards: ExplainedVoterReward[] = []
    let groupVoterRewards: ExplainedGroupVoterReward[] = []
    let validatorRewards: ValidatorReward[] = []
    let validatorGroupRewards: ValidatorReward[] = []
    let accountsSlashed: AccountSlashed[] = []

    cli.action.start(`Calculating rewards`)
    // Accumulate the rewards from each epoch
    for (
      let epochNumber = Math.max(0, currentEpoch - epochs);
      epochNumber < currentEpoch;
      epochNumber++
    ) {
      if (!filter || res.flags.voter) {
        const electedValidators = await election.getElectedValidators(epochNumber)
        if (!filter) {
          const epochGroupVoterRewards = await election.getGroupVoterRewards(epochNumber)
          groupVoterRewards = groupVoterRewards.concat(
            epochGroupVoterRewards.map(
              (e: GroupVoterReward): ExplainedGroupVoterReward => ({
                ...e,
                validators: filterValidatorsByGroup(electedValidators, e.group.address),
              })
            )
          )
        } else if (res.flags.voter) {
          const address = res.flags.voter
          try {
            const epochVoterRewards = await election.getVoterRewards(
              address,
              epochNumber,
              res.flags.estimate ? await election.getVoterShare(address) : undefined
            )
            voterRewards = voterRewards.concat(
              epochVoterRewards.map(
                (e: VoterReward): ExplainedVoterReward => ({
                  ...e,
                  validators: filterValidatorsByGroup(electedValidators, e.group.address),
                })
              )
            )
          } catch (error) {
            if (error.message.includes('missing trie node')) {
              throw new Error(
                'Exact voter information is avaiable only for 1024 blocks after each epoch.\n' +
                  'Supply --estimate to estimate rewards based on current votes, or use an archive node.'
              )
            } else {
              throw error
            }
          }
        }
      }

      if (!filter || res.flags.validator || res.flags.group) {
        const epochValidatorRewards: ValidatorReward[] = await validators.getValidatorRewards(
          epochNumber
        )

        if (!filter || res.flags.validator) {
          const address = res.flags.validator
          validatorRewards = validatorRewards.concat(
            address
              ? epochValidatorRewards.filter((e: ValidatorReward) =>
                  eqAddress(e.validator.address, address)
                )
              : epochValidatorRewards
          )
        }

        if (!filter || res.flags.group) {
          const address = res.flags.group
          validatorGroupRewards = validatorGroupRewards.concat(
            address
              ? epochValidatorRewards.filter((e: ValidatorReward) =>
                  eqAddress(e.group.address, address)
                )
              : epochValidatorRewards
          )
        }
      }

      if (res.flags.slashing) {
        const epochAccountsSlashed = await lockedGold.getAccountsSlashed(epochNumber)
        const address = res.flags.voter || res.flags.validator || res.flags.group
        accountsSlashed = accountsSlashed.concat(
          address ? filterAccountsSlashed(epochAccountsSlashed, address) : epochAccountsSlashed
        )
      }
    }

    // Slashing rewards are available before the current epoch ends
    if (res.flags.slashing) {
      const epochAccountsSlashed = await lockedGold.getAccountsSlashed(currentEpoch)
      const address = res.flags.voter || res.flags.validator || res.flags.group
      accountsSlashed = accountsSlashed.concat(
        address ? filterAccountsSlashed(epochAccountsSlashed, address) : epochAccountsSlashed
      )
    }

    cli.action.stop()

    // At the end of each epoch: R, the total amount of rewards in gold to be allocated to stakers
    // for this epoch is programmatically derived from considering the tradeoff between paying rewards
    // now vs. saving rewards for later.
    //
    // Every validator group has a slashing penalty M, initially M=1.0. All rewards to the group and to
    // voters for the group are weighted by this factor.
    //
    // Let T be the total gold voting for groups eligible for rewards in this epoch. For each account
    // holder, for each group, the amount of gold the account holder has voting for that group is increased
    // by average_epoch_score_of_elected_validators_in_group * account_gold_voting_for_group * R * M / T.
    if (voterRewards.length > 0) {
      console.info('')
      console.info('Voter rewards:')
      cli.table(
        voterRewards,
        {
          address: {},
          addressPayment: { get: (e) => e.addressPayment.toFixed() },
          group: { get: (e) => e.group.address },
          averageValidatorScore: { get: (e) => averageValidatorScore(e.validators).toFixed() },
          epochNumber: {},
        },
        { 'no-truncate': !res.flags.truncate }
      )
    } else if (groupVoterRewards.length > 0) {
      console.info('')
      console.info('Group voter rewards:')
      cli.table(
        groupVoterRewards,
        {
          groupName: { get: (e) => e.group.name },
          group: { get: (e) => e.group.address },
          groupVoterPayment: { get: (e) => e.groupVoterPayment.toFixed() },
          averageValidatorScore: { get: (e) => averageValidatorScore(e.validators).toFixed() },
          epochNumber: {},
        },
        { 'no-truncate': !res.flags.truncate }
      )
    }

    // Each validator maintains a running validator score Sv:
    //
    // - At the end of an epoch, if a validator was elected, define its uptime:
    //   U = counter / (blocks_in_epoch - [9])
    //
    // - Define the validator’s epoch score:
    //   Sve = U ^ k, where k is governable.
    //
    // - If the validator is elected, Sv = min(Sve, Sve * x + Sv-1 * (1 -x)) where 0 < x < 1 and is
    //   governable. Otherwise, Sv = Sv-1
    //
    // At the end of each epoch, provided that the validator and its group have the required minimum
    // stake, Validators are paid Pv * Sv * M * (1 - C) Celo Dollars where
    // C is group share for the group the validator was a member of when it was elected and
    // Pv is the max payout to validators and is governable.
    if (validatorRewards.length > 0) {
      console.info('')
      console.info('Validator rewards:')
      cli.table(
        validatorRewards,
        {
          validatorName: { get: (e) => e.validator.name },
          validator: { get: (e) => e.validator.address },
          validatorPayment: { get: (e) => e.validatorPayment.toFixed() },
          validatorScore: { get: (e) => e.validator.score.toFixed() },
          group: { get: (e) => e.group.address },
          epochNumber: {},
        },
        { 'no-truncate': !res.flags.truncate }
      )
    }

    // At the end of each epoch, for each validator that was elected, the group a validator was
    // elected as a member of is paid Pv * Sv * C * M Celo Dollars where:
    // C is the current group share for the group the validator was a member of when it was elected,
    // Pv is the max payout to validators during this epoch programmatically derived from
    // considering the tradeoff between paying rewards now vs. saving rewards for later, and
    // M is the group’s current slashing penalty (M=1 initially, 0<M<=1)
    if (validatorGroupRewards.length > 0) {
      console.info('')
      console.info('Validator Group rewards:')
      cli.table(
        validatorGroupRewards,
        {
          groupName: { get: (e) => e.group.name },
          group: { get: (e) => e.group.address },
          groupPayment: { get: (e) => e.groupPayment.toFixed() },
          validator: { get: (e) => e.validator.address },
          validatorScore: { get: (e) => e.validator.score.toFixed() },
          epochNumber: {},
        },
        { 'no-truncate': !res.flags.truncate }
      )
    }

    if (accountsSlashed.length > 0) {
      console.info('')
      console.info('Slashing penalties and rewards:')
      cli.table(
        accountsSlashed,
        {
          slashed: {},
          penalty: { get: (e) => e.penalty.toFixed() },
          reporter: {},
          reward: { get: (e) => e.reward.toFixed() },
          epochNumber: {},
        },
        { 'no-truncate': !res.flags.truncate }
      )
    }

    if (
      voterRewards.length === 0 &&
      groupVoterRewards.length === 0 &&
      validatorRewards.length === 0 &&
      validatorGroupRewards.length === 0 &&
      accountsSlashed.length === 0
    ) {
      console.info('No rewards.')
    }
  }
}

function filterValidatorsByGroup(validators: Validator[], group: Address) {
  return validators.filter((v) => eqAddress(v.affiliation || '', group))
}

function averageValidatorScore(validators: Validator[]): BigNumber {
  return validators
    .reduce((sumScore: BigNumber, v: Validator) => sumScore.plus(v.score), new BigNumber(0))
    .dividedBy(validators.length || 1)
}

function filterAccountsSlashed(accountsSlashed: AccountSlashed[], address: Address) {
  return accountsSlashed.filter(
    (e: AccountSlashed) => eqAddress(e.slashed, address) || eqAddress(e.reporter, address)
  )
}

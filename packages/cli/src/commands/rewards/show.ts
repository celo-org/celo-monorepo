import { Validator, ValidatorGroup } from '@celo/contractkit/lib/wrappers/Validators'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { cli } from 'cli-ux'
import { EventLog } from 'web3/types'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

interface VoterReward {
  name: string
  group: string
  value: BigNumber
  blockNumber: number
  activeAddressVotes?: BigNumber
  activeGroupVotes?: BigNumber
}

interface ValidatorReward {
  name: string
  validator: string
  validatorPayment: BigNumber
  validatorScore: BigNumber
  group: string
  blockNumber: number
}

interface ValidatorGroupReward {
  name: string
  group: string
  validator: string
  groupPayment: BigNumber
  validatorScore: BigNumber
  blockNumber: number
}

export default class Show extends BaseCommand {
  static description =
    'Show rewards information about a voter, registered Validator, or Validator Group'

  static flags = {
    ...BaseCommand.flags,
    address: Flags.address({ description: 'Address to filter' }),
    epochs: flags.integer({
      default: 1,
      description: 'Show results for the last N epochs',
    }),
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - epochSize * ((res.flags.epochs || 1) - 1)
    const address = res.flags.address || ''
    let voterRewards: VoterReward[] = []
    let validatorRewards: ValidatorReward[] = []
    let validatorGroupRewards: ValidatorGroupReward[] = []

    if (address) {
      await newCheckBuilder(this)
        .isAccount(address)
        .runChecks()
    }

    // For each epoch...
    for (let blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize) {
      // Get the groups that address voted for at this epoch, and those groups' total votes.
      const activeAddressVotes: { [key: string]: BigNumber } = {}
      const activeGroupVotes: { [key: string]: BigNumber } = {}
      if (address) {
        const voter = await election.getVoter(address, blockNumber)
        for (const vote of voter.votes) {
          const group: string = vote.group.toLowerCase()
          activeAddressVotes[group] = (activeAddressVotes[group] || new BigNumber(0)).plus(
            vote.active
          )
          activeGroupVotes[group] = (activeGroupVotes[group] || new BigNumber(0)).plus(
            await election.getTotalVotesForGroup(group, blockNumber)
          )
        }
      }

      // voterRewardsEvent applies to address when voterRewardsEvent.group in activeAddressVotes.
      const epochVoterRewardsEvents = await election.getPastVoterRewards({
        fromBlock: blockNumber,
        toBlock: blockNumber,
      })

      const voterRewardsValidatorGroupDetails: ValidatorGroup[] = await concurrentMap(
        10,
        epochVoterRewardsEvents,
        (e: EventLog) => validators.getValidatorGroup(e.returnValues.group)
      )

      const epochVoterRewards = epochVoterRewardsEvents.map(
        (e: EventLog, index: number): VoterReward => ({
          name: voterRewardsValidatorGroupDetails[index].name,
          group: e.returnValues.group,
          value: e.returnValues.value,
          blockNumber: e.blockNumber,
          activeAddressVotes: activeAddressVotes[e.returnValues.group],
          activeGroupVotes: activeGroupVotes[e.returnValues.group],
        })
      )

      voterRewards = voterRewards.concat(
        address
          ? epochVoterRewards.filter(
              (e: VoterReward) => e.group.toLowerCase() in activeAddressVotes
            )
          : epochVoterRewards
      )

      // validatorRewardEvent applies to address when validatorRewardEvent.validator is address.
      const epochValidatorRewardsEvents = await validators.getPastValidatorRewards({
        fromBlock: blockNumber,
        toBlock: blockNumber,
      })

      const epochValidatorDetails: Validator[] = await concurrentMap(
        10,
        epochValidatorRewardsEvents,
        (e: EventLog) => validators.getValidator(e.returnValues.validator, blockNumber)
      )

      const epochValidatorRewards = epochValidatorRewardsEvents.map(
        (e: EventLog, index: number): ValidatorReward => ({
          name: epochValidatorDetails[index].name,
          validator: e.returnValues.validator,
          validatorPayment: e.returnValues.validatorPayment,
          validatorScore: epochValidatorDetails[index].score,
          group: e.returnValues.group,
          blockNumber: e.blockNumber,
        })
      )

      validatorRewards = validatorRewards.concat(
        address
          ? epochValidatorRewards.filter((e: ValidatorReward) => eqAddress(e.validator, address))
          : epochValidatorRewards
      )

      // validatorRewardEvent applies to address when validatorRewardEvent.group is address.
      const epochValidatorGroupDetails: ValidatorGroup[] = await concurrentMap(
        10,
        epochValidatorRewardsEvents,
        (e: EventLog) => validators.getValidatorGroup(e.returnValues.group)
      )

      const epochValidatorGroupRewards = epochValidatorRewardsEvents.map(
        (e: EventLog, index: number): ValidatorGroupReward => ({
          name: epochValidatorGroupDetails[index].name,
          group: e.returnValues.group,
          groupPayment: e.returnValues.groupPayment,
          validator: e.returnValues.validator,
          validatorScore: epochValidatorDetails[index].score,
          blockNumber: e.blockNumber,
        })
      )

      validatorGroupRewards = validatorGroupRewards.concat(
        address
          ? epochValidatorGroupRewards.filter((e: ValidatorGroupReward) =>
              eqAddress(e.group, address)
            )
          : epochValidatorGroupRewards
      )
    }

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
          name: {},
          group: {},
          value: {},
          myReward: {
            get: (e) =>
              e.activeAddressVotes && e.activeGroupVotes
                ? e.value.times(e.activeAddressVotes.dividedBy(e.activeGroupVotes))
                : '0',
          },
          blockNumber: {},
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
          name: {},
          validator: {},
          validatorPayment: {},
          validatorScore: { get: (e) => e.validatorScore.toFixed() },
          group: {},
          blockNumber: {},
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
          name: {},
          group: {},
          groupPayment: {},
          validator: {},
          validatorScore: { get: (e) => e.validatorScore.toFixed() },
          blockNumber: {},
        },
        { 'no-truncate': !res.flags.truncate }
      )
    }

    if (
      voterRewards.length === 0 &&
      validatorRewards.length === 0 &&
      validatorGroupRewards.length === 0
    ) {
      console.info('No rewards.')
    }
  }
}

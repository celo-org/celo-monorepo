import { cli } from 'cli-ux'
import { Flags } from '../../utils/command'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import BigNumber from 'bignumber.js'

export default class Show extends BaseCommand {
  static description = 'Show rewards.'

  static flags = {
    ...BaseCommand.flags,
    address: Flags.address({ required: false, description: 'Address to filter' }),
    group: Flags.address({ required: false, description: 'Group to filter' }),
    epochs: flags.integer({ required: false, description: 'Number of epochs' }),
    'no-truncate': flags.boolean({
      required: false,
      description: "Don't truncate fields to fit line",
    }),
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)
    const addressVotes: { [key: string]: BigNumber } = {}

    // Map the currently cast votes by address.
    if (res.flags.address) {
      await newCheckBuilder(this)
        .isAccount(res.flags.address)
        .runChecks()
      const election = await this.kit.contracts.getElection()
      const voter = await election.getVoter(res.flags.address)
      voter.votes.forEach(function(x) {
        const group: string = x.group.toLowerCase()
        addressVotes[group] = (addressVotes[group] || new BigNumber(0)).plus(x.pending)
      })
      printValueMapRecursive(voter)
    }

    // voterRewards applies to address when voterReward.group in addressVotes.
    const voterRewards = await this.getVoterRewards(
      res.flags.epochs,
      res.flags.address ? addressVotes : null
    )

    // validatorRewards applies to address when validatorReward.validator is address.
    const validatorRewards = await this.getValidatorRewards(res.flags.epochs, res.flags.address)

    const validatorDetails = await this.getValidatorDetails(validatorRewards, (x: any) =>
      x.returnValues.validator.toLowerCase()
    )

    const validatorGroupDetails = await this.getValidatorGroupDetails(voterRewards, (x: any) =>
      x.returnValues.group.toLowerCase()
    )

    cli.table(
      voterRewards,
      {
        name: {
          get: (x: any) => validatorGroupDetails[x.returnValues.group.toLowerCase()].name,
        },
        group: { get: (x: any) => x.returnValues.group },
        value: { get: (x: any) => x.returnValues.value },
        blockNumber: {},
      },
      { 'no-truncate': res.flags['no-truncate'] }
    )

    cli.table(
      validatorRewards,
      {
        name: {
          get: (x: any) => validatorDetails[x.returnValues.validator.toLowerCase()].name,
        },
        validator: { get: (x: any) => x.returnValues.validator },
        validatorPayment: { get: (x: any) => x.returnValues.validatorPayment },
        currentValidatorScore: {
          get: (x: any) => validatorDetails[x.returnValues.validator.toLowerCase()].score.toFixed(),
        },
        group: { get: (x: any) => x.returnValues.group },
        groupPayment: { get: (x: any) => x.returnValues.groupPayment },
        blockNumber: {},
      },
      { 'no-truncate': res.flags['no-truncate'] }
    )
  }

  // Gets EpochRewardsDistributedToVoters events with getEpochEvents().
  async getVoterRewards(epochs = 1, votes?: { [key: string]: BigNumber } | null) {
    var epochRewardsEvents = await this.getEpochEvents(
      await this.kit._web3Contracts.getElection(),
      'EpochRewardsDistributedToVoters',
      epochs
    )
    if (votes) {
      epochRewardsEvents = epochRewardsEvents.filter(
        (x: any) => x.returnValues.group.toLowerCase() in votes
      )
    }
    return epochRewardsEvents
  }

  // Gets ValidatorEpochPaymentDistributed events with getEpochEvents().
  async getValidatorRewards(epochs = 1, address?: string) {
    var validatorRewardsEvents = await this.getEpochEvents(
      await this.kit._web3Contracts.getValidators(),
      'ValidatorEpochPaymentDistributed',
      epochs
    )
    if (address) {
      const lowerAddress = address.toLowerCase()
      validatorRewardsEvents = validatorRewardsEvents.filter(
        (x: any) =>
          x.returnValues.validator.toLowerCase() == lowerAddress ||
          x.returnValues.group.toLowerCase() == lowerAddress
      )
    }
    return validatorRewardsEvents
  }

  // Gets Validator objects with Promise.all().
  async getValidatorDetails(listWithValidators: any, getValidatorAddress: any) {
    const validators = await this.kit.contracts.getValidators()
    const validatorDetails: { [key: string]: any } = {}
    for (const validator of listWithValidators) {
      const validatorAddress = getValidatorAddress(validator)
      // Better to use Promise.all()
      if (!(validatorAddress in validatorDetails))
        validatorDetails[validatorAddress] = await validators.getValidator(validatorAddress)
    }
    return validatorDetails
  }

  // Gets ValidatorGroup objects with Promise.all().
  async getValidatorGroupDetails(listWithValidatorGroups: any, getValidatorGroupAddress: any) {
    const validators = await this.kit.contracts.getValidators()
    const validatorGroupDetails: { [key: string]: any } = {}
    for (const validatorGroup of listWithValidatorGroups) {
      const validatorGroupAddress = getValidatorGroupAddress(validatorGroup)
      // Better to use Promise.all()
      if (!(validatorGroupAddress in validatorGroupDetails))
        validatorGroupDetails[validatorGroupAddress] = await validators.getValidatorGroup(
          validatorGroupAddress
        )
    }
    return validatorGroupDetails
  }

  /// Gets contract events from the last N epochs.
  async getEpochEvents(contract: any, eventName: string, epochs = 1) {
    const validators = await this.kit.contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - (epochSize - 1) * epochs
    // Better to call contract.getPastEvents() N times with fromBlock == toBlock?
    return await contract.getPastEvents(eventName, { fromBlock, toBlock: lastEpochBlock })
  }
}

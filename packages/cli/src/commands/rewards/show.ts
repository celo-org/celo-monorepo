import { flags } from '@oclif/command'
import BigNumber from 'bignumber.js'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { Flags } from '../../utils/command'

export default class Show extends BaseCommand {
  static description =
    'Show rewards information about a voter, registered Validator, or Validator Group'

  static flags = {
    ...BaseCommand.flags,
    address: Flags.address({ required: false, description: 'Address to filter' }),
    epochs: flags.integer({
      default: 1,
      required: false,
      description: 'Show results for the last N epochs',
    }),
    'no-truncate': flags.boolean({
      required: false,
      description: "Don't truncate fields to fit line",
    }),
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const electionContract = await this.kit._web3Contracts.getElection()
    const validatorsContract = await this.kit._web3Contracts.getValidators()
    const epochSize = await validators.getEpochSize()
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - epochSize * ((res.flags.epochs || 1) - 1)
    const addressVotes: { [key: number]: { [key: string]: BigNumber } } = {}
    const validatorDetails: { [key: number]: { [key: string]: any } } = {}
    const validatorGroupDetails: { [key: number]: { [key: string]: any } } = {}
    const lowerAddress = res.flags.address ? res.flags.address.toLowerCase() : res.flags.address
    let voterRewardsEvents: any[] = []
    let validatorRewardsEvents: any[] = []

    if (res.flags.address) {
      const address = res.flags.address
      await newCheckBuilder(this)
        .isAccount(address)
        .runChecks()
    }

    // For each epoch..
    for (let blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize) {
      // Get the groups that address voted for.
      if (res.flags.address) {
        const address = res.flags.address
        const voter = await election.getVoter(address, blockNumber)
        for (const vote of voter.votes) {
          const group: string = vote.group.toLowerCase()
          addressVotes[blockNumber][group] = (
            addressVotes[blockNumber][group] || new BigNumber(0)
          ).plus(vote.active)
        }
      }

      // voterReward applies to address when voterReward.group in addressVotes[voterReward.blockNumber].
      const epochVoterRewardsEvents = await electionContract.getPastEvents(
        'EpochRewardsDistributedToVoters',
        {
          fromBlock: blockNumber,
          toBlock: blockNumber,
        }
      )
      voterRewardsEvents = voterRewardsEvents.concat(
        res.flags.address
          ? epochVoterRewardsEvents.filter(
              (x: any) => x.returnValues.group.toLowerCase() in addressVotes[x.blockNumber]
            )
          : epochVoterRewardsEvents
      )

      // validatorReward applies to address when validatorReward.validator (or .group) is address.
      const epochValidatorRewardsEvents = await validatorsContract.getPastEvents(
        'ValidatorEpochPaymentDistributed',
        {
          fromBlock: blockNumber,
          toBlock: blockNumber,
        }
      )
      validatorRewardsEvents = validatorRewardsEvents.concat(
        res.flags.address
          ? epochValidatorRewardsEvents.filter(
              (x: any) =>
                x.returnValues.validator.toLowerCase() === lowerAddress ||
                x.returnValues.group.toLowerCase() === lowerAddress
            )
          : epochValidatorRewardsEvents
      )

      // Get the Validator scores.
      const uniqueValidators: { [key: string]: any } = {}
      for (const event of validatorRewardsEvents) {
        const validatorAddress = event.returnValues.validator.toLowerCase()
        if (!(validatorAddress in uniqueValidators)) {
          uniqueValidators[validatorAddress] = validators.getValidator(
            validatorAddress,
            blockNumber
          )
        }
      }
      validatorDetails[blockNumber] = await this.promisedProperties(uniqueValidators)

      // Get the Validator Group names.
      const uniqueValidatorGroups: { [key: string]: any } = {}
      for (const event of validatorRewardsEvents) {
        const validatorGroupAddress = event.returnValues.group.toLowerCase()
        if (!(validatorGroupAddress in uniqueValidatorGroups)) {
          uniqueValidatorGroups[validatorGroupAddress] = validators.getValidatorGroup(
            validatorGroupAddress
          )
        }
      }
      validatorGroupDetails[blockNumber] = await this.promisedProperties(uniqueValidatorGroups)
    }

    if (voterRewardsEvents.length > 0) {
      console.info('')
      console.info('Voter rewards:')
      cli.table(
        voterRewardsEvents,
        {
          name: {
            get: (x: any) =>
              validatorGroupDetails[x.blockNumber][x.returnValues.group.toLowerCase()].name,
          },
          group: { get: (x: any) => x.returnValues.group },
          value: { get: (x: any) => x.returnValues.value },
          blockNumber: {},
        },
        { 'no-truncate': res.flags['no-truncate'] }
      )
    }

    let validatorRewards = validatorRewardsEvents
    if (res.flags.address) {
      const address = res.flags.address.toLowerCase()
      validatorRewards = validatorRewardsEvents.filter(
        (x: any) => x.returnValues.validator.toLowerCase() === address
      )
    }

    if (validatorRewards.length > 0) {
      console.info('')
      console.info('Validator rewards:')
      cli.table(
        validatorRewards,
        {
          name: {
            get: (x: any) =>
              validatorDetails[x.blockNumber][x.returnValues.validator.toLowerCase()].name,
          },
          validator: { get: (x: any) => x.returnValues.validator },
          validatorPayment: { get: (x: any) => x.returnValues.validatorPayment },
          validatorScore: {
            get: (x: any) =>
              validatorDetails[x.blockNumber][
                x.returnValues.validator.toLowerCase()
              ].score.toFixed(),
          },
          group: { get: (x: any) => x.returnValues.group },
          blockNumber: {},
        },
        { 'no-truncate': res.flags['no-truncate'] }
      )
    }

    let validatorGroupRewards = validatorRewardsEvents
    if (res.flags.address) {
      const address = res.flags.address.toLowerCase()
      validatorGroupRewards = validatorRewardsEvents.filter(
        (x: any) => x.returnValues.group.toLowerCase() === address
      )
    }

    if (validatorGroupRewards.length > 0) {
      console.info('')
      console.info('Validator Group rewards:')
      cli.table(
        validatorGroupRewards,
        {
          name: {
            get: (x: any) =>
              validatorGroupDetails[x.blockNumber][x.returnValues.group.toLowerCase()].name,
          },
          group: { get: (x: any) => x.returnValues.group },
          groupPayment: { get: (x: any) => x.returnValues.groupPayment },
          validator: { get: (x: any) => x.returnValues.validator },
          validatorScore: {
            get: (x: any) =>
              validatorDetails[x.blockNumber][
                x.returnValues.validator.toLowerCase()
              ].score.toFixed(),
          },
          blockNumber: {},
        },
        { 'no-truncate': res.flags['no-truncate'] }
      )
    }

    if (
      voterRewardsEvents.length === 0 &&
      validatorRewards.length === 0 &&
      validatorGroupRewards.length === 0
    ) {
      console.info('No rewards.')
    }
  }

  // Return the object with Promise properties resolved.
  promisedProperties(object: { [key: string]: any }) {
    const properties: any[] = []
    const objectKeys = Object.keys(object)
    objectKeys.forEach((key) => properties.push(object[key]))
    return Promise.all(properties).then((resolvedValues) => {
      return resolvedValues.reduce((resolvedObject, property, index) => {
        resolvedObject[objectKeys[index]] = property
        return resolvedObject
      }, object)
    })
  }
}

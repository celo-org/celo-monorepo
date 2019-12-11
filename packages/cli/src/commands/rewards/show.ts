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
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const epochSize = await validators.getEpochSize()

    // Map the votes cast by address at each epoch.
    let addressVotes: { [key: number]: { [key: string]: BigNumber } } = {}
    if (res.flags.address) {
      const address = res.flags.address
      await newCheckBuilder(this)
        .isAccount(address)
        .runChecks()

      addressVotes = await this.mapEachEpochAsync(
        async (blockNumber: number) => {
          const voter = await election.getVoter(address, blockNumber)
          const votes: { [key: string]: BigNumber } = {}
          voter.votes.forEach((x) => {
            const group: string = x.group.toLowerCase()
            votes[group] = (votes[group] || new BigNumber(0)).plus(x.active)
          })
          return votes
        },
        epochSize,
        res.flags.epochs
      )
    }

    // voterRewards applies to address when voterReward.group in addressVotes[voterReward.blockNumber].
    const voterRewardsEvents = await this.getVoterRewardEvents(
      epochSize,
      res.flags.epochs,
      res.flags.address ? addressVotes : null
    )

    // validatorRewards applies to address when validatorReward.validator (or .group) is address.
    const validatorRewardsEvents = await this.getValidatorRewardEvents(
      epochSize,
      res.flags.epochs,
      res.flags.address
    )

    // Get the Validator scores at each epoch.
    const validatorDetails = await this.mapEachEpochAsync(
      (blockNumber: number) =>
        this.getUniqueValidators(
          validatorRewardsEvents,
          (x: any) => x.returnValues.validator.toLowerCase(),
          blockNumber
        ),
      epochSize,
      res.flags.epochs
    )

    // For correctness use the Validator Group name at each epoch?
    const validatorGroupDetails = await this.getUniqueValidatorGroups(
      voterRewardsEvents,
      (x: any) => x.returnValues.group.toLowerCase()
    )

    if (voterRewardsEvents.length > 0) {
      console.info('')
      console.info('Voter rewards:')
      cli.table(
        voterRewardsEvents,
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
            get: (x: any) => validatorGroupDetails[x.returnValues.group.toLowerCase()].name,
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
      voterRewardsEvents.length == 0 &&
      validatorRewards.length == 0 &&
      validatorGroupRewards.length == 0
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

  // Returns contract events from the last N epochs.
  async getEpochEvents(contract: any, eventName: string, epochSize: number, epochs = 1) {
    return [].concat.apply(
      [],
      await this.forEachEpochAsync(
        (blockNumber: number) =>
          contract.getPastEvents(eventName, { fromBlock: blockNumber, toBlock: blockNumber }),
        epochSize,
        epochs
      )
    )
  }

  // Returns array of await callback(blockNumber) for the last N epochs.
  async forEachEpochAsync(callback: any, epochSize: number, epochs = 1) {
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - epochSize * (epochs - 1)
    const results = []
    for (let blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize) {
      results.push(callback(blockNumber))
    }
    return Promise.all(results)
  }

  // Returns map from block number to await callback(blockNumber) for the last N epochs.
  async mapEachEpochAsync(callback: any, epochSize: number, epochs = 1) {
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - epochSize * (epochs - 1)
    const promises = []
    for (let blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize) {
      promises.push(callback(blockNumber))
    }
    const results = await Promise.all(promises)

    let index = 0
    const dict: { [key: number]: any } = {}
    for (let blockNumber = fromBlock; blockNumber <= lastEpochBlock; blockNumber += epochSize) {
      dict[blockNumber] = results[index++]
    }
    return dict
  }

  // Returns filtered EpochRewardsDistributedToVoters events for the last N epochs.
  async getVoterRewardEvents(
    epochSize: number,
    epochs = 1,
    groupFilter?: { [key: number]: { [key: string]: BigNumber } } | null
  ) {
    let voterRewardsEvents = await this.getEpochEvents(
      await this.kit._web3Contracts.getElection(),
      'EpochRewardsDistributedToVoters',
      epochSize,
      epochs
    )
    if (groupFilter) {
      voterRewardsEvents = voterRewardsEvents.filter(
        (x: any) => x.returnValues.group.toLowerCase() in groupFilter[x.blockNumber]
      )
    }
    return voterRewardsEvents
  }

  // Returns filtered ValidatorEpochPaymentDistributed events for the last N epochs.
  async getValidatorRewardEvents(epochSize: number, epochs = 1, addressFilter?: string) {
    let validatorRewardsEvents = await this.getEpochEvents(
      await this.kit._web3Contracts.getValidators(),
      'ValidatorEpochPaymentDistributed',
      epochSize,
      epochs
    )
    if (addressFilter) {
      const lowerAddressFilter = addressFilter.toLowerCase()
      validatorRewardsEvents = validatorRewardsEvents.filter(
        (x: any) =>
          x.returnValues.validator.toLowerCase() === lowerAddressFilter ||
          x.returnValues.group.toLowerCase() === lowerAddressFilter
      )
    }
    return validatorRewardsEvents
  }

  // Returns map from Validator address to Validator.
  async getUniqueValidators(
    listWithValidators: any,
    getValidatorAddress: any,
    blockNumber?: number
  ) {
    const validators = await this.kit.contracts.getValidators()
    const uniqueValidators: { [key: string]: any } = {}
    for (const validator of listWithValidators) {
      const validatorAddress = getValidatorAddress(validator)
      if (!(validatorAddress in uniqueValidators)) {
        uniqueValidators[validatorAddress] = validators.getValidator(validatorAddress, blockNumber)
      }
    }
    return this.promisedProperties(uniqueValidators)
  }

  // Returns map from ValidatorGroup address to ValidatorGroup.
  async getUniqueValidatorGroups(listWithValidatorGroups: any, getValidatorGroupAddress: any) {
    const validators = await this.kit.contracts.getValidators()
    const uniqueValidatorGroups: { [key: string]: any } = {}
    for (const validatorGroup of listWithValidatorGroups) {
      const validatorGroupAddress = getValidatorGroupAddress(validatorGroup)
      if (!(validatorGroupAddress in uniqueValidatorGroups)) {
        uniqueValidatorGroups[validatorGroupAddress] = validators.getValidatorGroup(
          validatorGroupAddress
        )
      }
    }
    return this.promisedProperties(uniqueValidatorGroups)
  }
}

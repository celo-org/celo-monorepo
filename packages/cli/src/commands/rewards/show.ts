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
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)
    var votes: { [key: string]: BigNumber }

    if (res.flags.address) {
      await newCheckBuilder(this)
        .isAccount(res.flags.address)
        .runChecks()

      const election = await this.kit.contracts.getElection()
      const voter = await election.getVoter(res.flags.address)
      printValueMapRecursive(voter)

      votes = {}
      voter.votes.forEach(function(x) {
        const group: string = x.group.toLowerCase()
        votes[group] = (votes[group] || new BigNumber(0)).plus(x.pending)
      })
    }

    const voterRewards = await this.getVoterRewards(res.flags.epochs, votes)
    const validatorRewards = await this.getValidatorRewards(res.flags.epochs, res.flags.address)

    cli.table(voterRewards, {
      group: { get: (x: any) => x.returnValues.group },
      value: { get: (x: any) => x.returnValues.value },
      blockNumber: {},
    })

    cli.table(validatorRewards, {
      validator: { get: (x: any) => x.returnValues.validator },
      validatorPayment: { get: (x: any) => x.returnValues.validatorPayment },
      group: { get: (x: any) => x.returnValues.group },
      groupPayment: { get: (x: any) => x.returnValues.groupPayment },
      blockNumber: {},
    })
  }

  async getVoterRewards(epochs = 1, votes?: object) {
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

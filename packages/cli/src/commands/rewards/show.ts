import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { flags } from '@oclif/command'

export default class Show extends BaseCommand {
  static description = 'Show rewards.'

  static flags = {
    ...BaseCommand.flags,
    address: Flags.address({ required: false, description: 'Address to filter' }),
    epochs: flags.integer({ required: false, description: 'Number of epochs' }),
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)

    const voterRewards = await this.getVoterRewards(res.flags.epochs, res.flags.address)
    printValueMapRecursive(voterRewards)

    const validatorRewards = await this.getValidatorRewards(res.flags.epochs, res.flags.address)
    printValueMapRecursive(validatorRewards)
  }

  async getVoterRewards(epochs = 1, address?: string) {
    var epochRewardsEvents = await this.getEpochEvents(
      await this.kit._web3Contracts.getElection(),
      'EpochRewardsDistributedToVoters',
      epochs
    )
    if (address) {
      const lowerAddress = address.toLowerCase()
      epochRewardsEvents = epochRewardsEvents.filter(
        (e: any) => e.returnValues.group.toLowerCase() == lowerAddress
      )
    }
    return epochRewardsEvents.map((e: any) => ({
      group: e.returnValues.group,
      value: e.returnValues.value,
    }))
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
        (e: any) =>
          e.returnValues.validator.toLowerCase() == lowerAddress ||
          e.returnValues.group.toLowerCase() == lowerAddress
      )
    }
    return validatorRewardsEvents.map((e: any) => ({
      validator: e.returnValues.validator,
      validatorPayment: e.returnValues.validatorPayment,
      group: e.returnValues.group,
      groupPayment: e.returnValues.groupPayment,
    }))
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

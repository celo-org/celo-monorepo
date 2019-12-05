import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Show extends BaseCommand {
  static description = 'Show rewards.'

  static flags = {
    ...BaseCommand.flags,
    address: Flags.address({ required: false }),
  }

  static args = []

  static examples = ['show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  async run() {
    const res = this.parse(Show)
    //voterRewards = await this.getValidatorRewards(1, res.flags.address)
    const validatorRewards = await this.getValidatorRewards(1, res.flags.address)
    printValueMapRecursive(validatorRewards)
  }

  async getVoterRewards(epochs = 1, address?: string) {
    const election = await this.kit._web3Contracts.getElection()
    const epochSize = 1000 // await election.getEpochSize()
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - (epochSize - 1) * epochs
    var epochRewardsEvents = await election.getPastEvents('EpochRewardsDistributedToVoters', {
      fromBlock,
      toBlock: lastEpochBlock,
    })
    console.log(epochs + ' ' + address)
    //if (address) epochRewardsEvents = epochRewardsEvents.filter((e) => e.address == address)
    console.log(epochRewardsEvents[0])
    return epochRewardsEvents
  }

  async getValidatorRewards(epochs = 1, address?: string) {
    const validatorsContract = await this.kit._web3Contracts.getValidators()
    const validators = await this.kit.contracts.getValidators()
    const epochSize = 1000 // await validators.getEpochSize()
    const currentBlock = await this.web3.eth.getBlockNumber()
    const lastEpochBlock = Math.floor(currentBlock / epochSize) * epochSize
    const fromBlock: number = lastEpochBlock - (epochSize - 1) * epochs
    var validatorRewardsEvents = await validatorsContract.getPastEvents(
      'ValidatorEpochPaymentDistributed',
      { fromBlock, toBlock: lastEpochBlock }
    )
    if (address) {
      const lowerAddress = address.toLowerCase()
      validatorRewardsEvents = validatorRewardsEvents.filter(
        (e) => e.returnValues.validator.toLowerCase() == lowerAddress
      )
    }
    return validatorRewardsEvents.map((e) => ({
      validator: e.returnValues.validator,
      validatorPayment: e.returnValues.validatorPayment,
      group: e.returnValues.group,
      groupPayment: e.returnValues.groupPayment,
    }))
  }
}

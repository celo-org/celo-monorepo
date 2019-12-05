import { BaseCommand } from '../../base'
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
    const currentBlock = await this.web3.eth.getBlockNumber()
    console.log('address: ' + res.flags.address)
    console.log('currentBlock: ' + currentBlock)
    const epochRewards = await this.kit._web3Contracts.getEpochRewards()
    const validators = await this.kit._web3Contracts.getValidators()
    const election = await this.kit._web3Contracts.getElection()
    const fromBlock = currentBlock - 10000

    const epochRewardsEvents = await epochRewards.getPastEvents(
      'allevents', // 'TargetVotingYieldUpdated',
      { fromBlock }
    )
    const validatorRewardsEvents = await validators.getPastEvents(
      'allevents', // 'ValidatorEpochPaymentDistributed',
      { fromBlock }
    )
    const electionRewardsEvents = await election.getPastEvents(
      'allevents', // 'EpochRewardsDistributedToVoters',
      { fromBlock }
    )
    console.log(epochRewardsEvents)
    console.log(validatorRewardsEvents)
    console.log(electionRewardsEvents)
    /* address: undefined
       currentBlock: 54200
       []
       []
       [] */
  }
}

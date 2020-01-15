import { CeloContract } from '@celo/contractkit'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { validatorTable } from '../validator/list'

export default class ElectionCurrent extends BaseCommand {
  static description =
    'Outputs the set of validators currently participating in BFT to create blocks. An election is run to select the validator set at the end of every epoch.'

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {
    const res = this.parse(ElectionCurrent)
    cli.action.start('Fetching currently elected Validators')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const epochRewards = await this.kit.contracts.getEpochRewards()
    const sortedOracles = await this.kit.contracts.getSortedOracles()
    const blockNumber = await this.kit.web3.eth.getBlockNumber()

    console.info(`BlockNumber ${blockNumber}`)

    const medianRate = await sortedOracles.medianRate(CeloContract.StableToken)
    console.info(`SortedOrackles.medianRate ${medianRate.rate}`)

    const frozen = await epochRewards.frozen()
    console.info(`EpochRewards.frozen ${frozen}`)

    const targetEpochRewards = await epochRewards.getTargetEpochRewards()
    console.info(`EpochRewards.getTargetEpochRewards ${targetEpochRewards}`)

    const electableValidators = await election.electableValidators()
    console.info(`minVals ${electableValidators.min}`)

    /*const numVals = await election.numberValidatorsInCurrentSet()
    console.info(`numVals ${numVals}`)

    const targetTotalEpochPaymentsInGold = await epochRewards.getTargetTotalEpochPaymentsInGold()
    console.info(`EpochRewards.getTargetTotalEpochPaymentsInGold ${targetTotalEpochPaymentsInGold}`)

    const rewardsMultiplier = await epochRewards.getRewardsMultiplier()
    console.info(`EpochRewards.getRewardsMultiplier ${rewardsMultiplier}`)
     */

    const targetVotingGoldFraction = await epochRewards.getTargetVotingGoldFraction()
    console.info(`targetVotingGoldFraction ${targetVotingGoldFraction}`)
    const votingGoldFraction = await epochRewards.getVotingGoldFraction()
    console.info(`votingGoldFraction ${votingGoldFraction}`)
    const params = await epochRewards.getTargetVotingYieldParameters()
    console.info(`targetVotingYieldParameters.target = ${params.target}`)
    console.info(`targetVotingYieldParameters.max = ${params.max}`)
    console.info(`targetVotingYieldParameters.adjustmentFactor = ${params.adjustmentFactor}`)

    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    cli.action.stop()
    cli.table(validatorList, validatorTable, { 'no-truncate': !res.flags.truncate })
  }
}

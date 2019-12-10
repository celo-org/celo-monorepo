import { cli } from 'cli-ux'
import { Flags } from '../../utils/command'
import { flags } from '@oclif/command'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMapRecursive } from '../../utils/cli'
import { mapEachEpochAsync } from '@celo/contractkit/lib/utils/web3-utils'
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
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const epochSize = await validators.getEpochSize()

    // Map the votes cast by address at each epoch.
    var addressVotes: { [key: number]: { [key: string]: BigNumber } }
    if (res.flags.address) {
      const address = res.flags.address
      await newCheckBuilder(this)
        .isAccount(address)
        .runChecks()

      addressVotes = await mapEachEpochAsync(
        this.web3,
        async (blockNumber: number) => {
          const voter = await election.getVoter(address, blockNumber)
          printValueMapRecursive(voter)

          const votes: { [key: string]: BigNumber } = {}
          voter.votes.forEach(function(x) {
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
    const voterRewards = await election.getVoterRewardEvents(
      epochSize,
      res.flags.epochs,
      res.flags.address ? addressVotes : null
    )

    // validatorRewards applies to address when validatorReward.validator is address.
    const validatorRewards = await validators.getValidatorRewardEvents(
      epochSize,
      res.flags.epochs,
      res.flags.address
    )

    // Get the Validator scores at each epoch
    const validatorDetails = await mapEachEpochAsync(
      this.web3,
      (blockNumber: number) =>
        validators.getUniqueValidators(
          validatorRewards,
          (x: any) => x.returnValues.validator.toLowerCase(),
          blockNumber
        ),
      epochSize,
      res.flags.epochs
    )

    // For correctness use the Validator Group name at each epoch?
    const validatorGroupDetails = await validators.getUniqueValidatorGroups(
      voterRewards,
      (x: any) => x.returnValues.group.toLowerCase()
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
          get: (x: any) =>
            validatorDetails[x.blockNumber][x.returnValues.validator.toLowerCase()].name,
        },
        validator: { get: (x: any) => x.returnValues.validator },
        validatorPayment: { get: (x: any) => x.returnValues.validatorPayment },
        currentValidatorScore: {
          get: (x: any) =>
            validatorDetails[x.blockNumber][x.returnValues.validator.toLowerCase()].score.toFixed(),
        },
        group: { get: (x: any) => x.returnValues.group },
        groupPayment: { get: (x: any) => x.returnValues.groupPayment },
        blockNumber: {},
      },
      { 'no-truncate': res.flags['no-truncate'] }
    )
  }
}

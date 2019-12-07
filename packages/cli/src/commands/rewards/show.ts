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
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const epochSize = await validators.getEpochSize()

    // Map the currently cast votes by address.
    if (res.flags.address) {
      await newCheckBuilder(this)
        .isAccount(res.flags.address)
        .runChecks()
      const voter = await election.getVoter(res.flags.address)
      voter.votes.forEach(function(x) {
        const group: string = x.group.toLowerCase()
        addressVotes[group] = (addressVotes[group] || new BigNumber(0)).plus(x.pending)
      })
      printValueMapRecursive(voter)
    }

    // voterRewards applies to address when voterReward.group in addressVotes.
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

    const validatorDetails = await validators.getUniqueValidators(validatorRewards, (x: any) =>
      x.returnValues.validator.toLowerCase()
    )
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
}

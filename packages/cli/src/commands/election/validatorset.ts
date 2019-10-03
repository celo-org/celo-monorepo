import { BaseCommand } from '../../base'

export default class ValidatorSet extends BaseCommand {
  static description = 'Outputs the current validator set'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['validatorset']

  async run() {
    const election = await this.kit.contracts.getElection()
    const validatorSet = await election.getValidatorSetAddresses()

    validatorSet.forEach((validator: string) => console.log(validator))
  }
}

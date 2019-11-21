import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ElectionRun extends BaseCommand {
  static description = 'Runs an mock election and outputs the validators that were elected'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['run']

  async run() {
    cli.action.start('Running mock election')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    cli.action.stop()
    cli.table(validatorList, {
      address: {},
      name: {},
      affiliation: {},
      score: {},
      ecdsaPublicKey: {},
      blsPublicKey: {},
    })
  }
}

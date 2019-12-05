import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { validatorTable } from '../validator/list'

export default class ElectionRun extends BaseCommand {
  static description =
    'Runs a "mock" election and prints out the validators that would be elected if the epoch ended right now.'

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
    cli.table(validatorList, validatorTable)
  }
}

import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'
import { validatorTable } from '../validator/list'

export default class ElectionCurrent extends BaseCommand {
  static description =
    'Outputs the set of validators currently participating in BFT to create blocks. An election is run to select the validator set at the end of every epoch.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  async run() {
    const res = this.parse(ElectionCurrent)
    cli.action.start('Fetching currently elected Validators')
    const election = await this.kit.contracts.getElection()
    const validators = await this.kit.contracts.getValidators()
    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    cli.action.stop()
    cli.table(validatorList, validatorTable, { 'no-truncate': !res.flags.truncate })
  }
}

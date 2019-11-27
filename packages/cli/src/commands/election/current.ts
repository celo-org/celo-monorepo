import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ElectionCurrent extends BaseCommand {
  static description =
    'Outputs the set of validators currently participating in BFT to create blocks. The validator set is re-elected at the end of every epoch.'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['current']

  async run() {
    cli.action.start('Fetching currently elected Validators')
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
      score: { get: (v) => v.score.toFixed() },
      ecdsaPublicKey: {},
      blsPublicKey: {},
    })
  }
}

import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export default class ValidatorList extends BaseCommand {
  static description =
    'List registered Validators, their name (if provided), affiliation, uptime score, and public keys used for validating.'

  static flags = {
    ...BaseCommand.flags,
    'no-truncate': flags.boolean({
      description: "Don't truncate fields to fit line",
      required: false,
    }),
  }

  static examples = ['list']

  async run() {
    const res = this.parse(ValidatorList)

    cli.action.start('Fetching Validators')
    const validators = await this.kit.contracts.getValidators()
    const validatorList = await validators.getRegisteredValidators()

    cli.action.stop()
    cli.table(
      validatorList,
      {
        address: {},
        name: {},
        affiliation: {},
        score: { get: (v) => v.score.toFixed() },
        ecdsaPublicKey: {},
        blsPublicKey: {},
      },
      { 'no-truncate': res.flags['no-truncate'] }
    )
  }
}

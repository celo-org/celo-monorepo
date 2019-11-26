import { flags } from '@oclif/command'
import { Accounts } from '@celo/contractkit/lib/wrapper'
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
    const accounts = await this.kit.contracts.getAccounts()
    const validators = await this.kit.contracts.getValidators()
    const validatorList = await validators.getRegisteredValidators()

    var names = []
    for (let i = 0; i < validatorList.length; i++) {
      names.push(accounts.getName(validatorList[i].address))
    }
    for (let i = 0; i < validatorList.length; i++) {
      const name = await names[i]
      validatorList[i].name = name ? name : ''
    }

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

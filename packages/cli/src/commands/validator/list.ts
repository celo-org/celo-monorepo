import { Validator } from '@celo/contractkit/lib/wrappers/Validators'
import { cli } from 'cli-ux'
import { BaseCommand } from '../../base'

export const validatorTable = {
  address: {},
  name: {},
  affiliation: {},
  score: { get: (v: Validator) => v.score.toFixed() },
  ecdsaPublicKey: {},
  blsPublicKey: {},
  signer: {},
}

export default class ValidatorList extends BaseCommand {
  static description =
    'List registered Validators, their name (if provided), affiliation, uptime score, and public keys used for validating.'

  static flags = {
    ...BaseCommand.flagsWithoutLocalAddresses(),
  }

  static examples = ['list']

  async run() {
    const res = this.parse(ValidatorList)

    cli.action.start('Fetching Validators')
    const validators = await this.kit.contracts.getValidators()
    const validatorList = await validators.getRegisteredValidators()

    cli.action.stop()
    cli.table(validatorList, validatorTable, { 'no-truncate': !res.flags.truncate })
  }
}
